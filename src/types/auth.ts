export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  branch_id?: string;
  branch?: { id: string; name: string; code: string };
  avatar?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthResponse {
  code: number;
  status: string;
  message: string;
  user: User;
  tokens: TokenPair;
}

export interface LoginPayload {
  email: string;
  password: string;
}
