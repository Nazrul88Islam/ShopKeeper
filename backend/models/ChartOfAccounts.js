const mongoose = require('mongoose');

const chartOfAccountsSchema = new mongoose.Schema({
  accountCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  accountName: {
    type: String,
    required: [true, 'Account name is required'],
    trim: true
  },
  accountType: {
    type: String,
    enum: [
      'ASSET',
      'LIABILITY', 
      'EQUITY',
      'REVENUE',
      'EXPENSE'
    ],
    required: true
  },
  accountCategory: {
    type: String,
    enum: [
      // Asset Categories
      'CURRENT_ASSET',
      'FIXED_ASSET',
      'INTANGIBLE_ASSET',
      'INVESTMENT',
      
      // Liability Categories
      'CURRENT_LIABILITY',
      'LONG_TERM_LIABILITY',
      
      // Equity Categories
      'OWNER_EQUITY',
      'RETAINED_EARNINGS',
      
      // Revenue Categories
      'OPERATING_REVENUE',
      'NON_OPERATING_REVENUE',
      
      // Expense Categories
      'COST_OF_GOODS_SOLD',
      'OPERATING_EXPENSE',
      'NON_OPERATING_EXPENSE'
    ],
    required: true
  },
  accountSubCategory: {
    type: String,
    enum: [
      // Current Assets
      'CASH_AND_CASH_EQUIVALENTS',
      'ACCOUNTS_RECEIVABLE',
      'INVENTORY',
      'PREPAID_EXPENSES',
      'SHORT_TERM_INVESTMENTS',
      
      // Fixed Assets
      'PROPERTY_PLANT_EQUIPMENT',
      'ACCUMULATED_DEPRECIATION',
      'LAND',
      'BUILDING',
      'EQUIPMENT',
      'VEHICLES',
      
      // Current Liabilities
      'ACCOUNTS_PAYABLE',
      'ACCRUED_EXPENSES',
      'SHORT_TERM_DEBT',
      'TAXES_PAYABLE',
      
      // Long-term Liabilities
      'LONG_TERM_DEBT',
      'MORTGAGE_PAYABLE',
      
      // Revenue
      'SALES_REVENUE',
      'SERVICE_REVENUE',
      'INTEREST_INCOME',
      'OTHER_INCOME',
      
      // Expenses
      'SALARIES_WAGES',
      'RENT_EXPENSE',
      'UTILITIES',
      'OFFICE_SUPPLIES',
      'MARKETING_ADVERTISING',
      'TRAVEL_EXPENSE',
      'PROFESSIONAL_FEES',
      'INSURANCE',
      'DEPRECIATION',
      'INTEREST_EXPENSE',
      'BANK_CHARGES',
      'OTHER_EXPENSES'
    ]
  },
  parentAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChartOfAccounts',
    default: null
  },
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  normalBalance: {
    type: String,
    enum: ['DEBIT', 'CREDIT'],
    required: true
  },
  currentBalance: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isSystemAccount: {
    type: Boolean,
    default: false
  },
  allowPosting: {
    type: Boolean,
    default: true
  },
  requiresDepartment: {
    type: Boolean,
    default: false
  },
  requiresProject: {
    type: Boolean,
    default: false
  },
  taxRelevant: {
    type: Boolean,
    default: false
  },
  bankAccount: {
    isBank: {
      type: Boolean,
      default: false
    },
    bankName: String,
    accountNumber: String,
    routingNumber: String,
    accountType: {
      type: String,
      enum: ['CHECKING', 'SAVINGS', 'MONEY_MARKET', 'CD']
    }
  },
  reporting: {
    includeInBalanceSheet: {
      type: Boolean,
      default: true
    },
    includeInIncomeStatement: {
      type: Boolean,
      default: true
    },
    includeInCashFlow: {
      type: Boolean,
      default: false
    }
  },
  budgetInfo: {
    budgetAmount: {
      type: Number,
      default: 0
    },
    budgetPeriod: {
      type: String,
      enum: ['MONTHLY', 'QUARTERLY', 'YEARLY'],
      default: 'YEARLY'
    }
  },
  tags: [String],
  notes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for account hierarchy path
chartOfAccountsSchema.virtual('hierarchyPath').get(function() {
  // This would be populated through a separate method
  return this.accountCode;
});

// Virtual for balance type
chartOfAccountsSchema.virtual('balanceType').get(function() {
  if (['ASSET', 'EXPENSE'].includes(this.accountType)) {
    return 'DEBIT';
  } else {
    return 'CREDIT';
  }
});

// Indexes
chartOfAccountsSchema.index({ accountCode: 1 });
chartOfAccountsSchema.index({ accountType: 1 });
chartOfAccountsSchema.index({ accountCategory: 1 });
chartOfAccountsSchema.index({ parentAccount: 1 });
chartOfAccountsSchema.index({ isActive: 1 });
chartOfAccountsSchema.index({ level: 1 });
// Add unique index for supplier tags to prevent duplicate accounts
chartOfAccountsSchema.index({ 'tags.2': 1 }, { unique: true, partialFilterExpression: { 'tags.2': { $exists: true } } });

// Pre-save middleware
chartOfAccountsSchema.pre('save', async function(next) {
  if (this.isNew && !this.accountCode) {
    // Generate account code based on type and category
    const typeCode = {
      'ASSET': '1',
      'LIABILITY': '2',
      'EQUITY': '3',
      'REVENUE': '4',
      'EXPENSE': '5'
    }[this.accountType];
    
    const count = await this.constructor.countDocuments({ accountType: this.accountType });
    this.accountCode = `${typeCode}${String(count + 1).padStart(4, '0')}`;
  }
  
  // Set normal balance based on account type
  if (['ASSET', 'EXPENSE'].includes(this.accountType)) {
    this.normalBalance = 'DEBIT';
  } else {
    this.normalBalance = 'CREDIT';
  }
  
  next();
});

// Methods
chartOfAccountsSchema.methods.updateBalance = function(amount, isDebit) {
  if (this.normalBalance === 'DEBIT') {
    this.currentBalance += isDebit ? amount : -amount;
  } else {
    this.currentBalance += isDebit ? -amount : amount;
  }
  return this.save();
};

chartOfAccountsSchema.methods.getChildren = function() {
  return this.constructor.find({ parentAccount: this._id, isActive: true });
};

chartOfAccountsSchema.methods.getHierarchy = async function() {
  const children = await this.getChildren();
  const hierarchy = {
    account: this,
    children: []
  };
  
  for (const child of children) {
    hierarchy.children.push(await child.getHierarchy());
  }
  
  return hierarchy;
};

// Statics
chartOfAccountsSchema.statics.getAccountsByType = function(accountType) {
  return this.find({ accountType, isActive: true }).sort({ accountCode: 1 });
};

chartOfAccountsSchema.statics.initializeDefaultAccounts = async function() {
  const defaultAccounts = [
    // Assets
    { accountCode: '1001', accountName: 'Cash', accountType: 'ASSET', accountCategory: 'CURRENT_ASSET', accountSubCategory: 'CASH_AND_CASH_EQUIVALENTS', isSystemAccount: true },
    { accountCode: '1002', accountName: 'Bank Account', accountType: 'ASSET', accountCategory: 'CURRENT_ASSET', accountSubCategory: 'CASH_AND_CASH_EQUIVALENTS', isSystemAccount: true },
    { accountCode: '1100', accountName: 'Accounts Receivable', accountType: 'ASSET', accountCategory: 'CURRENT_ASSET', accountSubCategory: 'ACCOUNTS_RECEIVABLE', isSystemAccount: true },
    { accountCode: '1200', accountName: 'Inventory', accountType: 'ASSET', accountCategory: 'CURRENT_ASSET', accountSubCategory: 'INVENTORY', isSystemAccount: true },
    
    // Liabilities
    { accountCode: '2001', accountName: 'Accounts Payable', accountType: 'LIABILITY', accountCategory: 'CURRENT_LIABILITY', accountSubCategory: 'ACCOUNTS_PAYABLE', isSystemAccount: true },
    { accountCode: '2100', accountName: 'Accrued Expenses', accountType: 'LIABILITY', accountCategory: 'CURRENT_LIABILITY', accountSubCategory: 'ACCRUED_EXPENSES', isSystemAccount: true },
    
    // Equity
    { accountCode: '3001', accountName: 'Owner Equity', accountType: 'EQUITY', accountCategory: 'OWNER_EQUITY', isSystemAccount: true },
    { accountCode: '3100', accountName: 'Retained Earnings', accountType: 'EQUITY', accountCategory: 'RETAINED_EARNINGS', isSystemAccount: true },
    
    // Revenue
    { accountCode: '4001', accountName: 'Sales Revenue', accountType: 'REVENUE', accountCategory: 'OPERATING_REVENUE', accountSubCategory: 'SALES_REVENUE', isSystemAccount: true },
    { accountCode: '4100', accountName: 'Service Revenue', accountType: 'REVENUE', accountCategory: 'OPERATING_REVENUE', accountSubCategory: 'SERVICE_REVENUE', isSystemAccount: true },
    
    // Expenses
    { accountCode: '5001', accountName: 'Cost of Goods Sold', accountType: 'EXPENSE', accountCategory: 'COST_OF_GOODS_SOLD', isSystemAccount: true },
    { accountCode: '5100', accountName: 'Salaries and Wages', accountType: 'EXPENSE', accountCategory: 'OPERATING_EXPENSE', accountSubCategory: 'SALARIES_WAGES', isSystemAccount: true },
    { accountCode: '5200', accountName: 'Rent Expense', accountType: 'EXPENSE', accountCategory: 'OPERATING_EXPENSE', accountSubCategory: 'RENT_EXPENSE', isSystemAccount: true },
    { accountCode: '5300', accountName: 'Office Supplies', accountType: 'EXPENSE', accountCategory: 'OPERATING_EXPENSE', accountSubCategory: 'OFFICE_SUPPLIES', isSystemAccount: true }
  ];
  
  for (const account of defaultAccounts) {
    const exists = await this.findOne({ accountCode: account.accountCode });
    if (!exists) {
      await this.create(account);
    }
  }
};

module.exports = mongoose.model('ChartOfAccounts', chartOfAccountsSchema);