const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Purchase Details
  type: {
    type: String,
    enum: ['skin', 'powerup', 'premium', 'coins'],
    required: true
  },
  itemId: {
    type: Number // Skin ID or powerup ID
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    enum: ['coins', 'usd'],
    required: true
  },

  // Payment Information (for USD purchases)
  stripePaymentIntentId: {
    type: String
  },
  stripeCustomerId: {
    type: String
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },

  // Metadata
  userCoinsBeforePurchase: {
    type: Number
  },
  userCoinsAfterPurchase: {
    type: Number
  },

  // Fraud Detection
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  isSuspicious: {
    type: Boolean,
    default: false
  },
  suspiciousReasons: {
    type: [String],
    default: []
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
purchaseSchema.index({ user: 1, createdAt: -1 });
purchaseSchema.index({ type: 1 });
purchaseSchema.index({ paymentStatus: 1 });
purchaseSchema.index({ stripePaymentIntentId: 1 });

// Static method to get user purchase history
purchaseSchema.statics.getUserPurchaseHistory = async function(userId, limit = 50) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

// Static method to get revenue statistics
purchaseSchema.statics.getRevenueStats = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        currency: 'usd',
        paymentStatus: 'completed',
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$type',
        totalRevenue: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('Purchase', purchaseSchema);
