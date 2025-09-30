const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/database');
const Role = require('../models/Role');

const updateRolePermissions = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Updating testsales role permissions...');
    
    // Find the testsales role
    const role = await Role.findOne({ name: 'testsales' });
    if (!role) {
      console.log('❌ testsales role not found');
      process.exit(1);
    }
    
    console.log(`📋 Current permissions for ${role.name}:`);
    role.permissions.forEach(perm => {
      console.log(`  ${perm.module}: ${perm.actions.join(', ')}`);
    });
    
    // Find the users permission and remove create action
    const usersPermIndex = role.permissions.findIndex(perm => perm.module === 'users');
    if (usersPermIndex >= 0) {
      console.log(`\n🔧 Found users permission: ${role.permissions[usersPermIndex].actions.join(', ')}`);
      
      // Remove 'create' action
      role.permissions[usersPermIndex].actions = role.permissions[usersPermIndex].actions.filter(
        action => action !== 'create'
      );
      
      console.log(`🔧 Updated users permission: ${role.permissions[usersPermIndex].actions.join(', ')}`);
      
      // If no actions left, remove the entire permission
      if (role.permissions[usersPermIndex].actions.length === 0) {
        role.permissions.splice(usersPermIndex, 1);
        console.log('🔧 Removed empty users permission');
      }
    } else {
      console.log('\nℹ️  No users permission found');
    }
    
    await role.save();
    
    console.log(`\n✅ Updated permissions for ${role.name}:`);
    role.permissions.forEach(perm => {
      console.log(`  ${perm.module}: ${perm.actions.join(', ')}`);
    });
    
    console.log('\n🔄 Note: Users with this role will need to log out and log back in to see the changes.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

updateRolePermissions();