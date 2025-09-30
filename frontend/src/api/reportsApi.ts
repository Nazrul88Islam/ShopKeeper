import { api } from './baseApi';
import type { ApiResponse } from './baseApi';

// Enhanced Report Types for Real-time Data
export interface InventoryReport {
  summary: {
    totalProducts: number;
    totalValue: number;
    totalQuantity: number;
    lowStockItems: number;
    outOfStockItems: number;
    averageProductValue: number;
  };
  products: Array<{
    _id: string;
    productCode: string;
    productName: string;
    category: string;
    currentStock: number;
    minStock: number;
    maxStock: number;
    unitPrice: number;
    totalValue: number;
    stockStatus: 'healthy' | 'low' | 'out';
    lastUpdated: string;
  }>;
  topMovingProducts: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
  }>;
  slowMovingProducts: Array<{
    productId: string;
    productName: string;
    daysInStock: number;
    currentStock: number;
  }>;
  stockMovements: Array<{
    date: string;
    productId: string;
    quantity: number;
    type: string;
  }>;
  categoryBreakdown: Array<{
    _id: string;
    count: number;
    totalValue: number;
    totalQuantity: number;
  }>;
  warehouseBreakdown: Array<{
    warehouseName: string;
    warehouseCode: string;
    totalProducts: number;
    totalValue: number;
  }>;
  period: {
    from: string;
    to: string;
  };
}

export interface SalesReport {
  summary: {
    totalSales: number;
    totalOrders: number;
    totalItems: number;
    averageOrderValue: number;
    maxOrderValue: number;
    minOrderValue: number;
    salesGrowthRate: number;
    ordersGrowthRate: number;
    conversionRate: number;
    cartAbandonmentRate: number;
  };
  comparison: {
    current: {
      sales: number;
      orders: number;
      period: string;
    };
    previous: {
      sales: number;
      orders: number;
      period: string;
    };
  };
  topProducts: Array<{
    productId: string;
    productName: string;
    totalSold: number;
    totalRevenue: number;
    averagePrice: number;
    orderCount: number;
    revenuePercentage: number;
  }>;
  salesByPeriod: Array<{
    period: string;
    sales: number;
    orders: number;
    avgOrderValue: number;
  }>;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    customerEmail: string;
    totalOrders: number;
    totalSpent: number;
    avgOrderValue: number;
    lastOrderDate: string;
    customerLifespan: number;
  }>;
  salesByChannel: Array<{
    channel: string;
    totalSales: number;
    totalOrders: number;
    avgOrderValue: number;
    salesPercentage: number;
  }>;
  salesByRegion: Array<{
    region: string;
    totalSales: number;
    totalOrders: number;
    avgOrderValue: number;
    salesPercentage: number;
  }>;
  period: {
    from: string;
    to: string;
    type: string;
  };
}

// Enhanced Reports API
export const reportsApi = {
  // Inventory Report
  getInventoryReport: (params?: {
    dateFrom?: string;
    dateTo?: string;
    warehouseId?: string;
    category?: string;
    stockStatus?: string;
  }): Promise<ApiResponse<InventoryReport>> =>
    api.get('/reports/inventory', params),

  // Sales Report
  getSalesReport: (params?: {
    period?: string;
    dateFrom?: string;
    dateTo?: string;
    salesRep?: string;
    channel?: string;
    region?: string;
  }): Promise<ApiResponse<SalesReport>> =>
    api.get('/reports/sales', params),

  // Trial Balance
  getTrialBalance: (params?: {
    asOfDate?: string;
    fiscalYear?: number;
    fiscalPeriod?: number;
    includeZeroBalances?: boolean;
  }): Promise<ApiResponse<{
    accounts: Array<{
      _id: string;
      accountCode: string;
      accountName: string;
      accountType: string;
      accountCategory: string;
      normalBalance: string;
      debitBalance: number;
      creditBalance: number;
      netBalance: number;
      debitTotal: number;
      creditTotal: number;
      transactionCount: number;
    }>;
    accountsByType: any;
    subtotals: any;
    summary: {
      totalDebits: number;
      totalCredits: number;
      difference: number;
      isBalanced: boolean;
      totalAccounts: number;
      asOfDate: string;
      generatedAt: string;
    };
    accountingEquation: {
      assets: number;
      liabilities: number;
      equity: number;
      isValid: boolean;
    };
    profitLoss: {
      revenue: number;
      expenses: number;
      netIncome: number;
    };
  }>> =>
    api.get('/reports/trial-balance', params),

  // General Ledger
  getGeneralLedger: (params?: {
    accountId?: string;
    dateFrom?: string;
    dateTo?: string;
    includeOpeningBalance?: boolean;
  }): Promise<ApiResponse<{
    type: 'summary' | 'detailed';
    account?: {
      _id: string;
      accountCode: string;
      accountName: string;
      accountType: string;
      accountCategory: string;
      normalBalance: string;
    };
    accounts?: Array<{
      account: any;
      summary: any;
    }>;
    entries?: Array<{
      date: string;
      voucherNumber: string;
      voucherType: string;
      description: string;
      entryDescription: string;
      referenceNumber: string;
      debitAmount: number;
      creditAmount: number;
      balance: number;
      department?: string;
      project?: string;
      costCenter?: string;
    }>;
    summary?: {
      openingBalance: number;
      totalDebits: number;
      totalCredits: number;
      netMovement: number;
      closingBalance: number;
      transactionCount: number;
    };
    period: {
      from: string;
      to: string;
    };
  }>> =>
    api.get('/reports/general-ledger', params),

  // Summary Report
  getSummaryReport: (params?: {
    period?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<any>> =>
    api.get('/reports/summary', params),

  // Customer Report
  getCustomerReport: (params?: {
    dateFrom?: string;
    dateTo?: string;
    customerType?: string;
    location?: string;
  }): Promise<ApiResponse<any>> =>
    api.get('/reports/customers', params),

  // Financial Reports
  getProfitLossStatement: (params?: {
    dateFrom?: string;
    dateTo?: string;
    format?: 'detailed' | 'summary';
  }): Promise<ApiResponse<any>> =>
    api.get('/reports/profit-loss', params),

  getBalanceSheet: (params?: {
    asOfDate?: string;
    format?: 'detailed' | 'summary';
  }): Promise<ApiResponse<any>> =>
    api.get('/reports/balance-sheet', params),

  getCashFlowStatement: (params?: {
    dateFrom?: string;
    dateTo?: string;
    method?: 'direct' | 'indirect';
  }): Promise<ApiResponse<any>> =>
    api.get('/reports/cash-flow', params),

  // Dashboard Metrics
  getDashboardMetrics: (params?: {
    period?: '24h' | '7d' | '30d' | '90d';
  }): Promise<ApiResponse<any>> =>
    api.get('/reports/dashboard-metrics', params),

  // Export Functions
  exportReport: (reportType: string, params?: {
    format: 'pdf' | 'excel' | 'csv';
    dateFrom?: string;
    dateTo?: string;
    filters?: Record<string, any>;
  }): Promise<ApiResponse<{ downloadUrl: string }>> =>
    api.post('/reports/export', { reportType, ...params }),
};

export default reportsApi;