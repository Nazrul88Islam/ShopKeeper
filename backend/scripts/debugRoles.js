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

// Debug roles
const debugRoles = async () => {
  try {
    console.log('\n🔍 Debugging Roles...\n');

    // Get all roles without filters
    const allRoles = await Role.find({});
    console.log(`Found ${allRoles.length} total roles:`);
    allRoles.forEach(role => {
      console.log(`   - ${role.name} (${role.displayName}) - Active: ${role.isActive}, System: ${role.isSystem}`);
    });

    // Check specific active filter
    const activeRoles = await Role.find({ isActive: true });
    console.log(`\nFound ${activeRoles.length} active roles:`);
    activeRoles.forEach(role => {
      console.log(`   - ${role.name} (${role.displayName})`);
    });

    // Check role schema
    console.log('\nRole schema paths:');
    Object.keys(Role.schema.paths).forEach(path => {
      console.log(`   - ${path}: ${Role.schema.paths[path].instance}`);
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await debugRoles();
  await mongoose.connection.close();
  console.log('🔗 Database connection closed');
};

main().catch(console.error);