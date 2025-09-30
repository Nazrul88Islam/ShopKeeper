const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/database');
const User = require('../models/User');
const Role = require('../models/Role');

const assignInventoryRole = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Assigning inventory role to user...');
    
    // Find the inventory role to get its permissions
    const inventoryRole = await Role.findOne({ name: 'inventory' });
    if (!inventoryRole) {
      console.log('❌ Inventory role not found');
      process.exit(1);
    }
    
    console.log(`📋 Found inventory role: ${inventoryRole.displayName}`);
    console.log(`Permissions: ${inventoryRole.permissions.length}`);
    
    // Find a user to assign the role to (let's use the Test User)
    const user = await User.findOne({ email: 'testuser@example.com' });
    if (!user) {
      console.log('❌ Test user not found');
      process.exit(1);
    }
    
    console.log(`👤 Found user: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`Current role: ${user.role}`);
    
    // Update the user's role and permissions
    user.role = 'inventory';
    user.permissions = inventoryRole.permissions;
    
    await user.save();
    
    console.log('✅ Successfully assigned inventory role to user');
    console.log(`New role: ${user.role}`);
    
    // Verify the permissions
    const supplierPerm = user.permissions.find(p => p.module === 'suppliers');
    if (supplierPerm) {
      console.log(`Supplier permissions: ${supplierPerm.actions.join(', ')}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

assignInventoryRole();