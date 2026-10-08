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

export const INITIAL_PUBLICACOES: PublicacaoItem[] = [
  {
    id: 'pub-initial-1',
    title: 'Atualização nas Regras de Validação de NF-e 4.0',
    content:
      'Atenção equipe de implantação: os clientes do regime Simples Nacional agora exigem o preenchimento obrigatório do código de benefício fiscal em itens desonerados. Procedimento documentado.',
    author: 'Leonardo',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    targetUsers: [], // Todos
    readBy: ['Leonardo'],
    attachment: null,
    comments: [
      {
        id: 'c-1',
        author: 'Icaro',
        content: 'Perfeito, já estou repassando aos operadores da Drogaria Santa Luzia.',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ],
  },
  {
    id: 'pub-initial-2',
    title: 'Revisão Técnica Pendente do POP de Fechamento Cego',
    content:
      'Favor validar os parâmetros de sangria e conferência de lote antes da reunião de homologação com a gerência amanhã.',
    author: 'Wallace',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    targetUsers: ['Leonardo', 'Whitalo'],
    readBy: ['Wallace'],
    attachment: null,
    comments: [],
  },
];

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

/**
 * Verifica se o usuário já confirmou leitura (Visto)
 */
export function isUserRead(
  readBy: string[] | undefined | null,
  user: { name?: string | null; username?: string | null } | string | null | undefined
): boolean {
  if (!readBy || readBy.length === 0 || !user) return false;

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

  return readBy.some((reader) => {
    const r = reader.trim().toLowerCase();
    return identifiers.some((ident) => ident === r || ident.includes(r) || r.includes(ident));
  });
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
 * Carrega a lista do LocalStorage (fallback síncrono e cache offline)
 */
export function getCachedPublicacoes(): PublicacaoItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PUBLICACOES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizePublicacao);
      }
    }
  } catch (err) {
    console.warn('Erro ao ler publicações do localStorage:', err);
  }
  return INITIAL_PUBLICACOES;
}

/**
 * Salva no LocalStorage
 */
export function setCachedPublicacoes(items: PublicacaoItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PUBLICACOES, JSON.stringify(items));
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
        setCachedPublicacoes(normalized);
        return normalized;
      }
      if (error) {
        console.warn('Erro ao consultar Supabase publicacoes:', error.message);
      }
    } catch (err) {
      console.warn('Falha na requisição ao Supabase para publicações:', err);
    }
  }

  return getCachedPublicacoes();
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
  userDisplayName: string
): Promise<boolean> {
  const current = getCachedPublicacoes();
  const targetPub = current.find((p) => p.id === pubId);
  if (!targetPub) return false;

  const existingReadBy = targetPub.readBy || [];
  if (existingReadBy.includes(userDisplayName)) return true;

  const updatedReadBy = [...existingReadBy, userDisplayName];
  const updatedPubs = current.map((p) =>
    p.id === pubId ? { ...p, readBy: updatedReadBy } : p
  );
  setCachedPublicacoes(updatedPubs);

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('publicacoes')
        .update({
          readBy: updatedReadBy,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pubId);

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
