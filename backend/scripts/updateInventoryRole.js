const mongoose = require('mongoose');
require('dotenv').config();

const Role = require('../models/Role');

const updateInventoryRole = async () => {
  try {
    console.log('🔄 Updating inventory role permissions...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find the inventory role
    const inventoryRole = await Role.findOne({ name: 'inventory' });
    
    if (!inventoryRole) {
      console.log('❌ Inventory role not found');
      process.exit(1);
    }

    // Update the permissions to include CREATE, UPDATE, DELETE for suppliers
    inventoryRole.permissions = [
      { module: 'inventory', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'products', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'orders', actions: ['read', 'update'] },
      { module: 'suppliers', actions: ['create', 'read', 'update', 'delete'] }
    ];
    
    await inventoryRole.save();
    console.log('✅ Updated inventory role permissions successfully');
    console.log('📋 New permissions:', JSON.stringify(inventoryRole.permissions, null, 2));
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error updating inventory role:', error);
    process.exit(1);
  }
};

// Run the update if called directly
if (require.main === module) {
  updateInventoryRole();
}

module.exports = updateInventoryRole;