import { getSupabase } from './supabase';

export interface SugestaoTimelineItem {
  id: string;
  status: 'enviada' | 'em_analise' | 'aprovada' | 'em_execucao' | 'concluida' | 'recusada';
  author: string; // Ex: Leonardo
  note?: string;
  createdAt: string;
}

export interface SugestaoComment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface SugestaoItem {
  id: string;
  title: string;
  description: string;
  author: string;
  category: string;
  status: 'enviada' | 'em_analise' | 'aprovada' | 'em_execucao' | 'concluida' | 'recusada';
  timeline: SugestaoTimelineItem[];
  comments: SugestaoComment[];
  createdAt: string;
  updated_at?: string;
}

const STORAGE_KEY_SUGESTOES = 'digifarma_sugestoes_list';

const INITIAL_SUGESTOES: SugestaoItem[] = [
  {
    id: 'sug-1',
    title: 'Adicionar filtro por data de homologação nos relatórios',
    description:
      'Seria muito útil para a coordenação poder filtrar os POPs que foram aprovados nos últimos 30 dias para relatórios de treinamento.',
    author: 'Icaro',
    category: 'Relatórios & Filtros',
    status: 'aprovada',
    timeline: [
      {
        id: 'tl-1',
        status: 'enviada',
        author: 'Icaro',
        note: 'Sugestão registrada no sistema.',
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      },
      {
        id: 'tl-2',
        status: 'em_analise',
        author: 'Leonardo',
        note: 'Avaliado tecnicamente para a sprint atual.',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: 'tl-3',
        status: 'aprovada',
        author: 'Leonardo',
        note: 'Aprovado! Iniciaremos a inclusão no módulo de relatórios.',
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
    ],
    comments: [
      {
        id: 'c-sug-1',
        author: 'Wallace',
        content: 'Apoio, vai facilitar muito a prestação de contas na farmácia modelo.',
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
];

function normalizeSugestao(raw: any): SugestaoItem {
  let timeline: SugestaoTimelineItem[] = [];
  if (Array.isArray(raw.timeline)) {
    timeline = raw.timeline;
  } else if (typeof raw.timeline === 'string') {
    try {
      timeline = JSON.parse(raw.timeline);
    } catch {
      timeline = [];
    }
  }

  let comments: SugestaoComment[] = [];
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
    id: String(raw.id || `sug-${Date.now()}`),
    title: String(raw.title || ''),
    description: String(raw.description || ''),
    author: String(raw.author || 'Colaborador Digifarma'),
    category: String(raw.category || 'Geral'),
    status: raw.status || 'enviada',
    timeline: Array.isArray(timeline) ? timeline : [],
    comments: Array.isArray(comments) ? comments : [],
    createdAt: String(raw.createdAt || raw.created_at || new Date().toISOString()),
    updated_at: raw.updated_at || undefined,
  };
}

export function getCachedSugestoes(): SugestaoItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SUGESTOES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizeSugestao);
      }
    }
  } catch (err) {
    console.warn('Erro ao ler sugestões do cache:', err);
  }
  return INITIAL_SUGESTOES;
}

export function setCachedSugestoes(items: SugestaoItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SUGESTOES, JSON.stringify(items));
  } catch (err) {
    console.warn('Erro ao salvar sugestões no cache:', err);
  }
}

export async function fetchSugestoes(): Promise<SugestaoItem[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('sugestoes')
        .select('*')
        .order('createdAt', { ascending: false });

      if (!error && Array.isArray(data)) {
        const normalized = data.map(normalizeSugestao);
        setCachedSugestoes(normalized);
        return normalized;
      }
    } catch (err) {
      console.warn('Erro ao buscar sugestões no Supabase:', err);
    }
  }
  return getCachedSugestoes();
}

export async function createSugestao(item: SugestaoItem): Promise<boolean> {
  const current = getCachedSugestoes();
  const updated = [item, ...current.filter((s) => s.id !== item.id)];
  setCachedSugestoes(updated);

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from('sugestoes').upsert({
        id: item.id,
        title: item.title,
        description: item.description,
        author: item.author,
        category: item.category,
        status: item.status,
        timeline: item.timeline,
        comments: item.comments,
        createdAt: item.createdAt,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.error('Erro ao salvar sugestão no Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Falha de rede ao salvar sugestão:', err);
      return false;
    }
  }
  return true;
}

export async function updateSugestaoStatus(
  sugId: string,
  newStatus: SugestaoItem['status'],
  authorName: string,
  note?: string
): Promise<boolean> {
  const current = getCachedSugestoes();
  const target = current.find((s) => s.id === sugId);
  if (!target) return false;

  const newTimelineItem: SugestaoTimelineItem = {
    id: `tl-${Date.now()}`,
    status: newStatus,
    author: authorName,
    note: note || undefined,
    createdAt: new Date().toISOString(),
  };

  const updatedTimeline = [...target.timeline, newTimelineItem];
  const updatedItem: SugestaoItem = {
    ...target,
    status: newStatus,
    timeline: updatedTimeline,
    updated_at: new Date().toISOString(),
  };

  const updatedList = current.map((s) => (s.id === sugId ? updatedItem : s));
  setCachedSugestoes(updatedList);

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('sugestoes')
        .update({
          status: newStatus,
          timeline: updatedTimeline,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sugId);

      if (error) {
        console.error('Erro ao atualizar timeline da sugestão no Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Falha de rede ao atualizar sugestão:', err);
      return false;
    }
  }
  return true;
}

export async function addSugestaoComment(
  sugId: string,
  comment: SugestaoComment
): Promise<boolean> {
  const current = getCachedSugestoes();
  const target = current.find((s) => s.id === sugId);
  if (!target) return false;

  const updatedComments = [...target.comments, comment];
  const updatedItem: SugestaoItem = {
    ...target,
    comments: updatedComments,
    updated_at: new Date().toISOString(),
  };

  const updatedList = current.map((s) => (s.id === sugId ? updatedItem : s));
  setCachedSugestoes(updatedList);

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('sugestoes')
        .update({
          comments: updatedComments,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sugId);

      if (error) {
        console.error('Erro ao adicionar comentário na sugestão no Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Falha ao adicionar comentário na sugestão:', err);
      return false;
    }
  }
  return true;
}

export async function deleteSugestao(sugId: string): Promise<boolean> {
  const current = getCachedSugestoes();
  const updated = current.filter((s) => s.id !== sugId);
  setCachedSugestoes(updated);

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from('sugestoes').delete().eq('id', sugId);
      if (error) {
        console.error('Erro ao excluir sugestão:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Falha ao excluir sugestão no Supabase:', err);
      return false;
    }
  }
  return true;
}

export function subscribeToSugestoes(onData: (items: SugestaoItem[]) => void): () => void {
  let isSubscribed = true;

  fetchSugestoes().then((items) => {
    if (isSubscribed) onData(items);
  });

  const supabase = getSupabase();
  let channel: any = null;

  if (supabase) {
    try {
      channel = supabase
        .channel(`sugestoes_changes_${Date.now()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'sugestoes' },
          async () => {
            if (!isSubscribed) return;
            const updated = await fetchSugestoes();
            if (isSubscribed) onData(updated);
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Erro ao conectar Supabase Realtime channel de sugestoes:', err);
    }
  }

  const intervalId = setInterval(async () => {
    if (!isSubscribed) return;
    const updated = await fetchSugestoes();
    if (isSubscribed) onData(updated);
  }, 12000);

  return () => {
    isSubscribed = false;
    clearInterval(intervalId);
    if (channel && supabase) {
      try {
        supabase.removeChannel(channel);
      } catch {
        // ignore
      }
    }
  };
}

export const subscribeSugestoes = subscribeToSugestoes;

export const STATUS_LABELS: Record<SugestaoItem['status'], string> = {
  enviada: 'Enviada',
  em_analise: 'Em Análise',
  aprovada: 'Aprovada',
  em_execucao: 'Em Execução',
  concluida: 'Concluída',
  recusada: 'Recusada',
};

export const STATUS_COLORS: Record<SugestaoItem['status'], { bg: string; text: string; border: string }> = {
  enviada: { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.25)' },
  em_analise: { bg: 'rgba(245, 158, 11, 0.12)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.25)' },
  aprovada: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981', border: 'rgba(16, 185, 129, 0.25)' },
  em_execucao: { bg: 'rgba(139, 92, 246, 0.12)', text: '#8b5cf6', border: 'rgba(139, 92, 246, 0.25)' },
  concluida: { bg: 'rgba(4, 120, 87, 0.15)', text: '#059669', border: 'rgba(4, 120, 87, 0.3)' },
  recusada: { bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.25)' },
};

