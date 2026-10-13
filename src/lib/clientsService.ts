import { getSupabase } from './supabase';
import type { ClientProfile } from '../components/UtilitiesView';

const STORAGE_KEY_CLIENTS = 'digifarma_pharmacy_clients';

export const INITIAL_CLIENTS: ClientProfile[] = [
  {
    id: 'cli-1',
    clientId: 'DF-0101',
    cnpj: '12.345.678/0001-90',
    razaoSocial: 'Farmácia Popular Nova Esperança LTDA',
    nomeFantasia: 'Drogaria Nova Esperança - Matriz',
    phone: '(11) 98765-4321',
    notes: 'Farmácia modelo de homologação e treinamento operacional de balcão e SNGPC.',
    collaborators: [
      {
        id: 'col-1',
        name: 'Dra. Camila Vasconcelos',
        role: 'Farmacêutico(a) Responsável Técnico (RT)',
        phone: '(11) 98765-4322',
        email: 'camila.rt@novaesperanca.com.br',
      },
      {
        id: 'col-2',
        name: 'Marcos Roberto da Silva',
        role: 'Balconista / Atendente de Farmácia',
        phone: '(11) 97123-4567',
        email: 'marcos.balcao@novaesperanca.com.br',
      },
    ],
    createdAt: new Date().toISOString(),
  },
];

export async function fetchClients(): Promise<ClientProfile[]> {
  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        if (data.length === 0) {
          // Se vazio, insere o cliente inicial
          await saveClientsBatch(INITIAL_CLIENTS);
          return INITIAL_CLIENTS;
        }

        const normalized: ClientProfile[] = data.map((c: any) => ({
          id: c.id,
          clientId: c.identificationCode || c.id,
          cnpj: c.cnpj || '',
          razaoSocial: c.razaoSocial || '',
          nomeFantasia: c.nomeFantasia || '',
          phone: c.phone || '',
          notes: c.notes || '',
          collaborators: Array.isArray(c.collaborators) ? c.collaborators : [],
          createdAt: c.created_at || c.createdAt || new Date().toISOString(),
        }));

        localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(normalized));
        return normalized;
      }
    } catch (err) {
      console.warn('Erro ao buscar clientes no Supabase:', err);
    }
  }

  const local = localStorage.getItem(STORAGE_KEY_CLIENTS);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }

  localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(INITIAL_CLIENTS));
  return INITIAL_CLIENTS;
}

export async function saveClientsBatch(clientsList: ClientProfile[]): Promise<void> {
  const client = getSupabase();
  if (client) {
    try {
      const rows = clientsList.map((c) => ({
        id: c.id,
        cnpj: c.cnpj,
        razaoSocial: c.razaoSocial,
        nomeFantasia: c.nomeFantasia,
        phone: c.phone,
        identificationCode: c.clientId,
        notes: c.notes,
        collaborators: c.collaborators || [],
        updated_at: new Date().toISOString(),
      }));
      await client.from('clients').upsert(rows);
    } catch (err) {
      console.warn('Erro ao salvar lote de clientes no Supabase:', err);
    }
  }
}

export async function saveClient(clientProfile: ClientProfile): Promise<ClientProfile> {
  const client = getSupabase();
  if (client) {
    try {
      const row = {
        id: clientProfile.id,
        cnpj: clientProfile.cnpj,
        razaoSocial: clientProfile.razaoSocial,
        nomeFantasia: clientProfile.nomeFantasia,
        phone: clientProfile.phone,
        identificationCode: clientProfile.clientId,
        notes: clientProfile.notes,
        collaborators: clientProfile.collaborators || [],
        updated_at: new Date().toISOString(),
      };
      await client.from('clients').upsert(row);
    } catch (err) {
      console.warn('Erro ao salvar cliente no Supabase:', err);
    }
  }

  const local = localStorage.getItem(STORAGE_KEY_CLIENTS);
  let list: ClientProfile[] = local ? JSON.parse(local) : [];
  const idx = list.findIndex((c) => c.id === clientProfile.id);
  if (idx >= 0) {
    list[idx] = clientProfile;
  } else {
    list.unshift(clientProfile);
  }
  localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('clients-updated', { detail: list }));
  return clientProfile;
}

export async function deleteClient(id: string): Promise<void> {
  const client = getSupabase();
  if (client) {
    try {
      await client.from('clients').delete().eq('id', id);
    } catch (err) {
      console.warn('Erro ao excluir cliente no Supabase:', err);
    }
  }

  const local = localStorage.getItem(STORAGE_KEY_CLIENTS);
  if (local) {
    try {
      const list: ClientProfile[] = JSON.parse(local);
      const filtered = list.filter((c) => c.id !== id);
      localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(filtered));
      window.dispatchEvent(new CustomEvent('clients-updated', { detail: filtered }));
    } catch {}
  }
}

export function subscribeToClients(onData: (clients: ClientProfile[]) => void): () => void {
  let isSubscribed = true;
  const client = getSupabase();
  let channel: any = null;

  if (client) {
    try {
      channel = client
        .channel(`clients_realtime_${Date.now()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'clients' },
          async () => {
            if (!isSubscribed) return;
            const updated = await fetchClients();
            if (isSubscribed) onData(updated);
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Erro ao conectar Supabase Realtime para clients:', err);
    }
  }

  const handleLocal = (e: Event) => {
    if (!isSubscribed) return;
    const custom = e as CustomEvent<ClientProfile[]>;
    if (custom.detail) onData(custom.detail);
  };

  window.addEventListener('clients-updated', handleLocal);

  const intervalId = setInterval(async () => {
    if (!isSubscribed) return;
    const updated = await fetchClients();
    if (isSubscribed) onData(updated);
  }, 20000);

  return () => {
    isSubscribed = false;
    window.removeEventListener('clients-updated', handleLocal);
    clearInterval(intervalId);
    if (channel && client) {
      try { client.removeChannel(channel); } catch {}
    }
  };
}
