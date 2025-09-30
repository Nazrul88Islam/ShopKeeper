import { useSelector } from 'react-redux';
import type { RootState } from '../store';

interface Permission {
  module: string;
  actions: string[];
}

interface UseRolePermissionsReturn {
  hasPermission: (module: string, action: string) => boolean;
  hasAnyPermission: (module: string, actions: string[]) => boolean;
  hasRole: (roles: string | string[]) => boolean;
  userRole: string | undefined;
  userPermissions: Permission[];
}

export const useRolePermissions = (): UseRolePermissionsReturn => {
  const { user } = useSelector((state: RootState) => state.auth);

  const hasPermission = (module: string, action: string): boolean => {
    if (!user || !user.permissions) return false;
    
    const modulePermission = user.permissions.find(p => p.module === module);
    return modulePermission ? modulePermission.actions.includes(action) : false;
  };

  const hasAnyPermission = (module: string, actions: string[]): boolean => {
    return actions.some(action => hasPermission(module, action));
  };

  const hasRole = (roles: string | string[]): boolean => {
    if (!user) return false;
    
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    return allowedRoles.includes(user.role);
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasRole,
    userRole: user?.role,
    userPermissions: user?.permissions || []
  };
};