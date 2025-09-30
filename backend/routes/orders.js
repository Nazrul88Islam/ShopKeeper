const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Orders API is working',
    timestamp: new Date().toISOString()
  });
});

// GET /api/orders - Get all orders with pagination and filtering
router.get('/', protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      orderType,
      customer,
      dateFrom,
      dateTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    if (orderType) {
      query.orderType = orderType;
    }
    
    if (customer) {
      query.customer = customer;
    }
    
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'items.productName': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const orders = await Order.find(query)
      .populate('customer', 'name email phone company address')
      .populate('items.product', 'name code price category')
      .populate('assignedTo.salesRep', 'name email')
      .populate('assignedTo.accountManager', 'name email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get total count for pagination
    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/orders - Create new order
router.post('/', protect, [
  body('customer').notEmpty().withMessage('Customer is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product').notEmpty().withMessage('Product is required for each item'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Valid quantity is required for each item'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Valid unit price is required for each item')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Verify customer exists
    const customer = await Customer.findById(req.body.customer);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Verify products exist and calculate totals
    const items = [];
    let subtotal = 0;

    for (const item of req.body.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.product} not found` });
      }

      const totalPrice = item.quantity * item.unitPrice;
      items.push({
        ...item,
        productName: product.name,
        productCode: product.code,
        totalPrice
      });
      subtotal += totalPrice;
    }

    // Create order
    const orderData = {
      ...req.body,
      items,
      pricing: {
        subtotal,
        discount: req.body.pricing?.discount || 0,
        discountType: req.body.pricing?.discountType || 'percentage',
        tax: req.body.pricing?.tax || 0,
        taxRate: req.body.pricing?.taxRate || 0,
        shippingCost: req.body.pricing?.shippingCost || 0,
        handlingFee: req.body.pricing?.handlingFee || 0,
        total: 0 // Will be calculated in pre-save
      },
      tracking: {
        orderPlaced: {
          date: new Date(),
          user: req.user.id,
          notes: 'Order created'
        }
      },
      assignedTo: {
        salesRep: req.body.assignedTo?.salesRep || req.user.id
      }
    };

    const order = new Order(orderData);
    await order.save();

    // Populate the response
    await order.populate('customer', 'name email phone company');
    await order.populate('items.product', 'name code price category');
    await order.populate('assignedTo.salesRep', 'name email');

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders/:id - Get order by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone company address')
      .populate('items.product', 'name code price category description')
      .populate('assignedTo.salesRep', 'name email')
      .populate('assignedTo.accountManager', 'name email')
      .populate('tracking.orderConfirmed.user', 'name')
      .populate('tracking.supplierContacted.user', 'name')
      .populate('tracking.supplierConfirmed.user', 'name')
      .populate('tracking.paymentReceived.user', 'name')
      .populate('communications.user', 'name')
      .populate('timeline.user', 'name');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/orders/:id - Update order
router.put('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Don't allow updates to completed/cancelled orders
    if (['delivered', 'completed', 'cancelled', 'refunded'].includes(order.status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot update order with status: ${order.status}` 
      });
    }

    // Update order
    Object.assign(order, req.body);
    
    // Add to timeline
    order.timeline.push({
      action: 'order_updated',
      description: 'Order details updated',
      user: req.user.id,
      data: { updatedFields: Object.keys(req.body) }
    });

    await order.save();
    
    // Populate the response
    await order.populate('customer', 'name email phone company');
    await order.populate('items.product', 'name code price category');

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/orders/:id - Delete order
router.delete('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Only allow deletion of pending orders
    if (order.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only pending orders can be deleted' 
      });
    }

    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', protect, [
  body('status').notEmpty().withMessage('Status is required'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { status, notes } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Update status using the model method
    await order.updateStatus(status, req.user.id, notes);
    
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/orders/:id/payment - Add payment
router.post('/:id/payment', protect, [
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid payment amount is required'),
  body('method').notEmpty().withMessage('Payment method is required'),
  body('reference').optional().isString().withMessage('Reference must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { amount, method, reference } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Add payment using the model method
    await order.addPayment(amount, method, reference, req.user.id);
    
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error adding payment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/orders/:id/communication - Add communication
router.post('/:id/communication', protect, [
  body('type').isIn(['call', 'email', 'sms', 'whatsapp', 'note']).withMessage('Valid communication type is required'),
  body('direction').isIn(['inbound', 'outbound']).withMessage('Valid direction is required'),
  body('subject').optional().isString().withMessage('Subject must be a string'),
  body('content').notEmpty().withMessage('Content is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { type, direction, subject, content } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Add communication using the model method
    await order.addCommunication(type, direction, subject, content, req.user.id);
    
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error adding communication:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders/:id/tracking - Get order tracking
router.get('/:id/tracking', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('tracking.orderConfirmed.user', 'name')
      .populate('tracking.supplierContacted.user', 'name')
      .populate('tracking.supplierContacted.supplier', 'name')
      .populate('tracking.supplierConfirmed.user', 'name')
      .populate('tracking.paymentReceived.user', 'name')
      .populate('tracking.procurementStarted.user', 'name')
      .populate('tracking.chinaWarehouse.user', 'name')
      .populate('tracking.internationalShipping.user', 'name')
      .populate('tracking.customsClearance.user', 'name')
      .populate('tracking.localWarehouse.user', 'name')
      .populate('tracking.localWarehouse.warehouse', 'name location')
      .populate('tracking.readyForDelivery.packedBy', 'name')
      .populate('tracking.outForDelivery.user', 'name')
      .populate('tracking.delivered.user', 'name')
      .select('orderNumber status tracking timeline');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error fetching order tracking:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/orders/:id/tracking/:stage - Update specific tracking stage
router.put('/:id/tracking/:stage', protect, async (req, res) => {
  try {
    const { stage } = req.params;
    const updateData = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Validate stage exists in tracking
    if (!order.tracking.hasOwnProperty(stage)) {
      return res.status(400).json({ success: false, message: 'Invalid tracking stage' });
    }

    // Update the specific tracking stage
    order.tracking[stage] = {
      ...order.tracking[stage],
      ...updateData,
      date: new Date(),
      user: req.user.id
    };

    // Add to timeline
    order.timeline.push({
      action: `tracking_${stage}`,
      description: `Updated ${stage} tracking information`,
      user: req.user.id,
      data: updateData
    });

    await order.save();
    
    res.json({ success: true, data: order.tracking[stage] });
  } catch (error) {
    console.error('Error updating tracking stage:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders/stats/summary - Get order statistics
router.get('/stats/summary', protect, async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    let dateFilter = {};
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {};
      if (dateFrom) dateFilter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.createdAt.$lte = new Date(dateTo);
    }

    const [statusStats, priorityStats, totalStats] = await Promise.all([
      Order.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalValue: { $sum: '$pricing.total' }
          }
        },
        { $sort: { count: -1 } }
      ]),
      Order.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      Order.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalValue: { $sum: '$pricing.total' },
            averageOrderValue: { $avg: '$pricing.total' }
          }
        }
      ])
    ]);

    const summary = {
      total: totalStats[0] || { totalOrders: 0, totalValue: 0, averageOrderValue: 0 },
      byStatus: statusStats,
      byPriority: priorityStats
    };

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;