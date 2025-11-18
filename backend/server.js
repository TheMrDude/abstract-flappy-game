require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Models
const User = require('./models/User');
const Purchase = require('./models/Purchase');
const Score = require('./models/Score');

// Middleware
const { authenticate, generateToken, requirePremium } = require('./middleware/auth');
const { body, validationResult } = require('express-validator');

const app = express();

// ===== MIDDLEWARE SETUP =====

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stripe webhook needs raw body
app.post('/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          await handleCheckoutComplete(session);
          break;
        }

        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object;
          console.log('Payment succeeded:', paymentIntent.id);
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object;
          console.error('Payment failed:', paymentIntent.id);
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Error handling webhook:', error);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  }
);

// ===== ROUTES =====

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ===== AUTHENTICATION ROUTES =====

// Register new user
app.post('/api/auth/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('deviceId').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { email, password, deviceId } = req.body;

      // Check if user already exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }

      // Check if anonymous user exists with this deviceId
      user = await User.findOne({ deviceId });

      if (user) {
        // Convert anonymous user to registered
        user.email = email;
        user.password = password;
        user.isAnonymous = false;
      } else {
        // Create new user
        user = new User({
          email,
          password,
          deviceId,
          isAnonymous: false
        });
      }

      await user.save();

      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          coins: user.coins,
          isPremium: user.isPremium
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed'
      });
    }
  }
);

// Login
app.post('/api/auth/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Find user and explicitly select password
      const user = await User.findOne({ email }).select('+password');

      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      if (user.isBanned) {
        return res.status(403).json({
          success: false,
          message: 'Account has been banned',
          reason: user.banReason
        });
      }

      user.updateActivity();
      await user.save();

      const token = generateToken(user._id);

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          coins: user.coins,
          bestScore: user.bestScore,
          isPremium: user.isPremium,
          ownedSkins: user.ownedSkins,
          currentSkin: user.currentSkin
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed'
      });
    }
  }
);

// ===== USER ROUTES =====

// Get current user profile
app.get('/api/user/profile', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        deviceId: req.user.deviceId,
        isAnonymous: req.user.isAnonymous,
        coins: req.user.coins,
        bestScore: req.user.bestScore,
        totalGamesPlayed: req.user.totalGamesPlayed,
        totalCoinsEarned: req.user.totalCoinsEarned,
        ownedSkins: req.user.ownedSkins,
        currentSkin: req.user.currentSkin,
        powerupInventory: Object.fromEntries(req.user.powerupInventory),
        isPremium: req.user.isPremium,
        loginStreak: req.user.loginStreak,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// Update user profile
app.put('/api/user/profile', authenticate, async (req, res) => {
  try {
    const { currentSkin } = req.body;

    if (currentSkin !== undefined) {
      if (!req.user.ownsSkin(currentSkin)) {
        return res.status(400).json({
          success: false,
          message: 'You do not own this skin'
        });
      }
      req.user.currentSkin = currentSkin;
    }

    await req.user.save();

    res.json({
      success: true,
      user: {
        currentSkin: req.user.currentSkin
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// ===== PURCHASE ROUTES =====

// Purchase item with coins
app.post('/api/purchase/coins',
  authenticate,
  [
    body('type').isIn(['skin', 'powerup']),
    body('itemId').isInt({ min: 0 }),
    body('amount').isInt({ min: 1, max: 10000 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { type, itemId, amount } = req.body;

      // Verify user has enough coins
      if (req.user.coins < amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient coins'
        });
      }

      const coinsBefore = req.user.coins;

      // Spend coins
      req.user.spendCoins(amount);

      // Grant item
      if (type === 'skin') {
        req.user.unlockSkin(itemId);
      } else if (type === 'powerup') {
        const currentAmount = req.user.powerupInventory.get(itemId.toString()) || 0;
        req.user.powerupInventory.set(itemId.toString(), currentAmount + 1);
      }

      await req.user.save();

      // Record purchase
      await Purchase.create({
        user: req.user._id,
        type,
        itemId,
        amount,
        currency: 'coins',
        paymentStatus: 'completed',
        userCoinsBeforePurchase: coinsBefore,
        userCoinsAfterPurchase: req.user.coins,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      res.json({
        success: true,
        coins: req.user.coins,
        ownedSkins: req.user.ownedSkins,
        powerupInventory: Object.fromEntries(req.user.powerupInventory)
      });
    } catch (error) {
      console.error('Purchase error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Purchase failed'
      });
    }
  }
);

// Create Stripe checkout session
app.post('/api/purchase/create-checkout', authenticate, async (req, res) => {
  try {
    const { type, itemId, amount } = req.body;

    // Validate purchase type
    if (!['skin', 'premium'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purchase type'
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: type === 'premium' ? 'Premium Upgrade' : `Skin #${itemId}`,
            description: type === 'premium' ? 'Remove ads and unlock exclusive content' : `Unlock exclusive skin #${itemId}`
          },
          unit_amount: Math.round(amount * 100), // Convert to cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/`,
      client_reference_id: req.user._id.toString(),
      metadata: {
        userId: req.user._id.toString(),
        type,
        itemId: itemId?.toString() || '',
        deviceId: req.user.deviceId
      }
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Checkout creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session'
    });
  }
});

// Handle successful checkout (called from webhook)
async function handleCheckoutComplete(session) {
  const { userId, type, itemId } = session.metadata;

  const user = await User.findById(userId);
  if (!user) {
    console.error('User not found for checkout:', userId);
    return;
  }

  const amount = session.amount_total / 100; // Convert from cents

  // Process purchase based on type
  if (type === 'premium') {
    user.upgradeToPremium(session.customer);
  } else if (type === 'skin') {
    user.unlockSkin(parseInt(itemId));
  }

  await user.save();

  // Record purchase
  await Purchase.create({
    user: user._id,
    type,
    itemId: itemId ? parseInt(itemId) : undefined,
    amount,
    currency: 'usd',
    stripePaymentIntentId: session.payment_intent,
    stripeCustomerId: session.customer,
    paymentStatus: 'completed'
  });

  console.log(`Purchase completed for user ${userId}: ${type}`);
}

// ===== SCORE ROUTES =====

// Submit score
app.post('/api/score/submit',
  authenticate,
  [
    body('score').isInt({ min: 0, max: 10000 }),
    body('seed').notEmpty(),
    body('hash').isLength({ min: 64, max: 64 }),
    body('gameDuration').isInt({ min: 0 }),
    body('timestamp').isISO8601()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { score, seed, hash, gameDuration, timestamp } = req.body;

      // Check if seed was already submitted
      const existingScore = await Score.findOne({ seed });
      if (existingScore) {
        return res.status(400).json({
          success: false,
          message: 'This game has already been submitted'
        });
      }

      // Create score entry
      const scoreEntry = new Score({
        user: req.user._id,
        score,
        seed,
        hash,
        gameDuration,
        timestamp: new Date(timestamp),
        deviceId: req.user.deviceId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      // Validate score
      const isValid = scoreEntry.validate();

      await scoreEntry.save();

      if (!isValid) {
        // Flag user as suspicious
        req.user.flagSuspicious(`Invalid score submission: ${scoreEntry.validationErrors.join(', ')}`);
        await req.user.save();

        return res.status(400).json({
          success: false,
          message: 'Score validation failed',
          errors: scoreEntry.validationErrors
        });
      }

      // Update user's best score
      if (score > req.user.bestScore) {
        req.user.bestScore = score;
      }

      req.user.totalGamesPlayed++;

      // Award coins (2 per point)
      const coinsEarned = score * 2;
      req.user.addCoins(coinsEarned);

      await req.user.save();

      // Check for suspicious activity
      const suspicions = await Score.detectSuspiciousActivity(req.user._id);
      if (suspicions.length > 0) {
        req.user.flagSuspicious(suspicions.join(', '));
        await req.user.save();
      }

      res.json({
        success: true,
        score,
        bestScore: req.user.bestScore,
        coinsEarned,
        totalCoins: req.user.coins
      });
    } catch (error) {
      console.error('Score submission error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit score'
      });
    }
  }
);

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
    const leaderboard = await Score.getLeaderboard(limit);

    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard'
    });
  }
});

// ===== DAILY REWARDS =====

// Claim daily reward
app.post('/api/daily-reward/claim', authenticate, async (req, res) => {
  try {
    const today = new Date().toDateString();
    const lastLogin = req.user.lastLoginDate ? new Date(req.user.lastLoginDate).toDateString() : null;

    if (lastLogin === today) {
      return res.status(400).json({
        success: false,
        message: 'Daily reward already claimed today'
      });
    }

    // Check if streak continues
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (lastLogin === yesterday) {
      req.user.loginStreak++;
    } else {
      req.user.loginStreak = 1;
    }

    req.user.lastLoginDate = new Date();

    // Calculate reward
    const baseReward = 50;
    const streakBonus = Math.min(req.user.loginStreak * 10, 100);
    const totalReward = baseReward + streakBonus;

    const premiumMultiplier = req.user.isPremium ? 2 : 1;
    const finalReward = totalReward * premiumMultiplier;

    req.user.addCoins(finalReward);

    await req.user.save();

    res.json({
      success: true,
      reward: finalReward,
      streak: req.user.loginStreak,
      totalCoins: req.user.coins
    });
  } catch (error) {
    console.error('Daily reward error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to claim daily reward'
    });
  }
});

// ===== ANALYTICS =====

// Track event
app.post('/api/analytics/track', authenticate, async (req, res) => {
  try {
    const { event, params } = req.body;

    // In production, send to analytics service (Google Analytics, Mixpanel, etc.)
    console.log('Analytics event:', {
      userId: req.user._id,
      deviceId: req.user.deviceId,
      event,
      params,
      timestamp: new Date()
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false });
  }
});

// ===== ERROR HANDLING =====

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ===== DATABASE CONNECTION & SERVER START =====

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('✅ Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌍 Frontend URL: ${process.env.FRONTEND_URL}`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  mongoose.connection.close(false, () => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

module.exports = app; // For testing
