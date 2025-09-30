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
    console.log('🔍 Testing customer accounting API endpoints...');
    
    // Find a customer with an account
    const customer = await Customer.findOne({
      'accountingIntegration.accountsReceivableId': { $exists: true }
    }).limit(1);

    if (!customer) {
      console.log('No customer found with an account');
      process.exit(0);
    }

    console.log('Customer found:', customer.firstName, customer.lastName, customer.customerCode);

    // Test getAccountsReceivableAccount method
    const account = await customer.getAccountsReceivableAccount();
    console.log('📋 Account details:');
    console.log('Account Code:', account.accountCode);
    console.log('Account Name:', account.accountName);
    console.log('Current Balance:', account.currentBalance);

    // Test getAccountBalance method
    const balance = await customer.getAccountBalance();
    console.log('💰 Account balance:', balance);

    // Test updateAccountBalance method
    console.log('🔄 Updating account balance...');
    await customer.updateAccountBalance(100, true); // Add $100 as debit
    const newBalance = await customer.getAccountBalance();
    console.log('💰 New account balance:', newBalance);

    // Test createMissingAccounts static method
    console.log('🔍 Checking for customers without accounts...');
    const results = await Customer.createMissingAccounts();
    console.log('📋 Results:', results);

    console.log('✅ All API tests completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
});