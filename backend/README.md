# Abstract Flappy Backend - Production Ready

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- MongoDB (local or Atlas)
- Stripe account (for payments)

### Installation

```bash
cd backend
npm install
```

### Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your values:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
FRONTEND_URL=https://yourgame.com
```

### Run Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3000`

### Run Production Server

```bash
npm start
```

---

## 📚 API Documentation

### Base URL
```
Production: https://api.yourgame.com
Development: http://localhost:3000
```

### Authentication

All authenticated endpoints require either:
1. **JWT Token** in Authorization header: `Bearer <token>`
2. **Device ID** in `X-Device-ID` header (for anonymous users)

---

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "deviceId": "unique-device-id"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "coins": 0,
    "isPremium": false
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

---

### User Endpoints

#### Get Profile
```http
GET /api/user/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "deviceId": "device123",
    "coins": 1000,
    "bestScore": 50,
    "totalGamesPlayed": 25,
    "ownedSkins": [0, 1, 2],
    "currentSkin": 1,
    "powerupInventory": {
      "shield": 3,
      "slowmo": 2
    },
    "isPremium": false,
    "loginStreak": 5
  }
}
```

#### Update Profile
```http
PUT /api/user/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentSkin": 2
}
```

---

### Purchase Endpoints

#### Purchase with Coins
```http
POST /api/purchase/coins
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "skin",
  "itemId": 3,
  "amount": 200
}
```

**Response:**
```json
{
  "success": true,
  "coins": 800,
  "ownedSkins": [0, 1, 2, 3],
  "powerupInventory": {}
}
```

#### Create Stripe Checkout
```http
POST /api/purchase/create-checkout
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "premium",
  "amount": 4.99
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

---

### Score Endpoints

#### Submit Score
```http
POST /api/score/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "score": 42,
  "seed": "1234567890-abc",
  "hash": "sha256_hash_here",
  "gameDuration": 15000,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "score": 42,
  "bestScore": 50,
  "coinsEarned": 84,
  "totalCoins": 884
}
```

#### Get Leaderboard
```http
GET /api/leaderboard?limit=100
```

**Response:**
```json
{
  "success": true,
  "leaderboard": [
    {
      "userId": "user_id",
      "bestScore": 150,
      "deviceId": "device123",
      "isPremium": true,
      "currentSkin": 5
    }
  ]
}
```

---

### Daily Rewards

#### Claim Daily Reward
```http
POST /api/daily-reward/claim
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "reward": 100,
  "streak": 5,
  "totalCoins": 984
}
```

---

## 🔒 Security Features

### Implemented
- ✅ JWT authentication
- ✅ bcrypt password hashing
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Input validation
- ✅ SQL injection prevention (Mongoose)
- ✅ Score validation and anti-cheat
- ✅ Stripe webhook verification
- ✅ User ban system
- ✅ Suspicious activity detection

### Anti-Cheat
- Score validation based on game duration
- Hash verification
- Seed uniqueness check
- Suspicious pattern detection
- Automatic user flagging

---

## 🗄️ Database Schema

### User Model
```javascript
{
  email: String (unique, optional for anonymous)
  password: String (hashed)
  deviceId: String (unique, required)
  isAnonymous: Boolean
  coins: Number (0-10000000)
  bestScore: Number
  ownedSkins: [Number]
  currentSkin: Number
  powerupInventory: Map
  isPremium: Boolean
  loginStreak: Number
  isBanned: Boolean
  suspiciousActivity: [String]
}
```

### Purchase Model
```javascript
{
  user: ObjectId (ref: User)
  type: String (skin|powerup|premium)
  itemId: Number
  amount: Number
  currency: String (coins|usd)
  stripePaymentIntentId: String
  paymentStatus: String
}
```

### Score Model
```javascript
{
  user: ObjectId (ref: User)
  score: Number (0-10000)
  seed: String (unique)
  hash: String
  gameDuration: Number
  timestamp: Date
  isValid: Boolean
  validationErrors: [String]
}
```

---

## 🚀 Deployment

### Option 1: Railway (Recommended)

1. Install Railway CLI:
```bash
npm i -g @railway/cli
```

2. Login and deploy:
```bash
railway login
railway init
railway up
```

3. Set environment variables in Railway dashboard

4. Connect MongoDB Atlas database

### Option 2: Heroku

```bash
heroku create abstract-flappy-backend
heroku config:set MONGODB_URI=your_uri
heroku config:set JWT_SECRET=your_secret
heroku config:set STRIPE_SECRET_KEY=your_key
git push heroku main
```

### Option 3: Docker

```bash
docker build -t abstract-flappy-backend .
docker run -p 3000:3000 --env-file .env abstract-flappy-backend
```

### Option 4: VPS (DigitalOcean, AWS, etc.)

1. Set up Node.js on server
2. Clone repository
3. Install dependencies
4. Set up PM2 for process management:
```bash
npm install -g pm2
pm2 start server.js --name abstract-flappy
pm2 save
pm2 startup
```

---

## 🔗 Stripe Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-api.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy webhook secret to `.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 📊 Monitoring

### Health Check
```bash
curl https://your-api.com/health
```

### Logs
Development:
```bash
npm run dev
```

Production (with PM2):
```bash
pm2 logs abstract-flappy
```

---

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Coverage
```bash
npm test -- --coverage
```

### Manual API Testing

Use Postman or curl:

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","deviceId":"test-device"}'

# Get profile
curl http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📈 Scaling

### Database Optimization
- Indexed fields for fast queries
- Lean queries where possible
- Connection pooling configured

### Horizontal Scaling
- Stateless API (scales horizontally)
- Use Redis for session storage (optional)
- Load balancer in front of multiple instances

### Caching
Add Redis for:
- Leaderboard caching
- User session storage
- Rate limiting (distributed)

Example Redis integration:
```javascript
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL
});
```

---

## 🐛 Troubleshooting

### MongoDB Connection Failed
- Check `MONGODB_URI` in `.env`
- Whitelist your IP in MongoDB Atlas
- Check network connectivity

### Stripe Webhook Not Working
- Verify webhook secret matches
- Check endpoint URL is accessible
- Use Stripe CLI for local testing:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### JWT Token Expired
- Tokens expire after 7 days by default
- Client should handle token refresh
- Prompt user to re-login

### Rate Limit Exceeded
- Adjust `RATE_LIMIT_MAX_REQUESTS` in `.env`
- Implement user-specific limits
- Add Redis for distributed rate limiting

---

## 📝 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | development | Environment |
| `PORT` | No | 3000 | Server port |
| `MONGODB_URI` | Yes | - | MongoDB connection string |
| `JWT_SECRET` | Yes | - | JWT signing secret |
| `JWT_EXPIRES_IN` | No | 7d | Token expiration |
| `STRIPE_SECRET_KEY` | Yes | - | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes | - | Stripe webhook secret |
| `FRONTEND_URL` | Yes | - | Frontend URL for CORS |
| `RATE_LIMIT_WINDOW_MS` | No | 900000 | Rate limit window |
| `RATE_LIMIT_MAX_REQUESTS` | No | 100 | Max requests per window |

---

## 🔐 Security Best Practices

1. **Never commit `.env` file** - It's in `.gitignore`
2. **Use strong JWT secrets** - Random 64+ characters
3. **Enable HTTPS** - Use Let's Encrypt or Cloudflare
4. **Regularly update dependencies** - `npm audit fix`
5. **Monitor for suspicious activity** - Check logs daily
6. **Backup database** - Daily automated backups
7. **Implement IP banning** - For repeat offenders
8. **Use Stripe test mode** - Until ready for production

---

## 📞 Support

- **Issues**: Open GitHub issue
- **Email**: support@yourgame.com
- **Docs**: https://docs.yourgame.com

---

## 📄 License

MIT License - See LICENSE file for details

---

## ✅ Production Checklist

Before going live:

- [ ] Set all environment variables
- [ ] Configure MongoDB Atlas with proper security
- [ ] Set up Stripe webhooks
- [ ] Enable HTTPS/SSL
- [ ] Set up domain and DNS
- [ ] Configure rate limiting
- [ ] Set up error monitoring (Sentry)
- [ ] Set up logging
- [ ] Configure backups
- [ ] Test payment flow end-to-end
- [ ] Test authentication flow
- [ ] Load test API endpoints
- [ ] Review security settings
- [ ] Set up monitoring alerts
- [ ] Document API for frontend team

---

**Backend is now production-ready!** 🚀
