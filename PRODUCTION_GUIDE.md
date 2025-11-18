# 🚀 Production Deployment Guide - Abstract Flappy

## Complete Guide to Deploy Production-Ready Game with Real Payments

This guide will take you from development to fully deployed production system with:
- ✅ Real payment processing (Stripe)
- ✅ User authentication
- ✅ Database persistence
- ✅ Server-side validation
- ✅ Anti-cheat system
- ✅ Analytics tracking
- ✅ HTTPS/SSL
- ✅ Monitoring and logging

---

## 📋 Prerequisites

Before starting, you'll need:
- [ ] Domain name (e.g., `yourgame.com`)
- [ ] Stripe account (for payments)
- [ ] MongoDB Atlas account (or self-hosted MongoDB)
- [ ] Hosting provider account (Railway, Heroku, AWS, etc.)
- [ ] Git repository
- [ ] Basic command line knowledge

Estimated time: **2-3 hours**

---

## 🎯 Deployment Options

### Option 1: Railway (Easiest) ⭐ RECOMMENDED
- **Cost**: Free tier available, ~$5/month for production
- **Difficulty**: ⭐ Easy
- **Time**: 15 minutes
- **Best for**: Quick deployment, hobby projects

### Option 2: Heroku
- **Cost**: ~$7/month (Hobby tier)
- **Difficulty**: ⭐⭐ Easy-Medium
- **Time**: 20 minutes
- **Best for**: Quick deployment with add-ons

### Option 3: VPS (DigitalOcean/AWS)
- **Cost**: $5-20/month
- **Difficulty**: ⭐⭐⭐ Medium-Hard
- **Time**: 1-2 hours
- **Best for**: Full control, scalability

### Option 4: Docker + Cloud Run
- **Cost**: Pay-per-use (~$5-15/month)
- **Difficulty**: ⭐⭐⭐ Medium
- **Time**: 30-45 minutes
- **Best for**: Scalability, container expertise

---

## 🚀 Option 1: Deploy to Railway (RECOMMENDED)

### Step 1: Set Up MongoDB Atlas (Free)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Start Free"
3. Create account and log in
4. Click "Build a Database"
5. Select **FREE** tier (M0)
6. Choose cloud provider and region (closest to your users)
7. Click "Create"

**Create Database User:**
1. Security → Database Access → Add New Database User
2. Choose password authentication
3. Username: `abstract-flappy`
4. Password: (generate secure password - save it!)
5. Database User Privileges: **Read and write to any database**
6. Add User

**Whitelist IP Addresses:**
1. Security → Network Access → Add IP Address
2. Click "Allow Access from Anywhere" (for now)
3. Confirm

**Get Connection String:**
1. Deployment → Database → Connect
2. Choose "Connect your application"
3. Copy connection string
4. Replace `<password>` with your password
5. Replace `<dbname>` with `abstract-flappy`

Example:
```
mongodb+srv://abstract-flappy:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/abstract-flappy?retryWrites=true&w=majority
```

### Step 2: Set Up Stripe

1. Go to [stripe.com](https://stripe.com) → "Start now"
2. Create account
3. Complete onboarding (you can skip some steps for now)
4. Go to **Developers** → **API keys**
5. Copy **Publishable key** (starts with `pk_test_`)
6. Click "Reveal test key" → Copy **Secret key** (starts with `sk_test_`)
7. Save both keys securely

**Set Up Webhook:**
1. Developers → Webhooks → Add endpoint
2. Endpoint URL: `https://your-app.railway.app/api/webhooks/stripe` (you'll get this URL after deployment)
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Add endpoint
5. Copy **Signing secret** (starts with `whsec_`)

### Step 3: Deploy Backend to Railway

1. **Install Railway CLI:**
```bash
npm install -g @railway/cli
```

2. **Login to Railway:**
```bash
railway login
```

3. **Initialize project:**
```bash
cd backend
railway init
```
- Project name: `abstract-flappy-backend`

4. **Set environment variables:**
```bash
railway variables set MONGODB_URI="your_mongodb_connection_string"
railway variables set JWT_SECRET="$(openssl rand -base64 64)"
railway variables set STRIPE_SECRET_KEY="sk_test_your_key"
railway variables set STRIPE_WEBHOOK_SECRET="whsec_your_secret"
railway variables set FRONTEND_URL="https://yourgame.com"
railway variables set NODE_ENV="production"
```

5. **Deploy:**
```bash
railway up
```

6. **Get your backend URL:**
```bash
railway open
```
- Copy the URL (e.g., `https://abstract-flappy-backend.railway.app`)

### Step 4: Update Stripe Webhook URL

1. Go back to Stripe Dashboard → Webhooks
2. Edit your webhook endpoint
3. Update URL to: `https://your-backend.railway.app/api/webhooks/stripe`
4. Save

### Step 5: Deploy Frontend

**Option A: Vercel (Recommended for frontend)**

1. Go to [vercel.com](https://vercel.com) → Sign up
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - Framework Preset: **Other**
   - Root Directory: `./` (or leave blank)
   - Build Command: (leave empty - it's a static site)
   - Output Directory: `./`
5. **Environment Variables:**
   - `VITE_API_URL` = Your Railway backend URL
   - `VITE_STRIPE_PUBLISHABLE_KEY` = Your Stripe publishable key
6. Deploy

**Option B: Railway (Deploy with backend)**

```bash
cd ../  # Go to project root
railway up
```

### Step 6: Update Frontend Code

Update `index.html` to use environment variables or hard-code your backend URL:

```javascript
// Add at the top of your JavaScript
const API_URL = 'https://your-backend.railway.app';
const STRIPE_PUBLIC_KEY = 'pk_test_your_key';
```

Then update all API calls to use `API_URL`.

### Step 7: Test Everything

1. **Test Registration:**
   - Open your game
   - Open browser console (F12)
   - Try to register/login
   - Check for errors

2. **Test Game Play:**
   - Play a game
   - Check if score submits
   - Verify coins are awarded

3. **Test Purchase:**
   - Buy something with coins
   - Check if purchase completes

4. **Test Stripe Payment (TEST MODE):**
   - Try to buy premium
   - Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
   - Complete purchase
   - Verify premium status activated

5. **Check Backend Logs:**
```bash
railway logs
```

---

## 🔒 Security Configuration

### Generate Strong JWT Secret

```bash
# On macOS/Linux
openssl rand -base64 64

# On Windows (PowerShell)
$bytes = New-Object byte[] 64
(New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

### Configure CORS

In your backend `.env`:
```env
FRONTEND_URL=https://yourgame.com,https://www.yourgame.com
```

### Enable HTTPS

**Vercel/Railway**: Automatic ✅

**Custom domain**: Use Cloudflare or Let's Encrypt

---

## 💳 Stripe Production Mode

When ready for real money:

1. **Activate Stripe Account:**
   - Complete business information
   - Add bank account details
   - Verify identity

2. **Get Production Keys:**
   - Stripe Dashboard → Toggle "View test data" OFF
   - Developers → API keys
   - Copy production keys (start with `pk_live_` and `sk_live_`)

3. **Update Environment Variables:**
```bash
railway variables set STRIPE_SECRET_KEY="sk_live_your_production_key"
```

4. **Update Frontend:**
```javascript
const STRIPE_PUBLIC_KEY = 'pk_live_your_production_key';
```

5. **Update Webhook:**
   - Use production webhook secret
   - Test with real (small) payment

---

## 📊 Monitoring & Analytics

### Set Up Error Tracking (Sentry)

1. Go to [sentry.io](https://sentry.io) → Sign up
2. Create project → Node.js
3. Copy DSN
4. Install in backend:
```bash
npm install @sentry/node
```

5. Add to `server.js`:
```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

// Add error handler
app.use(Sentry.Handlers.errorHandler());
```

6. Set environment variable:
```bash
railway variables set SENTRY_DSN="your_sentry_dsn"
```

### Set Up Google Analytics

1. Go to [analytics.google.com](https://analytics.google.com)
2. Create account and property
3. Get Measurement ID (starts with `G-`)
4. Add to frontend `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## 🎯 Custom Domain Setup

### Step 1: Purchase Domain
- Namecheap, Google Domains, GoDaddy, etc.
- Cost: ~$10-15/year

### Step 2: Configure DNS (Vercel)

1. In Vercel project settings → Domains
2. Add your domain: `yourgame.com`
3. Add DNS records (shown in Vercel):

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Step 3: Configure Backend Domain (Railway)

1. Railway project → Settings → Domains
2. Add custom domain: `api.yourgame.com`
3. Add DNS records:

```
Type: CNAME
Name: api
Value: your-project.railway.app
```

### Step 4: Update Environment Variables

```bash
# Backend
railway variables set FRONTEND_URL="https://yourgame.com"

# Frontend (if using build process)
VITE_API_URL="https://api.yourgame.com"
```

---

## 🧪 Testing in Production

### Smoke Tests

```bash
# Health check
curl https://api.yourgame.com/health

# Register test user
curl -X POST https://api.yourgame.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","deviceId":"test-device"}'

# Login
curl -X POST https://api.yourgame.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Load Testing

Use [k6.io](https://k6.io/):

```javascript
// load-test.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 0 },
  ],
};

export default function() {
  let res = http.get('https://api.yourgame.com/health');
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
```

Run:
```bash
k6 run load-test.js
```

---

## 📈 Scaling Strategies

### When to Scale

Scale when you see:
- Response times > 500ms consistently
- CPU usage > 70% sustained
- Memory usage > 80%
- More than 1000 daily active users

### Horizontal Scaling

**Railway:**
1. Dashboard → Settings → Scale
2. Increase replicas

**Manual:**
1. Deploy multiple backend instances
2. Use load balancer (Nginx, Cloudflare)
3. Configure sticky sessions for JWT

### Database Scaling

**MongoDB Atlas:**
1. Cluster → Edit Configuration
2. Upgrade to M10 or higher
3. Enable sharding if needed

### Caching Layer

Add Redis for:
- Leaderboard caching
- Session storage
- Rate limiting

```bash
npm install redis

# In server.js
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL
});
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check logs
railway logs

# Common issues:
# - MONGODB_URI incorrect
# - Missing environment variables
# - Port already in use (locally)
```

### Payments not working
```bash
# Verify:
1. Stripe keys are correct (test vs. production)
2. Webhook URL is correct
3. Webhook secret matches
4. Check Stripe dashboard → Events for errors
```

### CORS errors
```bash
# Update backend .env:
FRONTEND_URL=https://your-actual-domain.com

# Redeploy:
railway up
```

### Database connection issues
```bash
# MongoDB Atlas:
1. Check IP whitelist (allow 0.0.0.0/0 for now)
2. Verify connection string
3. Check username/password
4. Database name correct
```

---

## ✅ Production Checklist

### Pre-Launch
- [ ] All environment variables set correctly
- [ ] MongoDB Atlas configured with backups
- [ ] Stripe account verified and production keys added
- [ ] Custom domain configured
- [ ] HTTPS/SSL enabled
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Error tracking (Sentry) set up
- [ ] Analytics (Google Analytics) set up
- [ ] Monitoring alerts configured
- [ ] Legal pages created (Terms, Privacy, Refund Policy)

### Testing
- [ ] Register/login flow works
- [ ] Game play and score submission works
- [ ] Coin purchases work
- [ ] Real payment flow tested (Stripe test mode)
- [ ] Premium upgrade works
- [ ] Daily rewards work
- [ ] Missions system works
- [ ] Leaderboard loads
- [ ] Mobile responsive
- [ ] Cross-browser tested

### Post-Launch
- [ ] Monitor error rates
- [ ] Check payment success rate
- [ ] Monitor API response times
- [ ] Review user feedback
- [ ] Set up automated backups
- [ ] Create incident response plan
- [ ] Set up status page
- [ ] Document deployment process

---

## 💰 Cost Estimate

### Free Tier (Development/Testing)
- Railway: Free
- MongoDB Atlas: Free (M0)
- Vercel: Free
- Stripe: Free (test mode)
- **Total: $0/month**

### Production (Starter)
- Railway: $5/month (Hobby)
- MongoDB Atlas: Free (M0) or $9/month (M10)
- Vercel: Free (hobby) or $20/month (Pro)
- Domain: $1/month (annual)
- Stripe: 2.9% + $0.30 per transaction
- **Total: $6-35/month + transaction fees**

### Production (Growth)
- Railway: $20/month (multiple replicas)
- MongoDB Atlas: $27/month (M20)
- Vercel Pro: $20/month
- Domain: $1/month
- Cloudflare: Free
- Sentry: $26/month
- **Total: $68-94/month + transaction fees**

---

## 📞 Support & Resources

### Documentation
- Backend API: `/backend/README.md`
- Security Guide: `/SECURITY.md`
- Deployment Options: `/DEPLOYMENT.md`

### Helpful Links
- Railway Docs: https://docs.railway.app
- MongoDB Atlas: https://docs.atlas.mongodb.com
- Stripe Docs: https://stripe.com/docs
- Vercel Docs: https://vercel.com/docs

### Community
- Discord: [Your Discord invite]
- GitHub Issues: [Your GitHub repo]/issues
- Email: support@yourgame.com

---

## 🎉 Congratulations!

Your game is now production-ready with:
✅ Real payment processing
✅ User authentication
✅ Database persistence
✅ Server-side validation
✅ Professional deployment

**Next Steps:**
1. Marketing and user acquisition
2. Monitor analytics and metrics
3. Iterate based on user feedback
4. Scale as you grow
5. Add new features

**You're ready to generate revenue!** 🚀💰

---

## 📊 Success Metrics to Track

- Daily Active Users (DAU)
- Monthly Recurring Revenue (MRR)
- Conversion Rate (free → paid)
- Average Revenue Per User (ARPU)
- Churn Rate
- Lifetime Value (LTV)
- Cost Per Acquisition (CPA)
- API Response Times
- Error Rates
- Payment Success Rate

**Aim for:**
- <500ms API response time
- >99% uptime
- >95% payment success rate
- <1% error rate
- Growing DAU week-over-week

---

Good luck with your launch! 🎮🚀
