import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Copy,
  RefreshCw,
  Download,
  FileText,
  Calendar,
  DollarSign,
  AlertCircle,
  RotateCcw,
  Ban
} from 'lucide-react';
import { 
  accountingApi, 
  type JournalEntry, 
  type CreateJournalEntryRequest, 
  type Account, 
  type VoucherType,
  type VoucherStats 
} from '../api/accountingApi';
import VoucherEntryForm from '../components/accounting/VoucherEntryForm';

const VoucherEntry: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [voucherTypes, setVoucherTypes] = useState<VoucherType[]>([]);
  const [stats, setStats] = useState<VoucherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load voucher entries with filters
  useEffect(() => {
    loadVoucherEntries();
  }, [currentPage, searchTerm, statusFilter, typeFilter, dateFrom, dateTo]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [accountsResponse, typesResponse, statsResponse] = await Promise.all([
        accountingApi.getChartOfAccounts({ isActive: true }),
        accountingApi.getVoucherTypes(),
        accountingApi.getJournalEntryStats()
      ]);

      if (accountsResponse.success) {
        setAccounts(accountsResponse.data);
      }
      if (typesResponse.success) {
        setVoucherTypes(typesResponse.data);
      }
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
    } catch (err: any) {
      setError('Failed to load initial data');
      console.error('Initial data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadVoucherEntries = async () => {
    try {
      setError(null);
      const params: any = {
        page: currentPage,
        limit: 20,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        voucherType: typeFilter !== 'all' ? typeFilter : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      };

      const response = await accountingApi.getJournalEntriesRealTime(params);
      if (response.success) {
        setEntries(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.total);
        }
        setLastRefresh(new Date());
      } else {
        setError('Failed to load voucher entries');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading voucher entries');
      console.error('Voucher entries loading error:', err);
    }
  };

  const handleRefresh = () => {
    loadVoucherEntries();
    loadInitialData();
  };

  const handleCreateEntry = async (data: CreateJournalEntryRequest) => {
    try {
      setLoading(true);
      const response = await accountingApi.createJournalEntry(data);
      if (response.success) {
        setShowForm(false);
        loadVoucherEntries();
        loadInitialData(); // Refresh stats
      } else {
        setError('Failed to create voucher entry');
      }
    } catch (err: any) {
      setError(err.message || 'Error creating voucher entry');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEntry = async (entryId: string, data: Partial<CreateJournalEntryRequest>) => {
    try {
      setLoading(true);
      const response = await accountingApi.updateJournalEntry(entryId, data);
      if (response.success) {
        setShowForm(false);
        setEditingEntry(null);
        loadVoucherEntries();
      } else {
        setError('Failed to update voucher entry');
      }
    } catch (err: any) {
      setError(err.message || 'Error updating voucher entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this voucher entry?')) return;
    
    try {
      setLoading(true);
      const response = await accountingApi.deleteJournalEntry(entryId);
      if (response.success) {
        loadVoucherEntries();
        loadInitialData(); // Refresh stats
      } else {
        setError('Failed to delete voucher entry');
      }
    } catch (err: any) {
      setError(err.message || 'Error deleting voucher entry');
    } finally {
      setLoading(false);
    }
  };

  const handlePostEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to post this voucher entry? This action cannot be undone.')) return;
    
    try {
      setLoading(true);
      const response = await accountingApi.postJournalEntry(entryId);
      if (response.success) {
        loadVoucherEntries();
        loadInitialData(); // Refresh stats
      } else {
        setError('Failed to post voucher entry');
      }
    } catch (err: any) {
      setError(err.message || 'Error posting voucher entry');
    } finally {
      setLoading(false);
    }
  };

  const handleReverseEntry = async (entryId: string) => {
    const reason = prompt('Please enter the reason for reversing this entry:');
    if (!reason) return;
    
    try {
      setLoading(true);
      const response = await accountingApi.reverseJournalEntry(entryId, reason);
      if (response.success) {
        loadVoucherEntries();
        loadInitialData(); // Refresh stats
      } else {
        setError('Failed to reverse voucher entry');
      }
    } catch (err: any) {
      setError(err.message || 'Error reversing voucher entry');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEntry = async (entryId: string) => {
    const reason = prompt('Please enter the reason for cancelling this entry:');
    if (!reason) return;
    
    try {
      setLoading(true);
      const response = await accountingApi.cancelJournalEntry(entryId, reason);
      if (response.success) {
        loadVoucherEntries();
        loadInitialData(); // Refresh stats
      } else {
        setError('Failed to cancel voucher entry');
      }
    } catch (err: any) {
      setError(err.message || 'Error cancelling voucher entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateEntry = async (entryId: string) => {
    try {
      setLoading(true);
      const response = await accountingApi.duplicateJournalEntry(entryId);
      if (response.success) {
        loadVoucherEntries();
      } else {
        setError('Failed to duplicate voucher entry');
      }
    } catch (err: any) {
      setError(err.message || 'Error duplicating voucher entry');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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

  const getVoucherTypeLabel = (type: string) => {
    const voucherType = voucherTypes.find(vt => vt.value === type);
    return voucherType ? voucherType.label : type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Voucher Entry</h1>
          <p className="text-gray-600 mt-1">Manage journal entries and accounting vouchers</p>
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
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Voucher
          </button>
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

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Total Entries</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.summary.totalEntries}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Total Debits</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(stats.summary.totalDebits)}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Total Credits</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(stats.summary.totalCredits)}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Average Amount</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{formatCurrency(stats.summary.averageAmount)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search vouchers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="POSTED">Posted</option>
              <option value="REVERSED">Reversed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              {voucherTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Voucher Entries Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Voucher No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
              {entries.map((entry) => (
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
                      <span className="text-sm text-gray-900">{formatDate(entry.date)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{getVoucherTypeLabel(entry.voucherType)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate" title={entry.description}>
                      {entry.description}
                    </div>
                    {entry.referenceNumber && (
                      <div className="text-xs text-gray-500">Ref: {entry.referenceNumber}</div>
                    )}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        className="text-primary-600 hover:text-primary-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {entry.status === 'DRAFT' && (
                        <>
                          <button 
                            onClick={() => {
                              setEditingEntry(entry);
                              setShowForm(true);
                            }}
                            className="text-gray-600 hover:text-gray-900"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handlePostEntry(entry._id)}
                            className="text-green-600 hover:text-green-900"
                            title="Post Entry"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteEntry(entry._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleCancelEntry(entry._id)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Cancel"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      {entry.status === 'POSTED' && entry.isReversible && (
                        <button 
                          onClick={() => handleReverseEntry(entry._id)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Reverse Entry"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button 
                        onClick={() => handleDuplicateEntry(entry._id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {entries.length === 0 && !loading && (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No voucher entries found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Voucher Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-full overflow-y-auto">
            <div className="p-6">
              <VoucherEntryForm
                initialData={editingEntry ? {
                  voucherType: editingEntry.voucherType,
                  date: editingEntry.date.split('T')[0],
                  description: editingEntry.description,
                  referenceNumber: editingEntry.referenceNumber,
                  entries: editingEntry.entries.map(entry => ({
                    account: typeof entry.account === 'string' ? entry.account : entry.account._id,
                    description: entry.description,
                    debitAmount: entry.debitAmount,
                    creditAmount: entry.creditAmount,
                    department: entry.department,
                    project: entry.project,
                    costCenter: entry.costCenter
                  })),
                  currency: editingEntry.currency,
                  exchangeRate: editingEntry.exchangeRate,
                  tags: editingEntry.tags,
                  notes: editingEntry.notes
                } : undefined}
                onSave={editingEntry 
                  ? (data) => handleUpdateEntry(editingEntry._id, data)
                  : handleCreateEntry
                }
                onCancel={() => {
                  setShowForm(false);
                  setEditingEntry(null);
                }}
                accounts={accounts}
                voucherTypes={voucherTypes}
                loading={loading}
                isEdit={!!editingEntry}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherEntry;