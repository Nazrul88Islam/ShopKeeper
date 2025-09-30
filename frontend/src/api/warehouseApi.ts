import { api } from './baseApi';
import type { ApiResponse } from './baseApi';

// Types
export interface Warehouse {
  _id: string;
  warehouseCode: string;
  name: string;
  type: 'main' | 'china' | 'regional' | 'transit' | 'virtual';
  location: {
    address: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    timezone?: string;
  };
  contact: {
    managerName?: string;
    phone?: string;
    email?: string;
    alternatePhone?: string;
  };
  capacity: {
    totalArea?: {
      value: number;
      unit: 'sqft' | 'sqm';
    };
    storageVolume?: {
      value: number;
      unit: 'cbft' | 'cbm';
    };
    maxWeight?: {
      value: number;
      unit: 'kg' | 'ton';
    };
  };
  zones: Array<{
    _id: string;
    zoneName?: string;
    zoneCode?: string;
    zoneType: 'receiving' | 'storage' | 'picking' | 'packing' | 'shipping' | 'quarantine';
    capacity?: number;
    currentUtilization: number;
  }>;
  facilities: {
    hasClimateControl: boolean;
    hasSecurity: boolean;
    hasFireSafety: boolean;
    hasCCTV: boolean;
    hasLoadingDock: boolean;
    hasForklift: boolean;
    operatingHours?: {
      start?: string;
      end?: string;
      timezone?: string;
    };
  };
  status: 'active' | 'inactive' | 'maintenance' | 'full';
  currentUtilization: {
    area: number;
    volume: number;
    weight: number;
  };
  costs: {
    rentPerMonth?: number;
    utilitiesPerMonth?: number;
    maintenancePerMonth?: number;
    staffingCost?: number;
    insuranceCost?: number;
  };
  staff: Array<{
    _id: string;
    user: string;
    role: 'manager' | 'supervisor' | 'operator' | 'security';
    shift?: string;
  }>;
  notes?: string;
  tags: string[];
  utilizationPercentage: number;
  isNearCapacity: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehouseRequest {
  name: string;
  type: 'main' | 'china' | 'regional' | 'transit' | 'virtual';
  location: {
    address: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    timezone?: string;
  };
  contact?: {
    managerName?: string;
    phone?: string;
    email?: string;
    alternatePhone?: string;
  };
  capacity?: Warehouse['capacity'];
  facilities?: Partial<Warehouse['facilities']>;
  costs?: Warehouse['costs'];
  notes?: string;
  tags?: string[];
}

// API endpoints
export const warehouseApi = {
  // Warehouse CRUD operations
  getWarehouses: (params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    country?: string;
    city?: string;
    search?: string;
  }): Promise<ApiResponse<Warehouse[]>> =>
    api.get('/warehouses', params),

  getWarehouse: (warehouseId: string): Promise<ApiResponse<Warehouse>> =>
    api.get(`/warehouses/${warehouseId}`),

  createWarehouse: (data: CreateWarehouseRequest): Promise<ApiResponse<Warehouse>> =>
    api.post('/warehouses', data),

  updateWarehouse: (warehouseId: string, data: Partial<CreateWarehouseRequest>): Promise<ApiResponse<Warehouse>> =>
    api.put(`/warehouses/${warehouseId}`, data),

  deleteWarehouse: (warehouseId: string): Promise<ApiResponse<null>> =>
    api.delete(`/warehouses/${warehouseId}`),

  toggleWarehouseStatus: (warehouseId: string): Promise<ApiResponse<Warehouse>> =>
    api.patch(`/warehouses/${warehouseId}/toggle-status`),

  // Warehouse zones
  addWarehouseZone: (warehouseId: string, zone: {
    zoneName: string;
    zoneCode?: string;
    zoneType: 'receiving' | 'storage' | 'picking' | 'packing' | 'shipping' | 'quarantine';
    capacity?: number;
  }): Promise<ApiResponse<Warehouse>> =>
    api.post(`/warehouses/${warehouseId}/zones`, zone),

  updateWarehouseZone: (warehouseId: string, zoneId: string, data: {
    zoneName?: string;
    zoneCode?: string;
    zoneType?: 'receiving' | 'storage' | 'picking' | 'packing' | 'shipping' | 'quarantine';
    capacity?: number;
  }): Promise<ApiResponse<Warehouse>> =>
    api.put(`/warehouses/${warehouseId}/zones/${zoneId}`, data),

  deleteWarehouseZone: (warehouseId: string, zoneId: string): Promise<ApiResponse<Warehouse>> =>
    api.delete(`/warehouses/${warehouseId}/zones/${zoneId}`),

  // Warehouse staff
  addWarehouseStaff: (warehouseId: string, staff: {
    user: string;
    role: 'manager' | 'supervisor' | 'operator' | 'security';
    shift?: string;
  }): Promise<ApiResponse<Warehouse>> =>
    api.post(`/warehouses/${warehouseId}/staff`, staff),

  updateWarehouseStaff: (warehouseId: string, staffId: string, data: {
    user?: string;
    role?: 'manager' | 'supervisor' | 'operator' | 'security';
    shift?: string;
  }): Promise<ApiResponse<Warehouse>> =>
    api.put(`/warehouses/${warehouseId}/staff/${staffId}`, data),

  removeWarehouseStaff: (warehouseId: string, staffId: string): Promise<ApiResponse<Warehouse>> =>
    api.delete(`/warehouses/${warehouseId}/staff/${staffId}`),

  // Warehouse operations
  getWarehouseInventory: (warehouseId: string, params?: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<Array<{
    _id: string;
    product: any;
    stock: {
      onHand: number;
      available: number;
      reserved: number;
      damaged: number;
      inTransit: number;
    };
    location: {
      zone?: string;
      aisle?: string;
      rack?: string;
      shelf?: string;
      bin?: string;
    };
    costs: {
      averageCost: number;
      totalValue: number;
    };
  }>>> =>
    api.get(`/warehouses/${warehouseId}/inventory`, params),

  getWarehouseStats: (warehouseId: string, params?: {
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<{
    totalProducts: number;
    totalValue: number;
    utilizationPercentage: number;
    lowStockItems: number;
    outOfStockItems: number;
    overstockItems: number;
    recentMovements: Array<{
      _id: string;
      product: any;
      type: string;
      quantity: number;
      date: string;
      user: any;
    }>;
    stockMovementSummary: {
      totalIn: number;
      totalOut: number;
      totalAdjustments: number;
    };
    topProducts: Array<{
      product: any;
      stock: number;
      value: number;
      movements: number;
    }>;
  }>> =>
    api.get(`/warehouses/${warehouseId}/stats`, params),

  // Warehouse capacity and utilization
  getWarehouseCapacity: (warehouseId: string): Promise<ApiResponse<{
    totalCapacity: {
      area: number;
      volume: number;
      weight: number;
    };
    currentUtilization: {
      area: number;
      volume: number;
      weight: number;
    };
    utilizationPercentage: {
      area: number;
      volume: number;
      weight: number;
    };
    availableCapacity: {
      area: number;
      volume: number;
      weight: number;
    };
    zoneUtilization: Array<{
      zone: any;
      utilized: number;
      capacity: number;
      percentage: number;
    }>;
  }>> =>
    api.get(`/warehouses/${warehouseId}/capacity`),

  // Warehouse transfers and movements
  getWarehouseTransfers: (warehouseId: string, params?: {
    direction?: 'incoming' | 'outgoing';
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
    }>;
    status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
    createdAt: string;
    completedAt?: string;
  }>>> =>
    api.get(`/warehouses/${warehouseId}/transfers`, params),

  // Stock movement reports
  getStockMovementReport: (warehouseId: string, params?: {
    dateFrom?: string;
    dateTo?: string;
    movementType?: string;
    product?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Array<{
    _id: string;
    product: any;
    type: string;
    quantity: number;
    reason: string;
    reference?: string;
    balanceAfter: number;
    cost?: number;
    user: any;
    date: string;
  }>>> =>
    api.get(`/warehouses/${warehouseId}/stock-movements`, params),

  // Warehouse performance metrics
  getWarehousePerformance: (warehouseId: string, params?: {
    period?: 'daily' | 'weekly' | 'monthly';
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<{
    efficiency: {
      orderFulfillmentRate: number;
      pickingAccuracy: number;
      averagePickTime: number;
      averagePackTime: number;
    };
    utilization: {
      spaceUtilization: number;
      equipmentUtilization: number;
      staffUtilization: number;
    };
    costs: {
      operatingCostPerUnit: number;
      storageeCostPerSqFt: number;
      laborCostPercentage: number;
    };
    trends: Array<{
      date: string;
      ordersProcessed: number;
      efficiency: number;
      utilization: number;
    }>;
  }>> =>
    api.get(`/warehouses/${warehouseId}/performance`, params),

  // Location management
  getWarehouseLocations: (warehouseId: string): Promise<ApiResponse<Array<{
    _id: string;
    zone: string;
    aisle?: string;
    rack?: string;
    shelf?: string;
    bin?: string;
    capacity: number;
    occupied: number;
    available: number;
    products: Array<{
      product: any;
      quantity: number;
    }>;
  }>>> =>
    api.get(`/warehouses/${warehouseId}/locations`),

  updateProductLocation: (warehouseId: string, data: {
    product: string;
    location: {
      zone?: string;
      aisle?: string;
      rack?: string;
      shelf?: string;
      bin?: string;
    };
  }): Promise<ApiResponse<null>> =>
    api.patch(`/warehouses/${warehouseId}/product-location`, data),

  // Warehouse alerts and notifications
  getWarehouseAlerts: (warehouseId: string, params?: {
    type?: string;
    severity?: string;
    acknowledged?: boolean;
  }): Promise<ApiResponse<Array<{
    _id: string;
    type: 'low_stock' | 'out_of_stock' | 'overstock' | 'capacity_warning' | 'equipment_maintenance';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    product?: any;
    acknowledged: boolean;
    acknowledgedBy?: any;
    acknowledgedAt?: string;
    createdAt: string;
  }>>> =>
    api.get(`/warehouses/${warehouseId}/alerts`, params),

  acknowledgeWarehouseAlert: (warehouseId: string, alertId: string): Promise<ApiResponse<null>> =>
    api.patch(`/warehouses/${warehouseId}/alerts/${alertId}/acknowledge`),

  // Reports and exports
  exportWarehouseReport: (warehouseId: string, params: {
    reportType: 'inventory' | 'movements' | 'performance' | 'utilization';
    format: 'csv' | 'excel' | 'pdf';
    dateFrom?: string;
    dateTo?: string;
    includeDetails?: boolean;
  }): Promise<ApiResponse<{ downloadUrl: string }>> =>
    api.post(`/warehouses/${warehouseId}/export`, params),

  getWarehouseActivityLog: (warehouseId: string, params?: {
    dateFrom?: string;
    dateTo?: string;
    user?: string;
    activity?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Array<{
    _id: string;
    activity: string;
    description: string;
    user: any;
    timestamp: string;
    metadata?: any;
  }>>> =>
    api.get(`/warehouses/${warehouseId}/activity-log`, params),

  // Global warehouse operations
  getAllWarehouseStats: (): Promise<ApiResponse<{
    totalWarehouses: number;
    activeWarehouses: number;
    totalCapacity: {
      area: number;
      volume: number;
      weight: number;
    };
    totalUtilization: {
      area: number;
      volume: number;
      weight: number;
    };
    warehousesByType: Array<{
      type: string;
      count: number;
    }>;
    warehousesByCountry: Array<{
      country: string;
      count: number;
    }>;
    performanceMetrics: {
      averageUtilization: number;
      averageEfficiency: number;
      totalOperatingCost: number;
    };
  }>> =>
    api.get('/warehouses/global-stats'),

  exportAllWarehouses: (params?: {
    format?: 'csv' | 'excel';
    includeInventory?: boolean;
    includePerformance?: boolean;
  }): Promise<ApiResponse<{ downloadUrl: string }>> =>
    api.post('/warehouses/export', params),

  // Warehouse comparison
  compareWarehouses: (warehouseIds: string[], params?: {
    dateFrom?: string;
    dateTo?: string;
    metrics?: string[];
  }): Promise<ApiResponse<{
    warehouses: Array<{
      warehouse: Warehouse;
      metrics: {
        utilization: number;
        efficiency: number;
        cost: number;
        throughput: number;
      };
    }>;
    comparison: {
      bestPerforming: string;
      mostEfficient: string;
      mostCostEffective: string;
      recommendations: string[];
    };
  }>> =>
    api.post('/warehouses/compare', { warehouseIds, ...params }),
};

export default warehouseApi;