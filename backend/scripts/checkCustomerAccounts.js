const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const ChartOfAccounts = require('../models/ChartOfAccounts');

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
    console.log('🔍 Checking customer accounting accounts...');
    
    // Find all customers with accounting integration
    const customers = await Customer.find({
      'accountingIntegration.accountsReceivableId': { $exists: true }
    }).select('firstName lastName customerCode accountingIntegration');
    
    console.log(`📊 Found ${customers.length} customers with accounting accounts`);
    
    if (customers.length > 0) {
      console.log('\n📋 Customer Accounts:');
      for (const customer of customers) {
        const account = await ChartOfAccounts.findById(customer.accountingIntegration.accountsReceivableId);
        console.log(`  Customer: ${customer.firstName} ${customer.lastName} (${customer.customerCode})`);
        if (account) {
          console.log(`    Account Code: ${account.accountCode}`);
          console.log(`    Account Name: ${account.accountName}`);
          console.log(`    Account Type: ${account.accountType}`);
          console.log(`    Current Balance: ${account.currentBalance}`);
        } else {
          console.log(`    ❌ Account not found in Chart of Accounts!`);
        }
        console.log('');
      }
    }
    
    // Also check for customers without accounts
    const customersWithoutAccounts = await Customer.find({
      $or: [
        { 'accountingIntegration': { $exists: false } },
        { 'accountingIntegration.accountsReceivableId': { $exists: false } }
      ]
    }).select('firstName lastName customerCode accountingIntegration');
    
    console.log(`📊 Found ${customersWithoutAccounts.length} customers WITHOUT accounting accounts`);
    
    if (customersWithoutAccounts.length > 0) {
      console.log('\n📋 Customers Without Accounts:');
      for (const customer of customersWithoutAccounts) {
        console.log(`  Customer: ${customer.firstName} ${customer.lastName} (${customer.customerCode})`);
        console.log(`    Accounting Integration:`, customer.accountingIntegration || 'None');
        console.log('');
      }
    }
    
    // Check total Chart of Accounts entries
    const totalAccounts = await ChartOfAccounts.countDocuments();
    const customerAccounts = await ChartOfAccounts.countDocuments({
      'tags': { $in: ['customer'] }
    });
    
    console.log(`\n📈 Chart of Accounts Summary:`);
    console.log(`  Total Accounts: ${totalAccounts}`);
    console.log(`  Customer Accounts: ${customerAccounts}`);
    
    console.log('\n🎉 Check completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
});