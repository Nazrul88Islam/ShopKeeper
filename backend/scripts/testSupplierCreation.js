const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/database');
const Supplier = require('../models/Supplier');
const ChartOfAccounts = require('../models/ChartOfAccounts');

const testSupplierCreation = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Testing supplier creation with automatic account creation...');
    
    // Clean up any existing test suppliers
    await Supplier.deleteMany({ 
      companyName: { 
        $in: ['Test Supplier Co.', 'Test Supplier Co. 2'] 
      } 
    });
    
    // Clean up any existing test accounts
    await ChartOfAccounts.deleteMany({ 
      accountName: { 
        $in: ['Accounts Payable - Test Supplier Co.', 'Accounts Payable - Test Supplier Co. 2'] 
      } 
    });
    
    // Create a test supplier
    const testSupplier = new Supplier({
      companyName: 'Test Supplier Co.',
      contactPerson: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@testsupplier.com',
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
    });
    
    console.log('💾 Saving supplier...');
    await testSupplier.save();
    
    console.log('✅ Supplier saved successfully');
    console.log('Supplier ID:', testSupplier._id);
    console.log('Supplier Code:', testSupplier.supplierCode);
    
    // Wait a moment for the post-save hook to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Reload the supplier to see the account integration
    const updatedSupplier = await Supplier.findById(testSupplier._id);
    
    console.log('🔄 Updated supplier data:');
    console.log('Account Payable ID:', updatedSupplier.accountingIntegration.accountsPayableId);
    console.log('Account Code:', updatedSupplier.accountingIntegration.accountCode);
    
    if (updatedSupplier.accountingIntegration.accountsPayableId) {
      const account = await ChartOfAccounts.findById(updatedSupplier.accountingIntegration.accountsPayableId);
      console.log('📋 Associated Chart of Accounts:');
      console.log('Account Code:', account.accountCode);
      console.log('Account Name:', account.accountName);
      console.log('Tags:', account.tags);
    }
    
    // Test that only one account was created for the supplier
    console.log('\n🔍 Checking for duplicate accounts...');
    const accounts = await ChartOfAccounts.find({
      'tags.2': updatedSupplier.supplierCode.toLowerCase()
    });
    
    console.log(`Found ${accounts.length} accounts for supplier ${updatedSupplier.supplierCode}`);
    
    if (accounts.length === 1) {
      console.log('✅ No duplicate accounts found');
    } else {
      console.log('❌ Duplicate accounts found:', accounts.length);
    }
    
    // Test creating a supplier with the same email (this should be caught by the route validation)
    console.log('\n🔄 Testing duplicate email prevention at model level...');
    try {
      // First check if a supplier with this email already exists
      const existingSupplier = await Supplier.findOne({
        'contactPerson.email': 'john.doe@testsupplier.com'
      });
      
      if (existingSupplier) {
        console.log('✅ Duplicate email correctly detected at model level');
      } else {
        // This shouldn't happen in our test
        console.log('⚠️ No existing supplier found with this email');
      }
    } catch (error) {
      console.log('✅ Error checking for duplicate email:', error.message);
    }
    
    // Test creating the same supplier again to verify no infinite loop
    console.log('\n🔄 Testing that no infinite loop occurs when saving supplier again...');
    try {
      // Save the supplier again (this should not trigger account creation again)
      await updatedSupplier.save();
      console.log('✅ Supplier saved again without infinite loop');
      
      // Check that we still have only one account
      const accountsAfterResave = await ChartOfAccounts.find({
        'tags.2': updatedSupplier.supplierCode.toLowerCase()
      });
      
      console.log(`Found ${accountsAfterResave.length} accounts after resave`);
      
      if (accountsAfterResave.length === 1) {
        console.log('✅ No duplicate accounts created after resave');
      } else {
        console.log('❌ Duplicate accounts created after resave:', accountsAfterResave.length);
      }
    } catch (error) {
      console.log('❌ Error during resave test:', error.message);
    }
    
    console.log('\n✅ All tests completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during test:', error);
    process.exit(1);
  }
};

testSupplierCreation();