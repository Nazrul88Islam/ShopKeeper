
import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Shield, UserPlus, Key, ToggleLeft, ToggleRight, RefreshCw, AlertCircle, X } from 'lucide-react';
import { roleManagementApi } from '../api/roleManagementApi';
import type { Role } from '../api/roleManagementApi';
import type { ApiResponse } from '../api/baseApi';
import RoleBasedAccess from '../components/RoleBasedAccess';
import { useRolePermissions } from '../hooks/useRolePermissions';

// User interface with username field
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username: string; // Added username field
  email: string;
  role: string;
  isActive: boolean;
  phone?: string;
  lastLogin?: string;
  createdAt: string;
  permissions: {
    module: string;
    actions: string[];
  }[];
}

// Form data interface with username
interface UserFormData {
  firstName: string;
  lastName: string;
  username: string; // Added username field
  email: string;
  password: string;
  role: string;
  phone: string;
}

const UserManagement: React.FC = () => {
  const { hasPermission } = useRolePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPermissions, setShowPermissions] = useState<string | null>(null);
  
  // Role management states
  const [showRoleManagement, setShowRoleManagement] = useState(false);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: [] as { module: string; actions: string[] }[]
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const limit = 10;

  // Form state
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    role: 'sales',
    phone: ''
  });

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, [currentPage, roleFilter, statusFilter, searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response: ApiResponse<User[]> = await roleManagementApi.getUsers({
        page: currentPage,
        limit,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        isActive: statusFilter !== 'all' ? statusFilter === 'active' : undefined,
        search: searchTerm || undefined
      });

      setUsers(response.data);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalUsers(response.pagination?.total || 0);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response: ApiResponse<Role[]> = await roleManagementApi.getRoles();
      setRoles(response.data);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Trim password before submission to prevent authentication failures
      const userData = {
        ...formData,
        password: formData.password.trim(),
        username: formData.username.trim(),
        email: formData.email.trim()
      };
      
      await roleManagementApi.createUser(userData);
      setShowCreateForm(false);
      resetForm();
      loadUsers();
      alert('User created successfully!');
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      // Enhanced error handling with detailed information
      let errorMessage = 'Error creating user';
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        
        if (data?.message) {
          errorMessage = data.message;
        } else if (data?.errors && Array.isArray(data.errors)) {
          errorMessage = data.errors.map((err: any) => err.msg || err.message || err).join(', ');
        } else {
          errorMessage = `Server error (${status}): ${data?.error || 'Unknown error'}`;
        }
        
        console.error('Server response:', {
          status,
          statusText: error.response.statusText,
          data
        });
      } else if (error.request) {
        // Network error - request was made but no response
        errorMessage = 'Network error: Unable to connect to server. Please check your connection.';
        console.error('Network error:', error.request);
      } else {
        // Something else happened
        errorMessage = error.message || 'An unexpected error occurred';
        console.error('Unexpected error:', error.message);
      }
      
      alert(`Failed to create user: ${errorMessage}`);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      // Create userData without password field initially
      const { password, ...userDataWithoutPassword } = formData;
      
      // Trim input fields before submission
      const userData: any = {
        ...userDataWithoutPassword,
        username: formData.username.trim(),
        email: formData.email.trim()
      };
      
      // Only include password if it's provided and not empty (for updates)
      if (formData.password && formData.password.trim()) {
        userData.password = formData.password.trim();
      }
      
      console.log('🚀 Updating user with data:', {
        userId: editingUser._id,
        userData,
        hasPassword: !!userData.password
      });
      
      await roleManagementApi.updateUser(editingUser._id, userData);
      setEditingUser(null);
      resetForm();
      loadUsers();
      alert('User updated successfully!');
    } catch (error: any) {
      console.error('Error updating user:', error);
      
      // Enhanced error handling with detailed information
      let errorMessage = 'Error updating user';
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        
        if (data?.message) {
          errorMessage = data.message;
        } else if (data?.errors && Array.isArray(data.errors)) {
          errorMessage = data.errors.map((err: any) => err.msg || err.message || err).join(', ');
        } else {
          errorMessage = `Server error (${status}): ${data?.error || 'Unknown error'}`;
        }
        
        console.error('Server response:', {
          status,
          statusText: error.response.statusText,
          data
        });
      } else if (error.request) {
        // Network error - request was made but no response
        errorMessage = 'Network error: Unable to connect to server. Please check your connection.';
        console.error('Network error:', error.request);
      } else {
        // Something else happened
        errorMessage = error.message || 'An unexpected error occurred';
        console.error('Unexpected error:', error.message);
      }
      
      alert(`Failed to update user: ${errorMessage}`);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      await roleManagementApi.toggleUserStatus(userId);
      loadUsers();
    } catch (error: any) {
      console.error('Error toggling user status:', error);
      
      let errorMessage = 'Error updating user status';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.request) {
        errorMessage = 'Network error: Unable to connect to server';
      }
      
      alert(`Failed to update user status: ${errorMessage}`);
    }
  };

  const handleResetPassword = async (userId: string) => {
    const newPassword = prompt('Enter new password (minimum 6 characters):');
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    try {
      await roleManagementApi.resetUserPassword(userId, newPassword);
      alert('Password reset successfully!');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      
      let errorMessage = 'Error resetting password';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.request) {
        errorMessage = 'Network error: Unable to connect to server';
      }
      
      alert(`Failed to reset password: ${errorMessage}`);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      role: 'sales',
      phone: ''
    });
  };

  const resetRoleForm = () => {
    setRoleFormData({
      name: '',
      displayName: '',
      description: '',
      permissions: []
    });
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await roleManagementApi.createRole({
        name: roleFormData.name,
        displayName: roleFormData.displayName,
        description: roleFormData.description,
        permissions: roleFormData.permissions
      });
      setShowCreateRole(false);
      resetRoleForm();
      loadRoles();
      alert('Role created successfully!');
    } catch (error: any) {
      console.error('Error creating role:', error);
      alert(error.response?.data?.message || 'Error creating role');
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;
    
    try {
      await roleManagementApi.updateRole(editingRole._id!, {
        displayName: roleFormData.displayName,
        description: roleFormData.description,
        permissions: roleFormData.permissions
      });
      setEditingRole(null);
      resetRoleForm();
      loadRoles();
      alert('Role updated successfully!');
    } catch (error: any) {
      console.error('Error updating role:', error);
      alert(error.response?.data?.message || 'Error updating role');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role? Users with this role will need to be reassigned.')) {
      return;
    }
    
    try {
      await roleManagementApi.deleteRole(roleId);
      loadRoles();
      alert('Role deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting role:', error);
      alert(error.response?.data?.message || 'Error deleting role');
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      phone: user.phone || ''
    });
    setShowCreateForm(true);
  };

  const startEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleFormData({
      name: role.name,
      displayName: role.displayName,
      description: role.description || '',
      permissions: role.permissions || []
    });
    setShowCreateRole(true);
  };

  const getRoleDisplayName = (roleName: string) => {
    const role = roles.find(r => r.name === roleName);
    return role?.displayName || roleName;
  };

  const getRoleColor = (roleName: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      sales: 'bg-green-100 text-green-800',
      inventory: 'bg-purple-100 text-purple-800',
      accountant: 'bg-yellow-100 text-yellow-800',
      customer_service: 'bg-indigo-100 text-indigo-800'
    };
    return colors[roleName as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Access Check */}
      <RoleBasedAccess 
        module="users" 
        action="read"
        fallback={
          <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
            <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600 mb-4">
              You don't have permission to access user management.
            </p>
            <p className="text-sm text-gray-500">
              Please contact your administrator if you need access to this section.
            </p>
          </div>
        }
      >
        <></>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage users, roles, and permissions</p>
        </div>
        <div className="flex space-x-3">
          <RoleBasedAccess module="users" action="create">
            <button
              onClick={() => setShowRoleManagement(!showRoleManagement)}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Shield className="w-4 h-4 mr-2" />
              {showRoleManagement ? 'Hide' : 'Manage'} Roles
            </button>
          </RoleBasedAccess>
          <RoleBasedAccess module="users" action="create">
            <button
              onClick={() => {
                resetForm();
                setEditingUser(null);
                setShowCreateForm(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </button>
          </RoleBasedAccess>
        </div>
      </div>

      {/* Role Management Section */}
      {showRoleManagement && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Role Management</h2>
            <RoleBasedAccess module="users" action="create">
              <button
                onClick={() => {
                  resetRoleForm();
                  setEditingRole(null);
                  setShowCreateRole(true);
                }}
                className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Role
              </button>
            </RoleBasedAccess>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <div key={role._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{role.displayName}</h3>
                    <p className="text-sm text-gray-500">@{role.name}</p>
                  </div>
                  {!role.isSystem && (
                    <RoleBasedAccess module="users" action="update">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => startEditRole(role)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Edit Role"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <RoleBasedAccess module="users" action="delete">
                          <button
                            onClick={() => handleDeleteRole(role._id!)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete Role"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </RoleBasedAccess>
                      </div>
                    </RoleBasedAccess>
                  )}
                </div>
                
                {role.description && (
                  <p className="text-sm text-gray-600 mb-2">{role.description}</p>
                )}
                
                <div className="text-xs text-gray-500">
                  {role.permissions?.length || 0} permissions
                  {role.isSystem && <span className="ml-2 text-blue-600">• System Role</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Users
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              {roles.map(role => (
                <option key={role.name} value={role.name}>{role.displayName}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{totalUsers}</span> users found
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.phone && (
                            <div className="text-sm text-gray-500">{user.phone}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">@{user.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                        {getRoleDisplayName(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <RoleBasedAccess module="users" action="update">
                        <button
                          onClick={() => handleToggleStatus(user._id)}
                          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                            user.isActive 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {user.isActive ? (
                            <><ToggleRight className="w-3 h-3 mr-1" /> Active</>
                          ) : (
                            <><ToggleLeft className="w-3 h-3 mr-1" /> Inactive</>
                          )}
                        </button>
                      </RoleBasedAccess>
                      <RoleBasedAccess module="users" action="read" fallback={
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      }>
                        <></>
                      </RoleBasedAccess>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <RoleBasedAccess module="users" action="read">
                          <button
                            onClick={() => setShowPermissions(showPermissions === user._id ? null : user._id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Permissions"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                        </RoleBasedAccess>
                        <RoleBasedAccess module="users" action="update">
                          <button
                            onClick={() => startEdit(user)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </RoleBasedAccess>
                        <RoleBasedAccess module="users" action="update">
                          <button
                            onClick={() => handleResetPassword(user._id)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                        </RoleBasedAccess>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * limit + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * limit, totalUsers)}</span> of{' '}
                  <span className="font-medium">{totalUsers}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Permissions Modal */}
      {showPermissions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">User Permissions</h3>
                <button
                  onClick={() => setShowPermissions(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              {(() => {
                const user = users.find(u => u._id === showPermissions);
                return user ? (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600 mb-4">
                      <strong>{user.firstName} {user.lastName}</strong> - {getRoleDisplayName(user.role)}
                    </div>
                    
                    {user.permissions.map((permission, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2 capitalize">
                          {permission.module.replace('_', ' ')}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {permission.actions.map((action, actionIndex) => (
                            <span
                              key={actionIndex}
                              className="inline-flex px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800"
                            >
                              {action}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit User Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingUser ? 'Edit User' : 'Create New User'}
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter username"
                      pattern="^[a-zA-Z0-9_]+$"
                      title="Username can only contain letters, numbers, and underscores"
                      minLength={3}
                      maxLength={30}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  {!editingUser && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        required={!editingUser}
                        minLength={6}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      required
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {roles.map(role => (
                        <option key={role.name} value={role.name}>
                          {role.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create/Edit Role Modal */}
      {showCreateRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <form onSubmit={editingRole ? handleUpdateRole : handleCreateRole}>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingRole ? 'Edit Role' : 'Create New Role'}
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role Name * {editingRole && <span className="text-gray-500">(cannot be changed)</span>}
                      </label>
                      <input
                        type="text"
                        required
                        disabled={!!editingRole}
                        value={roleFormData.name}
                        onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value.toLowerCase().replace(/[^a-z_]/g, '') })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                        placeholder="e.g., sales_rep"
                        pattern="^[a-z_]+$"
                        title="Only lowercase letters and underscores allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={roleFormData.displayName}
                        onChange={(e) => setRoleFormData({ ...roleFormData, displayName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="e.g., Sales Representative"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={roleFormData.description}
                      onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Role description and responsibilities"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Permissions
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {['users', 'orders', 'customers', 'products', 'inventory', 'suppliers', 'accounting', 'reports', 'settings'].map(module => {
                        const modulePermission = roleFormData.permissions.find(p => p.module === module);
                        return (
                          <div key={module} className="border rounded-lg p-3">
                            <h4 className="font-medium text-gray-900 mb-2 capitalize">{module.replace('_', ' ')}</h4>
                            <div className="space-y-1">
                              {['create', 'read', 'update', 'delete'].map(action => {
                                const isChecked = modulePermission?.actions.includes(action) || false;
                                return (
                                  <label key={action} className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const newPermissions = [...roleFormData.permissions];
                                        const moduleIndex = newPermissions.findIndex(p => p.module === module);
                                        
                                        if (moduleIndex === -1) {
                                          if (e.target.checked) {
                                            newPermissions.push({ module, actions: [action] });
                                          }
                                        } else {
                                          const currentActions = newPermissions[moduleIndex].actions;
                                          if (e.target.checked) {
                                            if (!currentActions.includes(action)) {
                                              newPermissions[moduleIndex].actions.push(action);
                                            }
                                          } else {
                                            newPermissions[moduleIndex].actions = currentActions.filter(a => a !== action);
                                            if (newPermissions[moduleIndex].actions.length === 0) {
                                              newPermissions.splice(moduleIndex, 1);
                                            }
                                          }
                                        }
                                        
                                        setRoleFormData({ ...roleFormData, permissions: newPermissions });
                                      }}
                                      className="mr-2"
                                    />
                                    <span className="text-sm capitalize">{action}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateRole(false);
                    setEditingRole(null);
                    resetRoleForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </RoleBasedAccess>
    </div>
  );
};

export default UserManagement;