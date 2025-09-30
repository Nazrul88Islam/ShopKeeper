import React from 'react';
import { useRolePermissions } from '../hooks/useRolePermissions';

interface RoleBasedAccessProps {
  allowedRoles?: string[];
  module?: string;
  action?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({ 
  allowedRoles = [],
  module,
  action,
  children, 
  fallback = null 
}) => {
  const { hasPermission, hasRole } = useRolePermissions();
  
  // Check permission-based access first (more specific)
  if (module && action) {
    if (!hasPermission(module, action)) {
      return <>{fallback}</>;
    }
    return <>{children}</>;
  }
  
  // Fallback to role-based access
  if (allowedRoles.length > 0) {
    if (!hasRole(allowedRoles)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

export default RoleBasedAccess;