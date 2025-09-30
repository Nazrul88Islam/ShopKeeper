const mongoose = require('mongoose');
const Role = require('../models/Role');
const User = require('../models/User');
require('dotenv').config();

const seedRoles = async () => {
  try {
    console.log('🌱 Starting role seeding process...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get system roles
    const systemRoles = Role.getSystemRoles();
    
    // Check if roles already exist
    const existingRoles = await Role.find({});
    console.log(`📋 Found ${existingRoles.length} existing roles`);

    // Seed system roles if they don't exist
    for (const roleData of systemRoles) {
      const existingRole = await Role.findOne({ name: roleData.name });
      
      if (!existingRole) {
        const role = new Role(roleData);
        await role.save();
        console.log(`✅ Created system role: ${role.displayName} (${role.name})`);
      } else {
        console.log(`⏭️  Role already exists: ${existingRole.displayName} (${existingRole.name})`);
        
        // Update system roles if they exist but may need updates
        if (existingRole.isSystem) {
          existingRole.permissions = roleData.permissions;
          existingRole.description = roleData.description;
          await existingRole.save();
          console.log(`🔄 Updated system role: ${existingRole.displayName}`);
        }
      }
    }

    // Create default admin user if it doesn't exist
    const adminUser = await User.findOne({ username: 'admin' });
    if (!adminUser) {
      const adminRole = await Role.findOne({ name: 'admin' });
      if (adminRole) {
        const newAdmin = new User({
          firstName: 'Admin',
          lastName: 'User',
          username: 'admin',
          email: 'admin@shopkeeper.com',
          password: 'admin123',
          role: 'admin',
          permissions: adminRole.permissions,
          isActive: true,
          emailVerified: true
        });
        
        await newAdmin.save();
        console.log('✅ Created default admin user (admin/admin123)');
      }
    } else {
      console.log('⏭️  Admin user already exists');
    }

    console.log('🎉 Role seeding completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error seeding roles:', error);
    process.exit(1);
  }
};

// Run the seeding if called directly
if (require.main === module) {
  seedRoles();
}

module.exports = seedRoles;
