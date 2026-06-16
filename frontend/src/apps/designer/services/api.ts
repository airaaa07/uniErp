import axios from 'axios';
import type {
  User,
  Role,
  AuditLog,
  AppSetting,
  LoginRequest,
  LoginResponse,
  ChangePasswordRequest,
  Module,
  ModuleCreate,
  ModuleUpdate,
  Field,
  FieldCreate,
  FieldUpdate,
  DesignerRecord as Record,
  RecordCreate,
  RecordUpdate,
  ModuleWithFields,
  FormLayout,
  ModuleColumn,
  ModuleColumnCreate,
  ModuleColumnUpdate
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const DESIGNER_API_BASE_URL = `${API_BASE_URL}/designer`;

const api = axios.create({
  baseURL: DESIGNER_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${DESIGNER_API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          
          const { access_token, refresh_token: newRefreshToken } = response.data;
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', newRefreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/designer/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),
  logout: (refreshToken: string) => api.post('/auth/logout', { refresh_token: refreshToken }),
  getCurrentUser: () => api.get<User>('/auth/me'),
  changePassword: (data: ChangePasswordRequest) => api.post('/auth/change-password', data),
};

export const userAPI = {
  getAll: (search?: string) => api.get<User[]>(`/users${search ? `?search=${search}` : ''}`),
  getById: (id: number) => api.get<User>(`/users/${id}`),
  create: (data: any) => api.post<User>('/users', data),
  update: (id: number, data: any) => api.put<User>(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
  disable: (id: number) => api.patch(`/users/${id}/disable`),
  assignRole: (id: number, roleId: number) => api.post(`/users/${id}/roles`, { role_id: roleId }),
  removeRole: (id: number, roleId: number) => api.delete(`/users/${id}/roles`, { data: { role_id: roleId } }),
};

export const roleAPI = {
  getAll: () => api.get<Role[]>('/roles'),
  getById: (id: number) => api.get<Role>(`/roles/${id}`),
  create: (data: any) => api.post<Role>('/roles', data),
  update: (id: number, data: any) => api.put<Role>(`/roles/${id}`, data),
  delete: (id: number) => api.delete(`/roles/${id}`),
  assignPermission: (id: number, permissionId: number) => api.post(`/roles/${id}/permissions`, { permission_id: permissionId }),
  removePermission: (id: number, permissionId: number) => api.delete(`/roles/${id}/permissions`, { data: { permission_id: permissionId } }),
};

export const auditAPI = {
  getAll: (limit?: number, offset?: number) => api.get<AuditLog[]>(`/audit?limit=${limit || 50}&offset=${offset || 0}`),
  getByEntity: (entity: string, limit?: number, offset?: number) => api.get<AuditLog[]>(`/audit/entity?entity=${entity}&limit=${limit || 50}&offset=${offset || 0}`),
  getMyLogs: (limit?: number, offset?: number) => api.get<AuditLog[]>(`/audit/my-logs?limit=${limit || 50}&offset=${offset || 0}`),
};

export const settingsAPI = {
  getAll: () => api.get<AppSetting[]>('/settings'),
  getById: (id: number) => api.get<AppSetting>(`/settings/${id}`),
  getByKey: (key: string) => api.get<AppSetting>(`/settings/key/${key}`),
  create: (data: any) => api.post<AppSetting>('/settings', data),
  update: (id: number, data: any) => api.put<AppSetting>(`/settings/${id}`, data),
  updateByKey: (key: string, data: any) => api.put<AppSetting>(`/settings/key/${key}`, data),
  delete: (id: number) => api.delete(`/settings/${id}`),
};

// ==================== DESIGNER STUDIO API ====================

export const designerAPI = {
  // Module Operations
  createModule: (data: ModuleCreate) => api.post<Module>('/modules', data),
  getAllModules: () => api.get<Module[]>('/modules'),
  getModule: (moduleKey: string) => api.get<Module>(`/modules/${moduleKey}`),
  updateModule: (moduleKey: string, data: ModuleUpdate) => api.put<Module>(`/modules/${moduleKey}`, data),
  deleteModule: (moduleKey: string) => api.delete(`/modules/${moduleKey}`),
  getModuleWithFields: (moduleKey: string) => api.get<ModuleWithFields>(`/modules/${moduleKey}/with-fields`),

  // Field Operations
  createField: (data: FieldCreate) => api.post<Field>('/fields', data),
  getField: (fieldId: number) => api.get<Field>(`/fields/${fieldId}`),
  getFieldsByModule: (moduleKey: string) => api.get<Field[]>(`/modules/${moduleKey}/fields`),
  updateField: (fieldId: number, data: FieldUpdate) => api.put<Field>(`/fields/${fieldId}`, data),
  deleteField: (fieldId: number) => api.delete(`/fields/${fieldId}`),
  updateFieldOrder: (fieldId: number, sortOrder: number) => api.put(`/fields/${fieldId}/order`, { sort_order: sortOrder }),

  // Record Operations (Still present on designer side for testing/viewing layout records)
  createRecord: (data: RecordCreate) => api.post<Record>('/records', data),
  getRecord: (recordId: string) => api.get<Record>(`/records/${recordId}`),
  getRecordsByModule: (moduleKey: string, search?: string) => api.get<Record[]>(`/modules/${moduleKey}/records${search ? `?search=${search}` : ''}`),
  updateRecord: (recordId: string, data: RecordUpdate) => api.put<Record>(`/records/${recordId}`, data),
  deleteRecord: (recordId: string) => api.delete(`/records/${recordId}`),

  // Form Layout Operations
  getFormLayout: (moduleKey: string) => api.get<FormLayout>(`/modules/${moduleKey}/layout`),

  // Module Column Operations
  createModuleColumn: (data: ModuleColumnCreate) => api.post<ModuleColumn>('/module-columns', data),
  getReferenceColumns: (moduleKey: string) => api.get(`/modules/${moduleKey}/reference-columns`),
  getModuleColumn: (columnId: number) => api.get<ModuleColumn>(`/module-columns/${columnId}`),
  getModuleColumnsByModule: (moduleKey: string) => api.get<ModuleColumn[]>(`/modules/${moduleKey}/columns`),
  updateModuleColumn: (columnId: number, data: ModuleColumnUpdate) => api.put<ModuleColumn>(`/module-columns/${columnId}`, data),
  deleteModuleColumn: (columnId: number) => api.delete(`/module-columns/${columnId}`),

  // Field Group Operations
  // Returns system-seeded modules (the real data-model tables) that can be used as field group sources.
  // Pass excludeModuleKey to filter out the current module.
  getFieldGroupSources: (excludeModuleKey?: string) =>
    api.get<import('../types').Module[]>(`/field-group-sources${excludeModuleKey ? `?exclude=${excludeModuleKey}` : ''}`),
  // Returns PK/UNIQUE columns of a module — the valid join-key candidates.
  getFieldGroupColumns: (moduleKey: string) =>
    api.get<ModuleColumn[]>(`/modules/${moduleKey}/field-group-columns`),
};

export default api;
