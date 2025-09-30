import { api } from './baseApi';
import type { ApiResponse } from './baseApi';

// Types
export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: string;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'sales' | 'inventory' | 'accountant' | 'customer_service';
  permissions: Array<{
    module: string;
    actions: string[];
  }>;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  profilePicture?: string;
  isActive: boolean;
  lastLogin?: string;
  emailVerified: boolean;
  fullName: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
  expiresIn: number;
}

// API endpoints
export const authApi = {
  // Authentication
  login: (credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> =>
    api.post('/auth/login', credentials),

  register: (userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> =>
    api.post('/auth/register', userData),

  logout: (): Promise<ApiResponse<null>> =>
    api.post('/auth/logout'),

  refreshToken: (): Promise<ApiResponse<AuthResponse>> =>
    api.post('/auth/refresh'),

  // Profile management
  getProfile: (): Promise<ApiResponse<User>> =>
    api.get('/auth/me'),

  updateProfile: (data: Partial<User>): Promise<ApiResponse<User>> =>
    api.put('/auth/profile', data),

  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ApiResponse<null>> =>
    api.put('/auth/change-password', data),

  // Password reset
  forgotPassword: (email: string): Promise<ApiResponse<null>> =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (data: {
    token: string;
    password: string;
    confirmPassword: string;
  }): Promise<ApiResponse<null>> =>
    api.post('/auth/reset-password', data),

  // Email verification
  verifyEmail: (token: string): Promise<ApiResponse<null>> =>
    api.post('/auth/verify-email', { token }),

  resendVerification: (): Promise<ApiResponse<null>> =>
    api.post('/auth/resend-verification'),

  // User management (admin only)
  getUsers: (params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<User[]>> =>
    api.get('/auth/users', params),

  createUser: (userData: Omit<RegisterRequest, 'confirmPassword'> & {
    role: string;
    permissions?: Array<{ module: string; actions: string[] }>;
  }): Promise<ApiResponse<User>> =>
    api.post('/auth/users', userData),

  updateUser: (userId: string, data: Partial<User>): Promise<ApiResponse<User>> =>
    api.put(`/auth/users/${userId}`, data),

  deleteUser: (userId: string): Promise<ApiResponse<null>> =>
    api.delete(`/auth/users/${userId}`),

  toggleUserStatus: (userId: string): Promise<ApiResponse<User>> =>
    api.patch(`/auth/users/${userId}/toggle-status`),

  // Role and permissions
  getRoles: (): Promise<ApiResponse<Array<{
    role: string;
    permissions: Array<{ module: string; actions: string[] }>;
  }>>> =>
    api.get('/auth/roles'),

  updateUserPermissions: (userId: string, permissions: Array<{
    module: string;
    actions: string[];
  }>): Promise<ApiResponse<User>> =>
    api.put(`/auth/users/${userId}/permissions`, { permissions }),
};

export default authApi;