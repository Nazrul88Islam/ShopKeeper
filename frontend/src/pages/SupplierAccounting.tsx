import React from 'react';
import SupplierAccountingIntegration from '../components/suppliers/SupplierAccountingIntegration';

const SupplierAccounting: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SupplierAccountingIntegration />
        </div>
      </div>
    </div>
  );
};

export default SupplierAccounting;