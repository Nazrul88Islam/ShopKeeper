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
    console.log('🔍 Verifying customer accounting functionality...');
    
    // Create a new customer with unique email
    const timestamp = Date.now();
    console.log('💾 Creating test customer...');
    const customerData = {
      firstName: 'AccountingTest',
      lastName: 'Customer',
      email: `accounting.test.${timestamp}@example.com`,
      phone: '+1234567890',
      customerType: 'individual',
      billingAddress: {
        street: '123 Accounting St',
        city: 'Accounting City',
        state: 'Accounting State',
        zipCode: '12345',
        country: 'Accounting Country'
      },
      status: 'active'
    };

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
        console.log('  Account Type:', account.accountType);
        console.log('  Account Category:', account.accountCategory);
        console.log('  Tags:', account.tags);
      } else {
        console.log('❌ Associated account not found in Chart of Accounts');
      }
      
      // Test updating the customer name
      console.log('🔄 Testing customer name update...');
      savedCustomer.firstName = 'UpdatedAccounting';
      await savedCustomer.save();
      
      // Wait for update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if account name was updated
      const updatedAccount = await ChartOfAccounts.findById(savedCustomer.accountingIntegration.accountsReceivableId);
      console.log('📊 Updated account name:', updatedAccount.accountName);
      
      if (updatedAccount.accountName.includes('UpdatedAccounting')) {
        console.log('✅ Account name correctly updated');
      } else {
        console.log('❌ Account name was not updated');
      }
    } else {
      console.log('❌ Accounting account was not created');
      console.log('  accountingIntegration:', savedCustomer.accountingIntegration);
    }
    
    // Clean up
    await Customer.findByIdAndDelete(savedCustomer._id);
    console.log('🧹 Cleaned up test customer');
    
    console.log('🎉 Verification completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
});