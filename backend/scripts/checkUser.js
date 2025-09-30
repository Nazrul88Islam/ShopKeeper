const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/database');
const User = require('../models/User');

const checkUser = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Checking users in database...');
    
    // Find all users
    const users = await User.find({}).select('-password');
    
    console.log(`\n👥 Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Active: ${user.isActive}`);
      console.log(`  Permissions: ${user.permissions ? user.permissions.length : 0}`);
      if (user.permissions) {
        user.permissions.forEach(perm => {
          if (perm.module === 'suppliers') {
            console.log(`    Suppliers: ${perm.actions.join(', ')}`);
          }
        });
      }
      console.log('');
    });
    
    // Check roles distribution
    const roleCounts = {};
    users.forEach(user => {
      roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
    });
    
    console.log('📊 Role Distribution:');
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`- ${role}: ${count} users`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkUser();