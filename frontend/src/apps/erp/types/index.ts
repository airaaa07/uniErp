export interface User {
  user_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  roles?: { role_id: number; role_name: string }[];
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

// ==================== DESIGNER STUDIO TYPES ====================

export interface Module {
  module_id: string;
  module_key: string;
  module_name: string;
  description: string;
  is_active: boolean;
  is_system?: boolean;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface ModuleCreate {
  module_key: string;
  module_name: string;
  description?: string;
}

export interface ModuleUpdate {
  module_name?: string;
  description?: string;
  is_active?: boolean;
}

export interface Field {
  field_id: number;
  module_key: string;
  label: string;
  field_key: string;
  field_type: string;
  field_group_id?: number;
  field_group_name: string;
  placeholder: string;
  help_tooltip: string;
  default_value: string;
  min_value: string;
  max_value: string;
  system_field: boolean;
  is_visible: boolean;
  is_mandatory: boolean;
  is_pii: boolean;
  is_audited: boolean;
  is_searchable: boolean;
  is_exportable: boolean;
  sort_order: number;
  is_active?: boolean;
  min_length?: number;
  max_length?: number;
  regex_validation?: string;
  is_read_only?: boolean;
  dropdown_options?: any;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface FieldCreate {
  module_key: string;
  label: string;
  field_key: string;
  field_type: string;
  field_group_name?: string;
  placeholder?: string;
  help_tooltip?: string;
  default_value?: string;
  min_value?: string;
  max_value?: string;
  system_field?: boolean;
  is_visible?: boolean;
  is_mandatory?: boolean;
  is_pii?: boolean;
  is_audited?: boolean;
  is_searchable?: boolean;
  is_exportable?: boolean;
  sort_order?: number;
}

export interface FieldUpdate {
  label?: string;
  field_type?: string;
  field_group_name?: string;
  placeholder?: string;
  help_tooltip?: string;
  default_value?: string;
  min_value?: string;
  max_value?: string;
  system_field?: boolean;
  is_visible?: boolean;
  is_mandatory?: boolean;
  is_pii?: boolean;
  is_audited?: boolean;
  is_searchable?: boolean;
  is_exportable?: boolean;
  is_active?: boolean;
  sort_order?: number;
}

export interface DesignerRecord {
  record_id: string;
  module_key: string;
  data: any; // Parsed JSON data
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface RecordCreate {
  module_key: string;
  data: { [key: string]: any };
}

export interface RecordUpdate {
  data: { [key: string]: any };
}

export interface ModuleWithFields {
  module: Module;
  fields: Field[];
}

export interface Section {
  name: string;
  fields: Field[];
}

export interface FormLayout {
  module_key: string;
  module_name?: string;
  sections: Section[];
}

export interface DropdownOption {
  label: string;
  value: string;
  display_order: number;
}

export type FieldType = 
  | 'text' 
  | 'number' 
  | 'date' 
  | 'datetime' 
  | 'boolean' 
  | 'select' 
  | 'multiselect' 
  | 'radio' 
  | 'textarea' 
  | 'email' 
  | 'phone' 
  | 'url';

export type DbType =
  | 'varchar'
  | 'number'
  | 'date'
  | 'boolean'
  | 'text'
  | 'timestamp';

export interface ModuleColumn {
  column_id: number;
  module_id: string;
  column_name: string;
  db_data_type: string;
  db_length?: number;
  db_precision?: number;
  db_scale?: number;
  is_nullable: boolean;
  is_unique: boolean;
  is_primary_key: boolean;
  is_auto_increment: boolean;
  default_value?: string;
  check_constraint?: string;
  foreign_module_id?: string;
  foreign_column_name?: string;
  created_at: string;
}

export interface ModuleColumnCreate {
  module_id: string;
  column_name: string;
  db_data_type: string;
  db_length?: number;
  db_precision?: number;
  db_scale?: number;
  is_nullable?: boolean;
  is_unique?: boolean;
  is_primary_key?: boolean;
  is_auto_increment?: boolean;
  default_value?: string;
  check_constraint?: string;
  foreign_module_id?: string;
  foreign_column_name?: string;
}

export interface ModuleColumnUpdate {
  column_name?: string;
  db_data_type?: string;
  db_length?: number;
  db_precision?: number;
  db_scale?: number;
  is_nullable?: boolean;
  is_unique?: boolean;
  is_primary_key?: boolean;
  is_auto_increment?: boolean;
  default_value?: string;
  check_constraint?: string;
  foreign_module_id?: string;
  foreign_column_name?: string;
}
