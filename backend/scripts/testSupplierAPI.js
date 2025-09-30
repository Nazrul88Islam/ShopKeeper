const axios = require('axios');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/database');
const User = require('../models/User');

const testSupplierAPI = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Testing supplier API with permission fix...');
    
    // Find the user with testsales role
    const user = await User.findOne({ role: 'testsales' }).select('+password');
    if (!user) {
      console.log('❌ User with testsales role not found');
      process.exit(1);
    }
    
    console.log(`👤 Found user: ${user.firstName} ${user.lastName} (${user.email})`);
    
    // Generate a token for this user (simulating login)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });
    
    console.log(`\n🎫 Generated auth token: ${token.substring(0, 20)}...`);
    
    // Test creating a supplier
    const supplierData = {
      companyName: 'Test Supplier Co.',
      contactPerson: {
        firstName: 'John',
        lastName: 'Doe',
        email: `john.doe${Date.now()}@testsupplier.com`, // Unique email
        phone: '+1234567890'
      },
      address: {
        street: '123 Test Street',
        city: 'Test City',
        country: 'China'
      },
      businessDetails: {
        businessType: 'manufacturer'
      }
    };
    
    console.log('\n🚀 Testing supplier creation...');
    
    try {
      const response = await axios.post('http://localhost:5000/api/suppliers', supplierData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Supplier created successfully!');
      console.log(`Supplier ID: ${response.data.data._id}`);
      console.log(`Supplier Code: ${response.data.data.supplierCode}`);
      
      // Clean up - delete the test supplier
      try {
        await axios.delete(`http://localhost:5000/api/suppliers/${response.data.data._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('🧹 Test supplier cleaned up successfully');
      } catch (deleteError) {
        console.log('⚠️  Could not clean up test supplier:', deleteError.message);
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ API Error (${error.response.status}):`, error.response.data.message);
        
        // Check if it's the permission error we fixed
        if (error.response.status === 403 && error.response.data.message.includes('permission')) {
          console.log('❌ The permission fix may not be working correctly');
        } else if (error.response.status === 403) {
          console.log('❌ User still lacks required role or permissions');
        } else {
          console.log('❌ Other API error occurred');
        }
      } else {
        console.log('❌ Network error:', error.message);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testSupplierAPI();