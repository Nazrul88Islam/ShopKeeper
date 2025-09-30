import { api } from './baseApi';
import type { ApiResponse } from './baseApi';

// Order Types
export interface OrderItem {
  _id?: string;
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
    user?: any;
  };
  orderConfirmed?: {
    date: string;
    notes?: string;
    user?: any;
  };
  supplierContacted?: {
    date: string;
    supplier?: any;
    contactMethod?: string;
    expectedDelivery?: string;
    notes?: string;
    user?: any;
  };
  supplierConfirmed?: {
    date: string;
    confirmedDelivery?: string;
    supplierOrderNumber?: string;
    notes?: string;
    user?: any;
  };
  paymentReceived?: {
    date: string;
    amount?: number;
    method?: string;
    reference?: string;
    notes?: string;
    user?: any;
  };
  procurementStarted?: {
    date: string;
    purchaseOrderNumber?: string;
    expectedArrival?: string;
    notes?: string;
    user?: any;
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
    user?: any;
  };
  internationalShipping?: {
    date: string;
    method?: 'sea' | 'air' | 'express';
    carrier?: string;
    trackingNumber?: string;
    estimatedArrival?: string;
    shippingCost?: number;
    weight?: number;
    dimensions?: string;
    notes?: string;
    user?: any;
  };
  customsClearance?: {
    date: string;
    clearanceAgent?: string;
    customsValue?: number;
    dutyPaid?: number;
    taxPaid?: number;
    clearanceStatus?: 'pending' | 'in_progress' | 'cleared' | 'held';
    notes?: string;
    user?: any;
  };
  localWarehouse?: {
    date: string;
    warehouse?: any;
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
    user?: any;
  };
  readyForDelivery?: {
    date: string;
    packedBy?: any;
    packingDetails?: string;
    scheduledDelivery?: string;
    notes?: string;
  };
  outForDelivery?: {
    date: string;
    deliveryMethod?: 'courier' | 'own_vehicle' | 'customer_pickup';
    deliveryAgent?: string;
    estimatedDelivery?: string;
    trackingNumber?: string;
    notes?: string;
    user?: any;
  };
  delivered?: {
    date: string;
    deliveredTo?: string;
    signature?: string;
    deliveryProof?: string[];
    customerFeedback?: string;
    notes?: string;
    user?: any;
  };
}

export interface OrderPricing {
  subtotal: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  tax: number;
  taxRate: number;
  shippingCost: number;
  handlingFee: number;
  total: number;
  currency: 'BDT' | 'USD' | 'EUR';
}

export interface OrderPayment {
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
}

export interface OrderShipping {
  address?: {
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
  cost?: number;
  weight?: number;
  dimensions?: string;
}

export interface OrderCommunication {
  _id?: string;
  date: string;
  type: 'call' | 'email' | 'sms' | 'whatsapp' | 'note';
  direction: 'inbound' | 'outbound';
  subject?: string;
  content: string;
  user?: any;
}

export interface OrderDocument {
  _id?: string;
  name: string;
  type: string;
  url: string;
  uploadDate: string;
  uploadedBy?: any;
}

export interface OrderTimelineEntry {
  _id?: string;
  action: string;
  description: string;
  date: string;
  user?: any;
  data?: any;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer: any; // Customer object or ID
  orderType: 'regular' | 'urgent' | 'sample' | 'wholesale';
  orderSource: 'website' | 'phone' | 'email' | 'walk_in' | 'sales_rep';
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'supplier_contacted' | 'supplier_confirmed' | 
    'payment_pending' | 'payment_received' | 'procurement_started' | 'china_warehouse' | 
    'international_shipping' | 'customs_clearance' | 'local_warehouse' | 'ready_for_delivery' | 
    'out_for_delivery' | 'delivered' | 'completed' | 'cancelled' | 'returned' | 'refunded';
  tracking: OrderTracking;
  pricing: OrderPricing;
  payment: OrderPayment;
  shipping?: OrderShipping;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: {
    salesRep?: any;
    accountManager?: any;
  };
  communications: OrderCommunication[];
  documents: OrderDocument[];
  notes?: string;
  tags: string[];
  timeline: OrderTimelineEntry[];
  createdAt: string;
  updatedAt: string;
  // Virtual fields
  totalItems?: number;
  isOverdue?: boolean;
  daysInProgress?: number;
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
  pricing?: {
    discount?: number;
    discountType?: 'percentage' | 'fixed';
    taxRate?: number;
    shippingCost?: number;
    handlingFee?: number;
  };
  payment?: {
    terms?: 'cash' | 'net15' | 'net30' | 'net45' | 'net60';
    dueDate?: string;
  };
  shipping?: OrderShipping;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: {
    salesRep?: string;
    accountManager?: string;
  };
  notes?: string;
  tags?: string[];
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  orderType?: string;
  customer?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OrderStats {
  total: {
    totalOrders: number;
    totalValue: number;
    averageOrderValue: number;
  };
  byStatus: Array<{
    _id: string;
    count: number;
    totalValue: number;
  }>;
  byPriority: Array<{
    _id: string;
    count: number;
  }>;
}

// Orders API
export const ordersApi = {
  // Get all orders with pagination and filtering
  getOrders: (filters?: OrderFilters): Promise<ApiResponse<Order[]>> =>
    api.get('/orders', filters),

  // Get order by ID
  getOrder: (orderId: string): Promise<ApiResponse<Order>> =>
    api.get(`/orders/${orderId}`),

  // Create new order
  createOrder: (data: CreateOrderRequest): Promise<ApiResponse<Order>> =>
    api.post('/orders', data),

  // Update order
  updateOrder: (orderId: string, data: Partial<CreateOrderRequest>): Promise<ApiResponse<Order>> =>
    api.put(`/orders/${orderId}`, data),

  // Delete order
  deleteOrder: (orderId: string): Promise<ApiResponse<null>> =>
    api.delete(`/orders/${orderId}`),

  // Update order status
  updateOrderStatus: (orderId: string, data: {
    status: string;
    notes?: string;
  }): Promise<ApiResponse<Order>> =>
    api.put(`/orders/${orderId}/status`, data),

  // Add payment to order
  addPayment: (orderId: string, data: {
    amount: number;
    method: 'cash' | 'bank_transfer' | 'credit_card' | 'mobile_payment' | 'cheque';
    reference?: string;
  }): Promise<ApiResponse<Order>> =>
    api.post(`/orders/${orderId}/payment`, data),

  // Add communication to order
  addCommunication: (orderId: string, data: {
    type: 'call' | 'email' | 'sms' | 'whatsapp' | 'note';
    direction: 'inbound' | 'outbound';
    subject?: string;
    content: string;
  }): Promise<ApiResponse<Order>> =>
    api.post(`/orders/${orderId}/communication`, data),

  // Get order tracking
  getOrderTracking: (orderId: string): Promise<ApiResponse<{
    orderNumber: string;
    status: string;
    tracking: OrderTracking;
    timeline: OrderTimelineEntry[];
  }>> =>
    api.get(`/orders/${orderId}/tracking`),

  // Update tracking stage
  updateTrackingStage: (orderId: string, stage: string, data: any): Promise<ApiResponse<any>> =>
    api.put(`/orders/${orderId}/tracking/${stage}`, data),

  // Get order statistics
  getOrderStats: (params?: {
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<OrderStats>> =>
    api.get('/orders/stats/summary', params),

  // Order Management Functions
  confirmOrder: (orderId: string, notes?: string): Promise<ApiResponse<Order>> =>
    api.put(`/orders/${orderId}/status`, { status: 'confirmed', notes }),

  contactSupplier: (orderId: string, data: {
    supplier: string;
    contactMethod: string;
    expectedDelivery?: string;
    notes?: string;
  }): Promise<ApiResponse<Order>> =>
    api.put(`/orders/${orderId}/tracking/supplierContacted`, data),

  confirmSupplier: (orderId: string, data: {
    confirmedDelivery?: string;
    supplierOrderNumber?: string;
    notes?: string;
  }): Promise<ApiResponse<Order>> =>
    api.put(`/orders/${orderId}/tracking/supplierConfirmed`, data),

  receiveInChinaWarehouse: (orderId: string, data: {
    warehouseLocation: string;
    receivedQuantity: Array<{
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
  }): Promise<ApiResponse<Order>> =>
    api.put(`/orders/${orderId}/tracking/chinaWarehouse`, data),

  startInternationalShipping: (orderId: string, data: {
    method: 'sea' | 'air' | 'express';
    carrier: string;
    trackingNumber?: string;
    estimatedArrival?: string;
    shippingCost?: number;
    weight?: number;
    dimensions?: string;
    notes?: string;
  }): Promise<ApiResponse<Order>> =>
    api.put(`/orders/${orderId}/tracking/internationalShipping`, data),

  updateCustomsClearance: (orderId: string, data: {
    clearanceAgent?: string;
    customsValue?: number;
    dutyPaid?: number;
    taxPaid?: number;
    clearanceStatus: 'pending' | 'in_progress' | 'cleared' | 'held';
    notes?: string;
  }): Promise<ApiResponse<Order>> =>
    api.put(`/orders/${orderId}/tracking/customsClearance`, data),

  receiveInLocalWarehouse: (orderId: string, data: {
    warehouse: string;
    receivedQuantity: Array<{
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
  }): Promise<ApiResponse<Order>> =>
    api.put(`/orders/${orderId}/tracking/localWarehouse`, data),

  prepareForDelivery: (orderId: string, data: {
    packedBy: string;
    packingDetails?: string;
    scheduledDelivery?: string;
    notes?: string;
  }): Promise<ApiResponse<Order>> =>
    api.put(`/orders/${orderId}/tracking/readyForDelivery`, data),

  startDelivery: (orderId: string, data: {
    deliveryMethod: 'courier' | 'own_vehicle' | 'customer_pickup';
    deliveryAgent?: string;
    estimatedDelivery?: string;
    trackingNumber?: string;
    notes?: string;
  }): Promise<ApiResponse<Order>> =>
    api.put(`/orders/${orderId}/tracking/outForDelivery`, data),

  completeDelivery: (orderId: string, data: {
    deliveredTo: string;
    signature?: string;
    deliveryProof?: string[];
    customerFeedback?: string;
    notes?: string;
  }): Promise<ApiResponse<Order>> =>
    api.put(`/orders/${orderId}/tracking/delivered`, data),

  // Bulk operations
  bulkUpdateStatus: (orderIds: string[], status: string, notes?: string): Promise<ApiResponse<{
    updated: number;
    failed: Array<{ orderId: string; error: string }>;
  }>> =>
    api.post('/orders/bulk/status', { orderIds, status, notes }),

  bulkAssign: (orderIds: string[], assignTo: {
    salesRep?: string;
    accountManager?: string;
  }): Promise<ApiResponse<{
    updated: number;
    failed: Array<{ orderId: string; error: string }>;
  }>> =>
    api.post('/orders/bulk/assign', { orderIds, assignTo }),

  // Export functions
  exportOrders: (params?: {
    format: 'csv' | 'excel' | 'pdf';
    filters?: OrderFilters;
  }): Promise<ApiResponse<{ downloadUrl: string }>> =>
    api.post('/orders/export', params),

  // Search functions
  searchOrders: (query: string, filters?: Partial<OrderFilters>): Promise<ApiResponse<Order[]>> =>
    api.get('/orders', { ...filters, search: query }),

  // Advanced filtering
  getOrdersByCustomer: (customerId: string, params?: Partial<OrderFilters>): Promise<ApiResponse<Order[]>> =>
    api.get('/orders', { ...params, customer: customerId }),

  getOrdersByDateRange: (dateFrom: string, dateTo: string, params?: Partial<OrderFilters>): Promise<ApiResponse<Order[]>> =>
    api.get('/orders', { ...params, dateFrom, dateTo }),

  getOrdersByStatus: (status: string, params?: Partial<OrderFilters>): Promise<ApiResponse<Order[]>> =>
    api.get('/orders', { ...params, status }),

  // Analytics
  getOrderTrends: (params?: {
    period: 'daily' | 'weekly' | 'monthly';
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<Array<{
    period: string;
    orderCount: number;
    totalValue: number;
    averageValue: number;
  }>>> =>
    api.get('/orders/analytics/trends', params),

  getTopCustomers: (params?: {
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<Array<{
    customer: any;
    orderCount: number;
    totalValue: number;
    averageOrderValue: number;
  }>>> =>
    api.get('/orders/analytics/top-customers', params),
};

export default ordersApi;