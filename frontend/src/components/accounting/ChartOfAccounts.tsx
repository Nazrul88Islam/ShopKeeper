import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Eye, BookOpen, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import { accountingApi } from '../../api/accountingApi';

interface Account {
  _id: string;
  accountCode: string;
  accountName: string;
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  accountCategory: string;
  accountSubCategory?: string;
  parentAccount?: string;
  level: number;
  normalBalance: 'DEBIT' | 'CREDIT';
  currentBalance: number;
  description?: string;
  isActive: boolean;
  isSystemAccount: boolean;
  allowPosting: boolean;
}

const ChartOfAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Load accounts from API
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await accountingApi.getChartOfAccounts();
      
      if (response.success) {
        setAccounts(response.data);
        setLastRefresh(new Date());
      } else {
        setError('Failed to load chart of accounts');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading accounts');
      console.error('Chart of Accounts loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAccounts();
  };

  const handleCreateAccount = async (accountData: any) => {
    try {
      setLoading(true);
      const response = await accountingApi.createAccount(accountData);
      
      if (response.success) {
        setShowForm(false);
        setEditingAccount(null);
        loadAccounts(); // Reload to get updated data
      } else {
        setError('Failed to create account');
      }
    } catch (err: any) {
      setError(err.message || 'Error creating account');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAccount = async (accountId: string, accountData: any) => {
    try {
      setLoading(true);
      const response = await accountingApi.updateAccount(accountId, accountData);
      
      if (response.success) {
        setShowForm(false);
        setEditingAccount(null);
        loadAccounts(); // Reload to get updated data
      } else {
        setError('Failed to update account');
      }
    } catch (err: any) {
      setError(err.message || 'Error updating account');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return;
    
    try {
      setLoading(true);
      const response = await accountingApi.deleteAccount(accountId);
      
      if (response.success) {
        loadAccounts(); // Reload to get updated data
      } else {
        setError('Failed to delete account');
      }
    } catch (err: any) {
      setError(err.message || 'Error deleting account');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = accounts.filter(account => 
      account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.accountCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (typeFilter !== 'all') {
      filtered = filtered.filter(account => account.accountType === typeFilter);
    }

    setFilteredAccounts(filtered);
  }, [searchTerm, typeFilter, accounts]);

  const getTypeColor = (type: string) => {
    const colors = {
      ASSET: 'bg-green-100 text-green-800',
      LIABILITY: 'bg-red-100 text-red-800',
      EQUITY: 'bg-blue-100 text-blue-800',
      REVENUE: 'bg-purple-100 text-purple-800',
      EXPENSE: 'bg-orange-100 text-orange-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const calculateTotalsByType = () => {
    const totals = {
      ASSET: 0,
      LIABILITY: 0,
      EQUITY: 0,
      REVENUE: 0,
      EXPENSE: 0
    };

    accounts.forEach(account => {
      totals[account.accountType] += account.currentBalance;
    });

    return totals;
  };

  const totals = calculateTotalsByType();

  const handleAddAccount = () => {
    setEditingAccount(null);
    setShowForm(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Object.entries(totals).map(([type, total]) => (
          <div key={type} className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">{type}</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(total)}</p>
            </div>
          </div>
        ))}
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
            <span className="text-blue-800">Loading accounts...</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="ASSET">Assets</option>
              <option value="LIABILITY">Liabilities</option>
              <option value="EQUITY">Equity</option>
              <option value="REVENUE">Revenue</option>
              <option value="EXPENSE">Expenses</option>
            </select>
            
            <button
              onClick={handleAddAccount}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </button>
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Normal Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Balance
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
              {filteredAccounts.map((account) => (
                <tr key={account._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <BookOpen className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{account.accountCode}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{account.accountName}</div>
                      {account.description && (
                        <div className="text-sm text-gray-500">{account.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(account.accountType)}`}>
                      {account.accountType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {account.accountCategory.replace(/_/g, ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      account.normalBalance === 'DEBIT' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {account.normalBalance}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(account.currentBalance)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        account.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {account.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {account.isSystemAccount && (
                        <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          System
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-primary-600 hover:text-primary-900">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEditAccount(account)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {!account.isSystemAccount && (
                        <button 
                          onClick={() => handleDeleteAccount(account._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Balance Verification */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Balance Verification</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-3">Assets = Liabilities + Equity</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Assets:</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(totals.ASSET)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Liabilities + Equity:</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(totals.LIABILITY + totals.EQUITY)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-medium text-gray-900">Difference:</span>
                <span className={`text-sm font-medium ${
                  Math.abs(totals.ASSET - (totals.LIABILITY + totals.EQUITY)) < 0.01 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {formatCurrency(totals.ASSET - (totals.LIABILITY + totals.EQUITY))}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-3">Income Statement Accounts</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Revenue:</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(totals.REVENUE)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Expenses:</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(totals.EXPENSE)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-medium text-gray-900">Net Income:</span>
                <span className={`text-sm font-medium ${
                  (totals.REVENUE - totals.EXPENSE) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(totals.REVENUE - totals.EXPENSE)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Form Modal - Would be implemented as a separate component */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingAccount ? 'Edit Account' : 'Add New Account'}
            </h3>
            <p className="text-gray-600 mb-4">
              Account form would be implemented here with full validation and backend integration.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartOfAccounts;