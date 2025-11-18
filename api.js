/**
 * API Client for Abstract Flappy Game
 *
 * This file handles all communication with the backend API.
 * Include this in your index.html before the main game script.
 *
 * Usage:
 *   const api = new GameAPI('https://your-backend.railway.app');
 *   await api.register('user@example.com', 'password', deviceId);
 *   const profile = await api.getProfile();
 */

class GameAPI {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('authToken');
    this.deviceId = this.getOrCreateDeviceId();
  }

  /**
   * Get or create unique device ID
   */
  getOrCreateDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  /**
   * Make authenticated API request
   */
  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add authentication
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    } else {
      headers['X-Device-ID'] = this.deviceId;
    }

    const config = {
      ...options,
      headers
    };

    if (options.body && typeof options.body !== 'string') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // ===== AUTHENTICATION =====

  /**
   * Register new user
   */
  async register(email, password) {
    const data = await this.request('/api/auth/register', {
      method: 'POST',
      body: { email, password, deviceId: this.deviceId }
    });

    if (data.success && data.token) {
      this.token = data.token;
      localStorage.setItem('authToken', this.token);
    }

    return data;
  }

  /**
   * Login existing user
   */
  async login(email, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    });

    if (data.success && data.token) {
      this.token = data.token;
      localStorage.setItem('authToken', this.token);
    }

    return data;
  }

  /**
   * Logout user
   */
  logout() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  /**
   * Check if user is logged in
   */
  isAuthenticated() {
    return !!this.token;
  }

  // ===== USER PROFILE =====

  /**
   * Get current user profile
   */
  async getProfile() {
    const data = await this.request('/api/user/profile');
    return data.user;
  }

  /**
   * Update user profile
   */
  async updateProfile(updates) {
    const data = await this.request('/api/user/profile', {
      method: 'PUT',
      body: updates
    });
    return data.user;
  }

  /**
   * Sync local state with server
   */
  async syncState() {
    try {
      const profile = await this.getProfile();

      // Update local storage with server data
      localStorage.setItem('coins', profile.coins);
      localStorage.setItem('bestScore', profile.bestScore);
      localStorage.setItem('isPremium', profile.isPremium);
      localStorage.setItem('ownedSkins', JSON.stringify(profile.ownedSkins));
      localStorage.setItem('currentSkin', profile.currentSkin);
      localStorage.setItem('powerupInventory', JSON.stringify(profile.powerupInventory));
      localStorage.setItem('loginStreak', profile.loginStreak);

      return profile;
    } catch (error) {
      console.warn('Failed to sync state:', error);
      return null;
    }
  }

  // ===== PURCHASES =====

  /**
   * Purchase item with coins
   */
  async purchaseWithCoins(type, itemId, amount) {
    return await this.request('/api/purchase/coins', {
      method: 'POST',
      body: { type, itemId, amount }
    });
  }

  /**
   * Create Stripe checkout session
   */
  async createCheckout(type, itemId, amount) {
    return await this.request('/api/purchase/create-checkout', {
      method: 'POST',
      body: { type, itemId, amount }
    });
  }

  /**
   * Buy skin with coins
   */
  async buySkinWithCoins(skinId, price) {
    return await this.purchaseWithCoins('skin', skinId, price);
  }

  /**
   * Buy power-up with coins
   */
  async buyPowerup(powerupType, price) {
    return await this.purchaseWithCoins('powerup', powerupType, price);
  }

  /**
   * Upgrade to premium (creates Stripe checkout)
   */
  async upgradeToPremium() {
    const data = await this.createCheckout('premium', null, 4.99);

    // Redirect to Stripe checkout
    if (data.success && data.url) {
      window.location.href = data.url;
    }

    return data;
  }

  // ===== SCORES =====

  /**
   * Submit game score
   */
  async submitScore(score, seed, hash, gameDuration) {
    return await this.request('/api/score/submit', {
      method: 'POST',
      body: {
        score,
        seed,
        hash,
        gameDuration,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit = 100) {
    const data = await this.request(`/api/leaderboard?limit=${limit}`);
    return data.leaderboard;
  }

  // ===== DAILY REWARDS =====

  /**
   * Claim daily reward
   */
  async claimDailyReward() {
    return await this.request('/api/daily-reward/claim', {
      method: 'POST'
    });
  }

  // ===== ANALYTICS =====

  /**
   * Track analytics event
   */
  async trackEvent(event, params = {}) {
    try {
      await this.request('/api/analytics/track', {
        method: 'POST',
        body: { event, params }
      });
    } catch (error) {
      // Don't throw on analytics failures
      console.warn('Analytics tracking failed:', error);
    }
  }
}

// ===== INTEGRATION HELPERS =====

/**
 * Initialize API and sync state on page load
 */
async function initializeGame() {
  // Set your backend URL here
  const API_URL = 'http://localhost:3000'; // Change to your Railway URL
  window.gameAPI = new GameAPI(API_URL);

  // Try to sync state with server
  try {
    const profile = await window.gameAPI.syncState();
    if (profile) {
      console.log('✅ Synced with server:', profile);
      return profile;
    }
  } catch (error) {
    console.warn('⚠️ Could not sync with server, using local state');
  }

  return null;
}

/**
 * Handle successful Stripe checkout
 * Call this on your success page
 */
async function handleCheckoutSuccess(sessionId) {
  // Stripe redirects back with session_id in URL
  if (sessionId) {
    // Wait a moment for webhook to process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Sync state to get updated premium status
    await window.gameAPI.syncState();

    // Show success message
    console.log('✅ Purchase successful!');
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GameAPI, initializeGame, handleCheckoutSuccess };
}
