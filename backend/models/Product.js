const mongoose = require('mongoose');
const Category = require('./Category');

const productSchema = new mongoose.Schema({
  productCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: true,
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  specifications: {
    weight: {
      value: Number,
      unit: {
        type: String,
        enum: ['kg', 'g', 'lb', 'oz'],
        default: 'kg'
      }
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        enum: ['cm', 'm', 'in', 'ft'],
        default: 'cm'
      }
    },
    color: [String],
    size: [String],
    material: String,
    countryOfOrigin: {
      type: String,
      default: 'China'
    }
  },
  pricing: {
    baseCurrency: {
      type: String,
      enum: ['USD', 'CNY', 'EUR', 'BDT'],
      default: 'USD'
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0
    },
    wholesalePrice: {
      type: Number,
      min: 0
    },
    retailPrice: {
      type: Number,
      min: 0
    },
    margin: {
      type: Number,
      default: 0
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  inventory: {
    sku: {
      type: String,
      unique: true,
      sparse: true
    },
    barcode: {
      type: String,
      unique: true,
      sparse: true
    },
    trackInventory: {
      type: Boolean,
      default: true
    },
    stockUnit: {
      type: String,
      enum: ['piece', 'pack', 'box', 'carton', 'kg', 'g', 'liter', 'meter'],
      default: 'piece'
    },
    minimumStock: {
      type: Number,
      default: 0
    },
    maximumStock: {
      type: Number,
      default: 0
    },
    reorderLevel: {
      type: Number,
      default: 0
    },
    currentStock: {
      type: Number,
      default: 0
    }
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  supplierInfo: {
    supplierProductCode: String,
    minimumOrderQuantity: {
      type: Number,
      default: 1
    },
    leadTime: {
      type: Number,
      default: 7 // days
    },
    lastPurchasePrice: Number,
    lastPurchaseDate: Date
  },
  shipping: {
    isShippable: {
      type: Boolean,
      default: true
    },
    shippingWeight: Number,
    shippingDimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    shippingClass: String,
    requiresSpecialHandling: {
      type: Boolean,
      default: false
    },
    hazardous: {
      type: Boolean,
      default: false
    }
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued', 'out_of_stock'],
    default: 'active'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  tags: [String],
  seoInfo: {
    metaTitle: String,
    metaDescription: String,
    slug: String
  },
  variants: [{
    name: String,
    value: String,
    price: Number,
    sku: String,
    stock: Number
  }],
  reviews: {
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },
  salesData: {
    totalSold: {
      type: Number,
      default: 0
    },
    lastSaleDate: Date,
    revenue: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  if (this.pricing.costPrice && this.pricing.sellingPrice) {
    return ((this.pricing.sellingPrice - this.pricing.costPrice) / this.pricing.costPrice * 100).toFixed(2);
  }
  return 0;
});

// Virtual for availability status
productSchema.virtual('availabilityStatus').get(function() {
  if (!this.inventory.trackInventory) return 'available';
  if (this.inventory.currentStock <= 0) return 'out_of_stock';
  if (this.inventory.currentStock <= this.inventory.reorderLevel) return 'low_stock';
  return 'in_stock';
});

// Indexes
productSchema.index({ productCode: 1 });
productSchema.index({ name: 1 });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ supplier: 1 });
productSchema.index({ status: 1 });
productSchema.index({ 'inventory.sku': 1 });
productSchema.index({ 'inventory.barcode': 1 });
productSchema.index({ tags: 1 });
productSchema.index({ 'pricing.sellingPrice': 1 });
productSchema.index({ createdAt: -1 });

// Text index for search
productSchema.index({
  name: 'text',
  description: 'text',
  category: 'text',
  brand: 'text',
  tags: 'text'
});

// Pre-save middleware
productSchema.pre('save', async function(next) {
  if (this.isNew && !this.productCode) {
    const count = await this.constructor.countDocuments();
    this.productCode = `PRD${String(count + 1).padStart(6, '0')}`;
  }
  
  // Generate SKU if not provided
  if (this.isNew && !this.inventory.sku) {
    this.inventory.sku = `${this.category.substring(0, 3).toUpperCase()}-${this.productCode}`;
  }
  
  // Calculate profit margin
  if (this.pricing.costPrice && this.pricing.sellingPrice) {
    this.pricing.margin = ((this.pricing.sellingPrice - this.pricing.costPrice) / this.pricing.costPrice * 100);
  }
  
  // Generate slug for SEO
  if (!this.seoInfo.slug) {
    this.seoInfo.slug = this.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  next();
});

// Methods
productSchema.methods.updateStock = function(quantity, operation = 'subtract') {
  if (operation === 'add') {
    this.inventory.currentStock += quantity;
  } else {
    this.inventory.currentStock -= quantity;
  }
  
  if (this.inventory.currentStock < 0) {
    this.inventory.currentStock = 0;
  }
  
  return this.save();
};

productSchema.methods.isInStock = function(quantity = 1) {
  if (!this.inventory.trackInventory) return true;
  return this.inventory.currentStock >= quantity;
};

productSchema.methods.needsReorder = function() {
  if (!this.inventory.trackInventory) return false;
  return this.inventory.currentStock <= this.inventory.reorderLevel;
};

module.exports = mongoose.model('Product', productSchema);