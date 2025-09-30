import React, { useEffect, useState } from 'react';
import { Search, Plus, Eye, Edit, Package, DollarSign, Star, Truck, Filter, Image, Tag, Warehouse as WarehouseIcon, AlertTriangle, Trash2, X } from 'lucide-react';
import { productApi, type Product, type ProductCategory, type CreateProductRequest } from '../api/productApi';
import { warehouseApi, type Warehouse } from '../api/warehouseApi';
import { supplierApi, type Supplier } from '../api/supplierApi';
import RoleBasedAccess from '../components/RoleBasedAccess';
import { useRolePermissions } from '../hooks/useRolePermissions';

const Products: React.FC = () => {
  const { hasPermission } = useRolePermissions();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const productsPerPage = 10;

  // Create Product Form State
  const [createForm, setCreateForm] = useState<CreateProductRequest>({
    productCode: '',
    name: '',
    description: '',
    category: '',
    subcategory: '',
    brand: '',
    specifications: {
      countryOfOrigin: 'China',
      weight: {
        value: 0,
        unit: 'kg'
      },
      dimensions: {
        length: 0,
        width: 0,
        height: 0,
        unit: 'cm'
      },
      color: [],
      material: ''
    },
    pricing: {
      baseCurrency: 'USD',
      basePrice: 0,
      costPrice: 0,
      sellingPrice: 0,
      wholesalePrice: 0,
      retailPrice: 0,
      taxRate: 0
    },
    inventory: {
      trackInventory: true,
      stockUnit: 'piece',
      minimumStock: 0,
      maximumStock: 0,
      reorderLevel: 0,
      currentStock: 0
    },
    supplier: '',
    supplierInfo: {
      minimumOrderQuantity: 1,
      leadTime: 7
    },
    shipping: {
      isShippable: true,
      requiresSpecialHandling: false,
      hazardous: false
    },
    tags: []
  });

  // Edit Product Form State
  const [editForm, setEditForm] = useState<Partial<CreateProductRequest>>({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    brand: '',
    specifications: {
      countryOfOrigin: 'China',
      weight: {
        value: 0,
        unit: 'kg'
      },
      dimensions: {
        length: 0,
        width: 0,
        height: 0,
        unit: 'cm'
      },
      color: [],
      material: ''
    },
    pricing: {
      baseCurrency: 'USD',
      basePrice: 0,
      costPrice: 0,
      sellingPrice: 0,
      wholesalePrice: 0,
      retailPrice: 0,
      taxRate: 0
    },
    inventory: {
      trackInventory: true,
      stockUnit: 'piece',
      minimumStock: 0,
      maximumStock: 0,
      reorderLevel: 0,
      currentStock: 0
    },
    supplier: '',
    supplierInfo: {
      minimumOrderQuantity: 1,
      leadTime: 7
    },
    shipping: {
      isShippable: true,
      requiresSpecialHandling: false,
      hazardous: false
    },
    tags: []
  });

  // Category Form State
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  });
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [currentPage, categoryFilter, statusFilter, supplierFilter, warehouseFilter, searchTerm]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [productResponse, categoryResponse, warehouseResponse, supplierResponse] = await Promise.all([
        productApi.getProducts({ page: 1, limit: 100 }),
        productApi.getCategories(),
        warehouseApi.getWarehouses({ status: 'active' }),
        supplierApi.getSuppliers({ status: 'active' })
      ]);
      
      if (productResponse.success) {
        setProducts(productResponse.data);
      }
      if (categoryResponse.success) {
        setCategories(categoryResponse.data);
      }
      if (warehouseResponse.success) {
        setWarehouses(warehouseResponse.data);
      }
      if (supplierResponse.success) {
        setSuppliers(supplierResponse.data);
      }
    } catch (err: any) {
      setError('Error loading initial data: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productApi.getProducts({
        page: currentPage,
        limit: productsPerPage,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        supplier: supplierFilter === 'all' ? undefined : supplierFilter,
        search: searchTerm || undefined
      });
      
      if (response.success) {
        setProducts(response.data);
        setError(null);
      } else {
        setError('Failed to load products');
      }
    } catch (err: any) {
      setError('Error loading products: ' + (err.message || 'Unknown error'));
      console.error('Load products error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await productApi.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (err: any) {
      setError('Error loading categories: ' + (err.message || 'Unknown error'));
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await productApi.createProduct(createForm);
      
      if (response.success) {
        setShowCreateModal(false);
        loadProducts();
        setError(null);
        // Reset form
        setCreateForm({
          name: '',
          description: '',
          category: '',
          subcategory: '',
          brand: '',
          specifications: {
            countryOfOrigin: 'China',
            weight: {
              value: 0,
              unit: 'kg'
            },
            dimensions: {
              length: 0,
              width: 0,
              height: 0,
              unit: 'cm'
            },
            color: [],
            material: ''
          },
          pricing: {
            baseCurrency: 'USD',
            basePrice: 0,
            costPrice: 0,
            sellingPrice: 0,
            wholesalePrice: 0,
            retailPrice: 0,
            taxRate: 0
          },
          inventory: {
            trackInventory: true,
            stockUnit: 'piece',
            minimumStock: 0,
            maximumStock: 0,
            reorderLevel: 0,
            currentStock: 0
          },
          supplier: '',
          supplierInfo: {
            minimumOrderQuantity: 1,
            leadTime: 7
          },
          shipping: {
            isShippable: true,
            requiresSpecialHandling: false,
            hazardous: false
          },
          tags: []
        });
      }
    } catch (err: any) {
      setError('Error creating product: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      description: product.description,
      category: product.category,
      subcategory: product.subcategory || '',
      brand: product.brand || '',
      specifications: {
        countryOfOrigin: product.specifications.countryOfOrigin || 'China',
        weight: product.specifications.weight || { value: 0, unit: 'kg' },
        dimensions: product.specifications.dimensions || { length: 0, width: 0, height: 0, unit: 'cm' },
        color: product.specifications.color || [],
        material: product.specifications.material || ''
      },
      pricing: {
        baseCurrency: product.pricing.baseCurrency || 'USD',
        basePrice: product.pricing.basePrice || 0,
        costPrice: product.pricing.costPrice || 0,
        sellingPrice: product.pricing.sellingPrice || 0,
        wholesalePrice: product.pricing.wholesalePrice || 0,
        retailPrice: product.pricing.retailPrice || 0,
        taxRate: product.pricing.taxRate || 0
      },
      inventory: {
        trackInventory: product.inventory.trackInventory,
        stockUnit: product.inventory.stockUnit || 'piece',
        minimumStock: product.inventory.minimumStock,
        maximumStock: product.inventory.maximumStock,
        reorderLevel: product.inventory.reorderLevel,
        currentStock: product.inventory.currentStock
      },
      supplier: product.supplier,
      supplierInfo: {
        minimumOrderQuantity: product.supplierInfo.minimumOrderQuantity,
        leadTime: product.supplierInfo.leadTime
      },
      shipping: {
        isShippable: product.shipping.isShippable,
        requiresSpecialHandling: product.shipping.requiresSpecialHandling,
        hazardous: product.shipping.hazardous
      },
      tags: product.tags
    });
    setShowEditModal(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    try {
      setLoading(true);
      const response = await productApi.updateProduct(editingProduct._id, editForm);
      
      if (response.success) {
        setShowEditModal(false);
        setEditingProduct(null);
        loadProducts();
        setError(null);
      }
    } catch (err: any) {
      setError('Error updating product: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const response = await productApi.deleteProduct(productId);
      if (response.success) {
        loadProducts();
      }
    } catch (err: any) {
      setError('Error deleting product: ' + (err.message || 'Unknown error'));
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await productApi.createCategory(categoryForm);
      if (response.success) {
        setShowCategoryModal(false);
        loadCategories();
        setCategoryForm({ name: '', description: '' });
        // Clear modal messages
        setModalError(null);
        setModalSuccess(null);
        // Show success message at the top of the page as well
        setSuccess('Category created successfully');
        setError(null);
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        // Show specific error message from backend in the modal
        setModalError(response.message || 'Error creating category');
        setSuccess(null);
      }
    } catch (err: any) {
      // Handle error response data
      console.log('Category creation error:', err);
      
      // Check if this is an axios error with response data
      let errorMessage = '';
      if (err && err.response && err.response.data) {
        const errorData = err.response.data;
        console.log('Error response data:', errorData);
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.errors) {
          // Handle validation errors
          errorMessage = 'Validation error: ' + JSON.stringify(errorData.errors);
        } else {
          errorMessage = 'Error creating category: ' + JSON.stringify(errorData);
        }
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = err.message || 'Error creating category';
      } else if (err && err.message) {
        errorMessage = 'Error creating category: ' + err.message;
      } else {
        errorMessage = 'Error creating category: ' + (err ? JSON.stringify(err) : 'Unknown error');
      }
      
      // Show error message in the modal
      setModalError(errorMessage);
      setSuccess(null);
    }
  };

  const viewProductDetails = async (product: Product) => {
    try {
      const response = await productApi.getProduct(product._id);
      if (response.success) {
        setSelectedProduct(response.data);
        setShowDetailsModal(true);
      }
    } catch (err: any) {
      setError('Error loading product details: ' + (err.message || 'Unknown error'));
    }
  };

  // Filter products based on search and filters
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesSupplier = supplierFilter === 'all' || product.supplier === supplierFilter;
    return matchesSearch && matchesCategory && matchesStatus && matchesSupplier;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage);

  // Statistics
  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.status === 'active').length,
    lowStockProducts: products.filter(p => p.inventory.currentStock <= p.inventory.reorderLevel).length,
    outOfStockProducts: products.filter(p => p.inventory.currentStock === 0).length,
    totalValue: products.reduce((sum, product) => sum + (product.inventory.currentStock * product.pricing.costPrice), 0),
    averageMargin: products.length > 0 ? products.reduce((sum, product) => sum + (product.pricing.margin || 0), 0) / products.length : 0
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; bgColor: string }> = {
      active: { color: 'text-green-800', bgColor: 'bg-green-100' },
      inactive: { color: 'text-gray-800', bgColor: 'bg-gray-100' },
      discontinued: { color: 'text-red-800', bgColor: 'bg-red-100' },
      out_of_stock: { color: 'text-orange-800', bgColor: 'bg-orange-100' }
    };
    return configs[status] || { color: 'text-gray-800', bgColor: 'bg-gray-100' };
  };

  const getStockStatusColor = (product: Product) => {
    if (product.inventory.currentStock === 0) return 'text-red-600';
    if (product.inventory.currentStock <= product.inventory.reorderLevel) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Catalog</h1>
          <p className="text-gray-600 mt-1">Manage product catalog and warehouse inventory</p>
        </div>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <RoleBasedAccess module="products" action="create">
            <button 
              onClick={() => {
                setShowCategoryModal(true);
                // Clear any previous modal messages when opening
                setModalError(null);
                setModalSuccess(null);
              }}
              className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Tag className="w-4 h-4 mr-1" />
              Add Category
            </button>
          </RoleBasedAccess>
          <RoleBasedAccess module="products" action="create">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </button>
          </RoleBasedAccess>
        </div>
      </div>

      {/* Success Display */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category._id} value={category.name}>{category.name}</option>
              ))}
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="discontinued">Discontinued</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
            
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Suppliers</option>
              {suppliers.map(supplier => (
                <option key={supplier._id} value={supplier._id}>{supplier.companyName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalProducts}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Products</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.activeProducts}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Package className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.lowStockProducts}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Warehouses</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{warehouses.length}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <WarehouseIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Products Display */}
      {products.length === 0 && !loading ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
          <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' 
              ? 'No products match your current filters.' 
              : 'Start by adding your first product.'}
          </p>
          <RoleBasedAccess module="products" action="create">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </button>
          </RoleBasedAccess>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentProducts.map((product) => {
                  const statusConfig = getStatusConfig(product.status);
                  const supplier = suppliers.find(s => s._id === product.supplier);
                  return (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.productCode}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.category}</div>
                        {product.subcategory && (
                          <div className="text-sm text-gray-500">{product.subcategory}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {supplier ? supplier.companyName : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${getStockStatusColor(product)}`}>
                          {product.inventory.currentStock} {product.inventory.stockUnit}
                        </div>
                        {product.inventory.reorderLevel > 0 && (
                          <div className="text-xs text-gray-500">
                            Reorder at: {product.inventory.reorderLevel}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(product.pricing.sellingPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}>
                          {product.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <RoleBasedAccess module="products" action="read">
                            <button 
                              onClick={() => viewProductDetails(product)}
                              className="text-primary-600 hover:text-primary-900"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </RoleBasedAccess>
                          <RoleBasedAccess module="products" action="update">
                            <button 
                              onClick={() => handleEditProduct(product)}
                              className="text-gray-600 hover:text-gray-900"
                              title="Edit Product"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </RoleBasedAccess>
                          <RoleBasedAccess module="products" action="delete">
                            <button 
                              onClick={() => handleDeleteProduct(product._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </RoleBasedAccess>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(startIndex + productsPerPage, filteredProducts.length)}</span> of{' '}
                    <span className="font-medium">{filteredProducts.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowCreateModal(false)}></div>
            <div className="relative bg-white rounded-lg max-w-4xl w-full p-6 max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New Product</h3>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleCreateProduct} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                    <input
                      type="text"
                      required
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      required
                      value={createForm.category}
                      onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category._id} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                    <input
                      type="text"
                      value={createForm.brand || ''}
                      onChange={(e) => setCreateForm({ ...createForm, brand: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                    <select
                      required
                      value={createForm.supplier}
                      onChange={(e) => setCreateForm({ ...createForm, supplier: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier._id} value={supplier._id}>{supplier.companyName}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Pricing Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={createForm.pricing.costPrice}
                        onChange={(e) => setCreateForm({
                          ...createForm,
                          pricing: { ...createForm.pricing, costPrice: parseFloat(e.target.value) || 0, basePrice: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={createForm.pricing.sellingPrice}
                        onChange={(e) => setCreateForm({
                          ...createForm,
                          pricing: { ...createForm.pricing, sellingPrice: parseFloat(e.target.value) || 0, basePrice: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                      <select
                        value={createForm.pricing.baseCurrency}
                        onChange={(e) => setCreateForm({
                          ...createForm,
                          pricing: { ...createForm.pricing, baseCurrency: e.target.value as any }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="CNY">CNY</option>
                        <option value="BDT">BDT</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Inventory Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={createForm.inventory.currentStock}
                        onChange={(e) => setCreateForm({
                          ...createForm,
                          inventory: { ...createForm.inventory, currentStock: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stock Unit</label>
                      <select
                        value={createForm.inventory.stockUnit}
                        onChange={(e) => setCreateForm({
                          ...createForm,
                          inventory: { ...createForm.inventory, stockUnit: e.target.value as any }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="piece">Piece</option>
                        <option value="pack">Pack</option>
                        <option value="box">Box</option>
                        <option value="carton">Carton</option>
                        <option value="kg">Kilogram</option>
                        <option value="g">Gram</option>
                        <option value="liter">Liter</option>
                        <option value="meter">Meter</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                      <input
                        type="number"
                        min="0"
                        value={createForm.inventory.reorderLevel}
                        onChange={(e) => setCreateForm({
                          ...createForm,
                          inventory: { ...createForm.inventory, reorderLevel: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock</label>
                      <input
                        type="number"
                        min="0"
                        value={createForm.inventory.minimumStock}
                        onChange={(e) => setCreateForm({
                          ...createForm,
                          inventory: { ...createForm.inventory, minimumStock: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowEditModal(false)}></div>
            <div className="relative bg-white rounded-lg max-w-4xl w-full p-6 max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Product</h3>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateProduct} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={editForm.category || ''}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category._id} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                    <input
                      type="text"
                      value={editForm.brand || ''}
                      onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                    <select
                      value={editForm.supplier || ''}
                      onChange={(e) => setEditForm({ ...editForm, supplier: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier._id} value={supplier._id}>{supplier.companyName}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Pricing Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.pricing?.costPrice || 0}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          pricing: { 
                            baseCurrency: editForm.pricing?.baseCurrency || 'USD',
                            basePrice: parseFloat(e.target.value) || 0,
                            costPrice: parseFloat(e.target.value) || 0,
                            sellingPrice: editForm.pricing?.sellingPrice || 0,
                            wholesalePrice: editForm.pricing?.wholesalePrice || 0,
                            retailPrice: editForm.pricing?.retailPrice || 0,
                            taxRate: editForm.pricing?.taxRate || 0
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.pricing?.sellingPrice || 0}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          pricing: { 
                            baseCurrency: editForm.pricing?.baseCurrency || 'USD',
                            basePrice: parseFloat(e.target.value) || 0,
                            costPrice: editForm.pricing?.costPrice || 0,
                            sellingPrice: parseFloat(e.target.value) || 0,
                            wholesalePrice: editForm.pricing?.wholesalePrice || 0,
                            retailPrice: editForm.pricing?.retailPrice || 0,
                            taxRate: editForm.pricing?.taxRate || 0
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                      <select
                        value={editForm.pricing?.baseCurrency || 'USD'}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          pricing: { 
                            baseCurrency: e.target.value as any,
                            basePrice: editForm.pricing?.basePrice || 0,
                            costPrice: editForm.pricing?.costPrice || 0,
                            sellingPrice: editForm.pricing?.sellingPrice || 0,
                            wholesalePrice: editForm.pricing?.wholesalePrice || 0,
                            retailPrice: editForm.pricing?.retailPrice || 0,
                            taxRate: editForm.pricing?.taxRate || 0
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="CNY">CNY</option>
                        <option value="BDT">BDT</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Inventory Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.inventory?.currentStock || 0}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          inventory: { ...editForm.inventory, currentStock: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stock Unit</label>
                      <select
                        value={editForm.inventory?.stockUnit || 'piece'}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          inventory: { ...editForm.inventory, stockUnit: e.target.value as any }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="piece">Piece</option>
                        <option value="pack">Pack</option>
                        <option value="box">Box</option>
                        <option value="carton">Carton</option>
                        <option value="kg">Kilogram</option>
                        <option value="g">Gram</option>
                        <option value="liter">Liter</option>
                        <option value="meter">Meter</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.inventory?.reorderLevel || 0}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          inventory: { ...editForm.inventory, reorderLevel: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.inventory?.minimumStock || 0}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          inventory: { ...editForm.inventory, minimumStock: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowCategoryModal(false)}></div>
            <div className="relative bg-white rounded-lg max-w-4xl w-full p-6 max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New Category</h3>
                <button 
                  onClick={() => setShowCategoryModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleCreateCategory} className="space-y-6">
                {/* Modal Success Message */}
                {modalSuccess && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                    {modalSuccess}
                  </div>
                )}
                
                {/* Modal Error Message */}
                {modalError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {modalError}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                    <input
                      type="text"
                      required
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {showDetailsModal && selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowDetailsModal(false)}></div>
            <div className="relative bg-white rounded-lg max-w-4xl w-full p-6 max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Product Details</h3>
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <p className="text-gray-900">{selectedProduct.name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <p className="text-gray-900">{selectedProduct.category}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <p className="text-gray-900">{selectedProduct.brand || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <p className="text-gray-900">
                    {suppliers.find(s => s._id === selectedProduct.supplier)?.companyName || 'N/A'}
                  </p>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-gray-900">{selectedProduct.description}</p>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-4">Pricing Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
                    <p className="text-gray-900">{formatCurrency(selectedProduct.pricing.costPrice)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price</label>
                    <p className="text-gray-900">{formatCurrency(selectedProduct.pricing.sellingPrice)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <p className="text-gray-900">{selectedProduct.pricing.baseCurrency}</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-4">Inventory Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                    <p className="text-gray-900">{selectedProduct.inventory.currentStock} {selectedProduct.inventory.stockUnit}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Unit</label>
                    <p className="text-gray-900">{selectedProduct.inventory.stockUnit}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                    <p className="text-gray-900">{selectedProduct.inventory.reorderLevel}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock</label>
                    <p className="text-gray-900">{selectedProduct.inventory.minimumStock}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
