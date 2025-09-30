const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. User not found.',
          code: 'USER_NOT_FOUND'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated. Please contact administrator.',
          code: 'ACCOUNT_DEACTIVATED'
        });
      }

      // Check if account is locked
      if (user.isLocked()) {
        return res.status(401).json({
          success: false,
          message: 'Account is temporarily locked due to multiple failed login attempts.',
          code: 'ACCOUNT_LOCKED'
        });
      }

      // Refresh user permissions from role to ensure they have the latest permissions
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

      // Add user to request
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please login again.',
          code: 'TOKEN_EXPIRED'
        });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token format.',
          code: 'INVALID_TOKEN'
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid token.',
          code: 'TOKEN_ERROR'
        });
      }
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
};

// Authorize based on roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please login first.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized to access this resource.`
      });
    }

    next();
  };
};

// Check specific permissions
const checkPermission = (module, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please login first.'
      });
    }

    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user has the required permission
    const hasPermission = req.user.permissions.some(permission => 
      permission.module === module && permission.actions.includes(action)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Access denied. You don't have permission to ${action} ${module}.`
      });
    }

    next();
  };
};

// Resource ownership check
const checkOwnership = (resourceModel, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const Model = require(`../models/${resourceModel}`);
      
      const resource = await Model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found.'
        });
      }

      // Admin can access all resources
      if (req.user.role === 'admin') {
        return next();
      }

      // Check if user owns the resource or is assigned to it
      const isOwner = resource.createdBy && resource.createdBy.toString() === req.user._id.toString();
      const isAssigned = resource.assignedTo && resource.assignedTo.toString() === req.user._id.toString();
      const isSalesRep = resource.assignedSalesRep && resource.assignedSalesRep.toString() === req.user._id.toString();

      if (!isOwner && !isAssigned && !isSalesRep) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own resources.'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Server error during ownership check.'
      });
    }
  };
};

// Optional authentication (for public endpoints that can benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (user && user.isActive && !user.isLocked()) {
          req.user = user;
        }
      } catch (error) {
        // Token is invalid, but continue without user context
        req.user = null;
      }
    }

    next();
  } catch (error) {
    next();
  }
};

// Rate limiting for sensitive operations
const sensitiveOperation = (req, res, next) => {
  // This could be enhanced with Redis for distributed systems
  const key = `sensitive_${req.user._id}`;
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const maxAttempts = 3;

  // In a real application, you'd use Redis or a similar store
  // For now, we'll use a simple in-memory approach
  if (!global.sensitiveOperations) {
    global.sensitiveOperations = new Map();
  }

  const userAttempts = global.sensitiveOperations.get(key) || [];
  const recentAttempts = userAttempts.filter(attempt => now - attempt < windowMs);

  if (recentAttempts.length >= maxAttempts) {
    return res.status(429).json({
      success: false,
      message: 'Too many sensitive operations. Please try again later.'
    });
  }

  recentAttempts.push(now);
  global.sensitiveOperations.set(key, recentAttempts);

  next();
};

// Audit logging middleware
const auditLog = (action, resource) => {
  return (req, res, next) => {
    // Store original res.json
    const originalJson = res.json;

    // Override res.json to capture response
    res.json = function(data) {
      // Log the action
      const logData = {
        user: req.user ? req.user._id : null,
        userEmail: req.user ? req.user.email : null,
        action: action,
        resource: resource,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        success: data.success !== false,
        message: data.message,
        resourceId: req.params.id || null
      };

      // In a real application, you'd store this in a dedicated audit log collection
      console.log('AUDIT LOG:', JSON.stringify(logData, null, 2));

      // Call original res.json
      return originalJson.call(this, data);
    };

    next();
  };
};

// Validate API key for external integrations
const validateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key is required.'
      });
    }

    // In a real application, you'd validate this against a database
    // For now, we'll use environment variable
    if (apiKey !== process.env.API_KEY) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key.'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during API key validation.'
    });
  }
};

module.exports = {
  protect,
  authorize,
  checkPermission,
  checkOwnership,
  optionalAuth,
  sensitiveOperation,
  auditLog,
  validateApiKey
};