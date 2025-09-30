const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const ChartOfAccounts = require('../models/ChartOfAccounts');

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
    // Find a customer without an account
    const customer = await Customer.findOne({
      'accountingIntegration.accountsReceivableId': { $exists: false }
    });

    if (!customer) {
      console.log('No customer found without an account');
      process.exit(0);
    }

    console.log('Customer found:', customer.firstName, customer.lastName, customer.customerCode);

    // Create account for the customer
    const account = await customer.createCustomerAccount();
    console.log('Account created:', account.accountCode, account.accountName);

    // Verify the account was linked to the customer
    const updatedCustomer = await Customer.findById(customer._id);
    console.log('Customer account linked:', updatedCustomer.accountingIntegration.accountsReceivableId);

    // Get account balance
    const balance = await customer.getAccountBalance();
    console.log('Account balance:', balance);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
});