import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { useRolePermissions } from '../hooks/useRolePermissions';
import type { AppDispatch, RootState } from '../store';
import RoleBasedAccess from './RoleBasedAccess';

const Layout: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = useRolePermissions();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  // Dynamic navigation based on permissions
  const navigationItems = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      module: 'orders', 
      action: 'read',
      icon: '📊'
    },
    { 
      name: 'Orders', 
      href: '/orders', 
      module: 'orders', 
      action: 'read',
      icon: '📋'
    },
    { 
      name: 'Customers', 
      href: '/customers', 
      module: 'customers', 
      action: 'read',
      icon: '👥'
    },
    { 
      name: 'Products', 
      href: '/products', 
      module: 'products', 
      action: 'read',
      icon: '📦'
    },
    { 
      name: 'Inventory', 
      href: '/inventory', 
      module: 'inventory', 
      action: 'read',
      icon: '📊'
    },
    { 
      name: 'Suppliers', 
      href: '/suppliers', 
      module: 'suppliers', 
      action: 'read',
      icon: '🏢'
    },
    { 
      name: 'Warehouses', 
      href: '/warehouses', 
      module: 'warehouses', 
      action: 'read',
      icon: '🏭'
    },
    { 
      name: 'Accounting', 
      href: '/accounting', 
      module: 'accounting', 
      action: 'read',
      icon: '💰'
    },
    { 
      name: 'Reports', 
      href: '/reports', 
      module: 'reports', 
      action: 'read',
      icon: '📈'
    },
    { 
      name: 'Users', 
      href: '/users', 
      module: 'users', 
      action: 'read',
      icon: '👤'
    },
    { 
      name: 'Roles', 
      href: '/roles', 
      module: 'users', 
      action: 'create',
      icon: '🔒'
    },
  ];

  // Filter navigation items based on user permissions
  const visibleNavigation = navigationItems.filter(item => 
    hasPermission(item.module, item.action)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-16 items-center justify-between px-6 border-b">
          <h1 className="text-xl font-bold text-gray-900">ShopKeeper</h1>
        </div>
        
        <nav className="mt-6 px-6">
          <div className="space-y-2">
            {visibleNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </NavLink>
            ))}
          </div>
        </nav>
        
        {/* User Role Display */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600">Logged in as:</p>
            <p className="text-sm font-medium text-gray-900 capitalize">{user?.role}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        {/* Top bar */}
        <div className="flex h-16 items-center justify-between bg-white px-6 shadow-sm border-b">
          <div className="flex items-center">
            <h2 className="text-lg font-medium text-gray-900">
              Welcome back, {user?.firstName}
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <RoleBasedAccess module="users" action="create">
              <NavLink 
                to="/roles" 
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Role Management
              </NavLink>
            </RoleBasedAccess>
            <button
              onClick={handleLogout}
              className="btn-secondary"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;