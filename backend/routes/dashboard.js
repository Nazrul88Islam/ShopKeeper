const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Warehouse = require('../models/Warehouse');
const Inventory = require('../models/Inventory');
const ChartOfAccounts = require('../models/ChartOfAccounts');
const JournalEntry = require('../models/JournalEntry');
const User = require('../models/User');

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Dashboard API is working' });
});

// @desc    Get comprehensive dashboard data
// @route   GET /api/dashboard
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { period = '30days' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate, endDate = now;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Previous period for comparison
    const periodDuration = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodDuration);
    const prevEndDate = new Date(startDate.getTime());

    // Parallel data fetching
    const [
      currentStats,
      previousStats,
      recentOrders,
      systemOverview,
      salesChartData,
      orderChartData
    ] = await Promise.all([
      getDashboardStats(startDate, endDate),
      getDashboardStats(prevStartDate, prevEndDate),
      getRecentOrders(),
      getSystemOverview(),
      getSalesChartData(startDate, endDate, period),
      getOrderChartData(startDate, endDate, period)
    ]);

    // Calculate trends
    const stats = calculateTrends(currentStats, previousStats);

    res.json({
      success: true,
      data: {
        stats,
        recentOrders,
        systemOverview,
        salesChart: salesChartData,
        orderChart: orderChartData
      }
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
});

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const { period = '30days', compare = true } = req.query;
    
    const now = new Date();
    let startDate, endDate = now;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const currentStats = await getDashboardStats(startDate, endDate);
    
    let stats = {
      totalOrders: { count: currentStats.totalOrders, change: 0, trend: 'neutral' },
      revenue: { total: currentStats.revenue, change: 0, trend: 'neutral', currency: 'USD' },
      products: { total: currentStats.products, change: 0, trend: 'neutral' },
      customers: { total: currentStats.customers, change: 0, trend: 'neutral' },
      pendingOrders: { count: currentStats.pendingOrders, change: 0, trend: 'neutral' },
      inTransit: { count: currentStats.inTransit, change: 0, trend: 'neutral' },
      warehouses: { total: currentStats.warehouses, active: currentStats.activeWarehouses, change: 0, trend: 'neutral' },
      reports: { generated: currentStats.reports, change: 0, trend: 'neutral' }
    };

    if (compare) {
      const periodDuration = endDate.getTime() - startDate.getTime();
      const prevStartDate = new Date(startDate.getTime() - periodDuration);
      const prevEndDate = new Date(startDate.getTime());
      
      const previousStats = await getDashboardStats(prevStartDate, prevEndDate);
      stats = calculateTrends(currentStats, previousStats);
    }

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
});

// @desc    Get recent orders
// @route   GET /api/dashboard/recent-orders
// @access  Private
router.get('/recent-orders', protect, async (req, res) => {
  try {
    const { limit = 5, status } = req.query;
    
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('customer', 'firstName lastName fullName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    const recentOrders = orders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      customer: {
        firstName: order.customer?.firstName || '',
        lastName: order.customer?.lastName || '',
        fullName: order.customer?.fullName || `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim()
      },
      status: order.status,
      total: order.pricing?.total || 0,
      currency: order.pricing?.currency || 'USD',
      createdAt: order.createdAt
    }));

    res.json({ success: true, data: recentOrders });
  } catch (error) {
    console.error('Recent orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent orders',
      error: error.message
    });
  }
});

// @desc    Get system overview
// @route   GET /api/dashboard/system-overview
// @access  Private
router.get('/system-overview', protect, async (req, res) => {
  try {
    const [
      inventoryCount,
      warehouseCount,
      userCount,
      inTransitCount,
      lowStockCount,
      overdueCount
    ] = await Promise.all([
      Inventory.countDocuments(),
      Warehouse.countDocuments({ status: 'active' }),
      User.countDocuments({ isActive: true }),
      Order.countDocuments({ status: { $in: ['international_shipping', 'customs_clearance', 'out_for_delivery'] } }),
      Inventory.countDocuments({ $expr: { $lte: ['$stock.onHand', '$reorderPoint.minimum'] } }),
      Order.countDocuments({ 
        'payment.status': { $nin: ['paid'] },
        'payment.dueDate': { $lt: new Date() }
      })
    ]);

    const systemOverview = {
      inventoryItems: inventoryCount,
      activeWarehouses: warehouseCount,
      teamMembers: userCount,
      activeShipments: inTransitCount,
      lowStockItems: lowStockCount,
      overdueOrders: overdueCount
    };

    res.json({ success: true, data: systemOverview });
  } catch (error) {
    console.error('System overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system overview',
      error: error.message
    });
  }
});

// @desc    Get sales chart data
// @route   GET /api/dashboard/sales-chart
// @access  Private
router.get('/sales-chart', protect, async (req, res) => {
  try {
    const { period = '30days', groupBy = 'day' } = req.query;
    
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const salesData = await getSalesChartData(startDate, now, period);
    res.json({ success: true, data: salesData });
  } catch (error) {
    console.error('Sales chart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sales chart data',
      error: error.message
    });
  }
});

// @desc    Get order chart data
// @route   GET /api/dashboard/order-chart
// @access  Private
router.get('/order-chart', protect, async (req, res) => {
  try {
    const { period = '30days', groupBy = 'day' } = req.query;
    
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const orderData = await getOrderChartData(startDate, now, period);
    res.json({ success: true, data: orderData });
  } catch (error) {
    console.error('Order chart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order chart data',
      error: error.message
    });
  }
});

// @desc    Get financial summary
// @route   GET /api/dashboard/financial-summary
// @access  Private
router.get('/financial-summary', protect, async (req, res) => {
  try {
    const { period = '30days' } = req.query;
    
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get financial data from Chart of Accounts and Journal Entries
    const [revenueAccounts, expenseAccounts, assetAccounts, liabilityAccounts] = await Promise.all([
      ChartOfAccounts.find({ accountType: 'REVENUE', isActive: true }),
      ChartOfAccounts.find({ accountType: 'EXPENSE', isActive: true }),
      ChartOfAccounts.find({ accountType: 'ASSET', isActive: true }),
      ChartOfAccounts.find({ accountType: 'LIABILITY', isActive: true })
    ]);

    const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
    const totalExpenses = expenseAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
    const totalAssets = assetAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
    const totalLiabilities = liabilityAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

    // Calculate AR and AP
    const accountsReceivable = assetAccounts
      .filter(acc => acc.accountSubCategory === 'ACCOUNTS_RECEIVABLE')
      .reduce((sum, acc) => sum + acc.currentBalance, 0);
    
    const accountsPayable = liabilityAccounts
      .filter(acc => acc.accountSubCategory === 'ACCOUNTS_PAYABLE')
      .reduce((sum, acc) => sum + acc.currentBalance, 0);

    // Calculate cash flow (simplified)
    const cashAccounts = assetAccounts
      .filter(acc => acc.accountSubCategory === 'CASH_AND_CASH_EQUIVALENTS')
      .reduce((sum, acc) => sum + acc.currentBalance, 0);

    const netProfit = totalRevenue - totalExpenses;
    const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;
    const operatingMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const financialSummary = {
      totalRevenue,
      totalExpenses,
      netProfit,
      grossMargin,
      operatingMargin,
      accountsReceivable,
      accountsPayable,
      cashFlow: cashAccounts
    };

    res.json({ success: true, data: financialSummary });
  } catch (error) {
    console.error('Financial summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching financial summary',
      error: error.message
    });
  }
});

// Helper functions
async function getDashboardStats(startDate, endDate) {
  const [
    totalOrders,
    completedOrders,
    totalProducts,
    totalCustomers,
    pendingOrders,
    inTransitOrders,
    totalWarehouses,
    activeWarehouses
  ] = await Promise.all([
    Order.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
    Order.find({ 
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ['delivered', 'completed'] }
    }).select('pricing.total'),
    Product.countDocuments({ isActive: true }),
    Customer.countDocuments({ status: 'active' }),
    Order.countDocuments({ status: 'pending' }),
    Order.countDocuments({ status: { $in: ['international_shipping', 'customs_clearance', 'out_for_delivery'] } }),
    Warehouse.countDocuments(),
    Warehouse.countDocuments({ status: 'active' })
  ]);

  const revenue = completedOrders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0);

  return {
    totalOrders,
    revenue,
    products: totalProducts,
    customers: totalCustomers,
    pendingOrders,
    inTransit: inTransitOrders,
    warehouses: totalWarehouses,
    activeWarehouses,
    reports: 0 // Would track report generation if implemented
  };
}

function calculateTrends(current, previous) {
  const calculateChange = (currentVal, previousVal) => {
    if (previousVal === 0) return currentVal > 0 ? 100 : 0;
    return ((currentVal - previousVal) / previousVal) * 100;
  };

  const getTrend = (change) => {
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'neutral';
  };

  return {
    totalOrders: {
      count: current.totalOrders,
      change: calculateChange(current.totalOrders, previous.totalOrders),
      trend: getTrend(calculateChange(current.totalOrders, previous.totalOrders))
    },
    revenue: {
      total: current.revenue,
      change: calculateChange(current.revenue, previous.revenue),
      trend: getTrend(calculateChange(current.revenue, previous.revenue)),
      currency: 'USD'
    },
    products: {
      total: current.products,
      change: calculateChange(current.products, previous.products),
      trend: getTrend(calculateChange(current.products, previous.products))
    },
    customers: {
      total: current.customers,
      change: calculateChange(current.customers, previous.customers),
      trend: getTrend(calculateChange(current.customers, previous.customers))
    },
    pendingOrders: {
      count: current.pendingOrders,
      change: calculateChange(current.pendingOrders, previous.pendingOrders),
      trend: getTrend(calculateChange(current.pendingOrders, previous.pendingOrders))
    },
    inTransit: {
      count: current.inTransit,
      change: calculateChange(current.inTransit, previous.inTransit),
      trend: getTrend(calculateChange(current.inTransit, previous.inTransit))
    },
    warehouses: {
      total: current.warehouses,
      active: current.activeWarehouses,
      change: calculateChange(current.activeWarehouses, previous.activeWarehouses),
      trend: getTrend(calculateChange(current.activeWarehouses, previous.activeWarehouses))
    },
    reports: {
      generated: current.reports,
      change: calculateChange(current.reports, previous.reports),
      trend: getTrend(calculateChange(current.reports, previous.reports))
    }
  };
}

async function getRecentOrders() {
  const orders = await Order.find({})
    .populate('customer', 'firstName lastName fullName')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return orders.map(order => ({
    _id: order._id,
    orderNumber: order.orderNumber,
    customer: {
      firstName: order.customer?.firstName || '',
      lastName: order.customer?.lastName || '',
      fullName: order.customer?.fullName || `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim()
    },
    status: order.status,
    total: order.pricing?.total || 0,
    currency: order.pricing?.currency || 'USD',
    createdAt: order.createdAt
  }));
}

async function getSystemOverview() {
  const [
    inventoryCount,
    warehouseCount,
    userCount,
    inTransitCount,
    lowStockCount,
    overdueCount
  ] = await Promise.all([
    Inventory.countDocuments(),
    Warehouse.countDocuments({ status: 'active' }),
    User.countDocuments({ isActive: true }),
    Order.countDocuments({ status: { $in: ['international_shipping', 'customs_clearance', 'out_for_delivery'] } }),
    Inventory.countDocuments({ $expr: { $lte: ['$stock.onHand', '$reorderPoint.minimum'] } }),
    Order.countDocuments({ 
      'payment.status': { $nin: ['paid'] },
      'payment.dueDate': { $lt: new Date() }
    })
  ]);

  return {
    inventoryItems: inventoryCount,
    activeWarehouses: warehouseCount,
    teamMembers: userCount,
    activeShipments: inTransitCount,
    lowStockItems: lowStockCount,
    overdueOrders: overdueCount
  };
}

async function getSalesChartData(startDate, endDate, period) {
  // Simplified chart data - would implement proper aggregation
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const labels = [];
  const data = [];

  for (let i = 0; i < Math.min(days, 30); i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    // Mock data - replace with actual aggregation
    data.push(Math.floor(Math.random() * 10000) + 5000);
  }

  return {
    labels,
    datasets: [{
      label: 'Sales Revenue',
      data,
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderColor: 'rgb(59, 130, 246)',
      fill: true
    }]
  };
}

async function getOrderChartData(startDate, endDate, period) {
  // Simplified chart data - would implement proper aggregation
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const labels = [];
  const data = [];

  for (let i = 0; i < Math.min(days, 30); i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    // Mock data - replace with actual aggregation
    data.push(Math.floor(Math.random() * 50) + 10);
  }

  return {
    labels,
    datasets: [{
      label: 'Orders',
      data,
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderColor: 'rgb(16, 185, 129)',
      fill: true
    }]
  };
}

// Enhanced Order Analytics
router.get('/order-analytics', protect, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const endDate = new Date();
    let startDate;
    
    switch (period) {
      case '24h':
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const [ordersByStatus, recentOrders, topCustomers, orderTrends] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalValue: { $sum: '$pricing.total' }
          }
        },
        { $sort: { count: -1 } }
      ]),
      Order.find({
        createdAt: { $gte: startDate, $lte: endDate }
      })
        .populate('customer', 'name email company')
        .select('orderNumber customer status pricing.total createdAt priority')
        .sort({ createdAt: -1 })
        .limit(10),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $in: ['delivered', 'completed'] }
          }
        },
        {
          $group: {
            _id: '$customer',
            orderCount: { $sum: 1 },
            totalValue: { $sum: '$pricing.total' }
          }
        },
        {
          $lookup: {
            from: 'customers',
            localField: '_id',
            foreignField: '_id',
            as: 'customerInfo'
          }
        },
        { $unwind: '$customerInfo' },
        { $sort: { totalValue: -1 } },
        { $limit: 5 }
      ]),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            orderCount: { $sum: 1 },
            totalValue: { $sum: '$pricing.total' }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        ordersByStatus,
        recentOrders,
        topCustomers,
        orderTrends
      }
    });
  } catch (error) {
    console.error('Error fetching order analytics:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Enhanced Inventory Analytics
router.get('/inventory-analytics', protect, async (req, res) => {
  try {
    const [lowStockItems, stockMovement, topProducts] = await Promise.all([
      Product.find({
        $expr: { $lte: ['$stock', '$minStock'] },
        isActive: true
      })
        .select('name code stock minStock price category')
        .limit(10),
      Product.aggregate([
        {
          $match: { isActive: true }
        },
        {
          $project: {
            name: 1,
            code: 1,
            category: 1,
            currentStock: '$stock',
            stockValue: { $multiply: ['$stock', '$price'] },
            stockStatus: {
              $cond: {
                if: { $eq: ['$stock', 0] },
                then: 'out_of_stock',
                else: {
                  $cond: {
                    if: { $lte: ['$stock', '$minStock'] },
                    then: 'low_stock',
                    else: 'in_stock'
                  }
                }
              }
            }
          }
        },
        {
          $group: {
            _id: '$stockStatus',
            count: { $sum: 1 },
            totalValue: { $sum: '$stockValue' }
          }
        }
      ]),
      Product.aggregate([
        {
          $lookup: {
            from: 'orders',
            let: { productId: '$_id' },
            pipeline: [
              { $unwind: '$items' },
              {
                $match: {
                  $expr: { $eq: ['$items.product', '$$productId'] },
                  status: { $in: ['delivered', 'completed'] }
                }
              },
              {
                $group: {
                  _id: null,
                  totalSold: { $sum: '$items.quantity' },
                  totalRevenue: { $sum: '$items.totalPrice' }
                }
              }
            ],
            as: 'salesData'
          }
        },
        {
          $addFields: {
            totalSold: { $ifNull: [{ $arrayElemAt: ['$salesData.totalSold', 0] }, 0] },
            totalRevenue: { $ifNull: [{ $arrayElemAt: ['$salesData.totalRevenue', 0] }, 0] }
          }
        },
        {
          $match: {
            totalSold: { $gt: 0 }
          }
        },
        {
          $sort: { totalSold: -1 }
        },
        {
          $limit: 10
        },
        {
          $project: {
            name: 1,
            code: 1,
            totalSold: 1,
            totalRevenue: 1,
            currentStock: '$stock'
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        lowStockItems,
        stockMovement,
        topProducts
      }
    });
  } catch (error) {
    console.error('Error fetching inventory analytics:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Financial Analytics
router.get('/financial-analytics', protect, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const endDate = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const [accountBalances, revenueExpenseData, cashFlowData] = await Promise.all([
      ChartOfAccounts.aggregate([
        {
          $match: { isActive: true }
        },
        {
          $group: {
            _id: '$accountType',
            totalBalance: { $sum: '$currentBalance' },
            accountCount: { $sum: 1 }
          }
        }
      ]),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $in: ['delivered', 'completed'] }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            revenue: { $sum: '$pricing.total' },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Order.aggregate([
        {
          $match: {
            'payment.status': 'paid',
            'payment.method': { $exists: true }
          }
        },
        {
          $group: {
            _id: '$payment.method',
            totalAmount: { $sum: '$payment.paidAmount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { totalAmount: -1 } }
      ])
    ]);

    // Calculate financial ratios
    const accountTotals = accountBalances.reduce((acc, account) => {
      acc[account._id] = account.totalBalance;
      return acc;
    }, {});

    const totalAssets = accountTotals.ASSET || 0;
    const totalLiabilities = accountTotals.LIABILITY || 0;
    const totalEquity = accountTotals.EQUITY || 0;
    const totalRevenue = accountTotals.REVENUE || 0;
    const totalExpenses = accountTotals.EXPENSE || 0;

    const financialRatios = {
      currentRatio: totalLiabilities > 0 ? totalAssets / totalLiabilities : 0,
      debtToEquity: totalEquity > 0 ? totalLiabilities / totalEquity : 0,
      profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
      returnOnAssets: totalAssets > 0 ? ((totalRevenue - totalExpenses) / totalAssets) * 100 : 0
    };

    res.json({
      success: true,
      data: {
        accountBalances,
        revenueExpenseData,
        cashFlowData,
        financialRatios
      }
    });
  } catch (error) {
    console.error('Error fetching financial analytics:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Customer Analytics
router.get('/customer-analytics', protect, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const endDate = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const [customerGrowth, customerSegments, topCustomers] = await Promise.all([
      Customer.aggregate([
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            newCustomers: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Customer.aggregate([
        {
          $lookup: {
            from: 'orders',
            localField: '_id',
            foreignField: 'customer',
            as: 'orders'
          }
        },
        {
          $addFields: {
            orderCount: { $size: '$orders' },
            totalSpent: {
              $sum: {
                $map: {
                  input: '$orders',
                  as: 'order',
                  in: '$$order.pricing.total'
                }
              }
            }
          }
        },
        {
          $addFields: {
            segment: {
              $cond: {
                if: { $gte: ['$totalSpent', 10000] },
                then: 'VIP',
                else: {
                  $cond: {
                    if: { $gte: ['$totalSpent', 5000] },
                    then: 'Premium',
                    else: {
                      $cond: {
                        if: { $gte: ['$totalSpent', 1000] },
                        then: 'Regular',
                        else: 'New'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        {
          $group: {
            _id: '$segment',
            count: { $sum: 1 },
            averageSpent: { $avg: '$totalSpent' },
            totalSpent: { $sum: '$totalSpent' }
          }
        }
      ]),
      Customer.aggregate([
        {
          $lookup: {
            from: 'orders',
            localField: '_id',
            foreignField: 'customer',
            pipeline: [
              {
                $match: {
                  status: { $in: ['delivered', 'completed'] }
                }
              }
            ],
            as: 'completedOrders'
          }
        },
        {
          $addFields: {
            orderCount: { $size: '$completedOrders' },
            totalSpent: {
              $sum: {
                $map: {
                  input: '$completedOrders',
                  as: 'order',
                  in: '$$order.pricing.total'
                }
              }
            },
            lastOrderDate: {
              $max: {
                $map: {
                  input: '$completedOrders',
                  as: 'order',
                  in: '$$order.createdAt'
                }
              }
            }
          }
        },
        {
          $match: {
            orderCount: { $gt: 0 }
          }
        },
        {
          $sort: { totalSpent: -1 }
        },
        {
          $limit: 10
        },
        {
          $project: {
            name: 1,
            email: 1,
            company: 1,
            orderCount: 1,
            totalSpent: 1,
            lastOrderDate: 1
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        customerGrowth,
        customerSegments,
        topCustomers
      }
    });
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;