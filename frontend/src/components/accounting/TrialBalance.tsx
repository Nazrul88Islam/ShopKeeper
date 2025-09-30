import React, { useState, useEffect } from 'react';
import { Calendar, Download, BarChart3, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface TrialBalanceAccount {
  _id: string;
  accountCode: string;
  accountName: string;
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  accountCategory: string;
  normalBalance: 'DEBIT' | 'CREDIT';
  debitBalance: number;
  creditBalance: number;
  netBalance: number;
}

interface TrialBalanceSummary {
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  variance: number;
  accountCount: number;
}

const TrialBalance: React.FC = () => {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [fiscalPeriod, setFiscalPeriod] = useState(new Date().getMonth() + 1);
  const [accounts, setAccounts] = useState<TrialBalanceAccount[]>([]);
  const [summary, setSummary] = useState<TrialBalanceSummary>({
    totalDebits: 0,
    totalCredits: 0,
    isBalanced: true,
    variance: 0,
    accountCount: 0
  });
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'detailed' | 'summary'>('detailed');

  // Mock trial balance data based on ChartOfAccounts and JournalEntry models
  const mockTrialBalanceData: TrialBalanceAccount[] = [
    // Assets
    {
      _id: '1',
      accountCode: '1001',
      accountName: 'Cash',
      accountType: 'ASSET',
      accountCategory: 'CURRENT_ASSET',
      normalBalance: 'DEBIT',
      debitBalance: 25000.00,
      creditBalance: 0,
      netBalance: 25000.00
    },
    {
      _id: '2',
      accountCode: '1002',
      accountName: 'Bank Account - Main',
      accountType: 'ASSET',
      accountCategory: 'CURRENT_ASSET',
      normalBalance: 'DEBIT',
      debitBalance: 156750.50,
      creditBalance: 0,
      netBalance: 156750.50
    },
    {
      _id: '3',
      accountCode: '1100',
      accountName: 'Accounts Receivable',
      accountType: 'ASSET',
      accountCategory: 'CURRENT_ASSET',
      normalBalance: 'DEBIT',
      debitBalance: 45670.25,
      creditBalance: 0,
      netBalance: 45670.25
    },
    {
      _id: '4',
      accountCode: '1200',
      accountName: 'Inventory',
      accountType: 'ASSET',
      accountCategory: 'CURRENT_ASSET',
      normalBalance: 'DEBIT',
      debitBalance: 89500.75,
      creditBalance: 0,
      netBalance: 89500.75
    },
    {
      _id: '5',
      accountCode: '1500',
      accountName: 'Office Equipment',
      accountType: 'ASSET',
      accountCategory: 'FIXED_ASSET',
      normalBalance: 'DEBIT',
      debitBalance: 25000.00,
      creditBalance: 0,
      netBalance: 25000.00
    },
    {
      _id: '6',
      accountCode: '1501',
      accountName: 'Accumulated Depreciation - Equipment',
      accountType: 'ASSET',
      accountCategory: 'FIXED_ASSET',
      normalBalance: 'CREDIT',
      debitBalance: 0,
      creditBalance: 5000.00,
      netBalance: -5000.00
    },
    
    // Liabilities
    {
      _id: '7',
      accountCode: '2001',
      accountName: 'Accounts Payable',
      accountType: 'LIABILITY',
      accountCategory: 'CURRENT_LIABILITY',
      normalBalance: 'CREDIT',
      debitBalance: 0,
      creditBalance: 23456.80,
      netBalance: -23456.80
    },
    {
      _id: '8',
      accountCode: '2100',
      accountName: 'Accrued Expenses',
      accountType: 'LIABILITY',
      accountCategory: 'CURRENT_LIABILITY',
      normalBalance: 'CREDIT',
      debitBalance: 0,
      creditBalance: 8500.00,
      netBalance: -8500.00
    },
    {
      _id: '9',
      accountCode: '2200',
      accountName: 'Notes Payable',
      accountType: 'LIABILITY',
      accountCategory: 'LONG_TERM_LIABILITY',
      normalBalance: 'CREDIT',
      debitBalance: 0,
      creditBalance: 50000.00,
      netBalance: -50000.00
    },
    
    // Equity
    {
      _id: '10',
      accountCode: '3001',
      accountName: 'Owner Equity',
      accountType: 'EQUITY',
      accountCategory: 'OWNER_EQUITY',
      normalBalance: 'CREDIT',
      debitBalance: 0,
      creditBalance: 200000.00,
      netBalance: -200000.00
    },
    {
      _id: '11',
      accountCode: '3100',
      accountName: 'Retained Earnings',
      accountType: 'EQUITY',
      accountCategory: 'RETAINED_EARNINGS',
      normalBalance: 'CREDIT',
      debitBalance: 0,
      creditBalance: 45000.00,
      netBalance: -45000.00
    },
    
    // Revenue
    {
      _id: '12',
      accountCode: '4001',
      accountName: 'Sales Revenue',
      accountType: 'REVENUE',
      accountCategory: 'OPERATING_REVENUE',
      normalBalance: 'CREDIT',
      debitBalance: 0,
      creditBalance: 125680.50,
      netBalance: -125680.50
    },
    {
      _id: '13',
      accountCode: '4100',
      accountName: 'Service Revenue',
      accountType: 'REVENUE',
      accountCategory: 'OPERATING_REVENUE',
      normalBalance: 'CREDIT',
      debitBalance: 0,
      creditBalance: 18500.00,
      netBalance: -18500.00
    },
    {
      _id: '14',
      accountCode: '4200',
      accountName: 'Interest Income',
      accountType: 'REVENUE',
      accountCategory: 'NON_OPERATING_REVENUE',
      normalBalance: 'CREDIT',
      debitBalance: 0,
      creditBalance: 1250.00,
      netBalance: -1250.00
    },
    
    // Expenses
    {
      _id: '15',
      accountCode: '5001',
      accountName: 'Cost of Goods Sold',
      accountType: 'EXPENSE',
      accountCategory: 'COST_OF_GOODS_SOLD',
      normalBalance: 'DEBIT',
      debitBalance: 67890.25,
      creditBalance: 0,
      netBalance: 67890.25
    },
    {
      _id: '16',
      accountCode: '5100',
      accountName: 'Salaries and Wages',
      accountType: 'EXPENSE',
      accountCategory: 'OPERATING_EXPENSE',
      normalBalance: 'DEBIT',
      debitBalance: 35000.00,
      creditBalance: 0,
      netBalance: 35000.00
    },
    {
      _id: '17',
      accountCode: '5200',
      accountName: 'Rent Expense',
      accountType: 'EXPENSE',
      accountCategory: 'OPERATING_EXPENSE',
      normalBalance: 'DEBIT',
      debitBalance: 12000.00,
      creditBalance: 0,
      netBalance: 12000.00
    },
    {
      _id: '18',
      accountCode: '5300',
      accountName: 'Office Supplies',
      accountType: 'EXPENSE',
      accountCategory: 'OPERATING_EXPENSE',
      normalBalance: 'DEBIT',
      debitBalance: 3200.00,
      creditBalance: 0,
      netBalance: 3200.00
    },
    {
      _id: '19',
      accountCode: '5400',
      accountName: 'Utilities Expense',
      accountType: 'EXPENSE',
      accountCategory: 'OPERATING_EXPENSE',
      normalBalance: 'DEBIT',
      debitBalance: 4500.00,
      creditBalance: 0,
      netBalance: 4500.00
    },
    {
      _id: '20',
      accountCode: '5500',
      accountName: 'Depreciation Expense',
      accountType: 'EXPENSE',
      accountCategory: 'OPERATING_EXPENSE',
      normalBalance: 'DEBIT',
      debitBalance: 5000.00,
      creditBalance: 0,
      netBalance: 5000.00
    }
  ];

  useEffect(() => {
    loadTrialBalance();
  }, [asOfDate, fiscalYear, fiscalPeriod]);

  const loadTrialBalance = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setAccounts(mockTrialBalanceData);
      
      // Calculate summary
      const totalDebits = mockTrialBalanceData.reduce((sum, acc) => sum + acc.debitBalance, 0);
      const totalCredits = mockTrialBalanceData.reduce((sum, acc) => sum + acc.creditBalance, 0);
      const variance = Math.abs(totalDebits - totalCredits);
      
      setSummary({
        totalDebits,
        totalCredits,
        isBalanced: variance < 0.01,
        variance,
        accountCount: mockTrialBalanceData.length
      });
      
      setLoading(false);
    }, 800);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(Math.abs(amount));
  };

  const getAccountTypeColor = (type: string) => {
    const colors = {
      ASSET: 'bg-green-100 text-green-800',
      LIABILITY: 'bg-red-100 text-red-800',
      EQUITY: 'bg-blue-100 text-blue-800',
      REVENUE: 'bg-purple-100 text-purple-800',
      EXPENSE: 'bg-orange-100 text-orange-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const groupedAccounts = accounts.reduce((groups, account) => {
    if (!groups[account.accountType]) {
      groups[account.accountType] = [];
    }
    groups[account.accountType].push(account);
    return groups;
  }, {} as Record<string, TrialBalanceAccount[]>);

  const calculateTypeTotal = (accountType: string, column: 'debit' | 'credit') => {
    const typeAccounts = groupedAccounts[accountType] || [];
    return typeAccounts.reduce((sum, acc) => {
      return sum + (column === 'debit' ? acc.debitBalance : acc.creditBalance);
    }, 0);
  };

  const handleExport = () => {
    // Create CSV content for trial balance
    const csvContent = [
      ['Account Code', 'Account Name', 'Account Type', 'Debit Balance', 'Credit Balance'],
      ...accounts.map(acc => [
        acc.accountCode,
        acc.accountName,
        acc.accountType,
        acc.debitBalance.toString(),
        acc.creditBalance.toString()
      ]),
      [],
      ['TOTALS', '', '', summary.totalDebits.toString(), summary.totalCredits.toString()],
      ['VARIANCE', '', '', '', summary.variance.toString()]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `TrialBalance_${asOfDate}_FY${fiscalYear}_P${fiscalPeriod}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                As of Date
              </label>
              <input
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fiscal Year
              </label>
              <select
                value={fiscalYear}
                onChange={(e) => setFiscalYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {[2022, 2023, 2024, 2025].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fiscal Period
              </label>
              <select
                value={fiscalPeriod}
                onChange={(e) => setFiscalPeriod(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {monthNames.map((month, index) => (
                  <option key={index + 1} value={index + 1}>
                    {month} ({index + 1})
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('detailed')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'detailed' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Detailed
              </button>
              <button
                onClick={() => setViewMode('summary')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'summary' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Summary
              </button>
            </div>
            
            <button
              onClick={handleExport}
              disabled={loading || accounts.length === 0}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Trial Balance Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-primary-600 mr-4" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Trial Balance</h2>
              <p className="text-gray-600 mt-1">
                As of {new Date(asOfDate).toLocaleDateString()} | FY {fiscalYear} - {monthNames[fiscalPeriod - 1]}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              summary.isBalanced 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {summary.isBalanced ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Balanced
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Out of Balance
                </>
              )}
            </div>
            {!summary.isBalanced && (
              <p className="text-sm text-red-600 mt-1">
                Variance: {formatCurrency(summary.variance)}
              </p>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Total Debits</p>
                <p className="text-xl font-bold text-green-800 mt-1">
                  {formatCurrency(summary.totalDebits)}
                </p>
              </div>
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Total Credits</p>
                <p className="text-xl font-bold text-red-800 mt-1">
                  {formatCurrency(summary.totalCredits)}
                </p>
              </div>
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Net Difference</p>
                <p className="text-xl font-bold text-blue-800 mt-1">
                  {formatCurrency(Math.abs(summary.totalDebits - summary.totalCredits))}
                </p>
              </div>
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Total Accounts</p>
                <p className="text-xl font-bold text-gray-800 mt-1">
                  {summary.accountCount}
                </p>
              </div>
              <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">#</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trial Balance Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading trial balance...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account Code
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Debit Balance
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credit Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {viewMode === 'detailed' ? (
                  // Detailed view - all accounts
                  accounts.map((account, index) => (
                    <tr key={account._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'} hover:bg-gray-50`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {account.accountCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{account.accountName}</div>
                        <div className="text-sm text-gray-500">{account.accountCategory.replace(/_/g, ' ')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getAccountTypeColor(account.accountType)}`}>
                          {account.accountType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {account.debitBalance > 0 ? (
                          <span className="text-green-600">{formatCurrency(account.debitBalance)}</span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {account.creditBalance > 0 ? (
                          <span className="text-red-600">{formatCurrency(account.creditBalance)}</span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  // Summary view - grouped by account type
                  Object.entries(groupedAccounts).map(([accountType, typeAccounts]) => (
                    <React.Fragment key={accountType}>
                      <tr className="bg-gray-100">
                        <td className="px-6 py-3 text-sm font-bold text-gray-900" colSpan={2}>
                          {accountType} ({typeAccounts.length} accounts)
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getAccountTypeColor(accountType)}`}>
                            {accountType}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right text-sm font-bold text-green-600">
                          {formatCurrency(calculateTypeTotal(accountType, 'debit'))}
                        </td>
                        <td className="px-6 py-3 text-right text-sm font-bold text-red-600">
                          {formatCurrency(calculateTypeTotal(accountType, 'credit'))}
                        </td>
                      </tr>
                    </React.Fragment>
                  ))
                )}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right font-bold text-gray-900 text-lg">
                    TOTAL:
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-green-700 text-lg">
                    {formatCurrency(summary.totalDebits)}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-red-700 text-lg">
                    {formatCurrency(summary.totalCredits)}
                  </td>
                </tr>
                {!summary.isBalanced && (
                  <tr className="bg-red-50">
                    <td colSpan={3} className="px-6 py-2 text-right font-medium text-red-900">
                      VARIANCE:
                    </td>
                    <td colSpan={2} className="px-6 py-2 text-right font-bold text-red-700">
                      {formatCurrency(summary.variance)}
                    </td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Additional Information */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Trial Balance Notes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Accounting Equation Verification</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Assets:</span>
                <span className="font-medium">{formatCurrency(calculateTypeTotal('ASSET', 'debit') - calculateTypeTotal('ASSET', 'credit'))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Liabilities + Equity:</span>
                <span className="font-medium">{formatCurrency(calculateTypeTotal('LIABILITY', 'credit') + calculateTypeTotal('EQUITY', 'credit'))}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium text-gray-900">Difference:</span>
                <span className={`font-medium ${Math.abs(
                  (calculateTypeTotal('ASSET', 'debit') - calculateTypeTotal('ASSET', 'credit')) - 
                  (calculateTypeTotal('LIABILITY', 'credit') + calculateTypeTotal('EQUITY', 'credit'))
                ) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(
                    (calculateTypeTotal('ASSET', 'debit') - calculateTypeTotal('ASSET', 'credit')) - 
                    (calculateTypeTotal('LIABILITY', 'credit') + calculateTypeTotal('EQUITY', 'credit'))
                  ))}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Report Information</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• This trial balance includes all active accounts with non-zero balances</p>
              <p>• Balances are calculated as of the specified date</p>
              <p>• Contra accounts are shown with their normal balance sign</p>
              <p>• All amounts are in USD</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialBalance;