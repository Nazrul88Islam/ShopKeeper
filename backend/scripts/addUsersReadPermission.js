const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/database');
const Role = require('../models/Role');

const addUsersReadPermission = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Adding users.read permission to testsales role...');
    
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
    
    // Check if users permission already exists
    const usersPermIndex = role.permissions.findIndex(perm => perm.module === 'users');
    
    if (usersPermIndex >= 0) {
      // Users permission exists, add 'read' if not already there
      if (!role.permissions[usersPermIndex].actions.includes('read')) {
        role.permissions[usersPermIndex].actions.push('read');
        console.log('\n🔧 Added read action to existing users permission');
      } else {
        console.log('\nℹ️  users.read permission already exists');
      }
    } else {
      // Users permission doesn't exist, create it
      role.permissions.push({
        module: 'users',
        actions: ['read']
      });
      console.log('\n🔧 Added new users permission with read action');
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

addUsersReadPermission();