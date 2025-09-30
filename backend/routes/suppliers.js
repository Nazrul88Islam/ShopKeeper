const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const ChartOfAccounts = require('../models/ChartOfAccounts');
const { protect, authorize, checkPermission } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Suppliers API is working' });
});

// GET /api/suppliers - Get all suppliers with filtering, searching, and pagination
router.get('/', protect, checkPermission('suppliers', 'read'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      businessType,
      country,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { supplierCode: { $regex: search, $options: 'i' } },
        { 'contactPerson.firstName': { $regex: search, $options: 'i' } },
        { 'contactPerson.lastName': { $regex: search, $options: 'i' } },
        { 'contactPerson.email': { $regex: search, $options: 'i' } }
      ];
    }

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Business type filter
    if (businessType && businessType !== 'all') {
      query['businessDetails.businessType'] = businessType;
    }

    // Country filter
    if (country && country !== 'all') {
      query['address.country'] = country;
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const suppliers = await Supplier.find(query)
      .populate('assignedBuyer', 'firstName lastName email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count for pagination
    const total = await Supplier.countDocuments(query);

    res.json({
      success: true,
      data: suppliers,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/suppliers/:id - Get supplier by ID
router.get('/:id', protect, checkPermission('suppliers', 'read'), async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id)
      .populate('assignedBuyer', 'firstName lastName email');

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    res.json({ success: true, data: supplier });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/suppliers - Create new supplier
router.post('/', protect, checkPermission('suppliers', 'create'), [
  body('companyName').notEmpty().withMessage('Company name is required').trim(),
  body('contactPerson.firstName').notEmpty().withMessage('Contact first name is required').trim(),
  body('contactPerson.lastName').notEmpty().withMessage('Contact last name is required').trim(),
  body('contactPerson.email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('contactPerson.phone').notEmpty().withMessage('Phone number is required').trim(),
  body('address.street').notEmpty().withMessage('Street address is required').trim(),
  body('address.city').notEmpty().withMessage('City is required').trim(),
  body('address.country').notEmpty().withMessage('Country is required').trim(),
  body('businessDetails.businessType')
    .isIn(['manufacturer', 'distributor', 'wholesaler', 'retailer', 'trader', 'agent', 'service_provider'])
    .withMessage('Valid business type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Check if supplier with same email already exists
    const existingSupplier = await Supplier.findOne({
      'contactPerson.email': req.body.contactPerson.email
    });
    
    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: 'Supplier with this email already exists'
      });
    }

    const supplier = new Supplier(req.body);
    await supplier.save();

    // Populate the response
    await supplier.populate('assignedBuyer', 'firstName lastName email');

    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/suppliers/:id - Update supplier
router.put('/:id', protect, checkPermission('suppliers', 'update'), [
  body('companyName').optional().trim(),
  body('contactPerson.firstName').optional().trim(),
  body('contactPerson.lastName').optional().trim(),
  body('contactPerson.email').optional().isEmail().normalizeEmail(),
  body('contactPerson.phone').optional().trim(),
  body('businessDetails.businessType')
    .optional()
    .isIn(['manufacturer', 'distributor', 'wholesaler', 'retailer', 'trader', 'agent', 'service_provider'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Check if email is being updated and already exists
    if (req.body.contactPerson?.email) {
      const existingSupplier = await Supplier.findOne({
        'contactPerson.email': req.body.contactPerson.email,
        _id: { $ne: req.params.id }
      });
      
      if (existingSupplier) {
        return res.status(400).json({
          success: false,
          message: 'Supplier with this email already exists'
        });
      }
    }

    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedBuyer', 'firstName lastName email');

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    res.json({ success: true, data: supplier });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/suppliers/:id/status - Update supplier status
router.patch('/:id/status', protect, checkPermission('suppliers', 'update'), [
  body('status').isIn(['active', 'inactive', 'suspended', 'blacklisted']).withMessage('Valid status is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    ).populate('assignedBuyer', 'firstName lastName email');

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    res.json({
      success: true,
      data: supplier,
      message: `Supplier status updated to ${req.body.status}`
    });
  } catch (error) {
    console.error('Error updating supplier status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/suppliers/:id/rating - Update supplier rating
router.patch('/:id/rating', protect, checkPermission('suppliers', 'update'), [
  body('quality').isFloat({ min: 1, max: 5 }).withMessage('Quality rating must be between 1-5'),
  body('delivery').isFloat({ min: 1, max: 5 }).withMessage('Delivery rating must be between 1-5'),
  body('communication').isFloat({ min: 1, max: 5 }).withMessage('Communication rating must be between 1-5')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    await supplier.updateRating(
      req.body.quality,
      req.body.delivery,
      req.body.communication
    );

    await supplier.populate('assignedBuyer', 'firstName lastName email');

    res.json({ success: true, data: supplier });
  } catch (error) {
    console.error('Error updating supplier rating:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/suppliers/:id - Delete supplier (soft delete by setting status to inactive)
router.delete('/:id', protect, checkPermission('suppliers', 'delete'), async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    // Check if supplier has any active products
    const Product = require('../models/Product');
    const activeProducts = await Product.countDocuments({
      supplier: req.params.id,
      status: 'active'
    });

    if (activeProducts > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete supplier with ${activeProducts} active products. Please deactivate products first.`
      });
    }

    // Soft delete by setting status to inactive
    supplier.status = 'inactive';
    await supplier.save();

    res.json({
      success: true,
      message: 'Supplier deleted successfully',
      data: supplier
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/suppliers/stats/overview - Get supplier statistics
router.get('/stats/overview', protect, checkPermission('suppliers', 'read'), async (req, res) => {
  try {
    const stats = await Supplier.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          inactive: {
            $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] }
          },
          suspended: {
            $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] }
          },
          blacklisted: {
            $sum: { $cond: [{ $eq: ['$status', 'blacklisted'] }, 1, 0] }
          },
          avgRating: { $avg: '$rating.overall' },
          totalValue: { $sum: '$totalValue' }
        }
      }
    ]);

    const businessTypeStats = await Supplier.aggregate([
      {
        $group: {
          _id: '$businessDetails.businessType',
          count: { $sum: 1 }
        }
      }
    ]);

    const countryStats = await Supplier.aggregate([
      {
        $group: {
          _id: '$address.country',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          total: 0,
          active: 0,
          inactive: 0,
          suspended: 0,
          blacklisted: 0,
          avgRating: 0,
          totalValue: 0
        },
        businessTypes: businessTypeStats,
        countries: countryStats
      }
    });
  } catch (error) {
    console.error('Error fetching supplier stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// NEW: Accounting Integration Endpoints

// POST /api/suppliers/setup-accounts - Create Chart of Accounts for all suppliers missing accounts
router.post('/setup-accounts', protect, checkPermission('suppliers', 'update'), async (req, res) => {
  try {
    const results = await Supplier.createMissingAccounts();
    
    const summary = {
      total: results.length,
      created: results.filter(r => r.status === 'created').length,
      errors: results.filter(r => r.status === 'error').length
    };
    
    res.json({
      success: true,
      message: `Account setup completed: ${summary.created} accounts created, ${summary.errors} errors`,
      data: {
        summary,
        details: results
      }
    });
  } catch (error) {
    console.error('Error setting up supplier accounts:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/suppliers/:id/account - Get supplier's Chart of Accounts information
router.get('/:id/account', protect, checkPermission('suppliers', 'read'), async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    
    const account = await supplier.getAccountsPayableAccount();
    const balance = await supplier.getAccountBalance();
    
    res.json({
      success: true,
      data: {
        supplier: {
          _id: supplier._id,
          companyName: supplier.companyName,
          supplierCode: supplier.supplierCode
        },
        account: account ? {
          _id: account._id,
          accountCode: account.accountCode,
          accountName: account.accountName,
          balance: balance,
          isLinked: true
        } : {
          isLinked: false,
          message: 'No Chart of Accounts linked to this supplier'
        }
      }
    });
  } catch (error) {
    console.error('Error fetching supplier account:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/suppliers/:id/create-account - Manually create Chart of Accounts for specific supplier
router.post('/:id/create-account', protect, checkPermission('suppliers', 'update'), async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    
    if (supplier.accountingIntegration.accountsPayableId) {
      return res.status(400).json({
        success: false,
        message: 'Supplier already has a linked Chart of Accounts'
      });
    }
    
    const account = await supplier.createSupplierAccount();
    await supplier.save();
    
    res.json({
      success: true,
      message: 'Chart of Accounts created successfully for supplier',
      data: {
        supplier: {
          _id: supplier._id,
          companyName: supplier.companyName,
          supplierCode: supplier.supplierCode
        },
        account: {
          _id: account._id,
          accountCode: account.accountCode,
          accountName: account.accountName,
          balance: account.currentBalance
        }
      }
    });
  } catch (error) {
    console.error('Error creating supplier account:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/suppliers/accounting/summary - Get accounting summary for all suppliers
router.get('/accounting/summary', protect, checkPermission('suppliers', 'read'), async (req, res) => {
  try {
    const suppliers = await Supplier.find({
      'accountingIntegration.accountsPayableId': { $exists: true }
    }).populate('accountingIntegration.accountsPayableId', 'accountCode accountName currentBalance');
    
    const totalPayables = suppliers.reduce((sum, supplier) => {
      const account = supplier.accountingIntegration.accountsPayableId;
      return sum + (account ? account.currentBalance : 0);
    }, 0);
    
    const suppliersWithAccounts = suppliers.filter(s => s.accountingIntegration.accountsPayableId);
    const totalSuppliers = await Supplier.countDocuments();
    
    res.json({
      success: true,
      data: {
        totalSuppliers,
        suppliersWithAccounts: suppliersWithAccounts.length,
        suppliersWithoutAccounts: totalSuppliers - suppliersWithAccounts.length,
        totalAccountsPayable: totalPayables,
        integrationPercentage: ((suppliersWithAccounts.length / totalSuppliers) * 100).toFixed(1),
        suppliers: suppliersWithAccounts.map(supplier => ({
          _id: supplier._id,
          companyName: supplier.companyName,
          supplierCode: supplier.supplierCode,
          account: {
            accountCode: supplier.accountingIntegration.accountsPayableId.accountCode,
            accountName: supplier.accountingIntegration.accountsPayableId.accountName,
            balance: supplier.accountingIntegration.accountsPayableId.currentBalance
          }
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching supplier accounting summary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;