import { api } from './baseApi';
import type { ApiResponse } from './baseApi';

// Types
export interface Customer {
  _id: string;
  customerCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  companyName?: string;
  customerType: 'individual' | 'business';
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    isDefault: boolean;
  };
  additionalAddresses: Array<{
    _id: string;
    label?: string;
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    isDefault: boolean;
  }>;
  taxId?: string;
  creditLimit: number;
  creditBalance: number;
  paymentTerms: 'cash' | 'net15' | 'net30' | 'net45' | 'net60';
  discountRate: number;
  status: 'active' | 'inactive' | 'suspended';
  registrationDate: string;
  lastOrderDate?: string;
  totalOrders: number;
  totalSpent: number;
  preferredLanguage: string;
  marketingOptIn: boolean;
  notes?: string;
  tags: string[];
  assignedSalesRep?: string;
  avatar?: string;
  fullName: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
  // NEW: Accounting fields
  accountingIntegration?: {
    accountsReceivableId?: string;
    autoCreateAccount?: boolean;
    accountCode?: string;
  };
}

export interface CreateCustomerRequest {
  customerCode?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  companyName?: string;
  customerType?: 'individual' | 'business';
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    isDefault?: boolean;
  };
  taxId?: string;
  creditLimit?: number;
  paymentTerms?: 'cash' | 'net15' | 'net30' | 'net45' | 'net60';
  discountRate?: number;
  preferredLanguage?: string;
  marketingOptIn?: boolean;
  notes?: string;
  tags?: string[];
  assignedSalesRep?: string;
  // NEW: Accounting fields
  accountingIntegration?: {
    autoCreateAccount?: boolean;
  };
}

// NEW: Accounting types
export interface CustomerAccount {
  _id: string;
  accountCode: string;
  accountName: string;
  balance: number;
  isLinked: boolean;
  message?: string;
}

export interface CustomerAccountingSummary {
  totalCustomers: number;
  customersWithAccounts: number;
  customersWithoutAccounts: number;
  totalAccountsReceivable: number;
  integrationPercentage: string;
  customers: Array<{
    _id: string;
    fullName: string;
    customerCode: string;
    account: {
      accountCode: string;
      accountName: string;
      balance: number;
    };
  }>;
}

// API endpoints
export const customerApi = {
  // Customer CRUD operations
  getCustomers: (params?: {
    page?: number;
    limit?: number;
    customerType?: string;
    status?: string;
    assignedSalesRep?: string;
    city?: string;
    state?: string;
    country?: string;
    search?: string;
    tags?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<Customer[]>> =>
    api.get('/customers', params),

  getCustomer: (customerId: string): Promise<ApiResponse<Customer>> =>
    api.get(`/customers/${customerId}`),

  createCustomer: (customerData: CreateCustomerRequest): Promise<ApiResponse<Customer>> =>
    api.post('/customers', customerData),

  updateCustomer: (customerId: string, data: Partial<CreateCustomerRequest>): Promise<ApiResponse<Customer>> =>
    api.put(`/customers/${customerId}`, data),

  deleteCustomer: (customerId: string): Promise<ApiResponse<null>> =>
    api.delete(`/customers/${customerId}`),

  // Customer status management
  toggleCustomerStatus: (customerId: string): Promise<ApiResponse<Customer>> =>
    api.patch(`/customers/${customerId}/toggle-status`, {}),

  suspendCustomer: (customerId: string, reason: string): Promise<ApiResponse<Customer>> =>
    api.patch(`/customers/${customerId}/suspend`, { reason }),

  reactivateCustomer: (customerId: string): Promise<ApiResponse<Customer>> =>
    api.patch(`/customers/${customerId}/reactivate`, {}),

  // Address management
  addCustomerAddress: (customerId: string, address: {
    label?: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault?: boolean;
  }): Promise<ApiResponse<Customer>> =>
    api.post(`/customers/${customerId}/addresses`, address),

  updateCustomerAddress: (customerId: string, addressId: string, data: {
    label?: string;
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    isDefault?: boolean;
  }): Promise<ApiResponse<Customer>> =>
    api.put(`/customers/${customerId}/addresses/${addressId}`, data),

  deleteCustomerAddress: (customerId: string, addressId: string): Promise<ApiResponse<Customer>> =>
    api.delete(`/customers/${customerId}/addresses/${addressId}`),

  setDefaultAddress: (customerId: string, addressId: string): Promise<ApiResponse<Customer>> =>
    api.patch(`/customers/${customerId}/addresses/${addressId}/default`, {}),

  // Credit management
  updateCreditLimit: (customerId: string, creditLimit: number): Promise<ApiResponse<Customer>> =>
    api.patch(`/customers/${customerId}/credit-limit`, { creditLimit }),

  updateCreditBalance: (customerId: string, data: {
    amount: number;
    operation: 'add' | 'subtract';
    reason: string;
  }): Promise<ApiResponse<Customer>> =>
    api.patch(`/customers/${customerId}/credit-balance`, data),

  getCreditHistory: (customerId: string): Promise<ApiResponse<Array<{
    _id: string;
    date: string;
    amount: number;
    operation: 'add' | 'subtract';
    reason: string;
    balanceAfter: number;
    user: string;
  }>>> =>
    api.get(`/customers/${customerId}/credit-history`),

  // Customer orders
  getCustomerOrders: (customerId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<any[]>> =>
    api.get(`/customers/${customerId}/orders`, params),

  getCustomerOrderStats: (customerId: string): Promise<ApiResponse<{
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate?: string;
    ordersByStatus: Record<string, number>;
    monthlySpending: Array<{
      month: string;
      orders: number;
      amount: number;
    }>;
  }>> =>
    api.get(`/customers/${customerId}/order-stats`),

  // Customer communication
  getCustomerCommunications: (customerId: string): Promise<ApiResponse<Array<{
    _id: string;
    type: 'call' | 'email' | 'sms' | 'whatsapp' | 'note';
    direction: 'inbound' | 'outbound';
    subject?: string;
    content: string;
    date: string;
    user: string;
  }>>> =>
    api.get(`/customers/${customerId}/communications`),

  addCustomerCommunication: (customerId: string, data: {
    type: 'call' | 'email' | 'sms' | 'whatsapp' | 'note';
    direction: 'inbound' | 'outbound';
    subject?: string;
    content: string;
  }): Promise<ApiResponse<null>> =>
    api.post(`/customers/${customerId}/communications`, data),

  // Search and filters
  searchCustomers: (query: string, filters?: {
    customerType?: string;
    status?: string;
    city?: string;
    assignedSalesRep?: string;
  }): Promise<ApiResponse<Customer[]>> =>
    api.get('/customers/search', { q: query, ...filters }),

  getCustomersByEmail: (email: string): Promise<ApiResponse<Customer[]>> =>
    api.get('/customers/by-email', { email }),

  getCustomersByPhone: (phone: string): Promise<ApiResponse<Customer[]>> =>
    api.get('/customers/by-phone', { phone }),

  // Analytics and reports
  getCustomerStats: (params?: {
    dateFrom?: string;
    dateTo?: string;
    customerType?: string;
    status?: string;
  }): Promise<ApiResponse<{
    totalCustomers: number;
    activeCustomers: number;
    newCustomersThisMonth: number;
    customersByType: Record<string, number>;
    customersByStatus: Record<string, number>;
    topCustomers: Array<{
      customer: Customer;
      totalOrders: number;
      totalSpent: number;
    }>;
    customersByCity: Array<{
      city: string;
      count: number;
    }>;
    customersByCountry: Array<{
      country: string;
      count: number;
    }>;
  }>> =>
    api.get('/customers/stats', params),

  getCustomerLifetimeValue: (customerId: string): Promise<ApiResponse<{
    totalSpent: number;
    totalOrders: number;
    averageOrderValue: number;
    firstOrderDate?: string;
    lastOrderDate?: string;
    customerAge: number; // in days
    orderFrequency: number; // orders per month
    predictedLifetimeValue: number;
  }>> =>
    api.get(`/customers/${customerId}/lifetime-value`),

  // Bulk operations
  bulkUpdateCustomers: (customerIds: string[], data: {
    status?: 'active' | 'inactive';
    assignedSalesRep?: string;
    tags?: string[];
    paymentTerms?: 'cash' | 'net15' | 'net30' | 'net45' | 'net60';
  }): Promise<ApiResponse<{
    updated: number;
    failed: string[];
  }>> =>
    api.post('/customers/bulk-update', { customerIds, ...data }),

  bulkDeleteCustomers: (customerIds: string[]): Promise<ApiResponse<{
    deleted: number;
    failed: string[];
  }>> =>
    api.post('/customers/bulk-delete', { customerIds }),

  importCustomers: (formData: FormData): Promise<ApiResponse<{
    imported: number;
    failed: number;
    errors: string[];
  }>> =>
    api.post('/customers/import', formData),

  exportCustomers: (params?: {
    format?: 'csv' | 'excel';
    customerType?: string;
    status?: string;
    includeOrders?: boolean;
  }): Promise<ApiResponse<{ downloadUrl: string }>> =>
    api.post('/customers/export', params),

  // Customer segments
  getCustomerSegments: (): Promise<ApiResponse<Array<{
    _id: string;
    name: string;
    description: string;
    criteria: any;
    customerCount: number;
  }>>> =>
    api.get('/customers/segments'),

  createCustomerSegment: (data: {
    name: string;
    description: string;
    criteria: any;
  }): Promise<ApiResponse<any>> =>
    api.post('/customers/segments', data),

  getCustomersInSegment: (segmentId: string): Promise<ApiResponse<Customer[]>> =>
    api.get(`/customers/segments/${segmentId}/customers`),

  // Marketing and communication
  sendMarketingEmail: (data: {
    customerIds?: string[];
    segmentId?: string;
    subject: string;
    content: string;
    templateId?: string;
  }): Promise<ApiResponse<{
    sent: number;
    failed: number;
  }>> =>
    api.post('/customers/marketing/email', data),

  getMarketingCampaigns: (): Promise<ApiResponse<Array<{
    _id: string;
    name: string;
    type: string;
    status: string;
    sent: number;
    opened: number;
    clicked: number;
    createdAt: string;
  }>>> =>
    api.get('/customers/marketing/campaigns'),

  // Customer portal
  sendCustomerPortalInvite: (customerId: string): Promise<ApiResponse<null>> =>
    api.post(`/customers/${customerId}/portal-invite`, {}),

  resetCustomerPortalPassword: (customerId: string): Promise<ApiResponse<null>> =>
    api.post(`/customers/${customerId}/reset-portal-password`, {}),

  // NEW: Accounting endpoints
  setupCustomerAccounts: (): Promise<ApiResponse<{
    summary: {
      total: number;
      created: number;
      errors: number;
    };
    details: Array<{
      customerId: string;
      accountId?: string;
      status: string;
      error?: string;
    }>;
  }>> =>
    api.post('/customers/setup-accounts', {}),

  getCustomerAccount: (customerId: string): Promise<ApiResponse<{
    customer: {
      _id: string;
      fullName: string;
      customerCode: string;
    };
    account: CustomerAccount;
  }>> =>
    api.get(`/customers/${customerId}/account`),

  createCustomerAccount: (customerId: string): Promise<ApiResponse<{
    customer: {
      _id: string;
      fullName: string;
      customerCode: string;
    };
    account: {
      _id: string;
      accountCode: string;
      accountName: string;
      balance: number;
    };
  }>> =>
    api.post(`/customers/${customerId}/create-account`, {}),

  getCustomerAccountingSummary: (): Promise<ApiResponse<CustomerAccountingSummary>> =>
    api.get('/customers/accounting/summary'),
};

export default customerApi;