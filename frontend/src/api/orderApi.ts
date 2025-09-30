import { api } from './baseApi';
import type { ApiResponse } from './baseApi';

// Types
export interface OrderItem {
  product: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specifications?: {
    color?: string;
    size?: string;
    customization?: string;
  };
  notes?: string;
}

export interface OrderTracking {
  orderPlaced?: {
    date: string;
    notes?: string;
    user?: string;
  };
  orderConfirmed?: {
    date: string;
    notes?: string;
    user?: string;
  };
  supplierContacted?: {
    date: string;
    supplier?: string;
    contactMethod?: string;
    expectedDelivery?: string;
    notes?: string;
    user?: string;
  };
  supplierConfirmed?: {
    date: string;
    confirmedDelivery?: string;
    supplierOrderNumber?: string;
    notes?: string;
    user?: string;
  };
  paymentReceived?: {
    date: string;
    amount: number;
    method: string;
    reference?: string;
    notes?: string;
    user?: string;
  };
  procurementStarted?: {
    date: string;
    purchaseOrderNumber?: string;
    expectedArrival?: string;
    notes?: string;
    user?: string;
  };
  chinaWarehouse?: {
    date: string;
    warehouseLocation?: string;
    receivedQuantity?: Array<{
      product: string;
      quantity: number;
      condition: string;
    }>;
    qualityCheck?: {
      status: 'pending' | 'passed' | 'failed' | 'partial';
      notes?: string;
      images?: string[];
    };
    notes?: string;
    user?: string;
  };
  internationalShipping?: {
    date: string;
    method: 'sea' | 'air' | 'express';
    carrier?: string;
    trackingNumber?: string;
    estimatedArrival?: string;
    shippingCost?: number;
    weight?: number;
    dimensions?: string;
    notes?: string;
    user?: string;
  };
  customsClearance?: {
    date: string;
    clearanceAgent?: string;
    customsValue?: number;
    dutyPaid?: number;
    taxPaid?: number;
    clearanceStatus: 'pending' | 'in_progress' | 'cleared' | 'held';
    notes?: string;
    user?: string;
  };
  localWarehouse?: {
    date: string;
    warehouse?: string;
    receivedQuantity?: Array<{
      product: string;
      quantity: number;
      condition: string;
    }>;
    finalQualityCheck?: {
      status: 'pending' | 'passed' | 'failed' | 'partial';
      notes?: string;
      images?: string[];
    };
    notes?: string;
    user?: string;
  };
  readyForDelivery?: {
    date: string;
    packedBy?: string;
    packingDetails?: string;
    scheduledDelivery?: string;
    notes?: string;
  };
  outForDelivery?: {
    date: string;
    deliveryMethod: 'courier' | 'own_vehicle' | 'customer_pickup';
    deliveryAgent?: string;
    estimatedDelivery?: string;
    trackingNumber?: string;
    notes?: string;
    user?: string;
  };
  delivered?: {
    date: string;
    deliveredTo?: string;
    signature?: string;
    deliveryProof?: string[];
    customerFeedback?: string;
    notes?: string;
    user?: string;
  };
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer: string;
  orderType: 'regular' | 'urgent' | 'sample' | 'wholesale';
  orderSource: 'website' | 'phone' | 'email' | 'walk_in' | 'sales_rep';
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'supplier_contacted' | 'supplier_confirmed' | 
         'payment_pending' | 'payment_received' | 'procurement_started' | 
         'china_warehouse' | 'international_shipping' | 'customs_clearance' | 
         'local_warehouse' | 'ready_for_delivery' | 'out_for_delivery' | 
         'delivered' | 'completed' | 'cancelled' | 'returned' | 'refunded';
  tracking: OrderTracking;
  pricing: {
    subtotal: number;
    discount: number;
    discountType: 'percentage' | 'fixed';
    tax: number;
    taxRate: number;
    shippingCost: number;
    handlingFee: number;
    total: number;
    currency: 'BDT' | 'USD' | 'EUR';
  };
  payment: {
    status: 'pending' | 'partial' | 'paid' | 'overdue' | 'refunded';
    method?: 'cash' | 'bank_transfer' | 'credit_card' | 'mobile_payment' | 'cheque' | 'installment';
    terms: 'cash' | 'net15' | 'net30' | 'net45' | 'net60';
    dueDate?: string;
    paidAmount: number;
    remainingAmount: number;
    installments?: Array<{
      amount: number;
      dueDate: string;
      paidDate?: string;
      status: 'pending' | 'paid' | 'overdue';
    }>;
  };
  shipping: {
    address: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    method?: 'standard' | 'express' | 'overnight' | 'pickup';
    carrier?: string;
    trackingNumber?: string;
    estimatedDelivery?: string;
    actualDelivery?: string;
    cost: number;
    weight?: number;
    dimensions?: string;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: {
    salesRep?: string;
    accountManager?: string;
  };
  communications: Array<{
    _id: string;
    date: string;
    type: 'call' | 'email' | 'sms' | 'whatsapp' | 'note';
    direction: 'inbound' | 'outbound';
    subject?: string;
    content: string;
    user: string;
  }>;
  documents: Array<{
    _id: string;
    name: string;
    type: string;
    url: string;
    uploadDate: string;
    uploadedBy: string;
  }>;
  notes?: string;
  tags: string[];
  timeline: Array<{
    _id: string;
    action: string;
    description: string;
    date: string;
    user: string;
    data?: any;
  }>;
  totalItems: number;
  isOverdue: boolean;
  daysInProgress: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  customer: string;
  orderType?: 'regular' | 'urgent' | 'sample' | 'wholesale';
  orderSource?: 'website' | 'phone' | 'email' | 'walk_in' | 'sales_rep';
  items: Array<{
    product: string;
    quantity: number;
    unitPrice: number;
    specifications?: {
      color?: string;
      size?: string;
      customization?: string;
    };
    notes?: string;
  }>;
  shipping: {
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    method?: 'standard' | 'express' | 'overnight' | 'pickup';
  };
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
  tags?: string[];
}

// API endpoints
export const orderApi = {
  // Order CRUD operations
  getOrders: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    customer?: string;
    priority?: string;
    orderType?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<Order[]>> =>
    api.get('/orders', params),

  getOrder: (orderId: string): Promise<ApiResponse<Order>> =>
    api.get(`/orders/${orderId}`),

  createOrder: (orderData: CreateOrderRequest): Promise<ApiResponse<Order>> =>
    api.post('/orders', orderData),

  updateOrder: (orderId: string, data: Partial<Order>): Promise<ApiResponse<Order>> =>
    api.put(`/orders/${orderId}`, data),

  deleteOrder: (orderId: string): Promise<ApiResponse<null>> =>
    api.delete(`/orders/${orderId}`),

  // Status management
  updateOrderStatus: (orderId: string, data: {
    status: Order['status'];
    notes?: string;
    trackingData?: any;
  }): Promise<ApiResponse<Order>> =>
    api.patch(`/orders/${orderId}/status`, data),

  // Payment management
  addPayment: (orderId: string, data: {
    amount: number;
    method: string;
    reference?: string;
    notes?: string;
  }): Promise<ApiResponse<Order>> =>
    api.post(`/orders/${orderId}/payments`, data),

  getPaymentHistory: (orderId: string): Promise<ApiResponse<Array<{
    _id: string;
    amount: number;
    method: string;
    reference?: string;
    date: string;
    user: string;
    notes?: string;
  }>>> =>
    api.get(`/orders/${orderId}/payments`),

  // Communication management
  addCommunication: (orderId: string, data: {
    type: 'call' | 'email' | 'sms' | 'whatsapp' | 'note';
    direction: 'inbound' | 'outbound';
    subject?: string;
    content: string;
  }): Promise<ApiResponse<Order>> =>
    api.post(`/orders/${orderId}/communications`, data),

  // Document management
  uploadDocument: (orderId: string, formData: FormData): Promise<ApiResponse<Order>> =>
    api.post(`/orders/${orderId}/documents`, formData),

  deleteDocument: (orderId: string, documentId: string): Promise<ApiResponse<Order>> =>
    api.delete(`/orders/${orderId}/documents/${documentId}`),

  // Tracking updates
  updateTracking: (orderId: string, stage: string, data: any): Promise<ApiResponse<Order>> =>
    api.patch(`/orders/${orderId}/tracking/${stage}`, data),

  // Reports and analytics
  getOrderStats: (params?: {
    dateFrom?: string;
    dateTo?: string;
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<ApiResponse<{
    totalOrders: number;
    totalValue: number;
    averageOrderValue: number;
    statusBreakdown: Record<string, number>;
    priorityBreakdown: Record<string, number>;
    monthlyTrends: Array<{
      month: string;
      orders: number;
      value: number;
    }>;
  }>> =>
    api.get('/orders/stats', params),

  getOverdueOrders: (): Promise<ApiResponse<Order[]>> =>
    api.get('/orders/overdue'),

  getOrdersByStatus: (status: Order['status']): Promise<ApiResponse<Order[]>> =>
    api.get(`/orders/status/${status}`),

  // Bulk operations
  bulkUpdateStatus: (orderIds: string[], status: Order['status'], notes?: string): Promise<ApiResponse<{
    updated: number;
    failed: string[];
  }>> =>
    api.post('/orders/bulk/status', { orderIds, status, notes }),

  exportOrders: (params?: {
    format?: 'csv' | 'excel';
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<{ downloadUrl: string }>> =>
    api.post('/orders/export', params),

  // Customer order portal
  submitCustomerOrder: (orderData: {
    customerInfo: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      company?: string;
    };
    items: Array<{
      product: string;
      quantity: number;
      specifications?: {
        color?: string;
        size?: string;
        customization?: string;
      };
      notes?: string;
    }>;
    shipping: {
      address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
      };
      method?: 'standard' | 'express';
    };
    notes?: string;
  }): Promise<ApiResponse<{ orderNumber: string; estimatedTotal: number }>> =>
    api.post('/orders/customer-submit', orderData),
};

export default orderApi;