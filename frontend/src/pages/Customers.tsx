import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Search, Plus, Eye, Edit, Phone, Mail, MapPin, Calendar, DollarSign, ShoppingCart, User, Filter, Trash2, FileText, CreditCard } from 'lucide-react';
import { customerApi, type Customer } from '../api/customerApi';
import type { RootState } from '../store';
import RoleBasedAccess from '../components/RoleBasedAccess';
import { useRolePermissions } from '../hooks/useRolePermissions';

const Customers: React.FC = () => {
  const { isAuthenticated, user, token } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = useRolePermissions();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const customersPerPage = 10;

  // Generate suggested customer code based on latest from database
  const generateSuggestedCustomerCode = () => {
    // Find the highest customer code number from existing customers
    let maxNumber = 0;
    customers.forEach(customer => {
      const match = customer.customerCode.match(/^CUST(\d+)$/);
      if (match) {
        const number = parseInt(match[1]);
        if (number > maxNumber) {
          maxNumber = number;
        }
      }
    });
    
    // Return next number with 4-digit padding
    return `CUST${String(maxNumber + 1).padStart(4, '0')}`;
  };

  // Create Customer Form State
  const [createForm, setCreateForm] = useState({
    customerCode: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    companyName: '',
    customerType: 'individual' as const,
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    creditLimit: 0,
    paymentTerms: 'cash' as const,
    discountRate: 0,
    preferredLanguage: 'en',
    marketingOptIn: false,
    notes: '',
    tags: [] as string[],
    // NEW: Accounting integration
    accountingIntegration: {
      autoCreateAccount: true
    }
  });

  // Edit Customer Form State
  const [editForm, setEditForm] = useState({
    customerCode: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    companyName: '',
    customerType: 'individual' as 'individual' | 'business',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    creditLimit: 0,
    paymentTerms: 'cash' as 'cash' | 'net15' | 'net30' | 'net45' | 'net60',
    discountRate: 0,
    preferredLanguage: 'en',
    marketingOptIn: false,
    notes: '',
    tags: [] as string[],
    status: 'active' as 'active' | 'inactive' | 'suspended'
  });

  // Load customers
  useEffect(() => {
    loadCustomers();
  }, [currentPage, statusFilter, searchTerm]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerApi.getCustomers({
        page: currentPage,
        limit: customersPerPage,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchTerm || undefined
      });
      
      if (response.success) {
        setCustomers(response.data);
        setError(null);
      } else {
        setError('Failed to load customers');
      }
    } catch (err: any) {
      setError('Error loading customers: ' + (err.message || 'Unknown error'));
      console.error('Load customers error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      console.log('Creating customer with data:', createForm);
      const response = await customerApi.createCustomer(createForm);
      
      if (response.success) {
        setShowCreateModal(false);
        loadCustomers();
        setError(null); // Clear any previous errors
        // Reset form
        setCreateForm({
          customerCode: '',
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          alternatePhone: '',
          companyName: '',
          customerType: 'individual',
          billingAddress: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
          },
          creditLimit: 0,
          paymentTerms: 'cash',
          discountRate: 0,
          preferredLanguage: 'en',
          marketingOptIn: false,
          notes: '',
          tags: [],
          accountingIntegration: {
            autoCreateAccount: true
          }
        });
      }
    } catch (err: any) {
      console.error('Customer creation error:', err);
      let errorMessage = 'Error creating customer: ';
      
      if (err.response?.status === 401) {
        errorMessage += 'You need to log in first.';
      } else if (err.response?.status === 400) {
        errorMessage += err.response?.data?.message || 'Invalid data provided.';
        if (err.response?.data?.errors) {
          const validationErrors = err.response.data.errors.map((e: any) => e.msg).join(', ');
          errorMessage += ` Validation errors: ${validationErrors}`;
        }
      } else if (err.response?.status === 500) {
        errorMessage += 'Server error occurred.';
      } else {
        errorMessage += err.response?.data?.message || err.message || 'Unknown error';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditForm({
      customerCode: customer.customerCode,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      alternatePhone: customer.alternatePhone || '',
      companyName: customer.companyName || '',
      customerType: customer.customerType,
      billingAddress: {
        street: customer.billingAddress.street,
        city: customer.billingAddress.city,
        state: customer.billingAddress.state,
        zipCode: customer.billingAddress.zipCode,
        country: customer.billingAddress.country
      },
      creditLimit: customer.creditLimit,
      paymentTerms: customer.paymentTerms,
      discountRate: customer.discountRate,
      preferredLanguage: customer.preferredLanguage,
      marketingOptIn: customer.marketingOptIn,
      notes: customer.notes || '',
      tags: customer.tags,
      status: customer.status
    });
    setShowEditModal(true);
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    
    try {
      setLoading(true);
      console.log('Updating customer with data:', editForm);
      
      // Exclude customerCode from update data since it shouldn't be changed
      const { customerCode, ...updateData } = editForm;
      
      const response = await customerApi.updateCustomer(editingCustomer._id, updateData);
      
      if (response.success) {
        setShowEditModal(false);
        setEditingCustomer(null);
        loadCustomers();
        setError(null);
        // Reset edit form
        setEditForm({
          customerCode: '',
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          alternatePhone: '',
          companyName: '',
          customerType: 'individual' as 'individual' | 'business',
          billingAddress: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
          },
          creditLimit: 0,
          paymentTerms: 'cash' as 'cash' | 'net15' | 'net30' | 'net45' | 'net60',
          discountRate: 0,
          preferredLanguage: 'en',
          marketingOptIn: false,
          notes: '',
          tags: [],
          status: 'active' as 'active' | 'inactive' | 'suspended'
        });
      }
    } catch (err: any) {
      console.error('Customer update error:', err);
      let errorMessage = 'Error updating customer: ';
      
      if (err.response?.status === 401) {
        errorMessage += 'You need to log in first.';
      } else if (err.response?.status === 400) {
        errorMessage += err.response?.data?.message || 'Invalid data provided.';
        if (err.response?.data?.errors) {
          const validationErrors = err.response.data.errors.map((e: any) => e.msg).join(', ');
          errorMessage += ` Validation errors: ${validationErrors}`;
        }
      } else if (err.response?.status === 500) {
        errorMessage += 'Server error occurred.';
      } else {
        errorMessage += err.response?.data?.message || err.message || 'Unknown error';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    // Show confirmation dialog with more details
    const customerToDelete = customers.find(c => c._id === customerId);
    const customerName = customerToDelete 
      ? customerToDelete.fullName || `${customerToDelete.firstName} ${customerToDelete.lastName}`
      : 'this customer';
      
    if (!window.confirm(`Are you sure you want to delete ${customerName}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await customerApi.deleteCustomer(customerId);
      
      if (response.success) {
        // Reload the customer list
        await loadCustomers();
        // Show success message
        setError(`Customer deleted successfully!`);
        // Clear error message after 3 seconds
        setTimeout(() => setError(null), 3000);
      } else {
        setError(response.message || 'Failed to delete customer');
      }
    } catch (err: any) {
      console.error('Customer deletion error:', err);
      let errorMessage = 'Error deleting customer: ';
      
      if (err.response?.status === 401) {
        errorMessage += 'You need to log in first.';
      } else if (err.response?.status === 403) {
        errorMessage += 'You do not have permission to delete customers.';
      } else if (err.response?.status === 400) {
        errorMessage += err.response?.data?.message || 'Cannot delete customer with existing orders or transactions.';
      } else if (err.response?.status === 404) {
        errorMessage += 'Customer not found.';
      } else if (err.response?.status === 500) {
        errorMessage += 'Server error occurred.';
      } else {
        errorMessage += err.response?.data?.message || err.message || 'Unknown error';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const viewCustomerDetails = async (customer: Customer) => {
    try {
      const response = await customerApi.getCustomer(customer._id);
      if (response.success) {
        setSelectedCustomer(response.data);
        setShowDetailsModal(true);
      }
    } catch (err: any) {
      setError('Error loading customer details: ' + (err.message || 'Unknown error'));
    }
  };

  // NEW: Handle customer account creation
  const handleCreateCustomerAccount = async (customerId: string) => {
    try {
      const response = await customerApi.createCustomerAccount(customerId);
      if (response.success) {
        // Reload customer data to show updated account info
        loadCustomers();
        if (selectedCustomer && selectedCustomer._id === customerId) {
          viewCustomerDetails(selectedCustomer);
        }
        alert('Customer account created successfully!');
      }
    } catch (err: any) {
      setError('Error creating customer account: ' + (err.message || 'Unknown error'));
    }
  };

  // Filter customers based on search and filters
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.customerCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);
  const startIndex = (currentPage - 1) * customersPerPage;
  const currentCustomers = filteredCustomers.slice(startIndex, startIndex + customersPerPage);

  // Statistics
  const stats = {
    totalCustomers: customers.length,
    activeCustomers: customers.filter(c => c.status === 'active').length,
    inactiveCustomers: customers.filter(c => c.status === 'inactive').length,
    suspendedCustomers: customers.filter(c => c.status === 'suspended').length,
    totalRevenue: customers.reduce((sum, customer) => sum + customer.totalSpent, 0),
    averageOrderValue: customers.length > 0 ? 
      customers.reduce((sum, customer) => sum + customer.totalSpent, 0) / 
      Math.max(customers.reduce((sum, customer) => sum + customer.totalOrders, 0), 1) : 0
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; bgColor: string }> = {
      active: { color: 'text-green-800', bgColor: 'bg-green-100' },
      inactive: { color: 'text-gray-800', bgColor: 'bg-gray-100' },
      suspended: { color: 'text-red-800', bgColor: 'bg-red-100' }
    };
    return configs[status] || { color: 'text-gray-800', bgColor: 'bg-gray-100' };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Show authentication warning if not logged in
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Authentication Required</h3>
              <div className="mt-2 text-sm text-yellow-700">
                You need to log in to access customer management. <a href="/login" className="underline">Go to login page</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600 mt-1">Manage customer relationships and information</p>
          {/* Debug info */}
          <div className="text-xs text-gray-500 mt-1">
            Auth: {isAuthenticated ? '✅ Logged in' : '❌ Not logged in'} | User: {user?.username || 'None'} | Token: {token ? '✅' : '❌'}
          </div>
        </div>
        <RoleBasedAccess module="customers" action="create">
          <button 
            onClick={() => setShowCreateModal(true)}
            disabled={!isAuthenticated}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </button>
        </RoleBasedAccess>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalCustomers}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Customers</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.activeCustomers}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <User className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{formatCurrency(stats.averageOrderValue)}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Display */}
      {customers.length === 0 && !loading ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
          <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Customers Found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'No customers match your current filters.' 
              : 'Start by adding your first customer.'}
          </p>
          <RoleBasedAccess module="customers" action="create">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </button>
          </RoleBasedAccess>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => {
                  const statusConfig = getStatusConfig(customer.status);
                  return (
                    <tr key={customer._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {customer.fullName || `${customer.firstName} ${customer.lastName}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {customer.customerCode}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-900">
                            <Mail className="w-4 h-4 text-gray-400 mr-2" />
                            {customer.email}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Phone className="w-4 h-4 text-gray-400 mr-2" />
                            {customer.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div>{customer.billingAddress.city || 'N/A'}, {customer.billingAddress.state || 'N/A'}</div>
                            <div className="text-xs text-gray-500">{customer.billingAddress.country || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <ShoppingCart className="w-4 h-4 text-gray-400 mr-2" />
                          {customer.totalOrders}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(customer.totalSpent)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          {customer.lastOrderDate ? formatDate(customer.lastOrderDate) : 'Never'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <RoleBasedAccess module="customers" action="read">
                            <button 
                              onClick={() => viewCustomerDetails(customer)}
                              className="text-primary-600 hover:text-primary-900"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </RoleBasedAccess>
                          <RoleBasedAccess module="customers" action="update">
                            <button 
                              onClick={() => handleEditCustomer(customer)}
                              className="text-gray-600 hover:text-gray-900"
                              title="Edit Customer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </RoleBasedAccess>
                          <RoleBasedAccess module="customers" action="delete">
                            <button 
                              onClick={() => handleDeleteCustomer(customer._id)}
                              disabled={loading}
                              className={`text-red-600 hover:text-red-900 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title="Delete Customer"
                            >
                              {loading ? (
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </RoleBasedAccess>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Customer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowCreateModal(false)}></div>
            <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Customer</h3>
              
              <form onSubmit={handleCreateCustomer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Code
                    <span className="text-xs text-gray-500 ml-1">(Optional - auto-generated if empty)</span>
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={createForm.customerCode}
                      onChange={(e) => setCreateForm({ ...createForm, customerCode: e.target.value.toUpperCase() })}
                      placeholder="e.g., CUST0001 (auto-generated if left empty)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, customerCode: generateSuggestedCustomerCode() })}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                    >
                      Suggest
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={createForm.firstName}
                      onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={createForm.lastName}
                      onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={createForm.billingAddress.street}
                    onChange={(e) => setCreateForm({
                      ...createForm,
                      billingAddress: { ...createForm.billingAddress, street: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={createForm.billingAddress.city}
                      onChange={(e) => setCreateForm({
                        ...createForm,
                        billingAddress: { ...createForm.billingAddress, city: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={createForm.billingAddress.state}
                      onChange={(e) => setCreateForm({
                        ...createForm,
                        billingAddress: { ...createForm.billingAddress, state: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code *</label>
                    <input
                      type="text"
                      required
                      value={createForm.billingAddress.zipCode}
                      onChange={(e) => setCreateForm({
                        ...createForm,
                        billingAddress: { ...createForm.billingAddress, zipCode: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                    <input
                      type="text"
                      required
                      value={createForm.billingAddress.country}
                      onChange={(e) => setCreateForm({
                        ...createForm,
                        billingAddress: { ...createForm.billingAddress, country: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={createForm.notes}
                    onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* NEW: Accounting Integration Option */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Accounting Integration</h4>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="autoCreateAccount"
                      checked={createForm.accountingIntegration.autoCreateAccount}
                      onChange={(e) => setCreateForm({
                        ...createForm,
                        accountingIntegration: {
                          ...createForm.accountingIntegration,
                          autoCreateAccount: e.target.checked
                        }
                      })}
                      className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="autoCreateAccount" className="ml-2 block text-sm text-gray-700">
                      Automatically create Chart of Accounts entry for this customer
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Customer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && editingCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowEditModal(false)}></div>
            <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Customer - {editingCustomer.customerCode}</h3>
              
              <form onSubmit={handleUpdateCustomer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Code
                    <span className="text-xs text-gray-500 ml-1">(Read-only)</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.customerCode}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Type</label>
                    <select
                      value={editForm.customerType}
                      onChange={(e) => setEditForm({ ...editForm, customerType: e.target.value as 'individual' | 'business' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="individual">Individual</option>
                      <option value="business">Business</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'active' | 'inactive' | 'suspended' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={editForm.billingAddress.street}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      billingAddress: { ...editForm.billingAddress, street: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={editForm.billingAddress.city}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        billingAddress: { ...editForm.billingAddress, city: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={editForm.billingAddress.state}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        billingAddress: { ...editForm.billingAddress, state: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code *</label>
                    <input
                      type="text"
                      required
                      value={editForm.billingAddress.zipCode}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        billingAddress: { ...editForm.billingAddress, zipCode: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                    <input
                      type="text"
                      required
                      value={editForm.billingAddress.country}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        billingAddress: { ...editForm.billingAddress, country: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.creditLimit}
                      onChange={(e) => setEditForm({ ...editForm, creditLimit: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                    <select
                      value={editForm.paymentTerms}
                      onChange={(e) => setEditForm({ ...editForm, paymentTerms: e.target.value as 'cash' | 'net15' | 'net30' | 'net45' | 'net60' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="cash">Cash</option>
                      <option value="net15">Net 15</option>
                      <option value="net30">Net 30</option>
                      <option value="net45">Net 45</option>
                      <option value="net60">Net 60</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Customer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {showDetailsModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowDetailsModal(false)}></div>
            <div className="relative bg-white rounded-lg max-w-4xl w-full p-6 max-h-screen overflow-y-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {selectedCustomer.fullName || `${selectedCustomer.firstName} ${selectedCustomer.lastName}`} - Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Customer Code:</span> {selectedCustomer.customerCode}</div>
                    <div><span className="font-medium">Email:</span> {selectedCustomer.email}</div>
                    <div><span className="font-medium">Phone:</span> {selectedCustomer.phone}</div>
                    <div><span className="font-medium">Status:</span> {selectedCustomer.status}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Address</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Street:</span> {selectedCustomer.billingAddress.street || 'N/A'}</div>
                    <div><span className="font-medium">City:</span> {selectedCustomer.billingAddress.city || 'N/A'}</div>
                    <div><span className="font-medium">State:</span> {selectedCustomer.billingAddress.state || 'N/A'}</div>
                    <div><span className="font-medium">Zip Code:</span> {selectedCustomer.billingAddress.zipCode || 'N/A'}</div>
                    <div><span className="font-medium">Country:</span> {selectedCustomer.billingAddress.country || 'N/A'}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Order Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Total Orders:</span> {selectedCustomer.totalOrders}</div>
                    <div><span className="font-medium">Total Spent:</span> {formatCurrency(selectedCustomer.totalSpent)}</div>
                    <div><span className="font-medium">Last Order:</span> {selectedCustomer.lastOrderDate ? formatDate(selectedCustomer.lastOrderDate) : 'Never'}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Account Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Credit Limit:</span> {formatCurrency(selectedCustomer.creditLimit)}</div>
                    <div><span className="font-medium">Payment Terms:</span> {selectedCustomer.paymentTerms}</div>
                    <div><span className="font-medium">Discount Rate:</span> {selectedCustomer.discountRate}%</div>
                  </div>
                </div>

                {/* NEW: Accounting Information */}
                <div className="md:col-span-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-900 mb-2">Accounting Information</h4>
                    <RoleBasedAccess module="accounting" action="update">
                      {!selectedCustomer.accountingIntegration?.accountsReceivableId && (
                        <button
                          onClick={() => handleCreateCustomerAccount(selectedCustomer._id)}
                          className="text-sm px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700"
                        >
                          Create Account
                        </button>
                      )}
                    </RoleBasedAccess>
                  </div>
                  <div className="space-y-2 text-sm">
                    {selectedCustomer.accountingIntegration?.accountsReceivableId ? (
                      <>
                        <div><span className="font-medium">Account Code:</span> {selectedCustomer.accountingIntegration.accountCode}</div>
                        <div><span className="font-medium">Account Status:</span> <span className="text-green-600">Linked</span></div>
                        <RoleBasedAccess module="accounting" action="read">
                          <button 
                            onClick={() => {
                              // TODO: Navigate to accounting details page
                              alert('Accounting details would open here');
                            }}
                            className="text-primary-600 hover:text-primary-800 flex items-center"
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            View Account Details
                          </button>
                        </RoleBasedAccess>
                      </>
                    ) : (
                      <>
                        <div><span className="font-medium">Account Status:</span> <span className="text-yellow-600">Not Linked</span></div>
                        <div className="text-gray-500 text-xs">No Chart of Accounts entry has been created for this customer.</div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;