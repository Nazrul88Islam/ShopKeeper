const mongoose = require('mongoose');
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
    // Find the account with code 11003
    const account = await ChartOfAccounts.findOne({ accountCode: '11003' });
    if (account) {
      console.log('Account found:');
      console.log('  Code:', account.accountCode);
      console.log('  Name:', account.accountName);
    } else {
      console.log('No account found with code 11003');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
});