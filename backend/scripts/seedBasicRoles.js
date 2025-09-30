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

// Simple role seeding
const seedBasicRoles = async () => {
  try {
    console.log('\n🌱 Seeding Basic Roles...\n');

    // Clear existing roles
    await Role.deleteMany({});
    console.log('🧹 Cleared existing roles');

    // Define basic roles
    const basicRoles = [
      {
        name: 'admin',
        displayName: 'Administrator',
        description: 'Full system access',
        permissions: [
          { module: 'users', actions: ['create', 'read', 'update', 'delete'] },
          { module: 'orders', actions: ['create', 'read', 'update', 'delete'] },
          { module: 'products', actions: ['create', 'read', 'update', 'delete'] }
        ],
        isSystem: true,
        isActive: true
      },
      {
        name: 'sales',
        displayName: 'Sales Representative',
        description: 'Sales and customer management',
        permissions: [
          { module: 'orders', actions: ['create', 'read', 'update'] },
          { module: 'customers', actions: ['create', 'read', 'update'] }
        ],
        isSystem: true,
        isActive: true
      },
      {
        name: 'manager',
        displayName: 'Manager',
        description: 'Management access',
        permissions: [
          { module: 'orders', actions: ['create', 'read', 'update', 'delete'] },
          { module: 'reports', actions: ['read'] }
        ],
        isSystem: true,
        isActive: true
      }
    ];

    // Create roles
    for (const roleData of basicRoles) {
      console.log(`Creating role: ${roleData.name}`);
      const role = new Role(roleData);
      await role.save();
      console.log(`✅ Created: ${role.displayName} (${role.name})`);
    }

    // Verify creation
    const createdRoles = await Role.find({});
    console.log(`\n📊 Verification: ${createdRoles.length} roles created`);
    createdRoles.forEach(role => {
      console.log(`   - ${role.name} (${role.displayName}) - Active: ${role.isActive}`);
    });

    console.log('\n🎉 Basic role seeding completed!\n');

  } catch (error) {
    console.error('❌ Seeding error:', error);
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
  await seedBasicRoles();
  await mongoose.connection.close();
  console.log('🔗 Database connection closed');
};

main().catch(console.error);