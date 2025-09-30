const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/database');
const Role = require('../models/Role');

const checkTestSalesRole = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Checking testsales role in detail...');
    
    // Find the testsales role
    const role = await Role.findOne({ name: 'testsales' });
    if (!role) {
      console.log('❌ testsales role not found');
      process.exit(1);
    }
    
    console.log(`📋 Role: ${role.name} (${role.displayName})`);
    console.log(`Description: ${role.description}`);
    console.log(`Active: ${role.isActive}`);
    console.log(`System Role: ${role.isSystem}`);
    console.log(`User Count: ${role.userCount}`);
    console.log(`\nPermissions (${role.permissions.length}):`);
    
    role.permissions.forEach((perm, index) => {
      console.log(`  ${index}. ${perm.module}: ${perm.actions.join(', ')}`);
    });
    
    // Check specifically for users permission
    const usersPerm = role.permissions.find(perm => perm.module === 'users');
    if (usersPerm) {
      console.log(`\n✅ Found users permission: ${usersPerm.actions.join(', ')}`);
    } else {
      console.log(`\n❌ No users permission found`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkTestSalesRole();