import type { AppUser } from '../types/auth';
import { getSupabase } from './supabase';

const AUTH_USER_KEY = 'digifarma_auth_user';
const LOCAL_USERS_KEY = 'digifarma_local_users';

export const DEFAULT_USERS: AppUser[] = [
  {
    id: 'user-icaro',
    username: 'Icaro',
    name: 'Icaro',
    password: 'Trein@mento123',
    must_change_password: true,
  },
  {
    id: 'user-leonardo',
    username: 'Leonardo',
    name: 'Leonardo',
    password: 'Trein@mento123',
    must_change_password: true,
  },
  {
    id: 'user-wallace',
    username: 'Wallace',
    name: 'Wallace',
    password: 'Trein@mento123',
    must_change_password: true,
  },
  {
    id: 'user-whitalo',
    username: 'Whitalo',
    name: 'Whitalo',
    password: 'Trein@mento123',
    must_change_password: true,
  },
];

// Carregar lista de usuários (Supabase com fallback LocalStorage)
export async function getLocalUsers(): Promise<AppUser[]> {
  const local = localStorage.getItem(LOCAL_USERS_KEY);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // fallback
    }
  }
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(DEFAULT_USERS));
  return DEFAULT_USERS;
}

export function saveLocalUsers(users: AppUser[]): void {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

export function getCurrentUser(): AppUser | null {
  const local = localStorage.getItem(AUTH_USER_KEY);
  if (!local) return null;
  try {
    return JSON.parse(local);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: AppUser | null): void {
  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_USER_KEY);
  }
}

export function logout(): void {
  localStorage.removeItem(AUTH_USER_KEY);
}

export async function login(
  usernameInput: string,
  passwordInput: string
): Promise<{ success: boolean; user?: AppUser; error?: string }> {
  const cleanUsername = usernameInput.trim();
  const cleanPassword = passwordInput.trim();

  if (!cleanUsername || !cleanPassword) {
    return { success: false, error: 'Informe o usuário e a senha.' };
  }

  const supabase = getSupabase();

  // 1. Tentar autenticar via Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .ilike('username', cleanUsername)
        .eq('password', cleanPassword)
        .maybeSingle();

      if (!error && data) {
        const user: AppUser = {
          id: data.id,
          username: data.username,
          name: data.name,
          must_change_password: !!data.must_change_password,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
        setCurrentUser(user);
        return { success: true, user };
      }
    } catch (err) {
      console.warn('Erro ao consultar Supabase, tentando local:', err);
    }
  }

  // 2. Fallback LocalStorage
  const localUsers = await getLocalUsers();
  const match = localUsers.find(
    (u) =>
      u.username.toLowerCase() === cleanUsername.toLowerCase() &&
      u.password === cleanPassword
  );

  if (match) {
    const user: AppUser = {
      id: match.id,
      username: match.username,
      name: match.name,
      must_change_password: !!match.must_change_password,
    };
    setCurrentUser(user);
    return { success: true, user };
  }

  return { success: false, error: 'Usuário ou senha incorretos.' };
}

export async function updatePassword(
  userId: string,
  newPasswordInput: string
): Promise<{ success: boolean; error?: string }> {
  const newPass = newPasswordInput.trim();
  if (!newPass || newPass.length < 6) {
    return { success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' };
  }

  const supabase = getSupabase();
  const now = new Date().toISOString();

  // 1. Atualizar no Supabase
  if (supabase) {
    try {
      const { error } = await supabase
        .from('app_users')
        .update({
          password: newPass,
          must_change_password: false,
          updated_at: now,
        })
        .eq('id', userId);

      if (error) {
        console.warn('Erro ao atualizar senha no Supabase:', error.message);
      }
    } catch (err) {
      console.warn('Exceção ao atualizar senha no Supabase:', err);
    }
  }

  // 2. Atualizar no LocalStorage
  const localUsers = await getLocalUsers();
  const updatedUsers = localUsers.map((u) => {
    if (u.id === userId) {
      return {
        ...u,
        password: newPass,
        must_change_password: false,
        updated_at: now,
      };
    }
    return u;
  });
  saveLocalUsers(updatedUsers);

  // 3. Atualizar sessão ativa
  const current = getCurrentUser();
  if (current && current.id === userId) {
    setCurrentUser({
      ...current,
      must_change_password: false,
      updated_at: now,
    });
  }

  return { success: true };
}

export async function updateUserAvatar(
  userId: string,
  avatarUrl: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  if (supabase) {
    try {
      await supabase
        .from('app_users')
        .update({ avatar_url: avatarUrl, updated_at: now })
        .eq('id', userId);
    } catch (err) {
      console.warn('Erro ao salvar avatar no Supabase:', err);
    }
  }

  const localUsers = await getLocalUsers();
  const updated = localUsers.map((u) => {
    if (u.id === userId) {
      return { ...u, avatar_url: avatarUrl, updated_at: now };
    }
    return u;
  });
  saveLocalUsers(updated);

  const current = getCurrentUser();
  if (current && current.id === userId) {
    setCurrentUser({
      ...current,
      avatar_url: avatarUrl,
      updated_at: now,
    });
  }

  return { success: true };
}
