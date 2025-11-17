# Deployment Guide - Abstract Flappy Revenue Edition

## Quick Start Deployment

### Option 1: Vercel (Recommended - Free Tier)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd /path/to/abstract-flappy-game
   vercel
   ```

3. **Follow prompts**
   - Link to your account
   - Set project name
   - Deploy!

**Result**: Live URL in ~60 seconds (e.g., `abstract-flappy.vercel.app`)

### Option 2: Netlify

1. **Drag & Drop**
   - Go to https://app.netlify.com/drop
   - Drag the entire folder
   - Instant deployment!

2. **Or use CLI**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod
   ```

### Option 3: GitHub Pages

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Deploy revenue game"
   git push origin main
   ```

2. **Enable GitHub Pages**
   - Go to repository Settings
   - Pages → Source: main branch
   - Save

**URL**: `https://yourusername.github.io/abstract-flappy-game`

---

## Full Production Deployment

### Step 1: Backend Setup (Required for Payments)

#### Option A: Node.js + Express + MongoDB

Create `backend/server.js`:
```javascript
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Schema
const UserSchema = new mongoose.Schema({
  userId: String,
  isPremium: Boolean,
  coins: Number,
  ownedSkins: [Number],
  purchases: [{
    type: String,
    amount: Number,
    date: Date
  }]
});

const User = mongoose.model('User', UserSchema);

// Stripe Payment Endpoint
app.post('/create-checkout-session', async (req, res) => {
  const { amount, type, itemId, userId } = req.body;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: getProductName(type, itemId) },
        unit_amount: amount * 100,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    metadata: { userId, type, itemId }
  });

  res.json({ sessionId: session.id });
});

// Stripe Webhook
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, type, itemId } = session.metadata;

    // Update user in database
    await User.findOneAndUpdate(
      { userId },
      {
        $push: {
          purchases: {
            type,
            amount: session.amount_total / 100,
            date: new Date()
          }
        },
        ...(type === 'premium' ? { isPremium: true } : {}),
        ...(type === 'skin' ? { $push: { ownedSkins: itemId } } : {})
      },
      { upsert: true }
    );
  }

  res.json({received: true});
});

// User Data Endpoints
app.get('/user/:userId', async (req, res) => {
  const user = await User.findOne({ userId: req.params.userId });
  res.json(user || {});
});

app.post('/user/save', async (req, res) => {
  const { userId, coins, ownedSkins, isPremium } = req.body;
  await User.findOneAndUpdate(
    { userId },
    { coins, ownedSkins, isPremium },
    { upsert: true }
  );
  res.json({ success: true });
});

// Analytics Endpoint
app.post('/analytics/track', async (req, res) => {
  const { event, params } = req.body;
  // Store in analytics database or forward to analytics service
  console.log('Analytics:', event, params);
  res.json({ success: true });
});

mongoose.connect(process.env.MONGODB_URI);
app.listen(process.env.PORT || 3000);
```

**Deploy Backend to Railway/Render/Heroku:**
```bash
# Railway (recommended)
npm i -g @railway/cli
railway login
railway init
railway up
```

#### Option B: Serverless (Vercel/Netlify Functions)

Create `api/payment.js`:
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const { amount, type, itemId } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `${type} - ${itemId}` },
          unit_amount: amount * 100,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL}/cancel`,
    });

    res.status(200).json({ sessionId: session.id });
  }
};
```

### Step 2: Environment Variables

Create `.env`:
```
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/game
FRONTEND_URL=https://your-game.com
GOOGLE_ANALYTICS_ID=G-XXXXXXXXX
ADMOB_APP_ID=ca-app-pub-xxxxxxxxx
```

### Step 3: Update Frontend

Update payment function in `index.html`:
```javascript
async function processPayment(amount, type, itemId = null) {
  const stripe = Stripe('pk_live_YOUR_KEY');

  const response = await fetch('https://your-api.com/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, type, itemId, userId: getUserId() })
  });

  const { sessionId } = await response.json();
  await stripe.redirectToCheckout({ sessionId });
}
```

### Step 4: Add User Authentication

#### Firebase Auth (Easy)
```html
<!-- Add to <head> -->
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-auth.js"></script>

<script>
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-app.firebaseapp.com",
    projectId: "your-project-id",
  };

  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();

  // Anonymous auth (easiest)
  auth.signInAnonymously();

  function getUserId() {
    return auth.currentUser?.uid || 'anonymous';
  }
</script>
```

---

## Mobile App Deployment

### Step 1: Convert to PWA (Progressive Web App)

Create `manifest.json`:
```json
{
  "name": "Abstract Flappy",
  "short_name": "Flappy",
  "description": "Play & Earn Coins!",
  "start_url": "/",
  "display": "fullscreen",
  "orientation": "portrait",
  "theme_color": "#667eea",
  "background_color": "#667eea",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

Add to `index.html` <head>:
```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#667eea">
<meta name="apple-mobile-web-app-capable" content="yes">
```

Create `service-worker.js`:
```javascript
const CACHE_NAME = 'flappy-v1';
const urlsToCache = ['/', '/index.html', '/abstract-logo.png'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

### Step 2: Capacitor (iOS/Android Apps)

```bash
npm install @capacitor/core @capacitor/cli
npx cap init

# Add platforms
npx cap add ios
npx cap add android

# Build and sync
npm run build
npx cap sync

# Open in Xcode/Android Studio
npx cap open ios
npx cap open android
```

### Step 3: Publish to App Stores

**iOS (Apple App Store)**
1. Open in Xcode
2. Set up signing & certificates
3. Archive → Upload to App Store Connect
4. Submit for review

**Android (Google Play)**
1. Open in Android Studio
2. Build → Generate Signed Bundle
3. Upload to Google Play Console
4. Submit for review

---

## Analytics & Monitoring

### Google Analytics 4
```html
<!-- Add to <head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXX');
</script>
```

### Sentry (Error Tracking)
```html
<script src="https://browser.sentry-cdn.com/7.x.x/bundle.min.js"></script>
<script>
  Sentry.init({
    dsn: "YOUR_SENTRY_DSN",
    tracesSampleRate: 1.0,
  });
</script>
```

---

## Performance Optimization

### 1. Minify Code
```bash
npm install -g html-minifier
html-minifier --collapse-whitespace --remove-comments index.html -o index.min.html
```

### 2. Enable Compression (Vercel/Netlify automatic)
```javascript
// If self-hosting with Express:
const compression = require('compression');
app.use(compression());
```

### 3. CDN Setup
- Vercel/Netlify include CDN
- For custom hosting: Cloudflare (free)

### 4. Image Optimization
```bash
# Optimize abstract-logo.png
npx imagemin abstract-logo.png --out-dir=optimized --plugin=pngquant
```

---

## SEO Optimization

Update `index.html` <head>:
```html
<meta name="description" content="Play Abstract Flappy - The addictive browser game! Earn coins, unlock skins, and compete for high scores.">
<meta name="keywords" content="flappy bird, browser game, casual game, free game">

<!-- Open Graph (Facebook, Discord) -->
<meta property="og:title" content="Abstract Flappy - Play & Earn!">
<meta property="og:description" content="Addictive browser game with skins and power-ups">
<meta property="og:image" content="https://yourgame.com/og-image.png">
<meta property="og:url" content="https://yourgame.com">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Abstract Flappy">
<meta name="twitter:description" content="Play & earn coins!">
<meta name="twitter:image" content="https://yourgame.com/twitter-image.png">
```

---

## Custom Domain Setup

### Vercel
```bash
vercel domains add yourgame.com
# Follow DNS instructions
```

### Netlify
1. Site settings → Domain management
2. Add custom domain
3. Update DNS (CNAME or A record)

### DNS Configuration (Cloudflare)
```
Type: CNAME
Name: @
Content: your-site.vercel.app
Proxy: Enabled
```

---

## SSL Certificate
- Vercel/Netlify: Automatic (Let's Encrypt)
- Custom hosting: Use Certbot
  ```bash
  sudo certbot --nginx -d yourgame.com
  ```

---

## Monitoring Revenue

### Dashboard Setup
Create simple analytics dashboard:

```html
<!-- admin.html -->
<h1>Revenue Dashboard</h1>
<div id="stats">
  <div>DAU: <span id="dau">0</span></div>
  <div>Premium Users: <span id="premium">0</span></div>
  <div>Total Revenue: $<span id="revenue">0</span></div>
  <div>Ads Watched: <span id="ads">0</span></div>
</div>

<script>
  // Fetch from your backend
  async function loadStats() {
    const data = await fetch('/api/stats').then(r => r.json());
    document.getElementById('dau').innerText = data.dau;
    document.getElementById('premium').innerText = data.premiumUsers;
    document.getElementById('revenue').innerText = data.totalRevenue;
    document.getElementById('ads').innerText = data.adsWatched;
  }
  loadStats();
  setInterval(loadStats, 60000); // Refresh every minute
</script>
```

---

## Marketing Launch Checklist

- [ ] Domain purchased and configured
- [ ] SSL certificate active
- [ ] Payment processing tested
- [ ] Ad networks integrated
- [ ] Analytics tracking verified
- [ ] Error monitoring (Sentry) active
- [ ] Social media accounts created
- [ ] Press kit prepared
- [ ] Landing page optimized
- [ ] App store listings ready (if applicable)
- [ ] Email list setup
- [ ] Influencer outreach prepared
- [ ] Launch blog post written
- [ ] Product Hunt submission ready
- [ ] Reddit/HackerNews posts drafted

---

## Post-Launch Tasks

### Week 1
- Monitor error rates
- Check payment conversion
- Optimize ad placement based on data
- Respond to user feedback
- Fix critical bugs

### Month 1
- A/B test pricing
- Add most-requested features
- Implement retention campaigns
- Analyze cohort data
- Expand marketing efforts

---

## Scaling Infrastructure

### 10,000+ DAU
- Upgrade to paid hosting tier
- Implement caching (Redis)
- CDN for static assets
- Load balancer (if needed)

### 100,000+ DAU
- Microservices architecture
- Distributed database (MongoDB Atlas)
- Kubernetes for orchestration
- Advanced monitoring (Datadog)

---

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Stripe Integration**: https://stripe.com/docs/payments/checkout
- **Firebase Setup**: https://firebase.google.com/docs
- **AdMob Guide**: https://developers.google.com/admob
- **PWA Guide**: https://web.dev/progressive-web-apps/

---

**Estimated Deployment Time**:
- Basic (Vercel): 5 minutes
- With payments: 2-4 hours
- Full production: 1-2 days
- Mobile apps: 3-5 days

**Ready to launch?** 🚀

Start with: `vercel` and iterate from there!
