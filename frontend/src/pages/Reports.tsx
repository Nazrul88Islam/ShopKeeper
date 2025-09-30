import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  FileText, 
  Download, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  ShoppingCart,
  Calculator,
  PieChart,
  Activity,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { reportsApi, type ReportSummary } from '../api/reportsApi';

// Types for different report sections
interface ReportCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  bgColor: string;
  category: 'sales' | 'inventory' | 'financial' | 'customer';
}

const Reports: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState('30days');
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Load report data
  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const period = dateRange === '7days' ? 'weekly' :
                     dateRange === '30days' ? 'monthly' :
                     dateRange === '90days' ? 'quarterly' :
                     dateRange === '1year' ? 'yearly' : 'monthly';
      
      const response = await reportsApi.getReportSummary({ period });
      
      if (response.success) {
        setReportSummary(response.data);
        setLastRefresh(new Date());
      } else {
        setError('Failed to load report data');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading reports');
      console.error('Reports loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadReportData();
  };

  // Available reports
  const reportCards: ReportCard[] = [
    {
      title: 'Sales Report',
      description: 'Comprehensive sales analysis with trends and performance metrics',
      icon: <DollarSign className="w-6 h-6" />,
      bgColor: 'bg-green-500',
      category: 'sales'
    },
    {
      title: 'Inventory Report',
      description: 'Stock levels, movement, and valuation reports',
      icon: <Package className="w-6 h-6" />,
      bgColor: 'bg-blue-500',
      category: 'inventory'
    },
    {
      title: 'Customer Analysis',
      description: 'Customer behavior, lifetime value, and segmentation',
      icon: <Users className="w-6 h-6" />,
      bgColor: 'bg-purple-500',
      category: 'customer'
    },
    {
      title: 'Order Analytics',
      description: 'Order processing, fulfillment, and delivery performance',
      icon: <ShoppingCart className="w-6 h-6" />,
      bgColor: 'bg-orange-500',
      category: 'sales'
    },
    {
      title: 'Chart of Accounts',
      description: 'Complete chart of accounts structure and balances',
      icon: <Calculator className="w-6 h-6" />,
      bgColor: 'bg-indigo-500',
      category: 'financial'
    },
    {
      title: 'Profit & Loss Statement',
      description: 'Income statement showing revenues, costs, and expenses',
      icon: <TrendingUp className="w-6 h-6" />,
      bgColor: 'bg-emerald-500',
      category: 'financial'
    },
    {
      title: 'Balance Sheet',
      description: 'Assets, liabilities, and equity financial position',
      icon: <BarChart3 className="w-6 h-6" />,
      bgColor: 'bg-cyan-500',
      category: 'financial'
    },
    {
      title: 'Cash Flow Statement',
      description: 'Operating, investing, and financing cash flows',
      icon: <Activity className="w-6 h-6" />,
      bgColor: 'bg-teal-500',
      category: 'financial'
    },
    {
      title: 'General Ledger',
      description: 'Complete journal entries and account transactions',
      icon: <FileText className="w-6 h-6" />,
      bgColor: 'bg-rose-500',
      category: 'financial'
    },
    {
      title: 'Trial Balance',
      description: 'List of all accounts with debit and credit balances',
      icon: <PieChart className="w-6 h-6" />,
      bgColor: 'bg-amber-500',
      category: 'financial'
    },
    {
      title: 'Supplier Performance',
      description: 'Supplier delivery, quality, and cost analysis',
      icon: <TrendingDown className="w-6 h-6" />,
      bgColor: 'bg-gray-500',
      category: 'inventory'
    },
    {
      title: 'Product Performance',
      description: 'Best sellers, slow movers, and profitability analysis',
      icon: <Package className="w-6 h-6" />,
      bgColor: 'bg-violet-500',
      category: 'inventory'
    }
  ];

  // Filter reports based on category
  const filteredReports = selectedCategory === 'all' 
    ? reportCards 
    : reportCards.filter(report => report.category === selectedCategory);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const generateReport = async (reportTitle: string) => {
    try {
      setLoading(true);
      // Map report titles to API endpoints
      const reportMap: Record<string, () => Promise<any>> = {
        'Sales Report': () => reportsApi.getSalesReport(),
        'Inventory Report': () => reportsApi.getInventoryReport(),
        'Customer Analysis': () => reportsApi.getCustomerReport(),
        'Profit & Loss Statement': () => reportsApi.getProfitLossStatement(),
        'Balance Sheet': () => reportsApi.getBalanceSheet(),
        'Cash Flow Statement': () => reportsApi.getCashFlowStatement(),
        'Trial Balance': () => reportsApi.getTrialBalance(),
        'Chart of Accounts': () => reportsApi.getChartOfAccountsReport()
      };
      
      const reportFunction = reportMap[reportTitle];
      if (reportFunction) {
        const response = await reportFunction();
        if (response.success) {
          // In a real application, this would open a new window or download the report
          alert(`${reportTitle} generated successfully! Report data loaded.`);
          console.log(`${reportTitle} data:`, response.data);
        } else {
          alert(`Failed to generate ${reportTitle}`);
        }
      } else {
        alert(`${reportTitle} generation not yet implemented.`);
      }
    } catch (error: any) {
      alert(`Error generating ${reportTitle}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Generate business insights and financial reports</p>
          {lastRefresh && (
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastRefresh.toLocaleString()}
            </p>
          )}
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="1year">Last Year</option>
            <option value="ytd">Year to Date</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <RefreshCw className="w-5 h-5 text-blue-600 mr-2 animate-spin" />
            <span className="text-blue-800">Loading report data...</span>
          </div>
        </div>
      )}

      {/* Financial Overview Cards */}
      {reportSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(reportSummary.totalRevenue)}</p>
                <p className={`text-sm mt-1 ${
                  reportSummary.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {reportSummary.revenueGrowth >= 0 ? '+' : ''}{reportSummary.revenueGrowth.toFixed(1)}% from last period
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(reportSummary.netProfit)}</p>
                <p className={`text-sm mt-1 ${
                  reportSummary.profitGrowth >= 0 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {reportSummary.profitGrowth >= 0 ? '+' : ''}{reportSummary.profitGrowth.toFixed(1)}% from last period
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gross Margin</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{reportSummary.grossMargin.toFixed(1)}%</p>
                <p className={`text-sm mt-1 ${
                  reportSummary.marginGrowth >= 0 ? 'text-purple-600' : 'text-red-600'
                }`}>
                  {reportSummary.marginGrowth >= 0 ? '+' : ''}{reportSummary.marginGrowth.toFixed(1)}% from last period
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cash Flow</p>
                <p className="text-2xl font-bold text-teal-600 mt-1">{formatCurrency(reportSummary.cashFlow)}</p>
                <p className={`text-sm mt-1 ${
                  reportSummary.cashFlowGrowth >= 0 ? 'text-teal-600' : 'text-red-600'
                }`}>
                  {reportSummary.cashFlowGrowth >= 0 ? '+' : ''}{reportSummary.cashFlowGrowth.toFixed(1)}% from last period
                </p>
              </div>
              <div className="p-3 bg-teal-100 rounded-lg">
                <Activity className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Financial Summary */}
      {reportSummary && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-3">Revenue & Expenses</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Revenue:</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(reportSummary.totalRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Expenses:</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(reportSummary.totalExpenses)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium text-gray-900">Net Income:</span>
                  <span className="text-sm font-medium text-green-600">{formatCurrency(reportSummary.netProfit)}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-3">Accounts</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Accounts Receivable:</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(reportSummary.accountsReceivable)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Accounts Payable:</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(reportSummary.accountsPayable)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium text-gray-900">Net Position:</span>
                  <span className="text-sm font-medium text-green-600">{formatCurrency(reportSummary.accountsReceivable - reportSummary.accountsPayable)}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-3">Key Ratios</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Gross Margin:</span>
                  <span className="text-sm font-medium text-gray-900">{reportSummary.grossMargin.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Profit Margin:</span>
                  <span className="text-sm font-medium text-gray-900">{reportSummary.totalRevenue > 0 ? ((reportSummary.netProfit / reportSummary.totalRevenue) * 100).toFixed(1) : '0.0'}%</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium text-gray-900">Growth Rate:</span>
                  <span className={`text-sm font-medium ${
                    reportSummary.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>{reportSummary.revenueGrowth.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Categories Filter */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Reports
          </button>
          <button
            onClick={() => setSelectedCategory('financial')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'financial'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Financial
          </button>
          <button
            onClick={() => setSelectedCategory('sales')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'sales'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Sales
          </button>
          <button
            onClick={() => setSelectedCategory('inventory')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'inventory'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Inventory
          </button>
          <button
            onClick={() => setSelectedCategory('customer')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'customer'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Customer
          </button>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg text-white ${report.bgColor}`}>
                  {report.icon}
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  report.category === 'financial' ? 'bg-green-100 text-green-800' :
                  report.category === 'sales' ? 'bg-blue-100 text-blue-800' :
                  report.category === 'inventory' ? 'bg-purple-100 text-purple-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {report.category}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{report.description}</p>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => generateReport(report.title)}
                  disabled={loading}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Generating...' : 'Generate'}
                </button>
                <button 
                  disabled={loading}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart of Accounts Preview */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Chart of Accounts Overview</h3>
          <p className="text-gray-600 text-sm mt-1">Quick view of account categories and balances</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-3">Assets</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current Assets</span>
                  <span className="font-medium">{formatCurrency(85650.75)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Fixed Assets</span>
                  <span className="font-medium">{formatCurrency(125000.00)}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="font-medium">Total Assets</span>
                  <span className="font-bold">{formatCurrency(210650.75)}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-3">Liabilities</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current Liabilities</span>
                  <span className="font-medium">{formatCurrency(32450.50)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Long-term Debt</span>
                  <span className="font-medium">{formatCurrency(45000.00)}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="font-medium">Total Liabilities</span>
                  <span className="font-bold">{formatCurrency(77450.50)}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-3">Equity</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Share Capital</span>
                  <span className="font-medium">{formatCurrency(100000.00)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Retained Earnings</span>
                  <span className="font-medium">{formatCurrency(33200.25)}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="font-medium">Total Equity</span>
                  <span className="font-bold">{formatCurrency(133200.25)}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-3">Income Statement</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Revenue</span>
                  <span className="font-medium text-green-600">{reportSummary ? formatCurrency(reportSummary.totalRevenue) : formatCurrency(125680.50)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Expenses</span>
                  <span className="font-medium text-red-600">{reportSummary ? formatCurrency(reportSummary.totalExpenses) : formatCurrency(87340.25)}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="font-medium">Net Income</span>
                  <span className="font-bold text-green-600">{reportSummary ? formatCurrency(reportSummary.netProfit) : formatCurrency(38340.25)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;