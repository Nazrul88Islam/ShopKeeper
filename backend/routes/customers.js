const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const ChartOfAccounts = require('../models/ChartOfAccounts');
const { protect, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Customers API is working',
    timestamp: new Date().toISOString()
  });
});

// GET /api/customers - Get all customers with filtering, searching, and pagination
router.get('/', protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      customerType,
      city,
      state,
      country,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { customerCode: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ];
    }

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Customer type filter
    if (customerType && customerType !== 'all') {
      query.customerType = customerType;
    }

    // Location filters
    if (city && city !== 'all') {
      query['billingAddress.city'] = city;
    }
    if (state && state !== 'all') {
      query['billingAddress.state'] = state;
    }
    if (country && country !== 'all') {
      query['billingAddress.country'] = country;
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const customers = await Customer.find(query)
      .populate('assignedSalesRep', 'firstName lastName email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count for pagination
    const total = await Customer.countDocuments(query);

    res.json({
      success: true,
      data: customers,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/customers/:id - Get customer by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('assignedSalesRep', 'firstName lastName email');

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/customers - Create new customer
router.post('/', protect, authorize('admin', 'manager', 'sales', 'customer_service'), [
  body('customerCode').optional().trim().isLength({ min: 3, max: 20 }).withMessage('Customer code must be 3-20 characters'),
  body('firstName').notEmpty().withMessage('First name is required').trim(),
  body('lastName').notEmpty().withMessage('Last name is required').trim(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').notEmpty().withMessage('Phone number is required').trim(),
  body('customerType').isIn(['individual', 'business']).withMessage('Valid customer type is required'),
  body('billingAddress.street').notEmpty().withMessage('Billing street address is required').trim(),
  body('billingAddress.city').notEmpty().withMessage('Billing city is required').trim(),
  body('billingAddress.state').notEmpty().withMessage('Billing state is required').trim(),
  body('billingAddress.zipCode').notEmpty().withMessage('Billing zip code is required').trim(),
  body('billingAddress.country').notEmpty().withMessage('Billing country is required').trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Check if customer with same email already exists
    const existingCustomer = await Customer.findOne({ email: req.body.email });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this email already exists'
      });
    }

    // Check if customer code is provided and already exists
    if (req.body.customerCode) {
      const existingCustomerCode = await Customer.findOne({ customerCode: req.body.customerCode });
      if (existingCustomerCode) {
        return res.status(400).json({
          success: false,
          message: `Customer code '${req.body.customerCode}' already exists`
        });
      }
    }

    const customer = new Customer(req.body);
    await customer.save();

    // Populate the response
    await customer.populate('assignedSalesRep', 'firstName lastName email');

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/customers/:id - Update customer
router.put('/:id', protect, authorize('admin', 'manager', 'sales', 'customer_service'), [
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('customerType').optional().isIn(['individual', 'business']),
  body('paymentTerms').optional().isIn(['cash', 'net15', 'net30', 'net45', 'net60']),
  body('status').optional().isIn(['active', 'inactive', 'suspended'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Check if email is being updated and already exists
    if (req.body.email) {
      const existingCustomer = await Customer.findOne({
        email: req.body.email,
        _id: { $ne: req.params.id }
      });
      
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Customer with this email already exists'
        });
      }
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedSalesRep', 'firstName lastName email');

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/customers/:id/status - Update customer status
router.patch('/:id/status', protect, authorize('admin', 'manager', 'sales'), [
  body('status').isIn(['active', 'inactive', 'suspended']).withMessage('Valid status is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    ).populate('assignedSalesRep', 'firstName lastName email');

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({
      success: true,
      data: customer,
      message: `Customer status updated to ${req.body.status}`
    });
  } catch (error) {
    console.error('Error updating customer status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/customers/:id/credit - Update customer credit balance
router.patch('/:id/credit', protect, authorize('admin', 'manager', 'accountant'), [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('operation').isIn(['add', 'subtract', 'set']).withMessage('Operation must be add, subtract, or set')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const { amount, operation } = req.body;

    switch (operation) {
      case 'add':
        customer.creditBalance += parseFloat(amount);
        break;
      case 'subtract':
        customer.creditBalance -= parseFloat(amount);
        break;
      case 'set':
        customer.creditBalance = parseFloat(amount);
        break;
    }

    await customer.save();
    await customer.populate('assignedSalesRep', 'firstName lastName email');

    res.json({
      success: true,
      data: customer,
      message: `Credit balance ${operation}ed successfully`
    });
  } catch (error) {
    console.error('Error updating customer credit:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/customers/:id - Delete customer (soft delete by setting status to inactive)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Check if customer has any pending orders
    const Order = require('../models/Order');
    const pendingOrders = await Order.countDocuments({
      customer: req.params.id,
      status: { $in: ['pending', 'processing', 'shipped'] }
    });

    if (pendingOrders > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete customer with ${pendingOrders} pending orders. Please complete or cancel orders first.`
      });
    }

    // NEW: Check if customer has any journal entries
    const hasJournalEntries = await customer.hasJournalEntries();
    if (hasJournalEntries) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete customer with existing journal entries. Please delete or adjust journal entries first.'
      });
    }

    // Instead of calling deleteAccount which permanently deletes the accounting account,
    // we'll simply unlink the accounting integration to maintain consistency with soft delete
    if (customer.accountingIntegration && customer.accountingIntegration.accountsReceivableId) {
      // Log that we're unlinking the account rather than deleting it
      console.log(`Unlinking accounting account ${customer.accountingIntegration.accountsReceivableId} from customer ${customer._id}`);
      
      // Clear the accounting integration references without deleting the account
      customer.accountingIntegration.accountsReceivableId = undefined;
      customer.accountingIntegration.accountCode = undefined;
    }

    // Soft delete by setting status to inactive
    customer.status = 'inactive';
    await customer.save();

    res.json({
      success: true,
      message: 'Customer deleted successfully',
      data: customer
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/customers/stats/overview - Get customer statistics
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const stats = await Customer.aggregate([
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
          individual: {
            $sum: { $cond: [{ $eq: ['$customerType', 'individual'] }, 1, 0] }
          },
          business: {
            $sum: { $cond: [{ $eq: ['$customerType', 'business'] }, 1, 0] }
          },
          totalSpent: { $sum: '$totalSpent' },
          totalOrders: { $sum: '$totalOrders' },
          avgOrderValue: { $avg: { $divide: ['$totalSpent', '$totalOrders'] } }
        }
      }
    ]);

    const cityStats = await Customer.aggregate([
      {
        $group: {
          _id: '$billingAddress.city',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const recentCustomers = await Customer.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName email customerCode createdAt totalSpent')
      .populate('assignedSalesRep', 'firstName lastName');

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          total: 0,
          active: 0,
          inactive: 0,
          suspended: 0,
          individual: 0,
          business: 0,
          totalSpent: 0,
          totalOrders: 0,
          avgOrderValue: 0
        },
        cities: cityStats,
        recentCustomers
      }
    });
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/customers/:id/orders - Get customer's order history
router.get('/:id/orders', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const Order = require('../models/Order');
    const orders = await Order.find({ customer: req.params.id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('items.product', 'name productCode')
      .select('orderNumber status totalAmount orderDate deliveryDate');

    const totalOrders = await Order.countDocuments({ customer: req.params.id });

    res.json({
      success: true,
      data: orders,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(totalOrders / limit),
        count: totalOrders,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// NEW: Accounting Integration Endpoints

// POST /api/customers/setup-accounts - Create Chart of Accounts for all customers missing accounts
router.post('/setup-accounts', protect, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const results = await Customer.createMissingAccounts();
    
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
    console.error('Error setting up customer accounts:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/customers/:id/account - Get customer's Chart of Accounts information
router.get('/:id/account', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    const account = await customer.getAccountsReceivableAccount();
    const balance = await customer.getAccountBalance();
    
    res.json({
      success: true,
      data: {
        customer: {
          _id: customer._id,
          fullName: customer.fullName,
          customerCode: customer.customerCode
        },
        account: account ? {
          _id: account._id,
          accountCode: account.accountCode,
          accountName: account.accountName,
          balance: balance,
          isLinked: true
        } : {
          isLinked: false,
          message: 'No Chart of Accounts linked to this customer'
        }
      }
    });
  } catch (error) {
    console.error('Error fetching customer account:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/customers/:id/create-account - Manually create Chart of Accounts for specific customer
router.post('/:id/create-account', protect, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    if (customer.accountingIntegration.accountsReceivableId) {
      return res.status(400).json({
        success: false,
        message: 'Customer already has a linked Chart of Accounts'
      });
    }
    
    const account = await customer.createCustomerAccount();
    
    res.json({
      success: true,
      message: 'Chart of Accounts created successfully for customer',
      data: {
        customer: {
          _id: customer._id,
          fullName: customer.fullName,
          customerCode: customer.customerCode
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
    console.error('Error creating customer account:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/customers/accounting/summary - Get accounting summary for all customers
router.get('/accounting/summary', protect, async (req, res) => {
  try {
    const customers = await Customer.find({
      'accountingIntegration.accountsReceivableId': { $exists: true }
    }).populate('accountingIntegration.accountsReceivableId', 'accountCode accountName currentBalance');
    
    const totalReceivables = customers.reduce((sum, customer) => {
      const account = customer.accountingIntegration.accountsReceivableId;
      return sum + (account ? account.currentBalance : 0);
    }, 0);
    
    const customersWithAccounts = customers.filter(c => c.accountingIntegration.accountsReceivableId);
    const totalCustomers = await Customer.countDocuments();
    
    res.json({
      success: true,
      data: {
        totalCustomers,
        customersWithAccounts: customersWithAccounts.length,
        customersWithoutAccounts: totalCustomers - customersWithAccounts.length,
        totalAccountsReceivable: totalReceivables,
        integrationPercentage: ((customersWithAccounts.length / totalCustomers) * 100).toFixed(1),
        customers: customersWithAccounts.map(customer => ({
          _id: customer._id,
          fullName: customer.fullName,
          customerCode: customer.customerCode,
          account: {
            accountCode: customer.accountingIntegration.accountsReceivableId.accountCode,
            accountName: customer.accountingIntegration.accountsReceivableId.accountName,
            balance: customer.accountingIntegration.accountsReceivableId.currentBalance
          }
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching customer accounting summary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;