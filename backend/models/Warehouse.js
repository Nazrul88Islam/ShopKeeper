const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  warehouseCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Warehouse name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['main', 'china', 'regional', 'transit', 'virtual'],
    required: true
  },
  location: {
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    timezone: String
  },
  contact: {
    managerName: String,
    phone: String,
    email: String,
    alternatePhone: String
  },
  capacity: {
    totalArea: {
      value: Number,
      unit: {
        type: String,
        enum: ['sqft', 'sqm'],
        default: 'sqft'
      }
    },
    storageVolume: {
      value: Number,
      unit: {
        type: String,
        enum: ['cbft', 'cbm'],
        default: 'cbft'
      }
    },
    maxWeight: {
      value: Number,
      unit: {
        type: String,
        enum: ['kg', 'ton'],
        default: 'kg'
      }
    }
  },
  zones: [{
    zoneName: String,
    zoneCode: String,
    zoneType: {
      type: String,
      enum: ['receiving', 'storage', 'picking', 'packing', 'shipping', 'quarantine']
    },
    capacity: Number,
    currentUtilization: {
      type: Number,
      default: 0
    }
  }],
  facilities: {
    hasClimateControl: {
      type: Boolean,
      default: false
    },
    hasSecurity: {
      type: Boolean,
      default: true
    },
    hasFireSafety: {
      type: Boolean,
      default: true
    },
    hasCCTV: {
      type: Boolean,
      default: false
    },
    hasLoadingDock: {
      type: Boolean,
      default: false
    },
    hasForklift: {
      type: Boolean,
      default: false
    },
    operatingHours: {
      start: String,
      end: String,
      timezone: String
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'full'],
    default: 'active'
  },
  currentUtilization: {
    area: {
      type: Number,
      default: 0
    },
    volume: {
      type: Number,
      default: 0
    },
    weight: {
      type: Number,
      default: 0
    }
  },
  costs: {
    rentPerMonth: Number,
    utilitiesPerMonth: Number,
    maintenancePerMonth: Number,
    staffingCost: Number,
    insuranceCost: Number
  },
  staff: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['manager', 'supervisor', 'operator', 'security']
    },
    shift: String
  }],
  notes: String,
  tags: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
warehouseSchema.virtual('utilizationPercentage').get(function() {
  if (this.capacity.totalArea && this.capacity.totalArea.value) {
    return ((this.currentUtilization.area / this.capacity.totalArea.value) * 100).toFixed(2);
  }
  return 0;
});

warehouseSchema.virtual('isNearCapacity').get(function() {
  return this.utilizationPercentage > 80;
});

// Indexes
warehouseSchema.index({ warehouseCode: 1 });
warehouseSchema.index({ type: 1 });
warehouseSchema.index({ status: 1 });
warehouseSchema.index({ 'location.address.city': 1 });
warehouseSchema.index({ 'location.address.country': 1 });

// Pre-save middleware
warehouseSchema.pre('save', async function(next) {
  if (this.isNew && !this.warehouseCode) {
    const count = await this.constructor.countDocuments();
    this.warehouseCode = `WH${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Warehouse', warehouseSchema);