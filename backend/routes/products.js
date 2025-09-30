const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const Supplier = require('../models/Supplier');
const { protect, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Products API is working',
    timestamp: new Date().toISOString()
  });
});

// GET /api/products/categories - Get all unique categories
router.get('/categories', protect, async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true });
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/products/categories - Create a new category
router.post('/categories', protect, authorize('admin', 'manager'), [
  body('name').notEmpty().withMessage('Category name is required').trim(),
  body('description').optional().trim()
], async (req, res) => {
  try {
    // Debug logging
    console.log('Category creation request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    // Additional validation for name
    if (!req.body.name || req.body.name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Category name cannot be empty'
      });
    }

    // Check if category with same name already exists
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${req.body.name.trim()}$`, 'i') } 
    });
    
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    const category = new Category({
      name: req.body.name.trim(),
      description: req.body.description ? req.body.description.trim() : undefined
    });
    await category.save();

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/products/categories/:id - Update a category
router.put('/categories/:id', protect, authorize('admin', 'manager'), [
  body('name').optional().trim(),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Check if name is being updated and already exists
    if (req.body.name) {
      const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${req.body.name}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({ success: true, data: category });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/products/categories/:id - Delete a category
router.delete('/categories/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Check if category is used by any products
    const productCount = await Product.countDocuments({ category: req.params.id });
    
    if (productCount > 0) {
      // Option 1: Soft delete - set isActive to false
      category.isActive = false;
      await category.save();
      
      return res.json({
        success: true,
        message: 'Category deactivated successfully',
        data: category
      });
    }

    // If no products use this category, delete it completely
    await Category.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/products/categories/:id/subcategories - Add a subcategory
router.post('/categories/:id/subcategories', protect, authorize('admin', 'manager'), [
  body('name').notEmpty().withMessage('Subcategory name is required').trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Check if subcategory already exists
    if (category.subcategories.includes(req.body.name)) {
      return res.status(400).json({
        success: false,
        message: 'Subcategory already exists in this category'
      });
    }

    category.subcategories.push(req.body.name);
    await category.save();

    res.json({ success: true, data: category });
  } catch (error) {
    console.error('Error adding subcategory:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/products/categories/:id/subcategories/:subcategory - Remove a subcategory
router.delete('/categories/:id/subcategories/:subcategory', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Remove subcategory
    category.subcategories = category.subcategories.filter(
      sub => sub !== req.params.subcategory
    );
    await category.save();

    res.json({ success: true, data: category });
  } catch (error) {
    console.error('Error removing subcategory:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/products - Get all products with filtering, searching, and pagination
router.get('/', protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      subcategory,
      brand,
      status,
      supplier,
      inStock,
      lowStock,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      minPrice,
      maxPrice
    } = req.query;

    // Build query
    let query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { 'inventory.sku': { $regex: search, $options: 'i' } },
        { 'inventory.barcode': { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Subcategory filter
    if (subcategory && subcategory !== 'all') {
      query.subcategory = subcategory;
    }

    // Brand filter
    if (brand && brand !== 'all') {
      query.brand = brand;
    }

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Supplier filter
    if (supplier && supplier !== 'all') {
      query.supplier = supplier;
    }

    // Stock filters
    if (inStock === 'true') {
      query['inventory.currentStock'] = { $gt: 0 };
    }
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$inventory.currentStock', '$inventory.reorderLevel'] };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query['pricing.sellingPrice'] = {};
      if (minPrice) query['pricing.sellingPrice'].$gte = parseFloat(minPrice);
      if (maxPrice) query['pricing.sellingPrice'].$lte = parseFloat(maxPrice);
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const products = await Product.find(query)
      .populate('supplier', 'companyName supplierCode contactPerson.email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/products/:id - Get product by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('supplier', 'companyName supplierCode contactPerson businessDetails');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/products - Create new product
router.post('/', protect, authorize('admin', 'manager', 'inventory'), [
  body('name').notEmpty().withMessage('Product name is required').trim(),
  body('description').notEmpty().withMessage('Product description is required').trim(),
  body('category').notEmpty().withMessage('Category is required').trim(),
  body('supplier').isMongoId().withMessage('Valid supplier ID is required'),
  body('pricing.basePrice').isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
  body('pricing.costPrice').isFloat({ min: 0 }).withMessage('Cost price must be a positive number'),
  body('pricing.sellingPrice').isFloat({ min: 0 }).withMessage('Selling price must be a positive number'),
  body('inventory.stockUnit')
    .isIn(['piece', 'pack', 'box', 'carton', 'kg', 'g', 'liter', 'meter'])
    .withMessage('Valid stock unit is required')
], async (req, res) => {
  try {
    console.log('Product creation request body:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Verify supplier exists
    const supplier = await Supplier.findById(req.body.supplier);
    if (!supplier) {
      return res.status(400).json({ success: false, message: 'Supplier not found' });
    }

    // Check if product with same name already exists
    const existingProduct = await Product.findOne({ name: req.body.name });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product with this name already exists'
      });
    }

    const product = new Product(req.body);
    await product.save();

    // Populate the response
    await product.populate('supplier', 'companyName supplierCode contactPerson.email');

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', protect, authorize('admin', 'manager', 'inventory'), [
  body('name').optional().trim(),
  body('description').optional().trim(),
  body('category').optional().trim(),
  body('supplier').optional().isMongoId().withMessage('Valid supplier ID is required'),
  body('pricing.basePrice').optional().isFloat({ min: 0 }),
  body('pricing.costPrice').optional().isFloat({ min: 0 }),
  body('pricing.sellingPrice').optional().isFloat({ min: 0 }),
  body('inventory.stockUnit')
    .optional()
    .isIn(['piece', 'pack', 'box', 'carton', 'kg', 'g', 'liter', 'meter'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Verify supplier exists if being updated
    if (req.body.supplier) {
      const supplier = await Supplier.findById(req.body.supplier);
      if (!supplier) {
        return res.status(400).json({ success: false, message: 'Supplier not found' });
      }
    }

    // Check if name is being updated and already exists
    if (req.body.name) {
      const existingProduct = await Product.findOne({
        name: req.body.name,
        _id: { $ne: req.params.id }
      });
      
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product with this name already exists'
        });
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('supplier', 'companyName supplierCode contactPerson.email');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/products/:id/status - Update product status
router.patch('/:id/status', protect, authorize('admin', 'manager', 'inventory'), [
  body('status').isIn(['active', 'inactive', 'discontinued', 'out_of_stock']).withMessage('Valid status is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    ).populate('supplier', 'companyName supplierCode contactPerson.email');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      data: product,
      message: `Product status updated to ${req.body.status}`
    });
  } catch (error) {
    console.error('Error updating product status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/products/:id/stock - Update product stock
router.patch('/:id/stock', protect, authorize('admin', 'manager', 'inventory'), [
  body('quantity').isFloat({ min: 0 }).withMessage('Quantity must be a positive number'),
  body('operation').isIn(['set', 'add', 'subtract']).withMessage('Operation must be set, add, or subtract')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const { quantity, operation } = req.body;

    switch (operation) {
      case 'set':
        product.inventory.currentStock = parseFloat(quantity);
        break;
      case 'add':
        await product.updateStock(parseFloat(quantity), 'add');
        break;
      case 'subtract':
        await product.updateStock(parseFloat(quantity), 'subtract');
        break;
    }

    if (operation === 'set') {
      await product.save();
    }

    await product.populate('supplier', 'companyName supplierCode contactPerson.email')

    res.json({
      success: true,
      data: product,
      message: `Stock ${operation}ed successfully`
    });
  } catch (error) {
    console.error('Error updating product stock:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/products/:id/pricing - Update product pricing
router.patch('/:id/pricing', protect, authorize('admin', 'manager'), [
  body('basePrice').optional().isFloat({ min: 0 }),
  body('costPrice').optional().isFloat({ min: 0 }),
  body('sellingPrice').optional().isFloat({ min: 0 }),
  body('wholesalePrice').optional().isFloat({ min: 0 }),
  body('retailPrice').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const updateData = {};
    Object.keys(req.body).forEach(key => {
      updateData[`pricing.${key}`] = req.body[key];
    });

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('supplier', 'companyName supplierCode contactPerson.email');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Error updating product pricing:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/products/:id - Delete product (soft delete by setting status to discontinued)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if product is in any pending orders
    const Order = require('../models/Order');
    const pendingOrders = await Order.countDocuments({
      'items.product': req.params.id,
      status: { $in: ['pending', 'processing', 'shipped'] }
    });

    if (pendingOrders > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete product with ${pendingOrders} pending orders. Please complete orders first.`
      });
    }

    // Soft delete by setting status to discontinued
    product.status = 'discontinued';
    product.isActive = false;
    await product.save();

    res.json({
      success: true,
      message: 'Product deleted successfully',
      data: product
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/products/stats/overview - Get product statistics
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const stats = await Product.aggregate([
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
          discontinued: {
            $sum: { $cond: [{ $eq: ['$status', 'discontinued'] }, 1, 0] }
          },
          outOfStock: {
            $sum: { $cond: [{ $lte: ['$inventory.currentStock', 0] }, 1, 0] }
          },
          lowStock: {
            $sum: { $cond: [{ $lte: ['$inventory.currentStock', '$inventory.reorderLevel'] }, 1, 0] }
          },
          totalValue: {
            $sum: { $multiply: ['$inventory.currentStock', '$pricing.sellingPrice'] }
          },
          avgPrice: { $avg: '$pricing.sellingPrice' }
        }
      }
    ]);

    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: {
            $sum: { $multiply: ['$inventory.currentStock', '$pricing.sellingPrice'] }
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const supplierStats = await Product.aggregate([
      {
        $lookup: {
          from: 'suppliers',
          localField: 'supplier',
          foreignField: '_id',
          as: 'supplierInfo'
        }
      },
      {
        $group: {
          _id: '$supplier',
          companyName: { $first: { $arrayElemAt: ['$supplierInfo.companyName', 0] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const recentProducts = await Product.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name productCode category pricing.sellingPrice inventory.currentStock status')
      .populate('supplier', 'companyName')

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          total: 0,
          active: 0,
          inactive: 0,
          discontinued: 0,
          outOfStock: 0,
          lowStock: 0,
          totalValue: 0,
          avgPrice: 0
        },
        categories: categoryStats,
        suppliers: supplierStats,
        recentProducts
      }
    });
  } catch (error) {
    console.error('Error fetching product stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/products/low-stock - Get products that need reordering
router.get('/low-stock', protect, async (req, res) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$inventory.currentStock', '$inventory.reorderLevel'] },
      status: 'active'
    })
      .populate('supplier', 'companyName supplierCode contactPerson.email')
      .sort({ 'inventory.currentStock': 1 });

    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/products/brands - Get all unique brands
router.get('/brands', protect, async (req, res) => {
  try {
    const brands = await Product.distinct('brand').then(brands => brands.filter(Boolean));
    res.json({ success: true, data: brands });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;