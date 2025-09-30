import React, { useState, useEffect } from 'react';
import { Calendar, Download, FileText, TrendingUp, TrendingDown, PieChart, BarChart3 } from 'lucide-react';

interface FinancialData {
  incomeStatement: {
    revenue: { [key: string]: number };
    expenses: { [key: string]: number };
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
  };
  balanceSheet: {
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    currentAssets: number;
    currentLiabilities: number;
  };
  cashFlow: {
    operatingCashFlow: number;
    investingCashFlow: number;
    financingCashFlow: number;
    netCashFlow: number;
    beginningCash: number;
    endingCash: number;
  };
}

const FinancialReports: React.FC = () => {
  const [reportType, setReportType] = useState<'income' | 'balance' | 'cashflow'>('income');
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);

  // Mock financial data
  const mockFinancialData: FinancialData = {
    incomeStatement: {
      revenue: {
        'Sales Revenue': 125680.50,
        'Service Revenue': 18500.00,
        'Interest Income': 1250.00
      },
      expenses: {
        'Cost of Goods Sold': 67890.25,
        'Salaries and Wages': 35000.00,
        'Rent Expense': 12000.00,
        'Utilities Expense': 4500.00,
        'Office Supplies': 3200.00,
        'Other Expenses': 8450.00
      },
      totalRevenue: 145430.50,
      totalExpenses: 131040.25,
      netIncome: 14390.25
    },
    balanceSheet: {
      totalAssets: 368921.50,
      totalLiabilities: 112156.80,
      totalEquity: 256764.70,
      currentAssets: 321921.50,
      currentLiabilities: 50156.80
    },
    cashFlow: {
      operatingCashFlow: -3159.75,
      investingCashFlow: -8500.00,
      financingCashFlow: 12000.00,
      netCashFlow: 340.25,
      beginningCash: 181410.25,
      endingCash: 181750.50
    }
  };

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setFinancialData(mockFinancialData);
      setLoading(false);
    }, 800);
  }, [reportType, dateFrom, dateTo]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleExport = () => {
    if (!financialData) return;
    alert(`Export ${reportType} statement functionality would be implemented here`);
  };

  const renderIncomeStatement = () => {
    if (!financialData) return null;
    const { incomeStatement } = financialData;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="bg-green-50 px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-green-800">Revenue</h3>
          </div>
          <div className="p-6 space-y-3">
            {Object.entries(incomeStatement.revenue).map(([account, amount]) => (
              <div key={account} className="flex justify-between">
                <span className="text-gray-700">{account}</span>
                <span className="font-medium">{formatCurrency(amount)}</span>
              </div>
            ))}
            <div className="border-t pt-3 flex justify-between font-bold">
              <span className="text-green-800">Total Revenue</span>
              <span className="text-green-800">{formatCurrency(incomeStatement.totalRevenue)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="bg-red-50 px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-red-800">Expenses</h3>
          </div>
          <div className="p-6 space-y-3">
            {Object.entries(incomeStatement.expenses).map(([account, amount]) => (
              <div key={account} className="flex justify-between">
                <span className="text-gray-700">{account}</span>
                <span className="font-medium">{formatCurrency(amount)}</span>
              </div>
            ))}
            <div className="border-t pt-3 flex justify-between font-bold">
              <span className="text-red-800">Total Expenses</span>
              <span className="text-red-800">{formatCurrency(incomeStatement.totalExpenses)}</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg border">
          <div className="flex justify-between items-center text-xl font-bold">
            <span className="text-blue-800">Net Income</span>
            <span className="text-blue-800">{formatCurrency(incomeStatement.netIncome)}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderBalanceSheet = () => {
    if (!financialData) return null;
    const { balanceSheet } = financialData;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-4">Assets</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Current Assets</span>
              <span className="font-medium">{formatCurrency(balanceSheet.currentAssets)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-bold">
              <span className="text-green-800">Total Assets</span>
              <span className="text-green-800">{formatCurrency(balanceSheet.totalAssets)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-4">Liabilities</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Current Liabilities</span>
              <span className="font-medium">{formatCurrency(balanceSheet.currentLiabilities)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-bold">
              <span className="text-red-800">Total Liabilities</span>
              <span className="text-red-800">{formatCurrency(balanceSheet.totalLiabilities)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Equity</h3>
          <div className="space-y-3">
            <div className="border-t pt-3 flex justify-between font-bold">
              <span className="text-blue-800">Total Equity</span>
              <span className="text-blue-800">{formatCurrency(balanceSheet.totalEquity)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCashFlowStatement = () => {
    if (!financialData) return null;
    const { cashFlow } = financialData;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Operating Activities</h3>
            <div className="text-center">
              <span className={`text-2xl font-bold ${cashFlow.operatingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(cashFlow.operatingCashFlow)}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-purple-800 mb-4">Investing Activities</h3>
            <div className="text-center">
              <span className={`text-2xl font-bold ${cashFlow.investingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(cashFlow.investingCashFlow)}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-orange-800 mb-4">Financing Activities</h3>
            <div className="text-center">
              <span className={`text-2xl font-bold ${cashFlow.financingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(cashFlow.financingCashFlow)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Cash Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Beginning Cash</span>
              <span className="font-medium">{formatCurrency(cashFlow.beginningCash)}</span>
            </div>
            <div className="flex justify-between">
              <span>Net Cash Flow</span>
              <span className={`font-medium ${cashFlow.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(cashFlow.netCashFlow)}
              </span>
            </div>
            <div className="border-t pt-3 flex justify-between text-xl font-bold">
              <span className="text-blue-800">Ending Cash</span>
              <span className="text-blue-800">{formatCurrency(cashFlow.endingCash)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as 'income' | 'balance' | 'cashflow')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="income">Income Statement</option>
                <option value="balance">Balance Sheet</option>
                <option value="cashflow">Cash Flow Statement</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          
          <button
            onClick={handleExport}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Report Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <PieChart className="w-8 h-8 text-primary-600 mr-4" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {reportType === 'income' && 'Income Statement'}
                {reportType === 'balance' && 'Balance Sheet'}
                {reportType === 'cashflow' && 'Cash Flow Statement'}
              </h2>
              <p className="text-gray-600 mt-1">
                {reportType === 'balance' 
                  ? `As of ${new Date(dateTo).toLocaleDateString()}`
                  : `Period: ${new Date(dateFrom).toLocaleDateString()} - ${new Date(dateTo).toLocaleDateString()}`
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="bg-white p-12 rounded-lg shadow-sm border text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading financial report...</p>
        </div>
      ) : (
        <>
          {reportType === 'income' && renderIncomeStatement()}
          {reportType === 'balance' && renderBalanceSheet()}
          {reportType === 'cashflow' && renderCashFlowStatement()}
        </>
      )}
    </div>
  );
};

export default FinancialReports;