import { getSupabase } from './supabase';

export interface MuralMarker {
  id: string;
  label: string;
  color: string;
}

export interface MuralComment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface MuralCard {
  id: string;
  columnId: string;
  title: string;
  description: string;
  author: string;
  createdAt: string;
  sharedWith: string[]; // Ex: ['Leonardo', 'Icaro', ...]
  markers: MuralMarker[];
  comments: MuralComment[];
  status?: string;
  assignee?: string;
  attachment?: {
    name: string;
    url: string;
    type: 'image' | 'pdf' | 'html' | 'file';
    size?: number;
  } | null;
}

export interface MuralColumn {
  id: string;
  title: string;
  color?: string;
}

export const STORAGE_KEY_COLUMNS = 'digifarma_mural_columns_v2';
export const STORAGE_KEY_CARDS = 'digifarma_mural_cards_v2';
export const STORAGE_KEY_CUSTOM_MARKERS = 'digifarma_mural_custom_markers';

export const DEFAULT_COLUMNS: MuralColumn[] = [
  { id: 'col-todo', title: 'A Fazer', color: '#64748b' },
  { id: 'col-doing', title: 'Em Andamento', color: '#3b82f6' },
  { id: 'col-done', title: 'Concluído', color: '#10b981' },
];

export const DEFAULT_MARKERS: MuralMarker[] = [
  { id: 'm-urgent', label: 'Urgente', color: '#ef4444' },
  { id: 'm-important', label: 'Importante', color: '#f59e0b' },
  { id: 'm-homolog', label: 'Homologação', color: '#8b5cf6' },
  { id: 'm-v10', label: 'V10', color: '#3b82f6' },
  { id: 'm-classic', label: 'Clássico', color: '#06b6d4' },
  { id: 'm-valid', label: 'Validado', color: '#10b981' },
  { id: 'm-fiscal', label: 'Fiscal', color: '#ec4899' },
  { id: 'm-train', label: 'Treinamento', color: '#14b8a6' },
];

/**
 * Compara dois nomes de usuário de forma insensível a maiúsculas/minúsculas e espaços
 */
export function matchesUser(
  target?: string | null,
  user?: { name?: string | null; username?: string | null } | string | null
): boolean {
  if (!target || !user) return false;
  const t = target.trim().toLowerCase();
  if (typeof user === 'string') {
    return t === user.trim().toLowerCase();
  }
  const uName = (user.name || '').trim().toLowerCase();
  const uUser = (user.username || '').trim().toLowerCase();
  return (uName !== '' && t === uName) || (uUser !== '' && t === uUser);
}

/**
 * Regra de Privacidade do Kanban:
 * O cartão é individual por padrão e SÓ é visível para quem:
 * 1. É o autor do cartão (card.author)
 * 2. Está na lista de membros compartilhados (card.sharedWith)
 * 3. É o responsável atribuído (card.assignee)
 */
export function isCardVisibleToUser(
  card: MuralCard,
  user?: { name?: string | null; username?: string | null } | null
): boolean {
  if (!user) return false;
  // 1. Autor
  if (matchesUser(card.author, user)) return true;
  // 2. Compartilhado explicitamente
  if (Array.isArray(card.sharedWith) && card.sharedWith.some((m) => matchesUser(m, user))) {
    return true;
  }
  // 3. Atribuído como responsável
  if (matchesUser(card.assignee, user)) return true;

  return false;
}

export const INITIAL_CARDS: MuralCard[] = [
  {
    id: 'card-1',
    columnId: 'col-todo',
    title: 'Parametrizar leitor serial de código de barras 2D',
    description: 'Configurar a leitura correta do DataMatrix do SNGPC nos caixas da Drogaria Central.',
    author: 'Leonardo',
    createdAt: new Date().toISOString(),
    sharedWith: ['Icaro', 'Wallace'],
    markers: [{ id: 'm-1', label: 'Urgente', color: '#ef4444' }],
    comments: [
      {
        id: 'c-1',
        author: 'Icaro',
        content: 'Já baixei os drivers da Honeywell para testar na máquina de testes.',
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'card-2',
    columnId: 'col-doing',
    title: 'Treinamento de Fechamento de Caixa Cego',
    description: 'Capacitar as novas operadoras no fluxo de sangria e relatório de conferência cega.',
    author: 'Wallace',
    createdAt: new Date().toISOString(),
    sharedWith: ['Leonardo'],
    markers: [{ id: 'm-2', label: 'V10', color: '#3b82f6' }],
    comments: [],
  },
  {
    id: 'card-3',
    columnId: 'col-done',
    title: 'Mapeamento de rotas de entrega no módulo de Delivery',
    description: 'Bairros e taxas de frete padronizados para o aplicativo de pedidos.',
    author: 'Whitalo',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    sharedWith: ['Leonardo', 'Wallace'],
    markers: [{ id: 'm-3', label: 'Validado', color: '#10b981' }],
    comments: [],
  },
];

/**
 * Normaliza cartão vindo do Supabase ou localStorage
 */
function normalizeCard(raw: any): MuralCard {
  let sharedWith: string[] = [];
  if (Array.isArray(raw.sharedWith)) {
    sharedWith = raw.sharedWith;
  } else if (Array.isArray(raw.sharedwith)) {
    sharedWith = raw.sharedwith;
  } else if (typeof raw.sharedWith === 'string') {
    try {
      sharedWith = JSON.parse(raw.sharedWith);
    } catch {
      sharedWith = [raw.sharedWith];
    }
  }

  let markers: MuralMarker[] = [];
  if (Array.isArray(raw.markers)) {
    markers = raw.markers;
  } else if (typeof raw.markers === 'string') {
    try {
      markers = JSON.parse(raw.markers);
    } catch {
      markers = [];
    }
  }

  let comments: MuralComment[] = [];
  if (Array.isArray(raw.comments)) {
    comments = raw.comments;
  } else if (typeof raw.comments === 'string') {
    try {
      comments = JSON.parse(raw.comments);
    } catch {
      comments = [];
    }
  }

  return {
    id: String(raw.id),
    columnId: raw.columnId || raw.columnid || 'col-todo',
    title: raw.title || 'Sem título',
    description: raw.description || '',
    author: raw.author || 'Equipe',
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    sharedWith,
    markers,
    comments,
    status: raw.columnId === 'col-done' || raw.status === 'done' ? 'done' : 'todo',
    assignee: raw.assignee || sharedWith[0] || undefined,
    attachment: raw.attachment || null,
  };
}

export function getCachedMuralCards(): MuralCard[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CARDS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeCard);
      }
    }
  } catch {
    // fallback
  }
  return [];
}

export function setCachedMuralCards(cards: MuralCard[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(cards));
    window.dispatchEvent(new CustomEvent('mural-cards-updated', { detail: cards }));
  } catch (err) {
    console.warn('Erro ao salvar mural cards no cache local:', err);
  }
}

/**
 * Busca todos os cartões do Mural (Supabase com fallback de localStorage)
 */
export async function fetchMuralCards(): Promise<MuralCard[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('mural_cards')
        .select('*')
        .order('createdAt', { ascending: false });

      if (!error && Array.isArray(data)) {
        const normalized = data.map(normalizeCard);
        setCachedMuralCards(normalized);
        return normalized;
      }
    } catch (err) {
      console.warn('Falha ao buscar mural_cards do Supabase:', err);
    }
  }

  return getCachedMuralCards();
}

/**
 * Salva a lista completa de cartões no localStorage e no Supabase
 */
export async function saveAllMuralCards(cards: MuralCard[]): Promise<void> {
  setCachedMuralCards(cards);

  const supabase = getSupabase();
  if (supabase) {
    try {
      const payloads = cards.map((c) => ({
        id: c.id,
        columnId: c.columnId,
        title: c.title,
        description: c.description || '',
        author: c.author,
        sharedWith: c.sharedWith || [],
        markers: c.markers || [],
        comments: c.comments || [],
        assignee: c.assignee || null,
        attachment: c.attachment || null,
        createdAt: c.createdAt,
        updated_at: new Date().toISOString(),
      }));

      await supabase.from('mural_cards').upsert(payloads);
    } catch (err) {
      console.warn('Erro ao sincronizar cartões com o Supabase:', err);
    }
  }
}

/**
 * Salva um cartão individual no Mural
 */
export async function saveMuralCard(card: MuralCard): Promise<void> {
  const current = getCachedMuralCards();
  const existingIdx = current.findIndex((c) => c.id === card.id);
  let updated: MuralCard[];

  if (existingIdx >= 0) {
    updated = current.map((c) => (c.id === card.id ? card : c));
  } else {
    updated = [card, ...current];
  }

  await saveAllMuralCards(updated);
}

/**
 * Exclui um cartão do Mural
 */
export async function deleteMuralCard(cardId: string): Promise<void> {
  const current = getCachedMuralCards();
  const filtered = current.filter((c) => c.id !== cardId);
  setCachedMuralCards(filtered);

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('mural_cards').delete().eq('id', cardId);
    } catch (err) {
      console.warn('Erro ao deletar cartão no Supabase:', err);
    }
  }
}

/**
 * Assina atualizações de cartões do Mural em tempo real
 */
export function subscribeToMuralCards(onData: (cards: MuralCard[]) => void): () => void {
  let isSubscribed = true;

  // Carrega imediatamente
  fetchMuralCards().then((data) => {
    if (isSubscribed) onData(data);
  });

  // Evento local entre abas e componentes
  const handleLocalUpdate = (e: Event) => {
    if (!isSubscribed) return;
    const custom = e as CustomEvent<MuralCard[]>;
    if (custom.detail) {
      onData(custom.detail);
    } else {
      onData(getCachedMuralCards());
    }
  };

  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY_CARDS && isSubscribed) {
      onData(getCachedMuralCards());
    }
  };

  window.addEventListener('mural-cards-updated', handleLocalUpdate);
  window.addEventListener('storage', handleStorageChange);

  // Supabase Realtime
  const supabase = getSupabase();
  let channel: any = null;

  if (supabase) {
    try {
      channel = supabase
        .channel(`mural_cards_changes_${Date.now()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'mural_cards' },
          async () => {
            if (!isSubscribed) return;
            const updated = await fetchMuralCards();
            if (isSubscribed) onData(updated);
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Erro ao conectar Supabase Realtime para mural_cards:', err);
    }
  }

  // Polling a cada 10 segundos
  const intervalId = setInterval(async () => {
    if (!isSubscribed) return;
    const updated = await fetchMuralCards();
    if (isSubscribed) onData(updated);
  }, 10000);

  return () => {
    isSubscribed = false;
    window.removeEventListener('mural-cards-updated', handleLocalUpdate);
    window.removeEventListener('storage', handleStorageChange);
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

/* =========================================================================
 * 2. COLUNAS DO MURAL (Supabase mural_columns + Realtime + Cache Local)
 * ========================================================================= */

export function getCachedMuralColumns(): MuralColumn[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_COLUMNS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_COLUMNS;
}

export function setCachedMuralColumns(columns: MuralColumn[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_COLUMNS, JSON.stringify(columns));
    window.dispatchEvent(new CustomEvent('mural-columns-updated', { detail: columns }));
  } catch (err) {
    console.warn('Erro ao salvar mural columns no cache local:', err);
  }
}

export async function fetchMuralColumns(): Promise<MuralColumn[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('mural_columns')
        .select('*')
        .order('order_index', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        const normalized: MuralColumn[] = data.map((c: any) => ({
          id: c.id,
          title: c.title,
          color: c.color || '#64748b',
        }));
        setCachedMuralColumns(normalized);
        return normalized;
      }
    } catch (err) {
      console.warn('Falha ao buscar mural_columns do Supabase:', err);
    }
  }
  return getCachedMuralColumns();
}

export async function saveMuralColumns(columns: MuralColumn[]): Promise<void> {
  setCachedMuralColumns(columns);

  const supabase = getSupabase();
  if (supabase) {
    try {
      const payloads = columns.map((col, idx) => ({
        id: col.id,
        title: col.title,
        color: col.color || '#64748b',
        order_index: idx + 1,
        updated_at: new Date().toISOString(),
      }));
      await supabase.from('mural_columns').upsert(payloads);
    } catch (err) {
      console.warn('Erro ao salvar mural_columns no Supabase:', err);
    }
  }
}

export async function deleteMuralColumn(columnId: string): Promise<void> {
  const current = getCachedMuralColumns().filter((c) => c.id !== columnId);
  setCachedMuralColumns(current);

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('mural_columns').delete().eq('id', columnId);
    } catch (err) {
      console.warn('Erro ao deletar coluna no Supabase:', err);
    }
  }
}

export function subscribeToMuralColumns(onData: (cols: MuralColumn[]) => void): () => void {
  let isSubscribed = true;

  fetchMuralColumns().then((data) => {
    if (isSubscribed) onData(data);
  });

  const handleLocalUpdate = (e: Event) => {
    if (!isSubscribed) return;
    const custom = e as CustomEvent<MuralColumn[]>;
    if (custom.detail) onData(custom.detail);
    else onData(getCachedMuralColumns());
  };

  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY_COLUMNS && isSubscribed) {
      onData(getCachedMuralColumns());
    }
  };

  window.addEventListener('mural-columns-updated', handleLocalUpdate);
  window.addEventListener('storage', handleStorageChange);

  const supabase = getSupabase();
  let channel: any = null;

  if (supabase) {
    try {
      channel = supabase
        .channel(`mural_columns_changes_${Date.now()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'mural_columns' },
          async () => {
            if (!isSubscribed) return;
            const updated = await fetchMuralColumns();
            if (isSubscribed) onData(updated);
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Erro ao conectar Supabase Realtime para mural_columns:', err);
    }
  }

  const intervalId = setInterval(async () => {
    if (!isSubscribed) return;
    const updated = await fetchMuralColumns();
    if (isSubscribed) onData(updated);
  }, 12000);

  return () => {
    isSubscribed = false;
    window.removeEventListener('mural-columns-updated', handleLocalUpdate);
    window.removeEventListener('storage', handleStorageChange);
    clearInterval(intervalId);
    if (channel && supabase) {
      try {
        supabase.removeChannel(channel);
      } catch {}
    }
  };
}

/* =========================================================================
 * 3. MARCADORES DO MURAL (Supabase mural_markers + Realtime + Cache Local)
 * ========================================================================= */

export function getCachedMuralMarkers(): MuralMarker[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_MARKERS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_MARKERS;
}

export function setCachedMuralMarkers(markers: MuralMarker[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_MARKERS, JSON.stringify(markers));
    window.dispatchEvent(new CustomEvent('mural-markers-updated', { detail: markers }));
  } catch (err) {
    console.warn('Erro ao salvar mural markers no cache local:', err);
  }
}

export async function fetchMuralMarkers(): Promise<MuralMarker[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('mural_markers')
        .select('*')
        .order('label', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        const normalized: MuralMarker[] = data.map((m: any) => ({
          id: m.id,
          label: m.label,
          color: m.color || '#3b82f6',
        }));
        setCachedMuralMarkers(normalized);
        return normalized;
      }
    } catch (err) {
      console.warn('Falha ao buscar mural_markers do Supabase:', err);
    }
  }
  return getCachedMuralMarkers();
}

export async function saveMuralMarkers(markers: MuralMarker[]): Promise<void> {
  setCachedMuralMarkers(markers);

  const supabase = getSupabase();
  if (supabase) {
    try {
      const payloads = markers.map((m) => ({
        id: m.id,
        label: m.label,
        color: m.color || '#3b82f6',
      }));
      await supabase.from('mural_markers').upsert(payloads);
    } catch (err) {
      console.warn('Erro ao salvar mural_markers no Supabase:', err);
    }
  }
}

export async function saveMuralMarker(marker: MuralMarker): Promise<void> {
  const current = getCachedMuralMarkers();
  const exists = current.some((m) => m.id === marker.id);
  const updated = exists
    ? current.map((m) => (m.id === marker.id ? marker : m))
    : [...current, marker];
  await saveMuralMarkers(updated);
}

export async function deleteMuralMarker(markerId: string): Promise<void> {
  const current = getCachedMuralMarkers().filter((m) => m.id !== markerId);
  setCachedMuralMarkers(current);

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('mural_markers').delete().eq('id', markerId);
    } catch (err) {
      console.warn('Erro ao deletar marker no Supabase:', err);
    }
  }
}

export function subscribeToMuralMarkers(onData: (markers: MuralMarker[]) => void): () => void {
  let isSubscribed = true;

  fetchMuralMarkers().then((data) => {
    if (isSubscribed) onData(data);
  });

  const handleLocalUpdate = (e: Event) => {
    if (!isSubscribed) return;
    const custom = e as CustomEvent<MuralMarker[]>;
    if (custom.detail) onData(custom.detail);
    else onData(getCachedMuralMarkers());
  };

  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY_CUSTOM_MARKERS && isSubscribed) {
      onData(getCachedMuralMarkers());
    }
  };

  window.addEventListener('mural-markers-updated', handleLocalUpdate);
  window.addEventListener('storage', handleStorageChange);

  const supabase = getSupabase();
  let channel: any = null;

  if (supabase) {
    try {
      channel = supabase
        .channel(`mural_markers_changes_${Date.now()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'mural_markers' },
          async () => {
            if (!isSubscribed) return;
            const updated = await fetchMuralMarkers();
            if (isSubscribed) onData(updated);
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Erro ao conectar Supabase Realtime para mural_markers:', err);
    }
  }

  const intervalId = setInterval(async () => {
    if (!isSubscribed) return;
    const updated = await fetchMuralMarkers();
    if (isSubscribed) onData(updated);
  }, 12000);

  return () => {
    isSubscribed = false;
    window.removeEventListener('mural-markers-updated', handleLocalUpdate);
    window.removeEventListener('storage', handleStorageChange);
    clearInterval(intervalId);
    if (channel && supabase) {
      try {
        supabase.removeChannel(channel);
      } catch {}
    }
  };
}

