# 🎮 How to Play Abstract Flappy

## 🚀 Quick Start (Choose One Method)

### Method 1: Test First (Recommended)
```bash
# 1. Open the test page in your browser
open test.html

# 2. Check if all tests pass
# 3. Click "Open Game" button
```

### Method 2: Python Server (Universal)
```bash
# In terminal, navigate to this folder then:
python3 -m http.server 8000

# Then open in browser:
# http://localhost:8000
```

### Method 3: Node.js Server
```bash
# If you have Node.js installed:
npx http-server -p 8000

# Then open in browser:
# http://localhost:8000
```

### Method 4: Direct Open (May Have Issues)
```bash
# Just double-click index.html
# OR
open index.html
```

---

## ⚠️ Common Issues

### "Can't open file://"
**Problem:** Browser security blocks local files
**Solution:** Use Method 2 or 3 (local server)

### "DOMPurify not loaded"
**Problem:** CDN blocked or no internet
**Solution:**
1. Check internet connection
2. Use local server (Method 2 or 3)

### "Blank screen"
**Problem:** JavaScript error or missing files
**Solution:**
1. Open browser console (F12)
2. Check for errors
3. Run test.html to diagnose

### "Game freezes"
**Problem:** Browser compatibility
**Solution:** Use latest Chrome, Firefox, or Safari

---

## 🎯 Game Controls

- **Enter** - Start game
- **Space / Click / Tap** - Flap
- **R** - Reset game
- **🔊 Button** - Toggle sound
- **🛒 Shop** - Buy skins
- **⚡ Power-Ups** - Activate abilities
- **🎯 Missions** - View challenges
- **👑 Premium** - Upgrade (demo mode)

---

## 🔌 Backend Integration Status

**✅ Backend API is NOW INTEGRATED!**

The game automatically tries to connect to the backend API on startup:

### 📴 Offline Mode (Default - No Backend Running)

When backend is not available:

✅ **Works:**
- Full gameplay
- Scoring and coins
- Shop and purchases
- Power-ups
- Daily rewards
- All UI features

⚠️ **Limitations:**
- Data stored locally (localStorage)
- No real payments (demo only)
- Can be "hacked" via browser console
- Data lost if browser cache cleared

### ✅ Online Mode (Backend Connected)

When backend is running and reachable:

✅ **Advantages:**
- All operations server-validated
- Real payment processing (Stripe)
- Anti-cheat protection
- Data persistence in database
- Secure coin/purchase tracking
- Production-ready

---

## 🚀 Enable Backend API

The frontend is ready! Just configure and start your backend:

### Quick Start:

1. **Configure Backend URL** (in index.html):
   ```javascript
   // Find this section around line 607
   const API_CONFIG = {
     enabled: true,
     url: 'http://localhost:3000', // Change to your backend URL
     fallbackToLocal: true
   };
   ```

2. **Deploy Backend:**
   ```bash
   cd backend
   npm install
   npm start
   # See PRODUCTION_GUIDE.md for production deployment
   ```

3. **Reload Game:**
   - Refresh the browser
   - Check console for "✅ ONLINE MODE"
   - All purchases now server-validated!

### Production Deployment:

See **`PRODUCTION_GUIDE.md`** for:
- Railway deployment (15 minutes)
- MongoDB setup
- Stripe configuration
- Custom domain setup
- Full production checklist

---

## 📁 File Structure

```
abstract-flappy-game/
├── index.html          ← Main game (PLAY THIS)
├── test.html           ← Diagnostic page
├── abstract-logo.png   ← Player sprite
├── ads/
│   └── placeholder.png ← Ad graphics
├── api.js              ← Backend integration (not used yet)
├── backend/            ← Server code (deploy separately)
└── *.md                ← Documentation
```

---

## 🎮 Gameplay Tips

1. **Earn Coins:** Score points to earn coins (2 per point)
2. **Buy Skins:** Spend coins in the shop
3. **Use Power-Ups:**
   - 🛡️ Shield: Survive one hit
   - ⏱️ Slow Motion: Slow down time
   - ✨ 2x Score: Double points
   - 🧲 Coin Magnet: Triple coin earnings

4. **Complete Missions:** Daily challenges for bonus coins
5. **Daily Login:** Claim rewards and build streak

---

## 🐛 Troubleshooting

### Check Console (F12)
```javascript
// In browser console:

// Check if game loaded:
console.log('Game loaded:', typeof resetGame !== 'undefined');

// Check localStorage:
console.log('Coins:', localStorage.getItem('coins'));
console.log('Best Score:', localStorage.getItem('bestScore'));

// Clear all data:
localStorage.clear();
location.reload();
```

### Reset Everything
```bash
# Clear browser data:
# Chrome: Settings → Privacy → Clear browsing data
# Firefox: Settings → Privacy → Clear Data
# Safari: Safari → Clear History
```

---

## 📊 Current Status

**Game Version:** v3.0 (Production-Ready with Backend Integration)
**Backend:** ✅ Integrated (auto-detects, falls back to demo if unavailable)
**Payments:** Ready for Stripe (online mode) / Demo (offline mode)
**Security:** Server-side validation + anti-cheat (when backend connected)
**Production Ready:** ✅ YES (deploy backend to go live)

**Mode Indicator:**
- Check browser console (F12) on game load
- "✅ ONLINE MODE" = Backend connected, all secure
- "📴 OFFLINE MODE" = Demo mode, using localStorage

---

## ✅ What Works Right Now

- ✅ Full Flappy Bird gameplay
- ✅ Scoring system
- ✅ Virtual currency (coins)
- ✅ Shop with 9 skins
- ✅ 4 different power-ups
- ✅ Daily missions
- ✅ Daily rewards with streaks
- ✅ Sound toggle
- ✅ Toast notifications
- ✅ Professional UI/UX
- ✅ Mobile responsive
- ✅ Accessibility features

---

## 🎯 Next Steps

**Just Want to Play?**
→ Open `test.html` → Click "Open Game"

**Want Real Backend?**
→ Read `PRODUCTION_GUIDE.md`

**Having Issues?**
→ Open `test.html` to diagnose

**Want to Develop?**
→ Read `SECURITY.md` and `backend/README.md`

---

## 🆘 Still Having Problems?

1. **Check test.html** - Diagnoses all common issues
2. **Use local server** - python3 -m http.server 8000
3. **Check browser console** - F12 → Console tab
4. **Try different browser** - Chrome recommended
5. **Clear cache** - Hard refresh (Ctrl+Shift+R)

---

## 🎉 Ready to Play!

**Easiest way:**
```bash
python3 -m http.server 8000
```
Then open: **http://localhost:8000**

Have fun! 🎮🚀
