import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Mail, 
  Phone, 
  MapPin,
  Star,
  Package,
  Calendar,
  ExternalLink,
  MoreVertical,
  AlertCircle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import RoleBasedAccess from '../components/RoleBasedAccess';
import { useRolePermissions } from '../hooks/useRolePermissions';
import { supplierApi, type Supplier, type CreateSupplierRequest } from '../api/supplierApi';

const Suppliers: React.FC = () => {
  const { hasPermission } = useRolePermissions();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [formData, setFormData] = useState<CreateSupplierRequest>({
    supplierCode: '',
    companyName: '',
    contactPerson: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    },
    address: {
      street: '',
      city: '',
      country: 'China'
    },
    businessDetails: {
      businessType: 'manufacturer'
    }
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const suppliersPerPage = 10;

  // Generate suggested supplier code based on latest from database
  const generateSuggestedSupplierCode = () => {
    // Find the highest supplier code number from existing suppliers
    let maxNumber = 0;
    suppliers.forEach(supplier => {
      const match = supplier.supplierCode.match(/^SUP(\d+)$/);
      if (match) {
        const number = parseInt(match[1]);
        if (number > maxNumber) {
          maxNumber = number;
        }
      }
    });
    
    // Return next number with 6-digit padding (matching backend format)
    return `SUP${String(maxNumber + 1).padStart(6, '0')}`;
  };

  useEffect(() => {
    loadSuppliers();
  }, [currentPage, statusFilter, businessTypeFilter, searchTerm]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await supplierApi.getSuppliers({
        page: currentPage,
        limit: suppliersPerPage,
        status: statusFilter === 'all' ? undefined : statusFilter,
        businessType: businessTypeFilter === 'all' ? undefined : businessTypeFilter,
        search: searchTerm || undefined
      });
      
      if (response.success && response.data) {
        setSuppliers(response.data);
      } else {
        setError('Failed to load suppliers');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load suppliers');
      console.error('Load suppliers error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-3 h-3" />;
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'suspended': return <AlertCircle className="w-3 h-3" />;
      default: return <X className="w-3 h-3" />;
    }
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

  const handleViewDetails = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowDetailsModal(true);
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    
    try {
      const response = await supplierApi.deleteSupplier(supplierId);
      if (response.success) {
        await loadSuppliers();
      } else {
        setError('Failed to delete supplier');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete supplier');
    }
  };

  const resetForm = () => {
    setFormData({
      supplierCode: '',
      companyName: '',
      contactPerson: {
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
      },
      address: {
        street: '',
        city: '',
        country: 'China'
      },
      businessDetails: {
        businessType: 'manufacturer'
      }
    });
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError(null);

    try {
      const response = await supplierApi.createSupplier(formData);
      if (response.success) {
        setShowCreateModal(false);
        resetForm();
        await loadSuppliers();
      } else {
        setError('Failed to create supplier');
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('You are not authorized to create suppliers');
      } else if (err.response?.status === 400) {
        const errorMessage = err.response?.data?.message || 'Validation failed';
        setError(errorMessage);
      } else {
        setError(err.message || 'Failed to create supplier');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setFormData({
      supplierCode: supplier.supplierCode,
      companyName: supplier.companyName,
      contactPerson: {
        firstName: supplier.contactPerson.firstName,
        lastName: supplier.contactPerson.lastName,
        email: supplier.contactPerson.email,
        phone: supplier.contactPerson.phone
      },
      address: {
        street: supplier.address.street,
        city: supplier.address.city,
        country: supplier.address.country
      },
      businessDetails: {
        businessType: supplier.businessDetails.businessType
      }
    });
    setSelectedSupplier(supplier);
    setShowEditModal(true);
  };

  const handleUpdateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    
    setSubmitLoading(true);
    setError(null);

    try {
      const response = await supplierApi.updateSupplier(selectedSupplier._id, formData);
      if (response.success) {
        setShowEditModal(false);
        setSelectedSupplier(null);
        resetForm();
        await loadSuppliers();
      } else {
        setError('Failed to update supplier');
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('You are not authorized to update suppliers');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to update suppliers. Please contact your administrator.');
      } else if (err.response?.status === 400) {
        const errorMessage = err.response?.data?.message || 'Validation failed';
        setError(errorMessage);
      } else {
        setError(err.message || 'Failed to update supplier');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const keys = name.split('.');
    
    if (keys.length === 1) {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value
      }) as CreateSupplierRequest);
    } else if (keys.length === 2) {
      setFormData(prev => ({
        ...prev,
        [keys[0]]: {
          ...(prev as any)[keys[0]],
          [keys[1]]: type === 'number' ? (value === '' ? 0 : Number(value)) : value
        }
      }) as CreateSupplierRequest);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = searchTerm === '' || 
      supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.supplierCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactFullName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter;
    const matchesBusinessType = businessTypeFilter === 'all' || supplier.businessDetails.businessType === businessTypeFilter;
    
    return matchesSearch && matchesStatus && matchesBusinessType;
  });

  return (
    <RoleBasedAccess 
      module="suppliers" 
      action="read"
      fallback={
        <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
          <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600 mb-4">
            You don't have permission to access supplier management.
          </p>
          <p className="text-sm text-gray-500">
            Please contact your administrator if you need access to this section.
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Building2 className="w-6 h-6 mr-2" />
              Supplier Management
            </h1>
            <p className="text-gray-600 mt-1">Manage your suppliers and vendor relationships</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <RoleBasedAccess module="suppliers" action="create">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Supplier
              </button>
            </RoleBasedAccess>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
              <select
                value={businessTypeFilter}
                onChange={(e) => setBusinessTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="manufacturer">Manufacturer</option>
                <option value="distributor">Distributor</option>
                <option value="wholesaler">Wholesaler</option>
                <option value="retailer">Retailer</option>
                <option value="trader">Trader</option>
                <option value="agent">Agent</option>
                <option value="service_provider">Service Provider</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={loadSuppliers}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Filter className="w-4 h-4 mr-2 inline" />
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Suppliers Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Value
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Loading suppliers...</p>
                    </td>
                  </tr>
                ) : filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No suppliers found</p>
                      <p className="text-gray-400">Try adjusting your search or filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <tr key={supplier._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-primary-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {supplier.companyName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {supplier.supplierCode}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{supplier.contactFullName}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {supplier.contactPerson.email}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">
                          {supplier.businessDetails.businessType.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-gray-500">
                          Est. {supplier.businessDetails.establishedYear || 'N/A'}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(supplier.status)}`}>
                          {getStatusIcon(supplier.status)}
                          <span className="ml-1 capitalize">{supplier.status}</span>
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        <div className="font-medium">
                          {formatCurrency(supplier.totalValue || 0)}
                        </div>
                        <div className="text-gray-500">
                          {supplier.totalOrders || 0} orders
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewDetails(supplier)}
                            className="text-gray-400 hover:text-gray-600"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <RoleBasedAccess module="suppliers" action="update">
                            <button
                              onClick={() => handleEditSupplier(supplier)}
                              className="text-gray-400 hover:text-primary-600"
                              title="Edit Supplier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </RoleBasedAccess>
                          
                          <RoleBasedAccess module="suppliers" action="delete">
                            <button
                              onClick={() => handleDeleteSupplier(supplier._id)}
                              className="text-gray-400 hover:text-red-600"
                              title="Delete Supplier"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </RoleBasedAccess>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Supplier Details Modal */}
        {showDetailsModal && selectedSupplier && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Supplier Details: {selectedSupplier.companyName}
                  </h3>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Company Information</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-500">Company Name:</span>
                        <p className="font-medium">{selectedSupplier.companyName}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Supplier Code:</span>
                        <p className="font-medium">{selectedSupplier.supplierCode}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Business Type:</span>
                        <p className="font-medium capitalize">
                          {selectedSupplier.businessDetails.businessType.replace('_', ' ')}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Year Established:</span>
                        <p className="font-medium">{selectedSupplier.businessDetails.establishedYear}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-500">Contact Person:</span>
                        <p className="font-medium">{selectedSupplier.contactFullName}</p>
                        <p className="text-sm text-gray-600">{selectedSupplier.contactPerson.title}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Email:</span>
                        <p className="font-medium">{selectedSupplier.contactPerson.email}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Phone:</span>
                        <p className="font-medium">{selectedSupplier.contactPerson.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Address</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm">
                      {selectedSupplier.address.street}<br />
                      {selectedSupplier.address.city}, {selectedSupplier.address.state} {selectedSupplier.address.zipCode}<br />
                      {selectedSupplier.address.country}
                    </p>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Performance Metrics</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-primary-600">
                        {formatCurrency(selectedSupplier.totalValue || 0)}
                      </p>
                      <p className="text-sm text-gray-600">Total Purchase Value</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-primary-600">
                        {selectedSupplier.totalOrders || 0}
                      </p>
                      <p className="text-sm text-gray-600">Total Orders</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="flex items-center justify-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < (selectedSupplier.rating?.overall || 0)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Supplier Rating</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <RoleBasedAccess module="suppliers" action="update">
                  <button 
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleEditSupplier(selectedSupplier);
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Edit Supplier
                  </button>
                </RoleBasedAccess>
              </div>
            </div>
          </div>
        )}

        {/* Create Supplier Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Create New Supplier</h3>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                      setError(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateSupplier} className="p-6 space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                      <p className="text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                {/* Company Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Supplier Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Supplier Code
                        <span className="text-xs text-gray-500 ml-1">(Optional - auto-generated if empty)</span>
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          name="supplierCode"
                          value={formData.supplierCode}
                          onChange={handleInputChange}
                          placeholder="e.g., SUP000001 (auto-generated if left empty)"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, supplierCode: generateSuggestedSupplierCode() })}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                        >
                          Suggest
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Business Type *</label>
                      <select
                        name="businessDetails.businessType"
                        value={formData.businessDetails.businessType}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="manufacturer">Manufacturer</option>
                        <option value="distributor">Distributor</option>
                        <option value="wholesaler">Wholesaler</option>
                        <option value="retailer">Retailer</option>
                        <option value="trader">Trader</option>
                        <option value="agent">Agent</option>
                        <option value="service_provider">Service Provider</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        name="contactPerson.firstName"
                        value={formData.contactPerson.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                        name="contactPerson.lastName"
                        value={formData.contactPerson.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        name="contactPerson.email"
                        value={formData.contactPerson.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                      <input
                        type="tel"
                        name="contactPerson.phone"
                        value={formData.contactPerson.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                      <input
                        type="text"
                        name="address.street"
                        value={formData.address.street}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                      <input
                        type="text"
                        name="address.city"
                        value={formData.address.city}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                      <input
                        type="text"
                        name="address.country"
                        value={formData.address.country}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                      setError(null);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {submitLoading ? 'Creating...' : 'Create Supplier'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Supplier Modal */}
        {showEditModal && selectedSupplier && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Edit Supplier: {selectedSupplier.companyName}
                  </h3>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedSupplier(null);
                      resetForm();
                      setError(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleUpdateSupplier} className="p-6 space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                      <p className="text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                {/* Company Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Supplier Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Supplier Code
                        <span className="text-xs text-gray-500 ml-1">(Read-only)</span>
                      </label>
                      <input
                        type="text"
                        name="supplierCode"
                        value={formData.supplierCode}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Business Type *</label>
                      <select
                        name="businessDetails.businessType"
                        value={formData.businessDetails.businessType}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="manufacturer">Manufacturer</option>
                        <option value="distributor">Distributor</option>
                        <option value="wholesaler">Wholesaler</option>
                        <option value="retailer">Retailer</option>
                        <option value="trader">Trader</option>
                        <option value="agent">Agent</option>
                        <option value="service_provider">Service Provider</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        name="contactPerson.firstName"
                        value={formData.contactPerson.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                        name="contactPerson.lastName"
                        value={formData.contactPerson.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        name="contactPerson.email"
                        value={formData.contactPerson.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                      <input
                        type="tel"
                        name="contactPerson.phone"
                        value={formData.contactPerson.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                      <input
                        type="text"
                        name="address.street"
                        value={formData.address.street}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                      <input
                        type="text"
                        name="address.city"
                        value={formData.address.city}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                      <input
                        type="text"
                        name="address.country"
                        value={formData.address.country}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedSupplier(null);
                      resetForm();
                      setError(null);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {submitLoading ? 'Updating...' : 'Update Supplier'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleBasedAccess>
  );
};

export default Suppliers;