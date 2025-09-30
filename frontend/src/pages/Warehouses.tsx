import React, { useState, useEffect } from 'react';
import { 
  Warehouse, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  MapPin,
  Users,
  Package,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Building
} from 'lucide-react';
import RoleBasedAccess from '../components/RoleBasedAccess';
import { useRolePermissions } from '../hooks/useRolePermissions';
import { warehouseApi, type Warehouse as WarehouseType, type CreateWarehouseRequest } from '../api/warehouseApi';

const Warehouses: React.FC = () => {
  const { hasPermission } = useRolePermissions();
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseType | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [formData, setFormData] = useState<CreateWarehouseRequest>({
    name: '',
    type: 'main',
    location: {
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'China'
      }
    },
    contact: {
      managerName: '',
      phone: '',
      email: ''
    }
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const warehousesPerPage = 10;

  useEffect(() => {
    loadWarehouses();
  }, [currentPage, statusFilter, typeFilter, searchTerm]);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await warehouseApi.getWarehouses({
        page: currentPage,
        limit: warehousesPerPage,
        status: statusFilter === 'all' ? undefined : statusFilter,
        type: typeFilter === 'all' ? undefined : typeFilter,
        search: searchTerm || undefined
      });
      
      if (response.success && response.data) {
        setWarehouses(response.data);
      } else {
        setError('Failed to load warehouses');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load warehouses');
      console.error('Load warehouses error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      full: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-3 h-3" />;
      case 'maintenance': return <Clock className="w-3 h-3" />;
      case 'full': return <AlertCircle className="w-3 h-3" />;
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

  const handleViewDetails = (warehouse: WarehouseType) => {
    setSelectedWarehouse(warehouse);
    setShowDetailsModal(true);
  };

  const handleDeleteWarehouse = async (warehouseId: string) => {
    if (!confirm('Are you sure you want to delete this warehouse?')) return;
    
    try {
      const response = await warehouseApi.deleteWarehouse(warehouseId);
      if (response.success) {
        await loadWarehouses();
      } else {
        setError('Failed to delete warehouse');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete warehouse');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'main',
      location: {
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'China'
        }
      },
      contact: {
        managerName: '',
        phone: '',
        email: ''
      }
    });
  };

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError(null);

    try {
      const response = await warehouseApi.createWarehouse(formData);
      if (response.success) {
        setShowCreateModal(false);
        resetForm();
        await loadWarehouses();
      } else {
        setError('Failed to create warehouse');
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('You are not authorized to create warehouses');
      } else if (err.response?.status === 400) {
        const errorMessage = err.response?.data?.message || 'Validation failed';
        setError(errorMessage);
      } else {
        setError(err.message || 'Failed to create warehouse');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditWarehouse = (warehouse: WarehouseType) => {
    setFormData({
      name: warehouse.name,
      type: warehouse.type,
      location: {
        address: {
          street: warehouse.location?.address?.street || '',
          city: warehouse.location?.address?.city || '',
          state: warehouse.location?.address?.state || '',
          zipCode: warehouse.location?.address?.zipCode || '',
          country: warehouse.location?.address?.country || 'China'
        }
      },
      contact: {
        managerName: warehouse.contact?.managerName || '',
        phone: warehouse.contact?.phone || '',
        email: warehouse.contact?.email || ''
      }
    });
    setSelectedWarehouse(warehouse);
    setShowEditModal(true);
  };

  const handleUpdateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouse) return;
    
    setSubmitLoading(true);
    setError(null);

    try {
      const response = await warehouseApi.updateWarehouse(selectedWarehouse._id, formData);
      if (response.success) {
        setShowEditModal(false);
        setSelectedWarehouse(null);
        resetForm();
        await loadWarehouses();
      } else {
        setError('Failed to update warehouse');
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('You are not authorized to update warehouses');
      } else if (err.response?.status === 400) {
        const errorMessage = err.response?.data?.message || 'Validation failed';
        setError(errorMessage);
      } else {
        setError(err.message || 'Failed to update warehouse');
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
      }) as CreateWarehouseRequest);
    } else {
      // Handle nested properties
      setFormData(prev => {
        const newData = { ...prev } as any;
        let current = newData;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = type === 'number' ? (value === '' ? 0 : Number(value)) : value;
        
        return newData;
      });
    }
  };

  const filteredWarehouses = warehouses.filter(warehouse => {
    const matchesSearch = searchTerm === '' || 
      warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.warehouseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (warehouse.contact?.managerName && warehouse.contact.managerName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || warehouse.status === statusFilter;
    const matchesType = typeFilter === 'all' || warehouse.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <RoleBasedAccess 
      module="warehouses" 
      action="read"
      fallback={
        <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
          <Warehouse className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600 mb-4">
            You don't have permission to access warehouse management.
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
              <Warehouse className="w-6 h-6 mr-2" />
              Warehouse Management
            </h1>
            <p className="text-gray-600 mt-1">Manage your warehouse locations and facilities</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <RoleBasedAccess module="warehouses" action="create">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Warehouse
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
                  placeholder="Search warehouses..."
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
                <option value="maintenance">Maintenance</option>
                <option value="full">Full</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="main">Main</option>
                <option value="china">China</option>
                <option value="regional">Regional</option>
                <option value="transit">Transit</option>
                <option value="virtual">Virtual</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={loadWarehouses}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Filter className="w-4 h-4 mr-2 inline" />
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Warehouses Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warehouse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilization
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
                      <p className="text-gray-500 mt-2">Loading warehouses...</p>
                    </td>
                  </tr>
                ) : filteredWarehouses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Warehouse className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No warehouses found</p>
                      <p className="text-gray-400">Try adjusting your search or filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredWarehouses.map((warehouse) => (
                    <tr key={warehouse._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                              <Warehouse className="h-5 w-5 text-primary-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {warehouse.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {warehouse.warehouseCode}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {warehouse.location?.address?.city || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {warehouse.location?.address?.country || 'N/A'}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">
                          {warehouse.type}
                        </div>
                        <div className="text-sm text-gray-500">
                          {warehouse.contact?.managerName || 'No manager'}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(warehouse.status)}`}>
                          {getStatusIcon(warehouse.status)}
                          <span className="ml-1 capitalize">{warehouse.status}</span>
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        <div className="font-medium">
                          {warehouse.utilizationPercentage || 0}%
                        </div>
                        <div className="text-gray-500">
                          Utilization
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewDetails(warehouse)}
                            className="text-gray-400 hover:text-gray-600"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <RoleBasedAccess module="warehouses" action="update">
                            <button
                              onClick={() => handleEditWarehouse(warehouse)}
                              className="text-gray-400 hover:text-primary-600"
                              title="Edit Warehouse"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </RoleBasedAccess>
                          
                          <RoleBasedAccess module="warehouses" action="delete">
                            <button
                              onClick={() => handleDeleteWarehouse(warehouse._id)}
                              className="text-gray-400 hover:text-red-600"
                              title="Delete Warehouse"
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

        {/* Warehouse Details Modal */}
        {showDetailsModal && selectedWarehouse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Warehouse Details: {selectedWarehouse.name}
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
                    <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-500">Warehouse Name:</span>
                        <p className="font-medium">{selectedWarehouse.name}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Warehouse Code:</span>
                        <p className="font-medium">{selectedWarehouse.warehouseCode}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Type:</span>
                        <p className="font-medium capitalize">{selectedWarehouse.type}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Status:</span>
                        <p className="font-medium capitalize">{selectedWarehouse.status}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-500">Manager:</span>
                        <p className="font-medium">{selectedWarehouse.contact?.managerName || 'Not assigned'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Phone:</span>
                        <p className="font-medium">{selectedWarehouse.contact?.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Email:</span>
                        <p className="font-medium">{selectedWarehouse.contact?.email || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Address</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm">
                      {selectedWarehouse.location?.address?.street || 'N/A'}<br />
                      {selectedWarehouse.location?.address?.city}, {selectedWarehouse.location?.address?.state} {selectedWarehouse.location?.address?.zipCode}<br />
                      {selectedWarehouse.location?.address?.country}
                    </p>
                  </div>
                </div>

                {/* Capacity Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Capacity Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-primary-600">
                        {selectedWarehouse.capacity?.totalArea?.value || 0}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedWarehouse.capacity?.totalArea?.unit || 'sqm'} - Total Area
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-primary-600">
                        {selectedWarehouse.capacity?.storageVolume?.value || 0}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedWarehouse.capacity?.storageVolume?.unit || 'cbm'} - Storage Volume
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-primary-600">
                        {selectedWarehouse.capacity?.maxWeight?.value || 0}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedWarehouse.capacity?.maxWeight?.unit || 'kg'} - Max Weight
                      </p>
                    </div>
                  </div>
                </div>

                {/* Facilities */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Facilities</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedWarehouse.facilities?.hasClimateControl}
                        readOnly
                        className="h-4 w-4 text-primary-600 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Climate Control</span>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedWarehouse.facilities?.hasSecurity}
                        readOnly
                        className="h-4 w-4 text-primary-600 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Security</span>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedWarehouse.facilities?.hasFireSafety}
                        readOnly
                        className="h-4 w-4 text-primary-600 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Fire Safety</span>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedWarehouse.facilities?.hasCCTV}
                        readOnly
                        className="h-4 w-4 text-primary-600 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">CCTV</span>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedWarehouse.facilities?.hasLoadingDock}
                        readOnly
                        className="h-4 w-4 text-primary-600 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Loading Dock</span>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedWarehouse.facilities?.hasForklift}
                        readOnly
                        className="h-4 w-4 text-primary-600 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Forklift</span>
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
                <RoleBasedAccess module="warehouses" action="update">
                  <button 
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleEditWarehouse(selectedWarehouse);
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Edit Warehouse
                  </button>
                </RoleBasedAccess>
              </div>
            </div>
          </div>
        )}

        {/* Create Warehouse Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Create New Warehouse</h3>
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

              <form onSubmit={handleCreateWarehouse} className="p-6 space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                      <p className="text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                {/* Basic Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="main">Main</option>
                        <option value="china">China</option>
                        <option value="regional">Regional</option>
                        <option value="transit">Transit</option>
                        <option value="virtual">Virtual</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Manager Name</label>
                      <input
                        type="text"
                        name="contact.managerName"
                        value={formData.contact?.managerName || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        name="contact.phone"
                        value={formData.contact?.phone || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        name="contact.email"
                        value={formData.contact?.email || ''}
                        onChange={handleInputChange}
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                      <input
                        type="text"
                        name="location.address.street"
                        value={formData.location?.address?.street || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                      <input
                        type="text"
                        name="location.address.city"
                        value={formData.location?.address?.city || ''}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                      <input
                        type="text"
                        name="location.address.country"
                        value={formData.location?.address?.country || ''}
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
                    {submitLoading ? 'Creating...' : 'Create Warehouse'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Warehouse Modal */}
        {showEditModal && selectedWarehouse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Edit Warehouse: {selectedWarehouse.name}
                  </h3>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedWarehouse(null);
                      resetForm();
                      setError(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleUpdateWarehouse} className="p-6 space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                      <p className="text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                {/* Basic Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="main">Main</option>
                        <option value="china">China</option>
                        <option value="regional">Regional</option>
                        <option value="transit">Transit</option>
                        <option value="virtual">Virtual</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Manager Name</label>
                      <input
                        type="text"
                        name="contact.managerName"
                        value={formData.contact?.managerName || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        name="contact.phone"
                        value={formData.contact?.phone || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        name="contact.email"
                        value={formData.contact?.email || ''}
                        onChange={handleInputChange}
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                      <input
                        type="text"
                        name="location.address.street"
                        value={formData.location?.address?.street || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                      <input
                        type="text"
                        name="location.address.city"
                        value={formData.location?.address?.city || ''}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                      <input
                        type="text"
                        name="location.address.country"
                        value={formData.location?.address?.country || ''}
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
                      setSelectedWarehouse(null);
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
                    {submitLoading ? 'Updating...' : 'Update Warehouse'}
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

export default Warehouses;