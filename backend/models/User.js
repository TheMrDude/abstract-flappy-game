const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Authentication
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true, // Allow multiple null values for anonymous users
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: false,
    select: false // Don't return password by default
  },

  // Anonymous user support
  isAnonymous: {
    type: Boolean,
    default: true
  },
  deviceId: {
    type: String,
    required: true,
    unique: true
  },

  // Game Progress
  coins: {
    type: Number,
    default: 0,
    min: 0,
    max: 10000000
  },
  bestScore: {
    type: Number,
    default: 0,
    min: 0
  },
  totalGamesPlayed: {
    type: Number,
    default: 0,
    min: 0
  },
  totalCoinsEarned: {
    type: Number,
    default: 0,
    min: 0
  },

  // Owned Items
  ownedSkins: {
    type: [Number],
    default: [0] // Everyone starts with default skin
  },
  currentSkin: {
    type: Number,
    default: 0
  },
  powerupInventory: {
    type: Map,
    of: Number,
    default: {}
  },

  // Premium Status
  isPremium: {
    type: Boolean,
    default: false
  },
  premiumPurchaseDate: {
    type: Date
  },
  stripeCustomerId: {
    type: String
  },

  // Daily Rewards
  lastLoginDate: {
    type: Date
  },
  loginStreak: {
    type: Number,
    default: 0,
    min: 0
  },

  // Missions
  dailyMissions: {
    type: [{
      id: String,
      description: String,
      reward: Number,
      target: Number,
      progress: Number,
      completed: Boolean
    }],
    default: []
  },
  missionsResetDate: {
    type: Date
  },

  // Analytics
  adsWatched: {
    type: Number,
    default: 0
  },
  lastAdWatchedAt: {
    type: Date
  },

  // Security
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: {
    type: String
  },
  suspiciousActivity: {
    type: [String],
    default: []
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
userSchema.index({ deviceId: 1 });
userSchema.index({ email: 1 });
userSchema.index({ bestScore: -1 });
userSchema.index({ isPremium: 1 });
userSchema.index({ createdAt: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to add coins (with validation)
userSchema.methods.addCoins = function(amount) {
  amount = Math.max(0, Math.min(10000, amount)); // Cap at 10k per transaction
  this.coins += amount;
  this.totalCoinsEarned += amount;

  // Fraud detection
  if (this.coins > 1000000) {
    this.suspiciousActivity.push(`Excessive coins: ${this.coins} at ${new Date()}`);
  }

  return this.coins;
};

// Method to spend coins
userSchema.methods.spendCoins = function(amount) {
  if (this.coins < amount) {
    throw new Error('Insufficient coins');
  }
  this.coins -= amount;
  return this.coins;
};

// Method to unlock item
userSchema.methods.unlockSkin = function(skinId) {
  if (!this.ownedSkins.includes(skinId)) {
    this.ownedSkins.push(skinId);
  }
};

// Method to check if user owns skin
userSchema.methods.ownsSkin = function(skinId) {
  return this.ownedSkins.includes(skinId);
};

// Method to upgrade to premium
userSchema.methods.upgradeToPremium = function(stripeCustomerId) {
  this.isPremium = true;
  this.premiumPurchaseDate = new Date();
  this.stripeCustomerId = stripeCustomerId;
};

// Method to flag suspicious activity
userSchema.methods.flagSuspicious = function(reason) {
  this.suspiciousActivity.push(`${reason} at ${new Date()}`);
  if (this.suspiciousActivity.length >= 5) {
    this.isBanned = true;
    this.banReason = 'Multiple suspicious activities detected';
  }
};

// Method to update last active
userSchema.methods.updateActivity = function() {
  this.lastActiveAt = new Date();
};

// Static method to find or create anonymous user
userSchema.statics.findOrCreateAnonymous = async function(deviceId) {
  let user = await this.findOne({ deviceId });

  if (!user) {
    user = await this.create({
      deviceId,
      isAnonymous: true
    });
  }

  return user;
};

// Static method to get leaderboard
userSchema.statics.getLeaderboard = async function(limit = 100) {
  return this.find({ isBanned: false })
    .sort({ bestScore: -1 })
    .limit(limit)
    .select('deviceId bestScore isPremium currentSkin createdAt')
    .lean();
};

module.exports = mongoose.model('User', userSchema);
