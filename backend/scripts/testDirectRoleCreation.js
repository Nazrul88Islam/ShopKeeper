const mongoose = require('mongoose');
const Role = require('../models/Role');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/shopkeeper', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test role creation
const testRoleCreation = async () => {
  try {
    console.log('\n🧪 Testing Direct Role Creation...\n');

    // Create a simple test role
    const testRole = new Role({
      name: 'test_role',
      displayName: 'Test Role',
      description: 'A test role for debugging',
      permissions: [
        {
          module: 'orders',
          actions: ['read']
        }
      ],
      isSystem: false,
      isActive: true
    });

    console.log('Creating test role...');
    const savedRole = await testRole.save();
    console.log(`✅ Role created successfully: ${savedRole._id}`);
    console.log(`   Name: ${savedRole.name}`);
    console.log(`   Display Name: ${savedRole.displayName}`);
    console.log(`   Active: ${savedRole.isActive}`);
    console.log(`   System: ${savedRole.isSystem}`);

    // Try to find it
    console.log('\nSearching for the role...');
    const foundRole = await Role.findById(savedRole._id);
    if (foundRole) {
      console.log(`✅ Role found: ${foundRole.name}`);
    } else {
      console.log('❌ Role not found');
    }

    // List all roles
    console.log('\nListing all roles...');
    const allRoles = await Role.find({});
    console.log(`Found ${allRoles.length} roles total`);

    // Clean up
    await Role.findByIdAndDelete(savedRole._id);
    console.log('🧹 Test role cleaned up');

  } catch (error) {
    console.error('❌ Test error:', error);
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        console.error(`   ${key}: ${error.errors[key].message}`);
      });
    }
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await testRoleCreation();
  await mongoose.connection.close();
  console.log('🔗 Database connection closed');
};

main().catch(console.error);