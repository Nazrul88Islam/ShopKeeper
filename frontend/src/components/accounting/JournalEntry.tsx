import React, { useState, useEffect } from 'react';
import { Search, Plus, Save, Eye, FileText, Calendar, DollarSign } from 'lucide-react';

interface JournalEntryLine {
  account: string;
  accountName: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
  department?: string;
  project?: string;
}

interface JournalEntry {
  _id: string;
  voucherNumber: string;
  voucherType: string;
  date: string;
  description: string;
  entries: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  status: 'DRAFT' | 'POSTED' | 'REVERSED' | 'CANCELLED';
  createdBy: string;
  fiscalYear: number;
  fiscalPeriod: number;
}

interface Account {
  _id: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  allowPosting: boolean;
}

const JournalEntry: React.FC = () => {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Form state
  const [formData, setFormData] = useState({
    voucherType: 'JOURNAL',
    date: new Date().toISOString().split('T')[0],
    description: '',
    referenceNumber: ''
  });
  
  const [entryLines, setEntryLines] = useState<JournalEntryLine[]>([
    { account: '', accountName: '', description: '', debitAmount: 0, creditAmount: 0 },
    { account: '', accountName: '', description: '', debitAmount: 0, creditAmount: 0 }
  ]);

  // Mock accounts for dropdown
  const mockAccounts: Account[] = [
    { _id: '1', accountCode: '1001', accountName: 'Cash', accountType: 'ASSET', allowPosting: true },
    { _id: '2', accountCode: '1002', accountName: 'Bank Account - Main', accountType: 'ASSET', allowPosting: true },
    { _id: '3', accountCode: '1100', accountName: 'Accounts Receivable', accountType: 'ASSET', allowPosting: true },
    { _id: '4', accountCode: '1200', accountName: 'Inventory', accountType: 'ASSET', allowPosting: true },
    { _id: '5', accountCode: '2001', accountName: 'Accounts Payable', accountType: 'LIABILITY', allowPosting: true },
    { _id: '6', accountCode: '3001', accountName: 'Owner Equity', accountType: 'EQUITY', allowPosting: true },
    { _id: '7', accountCode: '4001', accountName: 'Sales Revenue', accountType: 'REVENUE', allowPosting: true },
    { _id: '8', accountCode: '5001', accountName: 'Cost of Goods Sold', accountType: 'EXPENSE', allowPosting: true },
    { _id: '9', accountCode: '5100', accountName: 'Salaries and Wages', accountType: 'EXPENSE', allowPosting: true },
    { _id: '10', accountCode: '5200', accountName: 'Rent Expense', accountType: 'EXPENSE', allowPosting: true }
  ];

  // Mock journal entries
  const mockJournalEntries: JournalEntry[] = [
    {
      _id: '1',
      voucherNumber: 'JV2024001',
      voucherType: 'JOURNAL',
      date: '2024-09-29',
      description: 'Monthly salary payment',
      entries: [
        {
          account: '9',
          accountName: 'Salaries and Wages',
          description: 'Monthly salary payment',
          debitAmount: 35000,
          creditAmount: 0
        },
        {
          account: '1',
          accountName: 'Cash',
          description: 'Cash payment for salaries',
          debitAmount: 0,
          creditAmount: 35000
        }
      ],
      totalDebit: 35000,
      totalCredit: 35000,
      status: 'POSTED',
      createdBy: 'John Doe',
      fiscalYear: 2024,
      fiscalPeriod: 9
    },
    {
      _id: '2',
      voucherNumber: 'JV2024002',
      voucherType: 'JOURNAL',
      date: '2024-09-28',
      description: 'Office rent payment',
      entries: [
        {
          account: '10',
          accountName: 'Rent Expense',
          description: 'Monthly office rent',
          debitAmount: 12000,
          creditAmount: 0
        },
        {
          account: '2',
          accountName: 'Bank Account - Main',
          description: 'Bank payment for rent',
          debitAmount: 0,
          creditAmount: 12000
        }
      ],
      totalDebit: 12000,
      totalCredit: 12000,
      status: 'POSTED',
      createdBy: 'Jane Smith',
      fiscalYear: 2024,
      fiscalPeriod: 9
    }
  ];

  useEffect(() => {
    setJournalEntries(mockJournalEntries);
  }, []);

  const addEntryLine = () => {
    setEntryLines([...entryLines, { account: '', accountName: '', description: '', debitAmount: 0, creditAmount: 0 }]);
  };

  const removeEntryLine = (index: number) => {
    if (entryLines.length > 2) {
      setEntryLines(entryLines.filter((_, i) => i !== index));
    }
  };

  const updateEntryLine = (index: number, field: keyof JournalEntryLine, value: any) => {
    const updated = [...entryLines];
    
    if (field === 'account') {
      const account = mockAccounts.find(acc => acc._id === value);
      updated[index] = {
        ...updated[index],
        account: value,
        accountName: account ? `${account.accountCode} - ${account.accountName}` : ''
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    
    setEntryLines(updated);
  };

  const calculateTotals = () => {
    const totalDebit = entryLines.reduce((sum, line) => sum + (line.debitAmount || 0), 0);
    const totalCredit = entryLines.reduce((sum, line) => sum + (line.creditAmount || 0), 0);
    return { totalDebit, totalCredit };
  };

  const isBalanced = () => {
    const { totalDebit, totalCredit } = calculateTotals();
    return Math.abs(totalDebit - totalCredit) < 0.01;
  };

  const handleSave = () => {
    if (!isBalanced()) {
      alert('Journal entry is not balanced. Total debits must equal total credits.');
      return;
    }

    if (entryLines.length < 2) {
      alert('Journal entry must have at least 2 lines.');
      return;
    }

    const hasValidEntries = entryLines.every(line => 
      line.account && line.description && (line.debitAmount > 0 || line.creditAmount > 0)
    );

    if (!hasValidEntries) {
      alert('All entry lines must have an account, description, and either a debit or credit amount.');
      return;
    }

    alert('Journal entry would be saved in a real application.');
    setShowForm(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      voucherType: 'JOURNAL',
      date: new Date().toISOString().split('T')[0],
      description: '',
      referenceNumber: ''
    });
    setEntryLines([
      { account: '', accountName: '', description: '', debitAmount: 0, creditAmount: 0 },
      { account: '', accountName: '', description: '', debitAmount: 0, creditAmount: 0 }
    ]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      DRAFT: 'bg-yellow-100 text-yellow-800',
      POSTED: 'bg-green-100 text-green-800',
      REVERSED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredEntries = journalEntries.filter(entry => {
    const matchesSearch = entry.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const { totalDebit, totalCredit } = calculateTotals();

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
                placeholder="Search journal entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="POSTED">Posted</option>
              <option value="REVERSED">Reversed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Journal Entry
            </button>
          </div>
        </div>
      </div>

      {/* Journal Entries List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Voucher Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEntries.map((entry) => (
                <tr key={entry._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{entry.voucherNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {new Date(entry.date).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{entry.description}</div>
                    <div className="text-sm text-gray-500">{entry.entries.length} entries</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(entry.totalDebit)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(entry.status)}`}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.createdBy}
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

      {/* Journal Entry Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">New Journal Entry</h3>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Header Information */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Voucher Type
                  </label>
                  <select
                    value={formData.voucherType}
                    onChange={(e) => setFormData({...formData, voucherType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="JOURNAL">Journal Entry</option>
                    <option value="CASH_RECEIPT">Cash Receipt</option>
                    <option value="CASH_PAYMENT">Cash Payment</option>
                    <option value="BANK_RECEIPT">Bank Receipt</option>
                    <option value="BANK_PAYMENT">Bank Payment</option>
                    <option value="ADJUSTMENT">Adjustment</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({...formData, referenceNumber: e.target.value})}
                    placeholder="Optional reference"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <span className="inline-flex px-3 py-2 text-sm font-medium text-yellow-800 bg-yellow-100 rounded-lg">
                    DRAFT
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter journal entry description"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Entry Lines */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-900">Journal Entry Lines</h4>
                  <button
                    onClick={addEntryLine}
                    className="inline-flex items-center px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Line
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Debit</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Credit</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entryLines.map((line, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="px-4 py-2">
                            <select
                              value={line.account}
                              onChange={(e) => updateEntryLine(index, 'account', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                            >
                              <option value="">Select Account</option>
                              {mockAccounts.map(account => (
                                <option key={account._id} value={account._id}>
                                  {account.accountCode} - {account.accountName}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={line.description}
                              onChange={(e) => updateEntryLine(index, 'description', e.target.value)}
                              placeholder="Entry description"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={line.debitAmount || ''}
                              onChange={(e) => updateEntryLine(index, 'debitAmount', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={line.creditAmount || ''}
                              onChange={(e) => updateEntryLine(index, 'creditAmount', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                            />
                          </td>
                          <td className="px-4 py-2">
                            {entryLines.length > 2 && (
                              <button
                                onClick={() => removeEntryLine(index)}
                                className="text-red-600 hover:text-red-900 text-sm"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={2} className="px-4 py-2 text-right font-medium">Totals:</td>
                        <td className="px-4 py-2 font-medium">{formatCurrency(totalDebit)}</td>
                        <td className="px-4 py-2 font-medium">{formatCurrency(totalCredit)}</td>
                        <td className="px-4 py-2">
                          {isBalanced() ? (
                            <span className="text-green-600 text-sm">✓ Balanced</span>
                          ) : (
                            <span className="text-red-600 text-sm">⚠ Not Balanced</span>
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
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
              <div className="flex space-x-3">
                <button
                  onClick={handleSave}
                  disabled={!isBalanced()}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save as Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalEntry;