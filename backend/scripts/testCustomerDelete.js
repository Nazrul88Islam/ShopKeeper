const axios = require('axios');
const Customer = require('../models/Customer');

// Test customer deletion
async function testCustomerDelete() {
  try {
    console.log('Testing customer deletion...');
    
    // First, let's create a test customer
    const testCustomer = new Customer({
      customerCode: 'TEST001',
      firstName: 'Test',
      lastName: 'Customer',
      email: 'test@example.com',
      phone: '1234567890',
      customerType: 'individual',
      billingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'Test Country'
      },
      creditLimit: 1000,
      paymentTerms: 'cash',
      discountRate: 0,
      status: 'active',
      preferredLanguage: 'en',
      marketingOptIn: false,
      notes: 'Test customer for deletion',
      tags: []
    });
    
    await testCustomer.save();
    console.log('✅ Created test customer:', testCustomer._id);
    
    // Now test the delete functionality
    const baseUrl = 'http://localhost:5000/api';
    // Note: This test requires authentication which is not included here
    // In a real test, you would need to login first to get a token
    
    console.log('To test deletion, you need to:');
    console.log('1. Login to get an authentication token');
    console.log('2. Send a DELETE request to:', `${baseUrl}/customers/${testCustomer._id}`);
    console.log('3. Check that the customer status is set to "inactive"');
    
    // Let's check the current status
    const customer = await Customer.findById(testCustomer._id);
    console.log('Current customer status:', customer.status);
    
    // Clean up by actually deleting from database for this test
    await Customer.findByIdAndDelete(testCustomer._id);
    console.log('✅ Cleaned up test customer');
    
  } catch (error) {
    console.error('❌ Error in test:', error.message);
  }
}

testCustomerDelete();