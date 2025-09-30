import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Filter, Plus, Eye, Edit, Truck, Package, MapPin, Calendar, Clock, AlertCircle } from 'lucide-react';
import { fetchOrders } from '../store/slices/orderSlice';
import type { AppDispatch, RootState } from '../store';
import type { Order } from '../api/orderApi';
import RoleBasedAccess from '../components/RoleBasedAccess';
import { useRolePermissions } from '../hooks/useRolePermissions';

// Order Status Colors and Icons
const getStatusConfig = (status: string) => {
  const configs: Record<string, { color: string; bgColor: string; icon: React.ReactNode }> = {
    pending: { color: 'text-yellow-800', bgColor: 'bg-yellow-100', icon: <Clock className="w-4 h-4" /> },
    confirmed: { color: 'text-blue-800', bgColor: 'bg-blue-100', icon: <Package className="w-4 h-4" /> },
    supplier_contacted: { color: 'text-purple-800', bgColor: 'bg-purple-100', icon: <Package className="w-4 h-4" /> },
    supplier_confirmed: { color: 'text-indigo-800', bgColor: 'bg-indigo-100', icon: <Package className="w-4 h-4" /> },
    payment_pending: { color: 'text-orange-800', bgColor: 'bg-orange-100', icon: <AlertCircle className="w-4 h-4" /> },
    payment_received: { color: 'text-green-800', bgColor: 'bg-green-100', icon: <Package className="w-4 h-4" /> },
    procurement_started: { color: 'text-blue-800', bgColor: 'bg-blue-100', icon: <Package className="w-4 h-4" /> },
    china_warehouse: { color: 'text-cyan-800', bgColor: 'bg-cyan-100', icon: <MapPin className="w-4 h-4" /> },
    international_shipping: { color: 'text-purple-800', bgColor: 'bg-purple-100', icon: <Truck className="w-4 h-4" /> },
    customs_clearance: { color: 'text-yellow-800', bgColor: 'bg-yellow-100', icon: <AlertCircle className="w-4 h-4" /> },
    local_warehouse: { color: 'text-blue-800', bgColor: 'bg-blue-100', icon: <MapPin className="w-4 h-4" /> },
    ready_for_delivery: { color: 'text-green-800', bgColor: 'bg-green-100', icon: <Truck className="w-4 h-4" /> },
    out_for_delivery: { color: 'text-orange-800', bgColor: 'bg-orange-100', icon: <Truck className="w-4 h-4" /> },
    delivered: { color: 'text-green-800', bgColor: 'bg-green-100', icon: <Package className="w-4 h-4" /> },
    completed: { color: 'text-green-800', bgColor: 'bg-green-100', icon: <Package className="w-4 h-4" /> },
    cancelled: { color: 'text-red-800', bgColor: 'bg-red-100', icon: <AlertCircle className="w-4 h-4" /> },
    returned: { color: 'text-gray-800', bgColor: 'bg-gray-100', icon: <Package className="w-4 h-4" /> },
    refunded: { color: 'text-red-800', bgColor: 'bg-red-100', icon: <AlertCircle className="w-4 h-4" /> }
  };
  return configs[status] || { color: 'text-gray-800', bgColor: 'bg-gray-100', icon: <Package className="w-4 h-4" /> };
};

const Orders: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { hasPermission } = useRolePermissions();
  const { orders, isLoading, error } = useSelector((state: RootState) => state.orders);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  useEffect(() => {
    dispatch(fetchOrders({}));
  }, [dispatch]);

  // Mock data for demonstration since backend might not be connected
  const mockOrders: Order[] = [
    {
      _id: '1',
      orderNumber: 'ORD-2024-001',
      customer: 'CUST-001',
      status: 'china_warehouse',
      priority: 'high',
      items: [{ product: 'PROD-001', productName: 'Wireless Headphones', productCode: 'WH-001', quantity: 2, unitPrice: 50, totalPrice: 100 }],
      pricing: { subtotal: 100, discount: 0, discountType: 'fixed' as const, tax: 10, taxRate: 10, shippingCost: 15, handlingFee: 5, total: 130, currency: 'USD' as const },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Order,
    {
      _id: '2',
      orderNumber: 'ORD-2024-002',
      customer: 'CUST-002',
      status: 'delivered',
      priority: 'medium',
      items: [{ product: 'PROD-002', productName: 'Smart Watch', productCode: 'SW-001', quantity: 1, unitPrice: 200, totalPrice: 200 }],
      pricing: { subtotal: 200, discount: 20, discountType: 'fixed' as const, tax: 18, taxRate: 9, shippingCost: 20, handlingFee: 5, total: 203, currency: 'USD' as const },
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    } as Order
  ];

  // Use mock data if no orders from API
  const displayOrders = orders.length > 0 ? orders : mockOrders;

  // Filter orders based on search and filters
  const filteredOrders = displayOrders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const currentOrders = filteredOrders.slice(startIndex, startIndex + ordersPerPage);

  // Statistics
  const stats = {
    total: displayOrders.length,
    pending: displayOrders.filter(o => ['pending', 'confirmed'].includes(o.status)).length,
    processing: displayOrders.filter(o => ['supplier_contacted', 'payment_pending', 'procurement_started'].includes(o.status)).length,
    shipping: displayOrders.filter(o => ['china_warehouse', 'international_shipping', 'customs_clearance'].includes(o.status)).length,
    delivered: displayOrders.filter(o => ['delivered', 'completed'].includes(o.status)).length
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-4 w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="h-4 bg-gray-300 rounded mb-3 w-2/3"></div>
                <div className="h-8 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 mt-1">Track orders from China to customer delivery with 17-stage tracking</p>
        </div>
        <RoleBasedAccess module="orders" action="create">
          <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </button>
        </RoleBasedAccess>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Transit</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{stats.shipping}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Truck className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.delivered}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Package className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="china_warehouse">China Warehouse</option>
              <option value="international_shipping">International Shipping</option>
              <option value="local_warehouse">Local Warehouse</option>
              <option value="delivered">Delivered</option>
            </select>
            
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentOrders.map((order) => {
                const statusConfig = getStatusConfig(order.status);
                return (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.items.length} items
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.customer}
                        </div>
                        <div className="text-sm text-gray-500">
                          Customer ID
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                        {statusConfig.icon}
                        <span className="ml-1">{order.status.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        order.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        order.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        order.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {order.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(order.pricing.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <RoleBasedAccess module="orders" action="read">
                          <button className="text-primary-600 hover:text-primary-900" title="View Order">
                            <Eye className="w-4 h-4" />
                          </button>
                        </RoleBasedAccess>
                        <RoleBasedAccess module="orders" action="update">
                          <button className="text-gray-600 hover:text-gray-900" title="Edit Order">
                            <Edit className="w-4 h-4" />
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
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(startIndex + ordersPerPage, filteredOrders.length)}</span> of{' '}
                  <span className="font-medium">{filteredOrders.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(index + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === index + 1
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error loading orders: {error}
        </div>
      )}
    </div>
  );
};

export default Orders;