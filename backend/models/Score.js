const mongoose = require('mongoose');
const crypto = require('crypto');

const scoreSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Score Details
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 10000 // Reasonable max score
  },
  seed: {
    type: String,
    required: true
  },
  hash: {
    type: String,
    required: true
  },

  // Game Session
  gameDuration: {
    type: Number, // Milliseconds
    min: 0
  },
  timestamp: {
    type: Date,
    required: true
  },

  // Validation
  isValid: {
    type: Boolean,
    default: true
  },
  validationErrors: {
    type: [String],
    default: []
  },

  // Metadata
  deviceId: {
    type: String
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
scoreSchema.index({ user: 1, score: -1 });
scoreSchema.index({ score: -1, createdAt: -1 });
scoreSchema.index({ seed: 1 }, { unique: true }); // Each seed can only be submitted once

// Method to validate score
scoreSchema.methods.validate = function() {
  const errors = [];

  // 1. Check if score is achievable in the time played
  if (this.gameDuration) {
    // Max realistic score: ~2 points per second
    const maxPossibleScore = (this.gameDuration / 1000) * 2;
    if (this.score > maxPossibleScore * 1.5) {
      errors.push('Score too high for game duration');
    }
  }

  // 2. Hash verification
  // Note: Frontend includes pipe data in hash which we don't have on backend
  // Hash is stored for future verification/replay but not validated here
  // Instead we rely on seed uniqueness, duration checks, and activity patterns
  if (!this.hash || this.hash.length !== 64) {
    errors.push('Invalid hash format');
  }

  // 3. Check if score is reasonable
  if (this.score > 1000) {
    errors.push('Score exceeds reasonable maximum');
  }

  // 4. Check timestamp is recent (within last hour)
  const hourAgo = Date.now() - (60 * 60 * 1000);
  if (new Date(this.timestamp) < hourAgo) {
    errors.push('Timestamp too old');
  }

  // 5. Check minimum game duration (at least 1 second)
  if (this.gameDuration && this.gameDuration < 1000) {
    errors.push('Game duration too short');
  }

  this.validationErrors = errors;
  this.isValid = errors.length === 0;

  return this.isValid;
};

// Method to compute expected hash (for verification)
scoreSchema.methods.computeExpectedHash = function() {
  // IMPORTANT: This must match the client-side hashing algorithm exactly
  // Frontend computes: {seed, score, pipes: pipes.map(p => ({top: p.topHeight, bottom: p.bottomY}))}
  // We can't verify pipes on backend, so we accept the hash as-is
  // Additional validation is done via game duration and seed uniqueness

  // For now, we'll skip strict hash verification since we don't have pipe data
  // Instead, rely on:
  // 1. Seed uniqueness (can't submit same game twice)
  // 2. Game duration vs score validation
  // 3. Timestamp validation
  // 4. Suspicious activity detection

  // Return the provided hash (validation happens through other means)
  return this.hash;
};

// Static method to get user's best score
scoreSchema.statics.getUserBestScore = async function(userId) {
  const result = await this.findOne({ user: userId, isValid: true })
    .sort({ score: -1 })
    .select('score createdAt')
    .lean();

  return result ? result.score : 0;
};

// Static method to get leaderboard
scoreSchema.statics.getLeaderboard = async function(limit = 100) {
  return this.aggregate([
    { $match: { isValid: true } },
    {
      $group: {
        _id: '$user',
        bestScore: { $max: '$score' },
        latestScoreDate: { $max: '$createdAt' }
      }
    },
    { $sort: { bestScore: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userInfo'
      }
    },
    { $unwind: '$userInfo' },
    {
      $project: {
        userId: '$_id',
        bestScore: 1,
        latestScoreDate: 1,
        deviceId: '$userInfo.deviceId',
        isPremium: '$userInfo.isPremium',
        currentSkin: '$userInfo.currentSkin'
      }
    }
  ]);
};

// Static method to detect suspicious scoring patterns
scoreSchema.statics.detectSuspiciousActivity = async function(userId) {
  const recentScores = await this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const suspicions = [];

  // Check for impossibly consistent scores
  if (recentScores.length >= 5) {
    const scores = recentScores.map(s => s.score);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;

    if (variance < 1 && avg > 10) {
      suspicions.push('Scores too consistent (possible bot)');
    }
  }

  // Check for rapid score submissions
  if (recentScores.length >= 2) {
    const timeDiff = new Date(recentScores[0].createdAt) - new Date(recentScores[1].createdAt);
    if (timeDiff < 5000) { // Less than 5 seconds between games
      suspicions.push('Games submitted too quickly');
    }
  }

  return suspicions;
};

module.exports = mongoose.model('Score', scoreSchema);
