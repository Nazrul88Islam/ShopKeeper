import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { dashboardApi, type DashboardData, type DashboardStats, type RecentOrder, type SystemOverview } from '../api/dashboardApi';
import {
  BarChart3,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Truck,
  Building2,
  FileText,
  Calendar,
  Activity,
  RefreshCw
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [systemOverview, setSystemOverview] = useState<SystemOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | '7days' | '30days' | '90days' | '1year'>('30days');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [dashboardResponse, systemResponse] = await Promise.all([
        dashboardApi.getDashboardData({ period: selectedPeriod }),
        dashboardApi.getSystemOverview()
      ]);
      
      if (dashboardResponse.success) {
        setDashboardData(dashboardResponse.data);
        setStats(dashboardResponse.data.stats);
        setRecentOrders(dashboardResponse.data.recentOrders);
      } else {
        setError('Failed to load dashboard data');
      }
      
      if (systemResponse.success) {
        setSystemOverview(systemResponse.data);
      }
      
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard data');
      console.error('Dashboard loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-6 w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="h-4 bg-gray-300 rounded mb-3 w-2/3"></div>
                <div className="h-8 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.firstName || 'User'}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your courier management system today.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="1year">Last Year</option>
          </select>
          <button 
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats && (
          <>
            <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalOrders.count.toLocaleString()}</p>
                  <p className={`text-sm mt-1 ${getTrendColor(stats.totalOrders.trend)}`}>
                    {formatChange(stats.totalOrders.change)} from last period
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500 text-white">
                  <ShoppingCart className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.revenue.total, stats.revenue.currency)}</p>
                  <p className={`text-sm mt-1 ${getTrendColor(stats.revenue.trend)}`}>
                    {formatChange(stats.revenue.change)} from last period
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-500 text-white">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Products</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.products.total.toLocaleString()}</p>
                  <p className={`text-sm mt-1 ${getTrendColor(stats.products.trend)}`}>
                    {formatChange(stats.products.change)} from last period
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-500 text-white">
                  <Package className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Customers</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.customers.total.toLocaleString()}</p>
                  <p className={`text-sm mt-1 ${getTrendColor(stats.customers.trend)}`}>
                    {formatChange(stats.customers.change)} from last period
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-indigo-500 text-white">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingOrders.count.toLocaleString()}</p>
                  <p className={`text-sm mt-1 ${getTrendColor(stats.pendingOrders.trend)}`}>
                    {formatChange(stats.pendingOrders.change)} from last period
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-orange-500 text-white">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Transit</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.inTransit.count.toLocaleString()}</p>
                  <p className={`text-sm mt-1 ${getTrendColor(stats.inTransit.trend)}`}>
                    {formatChange(stats.inTransit.change)} from last period
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-cyan-500 text-white">
                  <Truck className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Warehouses</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.warehouses.active}/{stats.warehouses.total}</p>
                  <p className={`text-sm mt-1 ${getTrendColor(stats.warehouses.trend)}`}>
                    {formatChange(stats.warehouses.change)} from last period
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-gray-500 text-white">
                  <Building2 className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Reports Generated</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.reports.generated.toLocaleString()}</p>
                  <p className={`text-sm mt-1 ${getTrendColor(stats.reports.trend)}`}>
                    {formatChange(stats.reports.change)} from last period
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-pink-500 text-white">
                  <FileText className="w-6 h-6" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{order.orderNumber}</p>
                    <p className="text-sm text-gray-600">{order.customer.fullName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(order.total, order.currency)}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent orders found</p>
            )}
          </div>
        </div>

        {/* System Overview */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">System Overview</h3>
            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Manage
            </button>
          </div>
          <div className="space-y-4">
            {systemOverview ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Package className="w-5 h-5 text-blue-600 mr-3" />
                    <span className="text-gray-700">Inventory Items</span>
                  </div>
                  <span className="font-medium text-gray-900">{systemOverview.inventoryItems.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Building2 className="w-5 h-5 text-green-600 mr-3" />
                    <span className="text-gray-700">Active Warehouses</span>
                  </div>
                  <span className="font-medium text-gray-900">{systemOverview.activeWarehouses}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-purple-600 mr-3" />
                    <span className="text-gray-700">Team Members</span>
                  </div>
                  <span className="font-medium text-gray-900">{systemOverview.teamMembers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Truck className="w-5 h-5 text-orange-600 mr-3" />
                    <span className="text-gray-700">Active Shipments</span>
                  </div>
                  <span className="font-medium text-gray-900">{systemOverview.activeShipments}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                    <span className="text-gray-700">Low Stock Items</span>
                  </div>
                  <span className="font-medium text-red-600">{systemOverview.lowStockItems}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-yellow-600 mr-3" />
                    <span className="text-gray-700">Overdue Orders</span>
                  </div>
                  <span className="font-medium text-yellow-600">{systemOverview.overdueOrders}</span>
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-center py-4">Loading system overview...</p>
            )}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Sales & Order Trends</h3>
          <div className="flex items-center space-x-2">
            <button className={`px-3 py-1 text-sm rounded-md ${
              selectedPeriod === '7days' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
            }`} onClick={() => setSelectedPeriod('7days')}>
              7 Days
            </button>
            <button className={`px-3 py-1 text-sm rounded-md ${
              selectedPeriod === '30days' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
            }`} onClick={() => setSelectedPeriod('30days')}>
              30 Days
            </button>
            <button className={`px-3 py-1 text-sm rounded-md ${
              selectedPeriod === '90days' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
            }`} onClick={() => setSelectedPeriod('90days')}>
              90 Days
            </button>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Chart Component</p>
            <p className="text-sm text-gray-500">Sales and order analytics will be displayed here</p>
            {dashboardData && (
              <p className="text-xs text-gray-400 mt-2">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;