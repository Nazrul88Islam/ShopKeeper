import { api } from './baseApi';

export interface Permission {
  module: string;
  actions: string[];
}

export interface Role {
  _id?: string;
  name: string;
  displayName: string;
  description?: string;
  permissions: Permission[];
  isSystem?: boolean;
  isActive?: boolean;
  userCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRoleRequest {
  name: string;
  displayName: string;
  description?: string;
  permissions: Permission[];
}

export interface UpdateRoleRequest {
  displayName?: string;
  description?: string;
  permissions?: Permission[];
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  password?: string;
  role?: string;
  phone?: string;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  phone?: string;
  lastLogin?: string;
  createdAt: string;
  permissions: Permission[];
}

export const roleManagementApi = {
  // Get all roles
  getRoles: (): Promise<{ success: boolean; data: Role[] }> =>
    api.get('/role-management/roles'),

  // Create new role
  createRole: (data: CreateRoleRequest): Promise<{ success: boolean; data: Role }> =>
    api.post('/role-management/roles', data),

  // Update role
  updateRole: (id: string, data: UpdateRoleRequest): Promise<{ success: boolean; data: Role }> =>
    api.put(`/role-management/roles/${id}`, data),

  // Delete role
  deleteRole: (id: string): Promise<{ success: boolean; data?: any; message?: string }> =>
    api.delete(`/role-management/roles/${id}`),

  // User management endpoints
  getUsers: (params?: {
    page?: number;
    limit?: number;
    role?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<{ success: boolean; data: User[]; pagination?: any }> =>
    api.get('/role-management/users', params),

  createUser: (data: CreateUserRequest): Promise<{ success: boolean; data: User }> =>
    api.post('/role-management/users', data),

  updateUser: (id: string, data: UpdateUserRequest): Promise<{ success: boolean; data: User }> =>
    api.put(`/role-management/users/${id}`, data),

  toggleUserStatus: (id: string): Promise<{ success: boolean; data: User }> =>
    api.patch(`/role-management/users/${id}/toggle-status`),

  resetUserPassword: (id: string, newPassword: string): Promise<{ success: boolean; data?: any; message?: string }> =>
    api.patch(`/role-management/users/${id}/reset-password`, { newPassword }),

  updateUserPermissions: (id: string, permissions: Permission[]): Promise<{ success: boolean; data: User }> =>
    api.patch(`/role-management/users/${id}/permissions`, { permissions }),
};

export default roleManagementApi;