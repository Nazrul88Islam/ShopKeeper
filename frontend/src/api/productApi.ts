import { api } from './baseApi';
import type { ApiResponse } from './baseApi';

// Types
export interface Product {
  _id: string;
  productCode: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  brand?: string;
  model?: string;
  specifications: {
    weight?: {
      value: number;
      unit: 'kg' | 'g' | 'lb' | 'oz';
    };
    dimensions?: {
      length: number;
      width: number;
      height: number;
      unit: 'cm' | 'm' | 'in' | 'ft';
    };
    color?: string[];
    size?: string[];
    material?: string;
    countryOfOrigin: string;
  };
  pricing: {
    baseCurrency: 'USD' | 'CNY' | 'EUR' | 'BDT';
    basePrice: number;
    costPrice: number;
    sellingPrice: number;
    wholesalePrice?: number;
    retailPrice?: number;
    margin: number;
    taxRate: number;
  };
  inventory: {
    sku?: string;
    barcode?: string;
    trackInventory: boolean;
    stockUnit: 'piece' | 'pack' | 'box' | 'carton' | 'kg' | 'g' | 'liter' | 'meter';
    minimumStock: number;
    maximumStock: number;
    reorderLevel: number;
    currentStock: number;
  };
  supplier: string;
  supplierInfo: {
    supplierProductCode?: string;
    minimumOrderQuantity: number;
    leadTime: number;
    lastPurchasePrice?: number;
    lastPurchaseDate?: string;
  };
  shipping: {
    isShippable: boolean;
    shippingWeight?: number;
    shippingDimensions?: {
      length: number;
      width: number;
      height: number;
    };
    shippingClass?: string;
    requiresSpecialHandling: boolean;
    hazardous: boolean;
  };
  images: Array<{
    _id: string;
    url: string;
    alt?: string;
    isPrimary: boolean;
  }>;
  documents: Array<{
    _id: string;
    name: string;
    type: string;
    url: string;
    uploadDate: string;
  }>;
  status: 'active' | 'inactive' | 'discontinued' | 'out_of_stock';
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  seoInfo: {
    metaTitle?: string;
    metaDescription?: string;
    slug?: string;
  };
  variants: Array<{
    _id: string;
    name: string;
    value: string;
    price?: number;
    sku?: string;
    stock?: number;
  }>;
  reviews: {
    averageRating: number;
    totalReviews: number;
  };
  salesData: {
    totalSold: number;
    lastSaleDate?: string;
    revenue: number;
  };
  profitMargin: number;
  availabilityStatus: 'available' | 'out_of_stock' | 'low_stock' | 'in_stock';
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  productCode?: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  brand?: string;
  model?: string;
  specifications: {
    weight?: {
      value: number;
      unit: 'kg' | 'g' | 'lb' | 'oz';
    };
    dimensions?: {
      length: number;
      width: number;
      height: number;
      unit: 'cm' | 'm' | 'in' | 'ft';
    };
    color?: string[];
    size?: string[];
    material?: string;
    countryOfOrigin?: string;
  };
  pricing: {
    baseCurrency?: 'USD' | 'CNY' | 'EUR' | 'BDT';
    basePrice: number;
    costPrice: number;
    sellingPrice: number;
    wholesalePrice?: number;
    retailPrice?: number;
    taxRate?: number;
  };
  inventory: {
    sku?: string;
    barcode?: string;
    trackInventory?: boolean;
    stockUnit?: 'piece' | 'pack' | 'box' | 'carton' | 'kg' | 'g' | 'liter' | 'meter';
    minimumStock?: number;
    maximumStock?: number;
    reorderLevel?: number;
    currentStock?: number;
  };
  supplier: string;
  supplierInfo: {
    supplierProductCode?: string;
    minimumOrderQuantity?: number;
    leadTime?: number;
  };
  shipping?: {
    isShippable?: boolean;
    shippingWeight?: number;
    shippingDimensions?: {
      length: number;
      width: number;
      height: number;
    };
    shippingClass?: string;
    requiresSpecialHandling?: boolean;
    hazardous?: boolean;
  };
  tags?: string[];
  variants?: Array<{
    name: string;
    value: string;
    price?: number;
    sku?: string;
    stock?: number;
  }>;
}

export interface ProductCategory {
  _id: string;
  name: string;
  description?: string;
  subcategories: string[];
  productCount: number;
}

// API endpoints
export const productApi = {
  // Product CRUD operations
  getProducts: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    subcategory?: string;
    supplier?: string;
    status?: string;
    stockStatus?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    tags?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<Product[]>> =>
    api.get('/products', params),

  getProduct: (productId: string): Promise<ApiResponse<Product>> =>
    api.get(`/products/${productId}`),

  createProduct: (productData: CreateProductRequest): Promise<ApiResponse<Product>> =>
    api.post('/products', productData),

  updateProduct: (productId: string, data: Partial<CreateProductRequest>): Promise<ApiResponse<Product>> =>
    api.put(`/products/${productId}`, data),

  deleteProduct: (productId: string): Promise<ApiResponse<null>> =>
    api.delete(`/products/${productId}`),

  // Product status management
  toggleProductStatus: (productId: string): Promise<ApiResponse<Product>> =>
    api.patch(`/products/${productId}/toggle-status`),

  updateProductStock: (productId: string, data: {
    quantity: number;
    operation: 'add' | 'subtract';
    reason?: string;
  }): Promise<ApiResponse<Product>> =>
    api.patch(`/products/${productId}/stock`, data),

  // Product images
  uploadProductImage: (productId: string, formData: FormData): Promise<ApiResponse<Product>> =>
    api.post(`/products/${productId}/images`, formData),

  deleteProductImage: (productId: string, imageId: string): Promise<ApiResponse<Product>> =>
    api.delete(`/products/${productId}/images/${imageId}`),

  setPrimaryImage: (productId: string, imageId: string): Promise<ApiResponse<Product>> =>
    api.patch(`/products/${productId}/images/${imageId}/primary`),

  // Product documents
  uploadProductDocument: (productId: string, formData: FormData): Promise<ApiResponse<Product>> =>
    api.post(`/products/${productId}/documents`, formData),

  deleteProductDocument: (productId: string, documentId: string): Promise<ApiResponse<Product>> =>
    api.delete(`/products/${productId}/documents/${documentId}`),

  // Product variants
  addProductVariant: (productId: string, variant: {
    name: string;
    value: string;
    price?: number;
    sku?: string;
    stock?: number;
  }): Promise<ApiResponse<Product>> =>
    api.post(`/products/${productId}/variants`, variant),

  updateProductVariant: (productId: string, variantId: string, data: {
    name?: string;
    value?: string;
    price?: number;
    sku?: string;
    stock?: number;
  }): Promise<ApiResponse<Product>> =>
    api.put(`/products/${productId}/variants/${variantId}`, data),

  deleteProductVariant: (productId: string, variantId: string): Promise<ApiResponse<Product>> =>
    api.delete(`/products/${productId}/variants/${variantId}`),

  // Categories
  getCategories: (): Promise<ApiResponse<ProductCategory[]>> =>
    api.get('/products/categories'),

  createCategory: (data: {
    name: string;
    description?: string;
  }): Promise<ApiResponse<ProductCategory>> =>
    api.post('/products/categories', data),

  updateCategory: (categoryId: string, data: {
    name?: string;
    description?: string;
  }): Promise<ApiResponse<ProductCategory>> =>
    api.put(`/products/categories/${categoryId}`, data),

  deleteCategory: (categoryId: string): Promise<ApiResponse<null>> =>
    api.delete(`/products/categories/${categoryId}`),

  // Subcategories
  addSubcategory: (categoryId: string, subcategoryName: string): Promise<ApiResponse<ProductCategory>> =>
    api.post(`/products/categories/${categoryId}/subcategories`, { name: subcategoryName }),

  removeSubcategory: (categoryId: string, subcategoryName: string): Promise<ApiResponse<ProductCategory>> =>
    api.delete(`/products/categories/${categoryId}/subcategories/${subcategoryName}`),

  // Search and filters
  searchProducts: (query: string, filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
  }): Promise<ApiResponse<Product[]>> =>
    api.get('/products/search', { q: query, ...filters }),

  getProductsByBarcode: (barcode: string): Promise<ApiResponse<Product>> =>
    api.get(`/products/barcode/${barcode}`),

  getProductsBySku: (sku: string): Promise<ApiResponse<Product>> =>
    api.get(`/products/sku/${sku}`),

  // Stock management
  getLowStockProducts: (threshold?: number): Promise<ApiResponse<Product[]>> =>
    api.get('/products/low-stock', { threshold }),

  getOutOfStockProducts: (): Promise<ApiResponse<Product[]>> =>
    api.get('/products/out-of-stock'),

  getReorderProducts: (): Promise<ApiResponse<Product[]>> =>
    api.get('/products/reorder-needed'),

  // Analytics and reports
  getProductStats: (params?: {
    dateFrom?: string;
    dateTo?: string;
    category?: string;
  }): Promise<ApiResponse<{
    totalProducts: number;
    activeProducts: number;
    inactiveProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalValue: number;
    averagePrice: number;
    topSellingProducts: Array<{
      product: Product;
      totalSold: number;
      revenue: number;
    }>;
    categoryBreakdown: Array<{
      category: string;
      count: number;
      value: number;
    }>;
  }>> =>
    api.get('/products/stats', params),

  getProductSalesHistory: (productId: string, params?: {
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<Array<{
    date: string;
    quantity: number;
    revenue: number;
    averagePrice: number;
  }>>> =>
    api.get(`/products/${productId}/sales-history`, params),

  // Bulk operations
  bulkUpdateProducts: (productIds: string[], data: {
    status?: 'active' | 'inactive';
    category?: string;
    supplier?: string;
    tags?: string[];
  }): Promise<ApiResponse<{
    updated: number;
    failed: string[];
  }>> =>
    api.post('/products/bulk-update', { productIds, ...data }),

  bulkDeleteProducts: (productIds: string[]): Promise<ApiResponse<{
    deleted: number;
    failed: string[];
  }>> =>
    api.post('/products/bulk-delete', { productIds }),

  importProducts: (formData: FormData): Promise<ApiResponse<{
    imported: number;
    failed: number;
    errors: string[];
  }>> =>
    api.post('/products/import', formData),

  exportProducts: (params?: {
    format?: 'csv' | 'excel';
    category?: string;
    status?: string;
  }): Promise<ApiResponse<{ downloadUrl: string }>> =>
    api.post('/products/export', params),

  // Product recommendations
  getRelatedProducts: (productId: string, limit?: number): Promise<ApiResponse<Product[]>> =>
    api.get(`/products/${productId}/related`, { limit }),

  getFeaturedProducts: (limit?: number): Promise<ApiResponse<Product[]>> =>
    api.get('/products/featured', { limit }),

  // Customer-facing API
  getPublicProducts: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'price' | 'name' | 'popularity';
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<Product[]>> =>
    api.get('/products/public', params),

  getPublicProduct: (productId: string): Promise<ApiResponse<Product>> =>
    api.get(`/products/public/${productId}`),
};

export default productApi;