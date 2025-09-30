const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  orderType: {
    type: String,
    enum: ['regular', 'urgent', 'sample', 'wholesale'],
    default: 'regular'
  },
  orderSource: {
    type: String,
    enum: ['website', 'phone', 'email', 'walk_in', 'sales_rep'],
    default: 'website'
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: String,
    productCode: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    specifications: {
      color: String,
      size: String,
      customization: String
    },
    notes: String
  }],
  
  // Order Status Tracking System
  status: {
    type: String,
    enum: [
      'pending',           // Customer order placed
      'confirmed',         // Order confirmed by sales team
      'supplier_contacted', // Supplier contacted for procurement
      'supplier_confirmed', // Supplier confirmed availability
      'payment_pending',   // Waiting for payment confirmation
      'payment_received',  // Payment received from customer
      'procurement_started', // Started procurement from supplier
      'china_warehouse',   // Stock received in China warehouse
      'international_shipping', // Shipped from China (Sea/Air)
      'customs_clearance', // Going through customs
      'local_warehouse',   // Arrived at local company warehouse
      'ready_for_delivery', // Ready for final delivery
      'out_for_delivery',  // Out for delivery to customer
      'delivered',         // Delivered to customer
      'completed',         // Order completed successfully
      'cancelled',         // Order cancelled
      'returned',          // Order returned
      'refunded'           // Order refunded
    ],
    default: 'pending'
  },
  
  // Detailed tracking for each stage
  tracking: {
    orderPlaced: {
      date: {
        type: Date,
        default: Date.now
      },
      notes: String,
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    orderConfirmed: {
      date: Date,
      notes: String,
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    supplierContacted: {
      date: Date,
      supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier'
      },
      contactMethod: String,
      expectedDelivery: Date,
      notes: String,
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    supplierConfirmed: {
      date: Date,
      confirmedDelivery: Date,
      supplierOrderNumber: String,
      notes: String,
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    paymentReceived: {
      date: Date,
      amount: Number,
      method: {
        type: String,
        enum: ['cash', 'bank_transfer', 'credit_card', 'mobile_payment', 'cheque']
      },
      reference: String,
      notes: String,
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    procurementStarted: {
      date: Date,
      purchaseOrderNumber: String,
      expectedArrival: Date,
      notes: String,
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    chinaWarehouse: {
      date: Date,
      warehouseLocation: String,
      receivedQuantity: [{
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product'
        },
        quantity: Number,
        condition: String
      }],
      qualityCheck: {
        status: {
          type: String,
          enum: ['pending', 'passed', 'failed', 'partial']
        },
        notes: String,
        images: [String]
      },
      notes: String,
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    internationalShipping: {
      date: Date,
      method: {
        type: String,
        enum: ['sea', 'air', 'express']
      },
      carrier: String,
      trackingNumber: String,
      estimatedArrival: Date,
      shippingCost: Number,
      weight: Number,
      dimensions: String,
      notes: String,
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    customsClearance: {
      date: Date,
      clearanceAgent: String,
      customsValue: Number,
      dutyPaid: Number,
      taxPaid: Number,
      clearanceStatus: {
        type: String,
        enum: ['pending', 'in_progress', 'cleared', 'held']
      },
      notes: String,
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    localWarehouse: {
      date: Date,
      warehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse'
      },
      receivedQuantity: [{
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product'
        },
        quantity: Number,
        condition: String
      }],
      finalQualityCheck: {
        status: {
          type: String,
          enum: ['pending', 'passed', 'failed', 'partial']
        },
        notes: String,
        images: [String]
      },
      notes: String,
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    readyForDelivery: {
      date: Date,
      packedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      packingDetails: String,
      scheduledDelivery: Date,
      notes: String
    },
    outForDelivery: {
      date: Date,
      deliveryMethod: {
        type: String,
        enum: ['courier', 'own_vehicle', 'customer_pickup']
      },
      deliveryAgent: String,
      estimatedDelivery: Date,
      trackingNumber: String,
      notes: String,
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    delivered: {
      date: Date,
      deliveredTo: String,
      signature: String,
      deliveryProof: [String], // Images
      customerFeedback: String,
      notes: String,
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  },
  
  // Financial Information
  pricing: {
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    tax: {
      type: Number,
      default: 0
    },
    taxRate: {
      type: Number,
      default: 0
    },
    shippingCost: {
      type: Number,
      default: 0
    },
    handlingFee: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      enum: ['BDT', 'USD', 'EUR'],
      default: 'BDT'
    }
  },
  
  // Payment Information
  payment: {
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'overdue', 'refunded'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['cash', 'bank_transfer', 'credit_card', 'mobile_payment', 'cheque', 'installment']
    },
    terms: {
      type: String,
      enum: ['cash', 'net15', 'net30', 'net45', 'net60'],
      default: 'cash'
    },
    dueDate: Date,
    paidAmount: {
      type: Number,
      default: 0
    },
    remainingAmount: {
      type: Number,
      default: 0
    },
    installments: [{
      amount: Number,
      dueDate: Date,
      paidDate: Date,
      status: {
        type: String,
        enum: ['pending', 'paid', 'overdue']
      }
    }]
  },
  
  // Shipping Information
  shipping: {
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    method: {
      type: String,
      enum: ['standard', 'express', 'overnight', 'pickup']
    },
    carrier: String,
    trackingNumber: String,
    estimatedDelivery: Date,
    actualDelivery: Date,
    cost: Number,
    weight: Number,
    dimensions: String
  },
  
  // Additional Information
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  assignedTo: {
    salesRep: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    accountManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  communications: [{
    date: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['call', 'email', 'sms', 'whatsapp', 'note']
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound']
    },
    subject: String,
    content: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  notes: String,
  tags: [String],
  
  // Timeline for audit
  timeline: [{
    action: String,
    description: String,
    date: {
      type: Date,
      default: Date.now
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    data: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
orderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

orderSchema.virtual('isOverdue').get(function() {
  return this.payment.dueDate && this.payment.dueDate < new Date() && this.payment.status !== 'paid';
});

orderSchema.virtual('daysInProgress').get(function() {
  return Math.floor((new Date() - this.tracking.orderPlaced.date) / (1000 * 60 * 60 * 24));
});

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ 'payment.dueDate': 1 });
orderSchema.index({ priority: 1 });
orderSchema.index({ 'assignedTo.salesRep': 1 });

// Pre-save middleware
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const count = await this.constructor.countDocuments();
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = String(today.getMonth() + 1).padStart(2, '0');
    this.orderNumber = `ORD${year}${month}${String(count + 1).padStart(4, '0')}`;
  }
  
  // Calculate totals
  this.pricing.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  if (this.pricing.discountType === 'percentage') {
    this.pricing.discount = (this.pricing.subtotal * this.pricing.discount) / 100;
  }
  
  this.pricing.tax = ((this.pricing.subtotal - this.pricing.discount) * this.pricing.taxRate) / 100;
  this.pricing.total = this.pricing.subtotal - this.pricing.discount + this.pricing.tax + this.pricing.shippingCost + this.pricing.handlingFee;
  
  // Calculate remaining payment amount
  this.payment.remainingAmount = this.pricing.total - this.payment.paidAmount;
  
  // Update payment status
  if (this.payment.paidAmount >= this.pricing.total) {
    this.payment.status = 'paid';
  } else if (this.payment.paidAmount > 0) {
    this.payment.status = 'partial';
  }
  
  next();
});

// Methods
orderSchema.methods.updateStatus = function(newStatus, user, notes) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Add to timeline
  this.timeline.push({
    action: 'status_change',
    description: `Status changed from ${oldStatus} to ${newStatus}`,
    user: user,
    data: { oldStatus, newStatus, notes }
  });
  
  // Update specific tracking stage
  const trackingMap = {
    'confirmed': 'orderConfirmed',
    'supplier_contacted': 'supplierContacted',
    'supplier_confirmed': 'supplierConfirmed',
    'payment_received': 'paymentReceived',
    'procurement_started': 'procurementStarted',
    'china_warehouse': 'chinaWarehouse',
    'international_shipping': 'internationalShipping',
    'customs_clearance': 'customsClearance',
    'local_warehouse': 'localWarehouse',
    'ready_for_delivery': 'readyForDelivery',
    'out_for_delivery': 'outForDelivery',
    'delivered': 'delivered'
  };
  
  if (trackingMap[newStatus]) {
    this.tracking[trackingMap[newStatus]] = {
      date: new Date(),
      notes: notes,
      user: user
    };
  }
  
  return this.save();
};

orderSchema.methods.addPayment = function(amount, method, reference, user) {
  this.payment.paidAmount += amount;
  this.payment.remainingAmount = this.pricing.total - this.payment.paidAmount;
  
  if (this.payment.paidAmount >= this.pricing.total) {
    this.payment.status = 'paid';
  } else {
    this.payment.status = 'partial';
  }
  
  // Add to timeline
  this.timeline.push({
    action: 'payment_received',
    description: `Payment of ${amount} received via ${method}`,
    user: user,
    data: { amount, method, reference }
  });
  
  return this.save();
};

orderSchema.methods.addCommunication = function(type, direction, subject, content, user) {
  this.communications.push({
    type,
    direction,
    subject,
    content,
    user
  });
  
  return this.save();
};

module.exports = mongoose.model('Order', orderSchema);