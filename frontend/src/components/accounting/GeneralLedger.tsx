import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Download, BookOpen, Eye, FileText } from 'lucide-react';

interface LedgerEntry {
  _id: string;
  date: string;
  voucherNumber: string;
  voucherType: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
  balance: number;
  referenceNumber?: string;
}

interface Account {
  _id: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  normalBalance: 'DEBIT' | 'CREDIT';
  currentBalance: number;
}

const GeneralLedger: React.FC = () => {
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock accounts data based on backend model
  const mockAccounts: Account[] = [
    { _id: '1', accountCode: '1001', accountName: 'Cash', accountType: 'ASSET', normalBalance: 'DEBIT', currentBalance: 25000 },
    { _id: '2', accountCode: '1002', accountName: 'Bank Account - Main', accountType: 'ASSET', normalBalance: 'DEBIT', currentBalance: 156750.50 },
    { _id: '3', accountCode: '1100', accountName: 'Accounts Receivable', accountType: 'ASSET', normalBalance: 'DEBIT', currentBalance: 45670.25 },
    { _id: '4', accountCode: '1200', accountName: 'Inventory', accountType: 'ASSET', normalBalance: 'DEBIT', currentBalance: 89500.75 },
    { _id: '5', accountCode: '2001', accountName: 'Accounts Payable', accountType: 'LIABILITY', normalBalance: 'CREDIT', currentBalance: 23456.80 },
    { _id: '6', accountCode: '3001', accountName: 'Owner Equity', accountType: 'EQUITY', normalBalance: 'CREDIT', currentBalance: 200000 },
    { _id: '7', accountCode: '4001', accountName: 'Sales Revenue', accountType: 'REVENUE', normalBalance: 'CREDIT', currentBalance: 125680.50 },
    { _id: '8', accountCode: '5001', accountName: 'Cost of Goods Sold', accountType: 'EXPENSE', normalBalance: 'DEBIT', currentBalance: 67890.25 },
    { _id: '9', accountCode: '5100', accountName: 'Salaries and Wages', accountType: 'EXPENSE', normalBalance: 'DEBIT', currentBalance: 35000 },
    { _id: '10', accountCode: '5200', accountName: 'Rent Expense', accountType: 'EXPENSE', normalBalance: 'DEBIT', currentBalance: 12000 }
  ];

  // Mock ledger entries based on JournalEntry model
  const mockLedgerEntries: { [key: string]: LedgerEntry[] } = {
    '1': [ // Cash account entries
      {
        _id: '1',
        date: '2024-09-01',
        voucherNumber: 'OB2024001',
        voucherType: 'OPENING',
        description: 'Opening Balance - Cash on Hand',
        debitAmount: 15000,
        creditAmount: 0,
        balance: 15000
      },
      {
        _id: '2',
        date: '2024-09-05',
        voucherNumber: 'CR2024001',
        voucherType: 'CASH_RECEIPT',
        description: 'Cash sales from customer walk-ins',
        debitAmount: 5000,
        creditAmount: 0,
        balance: 20000,
        referenceNumber: 'SALE-2024-001'
      },
      {
        _id: '3',
        date: '2024-09-10',
        voucherNumber: 'CP2024001',
        voucherType: 'CASH_PAYMENT',
        description: 'Office supplies and stationery purchase',
        debitAmount: 0,
        creditAmount: 500,
        balance: 19500,
        referenceNumber: 'PO-2024-001'
      },
      {
        _id: '4',
        date: '2024-09-15',
        voucherNumber: 'CR2024002',
        voucherType: 'CASH_RECEIPT',
        description: 'Customer payment for outstanding invoice',
        debitAmount: 2500,
        creditAmount: 0,
        balance: 22000,
        referenceNumber: 'INV-2024-125'
      },
      {
        _id: '5',
        date: '2024-09-20',
        voucherNumber: 'CP2024002',
        voucherType: 'CASH_PAYMENT',
        description: 'Utility bills payment - electricity',
        debitAmount: 0,
        creditAmount: 300,
        balance: 21700,
        referenceNumber: 'UTIL-092024'
      },
      {
        _id: '6',
        date: '2024-09-25',
        voucherNumber: 'CR2024003',
        voucherType: 'CASH_RECEIPT',
        description: 'Daily cash sales collection',
        debitAmount: 3300,
        creditAmount: 0,
        balance: 25000,
        referenceNumber: 'DAILY-092024'
      }
    ],
    '2': [ // Bank account entries
      {
        _id: '7',
        date: '2024-09-01',
        voucherNumber: 'OB2024002',
        voucherType: 'OPENING',
        description: 'Opening Balance - Main Bank Account',
        debitAmount: 125000,
        creditAmount: 0,
        balance: 125000
      },
      {
        _id: '8',
        date: '2024-09-03',
        voucherNumber: 'BR2024001',
        voucherType: 'BANK_RECEIPT',
        description: 'Customer payment via bank transfer',
        debitAmount: 15000,
        creditAmount: 0,
        balance: 140000,
        referenceNumber: 'TXN-BAK-001'
      },
      {
        _id: '9',
        date: '2024-09-12',
        voucherNumber: 'BP2024001',
        voucherType: 'BANK_PAYMENT',
        description: 'Supplier payment for inventory purchase',
        debitAmount: 0,
        creditAmount: 8500,
        balance: 131500,
        referenceNumber: 'SUP-PAY-001'
      },
      {
        _id: '10',
        date: '2024-09-18',
        voucherNumber: 'BR2024002',
        voucherType: 'BANK_RECEIPT',
        description: 'Wire transfer from international client',
        debitAmount: 25250,
        creditAmount: 0,
        balance: 156750.50,
        referenceNumber: 'WIRE-INT-001'
      },
      {
        _id: '11',
        date: '2024-09-28',
        voucherNumber: 'BP2024002',
        voucherType: 'BANK_PAYMENT',
        description: 'Monthly office rent payment',
        debitAmount: 0,
        creditAmount: 12000,
        balance: 144750.50,
        referenceNumber: 'RENT-092024'
      }
    ]
  };

  useEffect(() => {
    setAccounts(mockAccounts);
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      setLoading(true);
      // Simulate API call with realistic delay
      setTimeout(() => {
        const entries = mockLedgerEntries[selectedAccount] || [];
        // Filter entries by date range
        const filteredEntries = entries.filter(entry => {
          const entryDate = new Date(entry.date);
          const fromDate = new Date(dateFrom);
          const toDate = new Date(dateTo);
          return entryDate >= fromDate && entryDate <= toDate;
        });
        setLedgerEntries(filteredEntries);
        setLoading(false);
      }, 800);
    } else {
      setLedgerEntries([]);
    }
  }, [selectedAccount, dateFrom, dateTo]);

  const selectedAccountData = accounts.find(acc => acc._id === selectedAccount);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getVoucherTypeColor = (type: string) => {
    const colors = {
      OPENING: 'bg-gray-100 text-gray-800',
      CASH_RECEIPT: 'bg-green-100 text-green-800',
      CASH_PAYMENT: 'bg-red-100 text-red-800',
      BANK_RECEIPT: 'bg-blue-100 text-blue-800',
      BANK_PAYMENT: 'bg-purple-100 text-purple-800',
      JOURNAL: 'bg-yellow-100 text-yellow-800',
      SALES: 'bg-emerald-100 text-emerald-800',
      PURCHASE: 'bg-orange-100 text-orange-800',
      ADJUSTMENT: 'bg-indigo-100 text-indigo-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const calculateTotals = () => {
    const totalDebits = ledgerEntries.reduce((sum, entry) => sum + entry.debitAmount, 0);
    const totalCredits = ledgerEntries.reduce((sum, entry) => sum + entry.creditAmount, 0);
    const openingBalance = selectedAccountData?.currentBalance || 0;
    const closingBalance = ledgerEntries.length > 0 ? ledgerEntries[ledgerEntries.length - 1].balance : openingBalance;
    
    return { totalDebits, totalCredits, openingBalance, closingBalance };
  };

  const { totalDebits, totalCredits, openingBalance, closingBalance } = calculateTotals();

  const handleExport = () => {
    if (!selectedAccountData || ledgerEntries.length === 0) return;
    
    // Create CSV content
    const csvContent = [
      ['Date', 'Voucher Number', 'Voucher Type', 'Description', 'Reference', 'Debit', 'Credit', 'Balance'],
      ...ledgerEntries.map(entry => [
        new Date(entry.date).toLocaleDateString(),
        entry.voucherNumber,
        entry.voucherType,
        entry.description,
        entry.referenceNumber || '',
        entry.debitAmount.toString(),
        entry.creditAmount.toString(),
        entry.balance.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `GeneralLedger_${selectedAccountData.accountCode}_${dateFrom}_${dateTo}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Account *
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              <option value="">Choose an account...</option>
              {accounts.map(account => (
                <option key={account._id} value={account._id}>
                  {account.accountCode} - {account.accountName}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleExport}
              disabled={!selectedAccount || ledgerEntries.length === 0}
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Account Information Header */}
      {selectedAccountData && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-primary-600 mr-4" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedAccountData.accountCode} - {selectedAccountData.accountName}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Account Type: {selectedAccountData.accountType} | Normal Balance: {selectedAccountData.normalBalance}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Report Period</p>
              <p className="text-lg font-medium text-gray-900 mt-1">
                {new Date(dateFrom).toLocaleDateString()} - {new Date(dateTo).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Opening Balance</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {formatCurrency(openingBalance)}
                  </p>
                </div>
                <div className="p-2 bg-gray-200 rounded-lg">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Total Debits</p>
                  <p className="text-xl font-bold text-green-800 mt-1">
                    {formatCurrency(totalDebits)}
                  </p>
                </div>
                <div className="p-2 bg-green-200 rounded-lg">
                  <FileText className="w-5 h-5 text-green-700" />
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">Total Credits</p>
                  <p className="text-xl font-bold text-red-800 mt-1">
                    {formatCurrency(totalCredits)}
                  </p>
                </div>
                <div className="p-2 bg-red-200 rounded-lg">
                  <FileText className="w-5 h-5 text-red-700" />
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Closing Balance</p>
                  <p className="text-xl font-bold text-blue-800 mt-1">
                    {formatCurrency(closingBalance)}
                  </p>
                </div>
                <div className="p-2 bg-blue-200 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-700" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ledger Entries Table */}
      {selectedAccount && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">General Ledger Transactions</h3>
            <p className="text-sm text-gray-600 mt-1">
              Detailed transaction history for the selected account and period
            </p>
          </div>
          
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading ledger entries...</p>
            </div>
          ) : ledgerEntries.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Transactions Found</h4>
              <p className="text-gray-600">
                {selectedAccount 
                  ? 'No transactions found for the selected account and date range.'
                  : 'Please select an account to view its ledger entries.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Voucher Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Debit Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credit Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Running Balance
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ledgerEntries.map((entry, index) => (
                    <tr key={entry._id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(entry.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 mb-1">{entry.voucherNumber}</div>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getVoucherTypeColor(entry.voucherType)}`}>
                            {entry.voucherType.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="text-sm text-gray-900 truncate" title={entry.description}>
                          {entry.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.referenceNumber || (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {entry.debitAmount > 0 ? (
                          <span className="text-green-600 font-semibold">
                            {formatCurrency(entry.debitAmount)}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {entry.creditAmount > 0 ? (
                          <span className="text-red-600 font-semibold">
                            {formatCurrency(entry.creditAmount)}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-blue-600">
                        {formatCurrency(entry.balance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button 
                          className="text-primary-600 hover:text-primary-900 transition-colors"
                          title="View voucher details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-right font-bold text-gray-900 text-lg">
                      Period Totals:
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-green-700 text-lg">
                      {formatCurrency(totalDebits)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-red-700 text-lg">
                      {formatCurrency(totalCredits)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-blue-700 text-lg">
                      {formatCurrency(closingBalance)}
                    </td>
                    <td className="px-6 py-4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Account Movement Summary */}
      {selectedAccount && ledgerEntries.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Movement Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{ledgerEntries.length}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Net Movement</p>
              <p className={`text-2xl font-bold mt-1 ${
                (totalDebits - totalCredits) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(Math.abs(totalDebits - totalCredits))}
                <span className="text-sm ml-1">
                  {(totalDebits - totalCredits) >= 0 ? '(Dr)' : '(Cr)'}
                </span>
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Balance Change</p>
              <p className={`text-2xl font-bold mt-1 ${
                (closingBalance - openingBalance) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(Math.abs(closingBalance - openingBalance))}
                <span className="text-sm ml-1">
                  {(closingBalance - openingBalance) >= 0 ? '↑' : '↓'}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralLedger;