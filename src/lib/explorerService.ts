import { getSupabase } from './supabase';
import type { ExplorerFolder, ExplorerItem } from '../components/ArquivosView';

const STORAGE_KEY_FOLDERS = 'digifarma_explorer_folders';
const STORAGE_KEY_ITEMS = 'digifarma_explorer_items';

export async function fetchExplorerFolders(): Promise<ExplorerFolder[]> {
  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client
        .from('explorer_folders')
        .select('*')
        .order('name', { ascending: true });

      if (!error && Array.isArray(data)) {
        const normalized: ExplorerFolder[] = data.map((f) => ({
          id: f.id,
          name: f.name,
          parentId: f.parentId || f.parent_id || null,
          createdAt: f.createdAt || f.created_at || new Date().toISOString(),
        }));
        localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(normalized));
        return normalized;
      }
    } catch (err) {
      console.warn('Erro ao buscar pastas do Supabase:', err);
    }
  }

  const local = localStorage.getItem(STORAGE_KEY_FOLDERS);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
}

export async function fetchExplorerItems(): Promise<ExplorerItem[]> {
  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client
        .from('explorer_items')
        .select('*')
        .order('title', { ascending: true });

      if (!error && Array.isArray(data)) {
        const normalized: ExplorerItem[] = data.map((it) => ({
          id: it.id,
          folderId: it.folderId || it.folder_id || null,
          type: it.type as 'file' | 'image' | 'pdf' | 'note',
          title: it.title,
          contentOrUrl: it.contentOrUrl || it.content_or_url || '',
          author: it.author || 'Equipe Digifarma',
          createdAt: it.createdAt || it.created_at || new Date().toISOString(),
          size: it.size || undefined,
        }));
        localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(normalized));
        return normalized;
      }
    } catch (err) {
      console.warn('Erro ao buscar itens de arquivos do Supabase:', err);
    }
  }

  const local = localStorage.getItem(STORAGE_KEY_ITEMS);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
}

export async function saveExplorerFolder(folder: ExplorerFolder): Promise<void> {
  const client = getSupabase();
  if (client) {
    try {
      await client.from('explorer_folders').upsert({
        id: folder.id,
        name: folder.name,
        parentId: folder.parentId,
        createdAt: folder.createdAt,
      });
    } catch (err) {
      console.warn('Erro ao salvar pasta no Supabase:', err);
    }
  }

  const local = localStorage.getItem(STORAGE_KEY_FOLDERS);
  let list: ExplorerFolder[] = local ? JSON.parse(local) : [];
  const idx = list.findIndex((f) => f.id === folder.id);
  if (idx >= 0) {
    list[idx] = folder;
  } else {
    list.push(folder);
  }
  localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('explorer-updated'));
}

export async function deleteExplorerFolder(folderId: string): Promise<void> {
  const client = getSupabase();
  if (client) {
    try {
      await client.from('explorer_folders').delete().eq('id', folderId);
      // Também deleta itens contidos na pasta
      await client.from('explorer_items').delete().eq('folderId', folderId);
    } catch (err) {
      console.warn('Erro ao excluir pasta no Supabase:', err);
    }
  }

  const localF = localStorage.getItem(STORAGE_KEY_FOLDERS);
  if (localF) {
    try {
      const list: ExplorerFolder[] = JSON.parse(localF);
      localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(list.filter((f) => f.id !== folderId)));
    } catch {}
  }

  const localI = localStorage.getItem(STORAGE_KEY_ITEMS);
  if (localI) {
    try {
      const list: ExplorerItem[] = JSON.parse(localI);
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(list.filter((i) => i.folderId !== folderId)));
    } catch {}
  }
  window.dispatchEvent(new CustomEvent('explorer-updated'));
}

export async function saveExplorerItem(item: ExplorerItem): Promise<void> {
  const client = getSupabase();
  if (client) {
    try {
      await client.from('explorer_items').upsert({
        id: item.id,
        folderId: item.folderId,
        type: item.type,
        title: item.title,
        contentOrUrl: item.contentOrUrl,
        author: item.author,
        size: item.size || null,
        createdAt: item.createdAt,
      });
    } catch (err) {
      console.warn('Erro ao salvar item no Supabase:', err);
    }
  }

  const local = localStorage.getItem(STORAGE_KEY_ITEMS);
  let list: ExplorerItem[] = local ? JSON.parse(local) : [];
  const idx = list.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    list[idx] = item;
  } else {
    list.push(item);
  }
  localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('explorer-updated'));
}

export async function deleteExplorerItem(itemId: string): Promise<void> {
  const client = getSupabase();
  if (client) {
    try {
      await client.from('explorer_items').delete().eq('id', itemId);
    } catch (err) {
      console.warn('Erro ao excluir item no Supabase:', err);
    }
  }

  const local = localStorage.getItem(STORAGE_KEY_ITEMS);
  if (local) {
    try {
      const list: ExplorerItem[] = JSON.parse(local);
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(list.filter((i) => i.id !== itemId)));
    } catch {}
  }
  window.dispatchEvent(new CustomEvent('explorer-updated'));
}

export function subscribeToExplorer(onUpdate: () => void): () => void {
  const client = getSupabase();
  let channel: any = null;

  if (client) {
    try {
      channel = client
        .channel(`explorer_realtime_${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'explorer_folders' }, () => {
          onUpdate();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'explorer_items' }, () => {
          onUpdate();
        })
        .subscribe();
    } catch (err) {
      console.warn('Erro no realtime do explorer:', err);
    }
  }

  const handleCustom = () => onUpdate();
  window.addEventListener('explorer-updated', handleCustom);

  return () => {
    window.removeEventListener('explorer-updated', handleCustom);
    if (channel && client) {
      try {
        client.removeChannel(channel);
      } catch {}
    }
  };
}
