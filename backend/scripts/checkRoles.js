const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/database');
const Role = require('../models/Role');

const checkRoles = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Checking roles in database...');
    
    const roles = await Role.find({});
    
    console.log('\n📋 Roles:');
    roles.forEach(role => {
      console.log(`- ${role.name}: ${role.displayName}`);
      console.log(`  Permissions: ${role.permissions.length}`);
      role.permissions.forEach(perm => {
        if (perm.module === 'suppliers') {
          console.log(`    Suppliers: ${perm.actions.join(', ')}`);
        }
      });
    });
    
    // Check specific inventory role
    const inventoryRole = await Role.findOne({ name: 'inventory' });
    if (inventoryRole) {
      console.log('\n📦 Inventory Role Details:');
      console.log(`Name: ${inventoryRole.name}`);
      console.log(`Display Name: ${inventoryRole.displayName}`);
      console.log(`Active: ${inventoryRole.isActive}`);
      
      const supplierPerm = inventoryRole.permissions.find(p => p.module === 'suppliers');
      if (supplierPerm) {
        console.log(`Supplier Permissions: ${supplierPerm.actions.join(', ')}`);
      } else {
        console.log('❌ No supplier permissions found for inventory role');
      }
    } else {
      console.log('❌ Inventory role not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkRoles();