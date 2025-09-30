const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  location: {
    zone: String,
    aisle: String,
    rack: String,
    shelf: String,
    bin: String
  },
  stock: {
    onHand: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    available: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    reserved: {
      type: Number,
      default: 0,
      min: 0
    },
    damaged: {
      type: Number,
      default: 0,
      min: 0
    },
    inTransit: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  reorderPoint: {
    minimum: {
      type: Number,
      default: 0
    },
    maximum: {
      type: Number,
      default: 0
    },
    safetyStock: {
      type: Number,
      default: 0
    }
  },
  costs: {
    averageCost: {
      type: Number,
      default: 0
    },
    lastCost: {
      type: Number,
      default: 0
    },
    totalValue: {
      type: Number,
      default: 0
    }
  },
  tracking: {
    lastStockTake: Date,
    nextStockTake: Date,
    lastMovement: Date,
    turnoverRate: {
      type: Number,
      default: 0
    }
  },
  batches: [{
    batchNumber: String,
    quantity: Number,
    expiryDate: Date,
    manufacturingDate: Date,
    supplierBatch: String,
    cost: Number,
    status: {
      type: String,
      enum: ['good', 'damaged', 'expired', 'quarantine'],
      default: 'good'
    }
  }],
  quality: {
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'damaged'],
      default: 'good'
    },
    lastInspection: Date,
    nextInspection: Date,
    inspectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  },
  movements: [{
    type: {
      type: String,
      enum: ['in', 'out', 'transfer', 'adjustment', 'damage', 'return'],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      enum: [
        'purchase',
        'sale',
        'transfer',
        'adjustment',
        'damage',
        'return',
        'theft',
        'expiry',
        'sample',
        'correction'
      ],
      required: true
    },
    reference: {
      type: String, // Order number, transfer number, etc.
    },
    balanceAfter: Number,
    cost: Number,
    notes: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: {
      type: Date,
      default: Date.now
    },
    approved: {
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  alerts: [{
    type: {
      type: String,
      enum: ['low_stock', 'out_of_stock', 'overstock', 'expiry', 'quality_issue'],
      required: true
    },
    message: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    acknowledged: {
      type: Boolean,
      default: false
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    acknowledgedAt: Date,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [String],
  notes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
inventorySchema.virtual('stockStatus').get(function() {
  if (this.stock.onHand <= 0) return 'out_of_stock';
  if (this.stock.onHand <= this.reorderPoint.minimum) return 'low_stock';
  if (this.stock.onHand >= this.reorderPoint.maximum) return 'overstock';
  return 'in_stock';
});

inventorySchema.virtual('daysOfStock').get(function() {
  // Calculate based on average daily usage (simplified calculation)
  const avgDailyUsage = this.tracking.turnoverRate / 365 || 1;
  return Math.floor(this.stock.available / avgDailyUsage);
});

inventorySchema.virtual('totalStock').get(function() {
  return this.stock.onHand + this.stock.inTransit;
});

// Compound indexes for performance
inventorySchema.index({ product: 1, warehouse: 1 }, { unique: true });
inventorySchema.index({ warehouse: 1 });
inventorySchema.index({ 'stock.onHand': 1 });
inventorySchema.index({ 'reorderPoint.minimum': 1 });
inventorySchema.index({ 'tracking.lastMovement': 1 });
inventorySchema.index({ 'quality.condition': 1 });

// Pre-save middleware
inventorySchema.pre('save', function(next) {
  // Update available stock (onHand - reserved)
  this.stock.available = Math.max(0, this.stock.onHand - this.stock.reserved);
  
  // Calculate total value
  this.costs.totalValue = this.stock.onHand * this.costs.averageCost;
  
  // Check for alerts
  this.checkAndCreateAlerts();
  
  next();
});

// Methods
inventorySchema.methods.addMovement = function(type, quantity, reason, reference, cost, user, notes) {
  const movement = {
    type,
    quantity,
    reason,
    reference,
    cost,
    user,
    notes,
    date: new Date()
  };
  
  // Update stock based on movement type
  if (type === 'in') {
    this.stock.onHand += quantity;
  } else if (type === 'out') {
    this.stock.onHand = Math.max(0, this.stock.onHand - quantity);
  }
  
  movement.balanceAfter = this.stock.onHand;
  this.movements.push(movement);
  this.tracking.lastMovement = new Date();
  
  // Update average cost for incoming stock
  if (type === 'in' && cost) {
    const totalValue = (this.costs.averageCost * (this.stock.onHand - quantity)) + (cost * quantity);
    this.costs.averageCost = totalValue / this.stock.onHand;
    this.costs.lastCost = cost;
  }
  
  return this.save();
};

inventorySchema.methods.reserveStock = function(quantity) {
  if (this.stock.available >= quantity) {
    this.stock.reserved += quantity;
    this.stock.available -= quantity;
    return this.save();
  }
  throw new Error('Insufficient stock available for reservation');
};

inventorySchema.methods.releaseReservation = function(quantity) {
  const releaseQty = Math.min(quantity, this.stock.reserved);
  this.stock.reserved -= releaseQty;
  this.stock.available += releaseQty;
  return this.save();
};

inventorySchema.methods.checkAndCreateAlerts = function() {
  // Clear existing unacknowledged alerts
  this.alerts = this.alerts.filter(alert => alert.acknowledged);
  
  // Low stock alert
  if (this.stock.onHand <= this.reorderPoint.minimum && this.stock.onHand > 0) {
    this.alerts.push({
      type: 'low_stock',
      message: `Stock level is below minimum threshold (${this.reorderPoint.minimum})`,
      severity: 'medium'
    });
  }
  
  // Out of stock alert
  if (this.stock.onHand <= 0) {
    this.alerts.push({
      type: 'out_of_stock',
      message: 'Item is out of stock',
      severity: 'high'
    });
  }
  
  // Overstock alert
  if (this.stock.onHand >= this.reorderPoint.maximum) {
    this.alerts.push({
      type: 'overstock',
      message: `Stock level exceeds maximum threshold (${this.reorderPoint.maximum})`,
      severity: 'low'
    });
  }
  
  // Expiry alerts for batches
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
  
  this.batches.forEach(batch => {
    if (batch.expiryDate && batch.expiryDate <= thirtyDaysFromNow && batch.status === 'good') {
      this.alerts.push({
        type: 'expiry',
        message: `Batch ${batch.batchNumber} expires on ${batch.expiryDate.toDateString()}`,
        severity: batch.expiryDate <= now ? 'critical' : 'high'
      });
    }
  });
};

inventorySchema.methods.performStockTake = function(actualCount, user, notes) {
  const difference = actualCount - this.stock.onHand;
  
  if (difference !== 0) {
    this.addMovement(
      difference > 0 ? 'in' : 'out',
      Math.abs(difference),
      'adjustment',
      `Stock Take - ${new Date().toISOString()}`,
      this.costs.averageCost,
      user,
      notes || `Stock adjustment: Expected ${this.stock.onHand}, Found ${actualCount}`
    );
  }
  
  this.tracking.lastStockTake = new Date();
  // Schedule next stock take (quarterly)
  this.tracking.nextStockTake = new Date(Date.now() + (90 * 24 * 60 * 60 * 1000));
  
  return this.save();
};

// Static methods
inventorySchema.statics.getLowStockItems = function(warehouseId) {
  const query = warehouseId ? { warehouse: warehouseId } : {};
  return this.find(query)
    .where('stock.onHand').lte(this.schema.paths.reorderPoint.minimum)
    .populate('product warehouse');
};

inventorySchema.statics.getExpiringItems = function(days = 30) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  
  return this.find({
    'batches.expiryDate': { $lte: expiryDate },
    'batches.status': 'good'
  }).populate('product warehouse');
};

module.exports = mongoose.model('Inventory', inventorySchema);