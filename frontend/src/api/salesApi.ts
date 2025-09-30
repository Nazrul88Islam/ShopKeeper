import { api } from './baseApi';
import type { ApiResponse } from './baseApi';

// Types
export interface Sale {
  _id: string;
  saleNumber: string;
  saleType: 'CASH' | 'CREDIT' | 'RETURN' | 'EXCHANGE';
  customer: string;
  salesPerson: string;
  warehouse: string;
  items: Array<{
    _id: string;
    product: string;
    productName: string;
    productCode: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    discountType: 'PERCENTAGE' | 'FIXED';
    tax: number;
    taxRate: number;
    lineTotal: number;
    cost: number;
    profit: number;
    notes?: string;
  }>;
  pricing: {
    subtotal: number;
    totalDiscount: number;
    totalTax: number;
    shippingCost: number;
    handlingFee: number;
    adjustmentAmount: number;
    grandTotal: number;
    totalCost: number;
    totalProfit: number;
    profitMargin: number;
  };
  payment: {
    method: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_PAYMENT' | 'CHEQUE' | 'CREDIT';
    status: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'REFUNDED';
    totalReceived: number;
    changeGiven: number;
    remainingBalance: number;
    dueDate?: string;
    creditTerms: 'NET15' | 'NET30' | 'NET45' | 'NET60';
    referenceNumber?: string;
    bankAccount?: string;
    chequeNumber?: string;
    chequeDate?: string;
  };
  saleDate: string;
  deliveryDate?: string;
  expectedDeliveryDate?: string;
  status: 'DRAFT' | 'CONFIRMED' | 'PROCESSING' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'RETURNED' | 'REFUNDED';
  inventoryUpdated: boolean;
  inventoryTransactions: Array<{
    _id: string;
    product: string;
    warehouse: string;
    quantity: number;
    type: 'OUT' | 'RETURN';
    date: string;
  }>;
  delivery: {
    method?: 'PICKUP' | 'DELIVERY' | 'SHIPPING';
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    carrier?: string;
    trackingNumber?: string;
    shippingCost?: number;
    deliveryInstructions?: string;
  };
  returns: Array<{
    _id: string;
    returnDate: string;
    reason: 'DEFECTIVE' | 'WRONG_ITEM' | 'DAMAGED' | 'CUSTOMER_CHANGE' | 'WARRANTY' | 'OTHER';
    items: Array<{
      product: string;
      quantity: number;
      reason?: string;
      condition: 'NEW' | 'GOOD' | 'DAMAGED' | 'DEFECTIVE';
      refundAmount: number;
    }>;
    totalRefund: number;
    processedBy: string;
    notes?: string;
  }>;
  discounts: Array<{
    _id: string;
    type: 'PERCENTAGE' | 'FIXED' | 'COUPON' | 'LOYALTY' | 'BULK';
    name?: string;
    code?: string;
    amount: number;
    appliedTo: 'TOTAL' | 'ITEM' | 'CATEGORY';
    description?: string;
  }>;
  customerInfo: {
    name?: string;
    email?: string;
    phone?: string;
    loyaltyPoints?: number;
    customerType?: string;
  };
  createdBy: string;
  modifiedBy?: string;
  voidedBy?: string;
  voidedDate?: string;
  voidReason?: string;
  channel: 'POS' | 'ONLINE' | 'PHONE' | 'EMAIL' | 'WALK_IN';
  source?: 'DIRECT' | 'REFERRAL' | 'MARKETING' | 'SOCIAL_MEDIA' | 'OTHER';
  tags: string[];
  notes?: string;
  internalNotes?: string;
  integrationRefs: {
    orderNumber?: string;
    invoiceNumber?: string;
    receiptNumber?: string;
    externalId?: string;
  };
  totalItems: number;
  isOverdue: boolean;
  profitMarginPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSaleRequest {
  saleType?: 'CASH' | 'CREDIT' | 'RETURN' | 'EXCHANGE';
  customer: string;
  warehouse: string;
  items: Array<{
    product: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    discountType?: 'PERCENTAGE' | 'FIXED';
    notes?: string;
  }>;
  payment: {
    method: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_PAYMENT' | 'CHEQUE' | 'CREDIT';
    amountReceived?: number;
    referenceNumber?: string;
    bankAccount?: string;
    chequeNumber?: string;
    chequeDate?: string;
  };
  delivery?: {
    method?: 'PICKUP' | 'DELIVERY' | 'SHIPPING';
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    deliveryInstructions?: string;
  };
  discounts?: Array<{
    type: 'PERCENTAGE' | 'FIXED' | 'COUPON' | 'LOYALTY' | 'BULK';
    name?: string;
    code?: string;
    amount: number;
    appliedTo: 'TOTAL' | 'ITEM' | 'CATEGORY';
  }>;
  channel?: 'POS' | 'ONLINE' | 'PHONE' | 'EMAIL' | 'WALK_IN';
  source?: 'DIRECT' | 'REFERRAL' | 'MARKETING' | 'SOCIAL_MEDIA' | 'OTHER';
  notes?: string;
  tags?: string[];
}

// API endpoints
export const salesApi = {
  // Sales CRUD operations
  getSales: (params?: {
    page?: number;
    limit?: number;
    customer?: string;
    salesPerson?: string;
    warehouse?: string;
    status?: string;
    paymentStatus?: string;
    saleType?: string;
    channel?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<Sale[]>> =>
    api.get('/sales', params),

  getSale: (saleId: string): Promise<ApiResponse<Sale>> =>
    api.get(`/sales/${saleId}`),

  createSale: (saleData: CreateSaleRequest): Promise<ApiResponse<Sale>> =>
    api.post('/sales', saleData),

  updateSale: (saleId: string, data: Partial<CreateSaleRequest>): Promise<ApiResponse<Sale>> =>
    api.put(`/sales/${saleId}`, data),

  deleteSale: (saleId: string): Promise<ApiResponse<null>> =>
    api.delete(`/sales/${saleId}`),

  // Sale status management
  updateSaleStatus: (saleId: string, status: Sale['status'], notes?: string): Promise<ApiResponse<Sale>> =>
    api.patch(`/sales/${saleId}/status`, { status, notes }),

  voidSale: (saleId: string, reason: string): Promise<ApiResponse<Sale>> =>
    api.patch(`/sales/${saleId}/void`, { reason }),

  // Payment processing
  processPayment: (saleId: string, data: {
    amount: number;
    method: string;
    reference?: string;
  }): Promise<ApiResponse<Sale>> =>
    api.post(`/sales/${saleId}/payments`, data),

  getPaymentHistory: (saleId: string): Promise<ApiResponse<Array<{
    _id: string;
    amount: number;
    method: string;
    reference?: string;
    date: string;
    user: string;
  }>>> =>
    api.get(`/sales/${saleId}/payments`),

  // Returns and refunds
  processReturn: (saleId: string, data: {
    items: Array<{
      product: string;
      quantity: number;
      reason?: string;
      condition: 'NEW' | 'GOOD' | 'DAMAGED' | 'DEFECTIVE';
      refundAmount: number;
    }>;
    reason: 'DEFECTIVE' | 'WRONG_ITEM' | 'DAMAGED' | 'CUSTOMER_CHANGE' | 'WARRANTY' | 'OTHER';
    notes?: string;
  }): Promise<ApiResponse<Sale>> =>
    api.post(`/sales/${saleId}/returns`, data),

  processRefund: (saleId: string, data: {
    amount: number;
    method: string;
    reason: string;
    notes?: string;
  }): Promise<ApiResponse<Sale>> =>
    api.post(`/sales/${saleId}/refunds`, data),

  // POS functionality
  createQuickSale: (data: {
    customer?: string;
    items: Array<{
      productBarcode?: string;
      productId?: string;
      quantity: number;
      price?: number;
    }>;
    paymentMethod: string;
    amountReceived: number;
  }): Promise<ApiResponse<Sale>> =>
    api.post('/sales/pos/quick-sale', data),

  searchProductForPOS: (query: string): Promise<ApiResponse<Array<{
    _id: string;
    name: string;
    productCode: string;
    barcode?: string;
    sellingPrice: number;
    currentStock: number;
    image?: string;
  }>>> =>
    api.get('/sales/pos/search-products', { q: query }),

  applyDiscount: (saleId: string, data: {
    type: 'PERCENTAGE' | 'FIXED' | 'COUPON';
    value: number;
    code?: string;
    appliedTo: 'TOTAL' | 'ITEM';
    itemId?: string;
  }): Promise<ApiResponse<Sale>> =>
    api.post(`/sales/${saleId}/discounts`, data),

  // Sales analytics
  getSalesStats: (params?: {
    dateFrom?: string;
    dateTo?: string;
    salesPerson?: string;
    warehouse?: string;
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<ApiResponse<{
    totalSales: number;
    totalProfit: number;
    totalTransactions: number;
    averageTicket: number;
    totalItems: number;
    salesByChannel: Record<string, number>;
    salesByPaymentMethod: Record<string, number>;
    topProducts: Array<{
      product: any;
      quantity: number;
      revenue: number;
    }>;
    salesTrend: Array<{
      date: string;
      sales: number;
      transactions: number;
    }>;
  }>> =>
    api.get('/sales/stats', params),

  getSalesPersonPerformance: (params?: {
    dateFrom?: string;
    dateTo?: string;
    salesPersonId?: string;
  }): Promise<ApiResponse<Array<{
    salesPerson: any;
    totalSales: number;
    totalProfit: number;
    totalTransactions: number;
    averageTicket: number;
    conversionRate: number;
    target: number;
    achievement: number;
  }>>> =>
    api.get('/sales/performance', params),

  getProductSalesReport: (params?: {
    dateFrom?: string;
    dateTo?: string;
    category?: string;
    productId?: string;
  }): Promise<ApiResponse<Array<{
    product: any;
    quantitySold: number;
    revenue: number;
    profit: number;
    averagePrice: number;
    returns: number;
  }>>> =>
    api.get('/sales/product-report', params),

  getCustomerSalesReport: (params?: {
    dateFrom?: string;
    dateTo?: string;
    customerId?: string;
    customerType?: string;
  }): Promise<ApiResponse<Array<{
    customer: any;
    totalSales: number;
    totalTransactions: number;
    averageOrderValue: number;
    lastSaleDate: string;
    loyaltyPoints: number;
  }>>> =>
    api.get('/sales/customer-report', params),

  // Sales targets and quotas
  getSalesTargets: (params?: {
    year?: number;
    quarter?: number;
    month?: number;
    salesPersonId?: string;
  }): Promise<ApiResponse<Array<{
    _id: string;
    salesPerson: any;
    period: string;
    target: number;
    achieved: number;
    percentage: number;
    status: 'not_started' | 'in_progress' | 'achieved' | 'exceeded';
  }>>> =>
    api.get('/sales/targets', params),

  setSalesTarget: (data: {
    salesPerson: string;
    period: string;
    target: number;
    description?: string;
  }): Promise<ApiResponse<any>> =>
    api.post('/sales/targets', data),

  updateSalesTarget: (targetId: string, data: {
    target?: number;
    description?: string;
  }): Promise<ApiResponse<any>> =>
    api.put(`/sales/targets/${targetId}`, data),

  // Commission calculations
  getCommissionReport: (params?: {
    dateFrom?: string;
    dateTo?: string;
    salesPersonId?: string;
  }): Promise<ApiResponse<Array<{
    salesPerson: any;
    totalSales: number;
    commissionRate: number;
    commissionAmount: number;
    bonuses: number;
    totalCommission: number;
    paid: boolean;
  }>>> =>
    api.get('/sales/commissions', params),

  processCommissionPayment: (commissionId: string): Promise<ApiResponse<null>> =>
    api.post(`/sales/commissions/${commissionId}/pay`),

  // Receipts and invoices
  generateReceipt: (saleId: string, format?: 'pdf' | 'html'): Promise<ApiResponse<{
    receiptUrl: string;
    receiptNumber: string;
  }>> =>
    api.post(`/sales/${saleId}/receipt`, { format }),

  generateInvoice: (saleId: string, format?: 'pdf' | 'html'): Promise<ApiResponse<{
    invoiceUrl: string;
    invoiceNumber: string;
  }>> =>
    api.post(`/sales/${saleId}/invoice`, { format }),

  emailReceipt: (saleId: string, email: string): Promise<ApiResponse<null>> =>
    api.post(`/sales/${saleId}/email-receipt`, { email }),

  // Promotions and discounts
  getActivePromotions: (): Promise<ApiResponse<Array<{
    _id: string;
    name: string;
    type: string;
    description: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    minOrderValue?: number;
    validFrom: string;
    validTo: string;
    usageLimit?: number;
    usedCount: number;
    isActive: boolean;
  }>>> =>
    api.get('/sales/promotions'),

  validateCoupon: (couponCode: string, orderValue: number): Promise<ApiResponse<{
    valid: boolean;
    discount: number;
    message: string;
  }>> =>
    api.post('/sales/validate-coupon', { code: couponCode, orderValue }),

  // Loyalty program
  getLoyaltyPoints: (customerId: string): Promise<ApiResponse<{
    currentPoints: number;
    totalEarned: number;
    totalRedeemed: number;
    transactions: Array<{
      date: string;
      type: 'earned' | 'redeemed';
      points: number;
      description: string;
      reference?: string;
    }>;
  }>> =>
    api.get(`/sales/loyalty/${customerId}`),

  redeemLoyaltyPoints: (customerId: string, points: number, saleId?: string): Promise<ApiResponse<{
    pointsRedeemed: number;
    discountAmount: number;
    remainingPoints: number;
  }>> =>
    api.post(`/sales/loyalty/${customerId}/redeem`, { points, saleId }),

  // Bulk operations
  bulkUpdateSales: (saleIds: string[], data: {
    status?: Sale['status'];
    salesPerson?: string;
    tags?: string[];
  }): Promise<ApiResponse<{
    updated: number;
    failed: string[];
  }>> =>
    api.post('/sales/bulk-update', { saleIds, ...data }),

  bulkVoidSales: (saleIds: string[], reason: string): Promise<ApiResponse<{
    voided: number;
    failed: string[];
  }>> =>
    api.post('/sales/bulk-void', { saleIds, reason }),

  exportSales: (params?: {
    format?: 'csv' | 'excel' | 'pdf';
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    includeItems?: boolean;
  }): Promise<ApiResponse<{ downloadUrl: string }>> =>
    api.post('/sales/export', params),

  // Daily operations
  getDailySalesSummary: (date?: string): Promise<ApiResponse<{
    date: string;
    totalSales: number;
    totalTransactions: number;
    totalProfit: number;
    averageTicket: number;
    cashSales: number;
    cardSales: number;
    creditSales: number;
    returns: number;
    voids: number;
    openingCash: number;
    closingCash: number;
    cashVariance: number;
  }>> =>
    api.get('/sales/daily-summary', date ? { date } : {}),

  performCashCount: (data: {
    date: string;
    actualCash: number;
    notes?: string;
  }): Promise<ApiResponse<{
    expectedCash: number;
    actualCash: number;
    variance: number;
    status: 'balanced' | 'over' | 'short';
  }>> =>
    api.post('/sales/cash-count', data),

  closeDailyOperations: (date: string): Promise<ApiResponse<{
    totalSales: number;
    totalTransactions: number;
    cashVariance: number;
    status: 'closed';
  }>> =>
    api.post('/sales/close-day', { date }),
};

export default salesApi;