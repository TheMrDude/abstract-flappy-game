# Local Testing Guide 🧪

Quick guide to test the full game (frontend + backend) on your local machine.

---

## ⚡ Super Quick Start (Demo Mode)

**Just want to play the game right now?**

```bash
# From the project root
./start.sh
# Open http://localhost:8000
```

This runs in **demo mode** (no backend, localStorage only). Perfect for testing gameplay!

---

## 🚀 Full Stack Testing (Frontend + Backend)

Test the complete production setup locally with real API integration.

### Step 1: Install MongoDB (Choose One)

#### Option A: MongoDB Atlas (Easiest - Free Cloud Database)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create a free cluster (takes ~5 minutes)
4. Get connection string
5. Update `backend/.env` → `MONGODB_URI` with your connection string

#### Option B: Local MongoDB (Advanced)

```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Ubuntu/Debian
sudo apt-get install mongodb
sudo systemctl start mongodb

# Windows
# Download from https://www.mongodb.com/try/download/community
```

If using local MongoDB, update `backend/.env`:
```
MONGODB_URI=mongodb://localhost:27017/abstract-flappy
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 3: Configure Environment

The `backend/.env` file is already set up for local testing!

**Optional:** Add Stripe test keys for payment testing:
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy test keys to `backend/.env`

### Step 4: Start Backend Server

```bash
# From backend directory
npm start

# You should see:
# ✅ Connected to MongoDB
# 🚀 Server running on port 3000
# 📝 Environment: development
```

**Keep this terminal open!**

### Step 5: Start Frontend Server

Open a **new terminal**:

```bash
# From project root
python3 -m http.server 8000

# Or use the script:
./start.sh
```

**Keep this terminal open too!**

### Step 6: Open the Game

Open your browser to:
```
http://localhost:8000
```

### Step 7: Check Connection Status

Open browser console (F12) and look for:

✅ **Online Mode:**
```
✅ ONLINE MODE
Connected to backend - all purchases server-validated
Connected to server ✅
```

📴 **Offline Mode:**
```
📴 OFFLINE MODE
Running in demo mode - using localStorage
Demo mode: Data saved locally only
```

---

## 🎮 Testing Checklist

Once everything is running, test these features:

### Basic Gameplay
- [ ] Game loads without errors
- [ ] Press Enter/Click to start
- [ ] Bird responds to spacebar/click
- [ ] Score increases when passing pipes
- [ ] Game over on collision
- [ ] Sound toggle works

### Online Features (Backend Connected)
- [ ] Console shows "✅ ONLINE MODE"
- [ ] Score submitted to server (check console logs)
- [ ] Coins earned and synced
- [ ] Best score updates

### Purchases (Online Mode)
- [ ] Open Shop (🛒 button)
- [ ] Buy skin with coins
- [ ] Purchase successful toast
- [ ] Coins deducted
- [ ] Skin appears in owned list

### Power-ups
- [ ] Open Power-Ups (⚡ button)
- [ ] Buy power-up with coins
- [ ] Inventory updated
- [ ] Use power-up during game
- [ ] Effect activates (shield, slow-mo, etc.)

### Premium (Stripe Required)
- [ ] Open Premium (👑 button)
- [ ] Click "Upgrade to Premium"
- [ ] Redirects to Stripe checkout (test mode)
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Complete payment
- [ ] Premium status activated

---

## 🐛 Troubleshooting

### Backend won't start

**Error: MongoDB connection failed**
```
❌ MongoDB connection error: ...
```

**Fix:**
- Check MongoDB is running (Atlas or local)
- Verify `MONGODB_URI` in `backend/.env`
- For Atlas: Check IP whitelist allows your IP

**Error: JWT_SECRET too short (production only)**
```
❌ SECURITY ERROR: JWT_SECRET must be at least 32 characters
```

**Fix:** This only happens if `NODE_ENV=production`. For local testing, use `NODE_ENV=development` in `.env`

### Frontend won't connect to backend

**Console shows: "📴 OFFLINE MODE"**

**Fix:**
- Check backend is running (`http://localhost:3000/health` should return OK)
- Check `index.html` line ~609: `url: 'http://localhost:3000'`
- Check CORS: backend `.env` includes `http://localhost:8000`

### Port already in use

**Error: Port 3000 already in use**

```bash
# Find and kill process on port 3000
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Or change port in backend/.env
PORT=3001
```

**Error: Port 8000 already in use**

```bash
# Use different port
python3 -m http.server 8001
# Open http://localhost:8001
```

### CORS errors in browser console

**Error: "blocked by CORS policy"**

**Fix:** Add your frontend URL to `backend/.env`:
```
FRONTEND_URL=http://localhost:8000,http://localhost:8001
```

Restart backend server.

---

## 🔍 Verify Backend is Working

### Test API Endpoints

```bash
# Health check
curl http://localhost:3000/health

# Should return:
{"status":"ok","timestamp":"...","uptime":...}

# Get profile (anonymous user)
curl -X GET http://localhost:3000/api/user/profile \
  -H "X-Device-ID: test-device-123"

# Should return user data with coins, bestScore, etc.
```

---

## 📊 Monitor Backend Activity

Watch backend console for real-time logs:

```
POST /api/score/submit 200 45.123 ms - 156
  ↑ Score submitted

POST /api/purchase/coins 200 12.456 ms - 89
  ↑ Purchase made

GET /api/user/profile 200 8.234 ms - 234
  ↑ Profile loaded
```

---

## 🎯 Test Different Modes

### Test Offline Fallback

1. Start game with backend running (online mode)
2. Stop backend server (Ctrl+C)
3. Try making a purchase
4. Should see: "↩️ Using offline fallback"
5. Purchase works using localStorage

### Test Backend Validation

1. Backend running (online mode)
2. Play game and get score
3. Check backend console for validation logs
4. Try cheating (edit localStorage coins in browser)
5. Refresh page - coins reset to server value!

---

## 🧹 Clean Up / Reset

### Reset Game Data

```javascript
// In browser console (F12)
localStorage.clear();
location.reload();
```

### Reset Database

```bash
# In backend directory
# This will drop the database and start fresh
mongosh abstract-flappy --eval "db.dropDatabase()"

# Or for Atlas, use MongoDB Compass or Atlas UI
```

---

## 💡 Tips

### Quick Restart

```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Frontend
python3 -m http.server 8000

# Terminal 3: MongoDB (if local)
mongod
```

### Use Nodemon for Auto-Restart

```bash
# Install nodemon globally
npm install -g nodemon

# Run backend with auto-reload
cd backend
nodemon server.js

# Now backend auto-restarts when you edit code!
```

### Test with Multiple Browsers

Test cross-device functionality:
- Chrome: User 1
- Firefox: User 2
- Safari: User 3

Each browser is a different "device" with unique deviceId.

---

## 📱 Test on Phone (Same Network)

1. Find your computer's local IP:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet "

   # Windows
   ipconfig
   ```

2. Update `backend/.env`:
   ```
   FRONTEND_URL=http://192.168.1.100:8000
   ```

3. On phone browser:
   ```
   http://192.168.1.100:8000
   ```

---

## 🎓 Understanding the Logs

### Backend Console

```
✅ Connected to MongoDB          ← Database ready
🚀 Server running on port 3000   ← Backend ready
📝 Environment: development      ← Dev mode
🌍 Frontend URL: http://...      ← CORS allowed origins
```

### Browser Console

```
✅ ONLINE MODE                   ← Backend connected
📊 Profile synced: {coins:...}   ← Data loaded from server
✅ Score submitted to server     ← Score validated
```

---

## 📚 Further Reading

- **PRODUCTION_GUIDE.md** - Deploy to Railway/Heroku
- **SECURITY_AUDIT.md** - Security features explained
- **START_HERE.md** - General game documentation
- **backend/README.md** - Backend API documentation

---

## ❓ Still Having Issues?

1. Check both terminal windows for error messages
2. Check browser console (F12) for errors
3. Verify all three pieces are running:
   - MongoDB (database)
   - Backend (port 3000)
   - Frontend (port 8000)

4. Try the demo mode first (./start.sh) to verify game works
5. Then add backend step by step

---

**Happy Testing! 🎮**

The game should work perfectly in both online and offline modes!
