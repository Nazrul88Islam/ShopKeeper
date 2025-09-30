const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/database');
const User = require('../models/User');
const Role = require('../models/Role');

const refreshUserPermissions = async () => {
  try {
    await connectDB();
    
    console.log('🔄 Refreshing user permissions from roles...');
    
    // Find users with testsales role
    const users = await User.find({ role: 'testsales' }).select('-password');
    
    console.log(`\n👥 Found ${users.length} users with testsales role:`);
    
    for (const user of users) {
      console.log(`\n👤 User: ${user.firstName} ${user.lastName} (${user.email})`);
      
      // Get role permissions
      const role = await Role.findOne({ name: user.role, isActive: true });
      if (role) {
        console.log(`📋 Role: ${role.name} (${role.displayName})`);
        console.log(`Permissions: ${role.permissions.length}`);
        
        // Update user permissions from role
        user.permissions = role.permissions;
        await user.save();
        
        console.log(`✅ Permissions refreshed for user`);
      } else {
        console.log(`❌ Role ${user.role} not found or not active`);
      }
    }
    
    console.log('\n🔄 All user permissions have been refreshed from their roles.');
    console.log('Users will need to log out and log back in to see the changes.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

refreshUserPermissions();