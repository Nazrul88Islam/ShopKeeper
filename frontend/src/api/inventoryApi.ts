import { api } from './baseApi';
import type { ApiResponse } from './baseApi';

// Types
export interface InventoryItem {
  _id: string;
  product: string;
  warehouse: string;
  location: {
    zone?: string;
    aisle?: string;
    rack?: string;
    shelf?: string;
    bin?: string;
  };
  stock: {
    onHand: number;
    available: number;
    reserved: number;
    damaged: number;
    inTransit: number;
  };
  reorderPoint: {
    minimum: number;
    maximum: number;
    safetyStock: number;
  };
  costs: {
    averageCost: number;
    lastCost: number;
    totalValue: number;
  };
  tracking: {
    lastStockTake?: string;
    nextStockTake?: string;
    lastMovement?: string;
    turnoverRate: number;
  };
  batches: Array<{
    _id: string;
    batchNumber?: string;
    quantity: number;
    expiryDate?: string;
    manufacturingDate?: string;
    supplierBatch?: string;
    cost?: number;
    status: 'good' | 'damaged' | 'expired' | 'quarantine';
  }>;
  quality: {
    condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
    lastInspection?: string;
    nextInspection?: string;
    inspectedBy?: string;
    notes?: string;
  };
  movements: Array<{
    _id: string;
    type: 'in' | 'out' | 'transfer' | 'adjustment' | 'damage' | 'return';
    quantity: number;
    reason: 'purchase' | 'sale' | 'transfer' | 'adjustment' | 'damage' | 'return' | 'theft' | 'expiry' | 'sample' | 'correction';
    reference?: string;
    balanceAfter: number;
    cost?: number;
    notes?: string;
    user: string;
    date: string;
    approved: boolean;
    approvedBy?: string;
  }>;
  alerts: Array<{
    _id: string;
    type: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiry' | 'quality_issue';
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    acknowledged: boolean;
    acknowledgedBy?: string;
    acknowledgedAt?: string;
    createdAt: string;
  }>;
  tags: string[];
  notes?: string;
  stockStatus: 'out_of_stock' | 'low_stock' | 'overstock' | 'in_stock';
  daysOfStock: number;
  totalStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  type: 'in' | 'out' | 'transfer' | 'adjustment' | 'damage' | 'return';
  quantity: number;
  reason: 'purchase' | 'sale' | 'transfer' | 'adjustment' | 'damage' | 'return' | 'theft' | 'expiry' | 'sample' | 'correction';
  reference?: string;
  cost?: number;
  notes?: string;
  fromWarehouse?: string;
  toWarehouse?: string;
}

export interface StockTakeRequest {
  warehouse: string;
  products: Array<{
    product: string;
    expectedQuantity: number;
    actualQuantity: number;
    notes?: string;
  }>;
  performedBy: string;
  notes?: string;
}

// API endpoints
export const inventoryApi = {
  // Inventory overview
  getInventoryItems: (params?: {
    page?: number;
    limit?: number;
    warehouse?: string;
    product?: string;
    category?: string;
    stockStatus?: string;
    location?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<InventoryItem[]>> =>
    api.get('/inventory', params),

  getInventoryItem: (inventoryId: string): Promise<ApiResponse<InventoryItem>> =>
    api.get(`/inventory/${inventoryId}`),

  getInventoryByProduct: (productId: string, warehouseId?: string): Promise<ApiResponse<InventoryItem[]>> =>
    api.get(`/inventory/product/${productId}`, warehouseId ? { warehouse: warehouseId } : {}),

  getInventoryByWarehouse: (warehouseId: string): Promise<ApiResponse<InventoryItem[]>> =>
    api.get(`/inventory/warehouse/${warehouseId}`),

  // Stock movements
  addStockMovement: (inventoryId: string, movement: StockMovement): Promise<ApiResponse<InventoryItem>> =>
    api.post(`/inventory/${inventoryId}/movements`, movement),

  getStockMovements: (params?: {
    inventoryId?: string;
    warehouse?: string;
    product?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Array<InventoryItem['movements'][0] & {
    product: any;
    warehouse: any;
  }>>> =>
    api.get('/inventory/movements', params),

  approveStockMovement: (inventoryId: string, movementId: string): Promise<ApiResponse<InventoryItem>> =>
    api.patch(`/inventory/${inventoryId}/movements/${movementId}/approve`),

  // Stock transfers
  createStockTransfer: (data: {
    fromWarehouse: string;
    toWarehouse: string;
    items: Array<{
      product: string;
      quantity: number;
      notes?: string;
    }>;
    reason: string;
    notes?: string;
  }): Promise<ApiResponse<{
    transferId: string;
    transferNumber: string;
    status: string;
  }>> =>
    api.post('/inventory/transfers', data),

  getStockTransfers: (params?: {
    warehouse?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Array<{
    _id: string;
    transferNumber: string;
    fromWarehouse: any;
    toWarehouse: any;
    items: Array<{
      product: any;
      quantity: number;
      notes?: string;
    }>;
    status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
    createdAt: string;
    completedAt?: string;
  }>>> =>
    api.get('/inventory/transfers', params),

  completeStockTransfer: (transferId: string): Promise<ApiResponse<null>> =>
    api.patch(`/inventory/transfers/${transferId}/complete`),

  // Stock adjustments
  createStockAdjustment: (data: {
    warehouse: string;
    items: Array<{
      product: string;
      currentStock: number;
      adjustedStock: number;
      reason: string;
      notes?: string;
    }>;
    reason: string;
    notes?: string;
  }): Promise<ApiResponse<{
    adjustmentId: string;
    adjustmentNumber: string;
  }>> =>
    api.post('/inventory/adjustments', data),

  // Stock takes
  createStockTake: (data: StockTakeRequest): Promise<ApiResponse<{
    stockTakeId: string;
    stockTakeNumber: string;
    discrepancies: Array<{
      product: any;
      expected: number;
      actual: number;
      variance: number;
    }>;
  }>> =>
    api.post('/inventory/stock-takes', data),

  getStockTakes: (params?: {
    warehouse?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Array<{
    _id: string;
    stockTakeNumber: string;
    warehouse: any;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    totalProducts: number;
    discrepancies: number;
    performedBy: any;
    createdAt: string;
    completedAt?: string;
  }>>> =>
    api.get('/inventory/stock-takes', params),

  // Reservations
  reserveStock: (data: {
    product: string;
    warehouse: string;
    quantity: number;
    reason: string;
    reference?: string;
    expiresAt?: string;
  }): Promise<ApiResponse<InventoryItem>> =>
    api.post('/inventory/reservations', data),

  releaseReservation: (reservationId: string, quantity?: number): Promise<ApiResponse<InventoryItem>> =>
    api.patch(`/inventory/reservations/${reservationId}/release`, { quantity }),

  getReservations: (params?: {
    warehouse?: string;
    product?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Array<{
    _id: string;
    product: any;
    warehouse: any;
    quantity: number;
    reason: string;
    reference?: string;
    status: 'active' | 'released' | 'expired';
    createdAt: string;
    expiresAt?: string;
  }>>> =>
    api.get('/inventory/reservations', params),

  // Alerts and notifications
  getInventoryAlerts: (params?: {
    warehouse?: string;
    type?: string;
    severity?: string;
    acknowledged?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Array<InventoryItem['alerts'][0] & {
    product: any;
    warehouse: any;
  }>>> =>
    api.get('/inventory/alerts', params),

  acknowledgeAlert: (inventoryId: string, alertId: string): Promise<ApiResponse<InventoryItem>> =>
    api.patch(`/inventory/${inventoryId}/alerts/${alertId}/acknowledge`),

  // Reorder management
  getLowStockItems: (params?: {
    warehouse?: string;
    threshold?: number;
  }): Promise<ApiResponse<InventoryItem[]>> =>
    api.get('/inventory/low-stock', params),

  getReorderList: (warehouseId?: string): Promise<ApiResponse<Array<InventoryItem & {
    suggestedQuantity: number;
    estimatedCost: number;
  }>>> =>
    api.get('/inventory/reorder-list', warehouseId ? { warehouse: warehouseId } : {}),

  createReorderSuggestions: (warehouseId?: string): Promise<ApiResponse<Array<{
    product: any;
    currentStock: number;
    reorderLevel: number;
    suggestedQuantity: number;
    supplier: any;
    estimatedCost: number;
    leadTime: number;
  }>>> =>
    api.post('/inventory/reorder-suggestions', warehouseId ? { warehouse: warehouseId } : {}),

  // Batch management
  addBatch: (inventoryId: string, batch: {
    batchNumber?: string;
    quantity: number;
    expiryDate?: string;
    manufacturingDate?: string;
    supplierBatch?: string;
    cost?: number;
  }): Promise<ApiResponse<InventoryItem>> =>
    api.post(`/inventory/${inventoryId}/batches`, batch),

  updateBatch: (inventoryId: string, batchId: string, data: {
    quantity?: number;
    status?: 'good' | 'damaged' | 'expired' | 'quarantine';
    notes?: string;
  }): Promise<ApiResponse<InventoryItem>> =>
    api.put(`/inventory/${inventoryId}/batches/${batchId}`, data),

  getExpiringBatches: (days: number = 30): Promise<ApiResponse<Array<{
    inventory: InventoryItem;
    batch: InventoryItem['batches'][0];
    daysToExpiry: number;
  }>>> =>
    api.get('/inventory/expiring-batches', { days }),

  // Quality control
  updateQualityStatus: (inventoryId: string, data: {
    condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
    inspectedBy?: string;
    notes?: string;
    nextInspection?: string;
  }): Promise<ApiResponse<InventoryItem>> =>
    api.patch(`/inventory/${inventoryId}/quality`, data),

  // Analytics and reports
  getInventoryStats: (params?: {
    warehouse?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<{
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
    overstockItems: number;
    turnoverRate: number;
    averageDaysOfStock: number;
    stockByCategory: Array<{
      category: string;
      items: number;
      value: number;
    }>;
    stockByWarehouse: Array<{
      warehouse: any;
      items: number;
      value: number;
    }>;
    movementSummary: {
      totalIn: number;
      totalOut: number;
      totalAdjustments: number;
    };
  }>> =>
    api.get('/inventory/stats', params),

  getInventoryTurnover: (params?: {
    warehouse?: string;
    category?: string;
    period?: 'monthly' | 'quarterly' | 'yearly';
  }): Promise<ApiResponse<Array<{
    product: any;
    beginningInventory: number;
    endingInventory: number;
    totalSold: number;
    turnoverRate: number;
    daysInInventory: number;
  }>>> =>
    api.get('/inventory/turnover', params),

  getStockValuation: (params?: {
    warehouse?: string;
    method?: 'fifo' | 'lifo' | 'average';
    asOfDate?: string;
  }): Promise<ApiResponse<{
    totalValue: number;
    byCategory: Array<{
      category: string;
      value: number;
      percentage: number;
    }>;
    byWarehouse: Array<{
      warehouse: any;
      value: number;
      percentage: number;
    }>;
    items: Array<{
      product: any;
      quantity: number;
      unitCost: number;
      totalValue: number;
    }>;
  }>> =>
    api.get('/inventory/valuation', params),

  // Reports
  exportInventoryReport: (params: {
    format: 'csv' | 'excel' | 'pdf';
    warehouse?: string;
    category?: string;
    includeMovements?: boolean;
    includeBatches?: boolean;
  }): Promise<ApiResponse<{ downloadUrl: string }>> =>
    api.post('/inventory/export', params),

  getInventoryHistory: (inventoryId: string, params?: {
    dateFrom?: string;
    dateTo?: string;
    type?: string;
  }): Promise<ApiResponse<Array<InventoryItem['movements'][0]>>> =>
    api.get(`/inventory/${inventoryId}/history`, params),
};

export default inventoryApi;