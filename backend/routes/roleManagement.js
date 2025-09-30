const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Role = require('../models/Role');
const { protect, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all users (Admin only)
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search, isActive } = req.query;
    
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
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new user (Admin only)
router.post('/users', protect, authorize('admin'), [
  body('firstName').notEmpty().withMessage('First name is required').trim(),
  body('lastName').notEmpty().withMessage('Last name is required').trim(),
  body('username').notEmpty().withMessage('Username is required').trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').custom(async (value) => {
    const role = await Role.findOne({ name: value, isActive: true });
    if (!role) {
      throw new Error('Invalid role or role is not active');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { firstName, lastName, username, email, password, role, phone, address } = req.body;
    
    // Check if user already exists with email or username
    const existingUserEmail = await User.findOne({ email });
    if (existingUserEmail) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }
    
    const existingUserUsername = await User.findOne({ username });
    if (existingUserUsername) {
      return res.status(400).json({ success: false, message: 'User with this username already exists' });
    }
    
    // Get role permissions
    const permissions = await User.getRolePermissions(role);
    
    const user = new User({
      firstName,
      lastName,
      username,
      email,
      password,
      role,
      permissions,
      phone,
      address
    });
    
    await user.save();
    
    // Remove password from response
    user.password = undefined;
    
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user (Admin only)
router.put('/users/:id', protect, authorize('admin'), [
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('username').optional().trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  body('email').optional().isEmail().normalizeEmail(),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().custom(async (value) => {
    if (value) {
      const role = await Role.findOne({ name: value, isActive: true });
      if (!role) {
        throw new Error('Invalid role or role is not active');
      }
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Remove password from updateData if it's empty or not provided
    if (!updateData.password || updateData.password.trim() === '') {
      delete updateData.password;
    }
    
    // Check for duplicate username if username is being updated
    if (updateData.username) {
      const existingUser = await User.findOne({ 
        username: updateData.username, 
        _id: { $ne: id } 
      });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Username already exists' });
      }
    }
    
    // Check for duplicate email if email is being updated
    if (updateData.email) {
      const existingUser = await User.findOne({ 
        email: updateData.email, 
        _id: { $ne: id } 
      });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }
    }
    
    // If role is being updated, update permissions too
    if (updateData.role) {
      updateData.permissions = await User.getRolePermissions(updateData.role);
    }
    
    // Handle password update separately if provided
    let user;
    if (updateData.password) {
      // If password is being updated, use save() to trigger pre-save middleware for hashing
      user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      // Update all fields including password
      Object.keys(updateData).forEach(key => {
        user[key] = updateData[key];
      });
      
      await user.save();
      user.password = undefined; // Remove password from response
    } else {
      // If password is not being updated, use findByIdAndUpdate with runValidators: false
      // to avoid password required validation
      user = await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: false }
      ).select('-password');
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Toggle user active status (Admin only)
router.patch('/users/:id/toggle-status', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    res.json({ 
      success: true, 
      data: user,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user by ID (Admin only)
router.get('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all available roles and their permissions
router.get('/roles', protect, authorize('admin'), async (req, res) => {
  try {
    // Get roles from database
    const roles = await Role.find({}).sort({ isSystem: -1, createdAt: -1 });
    
    // If no roles found, return empty array (seeding should have been run)
    if (roles.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No roles found. Please run the seeding script: npm run seed:roles' 
      });
    }
    
    // Add user count for each role
    const rolesWithUserCount = await Promise.all(
      roles.map(async (role) => {
        const userCount = await User.countDocuments({ role: role.name });
        return {
          ...role.toObject(),
          userCount
        };
      })
    );
    
    res.json({ success: true, data: rolesWithUserCount });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new role (Admin only)
router.post('/roles', protect, authorize('admin'), [
  body('name').notEmpty().withMessage('Role name is required').trim(),
  body('displayName').notEmpty().withMessage('Display name is required').trim(),
  body('description').optional().trim(),
  body('permissions').isArray().withMessage('Permissions must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { name, displayName, description, permissions } = req.body;
    
    // Check if role already exists
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({ success: false, message: 'Role with this name already exists' });
    }
    
    const role = new Role({
      name,
      displayName,
      description,
      permissions,
      isSystem: false
    });
    
    await role.save();
    res.status(201).json({ success: true, data: role });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update role (Admin only)
router.put('/roles/:id', protect, authorize('admin'), [
  body('displayName').optional().trim(),
  body('description').optional().trim(),
  body('permissions').optional().isArray().withMessage('Permissions must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { id } = req.params;
    const updateData = req.body;
    
    const role = await Role.findById(id);
    
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }
    
    // Check if this is a system role that shouldn't be modified
    if (role.isSystem) {
      return res.status(400).json({ success: false, message: 'System roles cannot be modified' });
    }
    
    // Update the role
    const updatedRole = await Role.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({ success: true, data: updatedRole });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete role (Admin only)
router.delete('/roles/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const role = await Role.findById(id);
    
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }
    
    // Check if this is a system role that shouldn't be deleted
    if (role.isSystem) {
      return res.status(400).json({ success: false, message: 'System roles cannot be deleted' });
    }
    
    // Check if any users are assigned to this role
    const usersWithRole = await User.countDocuments({ role: role.name });
    if (usersWithRole > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete role. ${usersWithRole} user(s) are assigned to this role.` 
      });
    }
    
    await Role.findByIdAndDelete(id);
    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reset user password (Admin only)
router.patch('/users/:id/reset-password', protect, authorize('admin'), [
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { id } = req.params;
    const { newPassword } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.password = newPassword;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'Password reset successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user permissions (Admin only)
router.patch('/users/:id/permissions', protect, authorize('admin'), [
  body('permissions').isArray().withMessage('Permissions must be an array'),
  body('permissions.*.module').isIn(['orders', 'inventory', 'customers', 'suppliers', 'accounting', 'reports', 'users', 'settings']).withMessage('Invalid module'),
  body('permissions.*.actions').isArray().withMessage('Actions must be an array'),
  body('permissions.*.actions.*').isIn(['create', 'read', 'update', 'delete']).withMessage('Invalid action')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { id } = req.params;
    const { permissions } = req.body;
    
    const user = await User.findByIdAndUpdate(
      id,
      { permissions },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;