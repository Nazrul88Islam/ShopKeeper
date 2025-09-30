// Export all API services
export { api, apiClient } from './baseApi';
export type { ApiResponse, ApiError } from './baseApi';

// Authentication API
export { authApi } from './authApi';
export type { 
  LoginRequest, 
  RegisterRequest, 
  User, 
  AuthResponse 
} from './authApi';

// Order API
export { orderApi } from './orderApi';
export type { 
  Order, 
  OrderItem, 
  OrderTracking, 
  CreateOrderRequest 
} from './orderApi';

// Product API
export { productApi } from './productApi';
export type { 
  Product, 
  CreateProductRequest, 
  ProductCategory 
} from './productApi';

// Customer API
export { customerApi } from './customerApi';
export type { 
  Customer, 
  CreateCustomerRequest 
} from './customerApi';

// Inventory API
export { inventoryApi } from './inventoryApi';
export type { 
  InventoryItem, 
  StockMovement, 
  StockTakeRequest 
} from './inventoryApi';

// Accounting API
export { accountingApi } from './accountingApi';
export type { 
  ChartOfAccount, 
  JournalEntry, 
  CreateJournalEntryRequest 
} from './accountingApi';

// Sales API
export { salesApi } from './salesApi';
export type { 
  Sale, 
  CreateSaleRequest 
} from './salesApi';

// Supplier API
export { supplierApi } from './supplierApi';
export type { 
  Supplier, 
  CreateSupplierRequest 
} from './supplierApi';

// Warehouse API
export { warehouseApi } from './warehouseApi';
export type { 
  Warehouse, 
  CreateWarehouseRequest 
} from './warehouseApi';