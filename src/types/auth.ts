export interface AppUser {
  id: string;
  username: string;
  name: string;
  displayName?: string;
  password?: string;
  must_change_password: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  user: AppUser | null;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
}
