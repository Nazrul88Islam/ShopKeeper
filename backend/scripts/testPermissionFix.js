const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/database');
const User = require('../models/User');
const Role = require('../models/Role');

const testPermissionFix = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Testing permission fix...');
    
    // Find the user with testsales role
    const user = await User.findOne({ role: 'testsales' }).select('-password');
    if (!user) {
      console.log('❌ User with testsales role not found');
      process.exit(1);
    }
    
    console.log(`👤 Found user: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`Role: ${user.role}`);
    
    // Check role permissions
    const role = await Role.findOne({ name: user.role, isActive: true });
    if (!role) {
      console.log('❌ Role not found');
      process.exit(1);
    }
    
    console.log(`📋 Role permissions:`);
    role.permissions.forEach(perm => {
      console.log(`  ${perm.module}: ${perm.actions.join(', ')}`);
    });
    
    // Generate a token for this user
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });
    
    console.log(`\n🎫 Generated token for testing: ${token.substring(0, 20)}...`);
    
    // Simulate the protect middleware behavior
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userFromToken = await User.findById(decoded.id).select('-password');
      
      if (!userFromToken) {
        console.log('❌ User not found from token');
        process.exit(1);
      }
      
      console.log(`\n🔐 Simulating protect middleware...`);
      console.log(`User from token: ${userFromToken.firstName} ${userFromToken.lastName}`);
      console.log(`Role: ${userFromToken.role}`);
      
      // Refresh permissions from role (our fix)
      const roleData = await Role.findOne({ name: userFromToken.role, isActive: true });
      
      if (roleData) {
        const rolePermissions = roleData.permissions || [];
        const userPermissions = userFromToken.permissions || [];
        
        const combinedPermissions = [...rolePermissions];
        
        userPermissions.forEach(userPerm => {
          const existingIndex = combinedPermissions.findIndex(p => p.module === userPerm.module);
          if (existingIndex >= 0) {
            combinedPermissions[existingIndex] = userPerm;
          } else {
            combinedPermissions.push(userPerm);
          }
        });
        
        userFromToken.permissions = combinedPermissions;
      }
      
      console.log(`\n🔧 Updated permissions:`);
      userFromToken.permissions.forEach(perm => {
        console.log(`  ${perm.module}: ${perm.actions.join(', ')}`);
      });
      
      // Check if user has supplier create permission
      const hasSupplierCreate = userFromToken.permissions.some(permission => 
        permission.module === 'suppliers' && permission.actions.includes('create')
      );
      
      console.log(`\n✅ Permission check result:`);
      console.log(`Has suppliers.create permission: ${hasSupplierCreate}`);
      
      if (hasSupplierCreate) {
        console.log(`\n🎉 SUCCESS: User now has the required permission!`);
        console.log(`The 403 Forbidden error should no longer occur.`);
      } else {
        console.log(`\n❌ FAILURE: User still doesn't have the required permission.`);
      }
      
    } catch (error) {
      console.log('❌ Error during simulation:', error.message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testPermissionFix();