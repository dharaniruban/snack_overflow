export type Role = 'admin' | 'member';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface SafeUserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  created_at: Date;
}
