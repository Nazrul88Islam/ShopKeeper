import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  Download,
  RefreshCw,
  Search,
  Eye,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { reportsApi } from '../../api/reportsApi';

interface GeneralLedgerEntry {
  date: string;
  voucherNumber: string;
  voucherType: string;
  description: string;
  entryDescription: string;
  referenceNumber: string;
  debitAmount: number;
  creditAmount: number;
  balance: number;
  department?: string;
  project?: string;
  costCenter?: string;
}

interface Account {
  _id: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  accountCategory: string;
  normalBalance: string;
}

interface GeneralLedgerData {
  type: 'summary' | 'detailed';
  account?: Account;
  accounts?: Array<{
    account: Account;
    summary: {
      openingBalance: number;
      totalDebits: number;
      totalCredits: number;
      netMovement: number;
      closingBalance: number;
      transactionCount: number;
    };
  }>;
  entries?: GeneralLedgerEntry[];
  summary?: {
    openingBalance: number;
    totalDebits: number;
    totalCredits: number;
    netMovement: number;
    closingBalance: number;
    transactionCount: number;
  };
  period: {
    from: string;
    to: string;
  };
}

const GeneralLedgerReport: React.FC = () => {
  const [reportData, setReportData] = useState<GeneralLedgerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [availableAccounts, setAvailableAccounts] = useState<Account[]>([]);
  const [filters, setFilters] = useState({
    dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    includeOpeningBalance: true
  });
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');

  useEffect(() => {
    loadAvailableAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount || viewMode === 'summary') {
      loadGeneralLedger();
    }
  }, [filters, selectedAccount, viewMode]);

  const loadAvailableAccounts = async () => {
    try {
      // Load real accounts from Chart of Accounts API
      const response = await fetch('/api/chart-of-accounts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setAvailableAccounts(data.data.filter((account: any) => account.isActive));
          return;
        }
      }
    } catch (error) {
      console.warn('Failed to load accounts from API, using fallback data:', error);
    }
    
    // Fallback to mock accounts if API fails
    const mockAccounts: Account[] = [
      { _id: '1', accountCode: '1001', accountName: 'Cash', accountType: 'ASSET', accountCategory: 'CURRENT_ASSET', normalBalance: 'DEBIT' },
      { _id: '2', accountCode: '1002', accountName: 'Bank Account - Main', accountType: 'ASSET', accountCategory: 'CURRENT_ASSET', normalBalance: 'DEBIT' },
      { _id: '3', accountCode: '1100', accountName: 'Accounts Receivable', accountType: 'ASSET', accountCategory: 'CURRENT_ASSET', normalBalance: 'DEBIT' },
      { _id: '4', accountCode: '1200', accountName: 'Inventory', accountType: 'ASSET', accountCategory: 'CURRENT_ASSET', normalBalance: 'DEBIT' },
      { _id: '5', accountCode: '2001', accountName: 'Accounts Payable', accountType: 'LIABILITY', accountCategory: 'CURRENT_LIABILITY', normalBalance: 'CREDIT' },
      { _id: '6', accountCode: '4001', accountName: 'Sales Revenue', accountType: 'REVENUE', accountCategory: 'OPERATING_REVENUE', normalBalance: 'CREDIT' },
      { _id: '7', accountCode: '5001', accountName: 'Cost of Goods Sold', accountType: 'EXPENSE', accountCategory: 'COST_OF_GOODS_SOLD', normalBalance: 'DEBIT' },
      { _id: '8', accountCode: '5100', accountName: 'Salaries and Wages', accountType: 'EXPENSE', accountCategory: 'OPERATING_EXPENSE', normalBalance: 'DEBIT' }
    ];
    setAvailableAccounts(mockAccounts);
  };

  const loadGeneralLedger = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        ...filters,
        ...(selectedAccount && viewMode === 'detailed' ? { accountId: selectedAccount } : {})
      };
      
      const response = await reportsApi.getGeneralLedger(params);
      if (response.success) {
        setReportData(response.data);
      } else {
        setError('Failed to load general ledger');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading general ledger');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getAccountTypeColor = (accountType: string) => {
    const colors = {
      ASSET: 'text-green-700 bg-green-50 border-green-200',
      LIABILITY: 'text-red-700 bg-red-50 border-red-200',
      EQUITY: 'text-blue-700 bg-blue-50 border-blue-200',
      REVENUE: 'text-purple-700 bg-purple-50 border-purple-200',
      EXPENSE: 'text-orange-700 bg-orange-50 border-orange-200'
    };
    return colors[accountType as keyof typeof colors] || 'text-gray-700 bg-gray-50 border-gray-200';
  };

  const getVoucherTypeLabel = (voucherType: string) => {
    const types = {
      JOURNAL: 'Journal Entry',
      CASH_RECEIPT: 'Cash Receipt',
      CASH_PAYMENT: 'Cash Payment',
      BANK_RECEIPT: 'Bank Receipt',
      BANK_PAYMENT: 'Bank Payment',
      PURCHASE: 'Purchase',
      SALES: 'Sales'
    };
    return types[voucherType as keyof typeof types] || voucherType;
  };

  const handleExport = async () => {
    if (!reportData) return;
    
    try {
      setLoading(true);
      
      // Prepare export data based on current view
      let exportData: string;
      let filename: string;
      
      if (reportData.type === 'summary') {
        // Export summary view as CSV
        const headers = ['Account Code', 'Account Name', 'Account Type', 'Opening Balance', 'Total Debits', 'Total Credits', 'Closing Balance', 'Transactions'];
        const rows = reportData.accounts?.map(item => [
          item.account.accountCode,
          item.account.accountName,
          item.account.accountType,
          item.summary.openingBalance.toFixed(2),
          item.summary.totalDebits.toFixed(2),
          item.summary.totalCredits.toFixed(2),
          item.summary.closingBalance.toFixed(2),
          item.summary.transactionCount.toString()
        ]) || [];
        
        exportData = [headers, ...rows].map(row => row.join(',')).join('\n');
        filename = `GeneralLedger_Summary_${filters.dateFrom}_${filters.dateTo}.csv`;
      } else {
        // Export detailed view as CSV
        const headers = ['Date', 'Voucher Number', 'Voucher Type', 'Description', 'Entry Description', 'Reference', 'Debit', 'Credit', 'Balance'];
        const rows = reportData.entries?.map(entry => [
          formatDate(entry.date),
          entry.voucherNumber,
          getVoucherTypeLabel(entry.voucherType),
          `"${entry.description.replace(/"/g, '""')}"`, // Escape quotes in CSV
          `"${entry.entryDescription?.replace(/"/g, '""') || ''}"`,
          entry.referenceNumber || '',
          entry.debitAmount.toFixed(2),
          entry.creditAmount.toFixed(2),
          entry.balance.toFixed(2)
        ]) || [];
        
        exportData = [headers, ...rows].map(row => row.join(',')).join('\n');
        const accountCode = reportData.account?.accountCode || 'Unknown';
        filename = `GeneralLedger_${accountCode}_${filters.dateFrom}_${filters.dateTo}.csv`;
      }
      
      // Create and download the file
      const blob = new Blob([exportData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !reportData) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="text-center text-gray-600 mt-4">Loading general ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setError(null);
                  loadGeneralLedger();
                }}
                className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 rounded hover:bg-red-100 transition-colors"
              >
                Retry
              </button>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 w-6 h-6 flex items-center justify-center rounded hover:bg-red-100 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BookOpen className="w-6 h-6 mr-2" />
            General Ledger Report
          </h1>
          <p className="text-gray-600 mt-1">Detailed transaction history and account movements</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={loadGeneralLedger}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={handleExport}
            disabled={loading || !reportData}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">View Mode</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'summary' | 'detailed')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="summary">Summary View</option>
              <option value="detailed">Detailed View</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account (Detailed View)</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              disabled={viewMode === 'summary'}
            >
              <option value="">Choose account...</option>
              {availableAccounts.map(account => (
                <option key={account._id} value={account._id}>
                  {account.accountCode} - {account.accountName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {reportData && (
        <>
          {reportData.type === 'summary' ? (
            // Summary View - All Accounts
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">General Ledger Summary</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Period: {formatDate(reportData.period.from)} to {formatDate(reportData.period.to)}
                </p>
              </div>
              
              <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Account
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Opening
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Debits
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Credits
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Closing
                          </th>
                          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Transactions
                          </th>
                          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.accounts?.map((item) => (
                          <tr key={item.account._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{item.account.accountName}</div>
                                <div className="text-sm text-gray-500">{item.account.accountCode}</div>
                                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${getAccountTypeColor(item.account.accountType)}`}>
                                  {item.account.accountType}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-gray-900 font-medium">
                              {formatCurrency(item.summary.openingBalance)}
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-medium text-green-600">
                              {formatCurrency(item.summary.totalDebits)}
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-medium text-red-600">
                              {formatCurrency(item.summary.totalCredits)}
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                              {formatCurrency(item.summary.closingBalance)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {item.summary.transactionCount}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => {
                                  setSelectedAccount(item.account._id);
                                  setViewMode('detailed');
                                }}
                                className="text-primary-600 hover:text-primary-900 p-1 rounded-full hover:bg-primary-50 transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Detailed View - Single Account
            reportData.account && (
              <>
                {/* Account Header */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{reportData.account.accountName}</h3>
                      <p className="text-gray-600">
                        {reportData.account.accountCode} | {reportData.account.accountType} | Normal: {reportData.account.normalBalance}
                      </p>
                    </div>
                    <button
                      onClick={() => setViewMode('summary')}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Summary
                    </button>
                  </div>
                </div>

                {/* Summary Cards */}
                {reportData.summary && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Opening Balance</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">
                            {formatCurrency(reportData.summary.openingBalance)}
                          </p>
                        </div>
                        <div className="p-3 bg-gray-100 rounded-lg">
                          <FileText className="w-6 h-6 text-gray-600" />
                        </div>
                      </div>
                    </div>

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
                          <p className="text-sm font-medium text-gray-600">Closing Balance</p>
                          <p className="text-2xl font-bold text-blue-600 mt-1">
                            {formatCurrency(reportData.summary.closingBalance)}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">{reportData.summary.transactionCount} transactions</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <DollarSign className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Transactions Table */}
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
                  </div>
                  
                  {reportData.entries && reportData.entries.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Voucher</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.entries.map((entry, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(entry.date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{entry.voucherNumber}</div>
                                  <div className="text-xs text-gray-500">{getVoucherTypeLabel(entry.voucherType)}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">{entry.description}</div>
                                {entry.entryDescription && (
                                  <div className="text-xs text-gray-500 mt-1">{entry.entryDescription}</div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right text-sm font-medium text-green-600">
                                {entry.debitAmount > 0 ? formatCurrency(entry.debitAmount) : '-'}
                              </td>
                              <td className="px-6 py-4 text-right text-sm font-medium text-red-600">
                                {entry.creditAmount > 0 ? formatCurrency(entry.creditAmount) : '-'}
                              </td>
                              <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                {formatCurrency(entry.balance)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No transactions found for this account in the selected period</p>
                    </div>
                  )}
                </div>
              </>
            )
          )}
        </>
      )}
    </div>
  );
};

export default GeneralLedgerReport;