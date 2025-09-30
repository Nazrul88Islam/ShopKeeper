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
    // Create a new customer with unique email
    const timestamp = Date.now();
    console.log('💾 Creating test customer...');
    const customerData = {
      firstName: 'DebugTest',
      lastName: 'Customer',
      email: `debugtest.customer.${timestamp}@example.com`,
      phone: '+1234567890',
      customerType: 'individual',
      billingAddress: {
        street: '123 DebugTest Street',
        city: 'DebugTest City',
        state: 'DebugTest State',
        zipCode: '12345',
        country: 'DebugTest Country'
      },
      status: 'active'
    };

    const customer = new Customer(customerData);
    await customer.save();
    console.log('✅ Customer created');

    // Reload customer to get the saved document
    const savedCustomer = await Customer.findById(customer._id);
    console.log('📊 Checking modified fields on new customer:');
    console.log('  isNew:', savedCustomer.isNew);
    console.log('  isModified firstName:', savedCustomer.isModified('firstName'));
    console.log('  isModified lastName:', savedCustomer.isModified('lastName'));
    console.log('  isModified companyName:', savedCustomer.isModified('companyName'));
    
    // Update the customer
    console.log('🔄 Updating customer...');
    savedCustomer.firstName = 'UpdatedDebug';
    
    console.log('  isModified firstName after update:', savedCustomer.isModified('firstName'));
    console.log('  isDirectModified firstName:', savedCustomer.isDirectModified('firstName'));
    
    await savedCustomer.save();
    
    console.log('✅ Customer updated');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
});