const mongoose = require('mongoose');
const Role = require('../models/Role');
const User = require('../models/User');

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

// Test creating custom role and assigning to user
const testCustomRoleAssignment = async () => {
  try {
    console.log('\n🧪 Testing Custom Role Assignment...\n');

    // 1. Create a custom role
    console.log('1. Creating a custom role...');
    const customRole = new Role({
      name: 'warehouse_manager',
      displayName: 'Warehouse Manager',
      description: 'Manages warehouse operations and inventory',
      permissions: [
        { module: 'inventory', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'products', actions: ['read', 'update'] },
        { module: 'orders', actions: ['read', 'update'] }
      ],
      isSystem: false,
      isActive: true
    });

    await customRole.save();
    console.log(`✅ Custom role created: ${customRole.displayName} (${customRole.name})`);

    // 2. Test assigning the custom role to a user
    console.log('\n2. Creating user with custom role...');
    
    const testUserData = {
      firstName: 'John',
      lastName: 'Warehouse',
      username: 'johnwarehouse_' + Date.now(),
      email: `johnwarehouse_${Date.now()}@example.com`,
      password: 'testpassword123',
      role: customRole.name
    };

    console.log(`   Creating user with role: ${testUserData.role}`);
    
    // Get permissions for the role
    const permissions = await User.getRolePermissions(testUserData.role);
    console.log(`   Role permissions: ${permissions.length} permission sets`);
    permissions.forEach(perm => {
      console.log(`      ${perm.module}: [${perm.actions.join(', ')}]`);
    });

    // Create the user
    const testUser = new User({
      ...testUserData,
      permissions: permissions
    });

    await testUser.save();
    console.log(`✅ User created successfully: ${testUser.fullName}`);
    console.log(`   User ID: ${testUser._id}`);
    console.log(`   Role: ${testUser.role}`);
    console.log(`   Permissions: ${testUser.permissions.length} sets`);

    // 3. Test updating user with another role
    console.log('\n3. Testing role update...');
    
    // Update to admin role
    testUser.role = 'admin';
    testUser.permissions = await User.getRolePermissions('admin');
    await testUser.save();
    
    console.log(`✅ User role updated to: ${testUser.role}`);
    console.log(`   New permissions: ${testUser.permissions.length} sets`);

    // 4. Verify the role assignment works via API-like flow
    console.log('\n4. Testing API-like role validation...');
    
    const roleValidationTest = async (roleName) => {
      try {
        const role = await Role.findOne({ name: roleName, isActive: true });
        if (!role) {
          throw new Error('Invalid role or role is not active');
        }
        console.log(`   ✅ Role validation passed for: ${roleName}`);
        return true;
      } catch (error) {
        console.log(`   ❌ Role validation failed for: ${roleName} - ${error.message}`);
        return false;
      }
    };

    await roleValidationTest('warehouse_manager');
    await roleValidationTest('admin');
    await roleValidationTest('nonexistent_role');

    // 5. Clean up
    console.log('\n5. Cleaning up test data...');
    await User.findByIdAndDelete(testUser._id);
    await Role.findByIdAndDelete(customRole._id);
    console.log('🧹 Test data cleaned up');

    console.log('\n🎉 Custom role assignment test completed successfully!\n');

  } catch (error) {
    console.error('❌ Test error:', error);
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        console.error(`   ${key}: ${error.errors[key].message}`);
      });
    }
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await testCustomRoleAssignment();
  await mongoose.connection.close();
  console.log('🔗 Database connection closed');
};

main().catch(console.error);