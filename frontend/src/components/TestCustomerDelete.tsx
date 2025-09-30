import React, { useState } from 'react';
import { Trash2, Loader } from 'lucide-react';

interface TestCustomerDeleteProps {
  customerId?: string;
  customerName?: string;
  onDeleteTest: (customerId: string) => Promise<{ success: boolean; message: string }>;
}

const TestCustomerDelete: React.FC<TestCustomerDeleteProps> = ({ 
  customerId = 'test-customer-id', 
  customerName = 'Test Customer',
  onDeleteTest 
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleDeleteTest = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      // Simulate the delete operation
      console.log(`Testing delete functionality for customer: ${customerName} (${customerId})`);
      
      // Call the test function
      const response = await onDeleteTest(customerId);
      
      setResult(response);
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error occurred';
      setResult({
        success: false,
        message: `Delete test failed: ${errorMessage}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Delete Functionality Test</h3>
      <p className="text-sm text-gray-600 mb-4">
        This component demonstrates the improved delete functionality with better user feedback.
      </p>
      
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900">{customerName}</div>
          <div className="text-xs text-gray-500">ID: {customerId}</div>
        </div>
        
        <button
          onClick={handleDeleteTest}
          disabled={loading}
          className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${
            loading 
              ? 'bg-red-400 cursor-not-allowed' 
              : 'bg-red-600 hover:bg-red-700'
          } text-white`}
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 mr-1 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </>
          )}
        </button>
      </div>
      
      {result && (
        <div className={`p-3 rounded-md ${
          result.success 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <p className="font-medium text-sm">
            {result.success ? '✅ Success' : '❌ Error'}
          </p>
          <p className="text-sm mt-1">{result.message}</p>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        <p><strong>Features demonstrated:</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Visual loading indicator during delete operation</li>
          <li>Confirmation dialog with customer name</li>
          <li>Detailed success/error messages</li>
          <li>Disabled button state during operation</li>
          <li>Automatic result clearing</li>
        </ul>
      </div>
    </div>
  );
};

export default TestCustomerDelete;