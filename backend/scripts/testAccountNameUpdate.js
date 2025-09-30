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
    console.log('🔍 Testing customer account name update...');
    
    // Create a new customer with unique email
    const timestamp = Date.now();
    console.log('💾 Creating test customer...');
    const customerData = {
      firstName: 'NameTest',
      lastName: 'Customer',
      email: `nametest.customer.${timestamp}@example.com`,
      phone: '+1234567890',
      customerType: 'individual',
      billingAddress: {
        street: '123 NameTest Street',
        city: 'NameTest City',
        state: 'NameTest State',
        zipCode: '12345',
        country: 'NameTest Country'
      },
      status: 'active'
    };

    const customer = new Customer(customerData);
    await customer.save();
    console.log('✅ Customer created:', customer.firstName, customer.lastName, customer.customerCode);

    // Wait for account creation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Reload customer to get account info
    const updatedCustomer = await Customer.findById(customer._id);
    console.log('📊 Original customer account info:');
    console.log('  Account ID:', updatedCustomer.accountingIntegration.accountsReceivableId);
    console.log('  Account Code:', updatedCustomer.accountingIntegration.accountCode);
    
    // Check original account name
    const ChartOfAccounts = require('../models/ChartOfAccounts');
    const originalAccount = await ChartOfAccounts.findById(updatedCustomer.accountingIntegration.accountsReceivableId);
    console.log('  Original Account Name:', originalAccount.accountName);

    // Test name update - should also update account name
    console.log('🔄 Updating customer name...');
    updatedCustomer.firstName = 'UpdatedName';
    console.log('  First name modified:', updatedCustomer.isModified('firstName'));
    
    await updatedCustomer.save();
    
    // Wait a bit for the update to process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if account name was updated
    const updatedAccount = await ChartOfAccounts.findById(updatedCustomer.accountingIntegration.accountsReceivableId);
    console.log('📊 Updated account name:', updatedAccount.accountName);
    
    // Verify the account name was updated correctly
    if (updatedAccount.accountName.includes('UpdatedName Customer')) {
      console.log('✅ Account name correctly updated');
    } else {
      console.log('❌ Account name was not updated correctly');
      console.log('Expected to contain "UpdatedName Customer"');
      console.log('Actual name:', updatedAccount.accountName);
    }
    
    console.log('🎉 Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
});