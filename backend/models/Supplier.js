const mongoose = require('mongoose');
const ChartOfAccounts = require('./ChartOfAccounts');

const supplierSchema = new mongoose.Schema({
  supplierCode: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  contactPerson: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    title: String,
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true
    },
    mobile: String
  },
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: String,
    zipCode: String,
    country: {
      type: String,
      required: true,
      default: 'China'
    }
  },
  businessDetails: {
    businessType: {
      type: String,
      enum: ['manufacturer', 'distributor', 'wholesaler', 'retailer', 'trader', 'agent', 'service_provider'],
      required: true
    },
    businessLicense: String,
    taxId: String,
    establishedYear: Number,
    employeeCount: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '500+']
    }
  },
  products: [{
    category: String,
    subcategory: String,
    description: String,
    minimumOrder: Number,
    leadTime: Number // in days
  }],
  paymentTerms: {
    type: String,
    enum: ['advance', 'on_delivery', 'net15', 'net30', 'net45', 'net60'],
    default: 'advance'
  },
  shippingTerms: {
    type: String,
    enum: ['FOB', 'CIF', 'EXW', 'DDP', 'DDU'],
    default: 'FOB'
  },
  currency: {
    type: String,
    enum: ['USD', 'CNY', 'EUR', 'BDT'],
    default: 'USD'
  },
  creditLimit: {
    type: Number,
    default: 0
  },
  creditBalance: {
    type: Number,
    default: 0
  },
  rating: {
    quality: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    delivery: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    communication: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    overall: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'blacklisted'],
    default: 'active'
  },
  certifications: [{
    name: String,
    issuer: String,
    validUntil: Date,
    documentUrl: String
  }],
  bankDetails: {
    bankName: String,
    accountNumber: String,
    accountName: String,
    swiftCode: String,
    iban: String
  },
  communicationPreferences: {
    primaryMethod: {
      type: String,
      enum: ['email', 'phone', 'whatsapp', 'wechat'],
      default: 'email'
    },
    language: {
      type: String,
      enum: ['en', 'zh', 'ar'],
      default: 'en'
    },
    timezone: String
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalValue: {
    type: Number,
    default: 0
  },
  lastOrderDate: Date,
  notes: String,
  tags: [String],
  assignedBuyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  // NEW: Accounting Integration
  accountingIntegration: {
    accountsPayableId: {
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

// Virtual for contact full name
supplierSchema.virtual('contactFullName').get(function() {
  return `${this.contactPerson.firstName} ${this.contactPerson.lastName}`;
});

// Indexes
supplierSchema.index({ supplierCode: 1 });
supplierSchema.index({ companyName: 1 });
supplierSchema.index({ 'contactPerson.email': 1 });
supplierSchema.index({ status: 1 });
supplierSchema.index({ 'address.country': 1 });
supplierSchema.index({ 'businessDetails.businessType': 1 });

// Pre-save middleware for supplier code and accounting integration
supplierSchema.pre('save', async function(next) {
  try {
    // Generate supplier code if new or if not provided
    if (this.isNew && !this.supplierCode) {
      const count = await this.constructor.countDocuments();
      this.supplierCode = `SUP${String(count + 1).padStart(6, '0')}`;
    }
    
    // Calculate overall rating
    if (this.rating.quality && this.rating.delivery && this.rating.communication) {
      this.rating.overall = Math.round((this.rating.quality + this.rating.delivery + this.rating.communication) / 3);
    }
    
    // NEW: Automatic Chart of Accounts Integration
    // Only create account if this is a new supplier, autoCreateAccount is enabled, and no account exists yet
    if (this.isNew && this.accountingIntegration && this.accountingIntegration.autoCreateAccount && !this.accountingIntegration.accountsPayableId) {
      // We'll create the account after the supplier is saved to avoid circular save issues
      this._shouldCreateAccount = true;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Post-save middleware for accounting integration
supplierSchema.post('save', async function(supplier) {
  try {
    // Create Chart of Accounts entry if needed
    if (supplier._shouldCreateAccount) {
      // Clear the flag to prevent infinite loop
      supplier._shouldCreateAccount = false;
      await supplier.createSupplierAccount();
      // Update the supplier document directly to store the account reference
      // This avoids triggering the save hooks again
      await supplier.constructor.updateOne(
        { _id: supplier._id },
        { 
          $set: { 
            'accountingIntegration.accountsPayableId': supplier.accountingIntegration.accountsPayableId,
            'accountingIntegration.accountCode': supplier.accountingIntegration.accountCode
          }
        }
      );
    }
  } catch (error) {
    console.error('Error in post-save accounting integration:', error);
  }
});

// NEW: Accounting Integration Methods
supplierSchema.methods.createSupplierAccount = async function() {
  try {
    // Check if account already exists to prevent duplicates
    if (this.accountingIntegration.accountsPayableId) {
      return await ChartOfAccounts.findById(this.accountingIntegration.accountsPayableId);
    }
    
    // Ensure we have a supplierCode
    if (!this.supplierCode) {
      // Generate supplier code if not present
      const count = await this.constructor.countDocuments();
      this.supplierCode = `SUP${String(count + 1).padStart(6, '0')}`;
    }
    
    // Check if account already exists by supplier code to prevent duplicates
    const existingAccount = await ChartOfAccounts.findOne({
      'tags': { $in: [this.supplierCode.toLowerCase()] }
    });
    
    if (existingAccount) {
      // Account already exists, link it to this supplier
      this.accountingIntegration.accountsPayableId = existingAccount._id;
      this.accountingIntegration.accountCode = existingAccount.accountCode;
      return existingAccount;
    }
    
    // Generate unique account code for this supplier
    const existingAccounts = await ChartOfAccounts.find({
      accountType: 'LIABILITY',
      accountCategory: 'CURRENT_LIABILITY',
      accountSubCategory: 'ACCOUNTS_PAYABLE'
    }).sort({ accountCode: -1 }).limit(1);
    
    let nextAccountNumber = 2001; // Default starting point for AP accounts
    if (existingAccounts.length > 0) {
      const lastCode = existingAccounts[0].accountCode;
      const lastNumber = parseInt(lastCode.substring(1)); // Remove first digit (2)
      nextAccountNumber = lastNumber + 1;
    }
    
    const accountCode = `2${String(nextAccountNumber).padStart(3, '0')}`;
    
    // Create the supplier-specific Accounts Payable account
    const supplierAccount = new ChartOfAccounts({
      accountCode: accountCode,
      accountName: `Accounts Payable - ${this.companyName}`,
      accountType: 'LIABILITY',
      accountCategory: 'CURRENT_LIABILITY',
      accountSubCategory: 'ACCOUNTS_PAYABLE',
      normalBalance: 'CREDIT',
      description: `Accounts payable for supplier: ${this.companyName} (${this.supplierCode})`,
      isSystemAccount: false,
      allowPosting: true,
      tags: ['supplier', 'accounts-payable', this.supplierCode.toLowerCase()],
      notes: `Auto-created for supplier: ${this.companyName}\nSupplier Code: ${this.supplierCode}\nContact: ${this.contactPerson.firstName} ${this.contactPerson.lastName}\nEmail: ${this.contactPerson.email}`
    });
    
    await supplierAccount.save();
    
    // Link the account to this supplier
    this.accountingIntegration.accountsPayableId = supplierAccount._id;
    this.accountingIntegration.accountCode = accountCode;
    
    return supplierAccount;
  } catch (error) {
    console.error('Error creating supplier account:', error);
    throw error;
  }
};

supplierSchema.methods.getAccountsPayableAccount = async function() {
  if (!this.accountingIntegration.accountsPayableId) {
    return null;
  }
  
  return await ChartOfAccounts.findById(this.accountingIntegration.accountsPayableId);
};

supplierSchema.methods.getAccountBalance = async function() {
  const account = await this.getAccountsPayableAccount();
  return account ? account.currentBalance : 0;
};

supplierSchema.methods.updateAccountBalance = async function(amount, isDebit = false) {
  const account = await this.getAccountsPayableAccount();
  if (account) {
    return await account.updateBalance(amount, isDebit);
  }
  return null;
};

// Static method to create accounts for existing suppliers
supplierSchema.statics.createMissingAccounts = async function() {
  const suppliersWithoutAccounts = await this.find({
    'accountingIntegration.accountsPayableId': { $exists: false },
    'accountingIntegration.autoCreateAccount': { $ne: false }
  });
  
  const results = [];
  for (const supplier of suppliersWithoutAccounts) {
    try {
      const account = await supplier.createSupplierAccount();
      await supplier.save();
      results.push({ supplierId: supplier._id, accountId: account._id, status: 'created' });
    } catch (error) {
      results.push({ supplierId: supplier._id, status: 'error', error: error.message });
    }
  }
  
  return results;
};

// Methods
supplierSchema.methods.updateRating = function(quality, delivery, communication) {
  this.rating.quality = quality;
  this.rating.delivery = delivery;
  this.rating.communication = communication;
  this.rating.overall = Math.round((quality + delivery + communication) / 3);
  return this.save();
};

supplierSchema.methods.canAcceptOrder = function(orderAmount) {
  if (this.status !== 'active') return false;
  if (this.paymentTerms === 'advance') return true;
  return (this.creditBalance + orderAmount) <= this.creditLimit;
};

module.exports = mongoose.model('Supplier', supplierSchema);