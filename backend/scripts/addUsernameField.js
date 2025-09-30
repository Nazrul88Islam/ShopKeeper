const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Migration script to add username field to existing users
const addUsernameToExistingUsers = async () => {
  try {
    console.log('Starting username migration...');
    
    // Find all users without username field
    const usersWithoutUsername = await User.find({ username: { $exists: false } });
    
    console.log(`Found ${usersWithoutUsername.length} users without username`);
    
    for (let user of usersWithoutUsername) {
      // Generate username from email (before @ symbol)
      let baseUsername = user.email.split('@')[0];
      
      // Remove special characters and make lowercase
      baseUsername = baseUsername.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
      
      // Ensure username is at least 3 characters
      if (baseUsername.length < 3) {
        baseUsername = `user${baseUsername}`;
      }
      
      // Check if username already exists and make it unique
      let username = baseUsername;
      let counter = 1;
      
      while (await User.findOne({ username })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }
      
      // Update user with new username
      await User.findByIdAndUpdate(user._id, { username });
      console.log(`Updated user ${user.email} with username: ${username}`);
    }
    
    console.log('Username migration completed successfully!');
    
    // Create a default admin user if no admin exists
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('Creating default admin user...');
      
      const admin = new User({
        firstName: 'Admin',
        lastName: 'User',
        username: 'admin',
        email: 'admin@shopkeeper.com',
        password: 'admin123',
        role: 'admin',
        permissions: User.getRolePermissions('admin'),
        isActive: true,
        emailVerified: true
      });
      
      await admin.save();
      console.log('Default admin user created with username: admin, password: admin123');
    }
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected');
  }
};

// Run migration
const runMigration = async () => {
  await connectDB();
  await addUsernameToExistingUsers();
};

// Execute if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { addUsernameToExistingUsers };