const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const verifyAdmin = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopkeeper');
    console.log('✅ Connected to MongoDB');

    console.log('🔍 Finding admin user...');
    const adminUser = await User.findOne({ username: 'admin' }).select('+password');
    
    if (!adminUser) {
      console.log('❌ Admin user not found!');
      process.exit(1);
    }

    console.log('👤 Admin user details:');
    console.log('   ID:', adminUser._id);
    console.log('   Username:', adminUser.username);
    console.log('   Email:', adminUser.email);
    console.log('   Role:', adminUser.role);
    console.log('   Active:', adminUser.isActive);
    console.log('   Email Verified:', adminUser.emailVerified);
    console.log('   Login Attempts:', adminUser.loginAttempts);
    console.log('   Lock Until:', adminUser.lockUntil);
    console.log('   Last Login:', adminUser.lastLogin);
    console.log('   Password Hash Length:', adminUser.password ? adminUser.password.length : 0);
    
    // Test password verification
    console.log('🔐 Testing password verification...');
    const testPasswords = ['admin123', 'admin', 'Admin123'];
    
    for (const testPassword of testPasswords) {
      try {
        const isValid = await bcrypt.compare(testPassword, adminUser.password);
        console.log(`   Password "${testPassword}":`, isValid ? '✅ VALID' : '❌ INVALID');
        if (isValid) break;
      } catch (error) {
        console.log(`   Password "${testPassword}":`, '❌ ERROR -', error.message);
      }
    }
    
    // Test using the model method
    console.log('🔐 Testing model method...');
    try {
      const isValidMethod = await adminUser.correctPassword('admin123', adminUser.password);
      console.log('   Model method result:', isValidMethod ? '✅ VALID' : '❌ INVALID');
    } catch (error) {
      console.log('   Model method error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

verifyAdmin();