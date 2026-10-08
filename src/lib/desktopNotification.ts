import { playNotificationSound } from './notificationSound';
import type { AppUser } from '../types/auth';
import type { Procedure } from '../types/procedure';
import type { PublicacaoItem } from './publicacoesService';
import { isUserAuthor, isUserTargeted, isUserRead } from './publicacoesService';
import type { MuralCard } from './muralService';

const SESSION_STORAGE_KEY = 'digifarma_emitted_desktop_notifs';

// Conjunto em memória de IDs de notificações que já foram exibidas nesta sessão
const emittedIds = new Set<string>();
let isSnapshotInitialized = false;

// Inicializa o conjunto a partir do sessionStorage (para não duplicar em recarregamentos)
try {
  const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (saved) {
    const arr = JSON.parse(saved);
    if (Array.isArray(arr)) {
      arr.forEach((id) => emittedIds.add(id));
    }
  }
} catch {
  // ignore
}

function persistEmittedIds(): void {
  try {
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify(Array.from(emittedIds).slice(-200)) // Mantém os últimos 200 IDs
    );
  } catch {
    // ignore
  }
}

/**
 * Verifica se a API de Notificações do Navegador / Windows é suportada
 */
export function isDesktopNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Retorna o status atual da permissão de notificação no Windows
 */
export function getDesktopNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isDesktopNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Solicita autorização ao usuário para exibir notificações nativas no Windows
 */
export async function requestDesktopNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isDesktopNotificationSupported()) return 'unsupported';

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Erro ao solicitar permissão de notificação no Windows:', err);
    return Notification.permission;
  }
}

/**
 * Registra o snapshot inicial de notificações existentes para evitar spam ao carregar a página
 */
export function initDesktopNotificationsSnapshot(existingIds: string[]): void {
  if (isSnapshotInitialized) return;
  existingIds.forEach((id) => emittedIds.add(id));
  persistEmittedIds();
  isSnapshotInitialized = true;
}

export interface ShowDesktopNotificationOptions {
  id: string;
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  onClick?: () => void;
  playSound?: boolean;
}

/**
 * Dispara uma notificação nativa no Windows (Central de Ações / Toast no canto inferior direito)
 */
export function showDesktopNotification({
  id,
  title,
  body,
  icon = '/favicon.svg',
  tag,
  onClick,
  playSound = true,
}: ShowDesktopNotificationOptions): boolean {
  if (!isDesktopNotificationSupported()) return false;

  // Evita disparos duplicados do mesmo evento
  if (emittedIds.has(id)) {
    return false;
  }

  // Registra que este evento já foi notificado
  emittedIds.add(id);
  persistEmittedIds();

  // Executa o som agradável de notificação
  if (playSound) {
    playNotificationSound();
  }

  // Se a permissão estiver concedida, cria o toast nativo do Windows
  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        body,
        icon,
        badge: icon,
        tag: tag || id,
        silent: false, // Permite o som padrão do sistema operacional caso configurado
      });

      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        if (onClick) {
          onClick();
        }
        notification.close();
      };

      // Fecha automaticamente após 8 segundos se não houver interação
      setTimeout(() => {
        try {
          notification.close();
        } catch {
          // ignore
        }
      }, 8000);

      return true;
    } catch (err) {
      console.warn('Erro ao disparar notificação nativa no Windows:', err);
      return false;
    }
  }

  return false;
}

/**
 * 1. Notificação Windows: Nova Publicação Lançada
 */
export function checkAndNotifyPublicacao({
  pub,
  currentUser,
  onClick,
}: {
  pub: PublicacaoItem;
  currentUser?: AppUser | null;
  onClick?: () => void;
}): boolean {
  if (!currentUser) return false;

  const isAuthor = isUserAuthor(pub.author, currentUser);
  const hasRead = isUserRead(pub.readBy, currentUser, pub.id);
  const isTarget = isUserTargeted(pub.targetUsers, currentUser);
  const isEveryone = !pub.targetUsers || pub.targetUsers.length === 0;

  // Só notifica se não for o autor, não tiver lido e for para todos ou para o usuário
  if (!isAuthor && !hasRead && (isTarget || isEveryone)) {
    const notifId = `desktop-pub-${pub.id}`;
    const title = isTarget
      ? '🎯 Digifarma - Comunicado Direcionado'
      : '📢 Digifarma - Nova Publicação';
    const body = `${pub.author}: "${pub.title}"`;

    return showDesktopNotification({
      id: notifId,
      title,
      body,
      tag: `pub-${pub.id}`,
      onClick,
    });
  }

  return false;
}

/**
 * 2. Notificação Windows: Novo Procedimento para Revisar (Homologação)
 */
export function checkAndNotifyProcedureReview({
  proc,
  currentUser,
  onClick,
}: {
  proc: Procedure;
  currentUser?: AppUser | null;
  onClick?: () => void;
}): boolean {
  if (!currentUser) return false;

  // Procedimento pendente de revisão técnica
  if (proc.status === 'pendente' && proc.isActive !== false) {
    const notifId = `desktop-proc-rev-${proc.id}`;
    const title = '⏳ Digifarma - Procedimento para Revisar';
    const body = `"${proc.title}" foi enviado para homologação por ${proc.author || 'Equipe'}.`;

    return showDesktopNotification({
      id: notifId,
      title,
      body,
      tag: `rev-${proc.id}`,
      onClick,
    });
  }

  return false;
}

/**
 * 3. Notificação Windows: Cartão Compartilhado Comigo no Mural
 */
export function checkAndNotifyMuralCardShared({
  card,
  currentUser,
  onClick,
}: {
  card: MuralCard;
  currentUser?: AppUser | null;
  onClick?: () => void;
}): boolean {
  if (!currentUser) return false;

  const currentUName = currentUser.username?.toLowerCase();
  const currentFName = currentUser.name?.toLowerCase();

  const isSharedWithMe =
    (Array.isArray(card.sharedWith) &&
      card.sharedWith.some(
        (u) =>
          (currentUName && u.toLowerCase() === currentUName) ||
          (currentFName && u.toLowerCase() === currentFName)
      )) ||
    (card.assignee &&
      (card.assignee.toLowerCase() === currentUName ||
        card.assignee.toLowerCase() === currentFName));

  const isAuthor = isUserAuthor(card.author, currentUser);

  // Notifica quando o cartão for compartilhado com o usuário conectado (e não for de sua própria autoria)
  if (isSharedWithMe && !isAuthor && card.columnId !== 'col-done' && card.status !== 'done') {
    const notifId = `desktop-card-${card.id}`;
    const title = '📌 Digifarma - Cartão Compartilhado no Mural';
    const body = `${card.author || 'Um colega'} compartilhou "${card.title}" com você.`;

    return showDesktopNotification({
      id: notifId,
      title,
      body,
      tag: `card-${card.id}`,
      onClick,
    });
  }

  return false;
}

/**
 * Dispara uma notificação de teste para que o usuário comprove o funcionamento no Windows
 */
export async function sendTestDesktopNotification(): Promise<boolean> {
  const perm = await requestDesktopNotificationPermission();
  if (perm !== 'granted') {
    return false;
  }

  return showDesktopNotification({
    id: `test-${Date.now()}`,
    title: '🔔 Digifarma - Notificações do Windows Ativas',
    body: 'As notificações nativas do Windows estão configuradas com sucesso! Você será avisado de publicações, revisões e cartões.',
    onClick: () => {
      window.focus();
    },
    playSound: true,
  });
}
