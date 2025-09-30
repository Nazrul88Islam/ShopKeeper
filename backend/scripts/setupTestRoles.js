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

// Create additional roles for testing
const createTestRoles = async () => {
  try {
    console.log('\n🧪 Creating Test Roles for Frontend Testing...\n');

    // Additional roles to create
    const additionalRoles = [
      {
        name: 'inventory',
        displayName: 'Inventory Manager',
        description: 'Manages inventory and stock levels',
        permissions: [
          { module: 'inventory', actions: ['create', 'read', 'update', 'delete'] },
          { module: 'products', actions: ['create', 'read', 'update', 'delete'] },
          { module: 'orders', actions: ['read', 'update'] }
        ],
        isSystem: true,
        isActive: true
      },
      {
        name: 'accountant',
        displayName: 'Accountant',
        description: 'Handles financial records and accounting',
        permissions: [
          { module: 'accounting', actions: ['create', 'read', 'update', 'delete'] },
          { module: 'reports', actions: ['read'] },
          { module: 'orders', actions: ['read'] }
        ],
        isSystem: true,
        isActive: true
      },
      {
        name: 'customer_service',
        displayName: 'Customer Service',
        description: 'Handles customer support and inquiries',
        permissions: [
          { module: 'orders', actions: ['read', 'update'] },
          { module: 'customers', actions: ['read', 'update'] }
        ],
        isSystem: true,
        isActive: true
      },
      {
        name: 'warehouse_supervisor',
        displayName: 'Warehouse Supervisor',
        description: 'Supervises warehouse operations',
        permissions: [
          { module: 'inventory', actions: ['create', 'read', 'update'] },
          { module: 'products', actions: ['read', 'update'] },
          { module: 'orders', actions: ['read', 'update'] }
        ],
        isSystem: false,
        isActive: true
      }
    ];

    // Create roles if they don't exist
    for (const roleData of additionalRoles) {
      const existingRole = await Role.findOne({ name: roleData.name });
      
      if (existingRole) {
        console.log(`⏭️  Role already exists: ${roleData.displayName} (${roleData.name})`);
        // Update existing role
        await Role.findByIdAndUpdate(existingRole._id, roleData);
        console.log(`🔄 Updated role: ${roleData.displayName}`);
      } else {
        console.log(`Creating role: ${roleData.name}`);
        const role = new Role(roleData);
        await role.save();
        console.log(`✅ Created: ${role.displayName} (${role.name})`);
      }
    }

    // Verify creation
    const allRoles = await Role.find({});
    console.log(`\n📊 Total roles in database: ${allRoles.length}`);
    allRoles.forEach(role => {
      console.log(`   - ${role.name} (${role.displayName}) - Active: ${role.isActive}, System: ${role.isSystem}`);
    });

    console.log('\n🎉 Test roles setup completed!\n');

  } catch (error) {
    console.error('❌ Setup error:', error);
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
  await createTestRoles();
  await mongoose.connection.close();
  console.log('🔗 Database connection closed');
};

main().catch(console.error);