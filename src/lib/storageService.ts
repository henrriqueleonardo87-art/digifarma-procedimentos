import type { Procedure, SystemMenu, SystemVersion } from '../types/procedure';
import { getSupabase } from './supabase';

const LOCAL_STORAGE_KEY = 'digifarma_local_procedures';
const MENUS_STORAGE_KEY = 'digifarma_system_menus';
const ACTIVE_VERSION_KEY = 'digifarma_active_version';

export function getSavedSystemVersion(): SystemVersion | null {
  const saved = localStorage.getItem(ACTIVE_VERSION_KEY);
  if (saved === 'classico' || saved === 'v10') {
    return saved;
  }
  return null;
}

export function saveSystemVersion(version: SystemVersion | null): void {
  if (version) {
    localStorage.setItem(ACTIVE_VERSION_KEY, version);
  } else {
    localStorage.removeItem(ACTIVE_VERSION_KEY);
  }
}

export const DEFAULT_SYSTEM_MENUS: SystemMenu[] = [
  {
    id: 'cadastros',
    label: 'Cadastros',
    icon: 'FolderPlus',
    version: 'ambos',
    submenus: [
      { id: 'produtos', label: 'Medicamentos & Produtos', icon: 'Package' },
      { id: 'clientes', label: 'Clientes & Convênios', icon: 'Users' },
      { id: 'fornecedores', label: 'Fornecedores & Distribuidoras', icon: 'Truck' },
      { id: 'precos', label: 'Tabela de Preços & PMC', icon: 'Tag' },
    ],
  },
  {
    id: 'estoque',
    label: 'Estoque & Entradas',
    icon: 'Boxes',
    version: 'ambos',
    submenus: [
      { id: 'entrada-notas', label: 'Entrada de Notas XML', icon: 'FileInput' },
      { id: 'inventario', label: 'Inventário & Balanço', icon: 'ClipboardCheck' },
      { id: 'validade-lotes', label: 'Lotes & Validades (PVPS)', icon: 'CalendarAlert' },
      { id: 'transferencias', label: 'Transferências entre Lojas', icon: 'ArrowLeftRight' },
    ],
  },
  {
    id: 'vendas',
    label: 'Vendas & Balcão',
    icon: 'ShoppingCart',
    version: 'ambos',
    submenus: [
      { id: 'atendimento-f7', label: 'Consulta Rápida F7 com IA', icon: 'Search' },
      { id: 'balcao-pdv', label: 'Atendimento & Pré-Venda', icon: 'UserCheck' },
      { id: 'fidelidade', label: 'Fidelidade & Cashback 360º', icon: 'Award' },
      { id: 'pbm', label: 'PBM & Convênios Farmácia', icon: 'ShieldCheck' },
    ],
  },
  {
    id: 'financeiro',
    label: 'Financeiro & Caixa',
    icon: 'DollarSign',
    version: 'ambos',
    submenus: [
      { id: 'caixa-cego', label: 'Fechamento de Caixa Cego', icon: 'Lock' },
      { id: 'contas-pagar', label: 'Contas a Pagar', icon: 'FileText' },
      { id: 'contas-receber', label: 'Contas a Receber', icon: 'CreditCard' },
      { id: 'fluxo-caixa', label: 'Fluxo de Caixa', icon: 'TrendingUp' },
    ],
  },
  {
    id: 'fiscal',
    label: 'Fiscal & Tributário',
    icon: 'FileSpreadsheet',
    version: 'ambos',
    submenus: [
      { id: 'nfce-nfe', label: 'Emissão NFC-e e NF-e', icon: 'Receipt' },
      { id: 'tributacao', label: 'Regras de ICMS & PIS/COFINS', icon: 'Percent' },
      { id: 'sped', label: 'SPED Fiscal & Sintegra', icon: 'FileCode' },
    ],
  },
  {
    id: 'sngpc',
    label: 'SNGPC & Controlados',
    icon: 'ShieldCheck',
    version: 'ambos',
    submenus: [
      { id: 'portaria344', label: 'Portaria 344/98 e Retenção', icon: 'ShieldAlert' },
      { id: 'livro-sngpc', label: 'Livro Eletrônico Anvisa', icon: 'BookOpen' },
      { id: 'transmissao-anvisa', label: 'Transmissão de Arquivos XML', icon: 'Send' },
    ],
  },
  {
    id: 'utilitarios',
    label: 'Configurações & Sistema',
    icon: 'Settings',
    version: 'ambos',
    submenus: [
      { id: 'usuarios', label: 'Usuários, Alçadas & Permissões', icon: 'UserCog' },
      { id: 'backup', label: 'Backup & Banco de Dados', icon: 'Database' },
      { id: 'parametros', label: 'Parâmetros Gerais do ERP', icon: 'Sliders' },
    ],
  },
];

export const INITIAL_PROCEDURES: Procedure[] = [];

// Gerenciamento de Menus e Submenus (Sincronizado via Supabase e Realtime)
export async function fetchSystemMenus(): Promise<SystemMenu[]> {
  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client
        .from('system_menus')
        .select('*')
        .order('order_index', { ascending: true });

      if (!error && Array.isArray(data)) {
        const parsedMenus: SystemMenu[] = data.map((row: any) => ({
          id: row.id,
          label: row.label,
          icon: row.icon || 'FolderPlus',
          version: (row.version || 'ambos') as any,
          submenus: Array.isArray(row.submenus) ? row.submenus : [],
        }));
        localStorage.setItem(MENUS_STORAGE_KEY, JSON.stringify(parsedMenus));
        return parsedMenus;
      }
    } catch (err) {
      console.warn('Falha ao carregar system_menus do Supabase:', err);
    }
  }

  // Fallback LocalStorage se offline
  const local = localStorage.getItem(MENUS_STORAGE_KEY);
  if (local !== null) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {}
  }

  return [];
}

export async function saveSystemMenus(menus: SystemMenu[]): Promise<void> {
  const client = getSupabase();
  if (client) {
    try {
      if (menus.length === 0) {
        // Se a lista estiver vazia (usuário excluiu todos), limpa a tabela no Supabase
        await client.from('system_menus').delete().neq('id', '');
      } else {
        // 1. Carregar IDs atuais para remover os deletados
        const { data: existing } = await client.from('system_menus').select('id');
        const existingIds = new Set((existing || []).map((e: any) => e.id));
        const newIds = new Set(menus.map((m) => m.id));

        const idsToDelete = [...existingIds].filter((id) => !newIds.has(id));
        if (idsToDelete.length > 0) {
          await client.from('system_menus').delete().in('id', idsToDelete);
        }

        // 2. Upsert todos os menus com order_index
        const rows = menus.map((m, index) => ({
          id: m.id,
          label: m.label,
          icon: m.icon,
          version: m.version || 'ambos',
          submenus: m.submenus || [],
          order_index: index + 1,
          updated_at: new Date().toISOString(),
        }));

        await client.from('system_menus').upsert(rows);
      }
    } catch (err) {
      console.warn('Erro ao salvar system_menus no Supabase:', err);
    }
  }

  localStorage.setItem(MENUS_STORAGE_KEY, JSON.stringify(menus));
  window.dispatchEvent(new CustomEvent('system-menus-updated', { detail: menus }));
}

export function subscribeToSystemMenus(onData: (menus: SystemMenu[]) => void): () => void {
  let isSubscribed = true;
  const client = getSupabase();
  let channel: any = null;

  if (client) {
    try {
      channel = client
        .channel(`system_menus_realtime_${Date.now()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'system_menus' },
          async () => {
            if (!isSubscribed) return;
            const updated = await fetchSystemMenus();
            if (isSubscribed) onData(updated);
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Erro ao conectar Supabase Realtime para system_menus:', err);
    }
  }

  const handleLocal = (e: Event) => {
    if (!isSubscribed) return;
    const custom = e as CustomEvent<SystemMenu[]>;
    if (custom.detail) onData(custom.detail);
  };

  window.addEventListener('system-menus-updated', handleLocal);

  const intervalId = setInterval(async () => {
    if (!isSubscribed) return;
    const updated = await fetchSystemMenus();
    if (isSubscribed) onData(updated);
  }, 20000);

  return () => {
    isSubscribed = false;
    window.removeEventListener('system-menus-updated', handleLocal);
    clearInterval(intervalId);
    if (channel && client) {
      try { client.removeChannel(channel); } catch {}
    }
  };
}

// Gerenciamento de Procedimentos
export async function fetchAllProcedures(): Promise<Procedure[]> {
  const client = getSupabase();

  if (client) {
    try {
      const { data, error } = await client
        .from('procedures')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const normalized = (data as Record<string, unknown>[]).map((p) => {
          const blocks = Array.isArray(p.blocks) ? p.blocks : [];
          const metaBlock = blocks.find((b: Record<string, unknown>) => b && b._isProcMeta) as Record<string, unknown> | undefined;

          return {
            ...p,
            systemVersion: (p.systemVersion || p.systemversion || metaBlock?.systemVersion || 'v10') as SystemVersion,
            menuId: (p.menuId || p.menuid || metaBlock?.menuId || 'geral') as string,
            submenuId: (p.submenuId || p.submenuid || metaBlock?.submenuId || 'geral') as string,
            systemPath: (p.systemPath || p.systempath || metaBlock?.systemPath || '') as string,
            status: (p.status || metaBlock?.status || 'aprovado') as 'aprovado' | 'pendente' | 'ajustes_solicitados' | 'despublicado',
            isActive: p.isActive !== undefined ? Boolean(p.isActive) : metaBlock?.isActive !== undefined ? Boolean(metaBlock.isActive) : true,
            formatType: (p.formatType || metaBlock?.formatType || (p.htmlFileData ? (p.pdfFileUrl ? 'both' : 'html') : 'pdf')),
            pdfFileUrl: (p.pdfFileUrl || metaBlock?.pdfFileUrl) as string | undefined,
            pdfFileName: (p.pdfFileName || metaBlock?.pdfFileName) as string | undefined,
            pdfFileSize: (p.pdfFileSize || metaBlock?.pdfFileSize) as number | undefined,
            htmlFileData: (p.htmlFileData || metaBlock?.htmlFileData) as string | undefined,
            htmlFileName: (p.htmlFileName || metaBlock?.htmlFileName) as string | undefined,
            htmlFileSize: (p.htmlFileSize || metaBlock?.htmlFileSize) as number | undefined,
            activeViewFormat: (p.activeViewFormat || metaBlock?.activeViewFormat || 'pdf') as 'pdf' | 'html',
            reviewedBy: (p.reviewedBy || metaBlock?.reviewedBy) as string | undefined,
            reviewedAt: (p.reviewedAt || metaBlock?.reviewedAt) as string | undefined,
            rejectionReason: (p.rejectionReason || metaBlock?.rejectionReason) as string | undefined,
            slidesConfig: p.slidesConfig || metaBlock?.slidesConfig,
            signatures: p.signatures || metaBlock?.signatures,
            coverStats: p.coverStats || metaBlock?.coverStats,
            checklistItems: p.checklistItems || metaBlock?.checklistItems,
            operationalItems: p.operationalItems || metaBlock?.operationalItems,
            blocks: blocks.filter((b: Record<string, unknown>) => !b || !b._isProcMeta),
          };
        }) as unknown as Procedure[];

        // O Supabase é a fonte autoritativa de verdade: sincroniza o cache local
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
        return normalized;
      }
    } catch (err) {
      console.warn('Falha ao carregar do Supabase, buscando cache local offline:', err);
    }
  }

  // Fallback LocalStorage APENAS se o Supabase não estiver acessível (offline)
  const local = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Ignora erro de parse
    }
  }

  return [];
}

export async function saveProcedure(procedure: Procedure): Promise<Procedure> {
  const now = new Date().toISOString();
  const updatedProcedure: Procedure = {
    ...procedure,
    isActive: procedure.isActive !== false,
    updated_at: now,
    created_at: procedure.created_at || now,
  };

  const client = getSupabase();

  if (client) {
    try {
      const payload: Record<string, unknown> = {
        id: updatedProcedure.id,
        title: updatedProcedure.title,
        subtitle: updatedProcedure.subtitle || '',
        category: updatedProcedure.category || 'Geral',
        systemVersion: updatedProcedure.systemVersion || 'v10',
        menuId: updatedProcedure.menuId || 'geral',
        submenuId: updatedProcedure.submenuId || '',
        systemPath: updatedProcedure.systemPath || '',
        author: updatedProcedure.author || 'Administrador',
        status: updatedProcedure.status || 'aprovado',
        isActive: updatedProcedure.isActive !== false,
        reviewedBy: updatedProcedure.reviewedBy || null,
        reviewedAt: updatedProcedure.reviewedAt || null,
        rejectionReason: updatedProcedure.rejectionReason || null,
        formatType: updatedProcedure.formatType || 'both',
        pdfFileUrl: updatedProcedure.pdfFileUrl || null,
        pdfFileName: updatedProcedure.pdfFileName || null,
        pdfFileSize: updatedProcedure.pdfFileSize || null,
        htmlFileData: updatedProcedure.htmlFileData || null,
        htmlFileName: updatedProcedure.htmlFileName || null,
        htmlFileSize: updatedProcedure.htmlFileSize || null,
        activeViewFormat: updatedProcedure.activeViewFormat || 'pdf',
        blocks: updatedProcedure.blocks || [],
        tags: updatedProcedure.tags || [],
        is_favorite: Boolean(updatedProcedure.is_favorite),
        history: updatedProcedure.history || [],
        slidesConfig: updatedProcedure.slidesConfig || null,
        signatures: updatedProcedure.signatures || null,
        coverStats: updatedProcedure.coverStats || null,
        checklistItems: updatedProcedure.checklistItems || null,
        operationalItems: updatedProcedure.operationalItems || null,
        createdBy: updatedProcedure.createdBy || null,
        updatedBy: updatedProcedure.updatedBy || null,
        created_at: updatedProcedure.created_at,
        updated_at: updatedProcedure.updated_at,
      };

      const { error } = await client
        .from('procedures')
        .upsert(payload);

      if (error) {
        console.error('Erro ao salvar procedure no Supabase:', error.message, error.details);
      }
    } catch (err) {
      console.error('Exceção ao salvar procedure no Supabase:', err);
    }
  }

  const local = localStorage.getItem(LOCAL_STORAGE_KEY);
  let list: Procedure[] = local ? JSON.parse(local) : [];
  const existingIndex = list.findIndex((p) => p.id === updatedProcedure.id);

  if (existingIndex >= 0) {
    list[existingIndex] = updatedProcedure;
  } else {
    list.unshift(updatedProcedure);
  }

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('procedures-updated', { detail: list }));
  return updatedProcedure;
}

export async function deleteProcedure(id: string): Promise<boolean> {
  const client = getSupabase();

  if (client) {
    try {
      await client.from('procedures').delete().eq('id', id);
    } catch (err) {
      console.warn('Erro ao deletar no Supabase:', err);
    }
  }

  const local = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (local) {
    try {
      const list: Procedure[] = JSON.parse(local);
      const filtered = list.filter((p) => p.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
      window.dispatchEvent(new CustomEvent('procedures-updated', { detail: filtered }));
    } catch {
      // ignore
    }
  }

  return true;
}

export async function toggleFavoriteProcedure(id: string): Promise<Procedure | null> {
  const procedures = await fetchAllProcedures();
  const target = procedures.find((p) => p.id === id);
  if (!target) return null;

  target.is_favorite = !target.is_favorite;
  return await saveProcedure(target);
}

/**
 * Assina atualizações de procedimentos em tempo real com fallback de polling
 */
export function subscribeToProcedures(onData: (procedures: Procedure[]) => void): () => void {
  let isSubscribed = true;
  const client = getSupabase();
  let channel: any = null;

  if (client) {
    try {
      channel = client
        .channel(`procedures_realtime_${Date.now()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'procedures' },
          async () => {
            if (!isSubscribed) return;
            const updated = await fetchAllProcedures();
            if (isSubscribed) onData(updated);
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Erro ao conectar Supabase Realtime para procedures:', err);
    }
  }

  // Eventos locais instantâneos
  const handleLocal = (e: Event) => {
    if (!isSubscribed) return;
    const custom = e as CustomEvent<Procedure[]>;
    if (custom.detail) onData(custom.detail);
  };
  const handleStorage = (e: StorageEvent) => {
    if (e.key === LOCAL_STORAGE_KEY && isSubscribed) {
      const local = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (local) {
        try { onData(JSON.parse(local)); } catch {}
      }
    }
  };
  window.addEventListener('procedures-updated', handleLocal);
  window.addEventListener('storage', handleStorage);

  // Polling a cada 15 segundos
  const intervalId = setInterval(async () => {
    if (!isSubscribed) return;
    const updated = await fetchAllProcedures();
    if (isSubscribed) onData(updated);
  }, 15000);

  return () => {
    isSubscribed = false;
    window.removeEventListener('procedures-updated', handleLocal);
    window.removeEventListener('storage', handleStorage);
    clearInterval(intervalId);
    if (channel && client) {
      try {
        client.removeChannel(channel);
      } catch {
        // ignore
      }
    }
  };
}

