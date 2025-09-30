const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const ChartOfAccounts = require('../models/ChartOfAccounts');
const JournalEntry = require('../models/JournalEntry');

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
    
    // Create a new customer
    console.log('💾 Creating test customer...');
    const customerData = {
      firstName: 'Protected',
      lastName: 'Customer',
      email: 'protected.customer@example.com',
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
    
    // Check if account name was updated
    const account = await ChartOfAccounts.findById(updatedCustomer.accountingIntegration.accountsReceivableId);
    console.log('📊 Updated account name:', account.accountName);
    
    // Test deletion protection with journal entries
    console.log('🔒 Testing deletion protection...');
    
    // Create a journal entry referencing this account
    const journalEntry = new JournalEntry({
      voucherType: 'JOURNAL',
      date: new Date(),
      description: 'Test entry for customer protection',
      entries: [
        {
          account: updatedCustomer.accountingIntegration.accountsReceivableId,
          description: 'Test debit entry',
          debitAmount: 100,
          creditAmount: 0
        },
        {
          account: '1001', // Cash account
          description: 'Test credit entry',
          debitAmount: 0,
          creditAmount: 100
        }
      ]
    });
    
    await journalEntry.save();
    console.log('✅ Journal entry created referencing customer account');
    
    // Try to delete customer - should fail
    console.log('🚫 Attempting to delete customer with journal entries...');
    try {
      await updatedCustomer.deleteAccount();
      console.log('❌ This should have failed!');
    } catch (error) {
      console.log('✅ Deletion correctly blocked:', error.message);
    }
    
    // Clean up - delete journal entry first
    await JournalEntry.findByIdAndDelete(journalEntry._id);
    console.log('🧹 Cleaned up journal entry');
    
    // Now try to delete customer account - should succeed
    console.log('✅ Deleting customer account after cleaning journal entries...');
    await updatedCustomer.deleteAccount();
    console.log('✅ Customer account deleted successfully');
    
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