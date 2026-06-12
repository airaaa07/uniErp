import axios from 'axios';
import type { 
  User, 
  Role, 
  AuditLog, 
  AppSetting, 
  LoginRequest, 
  LoginResponse,
  ChangePasswordRequest 
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.14:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
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
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
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
        window.location.href = '/login';
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
  create: (data: any) => api.post<User>('/auth/register', data),
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

export default api;
