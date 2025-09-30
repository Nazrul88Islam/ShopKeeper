import { api } from './baseApi';
import type { ApiResponse } from './baseApi';

// Dashboard Data Types
export interface DashboardStats {
  totalOrders: {
    count: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
  };
  revenue: {
    total: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
    currency: string;
  };
  products: {
    total: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
  };
  customers: {
    total: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
  };
  pendingOrders: {
    count: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
  };
  inTransit: {
    count: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
  };
  warehouses: {
    total: number;
    active: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
  };
  reports: {
    generated: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
  };
}

export interface RecentOrder {
  _id: string;
  orderNumber: string;
  customer: {
    firstName: string;
    lastName: string;
    fullName: string;
  };
  status: string;
  total: number;
  currency: string;
  createdAt: string;
}

export interface SystemOverview {
  inventoryItems: number;
  activeWarehouses: number;
  teamMembers: number;
  activeShipments: number;
  lowStockItems: number;
  overdueOrders: number;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    fill?: boolean;
  }>;
}

export interface DashboardData {
  stats: DashboardStats;
  recentOrders: RecentOrder[];
  systemOverview: SystemOverview;
  salesChart: ChartData;
  orderChart: ChartData;
}

// Dashboard API
export const dashboardApi = {
  // Get dashboard overview data
  getDashboardData: (params?: {
    period?: 'today' | '7days' | '30days' | '90days' | '1year';
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<DashboardData>> =>
    api.get('/dashboard', params),

  // Get dashboard statistics
  getStats: (params?: {
    period?: 'today' | '7days' | '30days' | '90days' | '1year';
    compare?: boolean;
  }): Promise<ApiResponse<DashboardStats>> =>
    api.get('/dashboard/stats', params),

  // Get recent orders
  getRecentOrders: (params?: {
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<RecentOrder[]>> =>
    api.get('/dashboard/recent-orders', params),

  // Get system overview
  getSystemOverview: (): Promise<ApiResponse<SystemOverview>> =>
    api.get('/dashboard/system-overview'),

  // Get sales chart data
  getSalesChart: (params?: {
    period?: 'today' | '7days' | '30days' | '90days' | '1year';
    groupBy?: 'hour' | 'day' | 'week' | 'month';
  }): Promise<ApiResponse<ChartData>> =>
    api.get('/dashboard/sales-chart', params),

  // Get order trends chart
  getOrderChart: (params?: {
    period?: 'today' | '7days' | '30days' | '90days' | '1year';
    groupBy?: 'hour' | 'day' | 'week' | 'month';
  }): Promise<ApiResponse<ChartData>> =>
    api.get('/dashboard/order-chart', params),

  // Get top performing products
  getTopProducts: (params?: {
    period?: 'today' | '7days' | '30days' | '90days' | '1year';
    limit?: number;
    metric?: 'sales' | 'revenue' | 'quantity';
  }): Promise<ApiResponse<Array<{
    product: any;
    sales: number;
    revenue: number;
    quantity: number;
    growth: number;
  }>>> =>
    api.get('/dashboard/top-products', params),

  // Get customer insights
  getCustomerInsights: (params?: {
    period?: 'today' | '7days' | '30days' | '90days' | '1year';
  }): Promise<ApiResponse<{
    newCustomers: number;
    returningCustomers: number;
    customerGrowth: number;
    averageOrderValue: number;
    customerLifetimeValue: number;
  }>> =>
    api.get('/dashboard/customer-insights', params),

  // Get financial summary
  getFinancialSummary: (params?: {
    period?: 'today' | '7days' | '30days' | '90days' | '1year';
  }): Promise<ApiResponse<{
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    grossMargin: number;
    operatingMargin: number;
    accountsReceivable: number;
    accountsPayable: number;
    cashFlow: number;
  }>> =>
    api.get('/dashboard/financial-summary', params),

  // Get inventory alerts
  getInventoryAlerts: (): Promise<ApiResponse<Array<{
    type: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiry';
    product: any;
    warehouse: any;
    currentStock: number;
    threshold: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    createdAt: string;
  }>>> =>
    api.get('/dashboard/inventory-alerts'),

  // Get order status summary
  getOrderStatusSummary: (): Promise<ApiResponse<Array<{
    status: string;
    count: number;
    percentage: number;
    trend: number;
  }>>> =>
    api.get('/dashboard/order-status-summary'),

  // Get warehouse utilization
  getWarehouseUtilization: (): Promise<ApiResponse<Array<{
    warehouse: any;
    utilizationPercentage: number;
    capacity: number;
    used: number;
    available: number;
    efficiency: number;
  }>>> =>
    api.get('/dashboard/warehouse-utilization'),

  // Export dashboard data
  exportDashboardData: (params: {
    format: 'csv' | 'excel' | 'pdf';
    period?: 'today' | '7days' | '30days' | '90days' | '1year';
    includeCharts?: boolean;
  }): Promise<ApiResponse<{ downloadUrl: string }>> =>
    api.post('/dashboard/export', params),
};

export default dashboardApi;