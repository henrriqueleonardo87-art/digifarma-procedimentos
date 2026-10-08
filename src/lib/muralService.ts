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
}

export interface MuralColumn {
  id: string;
  title: string;
  color?: string;
}

export const STORAGE_KEY_COLUMNS = 'digifarma_mural_columns_v2';
export const STORAGE_KEY_CARDS = 'digifarma_mural_cards_v2';

export const DEFAULT_COLUMNS: MuralColumn[] = [
  { id: 'col-todo', title: 'A Fazer', color: '#64748b' },
  { id: 'col-doing', title: 'Em Andamento', color: '#3b82f6' },
  { id: 'col-done', title: 'Concluído', color: '#10b981' },
];

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
    assignee: sharedWith[0] || raw.assignee,
  };
}

export function getCachedMuralCards(): MuralCard[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CARDS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizeCard);
      }
    }
  } catch {
    // fallback
  }
  return INITIAL_CARDS;
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

      if (!error && Array.isArray(data) && data.length > 0) {
        const normalized = data.map(normalizeCard);
        setCachedMuralCards(normalized);
        return normalized;
      } else if (!error && Array.isArray(data) && data.length === 0) {
        // Se a tabela estiver vazia, faz o seed com INITIAL_CARDS
        const cached = getCachedMuralCards();
        await saveAllMuralCards(cached);
        return cached;
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
