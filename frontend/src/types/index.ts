// User & Authentication Types
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'sales' | 'inventory' | 'accountant' | 'customer_service';
  permissions: Permission[];
  phone?: string;
  isActive: boolean;
  lastLogin?: Date;
  fullName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  module: 'orders' | 'inventory' | 'customers' | 'suppliers' | 'warehouses' | 'accounting' | 'reports' | 'users' | 'settings' | 'products';
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface LoginRequest {
  username: string;
  password: string;
}

// Order Types
export interface Order {
  _id: string;
  orderNumber: string;
  customer: string;
  status: OrderStatus;
  items: OrderItem[];
  pricing: {
    subtotal: number;
    total: number;
    currency: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  product: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'supplier_contacted'
  | 'china_warehouse'
  | 'international_shipping'
  | 'local_warehouse'
  | 'delivered'
  | 'completed';

// Customer Types
export interface Customer {
  _id: string;
  customerCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'suspended';
  totalOrders: number;
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

// Dashboard Types
export interface DashboardStats {
  totalOrders: number;
  totalSales: number;
  totalCustomers: number;
  lowStockItems: number;
}

// Form Types
export interface LoginFormData {
  username: string;
  password: string;
}

export interface CustomerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}