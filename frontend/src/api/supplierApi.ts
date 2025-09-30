import { api } from './baseApi';
import type { ApiResponse } from './baseApi';

// Types
export interface Supplier {
  _id: string;
  supplierCode: string;
  companyName: string;
  contactPerson: {
    firstName: string;
    lastName: string;
    title?: string;
    email: string;
    phone: string;
    mobile?: string;
  };
  address: {
    street: string;
    city: string;
    state?: string;
    zipCode?: string;
    country: string;
  };
  businessDetails: {
    businessType: 'manufacturer' | 'distributor' | 'wholesaler' | 'retailer' | 'trader' | 'agent' | 'service_provider';
    businessLicense?: string;
    taxId?: string;
    establishedYear?: number;
    employeeCount?: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
  };
  products: Array<{
    _id: string;
    category?: string;
    subcategory?: string;
    description?: string;
    minimumOrder?: number;
    leadTime?: number; // in days
  }>;
  paymentTerms: 'advance' | 'on_delivery' | 'net15' | 'net30' | 'net45' | 'net60';
  shippingTerms: 'FOB' | 'CIF' | 'EXW' | 'DDP' | 'DDU';
  currency: 'USD' | 'CNY' | 'EUR' | 'BDT';
  creditLimit: number;
  creditBalance: number;
  rating: {
    quality: number;
    delivery: number;
    communication: number;
    overall: number;
  };
  status: 'active' | 'inactive' | 'suspended' | 'blacklisted';
  certifications: Array<{
    _id: string;
    name: string;
    issuer?: string;
    validUntil?: string;
    documentUrl?: string;
  }>;
  bankDetails: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    swiftCode?: string;
    iban?: string;
  };
  communicationPreferences: {
    primaryMethod: 'email' | 'phone' | 'whatsapp' | 'wechat';
    language: 'en' | 'zh' | 'ar';
    timezone?: string;
  };
  totalOrders: number;
  totalValue: number;
  lastOrderDate?: string;
  notes?: string;
  tags: string[];
  assignedBuyer?: string;
  documents: Array<{
    _id: string;
    name: string;
    type: string;
    url: string;
    uploadDate: string;
  }>;
  // NEW: Accounting Integration
  accountingIntegration?: {
    accountsPayableId?: string;
    autoCreateAccount?: boolean;
    accountCode?: string;
  };
  contactFullName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierRequest {
  supplierCode?: string;
  companyName: string;
  contactPerson: {
    firstName: string;
    lastName: string;
    title?: string;
    email: string;
    phone: string;
    mobile?: string;
  };
  address: {
    street: string;
    city: string;
    state?: string;
    zipCode?: string;
    country: string;
  };
  businessDetails: {
    businessType: 'manufacturer' | 'distributor' | 'wholesaler' | 'retailer' | 'trader' | 'agent' | 'service_provider';
    businessLicense?: string;
    taxId?: string;
    establishedYear?: number;
    employeeCount?: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
  };
  products?: Array<{
    category?: string;
    subcategory?: string;
    description?: string;
    minimumOrder?: number;
    leadTime?: number;
  }>;
  paymentTerms?: 'advance' | 'on_delivery' | 'net15' | 'net30' | 'net45' | 'net60';
  shippingTerms?: 'FOB' | 'CIF' | 'EXW' | 'DDP' | 'DDU';
  currency?: 'USD' | 'CNY' | 'EUR' | 'BDT';
  creditLimit?: number;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    swiftCode?: string;
    iban?: string;
  };
  communicationPreferences?: {
    primaryMethod?: 'email' | 'phone' | 'whatsapp' | 'wechat';
    language?: 'en' | 'zh' | 'ar';
    timezone?: string;
  };
  notes?: string;
  tags?: string[];
  assignedBuyer?: string;
}

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

// API endpoints
export const supplierApi = {
  // Supplier CRUD operations
  getSuppliers: (params?: {
    page?: number;
    limit?: number;
    businessType?: string;
    status?: string;
    country?: string;
    assignedBuyer?: string;
    rating?: number;
    search?: string;
    tags?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<Supplier[]>> =>
    api.get('/suppliers', params),

  getSupplier: (supplierId: string): Promise<ApiResponse<Supplier>> =>
    api.get(`/suppliers/${supplierId}`),

  createSupplier: (supplierData: CreateSupplierRequest): Promise<ApiResponse<Supplier>> =>
    api.post('/suppliers', supplierData),

  updateSupplier: (supplierId: string, data: Partial<CreateSupplierRequest>): Promise<ApiResponse<Supplier>> =>
    api.put(`/suppliers/${supplierId}`, data),

  deleteSupplier: (supplierId: string): Promise<ApiResponse<null>> =>
    api.delete(`/suppliers/${supplierId}`),

  // Supplier status management
  toggleSupplierStatus: (supplierId: string): Promise<ApiResponse<Supplier>> =>
    api.patch(`/suppliers/${supplierId}/toggle-status`),

  suspendSupplier: (supplierId: string, reason: string): Promise<ApiResponse<Supplier>> =>
    api.patch(`/suppliers/${supplierId}/suspend`, { reason }),

  blacklistSupplier: (supplierId: string, reason: string): Promise<ApiResponse<Supplier>> =>
    api.patch(`/suppliers/${supplierId}/blacklist`, { reason }),

  reactivateSupplier: (supplierId: string): Promise<ApiResponse<Supplier>> =>
    api.patch(`/suppliers/${supplierId}/reactivate`),

  // Supplier rating and evaluation
  updateSupplierRating: (supplierId: string, data: {
    quality: number;
    delivery: number;
    communication: number;
  }): Promise<ApiResponse<Supplier>> =>
    api.patch(`/suppliers/${supplierId}/rating`, data),

  getSupplierEvaluations: (supplierId: string): Promise<ApiResponse<Array<{
    _id: string;
    evaluationDate: string;
    evaluatedBy: any;
    criteria: {
      quality: number;
      delivery: number;
      communication: number;
      pricing: number;
      service: number;
    };
    overallRating: number;
    comments: string;
    recommendations: string;
  }>>> =>
    api.get(`/suppliers/${supplierId}/evaluations`),

  addSupplierEvaluation: (supplierId: string, data: {
    criteria: {
      quality: number;
      delivery: number;
      communication: number;
      pricing: number;
      service: number;
    };
    comments?: string;
    recommendations?: string;
  }): Promise<ApiResponse<any>> =>
    api.post(`/suppliers/${supplierId}/evaluations`, data),

  // Product management
  addSupplierProduct: (supplierId: string, product: {
    category: string;
    subcategory?: string;
    description: string;
    minimumOrder?: number;
    leadTime?: number;
  }): Promise<ApiResponse<Supplier>> =>
    api.post(`/suppliers/${supplierId}/products`, product),

  updateSupplierProduct: (supplierId: string, productId: string, data: {
    category?: string;
    subcategory?: string;
    description?: string;
    minimumOrder?: number;
    leadTime?: number;
  }): Promise<ApiResponse<Supplier>> =>
    api.put(`/suppliers/${supplierId}/products/${productId}`, data),

  deleteSupplierProduct: (supplierId: string, productId: string): Promise<ApiResponse<Supplier>> =>
    api.delete(`/suppliers/${supplierId}/products/${productId}`),

  // Purchase orders and history
  getSupplierOrders: (supplierId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<any[]>> =>
    api.get(`/suppliers/${supplierId}/orders`, params),

  getSupplierOrderStats: (supplierId: string): Promise<ApiResponse<{
    totalOrders: number;
    totalValue: number;
    averageOrderValue: number;
    lastOrderDate?: string;
    ordersByStatus: Record<string, number>;
    monthlyOrders: Array<{
      month: string;
      orders: number;
      value: number;
    }>;
    performanceMetrics: {
      onTimeDelivery: number;
      qualityRating: number;
      defectRate: number;
    };
  }>> =>
    api.get(`/suppliers/${supplierId}/order-stats`),

  // Documents and certifications
  uploadSupplierDocument: (supplierId: string, formData: FormData): Promise<ApiResponse<Supplier>> =>
    api.post(`/suppliers/${supplierId}/documents`, formData),

  deleteSupplierDocument: (supplierId: string, documentId: string): Promise<ApiResponse<Supplier>> =>
    api.delete(`/suppliers/${supplierId}/documents/${documentId}`),

  addCertification: (supplierId: string, certification: {
    name: string;
    issuer?: string;
    validUntil?: string;
    documentUrl?: string;
  }): Promise<ApiResponse<Supplier>> =>
    api.post(`/suppliers/${supplierId}/certifications`, certification),

  updateCertification: (supplierId: string, certId: string, data: {
    name?: string;
    issuer?: string;
    validUntil?: string;
    documentUrl?: string;
  }): Promise<ApiResponse<Supplier>> =>
    api.put(`/suppliers/${supplierId}/certifications/${certId}`, data),

  deleteCertification: (supplierId: string, certId: string): Promise<ApiResponse<Supplier>> =>
    api.delete(`/suppliers/${supplierId}/certifications/${certId}`),

  // Communication and notes
  getSupplierCommunications: (supplierId: string): Promise<ApiResponse<Array<{
    _id: string;
    type: 'call' | 'email' | 'meeting' | 'note';
    subject: string;
    content: string;
    date: string;
    user: any;
  }>>> =>
    api.get(`/suppliers/${supplierId}/communications`),

  addSupplierCommunication: (supplierId: string, data: {
    type: 'call' | 'email' | 'meeting' | 'note';
    subject: string;
    content: string;
  }): Promise<ApiResponse<null>> =>
    api.post(`/suppliers/${supplierId}/communications`, data),

  // Search and analytics
  searchSuppliers: (query: string, filters?: {
    businessType?: string;
    country?: string;
    status?: string;
    minRating?: number;
  }): Promise<ApiResponse<Supplier[]>> =>
    api.get('/suppliers/search', { q: query, ...filters }),

  getSupplierStats: (params?: {
    dateFrom?: string;
    dateTo?: string;
    country?: string;
    businessType?: string;
  }): Promise<ApiResponse<{
    totalSuppliers: number;
    activeSuppliers: number;
    suppliersByCountry: Array<{
      country: string;
      count: number;
    }>;
    suppliersByType: Array<{
      type: string;
      count: number;
    }>;
    topSuppliers: Array<{
      supplier: Supplier;
      totalOrders: number;
      totalValue: number;
      rating: number;
    }>;
    averageRating: number;
    certificationExpiries: Array<{
      supplier: Supplier;
      certification: string;
      expiryDate: string;
      daysToExpiry: number;
    }>;
  }>> =>
    api.get('/suppliers/stats', params),

  // Bulk operations
  bulkUpdateSuppliers: (supplierIds: string[], data: {
    status?: string;
    assignedBuyer?: string;
    tags?: string[];
    paymentTerms?: string;
  }): Promise<ApiResponse<{
    updated: number;
    failed: string[];
  }>> =>
    api.post('/suppliers/bulk-update', { supplierIds, ...data }),

  importSuppliers: (formData: FormData): Promise<ApiResponse<{
    imported: number;
    failed: number;
    errors: string[];
  }>> =>
    api.post('/suppliers/import', formData),

  exportSuppliers: (params?: {
    format?: 'csv' | 'excel';
    status?: string;
    country?: string;
    includeProducts?: boolean;
  }): Promise<ApiResponse<{ downloadUrl: string }>> =>
    api.post('/suppliers/export', params),
};

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

  createWarehouse: (data: {
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
  }): Promise<ApiResponse<Warehouse>> =>
    api.post('/warehouses', data),

  updateWarehouse: (warehouseId: string, data: any): Promise<ApiResponse<Warehouse>> =>
    api.put(`/warehouses/${warehouseId}`, data),

  deleteWarehouse: (warehouseId: string): Promise<ApiResponse<null>> =>
    api.delete(`/warehouses/${warehouseId}`),

  // Warehouse zones
  addWarehouseZone: (warehouseId: string, zone: {
    zoneName: string;
    zoneCode?: string;
    zoneType: 'receiving' | 'storage' | 'picking' | 'packing' | 'shipping' | 'quarantine';
    capacity?: number;
  }): Promise<ApiResponse<Warehouse>> =>
    api.post(`/warehouses/${warehouseId}/zones`, zone),

  updateWarehouseZone: (warehouseId: string, zoneId: string, data: any): Promise<ApiResponse<Warehouse>> =>
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

  updateWarehouseStaff: (warehouseId: string, staffId: string, data: any): Promise<ApiResponse<Warehouse>> =>
    api.put(`/warehouses/${warehouseId}/staff/${staffId}`, data),

  removeWarehouseStaff: (warehouseId: string, staffId: string): Promise<ApiResponse<Warehouse>> =>
    api.delete(`/warehouses/${warehouseId}/staff/${staffId}`),

  // Warehouse operations
  getWarehouseInventory: (warehouseId: string): Promise<ApiResponse<any[]>> =>
    api.get(`/warehouses/${warehouseId}/inventory`),

  getWarehouseStats: (warehouseId: string): Promise<ApiResponse<{
    totalProducts: number;
    totalValue: number;
    utilizationPercentage: number;
    lowStockItems: number;
    outOfStockItems: number;
    recentMovements: Array<{
      product: any;
      type: string;
      quantity: number;
      date: string;
    }>;
  }>> =>
    api.get(`/warehouses/${warehouseId}/stats`),

  exportWarehouses: (params?: {
    format?: 'csv' | 'excel';
    includeInventory?: boolean;
  }): Promise<ApiResponse<{ downloadUrl: string }>> =>
    api.post('/warehouses/export', params),

  // NEW: Accounting Integration APIs
  setupAllSupplierAccounts: (): Promise<ApiResponse<{
    summary: { total: number; created: number; errors: number };
    details: Array<{ supplierId: string; accountId?: string; status: string; error?: string }>;
  }>> =>
    api.post('/suppliers/setup-accounts'),

  getSupplierAccount: (supplierId: string): Promise<ApiResponse<{
    supplier: { _id: string; companyName: string; supplierCode: string };
    account?: { _id: string; accountCode: string; accountName: string; balance: number; isLinked: boolean };
    isLinked: boolean;
    message?: string;
  }>> =>
    api.get(`/suppliers/${supplierId}/account`),

  createSupplierAccount: (supplierId: string): Promise<ApiResponse<{
    supplier: { _id: string; companyName: string; supplierCode: string };
    account: { _id: string; accountCode: string; accountName: string; balance: number };
  }>> =>
    api.post(`/suppliers/${supplierId}/create-account`),

  getAccountingSummary: (): Promise<ApiResponse<{
    totalSuppliers: number;
    suppliersWithAccounts: number;
    suppliersWithoutAccounts: number;
    totalAccountsPayable: number;
    integrationPercentage: string;
    suppliers: Array<{
      _id: string;
      companyName: string;
      supplierCode: string;
      account: { accountCode: string; accountName: string; balance: number };
    }>;
  }>> =>
    api.get('/suppliers/accounting/summary'),
};

export { supplierApi as default };