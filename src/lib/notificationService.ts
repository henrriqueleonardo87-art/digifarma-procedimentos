import type { AppUser } from '../types/auth';
import type { Procedure } from '../types/procedure';
import type { PublicacaoItem } from './publicacoesService';
import { isUserTargeted, isUserRead, isUserAuthor } from './publicacoesService';
import { getCurrentUser } from './authService';

export interface AppNotification {
  id: string;
  type: 'publicacao' | 'comment' | 'revision' | 'rejection' | 'mural' | 'sugestao';
  title: string;
  message: string;
  author?: string;
  createdAt: string;
  targetView: string;
  targetId?: string;
  isRead: boolean;
}

const READ_NOTIFICATIONS_KEY_PREFIX = 'digifarma_read_notifications_';

export function getReadNotificationIds(username?: string | null): Set<string> {
  if (!username) return new Set();
  try {
    const raw = localStorage.getItem(`${READ_NOTIFICATIONS_KEY_PREFIX}${username.toLowerCase()}`);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {
    // fallback
  }
  return new Set();
}

export function markNotificationAsRead(id: string, username?: string | null): void {
  const current = getCurrentUser();
  const user = username || current?.username || current?.name;
  if (!user) return;
  try {
    const set = getReadNotificationIds(user);
    set.add(id);
    localStorage.setItem(
      `${READ_NOTIFICATIONS_KEY_PREFIX}${user.toLowerCase()}`,
      JSON.stringify(Array.from(set))
    );
  } catch {
    // ignore
  }
}

export function markAllNotificationsAsRead(ids?: string[], username?: string | null): void {
  const current = getCurrentUser();
  const user = username || current?.username || current?.name;
  if (!user) return;
  try {
    const set = getReadNotificationIds(user);
    if (ids && ids.length > 0) {
      ids.forEach((id) => set.add(id));
    }
    localStorage.setItem(
      `${READ_NOTIFICATIONS_KEY_PREFIX}${user.toLowerCase()}`,
      JSON.stringify(Array.from(set))
    );
  } catch {
    // ignore
  }
}

/**
 * Constrói a lista unificada de notificações relevantes para o usuário conectado
 */
export function buildUnifiedNotifications({
  currentUser,
  procedures = [],
  publicacoes = [],
  muralCards = [],
  sugestoes = [],
}: {
  currentUser?: AppUser | null;
  procedures?: Procedure[];
  publicacoes?: PublicacaoItem[];
  muralCards?: any[];
  sugestoes?: any[];
}): AppNotification[] {
  if (!currentUser) return [];

  const readIds = getReadNotificationIds(currentUser.username || currentUser.name);
  const notifications: AppNotification[] = [];

  // 1. Notificações de Publicações
  publicacoes.forEach((pub) => {
    const hasRead = isUserRead(pub.readBy, currentUser, pub.id);
    const isTarget = isUserTargeted(pub.targetUsers, currentUser);
    const isEveryone = !pub.targetUsers || pub.targetUsers.length === 0;
    const isAuthor = isUserAuthor(pub.author, currentUser);

    // Nova publicação direcionada ou geral (que o usuário não leu e não é o autor)
    if (!isAuthor && !hasRead && (isTarget || isEveryone)) {
      const notifId = `notif-pub-${pub.id}`;
      notifications.push({
        id: notifId,
        type: 'publicacao',
        title: isTarget ? '🎯 Comunicado Direcionado a Você' : '📢 Nova Publicação Geral',
        message: `${pub.author}: "${pub.title}"`,
        author: pub.author,
        createdAt: pub.createdAt,
        targetView: 'publicacoes',
        targetId: pub.id,
        isRead: readIds.has(notifId),
      });
    }

    // Comentários recebidos nas publicações do usuário
    if (isAuthor && pub.comments && pub.comments.length > 0) {
      pub.comments.forEach((c) => {
        if (!isUserAuthor(c.author, currentUser)) {
          const notifId = `notif-comm-${c.id}`;
          notifications.push({
            id: notifId,
            type: 'comment',
            title: `💬 Comentário de ${c.author}`,
            message: `Em "${pub.title}": ${c.content.slice(0, 75)}...`,
            author: c.author,
            createdAt: c.createdAt,
            targetView: 'publicacoes',
            targetId: pub.id,
            isRead: readIds.has(notifId),
          });
        }
      });
    }
  });

  // 2. Procedimentos Pendentes de Revisão
  procedures.forEach((proc) => {
    if (proc.status === 'pendente' && proc.isActive !== false) {
      const notifId = `notif-rev-${proc.id}-${proc.updated_at || proc.created_at || ''}`;
      notifications.push({
        id: notifId,
        type: 'revision',
        title: '⏳ Procedimento em Homologação',
        message: `"${proc.title}" aguarda revisão técnica.`,
        author: proc.author || 'Equipe',
        createdAt: proc.updated_at || new Date().toISOString(),
        targetView: 'revision',
        targetId: proc.id,
        isRead: readIds.has(notifId),
      });
    }

    // Procedimentos Rejeitados / Com Ajustes Solicitados (Recado)
    if (
      proc.status === 'ajustes_solicitados' &&
      isUserAuthor(proc.author, currentUser)
    ) {
      const notifId = `notif-adj-${proc.id}-${proc.reviewedAt || proc.updated_at || ''}`;
      notifications.push({
        id: notifId,
        type: 'rejection',
        title: '⚠️ Ajustes Solicitados no Procedimento',
        message: `${proc.reviewedBy || 'Revisor'}: "${proc.rejectionReason || 'Favor revisar os passos apontados.'}"`,
        author: proc.reviewedBy || 'Controle de Qualidade',
        createdAt: proc.reviewedAt || proc.updated_at || new Date().toISOString(),
        targetView: 'procedure-detail',
        targetId: proc.id,
        isRead: readIds.has(notifId),
      });
    }
  });

  // 3. Atividades do Mural Kanban
  if (Array.isArray(muralCards)) {
    muralCards.forEach((card) => {
      const currentUName = currentUser.username?.toLowerCase();
      const currentFName = currentUser.name?.toLowerCase();
      const isCardShared =
        (Array.isArray(card.sharedWith) &&
          card.sharedWith.some(
            (u: string) =>
              (currentUName && u.toLowerCase() === currentUName) ||
              (currentFName && u.toLowerCase() === currentFName)
          )) ||
        (card.assignee &&
          (card.assignee.toLowerCase() === currentUName ||
            card.assignee.toLowerCase() === currentFName));

      const isAuthor = isUserAuthor(card.author, currentUser);

      if (isCardShared && !isAuthor && card.columnId !== 'col-done' && card.status !== 'done') {
        const notifId = `notif-card-${card.id}`;
        notifications.push({
          id: notifId,
          type: 'mural',
          title: '📌 Cartão Compartilhado no Mural',
          message: `${card.author || 'Membro'}: "${card.title}"`,
          author: card.author,
          createdAt: card.createdAt || new Date().toISOString(),
          targetView: 'mural',
          targetId: card.id,
          isRead: readIds.has(notifId),
        });
      }
    });
  }

  // 4. Sugestões de Melhorias
  if (Array.isArray(sugestoes)) {
    const isLeonardo =
      currentUser.username?.toLowerCase() === 'leonardo' ||
      currentUser.name?.toLowerCase().includes('leonardo');

    sugestoes.forEach((sug) => {
      // Leonardo é avisado de novas sugestões pendentes
      if (isLeonardo && sug.status === 'enviada') {
        const notifId = `notif-sug-leo-${sug.id}`;
        notifications.push({
          id: notifId,
          type: 'sugestao',
          title: '💡 Nova Sugestão de Melhoria',
          message: `${sug.author}: "${sug.title}"`,
          author: sug.author,
          createdAt: sug.createdAt,
          targetView: 'utilitarios',
          targetId: sug.id,
          isRead: readIds.has(notifId),
        });
      }

      // Autor da sugestão é avisado quando o status muda
      if (isUserAuthor(sug.author, currentUser) && sug.status !== 'enviada') {
        const notifId = `notif-sug-status-${sug.id}-${sug.status}`;
        notifications.push({
          id: notifId,
          type: 'sugestao',
          title: `💡 Atualização em sua Sugestão`,
          message: `"${sug.title}" agora está com status: ${sug.status.toUpperCase()}`,
          createdAt: sug.updated_at || sug.createdAt,
          targetView: 'utilitarios',
          targetId: sug.id,
          isRead: readIds.has(notifId),
        });
      }
    });
  }

  // Retorna apenas notificações NÃO lidas (removendo sumariamente as já acessadas/lidas)
  // e ordena por data decrescente (mais recente primeiro)
  return notifications
    .filter((n) => !n.isRead && !readIds.has(n.id))
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}
