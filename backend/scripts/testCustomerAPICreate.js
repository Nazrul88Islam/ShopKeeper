const mongoose = require('mongoose');
const Customer = require('../models/Customer');

// MongoDB connection
const mongoURI = 'mongodb://localhost:27017/shopkeeper_dev';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');

  try {
    console.log('🔍 Testing customer creation through API...');
    
    // Simulate customer data as it would come from the frontend
    const customerData = {
      firstName: 'APITest',
      lastName: 'Customer',
      email: 'api.test.customer@example.com',
      phone: '+1234567890',
      customerType: 'individual',
      billingAddress: {
        street: '123 API St',
        city: 'API City',
        state: 'API State',
        zipCode: '12345',
        country: 'API Country'
      },
      // This is what the frontend sends
      accountingIntegration: {
        autoCreateAccount: true
      }
    };

    console.log('💾 Creating customer with accounting integration...');
    const customer = new Customer(customerData);
    await customer.save();
    console.log('✅ Customer created:', customer.firstName, customer.lastName, customer.customerCode);

    // Wait for account creation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Reload customer to get account info
    const savedCustomer = await Customer.findById(customer._id);
    console.log('📊 Customer accounting info:');
    console.log('  Customer ID:', savedCustomer._id);
    console.log('  Customer Code:', savedCustomer.customerCode);
    console.log('  Accounting Integration:', savedCustomer.accountingIntegration);
    
    if (savedCustomer.accountingIntegration && savedCustomer.accountingIntegration.accountsReceivableId) {
      console.log('✅ Accounting account created successfully');
      
      // Check the actual account
      const ChartOfAccounts = require('../models/ChartOfAccounts');
      const account = await ChartOfAccounts.findById(savedCustomer.accountingIntegration.accountsReceivableId);
      if (account) {
        console.log('📊 Associated Chart of Accounts entry:');
        console.log('  Account ID:', account._id);
        console.log('  Account Code:', account.accountCode);
        console.log('  Account Name:', account.accountName);
      } else {
        console.log('❌ Associated account not found in Chart of Accounts');
      }
    } else {
      console.log('❌ Accounting account was not created');
    }
    
    // Clean up
    await Customer.findByIdAndDelete(savedCustomer._id);
    console.log('🧹 Cleaned up test customer');
    
    console.log('🎉 API test completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
});