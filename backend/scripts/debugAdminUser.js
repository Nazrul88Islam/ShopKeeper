const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const debugAdminUser = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopkeeper');
    console.log('✅ Connected to MongoDB');

    const admin = await User.findOne({ username: 'admin' });
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('👤 Admin user details:');
    console.log('   Username:', admin.username);
    console.log('   Email:', admin.email);
    console.log('   Role:', admin.role);
    console.log('   Permissions count:', admin.permissions?.length || 0);
    
    console.log('\n📋 Current permissions:');
    if (admin.permissions && admin.permissions.length > 0) {
      admin.permissions.forEach((perm, index) => {
        console.log(`   ${index + 1}. Module: ${perm.module}, Actions: [${perm.actions.join(', ')}]`);
      });
    } else {
      console.log('   No permissions found');
    }

    console.log('\n🎯 Expected permissions for admin role:');
    const expectedPermissions = User.getRolePermissions('admin');
    expectedPermissions.forEach((perm, index) => {
      console.log(`   ${index + 1}. Module: ${perm.module}, Actions: [${perm.actions.join(', ')}]`);
    });

    // Test saving the user (this might trigger the validation error)
    console.log('\n🧪 Testing user save operation...');
    try {
      admin.lastLogin = new Date();
      await admin.save();
      console.log('✅ User save successful');
    } catch (error) {
      console.log('❌ User save failed:', error.message);
      
      // If save fails, update permissions and try again
      console.log('🔄 Updating permissions and retrying...');
      admin.permissions = User.getRolePermissions('admin');
      await admin.save();
      console.log('✅ User save successful after permission update');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the debug function
if (require.main === module) {
  debugAdminUser();
}

module.exports = debugAdminUser;