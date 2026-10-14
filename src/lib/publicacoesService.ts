import { getSupabase } from './supabase';
import { DEFAULT_USERS } from './authService';

export interface PublicacaoComment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface PublicacaoAttachment {
  name: string;
  type: 'image' | 'pdf';
  url: string; // Data URL Base64 ou URL remota
  size?: number;
}

export interface PublicacaoItem {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  targetUsers: string[]; // [] = todos, ou ['Leonardo', 'Icaro', ...]
  readBy?: string[]; // Lista de nomes/usuários que já confirmaram "Visto"
  attachment?: PublicacaoAttachment | null;
  comments: PublicacaoComment[];
}

export const STORAGE_KEY_PUBLICACOES = 'digifarma_publicacoes_feed_list';

// Publicações iniciais (vazio para ambiente de produção oficial)
export const INITIAL_PUBLICACOES: PublicacaoItem[] = [];

/**
 * Normaliza um registro vindo do Supabase ou localStorage
 */
function normalizePublicacao(raw: any): PublicacaoItem {
  let targetUsers: string[] = [];
  if (Array.isArray(raw.targetUsers)) {
    targetUsers = raw.targetUsers;
  } else if (Array.isArray(raw.targetusers)) {
    targetUsers = raw.targetusers;
  } else if (typeof raw.targetUsers === 'string') {
    try {
      targetUsers = JSON.parse(raw.targetUsers);
    } catch {
      targetUsers = [];
    }
  }

  let readBy: string[] = [];
  if (Array.isArray(raw.readBy)) {
    readBy = raw.readBy;
  } else if (Array.isArray(raw.readby)) {
    readBy = raw.readby;
  } else if (typeof raw.readBy === 'string') {
    try {
      readBy = JSON.parse(raw.readBy);
    } catch {
      readBy = [];
    }
  }

  let comments: PublicacaoComment[] = [];
  if (Array.isArray(raw.comments)) {
    comments = raw.comments;
  } else if (typeof raw.comments === 'string') {
    try {
      comments = JSON.parse(raw.comments);
    } catch {
      comments = [];
    }
  }

  let attachment: PublicacaoAttachment | null = null;
  if (raw.attachment) {
    if (typeof raw.attachment === 'object') {
      attachment = raw.attachment;
    } else if (typeof raw.attachment === 'string') {
      try {
        attachment = JSON.parse(raw.attachment);
      } catch {
        attachment = null;
      }
    }
  }

  return {
    id: String(raw.id || `pub-${Date.now()}`),
    title: String(raw.title || ''),
    content: String(raw.content || ''),
    author: String(raw.author || 'Equipe Digifarma'),
    createdAt: String(raw.createdAt || raw.created_at || new Date().toISOString()),
    targetUsers: Array.isArray(targetUsers) ? targetUsers : [],
    readBy: Array.isArray(readBy) ? readBy : [],
    attachment,
    comments: Array.isArray(comments) ? comments : [],
  };
}

/**
 * Verifica de forma insensível se o usuário é destinatário do aviso
 */
export function isUserTargeted(
  targetUsers: string[] | undefined | null,
  user: { name?: string | null; username?: string | null } | string | null | undefined
): boolean {
  if (!targetUsers || targetUsers.length === 0 || !user) return false;

  const identifiers: string[] = [];
  if (typeof user === 'string') {
    if (user.trim()) identifiers.push(user.trim().toLowerCase());
  } else {
    if (user.username && user.username.trim()) {
      identifiers.push(user.username.trim().toLowerCase());
    }
    if (user.name && user.name.trim()) {
      identifiers.push(user.name.trim().toLowerCase());
    }
  }

  if (identifiers.length === 0) return false;

  return targetUsers.some((target) => {
    const t = target.trim().toLowerCase();
    return identifiers.some((ident) => ident === t || ident.includes(t) || t.includes(ident));
  });
}

const STORAGE_KEY_USER_READS = 'digifarma_user_read_publications_map';

function getUserReadStorageKey(user: any): string {
  if (!user) return '';
  if (typeof user === 'string') return user.trim().toLowerCase();
  return (user.username || user.name || '').trim().toLowerCase();
}

export function getLocalUserReadIds(user: any): Set<string> {
  const userKey = getUserReadStorageKey(user);
  if (!userKey) return new Set();
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_USER_READS}_${userKey}`);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (err) {
    console.warn('Erro ao ler leituras locais:', err);
  }
  return new Set();
}

export function markLocalUserReadId(pubId: string, user: any): void {
  const userKey = getUserReadStorageKey(user);
  if (!userKey || !pubId) return;
  try {
    const currentSet = getLocalUserReadIds(user);
    currentSet.add(pubId);
    localStorage.setItem(
      `${STORAGE_KEY_USER_READS}_${userKey}`,
      JSON.stringify(Array.from(currentSet))
    );
  } catch (err) {
    console.warn('Erro ao salvar leitura local:', err);
  }
}

/**
 * Verifica se o usuário já confirmou leitura (Visto)
 */
export function isUserRead(
  readBy: string[] | undefined | null,
  user: { name?: string | null; username?: string | null } | string | null | undefined,
  pubId?: string
): boolean {
  if (!user) return false;

  // 1. Se pubId foi informado, verificar no armazenamento persistente local do usuário
  if (pubId) {
    const localReads = getLocalUserReadIds(user);
    if (localReads.has(pubId)) return true;
  }

  // 2. Verificar na lista readBy do registro
  if (readBy && readBy.length > 0) {
    const identifiers: string[] = [];
    if (typeof user === 'string') {
      if (user.trim()) identifiers.push(user.trim().toLowerCase());
    } else {
      if (user.username && user.username.trim()) {
        identifiers.push(user.username.trim().toLowerCase());
      }
      if (user.name && user.name.trim()) {
        identifiers.push(user.name.trim().toLowerCase());
      }
    }

    if (identifiers.length > 0) {
      const hasInReadBy = readBy.some((reader) => {
        const r = reader.trim().toLowerCase();
        return identifiers.some((ident) => ident === r || ident.includes(r) || r.includes(ident));
      });

      if (hasInReadBy) {
        if (pubId) markLocalUserReadId(pubId, user);
        return true;
      }
    }
  }

  return false;
}

/**
 * Verifica de forma insensível se o usuário é o autor
 */
export function isUserAuthor(
  author: string | undefined | null,
  user: { name?: string | null; username?: string | null } | string | null | undefined
): boolean {
  if (!author || !user) return false;
  const a = author.trim().toLowerCase();

  if (typeof user === 'string') {
    return a === user.trim().toLowerCase();
  }

  const uName = user.username?.trim().toLowerCase();
  const fName = user.name?.trim().toLowerCase();

  return a === uName || a === fName;
}

/**
 * Ordena lista de publicações da mais recente para a mais antiga (decrescente por data/hora)
 */
export function sortPublicacoesDesc(items: PublicacaoItem[]): PublicacaoItem[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Carrega a lista do LocalStorage (fallback síncrono e cache offline)
 */
export function getCachedPublicacoes(): PublicacaoItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PUBLICACOES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return sortPublicacoesDesc(parsed.map(normalizePublicacao));
      }
    }
  } catch (err) {
    console.warn('Erro ao ler publicações do localStorage:', err);
  }
  return [];
}

/**
 * Salva no LocalStorage
 */
export function setCachedPublicacoes(items: PublicacaoItem[]): void {
  try {
    const sorted = sortPublicacoesDesc(items);
    localStorage.setItem(STORAGE_KEY_PUBLICACOES, JSON.stringify(sorted));
  } catch (err) {
    console.warn('Erro ao gravar publicações no localStorage:', err);
  }
}

/**
 * Busca todas as publicações no Supabase com sincronização para o LocalStorage
 */
export async function fetchPublicacoes(): Promise<PublicacaoItem[]> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('publicacoes')
        .select('*')
        .order('createdAt', { ascending: false });

      if (!error && Array.isArray(data)) {
        const normalized = data.map(normalizePublicacao);
        const sortedNorm = sortPublicacoesDesc(normalized);
        setCachedPublicacoes(sortedNorm);
        return sortedNorm;
      }
      if (error) {
        console.warn('Erro ao consultar Supabase publicacoes:', error.message);
      }
    } catch (err) {
      console.warn('Falha na requisição ao Supabase para publicações:', err);
    }
  }

  return sortPublicacoesDesc(getCachedPublicacoes());
}

/**
 * Cria uma nova publicação e sincroniza no Supabase + LocalStorage
 */
export async function createPublicacao(item: PublicacaoItem): Promise<boolean> {
  const current = getCachedPublicacoes();
  const updated = [item, ...current.filter((p) => p.id !== item.id)];
  setCachedPublicacoes(updated);

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from('publicacoes').upsert({
        id: item.id,
        title: item.title,
        content: item.content,
        author: item.author,
        targetUsers: item.targetUsers,
        readBy: item.readBy || [item.author],
        attachment: item.attachment || null,
        comments: item.comments,
        createdAt: item.createdAt,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Erro ao salvar publicação no Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Falha de rede ao criar publicação no Supabase:', err);
      return false;
    }
  }

  return true;
}

/**
 * Confirma leitura / visto de uma publicação por um usuário
 */
export async function markPublicacaoAsRead(
  pubId: string,
  userDisplayName: string,
  userObj?: any
): Promise<boolean> {
  // 1. Marcar de forma definitiva no armazenamento do usuário
  markLocalUserReadId(pubId, userDisplayName);
  if (userObj) {
    markLocalUserReadId(pubId, userObj);
  }

  const current = getCachedPublicacoes();
  const targetPub = current.find((p) => p.id === pubId);
  if (!targetPub) return false;

  const existingReadBy = targetPub.readBy || [];
  const updatedReadBy = existingReadBy.includes(userDisplayName)
    ? existingReadBy
    : [...existingReadBy, userDisplayName];

  const updatedPub: PublicacaoItem = { ...targetPub, readBy: updatedReadBy };
  const updatedPubs = current.some((p) => p.id === pubId)
    ? current.map((p) => (p.id === pubId ? updatedPub : p))
    : [updatedPub, ...current];

  setCachedPublicacoes(updatedPubs);

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('publicacoes')
        .upsert({
          id: targetPub.id,
          title: targetPub.title,
          content: targetPub.content,
          author: targetPub.author,
          targetUsers: targetPub.targetUsers,
          readBy: updatedReadBy,
          attachment: targetPub.attachment || null,
          comments: targetPub.comments,
          createdAt: targetPub.createdAt,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Erro ao registrar visto no Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Falha de rede ao marcar como visto:', err);
      return false;
    }
  }

  return true;
}

/**
 * Atualiza os comentários de uma publicação
 */
export async function updatePublicacaoComments(
  pubId: string,
  comments: PublicacaoComment[]
): Promise<boolean> {
  const current = getCachedPublicacoes();
  const updated = current.map((p) => (p.id === pubId ? { ...p, comments } : p));
  setCachedPublicacoes(updated);

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('publicacoes')
        .update({
          comments,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pubId);

      if (error) {
        console.error('Erro ao atualizar comentários no Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Falha ao atualizar comentários:', err);
      return false;
    }
  }

  return true;
}

/**
 * Exclui uma publicação
 */
export async function deletePublicacao(pubId: string): Promise<boolean> {
  const current = getCachedPublicacoes();
  const updated = current.filter((p) => p.id !== pubId);
  setCachedPublicacoes(updated);

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from('publicacoes').delete().eq('id', pubId);
      if (error) {
        console.error('Erro ao excluir publicação no Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Falha ao excluir publicação no Supabase:', err);
      return false;
    }
  }

  return true;
}

/**
 * Carrega a lista dinâmica de membros da equipe (para seleção de destinatários)
 */
export async function fetchTeamMembers(): Promise<Array<{ username: string; name: string }>> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('username, name')
        .order('name', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((u) => ({
          username: u.username || u.name,
          name: u.name || u.username,
        }));
      }
    } catch (err) {
      console.warn('Erro ao buscar usuários para membros da equipe:', err);
    }
  }

  return DEFAULT_USERS.map((u) => ({
    username: u.username,
    name: u.name,
  }));
}

/**
 * Assina atualizações em tempo real (Supabase Realtime) com fallback de polling a cada 10 segundos
 */
export function subscribeToPublicacoes(
  onData: (items: PublicacaoItem[]) => void
): () => void {
  let isSubscribed = true;

  // Realizar primeira busca imediatamente
  fetchPublicacoes().then((data) => {
    if (isSubscribed) onData(data);
  });

  const supabase = getSupabase();
  let channel: any = null;

  if (supabase) {
    try {
      channel = supabase
        .channel(`publicacoes_changes_${Date.now()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'publicacoes' },
          async () => {
            if (!isSubscribed) return;
            const updated = await fetchPublicacoes();
            if (isSubscribed) onData(updated);
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Erro ao conectar Supabase Realtime channel:', err);
    }
  }

  // Polling fallback a cada 10 segundos para garantir sincronização entre diferentes abas/máquinas
  const intervalId = setInterval(async () => {
    if (!isSubscribed) return;
    const updated = await fetchPublicacoes();
    if (isSubscribed) onData(updated);
  }, 10000);

  return () => {
    isSubscribed = false;
    clearInterval(intervalId);
    if (channel && supabase) {
      try {
        supabase.removeChannel(channel);
      } catch {
        // cleanup ignore
      }
    }
  };
}
