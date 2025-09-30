const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  saleNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  saleType: {
    type: String,
    enum: ['CASH', 'CREDIT', 'RETURN', 'EXCHANGE'],
    default: 'CASH'
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  salesPerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  
  // Sale Items
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: String,
    productCode: String,
    description: String,
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    discountType: {
      type: String,
      enum: ['PERCENTAGE', 'FIXED'],
      default: 'PERCENTAGE'
    },
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0
    },
    cost: {
      type: Number,
      min: 0
    },
    profit: {
      type: Number,
      default: 0
    },
    notes: String
  }],
  
  // Pricing Summary
  pricing: {
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    totalDiscount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalTax: {
      type: Number,
      default: 0,
      min: 0
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: 0
    },
    handlingFee: {
      type: Number,
      default: 0,
      min: 0
    },
    adjustmentAmount: {
      type: Number,
      default: 0
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0
    },
    totalCost: {
      type: Number,
      default: 0,
      min: 0
    },
    totalProfit: {
      type: Number,
      default: 0
    },
    profitMargin: {
      type: Number,
      default: 0
    }
  },
  
  // Payment Information
  payment: {
    method: {
      type: String,
      enum: ['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_PAYMENT', 'CHEQUE', 'CREDIT'],
      required: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'PARTIAL', 'OVERDUE', 'REFUNDED'],
      default: 'PENDING'
    },
    totalReceived: {
      type: Number,
      default: 0,
      min: 0
    },
    changeGiven: {
      type: Number,
      default: 0,
      min: 0
    },
    remainingBalance: {
      type: Number,
      default: 0,
      min: 0
    },
    dueDate: Date,
    creditTerms: {
      type: String,
      enum: ['NET15', 'NET30', 'NET45', 'NET60'],
      default: 'NET30'
    },
    referenceNumber: String,
    bankAccount: String,
    chequeNumber: String,
    chequeDate: Date
  },
  
  // Transaction Details
  saleDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  deliveryDate: Date,
  expectedDeliveryDate: Date,
  
  // Status Tracking
  status: {
    type: String,
    enum: [
      'DRAFT',
      'CONFIRMED',
      'PROCESSING',
      'PACKED',
      'SHIPPED',
      'DELIVERED',
      'COMPLETED',
      'CANCELLED',
      'RETURNED',
      'REFUNDED'
    ],
    default: 'DRAFT'
  },
  
  // Inventory Impact
  inventoryUpdated: {
    type: Boolean,
    default: false
  },
  inventoryTransactions: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse'
    },
    quantity: Number,
    type: {
      type: String,
      enum: ['OUT', 'RETURN']
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Delivery Information
  delivery: {
    method: {
      type: String,
      enum: ['PICKUP', 'DELIVERY', 'SHIPPING']
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    carrier: String,
    trackingNumber: String,
    shippingCost: Number,
    deliveryInstructions: String
  },
  
  // Returns and Exchanges
  returns: [{
    returnDate: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      enum: ['DEFECTIVE', 'WRONG_ITEM', 'DAMAGED', 'CUSTOMER_CHANGE', 'WARRANTY', 'OTHER']
    },
    items: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      quantity: Number,
      reason: String,
      condition: {
        type: String,
        enum: ['NEW', 'GOOD', 'DAMAGED', 'DEFECTIVE']
      },
      refundAmount: Number
    }],
    totalRefund: Number,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  
  // Discounts and Promotions
  discounts: [{
    type: {
      type: String,
      enum: ['PERCENTAGE', 'FIXED', 'COUPON', 'LOYALTY', 'BULK']
    },
    name: String,
    code: String,
    amount: Number,
    appliedTo: {
      type: String,
      enum: ['TOTAL', 'ITEM', 'CATEGORY']
    },
    description: String
  }],
  
  // Customer Information Snapshot
  customerInfo: {
    name: String,
    email: String,
    phone: String,
    loyaltyPoints: Number,
    customerType: String
  },
  
  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  voidedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  voidedDate: Date,
  voidReason: String,
  
  // Additional Information
  channel: {
    type: String,
    enum: ['POS', 'ONLINE', 'PHONE', 'EMAIL', 'WALK_IN'],
    default: 'POS'
  },
  source: {
    type: String,
    enum: ['DIRECT', 'REFERRAL', 'MARKETING', 'SOCIAL_MEDIA', 'OTHER']
  },
  tags: [String],
  notes: String,
  internalNotes: String,
  
  // Integration References
  integrationRefs: {
    orderNumber: String,
    invoiceNumber: String,
    receiptNumber: String,
    externalId: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
saleSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

saleSchema.virtual('isOverdue').get(function() {
  return this.payment.dueDate && 
         this.payment.dueDate < new Date() && 
         this.payment.status !== 'PAID';
});

saleSchema.virtual('profitMarginPercent').get(function() {
  if (this.pricing.totalCost > 0) {
    return ((this.pricing.totalProfit / this.pricing.totalCost) * 100).toFixed(2);
  }
  return 0;
});

// Indexes
saleSchema.index({ saleNumber: 1 });
saleSchema.index({ customer: 1 });
saleSchema.index({ salesPerson: 1 });
saleSchema.index({ warehouse: 1 });
saleSchema.index({ saleDate: -1 });
saleSchema.index({ status: 1 });
saleSchema.index({ 'payment.status': 1 });
saleSchema.index({ 'payment.dueDate': 1 });
saleSchema.index({ channel: 1 });
saleSchema.index({ createdAt: -1 });

// Pre-save middleware
saleSchema.pre('save', async function(next) {
  // Generate sale number
  if (this.isNew && !this.saleNumber) {
    const count = await this.constructor.countDocuments();
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = String(today.getMonth() + 1).padStart(2, '0');
    this.saleNumber = `SALE${year}${month}${String(count + 1).padStart(5, '0')}`;
  }
  
  // Calculate line totals and profits
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  let totalCost = 0;
  let totalProfit = 0;
  
  for (const item of this.items) {
    // Calculate discount amount
    let discountAmount = 0;
    if (item.discountType === 'PERCENTAGE') {
      discountAmount = (item.unitPrice * item.quantity * item.discount) / 100;
    } else {
      discountAmount = item.discount;
    }
    
    // Calculate tax amount
    const taxableAmount = (item.unitPrice * item.quantity) - discountAmount;
    const taxAmount = (taxableAmount * item.taxRate) / 100;
    
    // Calculate line total
    item.lineTotal = taxableAmount + taxAmount;
    
    // Calculate profit
    const itemCost = (item.cost || 0) * item.quantity;
    item.profit = item.lineTotal - itemCost;
    
    // Add to totals
    subtotal += (item.unitPrice * item.quantity);
    totalDiscount += discountAmount;
    totalTax += taxAmount;
    totalCost += itemCost;
    totalProfit += item.profit;
  }
  
  // Update pricing
  this.pricing.subtotal = subtotal;
  this.pricing.totalDiscount = totalDiscount;
  this.pricing.totalTax = totalTax;
  this.pricing.totalCost = totalCost;
  this.pricing.totalProfit = totalProfit;
  this.pricing.grandTotal = subtotal - totalDiscount + totalTax + 
                           this.pricing.shippingCost + this.pricing.handlingFee + 
                           this.pricing.adjustmentAmount;
  
  // Calculate profit margin
  if (this.pricing.totalCost > 0) {
    this.pricing.profitMargin = (this.pricing.totalProfit / this.pricing.totalCost) * 100;
  }
  
  // Update remaining balance
  this.payment.remainingBalance = this.pricing.grandTotal - this.payment.totalReceived;
  
  // Update payment status
  if (this.payment.totalReceived >= this.pricing.grandTotal) {
    this.payment.status = 'PAID';
  } else if (this.payment.totalReceived > 0) {
    this.payment.status = 'PARTIAL';
  }
  
  next();
});

// Methods
saleSchema.methods.processPayment = function(amount, method, reference, userId) {
  this.payment.totalReceived += amount;
  this.payment.remainingBalance = this.pricing.grandTotal - this.payment.totalReceived;
  
  if (this.payment.totalReceived >= this.pricing.grandTotal) {
    this.payment.status = 'PAID';
    this.payment.changeGiven = this.payment.totalReceived - this.pricing.grandTotal;
  } else {
    this.payment.status = 'PARTIAL';
  }
  
  this.modifiedBy = userId;
  
  return this.save();
};

saleSchema.methods.updateInventory = async function() {
  if (this.inventoryUpdated) return;
  
  const Inventory = mongoose.model('Inventory');
  
  for (const item of this.items) {
    const inventory = await Inventory.findOne({
      product: item.product,
      warehouse: this.warehouse
    });
    
    if (inventory) {
      await inventory.addMovement(
        'out',
        item.quantity,
        'sale',
        this.saleNumber,
        item.cost,
        this.salesPerson,
        `Sale to customer: ${this.customerInfo.name}`
      );
      
      this.inventoryTransactions.push({
        product: item.product,
        warehouse: this.warehouse,
        quantity: item.quantity,
        type: 'OUT'
      });
    }
  }
  
  this.inventoryUpdated = true;
  return this.save();
};

saleSchema.methods.processReturn = function(returnItems, reason, userId) {
  const returnData = {
    reason,
    items: returnItems,
    processedBy: userId,
    totalRefund: returnItems.reduce((sum, item) => sum + item.refundAmount, 0)
  };
  
  this.returns.push(returnData);
  
  // Update status if full return
  const totalReturnedQuantity = this.returns.reduce((total, ret) => {
    return total + ret.items.reduce((sum, item) => sum + item.quantity, 0);
  }, 0);
  
  const totalSoldQuantity = this.items.reduce((total, item) => total + item.quantity, 0);
  
  if (totalReturnedQuantity >= totalSoldQuantity) {
    this.status = 'RETURNED';
  }
  
  return this.save();
};

saleSchema.methods.void = function(reason, userId) {
  if (this.status === 'COMPLETED') {
    throw new Error('Completed sales cannot be voided');
  }
  
  this.status = 'CANCELLED';
  this.voidedBy = userId;
  this.voidedDate = new Date();
  this.voidReason = reason;
  
  return this.save();
};

// Static methods
saleSchema.statics.getSalesReport = function(startDate, endDate, filters = {}) {
  const match = {
    saleDate: { $gte: startDate, $lte: endDate },
    status: { $nin: ['CANCELLED', 'RETURNED'] }
  };
  
  if (filters.salesPerson) match.salesPerson = filters.salesPerson;
  if (filters.warehouse) match.warehouse = filters.warehouse;
  if (filters.channel) match.channel = filters.channel;
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$pricing.grandTotal' },
        totalProfit: { $sum: '$pricing.totalProfit' },
        totalTransactions: { $sum: 1 },
        averageTicket: { $avg: '$pricing.grandTotal' },
        totalItems: { $sum: { $sum: '$items.quantity' } }
      }
    }
  ]);
};

module.exports = mongoose.model('Sale', saleSchema);