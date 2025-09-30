const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    lowercase: true,
    trim: true,
    minlength: [2, 'Role name must be at least 2 characters'],
    maxlength: [50, 'Role name cannot be more than 50 characters'],
    match: [
      /^[a-zA-Z0-9_]+$/,
      'Role name can only contain letters, numbers, and underscores'
    ]
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true,
    minlength: [2, 'Display name must be at least 2 characters'],
    maxlength: [100, 'Display name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  permissions: [{
    module: {
      type: String,
      enum: ['orders', 'inventory', 'customers', 'suppliers', 'accounting', 'reports', 'users', 'settings', 'products'],
      required: true
    },
    actions: [{
      type: String,
      enum: ['create', 'read', 'update', 'delete'],
      required: true
    }]
  }],
  isSystem: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  userCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for performance
roleSchema.index({ name: 1 });
roleSchema.index({ isActive: 1 });
roleSchema.index({ isSystem: 1 });

// Virtual for permission count
roleSchema.virtual('permissionCount').get(function() {
  return this.permissions ? this.permissions.reduce((total, perm) => total + perm.actions.length, 0) : 0;
});

// Pre-save middleware to ensure lowercase role name
roleSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.name = this.name.toLowerCase();
  }
  next();
});

// Static method to get default system roles
roleSchema.statics.getSystemRoles = function() {
  return [
    {
      name: 'admin',
      displayName: 'Administrator',
      description: 'Full system access with all permissions',
      permissions: [
        { module: 'orders', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'inventory', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'customers', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'suppliers', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'accounting', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'reports', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'users', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'settings', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'products', actions: ['create', 'read', 'update', 'delete'] }
      ],
      isSystem: true,
      isActive: true
    },
    {
      name: 'manager',
      displayName: 'Manager',
      description: 'Management access to operations and reporting',
      permissions: [
        { module: 'orders', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'inventory', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'customers', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'suppliers', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'products', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'reports', actions: ['read'] },
        { module: 'users', actions: ['read', 'update'] }
      ],
      isSystem: true,
      isActive: true
    },
    {
      name: 'sales',
      displayName: 'Sales Representative',
      description: 'Access to orders and customer management',
      permissions: [
        { module: 'orders', actions: ['create', 'read', 'update'] },
        { module: 'customers', actions: ['create', 'read', 'update'] },
        { module: 'products', actions: ['read'] },
        { module: 'inventory', actions: ['read'] }
      ],
      isSystem: true,
      isActive: true
    },
    {
      name: 'inventory',
      displayName: 'Inventory Manager',
      description: 'Full inventory and supplier management access',
      permissions: [
        { module: 'inventory', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'products', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'orders', actions: ['read', 'update'] },
        { module: 'suppliers', actions: ['create', 'read', 'update', 'delete'] }
      ],
      isSystem: true,
      isActive: true
    },
    {
      name: 'accountant',
      displayName: 'Accountant',
      description: 'Access to accounting and financial reports',
      permissions: [
        { module: 'accounting', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'reports', actions: ['read'] },
        { module: 'orders', actions: ['read'] }
      ],
      isSystem: true,
      isActive: true
    },
    {
      name: 'customer_service',
      displayName: 'Customer Service',
      description: 'Customer support and order management',
      permissions: [
        { module: 'orders', actions: ['read', 'update'] },
        { module: 'customers', actions: ['read', 'update'] }
      ],
      isSystem: true,
      isActive: true
    }
  ];
};

module.exports = mongoose.model('Role', roleSchema);