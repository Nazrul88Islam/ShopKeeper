const mongoose = require('mongoose');
const Customer = require('../models/Customer');

// MongoDB connection
const mongoURI = 'mongodb://localhost:27017/shopkeeper_dev'; // Update with your DB URI

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');

  try {
    console.log('🔍 Testing customer creation with automatic account creation...');
    
    // Create a new customer
    const customerData = {
      firstName: 'Test',
      lastName: 'Customer',
      email: 'test.customer@example.com',
      phone: '+1234567890',
      customerType: 'individual',
      billingAddress: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'Test Country'
      },
      creditLimit: 1000,
      paymentTerms: 'net30',
      discountRate: 5,
      status: 'active'
    };

    console.log('💾 Saving customer...');
    const customer = new Customer(customerData);
    await customer.save();
    console.log('✅ Customer saved successfully');
    console.log('Customer ID:', customer._id);
    console.log('Customer Code:', customer.customerCode);

    // Wait a bit for the post-save hook to run
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Reload the customer to see the updated data
    const updatedCustomer = await Customer.findById(customer._id);
    console.log('🔄 Updated customer data:');
    console.log('Account Receivable ID:', updatedCustomer.accountingIntegration.accountsReceivableId);
    console.log('Account Code:', updatedCustomer.accountingIntegration.accountCode);

    if (updatedCustomer.accountingIntegration.accountsReceivableId) {
      // Get the associated Chart of Accounts entry
      const account = await updatedCustomer.getAccountsReceivableAccount();
      console.log('📋 Associated Chart of Accounts:');
      console.log('Account Code:', account.accountCode);
      console.log('Account Name:', account.accountName);
      console.log('Tags:', account.tags);
    }

    console.log('✅ Test completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
});