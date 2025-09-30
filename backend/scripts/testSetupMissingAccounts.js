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
    console.log('🔍 Testing setup of missing accounts...');
    
    // Find customers without accounts
    const customersWithoutAccounts = await Customer.find({
      'accountingIntegration.accountsReceivableId': { $exists: false }
    });
    
    console.log(`📊 Found ${customersWithoutAccounts.length} customers without accounts`);
    
    if (customersWithoutAccounts.length > 0) {
      console.log('🔄 Setting up accounts for customers without them...');
      const results = await Customer.createMissingAccounts();
      console.log('📋 Results:', results);
    } else {
      console.log('✅ All customers already have accounts');
    }
    
    console.log('🎉 Setup test completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
});