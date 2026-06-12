export interface User {
  user_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  roles?: string[];
}

export interface Role {
  role_id: number;
  role_name: string;
  permissions?: string[];
  user_count?: number;
}

export interface AuditLog {
  audit_id: number;
  user_id?: number;
  username?: string;
  action_type: string;
  entity_name: string;
  record_id?: string;
  old_value?: any;
  new_value?: any;
  ip_address?: string;
  created_at: string;
}

export interface AppSetting {
  setting_id: number;
  setting_key: string;
  setting_value: string;
  description: string;
  updated_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}
