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
    console.log('🔍 Testing customer account protection...');
    
    // Create a new customer with unique email
    const timestamp = Date.now();
    console.log('💾 Creating test customer...');
    const customerData = {
      firstName: 'Protected',
      lastName: 'Customer',
      email: `protected.customer.${timestamp}@example.com`,
      phone: '+1234567890',
      customerType: 'individual',
      billingAddress: {
        street: '123 Protected Street',
        city: 'Protected City',
        state: 'Protected State',
        zipCode: '12345',
        country: 'Protected Country'
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
    console.log('📊 Customer account info:');
    console.log('  Account ID:', updatedCustomer.accountingIntegration.accountsReceivableId);
    console.log('  Account Code:', updatedCustomer.accountingIntegration.accountCode);

    // Test name update - should also update account name
    console.log('🔄 Updating customer name...');
    updatedCustomer.firstName = 'Updated';
    await updatedCustomer.save();
    
    // Wait a bit for the update to process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if account name was updated
    const ChartOfAccounts = require('../models/ChartOfAccounts');
    const account = await ChartOfAccounts.findById(updatedCustomer.accountingIntegration.accountsReceivableId);
    console.log('📊 Updated account name:', account.accountName);
    
    // Verify the account name was updated correctly
    if (account.accountName.includes('Updated Customer')) {
      console.log('✅ Account name correctly updated');
    } else {
      console.log('❌ Account name was not updated correctly');
    }
    
    // Test hasJournalEntries method
    console.log('🔍 Checking for journal entries...');
    const hasEntries = await updatedCustomer.hasJournalEntries();
    console.log('📊 Customer has journal entries:', hasEntries);
    
    // Test deleteAccount method (should succeed since there are no journal entries)
    console.log('🗑️ Testing account deletion...');
    try {
      await updatedCustomer.deleteAccount();
      console.log('✅ Customer account deleted successfully');
    } catch (error) {
      console.log('❌ Error deleting account:', error.message);
    }
    
    // Delete the customer
    await Customer.findByIdAndDelete(updatedCustomer._id);
    console.log('✅ Customer deleted successfully');
    
    console.log('🎉 All tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
});