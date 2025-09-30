import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { reportsApi } from '../../api/reportsApi';

interface TrialBalanceData {
  accounts: Array<{
    _id: string;
    accountCode: string;
    accountName: string;
    accountType: string;
    accountCategory: string;
    normalBalance: string;
    debitBalance: number;
    creditBalance: number;
    netBalance: number;
    debitTotal: number;
    creditTotal: number;
    transactionCount: number;
  }>;
  summary: {
    totalDebits: number;
    totalCredits: number;
    difference: number;
    isBalanced: boolean;
    totalAccounts: number;
    asOfDate: string;
    generatedAt: string;
  };
  accountingEquation: {
    assets: number;
    liabilities: number;
    equity: number;
    isValid: boolean;
  };
  profitLoss: {
    revenue: number;
    expenses: number;
    netIncome: number;
  };
}

const TrialBalanceReport: React.FC = () => {
  const [reportData, setReportData] = useState<TrialBalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    asOfDate: new Date().toISOString().split('T')[0],
    fiscalYear: new Date().getFullYear(),
    fiscalPeriod: new Date().getMonth() + 1,
    includeZeroBalances: false
  });
  const [viewMode, setViewMode] = useState<'detailed' | 'summary'>('detailed');

  useEffect(() => {
    loadTrialBalance();
  }, [filters]);

  const loadTrialBalance = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reportsApi.getTrialBalance(filters);
      if (response.success) {
        setReportData(response.data);
      } else {
        setError('Failed to load trial balance');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading trial balance');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(Math.abs(amount));
  };

  const getAccountTypeColor = (accountType: string) => {
    const colors = {
      ASSET: 'text-green-700 bg-green-50',
      LIABILITY: 'text-red-700 bg-red-50',
      EQUITY: 'text-blue-700 bg-blue-50',
      REVENUE: 'text-purple-700 bg-purple-50',
      EXPENSE: 'text-orange-700 bg-orange-50'
    };
    return colors[accountType as keyof typeof colors] || 'text-gray-700 bg-gray-50';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="text-center text-gray-600 mt-4">Loading trial balance...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) return null;

  const groupedAccounts = reportData.accounts.reduce((acc, account) => {
    if (!acc[account.accountType]) {
      acc[account.accountType] = [];
    }
    acc[account.accountType].push(account);
    return acc;
  }, {} as Record<string, typeof reportData.accounts>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2" />
            Trial Balance
          </h1>
          <p className="text-gray-600 mt-1">Account balances verification and financial position</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={loadTrialBalance}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">As of Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                value={filters.asOfDate}
                onChange={(e) => setFilters(prev => ({ ...prev, asOfDate: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fiscal Year</label>
            <input
              type="number"
              value={filters.fiscalYear}
              onChange={(e) => setFilters(prev => ({ ...prev, fiscalYear: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fiscal Period</label>
            <select
              value={filters.fiscalPeriod}
              onChange={(e) => setFilters(prev => ({ ...prev, fiscalPeriod: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Period {i + 1} ({new Date(0, i).toLocaleString('default', { month: 'long' })})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.includeZeroBalances}
                onChange={(e) => setFilters(prev => ({ ...prev, includeZeroBalances: e.target.checked }))}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Include Zero Balances</span>
            </label>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Debits</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(reportData.summary.totalDebits)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Credits</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(reportData.summary.totalCredits)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Difference</p>
              <p className={`text-2xl font-bold mt-1 ${
                Math.abs(reportData.summary.difference) < 0.01 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(reportData.summary.difference)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${
              Math.abs(reportData.summary.difference) < 0.01 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {Math.abs(reportData.summary.difference) < 0.01 ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Balance Status</p>
              <p className={`text-lg font-bold mt-1 ${
                reportData.summary.isBalanced ? 'text-green-600' : 'text-red-600'
              }`}>
                {reportData.summary.isBalanced ? 'BALANCED' : 'NOT BALANCED'}
              </p>
              <p className="text-sm text-gray-500">{reportData.summary.totalAccounts} accounts</p>
            </div>
            <div className={`p-3 rounded-lg ${
              reportData.summary.isBalanced ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {reportData.summary.isBalanced ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">View:</span>
          {['detailed', 'summary'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as any)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                viewMode === mode
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Trial Balance Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">
            Trial Balance as of {new Date(reportData.summary.asOfDate).toLocaleDateString()}
          </h3>
        </div>
        
        {viewMode === 'detailed' ? (
          // Detailed view grouped by account type
          <div className="overflow-x-auto">
            {Object.entries(groupedAccounts).map(([accountType, accounts]) => (
              <div key={accountType}>
                <div className={`px-6 py-3 border-b ${getAccountTypeColor(accountType)}`}>
                  <h4 className="font-semibold text-sm uppercase tracking-wider">
                    {accountType} ({accounts.length} accounts)
                  </h4>
                </div>
                <table className="min-w-full">
                  <tbody className="divide-y divide-gray-200">
                    {accounts.map((account) => (
                      <tr key={account._id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{account.accountName}</div>
                            <div className="text-xs text-gray-500">{account.accountCode}</div>
                          </div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-right">
                          <div className="text-sm text-gray-900">
                            {account.debitBalance > 0 ? formatCurrency(account.debitBalance) : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-right">
                          <div className="text-sm text-gray-900">
                            {account.creditBalance > 0 ? formatCurrency(account.creditBalance) : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-right">
                          <div className="text-xs text-gray-500">
                            {account.transactionCount} transactions
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        ) : (
          // Summary view
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account Type</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Accounts</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit Total</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(groupedAccounts).map(([accountType, accounts]) => {
                  const totalDebits = accounts.reduce((sum, acc) => sum + acc.debitBalance, 0);
                  const totalCredits = accounts.reduce((sum, acc) => sum + acc.creditBalance, 0);
                  
                  return (
                    <tr key={accountType} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getAccountTypeColor(accountType)}`}>
                          {accountType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {accounts.length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {totalDebits > 0 ? formatCurrency(totalDebits) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {totalCredits > 0 ? formatCurrency(totalCredits) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">TOTALS</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                    {reportData.summary.totalAccounts}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-700">
                    {formatCurrency(reportData.summary.totalDebits)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-red-700">
                    {formatCurrency(reportData.summary.totalCredits)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Financial Analysis Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Accounting Equation</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Assets:</span>
              <span className="font-semibold">{formatCurrency(reportData.accountingEquation.assets)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Liabilities:</span>
              <span className="font-semibold">{formatCurrency(reportData.accountingEquation.liabilities)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Equity:</span>
              <span className="font-semibold">{formatCurrency(reportData.accountingEquation.equity)}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Equation Status:</span>
                <span className={`text-sm font-bold ${
                  reportData.accountingEquation.isValid ? 'text-green-600' : 'text-red-600'
                }`}>
                  {reportData.accountingEquation.isValid ? 'VALID' : 'INVALID'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit & Loss Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Revenue:</span>
              <span className="font-semibold text-green-600">{formatCurrency(reportData.profitLoss.revenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Expenses:</span>
              <span className="font-semibold text-red-600">{formatCurrency(reportData.profitLoss.expenses)}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between">
                <span className="font-medium">Net Income:</span>
                <span className={`font-bold ${
                  reportData.profitLoss.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(reportData.profitLoss.netIncome)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Information</h3>
          <div className="space-y-3">
            <div>
              <span className="text-gray-600 text-sm">Generated On:</span>
              <div className="font-medium">{new Date(reportData.summary.generatedAt).toLocaleString()}</div>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Period:</span>
              <div className="font-medium">FY {filters.fiscalYear}, Period {filters.fiscalPeriod}</div>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Status:</span>
              <div className={`font-medium ${reportData.summary.isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                {reportData.summary.isBalanced ? 'Balanced' : 'Unbalanced'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialBalanceReport;