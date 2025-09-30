const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/shopkeeper', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test role assignment
const testRoleAssignment = async () => {
  try {
    console.log('\n🧪 Testing Role Assignment...\n');

    // 1. Get all available roles
    console.log('1. Getting all available roles...');
    const roles = await Role.find({ isActive: true });
    console.log(`✅ Found ${roles.length} active roles:`);
    roles.forEach(role => {
      console.log(`   - ${role.name} (${role.displayName})`);
    });

    // 2. Test creating a user with a custom role (if any custom roles exist)
    console.log('\n2. Testing user creation with role assignment...');
    
    const customRole = roles.find(role => !role.isSystem);
    if (customRole) {
      console.log(`   Using custom role: ${customRole.name}`);
      
      // Test role permissions lookup
      console.log('   Testing role permissions lookup...');
      const permissions = await User.getRolePermissions(customRole.name);
      console.log(`   ✅ Role permissions: ${permissions.length} permission sets`);
      permissions.forEach(perm => {
        console.log(`      ${perm.module}: [${perm.actions.join(', ')}]`);
      });

      // Create test user data
      const testUserData = {
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser_' + Date.now(),
        email: `testuser_${Date.now()}@example.com`,
        password: 'testpassword123',
        role: customRole.name,
        permissions: permissions
      };

      console.log('\n   Creating test user...');
      console.log(`   Role: ${testUserData.role}`);
      console.log(`   Permissions: ${testUserData.permissions.length} sets`);

      const testUser = new User(testUserData);
      await testUser.save();
      
      console.log(`   ✅ User created successfully with ID: ${testUser._id}`);
      console.log(`   User role: ${testUser.role}`);
      console.log(`   User permissions: ${testUser.permissions.length} sets`);

      // Clean up: delete the test user
      await User.findByIdAndDelete(testUser._id);
      console.log('   🧹 Test user cleaned up');
    } else {
      console.log('   ⚠️ No custom roles found. Testing with system role...');
      
      // Test with system role
      const systemRole = roles.find(role => role.isSystem && role.name === 'sales');
      if (systemRole) {
        const permissions = await User.getRolePermissions(systemRole.name);
        console.log(`   ✅ System role permissions for ${systemRole.name}: ${permissions.length} sets`);
      }
    }

    // 3. Test role validation
    console.log('\n3. Testing role validation...');
    
    try {
      const invalidUser = new User({
        firstName: 'Invalid',
        lastName: 'User',
        username: 'invaliduser_' + Date.now(),
        email: `invaliduser_${Date.now()}@example.com`,
        password: 'testpassword123',
        role: 'nonexistent_role'
      });
      await invalidUser.save();
      console.log('   ❌ Should have failed validation!');
    } catch (error) {
      console.log('   ✅ Role validation working: Invalid role rejected');
      console.log(`   Error message: ${error.message}`);
    }

    // 4. Test all available roles
    console.log('\n4. Testing all available roles...');
    for (const role of roles) {
      try {
        const permissions = await User.getRolePermissions(role.name);
        console.log(`   ✅ ${role.name}: ${permissions.length} permission sets`);
      } catch (error) {
        console.log(`   ❌ ${role.name}: Error getting permissions - ${error.message}`);
      }
    }

    console.log('\n🎉 All role assignment tests completed!\n');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await testRoleAssignment();
  await mongoose.connection.close();
  console.log('🔗 Database connection closed');
};

main().catch(console.error);