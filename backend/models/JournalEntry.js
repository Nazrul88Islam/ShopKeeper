const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema({
  voucherNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  voucherType: {
    type: String,
    enum: [
      'JOURNAL',      // General Journal Entry
      'CASH_RECEIPT', // Cash Receipt Voucher
      'CASH_PAYMENT', // Cash Payment Voucher
      'BANK_RECEIPT', // Bank Receipt Voucher
      'BANK_PAYMENT', // Bank Payment Voucher
      'PURCHASE',     // Purchase Voucher
      'SALES',        // Sales Voucher
      'ADJUSTMENT',   // Adjustment Entry
      'OPENING',      // Opening Balance Entry
      'CLOSING'       // Closing Entry
    ],
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  referenceNumber: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: 500
  },
  
  // Journal Entry Lines (Debits and Credits)
  entries: [{
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChartOfAccounts',
      required: true
    },
    description: {
      type: String,
      required: true
    },
    debitAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    creditAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    department: {
      type: String,
      trim: true
    },
    project: {
      type: String,
      trim: true
    },
    costCenter: {
      type: String,
      trim: true
    }
  }],
  
  // Financial totals
  totalDebit: {
    type: Number,
    required: true,
    min: 0
  },
  totalCredit: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Status and approval
  status: {
    type: String,
    enum: ['DRAFT', 'POSTED', 'REVERSED', 'CANCELLED'],
    default: 'DRAFT'
  },
  
  // Audit trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  postedDate: Date,
  approvalDate: Date,
  
  // Reversal information
  reversalEntry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JournalEntry'
  },
  reversedEntry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JournalEntry'
  },
  reversalReason: String,
  reversalDate: Date,
  
  // Source document information
  sourceDocument: {
    type: {
      type: String,
      enum: ['ORDER', 'INVOICE', 'RECEIPT', 'PAYMENT', 'MANUAL', 'SYSTEM']
    },
    id: String,
    number: String
  },
  
  // Additional information
  fiscalYear: {
    type: Number,
    required: true
  },
  fiscalPeriod: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  currency: {
    type: String,
    enum: ['BDT', 'USD', 'EUR', 'CNY'],
    default: 'BDT'
  },
  exchangeRate: {
    type: Number,
    default: 1
  },
  
  // Workflow
  requiresApproval: {
    type: Boolean,
    default: false
  },
  approvalWorkflow: {
    level1: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      approved: Boolean,
      date: Date,
      comments: String
    },
    level2: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      approved: Boolean,
      date: Date,
      comments: String
    }
  },
  
  // Attachments
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  tags: [String],
  notes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
journalEntrySchema.virtual('isBalanced').get(function() {
  return Math.abs(this.totalDebit - this.totalCredit) < 0.01; // Allow for minor rounding differences
});

journalEntrySchema.virtual('canBePosted').get(function() {
  return this.status === 'DRAFT' && this.isBalanced && this.entries.length >= 2;
});

journalEntrySchema.virtual('isReversible').get(function() {
  return this.status === 'POSTED' && !this.reversalEntry;
});

// Indexes
journalEntrySchema.index({ voucherNumber: 1 });
journalEntrySchema.index({ voucherType: 1 });
journalEntrySchema.index({ date: 1 });
journalEntrySchema.index({ status: 1 });
journalEntrySchema.index({ fiscalYear: 1, fiscalPeriod: 1 });
journalEntrySchema.index({ 'entries.account': 1 });
journalEntrySchema.index({ createdBy: 1 });
journalEntrySchema.index({ 'sourceDocument.type': 1, 'sourceDocument.id': 1 });

// Pre-save middleware
journalEntrySchema.pre('save', async function(next) {
  // Generate voucher number if not provided
  if (this.isNew && !this.voucherNumber) {
    // Get current date for month/year suffix
    const entryDate = new Date(this.date);
    const month = String(entryDate.getMonth() + 1).padStart(2, '0');
    const year = String(entryDate.getFullYear()).slice(-2);
    const monthYearSuffix = `${month}-${year}`;
    
    // Get voucher type prefix
    const typePrefix = {
      'JOURNAL': 'JV',
      'CASH_RECEIPT': 'CR',
      'CASH_PAYMENT': 'CP',
      'BANK_RECEIPT': 'BR',
      'BANK_PAYMENT': 'BP',
      'PURCHASE': 'PV',
      'SALES': 'SV',
      'ADJUSTMENT': 'AJ',
      'OPENING': 'OB',
      'CLOSING': 'CB'
    }[this.voucherType];
    
    // Count existing vouchers of same type in current month/year
    const startOfMonth = new Date(entryDate.getFullYear(), entryDate.getMonth(), 1);
    const endOfMonth = new Date(entryDate.getFullYear(), entryDate.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const count = await this.constructor.countDocuments({
      voucherType: this.voucherType,
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    });
    
    // Generate voucher number: JV-001/09-25
    const sequenceNumber = String(count + 1).padStart(3, '0');
    this.voucherNumber = `${typePrefix}-${sequenceNumber}/${monthYearSuffix}`;
  }
  
  // Calculate totals
  this.totalDebit = this.entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
  this.totalCredit = this.entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
  
  // Set fiscal year and period based on date
  const entryDate = new Date(this.date);
  this.fiscalYear = entryDate.getFullYear();
  this.fiscalPeriod = entryDate.getMonth() + 1;
  
  // Validate that entries have either debit or credit, not both
  for (const entry of this.entries) {
    if ((entry.debitAmount > 0 && entry.creditAmount > 0) || 
        (entry.debitAmount === 0 && entry.creditAmount === 0)) {
      return next(new Error('Each entry must have either a debit or credit amount, but not both or neither'));
    }
  }
  
  next();
});

// Methods
journalEntrySchema.methods.validateBalance = function() {
  const totalDebits = this.entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
  const totalCredits = this.entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
  
  return Math.abs(totalDebits - totalCredits) < 0.01;
};

journalEntrySchema.methods.post = async function(userId) {
  if (this.status !== 'DRAFT') {
    throw new Error('Only draft entries can be posted');
  }
  
  if (!this.validateBalance()) {
    throw new Error('Entry is not balanced - total debits must equal total credits');
  }
  
  if (this.entries.length < 2) {
    throw new Error('Entry must have at least 2 lines');
  }
  
  // Update account balances
  const ChartOfAccounts = mongoose.model('ChartOfAccounts');
  
  for (const entry of this.entries) {
    const account = await ChartOfAccounts.findById(entry.account);
    if (!account) {
      throw new Error(`Account not found: ${entry.account}`);
    }
    
    if (!account.allowPosting) {
      throw new Error(`Posting not allowed to account: ${account.accountName}`);
    }
    
    const isDebit = entry.debitAmount > 0;
    const amount = isDebit ? entry.debitAmount : entry.creditAmount;
    
    await account.updateBalance(amount, isDebit);
  }
  
  // Update entry status
  this.status = 'POSTED';
  this.postedBy = userId;
  this.postedDate = new Date();
  
  return this.save();
};

journalEntrySchema.methods.reverse = async function(userId, reason) {
  if (this.status !== 'POSTED') {
    throw new Error('Only posted entries can be reversed');
  }
  
  if (this.reversalEntry) {
    throw new Error('Entry has already been reversed');
  }
  
  // Create reversal entry
  const reversalData = {
    voucherType: this.voucherType,
    date: new Date(),
    description: `Reversal of ${this.voucherNumber}: ${reason}`,
    entries: this.entries.map(entry => ({
      account: entry.account,
      description: `Reversal: ${entry.description}`,
      debitAmount: entry.creditAmount, // Swap debit and credit
      creditAmount: entry.debitAmount,
      department: entry.department,
      project: entry.project,
      costCenter: entry.costCenter
    })),
    createdBy: userId,
    reversedEntry: this._id,
    reversalReason: reason,
    reversalDate: new Date(),
    fiscalYear: new Date().getFullYear(),
    fiscalPeriod: new Date().getMonth() + 1
  };
  
  const JournalEntry = this.constructor;
  const reversalEntry = new JournalEntry(reversalData);
  await reversalEntry.post(userId);
  
  // Update original entry
  this.reversalEntry = reversalEntry._id;
  this.status = 'REVERSED';
  
  return this.save();
};

journalEntrySchema.methods.cancel = function(userId, reason) {
  if (this.status !== 'DRAFT') {
    throw new Error('Only draft entries can be cancelled');
  }
  
  this.status = 'CANCELLED';
  this.notes = (this.notes || '') + `\nCancelled by user: ${reason}`;
  
  return this.save();
};

// Static methods
journalEntrySchema.statics.getNextVoucherNumber = async function(voucherType, date = new Date()) {
  // Get current date for month/year suffix
  const entryDate = new Date(date);
  const month = String(entryDate.getMonth() + 1).padStart(2, '0');
  const year = String(entryDate.getFullYear()).slice(-2);
  const monthYearSuffix = `${month}-${year}`;
  
  // Get voucher type prefix
  const typePrefix = {
    'JOURNAL': 'JV',
    'CASH_RECEIPT': 'CR',
    'CASH_PAYMENT': 'CP',
    'BANK_RECEIPT': 'BR',
    'BANK_PAYMENT': 'BP',
    'PURCHASE': 'PV',
    'SALES': 'SV',
    'ADJUSTMENT': 'AJ',
    'OPENING': 'OB',
    'CLOSING': 'CB'
  }[voucherType];
  
  // Count existing vouchers of same type in current month/year
  const startOfMonth = new Date(entryDate.getFullYear(), entryDate.getMonth(), 1);
  const endOfMonth = new Date(entryDate.getFullYear(), entryDate.getMonth() + 1, 0, 23, 59, 59, 999);
  
  const count = await this.countDocuments({
    voucherType: voucherType,
    date: {
      $gte: startOfMonth,
      $lte: endOfMonth
    }
  });
  
  // Generate next voucher number: JV-001/09-25
  const sequenceNumber = String(count + 1).padStart(3, '0');
  return `${typePrefix}-${sequenceNumber}/${monthYearSuffix}`;
};

journalEntrySchema.statics.getTrialBalance = async function(asOfDate, fiscalYear, fiscalPeriod) {
  const ChartOfAccounts = mongoose.model('ChartOfAccounts');
  const accounts = await ChartOfAccounts.find({ isActive: true }).sort({ accountCode: 1 });
  
  const trialBalance = [];
  
  for (const account of accounts) {
    // Calculate balance up to the specified date
    const entries = await this.aggregate([
      {
        $match: {
          status: 'POSTED',
          date: { $lte: asOfDate },
          ...(fiscalYear && { fiscalYear }),
          ...(fiscalPeriod && { fiscalPeriod })
        }
      },
      { $unwind: '$entries' },
      { $match: { 'entries.account': account._id } },
      {
        $group: {
          _id: '$entries.account',
          totalDebit: { $sum: '$entries.debitAmount' },
          totalCredit: { $sum: '$entries.creditAmount' }
        }
      }
    ]);
    
    const entry = entries[0] || { totalDebit: 0, totalCredit: 0 };
    let balance = entry.totalDebit - entry.totalCredit;
    
    // Adjust balance based on account type
    if (['LIABILITY', 'EQUITY', 'REVENUE'].includes(account.accountType)) {
      balance = -balance;
    }
    
    trialBalance.push({
      account: account,
      debitTotal: entry.totalDebit,
      creditTotal: entry.totalCredit,
      balance: balance
    });
  }
  
  return trialBalance;
};

module.exports = mongoose.model('JournalEntry', journalEntrySchema);