const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/database');
const Supplier = require('../models/Supplier');
const ChartOfAccounts = require('../models/ChartOfAccounts');

const cleanupDuplicateAccounts = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Searching for duplicate supplier accounts...');
    
    // Find all ChartOfAccounts entries with supplier tags
    const supplierAccounts = await ChartOfAccounts.find({
      'tags.0': 'supplier',
      'tags.1': 'accounts-payable'
    }).sort({ createdAt: 1 });
    
    console.log(`Found ${supplierAccounts.length} supplier accounts`);
    
    const supplierCodeMap = {};
    const duplicates = [];
    
    // Identify duplicates
    for (const account of supplierAccounts) {
      if (account.tags.length >= 3) {
        const supplierCode = account.tags[2];
        if (supplierCodeMap[supplierCode]) {
          // This is a duplicate
          duplicates.push({
            duplicateId: account._id,
            originalId: supplierCodeMap[supplierCode],
            supplierCode: supplierCode
          });
        } else {
          supplierCodeMap[supplierCode] = account._id;
        }
      }
    }
    
    console.log(`Found ${duplicates.length} duplicate accounts`);
    
    // Remove duplicates and update supplier references
    for (const duplicate of duplicates) {
      console.log(`Removing duplicate account ${duplicate.duplicateId} for supplier ${duplicate.supplierCode}`);
      
      // Update any suppliers that might be referencing the duplicate
      await Supplier.updateMany(
        { 'accountingIntegration.accountsPayableId': duplicate.duplicateId },
        { $set: { 'accountingIntegration.accountsPayableId': duplicate.originalId } }
      );
      
      // Delete the duplicate account
      await ChartOfAccounts.findByIdAndDelete(duplicate.duplicateId);
    }
    
    console.log('✅ Cleanup completed');
    
    // Verify the cleanup
    const remainingAccounts = await ChartOfAccounts.find({
      'tags.0': 'supplier',
      'tags.1': 'accounts-payable'
    });
    
    const finalSupplierCodeMap = {};
    const remainingDuplicates = [];
    
    for (const account of remainingAccounts) {
      if (account.tags.length >= 3) {
        const supplierCode = account.tags[2];
        if (finalSupplierCodeMap[supplierCode]) {
          remainingDuplicates.push(supplierCode);
        } else {
          finalSupplierCodeMap[supplierCode] = true;
        }
      }
    }
    
    if (remainingDuplicates.length === 0) {
      console.log('✅ No duplicates remaining');
    } else {
      console.log(`⚠️  ${remainingDuplicates.length} duplicates still exist:`, remainingDuplicates);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
};

cleanupDuplicateAccounts();