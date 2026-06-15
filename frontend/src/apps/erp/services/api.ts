import axios from 'axios';
import type {
  User,
  LoginRequest,
  LoginResponse,
  ChangePasswordRequest,
  FormLayout,
  DesignerRecord as Record,
  RecordCreate,
  RecordUpdate,
  ModuleWithFields
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const ERP_API_BASE_URL = `${API_BASE_URL}/erp`;

const api = axios.create({
  baseURL: ERP_API_BASE_URL,
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
          const response = await axios.post(`${ERP_API_BASE_URL}/auth/refresh`, {
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

export const erpRecordAPI = {
  // Record Operations
  createRecord: (data: RecordCreate) => api.post<Record>('/records', data),
  getRecord: (recordId: string) => api.get<Record>(`/records/${recordId}`),
  getRecordsByModule: (moduleKey: string, search?: string) => api.get<Record[]>(`/modules/${moduleKey}/records${search ? `?search=${search}` : ''}`),
  updateRecord: (recordId: string, data: RecordUpdate) => api.put<Record>(`/records/${recordId}`, data),
  deleteRecord: (recordId: string) => api.delete(`/records/${recordId}`),

  // Module Layout schema operations (Read-only for rendering dynamic forms)
  getFormLayout: (moduleKey: string) => api.get<FormLayout>(`/modules/${moduleKey}/layout`),
  getModuleWithFields: (moduleKey: string) => api.get<ModuleWithFields>(`/modules/${moduleKey}/with-fields`),
};

export default api;
