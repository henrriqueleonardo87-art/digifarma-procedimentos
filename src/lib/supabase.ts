import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseConfig } from '../types/procedure';

const STORAGE_KEY = 'digifarma_supabase_config';

// Obter configuração inicial (Environment ou LocalStorage)
export function getSavedConfig(): SupabaseConfig {
  const local = localStorage.getItem(STORAGE_KEY);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (parsed.url && parsed.anonKey) return parsed;
    } catch {
      // Fallback
    }
  }

  return {
    url: import.meta.env.VITE_SUPABASE_URL || 'https://yhmlaynltzwuksyzmzsg.supabase.co',
    anonKey:
      import.meta.env.VITE_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlobWxheW5sdHp3dWtzeXptenNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2MTY2NjYsImV4cCI6MjEwNjE5MjY2Nn0.dBHXFF29eTC6i-fBnGlNmdIpXkkzv9u-iciUUw0OpyE',
    bucketName: import.meta.env.VITE_SUPABASE_BUCKET || 'procedure-media',
  };
}

export function saveConfig(config: SupabaseConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  // Reseta a instância para recriar com novas credenciais
  currentClient = null;
}

let currentClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (currentClient) return currentClient;

  const config = getSavedConfig();
  if (config.url && config.anonKey) {
    try {
      currentClient = createClient(config.url, config.anonKey);
      return currentClient;
    } catch (err) {
      console.error('Erro ao inicializar cliente Supabase:', err);
      return null;
    }
  }
  return null;
}

export async function testConnection(): Promise<{ success: boolean; message: string }> {
  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      message: 'Supabase URL e Anon Key não estão configurados. Você pode rodar em modo local ou preencher as credenciais.',
    };
  }

  try {
    const { error } = await client.from('procedures').select('id').limit(1);
    if (error) {
      // Pode ser tabela não criada
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return {
          success: false,
          message: 'Conectado ao Supabase com sucesso! A tabela "procedures" precisa ser criada: basta rodar o script SQL no painel do Supabase.',
        };
      }
      return {
        success: false,
        message: `Erro na tabela Supabase: ${error.message}`,
      };
    }
    return {
      success: true,
      message: 'Conexão com o banco de dados Supabase realizada com sucesso!',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Falha ao conectar: ${errorMsg}`,
    };
  }
}

/**
 * Faz upload de imagem para o Supabase Storage bucket 'procedure-media'.
 * Se o Supabase não estiver configurado, converte em Base64 Data URL para permitir uso local imediato.
 */
export async function uploadProcedureImage(file: File): Promise<string> {
  const client = getSupabase();
  const config = getSavedConfig();

  if (!client || !config.url || !config.anonKey) {
    // Modo local: gera Data URL para não travar o usuário
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  try {
    const bucket = config.bucketName || 'procedure-media';
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `procedures/${fileName}`;

    const { error: uploadError } = await client.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.warn('Falha no upload para Storage Supabase, caindo para Base64:', uploadError.message);
      // Fallback gracioso para Base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });
    }

    const { data } = client.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error('Erro no upload de imagem:', err);
    // Fallback base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }
}
