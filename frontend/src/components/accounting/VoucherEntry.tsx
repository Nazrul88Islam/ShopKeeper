import React, { useState, useEffect } from 'react';
import { Search, Plus, Save, Eye, FileText, Calendar, DollarSign, Receipt } from 'lucide-react';

interface VoucherEntry {
  _id: string;
  voucherNumber: string;
  voucherType: 'CASH_RECEIPT' | 'CASH_PAYMENT' | 'BANK_RECEIPT' | 'BANK_PAYMENT' | 'PURCHASE' | 'SALES';
  date: string;
  description: string;
  amount: number;
  account: string;
  accountName: string;
  referenceNumber?: string;
  status: 'DRAFT' | 'POSTED' | 'CANCELLED';
  createdBy: string;
}

interface Account {
  _id: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  allowPosting: boolean;
}

const VoucherEntry: React.FC = () => {
  const [vouchers, setVouchers] = useState<VoucherEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Form state
  const [formData, setFormData] = useState({
    voucherType: 'CASH_RECEIPT' as const,
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    account: '',
    referenceNumber: ''
  });

  // Mock accounts for dropdown
  const mockAccounts: Account[] = [
    { _id: '1', accountCode: '1001', accountName: 'Cash', accountType: 'ASSET', allowPosting: true },
    { _id: '2', accountCode: '1002', accountName: 'Bank Account - Main', accountType: 'ASSET', allowPosting: true },
    { _id: '3', accountCode: '1100', accountName: 'Accounts Receivable', accountType: 'ASSET', allowPosting: true },
    { _id: '4', accountCode: '1200', accountName: 'Inventory', accountType: 'ASSET', allowPosting: true },
    { _id: '5', accountCode: '2001', accountName: 'Accounts Payable', accountType: 'LIABILITY', allowPosting: true },
    { _id: '6', accountCode: '4001', accountName: 'Sales Revenue', accountType: 'REVENUE', allowPosting: true },
    { _id: '7', accountCode: '5001', accountName: 'Cost of Goods Sold', accountType: 'EXPENSE', allowPosting: true },
    { _id: '8', accountCode: '5100', accountName: 'Salaries and Wages', accountType: 'EXPENSE', allowPosting: true },
    { _id: '9', accountCode: '5200', accountName: 'Rent Expense', accountType: 'EXPENSE', allowPosting: true },
    { _id: '10', accountCode: '5300', accountName: 'Office Supplies', accountType: 'EXPENSE', allowPosting: true }
  ];

  // Mock voucher entries
  const mockVouchers: VoucherEntry[] = [
    {
      _id: '1',
      voucherNumber: 'CR2024001',
      voucherType: 'CASH_RECEIPT',
      date: '2024-09-29',
      description: 'Cash sales from customer walk-ins',
      amount: 5000.00,
      account: '1',
      accountName: 'Cash',
      referenceNumber: 'SALE-001',
      status: 'POSTED',
      createdBy: 'John Doe'
    },
    {
      _id: '2',
      voucherNumber: 'CP2024001',
      voucherType: 'CASH_PAYMENT',
      date: '2024-09-28',
      description: 'Office supplies purchase',
      amount: 500.00,
      account: '10',
      accountName: 'Office Supplies',
      referenceNumber: 'PO-001',
      status: 'POSTED',
      createdBy: 'Jane Smith'
    },
    {
      _id: '3',
      voucherNumber: 'BR2024001',
      voucherType: 'BANK_RECEIPT',
      date: '2024-09-27',
      description: 'Customer payment via bank transfer',
      amount: 15000.00,
      account: '2',
      accountName: 'Bank Account - Main',
      referenceNumber: 'TXN-001',
      status: 'POSTED',
      createdBy: 'John Doe'
    },
    {
      _id: '4',
      voucherNumber: 'BP2024001',
      voucherType: 'BANK_PAYMENT',
      date: '2024-09-26',
      description: 'Supplier payment for inventory',
      amount: 8500.00,
      account: '2',
      accountName: 'Bank Account - Main',
      referenceNumber: 'SUP-001',
      status: 'POSTED',
      createdBy: 'Jane Smith'
    },
    {
      _id: '5',
      voucherNumber: 'SV2024001',
      voucherType: 'SALES',
      date: '2024-09-25',
      description: 'Product sales invoice',
      amount: 12000.00,
      account: '6',
      accountName: 'Sales Revenue',
      referenceNumber: 'INV-001',
      status: 'DRAFT',
      createdBy: 'John Doe'
    }
  ];

  useEffect(() => {
    setVouchers(mockVouchers);
  }, []);

  const handleSave = () => {
    if (!formData.description || !formData.account || formData.amount <= 0) {
      alert('Please fill in all required fields.');
      return;
    }

    const selectedAccount = mockAccounts.find(acc => acc._id === formData.account);
    if (!selectedAccount) {
      alert('Please select a valid account.');
      return;
    }

    alert('Voucher would be saved in a real application.');
    setShowForm(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      voucherType: 'CASH_RECEIPT',
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: 0,
      account: '',
      referenceNumber: ''
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getVoucherTypeColor = (type: string) => {
    const colors = {
      CASH_RECEIPT: 'bg-green-100 text-green-800',
      CASH_PAYMENT: 'bg-red-100 text-red-800',
      BANK_RECEIPT: 'bg-blue-100 text-blue-800',
      BANK_PAYMENT: 'bg-purple-100 text-purple-800',
      SALES: 'bg-emerald-100 text-emerald-800',
      PURCHASE: 'bg-orange-100 text-orange-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      DRAFT: 'bg-yellow-100 text-yellow-800',
      POSTED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredVouchers = vouchers.filter(voucher => {
    const matchesSearch = voucher.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         voucher.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || voucher.voucherType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search vouchers..."
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
              <option value="CASH_RECEIPT">Cash Receipt</option>
              <option value="CASH_PAYMENT">Cash Payment</option>
              <option value="BANK_RECEIPT">Bank Receipt</option>
              <option value="BANK_PAYMENT">Bank Payment</option>
              <option value="SALES">Sales</option>
              <option value="PURCHASE">Purchase</option>
            </select>
            
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Voucher
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Voucher Entry</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { type: 'CASH_RECEIPT', icon: DollarSign, label: 'Cash Receipt', color: 'bg-green-500' },
            { type: 'CASH_PAYMENT', icon: Receipt, label: 'Cash Payment', color: 'bg-red-500' },
            { type: 'BANK_RECEIPT', icon: FileText, label: 'Bank Receipt', color: 'bg-blue-500' },
            { type: 'BANK_PAYMENT', icon: FileText, label: 'Bank Payment', color: 'bg-purple-500' }
          ].map(({ type, icon: Icon, label, color }) => (
            <button
              key={type}
              onClick={() => {
                setFormData({ ...formData, voucherType: type as any });
                setShowForm(true);
              }}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className={`p-3 rounded-lg ${color} text-white mb-2`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-gray-900">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Vouchers List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Voucher Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
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
              {filteredVouchers.map((voucher) => (
                <tr key={voucher._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Receipt className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{voucher.voucherNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getVoucherTypeColor(voucher.voucherType)}`}>
                      {voucher.voucherType.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {new Date(voucher.date).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <div className="text-sm text-gray-900 truncate">{voucher.description}</div>
                    {voucher.referenceNumber && (
                      <div className="text-sm text-gray-500">Ref: {voucher.referenceNumber}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {voucher.accountName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end">
                      <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(voucher.amount)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(voucher.status)}`}>
                      {voucher.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-primary-600 hover:text-primary-900 mr-3">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Voucher Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">New Voucher Entry</h3>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Header Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Voucher Type *
                  </label>
                  <select
                    value={formData.voucherType}
                    onChange={(e) => setFormData({...formData, voucherType: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="CASH_RECEIPT">Cash Receipt</option>
                    <option value="CASH_PAYMENT">Cash Payment</option>
                    <option value="BANK_RECEIPT">Bank Receipt</option>
                    <option value="BANK_PAYMENT">Bank Payment</option>
                    <option value="SALES">Sales Voucher</option>
                    <option value="PURCHASE">Purchase Voucher</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter voucher description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account *
                  </label>
                  <select
                    value={formData.account}
                    onChange={(e) => setFormData({...formData, account: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select Account</option>
                    {mockAccounts.map(account => (
                      <option key={account._id} value={account._id}>
                        {account.accountCode} - {account.accountName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({...formData, referenceNumber: e.target.value})}
                  placeholder="Optional reference number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-between">
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherEntry;