const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generate JWT token for user
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Middleware to authenticate user from JWT token or create anonymous user
 */
const authenticate = async (req, res, next) => {
  try {
    // Try to get token from Authorization header
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // If no token, check for deviceId (anonymous user)
    if (!token) {
      const deviceId = req.headers['x-device-id'] || req.body.deviceId;

      if (!deviceId) {
        return res.status(401).json({
          success: false,
          message: 'No authentication token or device ID provided'
        });
      }

      // Find or create anonymous user
      const user = await User.findOrCreateAnonymous(deviceId);
      user.updateActivity();
      await user.save();

      req.user = user;
      req.userId = user._id;
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Account has been banned',
        reason: user.banReason
      });
    }

    // Update last active
    user.updateActivity();
    await user.save();

    // Attach user to request
    req.user = user;
    req.userId = user._id;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Middleware to require premium status
 */
const requirePremium = (req, res, next) => {
  if (!req.user.isPremium) {
    return res.status(403).json({
      success: false,
      message: 'Premium subscription required'
    });
  }
  next();
};

/**
 * Middleware to require registered (non-anonymous) user
 */
const requireRegistered = (req, res, next) => {
  if (req.user.isAnonymous) {
    return res.status(403).json({
      success: false,
      message: 'Account registration required'
    });
  }
  next();
};

module.exports = {
  generateToken,
  authenticate,
  requirePremium,
  requireRegistered
};
