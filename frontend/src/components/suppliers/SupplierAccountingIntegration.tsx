import React, { useState, useEffect } from 'react';
import {
  Building2,
  CreditCard,
  Link,
  Unlink,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Users,
  ArrowRight,
  Download,
  Settings,
  Plus
} from 'lucide-react';
import { supplierApi } from '../../api/supplierApi';
import { accountingApi } from '../../api/accountingApi';

interface SupplierAccount {
  _id: string;
  companyName: string;
  supplierCode: string;
  account?: {
    _id: string;
    accountCode: string;
    accountName: string;
    balance: number;
    isLinked: boolean;
  };
  isLinked: boolean;
  message?: string;
}

interface AccountingSummary {
  totalSuppliers: number;
  suppliersWithAccounts: number;
  suppliersWithoutAccounts: number;
  totalAccountsPayable: number;
  integrationPercentage: string;
  suppliers: Array<{
    _id: string;
    companyName: string;
    supplierCode: string;
    account: {
      accountCode: string;
      accountName: string;
      balance: number;
    };
  }>;
}

const SupplierAccountingIntegration: React.FC = () => {
  const [summary, setSummary] = useState<AccountingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [selectedView, setSelectedView] = useState<'overview' | 'suppliers' | 'accounts'>('overview');

  useEffect(() => {
    loadAccountingSummary();
  }, []);

  const loadAccountingSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/suppliers/accounting/summary', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSummary(data.data);
          setLastRefresh(new Date());
        } else {
          setError('Failed to load accounting summary');
        }
      } else {
        setError('Failed to fetch accounting data');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading accounting summary');
      console.error('Accounting summary loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const setupAllSupplierAccounts = async () => {
    try {
      setSetupLoading(true);
      setError(null);
      
      const response = await fetch('/api/suppliers/setup-accounts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh the summary after setup
          await loadAccountingSummary();
          alert(`Success! ${data.data.summary.created} supplier accounts created.`);
        } else {
          setError('Failed to setup supplier accounts');
        }
      } else {
        setError('Failed to setup accounts');
      }
    } catch (err: any) {
      setError(err.message || 'Error setting up supplier accounts');
      console.error('Setup error:', err);
    } finally {
      setSetupLoading(false);
    }
  };

  const createIndividualAccount = async (supplierId: string) => {
    try {
      const response = await fetch(`/api/suppliers/${supplierId}/create-account`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await loadAccountingSummary();
          alert(`Account created successfully for ${data.data.supplier.companyName}`);
        }
      } else {
        alert('Failed to create account for this supplier');
      }
    } catch (err) {
      console.error('Error creating individual account:', err);
      alert('Error creating account');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleRefresh = () => {
    loadAccountingSummary();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="text-center text-gray-600 mt-4">Loading supplier accounting integration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Building2 className="w-6 h-6 mr-2" />
            Supplier Accounting Integration
          </h1>
          <p className="text-gray-600 mt-1">
            Manage Chart of Accounts integration for suppliers
          </p>
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
          <button
            onClick={setupAllSupplierAccounts}
            disabled={setupLoading}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            {setupLoading ? 'Setting up...' : 'Setup All Accounts'}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 w-6 h-6 flex items-center justify-center rounded hover:bg-red-100 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="bg-white p-1 rounded-lg shadow-sm border">
        <div className="flex space-x-1">
          <button
            onClick={() => setSelectedView('overview')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedView === 'overview'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedView('suppliers')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedView === 'suppliers'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Suppliers
          </button>
          <button
            onClick={() => setSelectedView('accounts')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedView === 'accounts'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Accounts
          </button>
        </div>
      </div>

      {summary && (
        <>
          {selectedView === 'overview' && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Suppliers</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalSuppliers}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">With Accounts</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">{summary.suppliersWithAccounts}</p>
                      <p className="text-sm text-green-500 mt-1">{summary.integrationPercentage}% integrated</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Without Accounts</p>
                      <p className="text-2xl font-bold text-orange-600 mt-1">{summary.suppliersWithoutAccounts}</p>
                      <p className="text-sm text-orange-500 mt-1">Need setup</p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <AlertCircle className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Payables</p>
                      <p className="text-2xl font-bold text-purple-600 mt-1">
                        {formatCurrency(summary.totalAccountsPayable)}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <DollarSign className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Integration Status */}
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900">Integration Status</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Current status of supplier-accounting integration
                  </p>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-primary-600 rounded mr-3"></div>
                      <span className="text-sm font-medium text-gray-900">Integration Progress</span>
                    </div>
                    <span className="text-sm font-medium text-primary-600">{summary.integrationPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-primary-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${summary.integrationPercentage}%` }}
                    ></div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-green-800">Integrated</span>
                      </div>
                      <span className="text-sm font-bold text-green-800">{summary.suppliersWithAccounts}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
                        <span className="text-sm font-medium text-orange-800">Pending</span>
                      </div>
                      <span className="text-sm font-bold text-orange-800">{summary.suppliersWithoutAccounts}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {selectedView === 'suppliers' && (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Suppliers with Accounts</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {summary.suppliersWithAccounts} of {summary.totalSuppliers} suppliers have linked accounts
                </p>
              </div>
              
              {summary.suppliers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Supplier
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Account Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Account Name
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Balance
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {summary.suppliers.map((supplier) => (
                        <tr key={supplier._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{supplier.companyName}</div>
                              <div className="text-sm text-gray-500">{supplier.supplierCode}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-mono text-gray-900">{supplier.account.accountCode}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{supplier.account.accountName}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className={`text-sm font-medium ${
                              supplier.account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(supplier.account.balance)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Linked
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Linked Suppliers</h4>
                  <p className="text-gray-600 mb-4">No suppliers have linked Chart of Accounts yet.</p>
                  <button
                    onClick={setupAllSupplierAccounts}
                    disabled={setupLoading}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Setup Accounts
                  </button>
                </div>
              )}
            </div>
          )}

          {selectedView === 'accounts' && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Account Management</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Manage individual supplier account integrations
                </p>
              </div>
              <div className="p-6">
                <div className="text-center py-8">
                  <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Account Management</h4>
                  <p className="text-gray-600 mb-4">
                    Individual account management features will be implemented here.
                  </p>
                  <div className="flex justify-center space-x-3">
                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                      <Download className="w-4 h-4 mr-2" />
                      Export Data
                    </button>
                    <button className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SupplierAccountingIntegration;