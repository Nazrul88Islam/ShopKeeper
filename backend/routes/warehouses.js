const express = require('express');
const { body, validationResult, param, query } = require('express-validator');
const Warehouse = require('../models/Warehouse');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Warehouses API is working' });
});

// @desc    Get all warehouses with pagination and filtering
// @route   GET /api/warehouses
// @access  Private
router.get('/', protect, authorize('admin', 'manager', 'inventory'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['active', 'inactive', 'maintenance', 'full']).withMessage('Invalid status'),
  query('type').optional().isIn(['main', 'china', 'regional', 'transit', 'virtual']).withMessage('Invalid type'),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, type, search, city, country } = req.query;

    // Build query
    let query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (city) query['location.address.city'] = new RegExp(city, 'i');
    if (country) query['location.address.country'] = new RegExp(country, 'i');
    
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { warehouseCode: new RegExp(search, 'i') },
        { 'contact.managerName': new RegExp(search, 'i') },
        { 'location.address.city': new RegExp(search, 'i') }
      ];
    }

    // Execute query with pagination
    const warehouses = await Warehouse.find(query)
      .populate('staff.user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Warehouse.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Get inventory counts for each warehouse
    const warehousesWithInventory = await Promise.all(
      warehouses.map(async (warehouse) => {
        const inventoryCount = await Inventory.countDocuments({ warehouse: warehouse._id });
        const activeProducts = await Inventory.countDocuments({ 
          warehouse: warehouse._id, 
          'stock.onHand': { $gt: 0 } 
        });
        
        return {
          ...warehouse,
          inventoryCount,
          activeProducts
        };
      })
    );

    res.status(200).json({
      success: true,
      data: warehousesWithInventory,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get warehouses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching warehouses',
      error: error.message
    });
  }
});

// @desc    Get warehouse by ID
// @route   GET /api/warehouses/:id
// @access  Private
router.get('/:id', protect, authorize('admin', 'manager', 'inventory'), [
  param('id').isMongoId().withMessage('Invalid warehouse ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const warehouse = await Warehouse.findById(req.params.id)
      .populate('staff.user', 'firstName lastName email role')
      .lean();

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    // Get detailed inventory information
    const inventoryStats = await Inventory.aggregate([
      { $match: { warehouse: warehouse._id } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStock: { $sum: '$stock.onHand' },
          totalValue: { $sum: '$costs.totalValue' },
          lowStockItems: {
            $sum: {
              $cond: [
                { $lte: ['$stock.onHand', '$reorderPoint.minimum'] },
                1,
                0
              ]
            }
          },
          outOfStockItems: {
            $sum: {
              $cond: [
                { $eq: ['$stock.onHand', 0] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const stats = inventoryStats[0] || {
      totalProducts: 0,
      totalStock: 0,
      totalValue: 0,
      lowStockItems: 0,
      outOfStockItems: 0
    };

    res.status(200).json({
      success: true,
      data: {
        ...warehouse,
        inventoryStats: stats
      }
    });
  } catch (error) {
    console.error('Get warehouse error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching warehouse',
      error: error.message
    });
  }
});

// @desc    Create new warehouse
// @route   POST /api/warehouses
// @access  Private
router.post('/', protect, authorize('admin', 'manager'), [
  body('name').notEmpty().withMessage('Warehouse name is required').trim(),
  body('type').isIn(['main', 'china', 'regional', 'transit', 'virtual']).withMessage('Invalid warehouse type'),
  body('location.address.street').optional().trim(),
  body('location.address.city').optional().trim(),
  body('location.address.state').optional().trim(),
  body('location.address.zipCode').optional().trim(),
  body('location.address.country').optional().trim(),
  body('contact.managerName').optional().trim(),
  body('contact.phone').optional().trim(),
  body('contact.email').optional().isEmail().withMessage('Invalid email format'),
  body('capacity.totalArea.value').optional().isFloat({ min: 0 }).withMessage('Total area must be positive'),
  body('capacity.totalArea.unit').optional().isIn(['sqft', 'sqm']).withMessage('Invalid area unit'),
  body('capacity.storageVolume.value').optional().isFloat({ min: 0 }).withMessage('Storage volume must be positive'),
  body('capacity.storageVolume.unit').optional().isIn(['cbft', 'cbm']).withMessage('Invalid volume unit'),
  body('capacity.maxWeight.value').optional().isFloat({ min: 0 }).withMessage('Max weight must be positive'),
  body('capacity.maxWeight.unit').optional().isIn(['kg', 'ton']).withMessage('Invalid weight unit')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if warehouse with same name exists
    const existingWarehouse = await Warehouse.findOne({ 
      name: { $regex: new RegExp(`^${req.body.name}$`, 'i') }
    });

    if (existingWarehouse) {
      return res.status(400).json({
        success: false,
        message: 'Warehouse with this name already exists'
      });
    }

    const warehouse = new Warehouse({
      ...req.body,
      createdBy: req.user._id,
      modifiedBy: req.user._id
    });

    await warehouse.save();

    const populatedWarehouse = await Warehouse.findById(warehouse._id)
      .populate('staff.user', 'firstName lastName email')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Warehouse created successfully',
      data: populatedWarehouse
    });
  } catch (error) {
    console.error('Create warehouse error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Warehouse code already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating warehouse',
      error: error.message
    });
  }
});

// @desc    Update warehouse
// @route   PUT /api/warehouses/:id
// @access  Private
router.put('/:id', protect, authorize('admin', 'manager'), [
  param('id').isMongoId().withMessage('Invalid warehouse ID'),
  body('name').optional().notEmpty().withMessage('Warehouse name cannot be empty').trim(),
  body('type').optional().isIn(['main', 'china', 'regional', 'transit', 'virtual']).withMessage('Invalid warehouse type'),
  body('status').optional().isIn(['active', 'inactive', 'maintenance', 'full']).withMessage('Invalid status'),
  body('contact.email').optional().isEmail().withMessage('Invalid email format'),
  body('capacity.totalArea.value').optional().isFloat({ min: 0 }).withMessage('Total area must be positive'),
  body('capacity.storageVolume.value').optional().isFloat({ min: 0 }).withMessage('Storage volume must be positive'),
  body('capacity.maxWeight.value').optional().isFloat({ min: 0 }).withMessage('Max weight must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    // Check if name is being changed and if new name already exists
    if (req.body.name && req.body.name !== warehouse.name) {
      const existingWarehouse = await Warehouse.findOne({ 
        name: { $regex: new RegExp(`^${req.body.name}$`, 'i') },
        _id: { $ne: req.params.id }
      });

      if (existingWarehouse) {
        return res.status(400).json({
          success: false,
          message: 'Warehouse with this name already exists'
        });
      }
    }

    // Update warehouse
    Object.assign(warehouse, req.body);
    warehouse.modifiedBy = req.user._id;
    warehouse.updatedAt = new Date();

    await warehouse.save();

    const updatedWarehouse = await Warehouse.findById(warehouse._id)
      .populate('staff.user', 'firstName lastName email')
      .lean();

    res.status(200).json({
      success: true,
      message: 'Warehouse updated successfully',
      data: updatedWarehouse
    });
  } catch (error) {
    console.error('Update warehouse error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating warehouse',
      error: error.message
    });
  }
});

// @desc    Delete warehouse
// @route   DELETE /api/warehouses/:id
// @access  Private
router.delete('/:id', protect, authorize('admin'), [
  param('id').isMongoId().withMessage('Invalid warehouse ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    // Check if warehouse has inventory
    const inventoryCount = await Inventory.countDocuments({ warehouse: req.params.id });
    if (inventoryCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete warehouse with existing inventory. Please transfer inventory first.'
      });
    }

    await Warehouse.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Warehouse deleted successfully'
    });
  } catch (error) {
    console.error('Delete warehouse error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting warehouse',
      error: error.message
    });
  }
});

// @desc    Get warehouse inventory summary
// @route   GET /api/warehouses/:id/inventory
// @access  Private
router.get('/:id/inventory', protect, authorize('admin', 'manager', 'inventory'), [
  param('id').isMongoId().withMessage('Invalid warehouse ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const inventory = await Inventory.find({ warehouse: req.params.id })
      .populate('product', 'name productCode category brand pricing.sellingPrice')
      .sort({ 'stock.onHand': -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Inventory.countDocuments({ warehouse: req.params.id });
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: inventory,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get warehouse inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching warehouse inventory',
      error: error.message
    });
  }
});

// @desc    Get warehouse statistics
// @route   GET /api/warehouses/:id/stats
// @access  Private
router.get('/:id/stats', protect, authorize('admin', 'manager', 'inventory'), [
  param('id').isMongoId().withMessage('Invalid warehouse ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    // Get comprehensive statistics
    const stats = await Inventory.aggregate([
      { $match: { warehouse: warehouse._id } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStock: { $sum: '$stock.onHand' },
          totalValue: { $sum: '$costs.totalValue' },
          averageCost: { $avg: '$costs.averageCost' },
          lowStockItems: {
            $sum: {
              $cond: [
                { $lte: ['$stock.onHand', '$reorderPoint.minimum'] },
                1,
                0
              ]
            }
          },
          outOfStockItems: {
            $sum: {
              $cond: [
                { $eq: ['$stock.onHand', 0] },
                1,
                0
              ]
            }
          },
          overstockItems: {
            $sum: {
              $cond: [
                { $gte: ['$stock.onHand', '$reorderPoint.maximum'] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalProducts: 0,
      totalStock: 0,
      totalValue: 0,
      averageCost: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      overstockItems: 0
    };

    // Calculate utilization
    const utilization = {
      capacity: warehouse.capacity,
      current: warehouse.currentUtilization,
      percentage: warehouse.utilizationPercentage,
      isNearCapacity: warehouse.isNearCapacity
    };

    res.status(200).json({
      success: true,
      data: {
        inventory: result,
        utilization,
        warehouse: {
          name: warehouse.name,
          type: warehouse.type,
          status: warehouse.status
        }
      }
    });
  } catch (error) {
    console.error('Get warehouse stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching warehouse statistics',
      error: error.message
    });
  }
});

// @desc    Get warehouses for dropdown/select
// @route   GET /api/warehouses/select/options
// @access  Private
router.get('/select/options', protect, async (req, res) => {
  try {
    const warehouses = await Warehouse.find({ status: 'active' })
      .select('_id name warehouseCode type location.address.city')
      .sort({ name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: warehouses
    });
  } catch (error) {
    console.error('Get warehouse options error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching warehouse options',
      error: error.message
    });
  }
});

module.exports = router;