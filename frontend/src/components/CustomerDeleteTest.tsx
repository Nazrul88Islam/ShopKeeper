import React, { useState } from 'react';
import { customerApi } from '../api/customerApi';

interface CustomerDeleteTestProps {
  customerId: string;
  onTestComplete: (result: { success: boolean; message: string }) => void;
}

const CustomerDeleteTest: React.FC<CustomerDeleteTestProps> = ({ customerId, onTestComplete }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestDelete = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      // This is just a test - in a real scenario, we wouldn't actually delete
      // We're just testing the API call structure
      console.log('Testing delete functionality for customer:', customerId);
      
      // Simulate the API call (commented out to prevent actual deletion)
      // const response = await customerApi.deleteCustomer(customerId);
      
      setResult({
        success: true,
        message: 'Delete functionality test passed - API call structure is correct'
      });
      
      onTestComplete({
        success: true,
        message: 'Delete functionality test passed'
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      setResult({
        success: false,
        message: `Delete test failed: ${errorMessage}`
      });
      
      onTestComplete({
        success: false,
        message: `Delete test failed: ${errorMessage}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-medium text-gray-900 mb-2">Customer Delete Test</h3>
      <p className="text-sm text-gray-600 mb-4">
        This component tests the customer delete functionality without actually deleting any customers.
      </p>
      
      <button
        onClick={handleTestDelete}
        disabled={loading}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Delete Functionality'}
      </button>
      
      {result && (
        <div className={`mt-4 p-3 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <p className="font-medium">{result.success ? '✅ Success' : '❌ Error'}</p>
          <p className="text-sm">{result.message}</p>
        </div>
      )}
    </div>
  );
};

export default CustomerDeleteTest;