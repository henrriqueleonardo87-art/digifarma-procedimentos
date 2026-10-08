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

const nowMs = Date.now();
const oneHour = 3600000;
const oneDay = 86400000;

export const INITIAL_PUBLICACOES: PublicacaoItem[] = [
  {
    id: 'pub-initial-1',
    title: 'Atualização nas Regras de Validação de NF-e 4.0',
    content:
      'Atenção equipe de implantação e suporte: os clientes do regime Simples Nacional agora exigem o preenchimento obrigatório do código de benefício fiscal em itens desonerados. Procedimento operacional atualizado no repositório.',
    author: 'Leonardo',
    createdAt: new Date(nowMs - oneHour * 2).toISOString(),
    targetUsers: [], // Todos
    readBy: ['Leonardo'],
    attachment: null,
    comments: [
      {
        id: 'c-1',
        author: 'Icaro',
        content: 'Perfeito, já estou repassando aos operadores da Drogaria Santa Luzia.',
        createdAt: new Date(nowMs - oneHour * 1).toISOString(),
      },
    ],
  },
  {
    id: 'pub-initial-2',
    title: 'Alinhamento Operacional: Fechamento Cego de Caixa e Sangria',
    content:
      'Favor validar os parâmetros de conferência de sangria e conferência de lote cego antes da reunião de homologação com a gerência amanhã.',
    author: 'Wallace',
    createdAt: new Date(nowMs - oneHour * 5).toISOString(),
    targetUsers: ['Leonardo', 'Whitalo'],
    readBy: ['Wallace'],
    attachment: null,
    comments: [],
  },
  {
    id: 'pub-initial-3',
    title: 'Homologação da Nova Versão do TEF Integrado SiTef',
    content:
      'Liberada a atualização do executável do TEF dedicado para homologação nos caixas pilotos da Loja 01. Verifiquem o tempo de resposta nas transações PIX dinâmico e crédito parcelado.',
    author: 'Icaro',
    createdAt: new Date(nowMs - oneDay - oneHour * 2).toISOString(),
    targetUsers: [],
    readBy: ['Icaro', 'Wallace'],
    attachment: null,
    comments: [
      {
        id: 'c-2',
        author: 'Leonardo',
        content: 'Testei na bancada de testes e o retorno do comprovante TEF ficou abaixo de 1.2s.',
        createdAt: new Date(nowMs - oneDay).toISOString(),
      },
    ],
  },
  {
    id: 'pub-initial-4',
    title: 'Procedimento de Entrada de Mercadorias com Manifesto Eletrônico (MDF-e)',
    content:
      'Documento com o fluxo detalhado passo a passo para conferência cega e importação automática de chave de acesso XML no módulo de Compras do Digifarma.',
    author: 'Leonardo',
    createdAt: new Date(nowMs - oneDay - oneHour * 6).toISOString(),
    targetUsers: [],
    readBy: ['Leonardo', 'Icaro'],
    attachment: {
      name: 'POP_042_Manifesto_Eletronico_Digifarma.pdf',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      type: 'pdf',
      size: 142000,
    },
    comments: [],
  },
  {
    id: 'pub-initial-5',
    title: 'Diretrizes de Atendimento BPF e Dispensação de Medicamentos Controlados',
    content:
      'Lembramos que a conferência de receita de Notificação de Receita A (Amarela) e B (Azul) no SNGPC deve ser feita com carimbo legível do CRF do farmacêutico antes da finalização do cupom fiscal.',
    author: 'Wallace',
    createdAt: new Date(nowMs - oneDay * 3).toISOString(),
    targetUsers: [],
    readBy: ['Wallace', 'Leonardo', 'Whitalo'],
    attachment: null,
    comments: [],
  },
  {
    id: 'pub-initial-6',
    title: 'Atenção: Novo Padrão de Etiquetas de Gôndola e Código de Barras',
    content:
      'O layout de impressão térmica na impressora Argox / Zebra foi padronizado com fonte condensada para evitar corte de descrição em medicamentos similares e genéricos.',
    author: 'Whitalo',
    createdAt: new Date(nowMs - oneDay * 5).toISOString(),
    targetUsers: ['Leonardo'],
    readBy: ['Whitalo'],
    attachment: null,
    comments: [],
  },
  {
    id: 'pub-initial-7',
    title: 'Manual Operacional de Devolução a Fornecedores e Emissão de NFe de Devolução',
    content:
      'Em casos de produtos com avaria ou divergência de lote no recebimento, seguir estritamente o roteiro com CFOP 5202/6202 e vincular a NF de origem.',
    author: 'Leonardo',
    createdAt: new Date(nowMs - oneDay * 6).toISOString(),
    targetUsers: [],
    readBy: ['Leonardo', 'Alisson'],
    attachment: null,
    comments: [],
  },
  {
    id: 'pub-initial-8',
    title: 'Treinamento Interno: Inventário Rotativo e Fechamento Semanal',
    content:
      'Nesta sexta-feira realizaremos alinhamento prático sobre o módulo de contagem via coletor Android Digifarma Mobile. Todos os multiplicadores devem comparecer.',
    author: 'Alisson',
    createdAt: new Date(nowMs - oneDay * 9).toISOString(),
    targetUsers: [],
    readBy: ['Alisson', 'Wallace'],
    attachment: null,
    comments: [],
  },
  {
    id: 'pub-initial-9',
    title: 'Validação de Clientes Convênio e Emissão de Faturas Quinzenais',
    content:
      'Favor verificar as autorizações pendentes da Unimed e PBM Vidalink antes do fechamento do ciclo financeiro da primeira quinzena.',
    author: 'Icaro',
    createdAt: new Date(nowMs - oneDay * 12).toISOString(),
    targetUsers: ['Leonardo', 'Wallace'],
    readBy: ['Icaro'],
    attachment: null,
    comments: [],
  },
  {
    id: 'pub-initial-10',
    title: 'Instrução Normativa: Procedimento de Backup e Segurança das Filiais',
    content:
      'A rotina de backup em nuvem automática do banco Firebird está agendada diariamente para as 23h30. Certifiquem-se de que os caixas não fiquem travados na tela de pré-venda.',
    author: 'Suporte Digifarma',
    createdAt: new Date(nowMs - oneDay * 14).toISOString(),
    targetUsers: [],
    readBy: ['Leonardo', 'Wallace', 'Whitalo'],
    attachment: null,
    comments: [],
  },
  {
    id: 'pub-initial-11',
    title: 'Atualização da Curva ABC e Reposição Automática de Demanda',
    content:
      'Parâmetros de estoque mínimo e estoque de segurança foram recalculados com base no histórico de vendas dos últimos 90 dias.',
    author: 'Leonardo',
    createdAt: new Date(nowMs - oneDay * 18).toISOString(),
    targetUsers: [],
    readBy: ['Leonardo'],
    attachment: null,
    comments: [],
  },
  {
    id: 'pub-initial-12',
    title: 'Ajustes no Processo de Pré-Venda e Comanda Eletrônica Balcão',
    content:
      'Foi adicionado atalho rápido para busca por princípio ativo na tela de pré-venda do balcão (F4). Melhora na agilidade do atendimento.',
    author: 'Wallace',
    createdAt: new Date(nowMs - oneDay * 22).toISOString(),
    targetUsers: ['Leonardo', 'Icaro'],
    readBy: ['Wallace'],
    attachment: null,
    comments: [],
  },
  {
    id: 'pub-initial-13',
    title: 'Regras para Cadastro de Novos Usuários e Níveis de Permissão no Digifarma',
    content:
      'Toda solicitação de novo acesso ou alteração de perfil de operador de caixa para supervisor deve ser formalizada com aprovação da gerência de rede.',
    author: 'Whitalo',
    createdAt: new Date(nowMs - oneDay * 26).toISOString(),
    targetUsers: [],
    readBy: ['Whitalo'],
    attachment: null,
    comments: [],
  },
  {
    id: 'pub-initial-14',
    title: 'Fechamento Mensal de Livros Fiscais e Geração do SPED Fiscal',
    content:
      'Procedimento para conciliação das notas modelo 55 e 65 e validação do bloco C antes da entrega da EFD ICMS/IPI da contabilidade.',
    author: 'Leonardo',
    createdAt: new Date(nowMs - oneDay * 35).toISOString(),
    targetUsers: [],
    readBy: ['Leonardo', 'Wallace'],
    attachment: null,
    comments: [],
  },
  {
    id: 'pub-initial-15',
    title: 'Boas Práticas de Armazenamento e Controle Termolábil (Portaria 344/98)',
    content:
      'Planilha de registro e leitura de termômetro de máxima e mínima para geladeiras de medicamentos termolábeis e biológicos.',
    author: 'Gerência Técnica',
    createdAt: new Date(nowMs - oneDay * 42).toISOString(),
    targetUsers: [],
    readBy: ['Leonardo', 'Alisson', 'Whitalo'],
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
      if (Array.isArray(parsed) && parsed.length >= 10) {
        return parsed.map(normalizePublicacao);
      }
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingIds = new Set(parsed.map((p: any) => p.id));
        const merged = [...parsed, ...INITIAL_PUBLICACOES.filter((p) => !existingIds.has(p.id))];
        setCachedPublicacoes(merged);
        return merged.map(normalizePublicacao);
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
        if (data.length === 0) {
          setCachedPublicacoes(INITIAL_PUBLICACOES);
          return INITIAL_PUBLICACOES;
        }
        const normalized = data.map(normalizePublicacao);
        if (normalized.length < 10) {
          const existingIds = new Set(normalized.map((p) => p.id));
          const merged = [...normalized, ...INITIAL_PUBLICACOES.filter((p) => !existingIds.has(p.id))];
          setCachedPublicacoes(merged);
          return merged;
        }
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
