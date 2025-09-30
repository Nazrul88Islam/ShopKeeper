const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/error');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h' // Set to 1 hour for automatic session timeout
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public (but can be restricted to admin only)
const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, username, email, password, role, phone, address } = req.body;

  // Check if user exists with email or username
  const userExistsEmail = await User.findOne({ email });
  if (userExistsEmail) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  const userExistsUsername = await User.findOne({ username });
  if (userExistsUsername) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this username'
    });
  }

  // Get default permissions for the role
  const permissions = User.getRolePermissions(role || 'sales');

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    username,
    email,
    password,
    role: role || 'sales',
    permissions,
    phone,
    address
  });

  // Remove password from response
  user.password = undefined;

  // Generate token
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      token
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  console.log('🔐 Login attempt received:', { username, hasPassword: !!password });

  // Validate username and password
  if (!username || !password) {
    console.log('❌ Missing credentials');
    return res.status(400).json({
      success: false,
      message: 'Please provide a username and password'
    });
  }

  console.log('🔍 Looking for user:', username);
  // Check for user and include password
  const user = await User.findOne({ username }).select('+password');
  if (!user) {
    console.log('❌ User not found:', username);
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
  
  console.log('👤 User found:', { 
    id: user._id, 
    username: user.username, 
    role: user.role, 
    isActive: user.isActive,
    hasPassword: !!user.password 
  });

  // Check if account is locked
  if (user.isLocked()) {
    console.log('🔒 Account is locked');
    return res.status(401).json({
      success: false,
      message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.'
    });
  }

  // Check if account is active
  if (!user.isActive) {
    console.log('⚠️ Account is inactive');
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated. Please contact administrator.'
    });
  }

  console.log('🔑 Checking password...');
  // Check if password matches
  const isMatch = await user.correctPassword(password, user.password);
  console.log('🔑 Password check result:', isMatch);
  
  if (!isMatch) {
    console.log('❌ Invalid password');
    // Increment login attempts
    await user.incLoginAttempts();
    
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  console.log('✅ Password correct, proceeding with login...');
  
  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.updateOne({
      $unset: {
        loginAttempts: 1,
        lockUntil: 1
      }
    });
    console.log('🔄 Reset login attempts');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();
  console.log('📅 Updated last login time');

  // Get role permissions from Role model
  const Role = require('../models/Role');
  const roleData = await Role.findOne({ name: user.role, isActive: true });
  
  if (roleData) {
    // Merge user-specific permissions with role permissions
    const rolePermissions = roleData.permissions || [];
    const userPermissions = user.permissions || [];
    
    // Combine permissions (user permissions override role permissions)
    const combinedPermissions = [...rolePermissions];
    
    userPermissions.forEach(userPerm => {
      const existingIndex = combinedPermissions.findIndex(p => p.module === userPerm.module);
      if (existingIndex >= 0) {
        combinedPermissions[existingIndex] = userPerm;
      } else {
        combinedPermissions.push(userPerm);
      }
    });
    
    user.permissions = combinedPermissions;
  }

  // Remove password from response
  user.password = undefined;

  // Generate token
  const token = generateToken(user._id);
  console.log('🎫 Generated token:', { tokenLength: token.length });

  // Calculate expiration time (1 hour from now)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const response = {
    success: true,
    message: 'Login successful',
    data: {
      user,
      token,
      expiresAt,
      expiresIn: 3600 // 1 hour in seconds
    }
  };
  
  console.log('📤 Sending response:', { 
    success: response.success, 
    hasUser: !!response.data.user,
    hasToken: !!response.data.token,
    userRole: response.data.user.role
  });

  res.status(200).json(response);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  // Get user with populated role permissions
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Get role permissions from Role model
  const Role = require('../models/Role');
  const roleData = await Role.findOne({ name: user.role, isActive: true });
  
  if (roleData) {
    // Merge user-specific permissions with role permissions
    const rolePermissions = roleData.permissions || [];
    const userPermissions = user.permissions || [];
    
    // Combine permissions (user permissions override role permissions)
    const combinedPermissions = [...rolePermissions];
    
    userPermissions.forEach(userPerm => {
      const existingIndex = combinedPermissions.findIndex(p => p.module === userPerm.module);
      if (existingIndex >= 0) {
        combinedPermissions[existingIndex] = userPerm;
      } else {
        combinedPermissions.push(userPerm);
      }
    });
    
    user.permissions = combinedPermissions;
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const fieldsToUpdate = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phone: req.body.phone,
    address: req.body.address
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: user
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  const isMatch = await user.correctPassword(currentPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'No user found with this email'
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  // Set expire time (10 minutes)
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

  try {
    // In a real application, you would send an email here
    // For now, we'll just return the token for testing
    res.status(200).json({
      success: true,
      message: 'Password reset email sent',
      resetToken: resetToken // Remove this in production
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      success: false,
      message: 'Email could not be sent'
    });
  }
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resettoken
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token'
    });
  }

  // Set new password
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  
  await user.save();

  // Generate new token
  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Password reset successful',
    data: {
      token
    }
  });
});

// @desc    Logout user (invalidate token on client side)
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // You could maintain a blacklist of tokens for enhanced security
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Private
const refreshToken = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  if (!user || !user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'User not found or inactive'
    });
  }

  // Generate new token
  const token = generateToken(user._id);

  // Calculate expiration time (1 hour from now)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      token,
      user,
      expiresAt,
      expiresIn: 3600 // 1 hour in seconds
    }
  });
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({ emailVerificationToken: token });
  
  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid verification token'
    });
  }

  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Email verified successfully'
  });
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
  refreshToken,
  verifyEmail
};