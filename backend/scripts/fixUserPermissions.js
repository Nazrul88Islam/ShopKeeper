const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const fixUserPermissions = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopkeeper');
    console.log('✅ Connected to MongoDB');

    // Valid modules as per the User model enum
    const validModules = ['orders', 'inventory', 'customers', 'suppliers', 'accounting', 'reports', 'users', 'settings', 'products'];

    // Find all users
    const users = await User.find({}).select('username email role permissions');
    console.log(`👥 Found ${users.length} users to check`);

    let fixedUsers = 0;

    for (const user of users) {
      let needsUpdate = false;
      const validPermissions = [];

      // Check each permission
      for (const permission of user.permissions || []) {
        if (validModules.includes(permission.module)) {
          validPermissions.push(permission);
        } else {
          console.log(`❌ Invalid module found for user ${user.username}: ${permission.module}`);
          needsUpdate = true;
        }
      }

      // If user has invalid permissions, update with role-based permissions
      if (needsUpdate || !user.permissions || user.permissions.length === 0) {
        const rolePermissions = User.getRolePermissions(user.role);
        
        await User.findByIdAndUpdate(user._id, {
          permissions: rolePermissions
        });

        console.log(`✅ Fixed permissions for user: ${user.username} (${user.role})`);
        fixedUsers++;
      } else {
        console.log(`✓ User ${user.username} has valid permissions`);
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`📊 Summary:`);
    console.log(`   • ${users.length} users checked`);
    console.log(`   • ${fixedUsers} users fixed`);

  } catch (error) {
    console.error('❌ Error fixing user permissions:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the fix function
if (require.main === module) {
  fixUserPermissions();
}

module.exports = fixUserPermissions;