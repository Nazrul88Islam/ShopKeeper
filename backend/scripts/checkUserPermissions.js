const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/database');
const User = require('../models/User');

const checkUserPermissions = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Checking user permissions...');
    
    // Find users with testsales role
    const users = await User.find({ role: 'testsales' }).select('-password');
    
    console.log(`\n👥 Found ${users.length} users with testsales role:`);
    
    for (const user of users) {
      console.log(`\n👤 User: ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`Active: ${user.isActive}`);
      console.log(`Last Login: ${user.lastLogin || 'Never'}`);
      
      if (user.permissions && user.permissions.length > 0) {
        console.log(`\nPermissions (${user.permissions.length}):`);
        user.permissions.forEach((perm, index) => {
          console.log(`  ${index}. ${perm.module}: ${perm.actions.join(', ')}`);
        });
        
        // Check specifically for users permission
        const usersPerm = user.permissions.find(perm => perm.module === 'users');
        if (usersPerm) {
          console.log(`\n✅ User has users permission: ${usersPerm.actions.join(', ')}`);
        } else {
          console.log(`\n❌ User does not have users permission`);
        }
        
        // Check specifically for roles access
        const canAccessRoles = user.permissions.some(perm => 
          perm.module === 'users' && perm.actions.includes('create')
        );
        console.log(`\n🔐 Can access Roles menu: ${canAccessRoles}`);
      } else {
        console.log(`\n⚠️  No permissions found for user`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkUserPermissions();