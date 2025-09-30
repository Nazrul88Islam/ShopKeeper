const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Role = require('../models/Role');
const { protect, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Users API is working',
    timestamp: new Date().toISOString()
  });
});

// GET /api/users - Get all users (Protected)
router.get('/', protect, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      role, 
      search, 
      isActive, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;
    
    console.log('📋 Fetching users with params:', { page, limit, role, search, isActive });
    
    let query = {};
    
    // Filter by role
    if (role && role !== 'all') {
      query.role = role;
    }
    
    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    // Search by name, email, or username
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('role', 'displayName permissions');
    
    const total = await User.countDocuments(query);
    
    console.log(`✅ Found ${users.length} users (${total} total)`);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST /api/users - Create user (Admin/Manager only)
router.post('/', protect, authorize('admin', 'manager'), [
  body('firstName').notEmpty().withMessage('First name is required').trim(),
  body('lastName').notEmpty().withMessage('Last name is required').trim(),
  body('username').notEmpty().withMessage('Username is required').trim().toLowerCase(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').notEmpty().withMessage('Role is required')
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
    
    const { firstName, lastName, username, email, password, role, phone, address } = req.body;
    
    console.log('👤 Creating new user:', { username, email, role });
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      return res.status(400).json({ 
        success: false, 
        message: `User with this ${field} already exists` 
      });
    }
    
    // Verify role exists
    const roleExists = await Role.findOne({ name: role });
    if (!roleExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role specified' 
      });
    }
    
    // Get role permissions
    const permissions = roleExists.permissions || User.getRolePermissions(role);
    
    const user = new User({
      firstName,
      lastName,
      username,
      email,
      password,
      role,
      permissions,
      phone,
      address,
      isActive: true
    });
    
    await user.save();
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    console.log('✅ User created successfully:', user._id);
    
    res.status(201).json({ 
      success: true, 
      data: userResponse,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /api/users/:id - Get user by ID (Protected)
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 Fetching user:', id);
    
    const user = await User.findById(id)
      .select('-password')
      .populate('role', 'displayName permissions');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    console.log('✅ User found:', user.username);
    
    res.json({ 
      success: true, 
      data: user 
    });
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// PUT /api/users/:id - Update user (Admin/Manager only)
router.put('/:id', protect, authorize('admin', 'manager'), [
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional()
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
    
    const { id } = req.params;
    const updateData = { ...req.body };
    
    console.log('🔄 Updating user:', id, updateData);
    
    // Remove password from update data (use separate endpoint)
    delete updateData.password;
    
    // If role is being updated, update permissions too
    if (updateData.role) {
      const roleExists = await Role.findOne({ name: updateData.role });
      if (!roleExists) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid role specified' 
        });
      }
      updateData.permissions = roleExists.permissions || User.getRolePermissions(updateData.role);
    }
    
    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    console.log('✅ User updated successfully:', user.username);
    
    res.json({ 
      success: true, 
      data: user,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// PATCH /api/users/:id/toggle-status - Toggle user active status (Admin only)
router.patch('/:id/toggle-status', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔄 Toggling user status:', id);
    
    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Prevent deactivating the current user (admin)
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot deactivate your own account' 
      });
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    console.log(`✅ User ${user.isActive ? 'activated' : 'deactivated'}:`, user.username);
    
    res.json({ 
      success: true, 
      data: user,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('❌ Error toggling user status:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// PATCH /api/users/:id/password - Reset user password (Admin only)
router.patch('/:id/password', protect, authorize('admin'), [
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
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
    
    const { id } = req.params;
    const { newPassword } = req.body;
    
    console.log('🔑 Resetting password for user:', id);
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    user.password = newPassword;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
    
    console.log('✅ Password reset successfully for:', user.username);
    
    res.json({ 
      success: true, 
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ Deleting user:', id);
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Prevent deleting the current user (admin)
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete your own account' 
      });
    }
    
    // Prevent deleting the last admin user
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete the last active admin user' 
        });
      }
    }
    
    await User.findByIdAndDelete(id);
    
    console.log('✅ User deleted successfully:', user.username);
    
    res.json({ 
      success: true, 
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /api/users/roles/available - Get all available roles
router.get('/roles/available', protect, async (req, res) => {
  try {
    console.log('📋 Fetching available roles');
    
    const roles = await Role.find({ isActive: true })
      .select('name displayName description permissions isSystem')
      .sort({ name: 1 });
    
    console.log(`✅ Found ${roles.length} available roles`);
    
    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('❌ Error fetching roles:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /api/users/stats/summary - Get user statistics
router.get('/stats/summary', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    console.log('📊 Fetching user statistics');
    
    const [totalUsers, activeUsers, usersByRole] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);
    
    const stats = {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };
    
    console.log('✅ User statistics:', stats);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error fetching user statistics:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;