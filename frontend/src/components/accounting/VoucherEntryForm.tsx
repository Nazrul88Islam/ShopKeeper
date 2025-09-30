import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle, 
  AlertCircle, 
  Calculator,
  Calendar,
  Hash,
  FileText,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { accountingApi, type CreateJournalEntryRequest, type Account, type VoucherType, type BalanceValidation } from '../../api/accountingApi';

interface VoucherEntryLine {
  account: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
  department?: string;
  project?: string;
  costCenter?: string;
}

interface VoucherEntryFormProps {
  initialData?: CreateJournalEntryRequest;
  onSave: (data: CreateJournalEntryRequest) => void;
  onCancel: () => void;
  accounts: Account[];
  voucherTypes: VoucherType[];
  loading?: boolean;
  isEdit?: boolean;
}

const VoucherEntryForm: React.FC<VoucherEntryFormProps> = ({
  initialData,
  onSave,
  onCancel,
  accounts,
  voucherTypes,
  loading = false,
  isEdit = false
}) => {
  const [formData, setFormData] = useState<CreateJournalEntryRequest>({
    voucherType: 'JOURNAL',
    date: new Date().toISOString().split('T')[0],
    description: '',
    referenceNumber: '',
    entries: [
      { account: '', description: '', debitAmount: 0, creditAmount: 0 },
      { account: '', description: '', debitAmount: 0, creditAmount: 0 }
    ],
    currency: 'BDT',
    exchangeRate: 1,
    tags: [],
    notes: ''
  });

  const [nextVoucherNumber, setNextVoucherNumber] = useState<string>('');
  const [validation, setValidation] = useState<BalanceValidation | null>(null);
  const [validating, setValidating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with data
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Get next voucher number when voucher type or date changes
  useEffect(() => {
    const getNextVoucherNumber = async () => {
      try {
        const response = await accountingApi.getNextVoucherNumber(formData.voucherType, formData.date);
        if (response.success) {
          setNextVoucherNumber(response.data.nextVoucherNumber);
        }
      } catch (error) {
        console.error('Error fetching next voucher number:', error);
      }
    };

    if (!isEdit) {
      getNextVoucherNumber();
    }
  }, [formData.voucherType, formData.date, isEdit]);

  // Real-time balance validation
  useEffect(() => {
    const validateBalance = async () => {
      if (formData.entries.length >= 2) {
        setValidating(true);
        try {
          const response = await accountingApi.validateBalance(formData.entries);
          if (response.success) {
            setValidation(response.data);
          }
        } catch (error) {
          console.error('Balance validation error:', error);
        } finally {
          setValidating(false);
        }
      }
    };

    const debounceTimer = setTimeout(validateBalance, 500);
    return () => clearTimeout(debounceTimer);
  }, [formData.entries]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalDebits = formData.entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
    const totalCredits = formData.entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
    const difference = totalDebits - totalCredits;
    const isBalanced = Math.abs(difference) < 0.01;
    
    return { totalDebits, totalCredits, difference, isBalanced };
  }, [formData.entries]);

  const handleInputChange = (field: keyof CreateJournalEntryRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleEntryChange = (index: number, field: keyof VoucherEntryLine, value: any) => {
    const newEntries = [...formData.entries];
    newEntries[index] = { ...newEntries[index], [field]: value };

    setFormData(prev => ({ ...prev, entries: newEntries }));
  };

  const addEntry = () => {
    setFormData(prev => ({
      ...prev,
      entries: [...prev.entries, { account: '', description: '', debitAmount: 0, creditAmount: 0 }]
    }));
  };

  const removeEntry = (index: number) => {
    if (formData.entries.length > 2) {
      setFormData(prev => ({
        ...prev,
        entries: prev.entries.filter((_, i) => i !== index)
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.voucherType) {
      newErrors.voucherType = 'Voucher type is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    // Validate entries
    formData.entries.forEach((entry, index) => {
      if (!entry.account) {
        newErrors[`entry_${index}_account`] = 'Account is required';
      }
      if (!entry.description.trim()) {
        newErrors[`entry_${index}_description`] = 'Description is required';
      }
      if (entry.debitAmount === 0 && entry.creditAmount === 0) {
        newErrors[`entry_${index}_amount`] = 'Either debit or credit amount is required';
      }
      if (entry.debitAmount > 0 && entry.creditAmount > 0) {
        newErrors[`entry_${index}_amount`] = 'Entry cannot have both debit and credit amounts';
      }
    });

    if (!totals.isBalanced) {
      newErrors.balance = 'Total debits must equal total credits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const getAccountOptions = () => {
    return accounts
      .filter(account => account.isActive && account.allowPosting)
      .map(account => ({
        value: account._id,
        label: `${account.accountCode} - ${account.accountName}`,
        account
      }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Information */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          {isEdit ? 'Edit Voucher Entry' : 'New Voucher Entry'}
        </h3>
        
        {/* Voucher Number Display */}
        {!isEdit && nextVoucherNumber && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <Hash className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">Next Voucher Number: </span>
              <span className="text-sm font-bold text-blue-900 ml-1">{nextVoucherNumber}</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">This number will be automatically assigned when you save the voucher</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Voucher Type *
            </label>
            <select
              value={formData.voucherType}
              onChange={(e) => handleInputChange('voucherType', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.voucherType ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            >
              {voucherTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.voucherType && (
              <p className="text-red-500 text-xs mt-1">{errors.voucherType}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
              />
            </div>
            {errors.date && (
              <p className="text-red-500 text-xs mt-1">{errors.date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference Number
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={formData.referenceNumber || ''}
                onChange={(e) => handleInputChange('referenceNumber', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Optional reference"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            rows={2}
            placeholder="Enter voucher description..."
            disabled={loading}
          />
          {errors.description && (
            <p className="text-red-500 text-xs mt-1">{errors.description}</p>
          )}
        </div>
      </div>

      {/* Journal Entries Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
          <h4 className="text-md font-semibold text-gray-900 flex items-center">
            <Calculator className="w-4 h-4 mr-2" />
            Journal Entries
          </h4>
          <button
            type="button"
            onClick={addEntry}
            className="inline-flex items-center px-3 py-1 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
            disabled={loading}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Line
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account *
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description *
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Debit Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credit Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {formData.entries.map((entry, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <select
                      value={entry.account}
                      onChange={(e) => handleEntryChange(index, 'account', e.target.value)}
                      className={`w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors[`entry_${index}_account`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      disabled={loading}
                    >
                      <option value="">Select Account</option>
                      {getAccountOptions().map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors[`entry_${index}_account`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`entry_${index}_account`]}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={entry.description}
                      onChange={(e) => handleEntryChange(index, 'description', e.target.value)}
                      className={`w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors[`entry_${index}_description`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Entry description"
                      disabled={loading}
                    />
                    {errors[`entry_${index}_description`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`entry_${index}_description`]}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                      <input
                        type="number"
                        value={entry.debitAmount || ''}
                        onChange={(e) => handleEntryChange(index, 'debitAmount', parseFloat(e.target.value) || 0)}
                        className={`w-full pl-6 pr-2 py-1 text-sm border rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          errors[`entry_${index}_amount`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        disabled={loading}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                      <input
                        type="number"
                        value={entry.creditAmount || ''}
                        onChange={(e) => handleEntryChange(index, 'creditAmount', parseFloat(e.target.value) || 0)}
                        className={`w-full pl-6 pr-2 py-1 text-sm border rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          errors[`entry_${index}_amount`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        disabled={loading}
                      />
                    </div>
                    {errors[`entry_${index}_amount`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`entry_${index}_amount`]}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {formData.entries.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeEntry(index)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Balance Summary */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="font-medium text-gray-700">Total Debits: </span>
                <span className="font-bold text-green-600">{totals.totalDebits.toFixed(2)}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-gray-700">Total Credits: </span>
                <span className="font-bold text-blue-600">{totals.totalCredits.toFixed(2)}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-gray-700">Difference: </span>
                <span className={`font-bold ${
                  totals.isBalanced ? 'text-green-600' : 'text-red-600'
                }`}>
                  {totals.difference.toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {validating && (
                <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
              )}
              <div className={`flex items-center text-sm ${
                totals.isBalanced ? 'text-green-600' : 'text-red-600'
              }`}>
                {totals.isBalanced ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Balanced
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Not Balanced
                  </>
                )}
              </div>
            </div>
          </div>
          
          {errors.balance && (
            <p className="text-red-500 text-sm mt-2">{errors.balance}</p>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          disabled={loading || !totals.isBalanced}
        >
          {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
          <Save className="w-4 h-4 mr-2" />
          {isEdit ? 'Update' : 'Save'} Voucher
        </button>
      </div>
    </form>
  );
};

export default VoucherEntryForm;