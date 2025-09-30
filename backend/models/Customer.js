const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customerCode: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  alternatePhone: {
    type: String,
    trim: true
  },
  companyName: {
    type: String,
    trim: true
  },
  customerType: {
    type: String,
    enum: ['individual', 'business'],
    default: 'individual'
  },
  billingAddress: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true,
      default: 'Bangladesh'
    }
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  additionalAddresses: [{
    label: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    isDefault: Boolean
  }],
  taxId: {
    type: String,
    trim: true
  },
  creditLimit: {
    type: Number,
    default: 0
  },
  creditBalance: {
    type: Number,
    default: 0
  },
  paymentTerms: {
    type: String,
    enum: ['cash', 'net15', 'net30', 'net45', 'net60'],
    default: 'cash'
  },
  discountRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  lastOrderDate: {
    type: Date
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  preferredLanguage: {
    type: String,
    default: 'en'
  },
  marketingOptIn: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  tags: [String],
  assignedSalesRep: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  avatar: {
    type: String
  },
  // NEW: Accounting Integration
  accountingIntegration: {
    accountsReceivableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChartOfAccounts',
      index: true
    },
    autoCreateAccount: {
      type: Boolean,
      default: true
    },
    accountCode: {
      type: String,
      unique: true,
      sparse: true // Allows null values but ensures uniqueness when present
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
customerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for display name (company or full name)
customerSchema.virtual('displayName').get(function() {
  return this.companyName || this.fullName;
});

// Indexes
customerSchema.index({ customerCode: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ assignedSalesRep: 1 });
customerSchema.index({ 'billingAddress.city': 1 });
customerSchema.index({ customerType: 1 });

// Pre-save middleware to generate customer code
customerSchema.pre('save', async function(next) {
  if (this.isNew) {
    if (!this.customerCode) {
      // Auto-generate customer code by finding the latest one
      const latestCustomer = await this.constructor.findOne(
        { customerCode: { $regex: /^CUST\d+$/ } },
        { customerCode: 1 }
      ).sort({ customerCode: -1 }).exec();
      
      let nextNumber = 1;
      if (latestCustomer && latestCustomer.customerCode) {
        // Extract number from latest customer code (e.g., "CUST0005" -> 5)
        const match = latestCustomer.customerCode.match(/^CUST(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      // Generate new customer code with proper padding
      this.customerCode = `CUST${String(nextNumber).padStart(4, '0')}`;
    } else {
      // Validate provided customer code
      const existingCustomer = await this.constructor.findOne({ 
        customerCode: this.customerCode,
        _id: { $ne: this._id }
      });
      if (existingCustomer) {
        const error = new Error(`Customer code '${this.customerCode}' already exists`);
        error.name = 'ValidationError';
        return next(error);
      }
    }
  }
  
  // NEW: Track name changes for account name update
  if (!this.isNew) {
    // Check if name fields are being modified
    if (this.isModified('firstName') || this.isModified('lastName') || this.isModified('companyName')) {
      this._nameChanged = true;
    }
  }
  
  // NEW: Automatic Chart of Accounts Integration
  // Only create account if this is a new customer, autoCreateAccount is enabled, and no account exists yet
  if (this.isNew && this.accountingIntegration && this.accountingIntegration.autoCreateAccount && !this.accountingIntegration.accountsReceivableId) {
    // We'll create the account after the customer is saved to avoid circular save issues
    this._shouldCreateAccount = true;
  }
  
  next();
});

// Post-save middleware for accounting integration
customerSchema.post('save', async function(doc) {
  try {
    // Create Chart of Accounts entry if needed
    if (doc._shouldCreateAccount) {
      // Clear the flag to prevent infinite loop
      doc._shouldCreateAccount = false;
      await doc.createCustomerAccount();
      // Update the customer document directly to store the account reference
      // This avoids triggering the save hooks again
      await doc.constructor.updateOne(
        { _id: doc._id },
        { 
          $set: { 
            'accountingIntegration.accountsReceivableId': doc.accountingIntegration.accountsReceivableId,
            'accountingIntegration.accountCode': doc.accountingIntegration.accountCode
          }
        }
      );
    }
    
    // NEW: Update account name when customer name changes
    if (!doc.isNew && doc.accountingIntegration && doc.accountingIntegration.accountsReceivableId && doc._nameChanged) {
      const ChartOfAccounts = require('./ChartOfAccounts');
      const accountName = `Accounts Receivable - ${doc.fullName || doc.companyName}`;
      
      // Update the account name
      await ChartOfAccounts.findByIdAndUpdate(
        doc.accountingIntegration.accountsReceivableId,
        { accountName }
      );
      
      // Clear the flag
      doc._nameChanged = false;
    }
  } catch (error) {
    console.error('Error in post-save accounting integration:', error);
  }
});

// NEW: Accounting Integration Methods
customerSchema.methods.createCustomerAccount = async function() {
  const ChartOfAccounts = require('./ChartOfAccounts');
  
  try {
    // Check if account already exists to prevent duplicates
    if (this.accountingIntegration.accountsReceivableId) {
      return await ChartOfAccounts.findById(this.accountingIntegration.accountsReceivableId);
    }
    
    // Ensure we have a customerCode
    if (!this.customerCode) {
      // Generate customer code if not present
      const latestCustomer = await this.constructor.findOne(
        { customerCode: { $regex: /^CUST\d+$/ } },
        { customerCode: 1 }
      ).sort({ customerCode: -1 }).exec();
      
      let nextNumber = 1;
      if (latestCustomer && latestCustomer.customerCode) {
        const match = latestCustomer.customerCode.match(/^CUST(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      this.customerCode = `CUST${String(nextNumber).padStart(4, '0')}`;
    }
    
    // Check if account already exists by customer code to prevent duplicates
    const existingAccount = await ChartOfAccounts.findOne({
      'tags': { $in: [this.customerCode.toLowerCase()] }
    });
    
    if (existingAccount) {
      // Account already exists, link it to this customer
      this.accountingIntegration.accountsReceivableId = existingAccount._id;
      this.accountingIntegration.accountCode = existingAccount.accountCode;
      return existingAccount;
    }
    
    // Generate unique account code for this customer
    const existingAccounts = await ChartOfAccounts.find({
      accountType: 'ASSET',
      accountCategory: 'CURRENT_ASSET',
      accountSubCategory: 'ACCOUNTS_RECEIVABLE'
    }).sort({ accountCode: -1 }).limit(1);
    
    let nextAccountNumber = 1001; // Default starting point for AR accounts
    if (existingAccounts.length > 0) {
      const lastCode = existingAccounts[0].accountCode;
      const lastNumber = parseInt(lastCode.substring(1)); // Remove first digit (1)
      nextAccountNumber = lastNumber + 1;
    }
    
    const accountCode = `1${String(nextAccountNumber).padStart(3, '0')}`;
    
    // Create the customer-specific Accounts Receivable account
    const customerAccount = new ChartOfAccounts({
      accountCode: accountCode,
      accountName: `Accounts Receivable - ${this.fullName || this.companyName}`,
      accountType: 'ASSET',
      accountCategory: 'CURRENT_ASSET',
      accountSubCategory: 'ACCOUNTS_RECEIVABLE',
      normalBalance: 'DEBIT',
      description: `Accounts receivable for customer: ${this.fullName || this.companyName} (${this.customerCode})`,
      isSystemAccount: false,
      allowPosting: true,
      tags: ['customer', 'accounts-receivable', this.customerCode.toLowerCase()],
      notes: `Auto-created for customer: ${this.fullName || this.companyName}\nCustomer Code: ${this.customerCode}\nEmail: ${this.email}\nPhone: ${this.phone}`
    });
    
    await customerAccount.save();
    
    // Link the account to this customer
    this.accountingIntegration.accountsReceivableId = customerAccount._id;
    this.accountingIntegration.accountCode = accountCode;
    
    return customerAccount;
  } catch (error) {
    console.error('Error creating customer account:', error);
    throw error;
  }
};

customerSchema.methods.getAccountsReceivableAccount = async function() {
  const ChartOfAccounts = require('./ChartOfAccounts');
  
  if (!this.accountingIntegration.accountsReceivableId) {
    return null;
  }
  
  return await ChartOfAccounts.findById(this.accountingIntegration.accountsReceivableId);
};

customerSchema.methods.getAccountBalance = async function() {
  const account = await this.getAccountsReceivableAccount();
  return account ? account.currentBalance : 0;
};

customerSchema.methods.updateAccountBalance = async function(amount, isDebit = true) {
  const account = await this.getAccountsReceivableAccount();
  if (account) {
    return await account.updateBalance(amount, isDebit);
  }
  return null;
};

// NEW: Check if customer has any journal entries
customerSchema.methods.hasJournalEntries = async function() {
  const JournalEntry = require('./JournalEntry');
  
  if (!this.accountingIntegration.accountsReceivableId) {
    return false;
  }
  
  // Check if any journal entries reference this account
  const journalEntryCount = await JournalEntry.countDocuments({
    'entries.account': this.accountingIntegration.accountsReceivableId
  });
  
  return journalEntryCount > 0;
};

// NEW: Delete associated accounting account
customerSchema.methods.deleteAccount = async function() {
  const ChartOfAccounts = require('./ChartOfAccounts');
  
  if (!this.accountingIntegration.accountsReceivableId) {
    return;
  }
  
  // Check if there are any journal entries
  const hasEntries = await this.hasJournalEntries();
  if (hasEntries) {
    throw new Error('Cannot delete customer account with existing journal entries');
  }
  
  // Delete the account
  await ChartOfAccounts.findByIdAndDelete(this.accountingIntegration.accountsReceivableId);
};

// Static method to create accounts for existing customers
customerSchema.statics.createMissingAccounts = async function() {
  const customersWithoutAccounts = await this.find({
    'accountingIntegration.accountsReceivableId': { $exists: false },
    'accountingIntegration.autoCreateAccount': { $ne: false }
  });
  
  const results = [];
  for (const customer of customersWithoutAccounts) {
    try {
      const account = await customer.createCustomerAccount();
      // Note: We don't save the customer here to avoid triggering save hooks
      results.push({ customerId: customer._id, accountId: account._id, status: 'created' });
    } catch (error) {
      results.push({ customerId: customer._id, status: 'error', error: error.message });
    }
  }
  
  return results;
};

// Methods
customerSchema.methods.updateCreditBalance = function(amount) {
  this.creditBalance += amount;
  return this.save();
};

customerSchema.methods.canPlaceOrder = function(orderAmount) {
  if (this.status !== 'active') return false;
  if (this.paymentTerms === 'cash') return true;
  return (this.creditBalance + orderAmount) <= this.creditLimit;
};

module.exports = mongoose.model('Customer', customerSchema);