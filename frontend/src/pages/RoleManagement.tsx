import React, { useState, useEffect } from 'react';
import { Shield, Save, Plus, X, Users, Key, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import RoleBasedAccess from '../components/RoleBasedAccess';
import { roleManagementApi } from '../api/roleManagementApi';

interface Permission {
  module: string;
  actions: string[];
}

interface RoleData {
  _id?: string;
  name: string;
  displayName: string;
  description?: string;
  permissions: Permission[];
  isSystem?: boolean;
  isActive?: boolean;
  userCount?: number;
}

interface RoleFormData {
  name: string;
  displayName: string;
  description: string;
  permissions: Permission[];
}

const availableModules = [
  { name: 'orders', displayName: 'Orders Management' },
  { name: 'customers', displayName: 'Customer Management' },
  { name: 'products', displayName: 'Product Management' },
  { name: 'inventory', displayName: 'Inventory Management' },
  { name: 'warehouse', displayName: 'Warehouse Management' },
  { name: 'suppliers', displayName: 'Supplier Management' },
  { name: 'accounting', displayName: 'Accounting & Finance' },
  { name: 'reports', displayName: 'Reports & Analytics' },
  { name: 'users', displayName: 'User Management' },
  { name: 'settings', displayName: 'System Settings' }
];

const availableActions = ['create', 'read', 'update', 'delete'];

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleData | null>(null);
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    displayName: '',
    description: '',
    permissions: []
  });

  // Load roles from API
  const loadRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading roles from API...');
      const response = await roleManagementApi.getRoles();
      console.log('✅ Roles response:', response);
      
      if (response.success && response.data) {
        setRoles(response.data);
      } else {
        setError('Failed to load roles');
      }
    } catch (err: any) {
      console.error('❌ Error loading roles:', err);
      setError(err.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  // Load roles on component mount
  useEffect(() => {
    loadRoles();
  }, []);

  const handlePermissionChange = (moduleIndex: number, action: string, checked: boolean) => {
    const newPermissions = [...formData.permissions];
    const permission = newPermissions[moduleIndex];
    
    if (checked) {
      if (!permission.actions.includes(action)) {
        permission.actions.push(action);
      }
    } else {
      permission.actions = permission.actions.filter(a => a !== action);
    }
    
    setFormData({ ...formData, permissions: newPermissions });
  };

  const addPermissionModule = (moduleName: string) => {
    const newPermissions = [...formData.permissions];
    if (!newPermissions.find(p => p.module === moduleName)) {
      newPermissions.push({ module: moduleName, actions: [] });
      setFormData({ ...formData, permissions: newPermissions });
    }
  };

  const removePermissionModule = (moduleIndex: number) => {
    const newPermissions = formData.permissions.filter((_, index) => index !== moduleIndex);
    setFormData({ ...formData, permissions: newPermissions });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      permissions: []
    });
    setEditingRole(null);
  };

  const handleSaveRole = async () => {
    if (!formData.name || !formData.displayName) {
      setError('Role name and display name are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      if (editingRole && editingRole._id) {
        // Update existing role
        console.log('🔄 Updating role:', editingRole._id, formData);
        const response = await roleManagementApi.updateRole(editingRole._id, {
          displayName: formData.displayName,
          description: formData.description,
          permissions: formData.permissions
        });
        
        if (response.success) {
          console.log('✅ Role updated successfully');
          alert('Role updated successfully!');
          await loadRoles(); // Reload roles
        } else {
          setError('Failed to update role');
        }
      } else {
        // Create new role
        console.log('🔄 Creating new role:', formData);
        const response = await roleManagementApi.createRole({
          name: formData.name,
          displayName: formData.displayName,
          description: formData.description,
          permissions: formData.permissions
        });
        
        if (response.success) {
          console.log('✅ Role created successfully');
          alert('Role created successfully!');
          await loadRoles(); // Reload roles
        } else {
          setError('Failed to create role');
        }
      }
      
      setShowCreateForm(false);
      resetForm();
    } catch (err: any) {
      console.error('❌ Error saving role:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (role: RoleData) => {
    setFormData({
      name: role.name,
      displayName: role.displayName,
      description: role.description || '',
      permissions: role.permissions || []
    });
    setEditingRole(role);
    setShowCreateForm(true);
  };

  const handleDeleteRole = async (role: RoleData) => {
    if (role.isSystem) {
      alert('System roles cannot be deleted');
      return;
    }

    if (!role._id) {
      alert('Cannot delete role: Invalid role ID');
      return;
    }

    if (confirm(`Are you sure you want to delete the role \"${role.displayName}\"?`)) {
      try {
        setError(null);
        console.log('🔄 Deleting role:', role._id);
        const response = await roleManagementApi.deleteRole(role._id);
        
        if (response.success) {
          console.log('✅ Role deleted successfully');
          alert('Role deleted successfully!');
          await loadRoles(); // Reload roles
        } else {
          setError('Failed to delete role');
        }
      } catch (err: any) {
        console.error('❌ Error deleting role:', err);
        setError(err.response?.data?.message || err.message || 'Failed to delete role');
      }
    }
  };

  return (
    <RoleBasedAccess 
      module="users" 
      action="read"
      fallback={
        <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
          <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600 mb-4">
            You don't have permission to access role management.
          </p>
          <p className="text-sm text-gray-500">
            Please contact your administrator if you need access to this section.
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
            <p className="text-gray-600 mt-1">Define roles and their permissions (Database Integrated)</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={loadRoles}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <RoleBasedAccess module="users" action="create">
              <button
                onClick={() => {
                  resetForm();
                  setShowCreateForm(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Role
              </button>
            </RoleBasedAccess>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
            <p className="ml-2 text-gray-600">Loading roles...</p>
          </div>
        ) : (
          /* Roles Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <div key={role._id || role.name} className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <Shield className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">{role.displayName}</h3>
                      <p className="text-sm text-gray-500">{role.name}</p>
                      {role.isSystem && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded mt-1">
                          System Role
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <RoleBasedAccess module="users" action="update">
                      <button
                        onClick={() => startEdit(role)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Edit Role"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                    </RoleBasedAccess>
                    {!role.isSystem && (
                      <RoleBasedAccess module="users" action="delete">
                        <button
                          onClick={() => handleDeleteRole(role)}
                          className="text-gray-400 hover:text-red-600"
                          title="Delete Role"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </RoleBasedAccess>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{role.description || 'No description provided'}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Modules:</span>
                    <span className="font-medium">{role.permissions?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Total Permissions:</span>
                    <span className="font-medium">
                      {role.permissions?.reduce((total, perm) => total + perm.actions.length, 0) || 0}
                    </span>
                  </div>
                  {role.userCount !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Users:</span>
                      <span className="font-medium">{role.userCount}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-1">
                  {role.permissions?.slice(0, 3).map((permission) => (
                    <span
                      key={permission.module}
                      className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                    >
                      {permission.module}
                    </span>
                  )) || []}
                  {(role.permissions?.length || 0) > 3 && (
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                      +{(role.permissions?.length || 0) - 3} more
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            {roles.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No roles found</p>
                <p className="text-gray-400">Create your first role to get started</p>
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Role Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingRole ? `Edit Role: ${editingRole.displayName}` : 'Create New Role'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      resetForm();
                      setError(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role Name * {editingRole?.isSystem && '(System Role - Cannot Change)'}
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!!editingRole?.isSystem}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                      placeholder="e.g., sales_manager"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., Sales Manager"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Describe what this role can do..."
                  />
                </div>

                {/* Permissions */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900">Permissions</h4>
                    <div className="relative">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            addPermissionModule(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Add Module</option>
                        {availableModules
                          .filter(module => !formData.permissions.find(p => p.module === module.name))
                          .map(module => (
                            <option key={module.name} value={module.name}>
                              {module.displayName}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {formData.permissions.map((permission, index) => {
                      const moduleInfo = availableModules.find(m => m.name === permission.module);
                      return (
                        <div key={permission.module} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium text-gray-900">
                              {moduleInfo?.displayName || permission.module}
                            </h5>
                            <button
                              onClick={() => removePermissionModule(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {availableActions.map(action => (
                              <label key={action} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={permission.actions.includes(action)}
                                  onChange={(e) => handlePermissionChange(index, action, e.target.checked)}
                                  className="mr-2 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm capitalize">{action}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {formData.permissions.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No permissions assigned yet</p>
                        <p className="text-sm">Add modules using the dropdown above</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                    setError(null);
                  }}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRole}
                  disabled={!formData.name || !formData.displayName || saving}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {saving ? 'Saving...' : (editingRole ? 'Update Role' : 'Create Role')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleBasedAccess>
  );
};

export default RoleManagement;