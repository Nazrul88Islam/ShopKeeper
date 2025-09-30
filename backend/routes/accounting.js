const express = require('express');
const router = express.Router();
const ChartOfAccounts = require('../models/ChartOfAccounts');
const JournalEntry = require('../models/JournalEntry');
const { protect } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Accounting API is working' });
});

// Chart of Accounts Routes
router.get('/chart-of-accounts', protect, async (req, res) => {
  try {
    const accounts = await ChartOfAccounts.find({ isActive: true }).sort({ accountCode: 1 });
    res.json({ success: true, data: accounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/chart-of-accounts', protect, [
  body('accountName').notEmpty().withMessage('Account name is required'),
  body('accountType').isIn(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']).withMessage('Invalid account type'),
  body('accountCategory').notEmpty().withMessage('Account category is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const account = new ChartOfAccounts(req.body);
    await account.save();
    res.status(201).json({ success: true, data: account });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/chart-of-accounts/:id', protect, async (req, res) => {
  try {
    const account = await ChartOfAccounts.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }
    res.json({ success: true, data: account });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Journal Entry Routes
router.get('/journal-entries', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, voucherType, dateFrom, dateTo } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (voucherType) query.voucherType = voucherType;
    if (dateFrom && dateTo) {
      query.date = {
        $gte: new Date(dateFrom),
        $lte: new Date(dateTo)
      };
    }

    const journalEntries = await JournalEntry.find(query)
      .populate('entries.account', 'accountCode accountName')
      .populate('createdBy', 'name')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await JournalEntry.countDocuments(query);
    
    res.json({
      success: true,
      data: journalEntries,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/journal-entries', protect, [
  body('description').notEmpty().withMessage('Description is required'),
  body('entries').isArray({ min: 2 }).withMessage('At least 2 entries required'),
  body('entries.*.account').notEmpty().withMessage('Account is required for each entry'),
  body('entries.*.description').notEmpty().withMessage('Description is required for each entry'),
  body('voucherType').isIn(['JOURNAL', 'CASH_RECEIPT', 'CASH_PAYMENT', 'BANK_RECEIPT', 'BANK_PAYMENT', 'PURCHASE', 'SALES', 'ADJUSTMENT', 'OPENING', 'CLOSING']).withMessage('Valid voucher type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Validate entries balance
    const totalDebits = req.body.entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
    const totalCredits = req.body.entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
    
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return res.status(400).json({ 
        success: false, 
        message: 'Journal entry is not balanced - total debits must equal total credits',
        totalDebits,
        totalCredits
      });
    }

    // Verify all accounts exist
    for (const entry of req.body.entries) {
      const account = await ChartOfAccounts.findById(entry.account);
      if (!account) {
        return res.status(400).json({ 
          success: false, 
          message: `Account not found: ${entry.account}` 
        });
      }
      if (!account.allowPosting) {
        return res.status(400).json({ 
          success: false, 
          message: `Posting not allowed to account: ${account.accountName}` 
        });
      }
    }

    const journalEntry = new JournalEntry({
      ...req.body,
      createdBy: req.user.id
    });

    await journalEntry.save();
    await journalEntry.populate([
      { path: 'entries.account', select: 'accountCode accountName accountType normalBalance' },
      { path: 'createdBy', select: 'name email' }
    ]);
    
    res.status(201).json({ success: true, data: journalEntry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single journal entry
router.get('/journal-entries/:id', protect, async (req, res) => {
  try {
    const journalEntry = await JournalEntry.findById(req.params.id)
      .populate([
        { path: 'entries.account', select: 'accountCode accountName accountType normalBalance' },
        { path: 'createdBy', select: 'name email' },
        { path: 'approvedBy', select: 'name email' },
        { path: 'postedBy', select: 'name email' },
        { path: 'reversalEntry', select: 'voucherNumber date' },
        { path: 'reversedEntry', select: 'voucherNumber date' }
      ]);

    if (!journalEntry) {
      return res.status(404).json({ success: false, message: 'Journal entry not found' });
    }

    res.json({ success: true, data: journalEntry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update journal entry (only for DRAFT entries)
router.put('/journal-entries/:id', protect, [
  body('description').optional().notEmpty().withMessage('Description cannot be empty'),
  body('entries').optional().isArray({ min: 2 }).withMessage('At least 2 entries required'),
  body('entries.*.account').optional().notEmpty().withMessage('Account is required for each entry'),
  body('entries.*.description').optional().notEmpty().withMessage('Description is required for each entry')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const journalEntry = await JournalEntry.findById(req.params.id);
    if (!journalEntry) {
      return res.status(404).json({ success: false, message: 'Journal entry not found' });
    }

    if (journalEntry.status !== 'DRAFT') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only draft entries can be updated' 
      });
    }

    // If entries are being updated, validate balance
    if (req.body.entries) {
      const totalDebits = req.body.entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
      const totalCredits = req.body.entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
      
      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        return res.status(400).json({ 
          success: false, 
          message: 'Journal entry is not balanced - total debits must equal total credits',
          totalDebits,
          totalCredits
        });
      }

      // Verify all accounts exist
      for (const entry of req.body.entries) {
        const account = await ChartOfAccounts.findById(entry.account);
        if (!account) {
          return res.status(400).json({ 
            success: false, 
            message: `Account not found: ${entry.account}` 
          });
        }
        if (!account.allowPosting) {
          return res.status(400).json({ 
            success: false, 
            message: `Posting not allowed to account: ${account.accountName}` 
          });
        }
      }
    }

    // Update fields
    Object.assign(journalEntry, req.body);
    await journalEntry.save();
    
    await journalEntry.populate([
      { path: 'entries.account', select: 'accountCode accountName accountType normalBalance' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.json({ success: true, data: journalEntry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete journal entry (only for DRAFT entries)
router.delete('/journal-entries/:id', protect, async (req, res) => {
  try {
    const journalEntry = await JournalEntry.findById(req.params.id);
    if (!journalEntry) {
      return res.status(404).json({ success: false, message: 'Journal entry not found' });
    }

    if (journalEntry.status !== 'DRAFT') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only draft entries can be deleted' 
      });
    }

    await JournalEntry.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Journal entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Post journal entry
router.post('/journal-entries/:id/post', protect, async (req, res) => {
  try {
    const journalEntry = await JournalEntry.findById(req.params.id);
    if (!journalEntry) {
      return res.status(404).json({ success: false, message: 'Journal entry not found' });
    }

    await journalEntry.post(req.user.id);
    
    await journalEntry.populate([
      { path: 'entries.account', select: 'accountCode accountName accountType normalBalance' },
      { path: 'postedBy', select: 'name email' }
    ]);
    
    res.json({ success: true, data: journalEntry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cancel journal entry
router.post('/journal-entries/:id/cancel', protect, [
  body('reason').notEmpty().withMessage('Cancellation reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const journalEntry = await JournalEntry.findById(req.params.id);
    if (!journalEntry) {
      return res.status(404).json({ success: false, message: 'Journal entry not found' });
    }

    await journalEntry.cancel(req.user.id, req.body.reason);
    res.json({ success: true, data: journalEntry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reverse journal entry
router.post('/journal-entries/:id/reverse', protect, [
  body('reason').notEmpty().withMessage('Reversal reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const journalEntry = await JournalEntry.findById(req.params.id);
    if (!journalEntry) {
      return res.status(404).json({ success: false, message: 'Journal entry not found' });
    }

    const reversalEntry = await journalEntry.reverse(req.user.id, req.body.reason);
    res.json({ 
      success: true, 
      data: {
        originalEntry: journalEntry,
        reversalEntry
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Duplicate journal entry
router.post('/journal-entries/:id/duplicate', protect, async (req, res) => {
  try {
    const originalEntry = await JournalEntry.findById(req.params.id)
      .populate('entries.account', 'accountCode accountName');
    
    if (!originalEntry) {
      return res.status(404).json({ success: false, message: 'Journal entry not found' });
    }

    // Create duplicate with new data
    const duplicateData = {
      voucherType: originalEntry.voucherType,
      date: new Date(),
      description: `Copy of ${originalEntry.description}`,
      referenceNumber: req.body.referenceNumber || '',
      entries: originalEntry.entries.map(entry => ({
        account: entry.account._id || entry.account,
        description: entry.description,
        debitAmount: entry.debitAmount,
        creditAmount: entry.creditAmount,
        department: entry.department,
        project: entry.project,
        costCenter: entry.costCenter
      })),
      currency: originalEntry.currency,
      notes: req.body.notes || originalEntry.notes,
      createdBy: req.user.id
    };

    const duplicateEntry = new JournalEntry(duplicateData);
    await duplicateEntry.save();
    
    await duplicateEntry.populate([
      { path: 'entries.account', select: 'accountCode accountName accountType normalBalance' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({ success: true, data: duplicateEntry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get next voucher number
router.get('/next-voucher-number', protect, async (req, res) => {
  try {
    const { voucherType, date } = req.query;
    
    if (!voucherType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Voucher type is required' 
      });
    }

    const nextVoucherNumber = await JournalEntry.getNextVoucherNumber(
      voucherType, 
      date ? new Date(date) : new Date()
    );
    
    res.json({ 
      success: true, 
      data: {
        nextVoucherNumber,
        voucherType,
        date: date || new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get voucher types
router.get('/voucher-types', protect, async (req, res) => {
  try {
    const voucherTypes = [
      { value: 'JOURNAL', label: 'General Journal Entry', prefix: 'JV' },
      { value: 'CASH_RECEIPT', label: 'Cash Receipt Voucher', prefix: 'CR' },
      { value: 'CASH_PAYMENT', label: 'Cash Payment Voucher', prefix: 'CP' },
      { value: 'BANK_RECEIPT', label: 'Bank Receipt Voucher', prefix: 'BR' },
      { value: 'BANK_PAYMENT', label: 'Bank Payment Voucher', prefix: 'BP' },
      { value: 'PURCHASE', label: 'Purchase Voucher', prefix: 'PV' },
      { value: 'SALES', label: 'Sales Voucher', prefix: 'SV' },
      { value: 'ADJUSTMENT', label: 'Adjustment Entry', prefix: 'AJ' },
      { value: 'OPENING', label: 'Opening Balance Entry', prefix: 'OB' },
      { value: 'CLOSING', label: 'Closing Entry', prefix: 'CB' }
    ];
    
    res.json({ success: true, data: voucherTypes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Validate journal entry balance
router.post('/journal-entries/validate-balance', protect, async (req, res) => {
  try {
    const { entries } = req.body;
    
    if (!entries || !Array.isArray(entries)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Entries array is required' 
      });
    }

    const totalDebits = entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
    const totalCredits = entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
    const difference = totalDebits - totalCredits;
    const isBalanced = Math.abs(difference) < 0.01;

    res.json({ 
      success: true, 
      data: {
        totalDebits,
        totalCredits,
        difference,
        isBalanced
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get journal entry statistics
router.get('/journal-entries/stats', protect, async (req, res) => {
  try {
    const { dateFrom, dateTo, voucherType } = req.query;
    
    let matchStage = {};
    if (dateFrom || dateTo) {
      matchStage.date = {};
      if (dateFrom) matchStage.date.$gte = new Date(dateFrom);
      if (dateTo) matchStage.date.$lte = new Date(dateTo);
    }
    if (voucherType) matchStage.voucherType = voucherType;

    const [stats, statusBreakdown, voucherTypeBreakdown] = await Promise.all([
      JournalEntry.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalEntries: { $sum: 1 },
            totalDebits: { $sum: '$totalDebit' },
            totalCredits: { $sum: '$totalCredit' },
            averageAmount: { $avg: '$totalDebit' }
          }
        }
      ]),
      JournalEntry.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalDebit' }
          }
        },
        { $sort: { count: -1 } }
      ]),
      JournalEntry.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$voucherType',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalDebit' }
          }
        },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({ 
      success: true, 
      data: {
        summary: stats[0] || { totalEntries: 0, totalDebits: 0, totalCredits: 0, averageAmount: 0 },
        statusBreakdown,
        voucherTypeBreakdown
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Trial Balance
router.get('/trial-balance', protect, async (req, res) => {
  try {
    const { asOfDate, fiscalYear, fiscalPeriod } = req.query;
    const date = asOfDate ? new Date(asOfDate) : new Date();
    
    const trialBalance = await JournalEntry.getTrialBalance(
      date,
      fiscalYear ? parseInt(fiscalYear) : undefined,
      fiscalPeriod ? parseInt(fiscalPeriod) : undefined
    );
    
    res.json({ success: true, data: trialBalance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// General Ledger
router.get('/general-ledger/:accountId', protect, async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const { accountId } = req.params;

    // Verify account exists
    const account = await ChartOfAccounts.findById(accountId);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    let dateFilter = {};
    if (dateFrom && dateTo) {
      dateFilter = {
        date: {
          $gte: new Date(dateFrom),
          $lte: new Date(dateTo)
        }
      };
    }

    const entries = await JournalEntry.aggregate([
      {
        $match: {
          status: 'POSTED',
          ...dateFilter
        }
      },
      { $unwind: '$entries' },
      {
        $match: {
          'entries.account': account._id
        }
      },
      {
        $project: {
          date: 1,
          voucherNumber: 1,
          voucherType: 1,
          description: '$entries.description',
          debitAmount: '$entries.debitAmount',
          creditAmount: '$entries.creditAmount',
          referenceNumber: 1
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Calculate running balance
    let balance = account.currentBalance;
    const ledgerEntries = entries.map(entry => {
      if (account.normalBalance === 'DEBIT') {
        balance += entry.debitAmount - entry.creditAmount;
      } else {
        balance += entry.creditAmount - entry.debitAmount;
      }
      return {
        ...entry,
        balance
      };
    });

    res.json({ 
      success: true, 
      data: {
        account,
        entries: ledgerEntries
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Financial Reports
router.get('/financial-reports/:reportType', protect, async (req, res) => {
  try {
    const { reportType } = req.params;
    const { dateFrom, dateTo, fiscalYear } = req.query;
    
    let reportData = {};
    
    switch (reportType) {
      case 'income-statement':
        // Simplified income statement logic
        const revenueAccounts = await ChartOfAccounts.find({ accountType: 'REVENUE', isActive: true });
        const expenseAccounts = await ChartOfAccounts.find({ accountType: 'EXPENSE', isActive: true });
        
        reportData = {
          revenue: revenueAccounts.reduce((acc, account) => {
            acc[account.accountName] = account.currentBalance;
            return acc;
          }, {}),
          expenses: expenseAccounts.reduce((acc, account) => {
            acc[account.accountName] = account.currentBalance;
            return acc;
          }, {})
        };
        break;
        
      case 'balance-sheet':
        const assetAccounts = await ChartOfAccounts.find({ accountType: 'ASSET', isActive: true });
        const liabilityAccounts = await ChartOfAccounts.find({ accountType: 'LIABILITY', isActive: true });
        const equityAccounts = await ChartOfAccounts.find({ accountType: 'EQUITY', isActive: true });
        
        reportData = {
          assets: assetAccounts.reduce((acc, account) => {
            acc[account.accountName] = account.currentBalance;
            return acc;
          }, {}),
          liabilities: liabilityAccounts.reduce((acc, account) => {
            acc[account.accountName] = account.currentBalance;
            return acc;
          }, {}),
          equity: equityAccounts.reduce((acc, account) => {
            acc[account.accountName] = account.currentBalance;
            return acc;
          }, {})
        };
        break;
        
      default:
        return res.status(400).json({ success: false, message: 'Invalid report type' });
    }
    
    res.json({ success: true, data: reportData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Initialize default accounts
router.post('/initialize-accounts', protect, async (req, res) => {
  try {
    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can initialize accounts' });
    }
    
    await ChartOfAccounts.initializeDefaultAccounts();
    res.json({ success: true, message: 'Default accounts initialized successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;