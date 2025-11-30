# How to Open and Run the Game 🎮

**Complete beginner guide - no experience needed!**

---

## Step 1: Open Your Terminal

### On Windows:

**Option A: PowerShell (Recommended)**
1. Press `Windows Key + R`
2. Type: `powershell`
3. Press Enter
4. A blue/black window appears ← This is your terminal!

**Option B: Command Prompt**
1. Press `Windows Key`
2. Type: `cmd`
3. Press Enter

### On Mac:

**Option A: Spotlight Search (Easiest)**
1. Press `Command (⌘) + Space`
2. Type: `terminal`
3. Press Enter
4. A window appears ← This is your terminal!

**Option B: Finder**
1. Open Finder
2. Go to: Applications → Utilities → Terminal
3. Double-click Terminal

### On Linux:

**Most distros:**
1. Press `Ctrl + Alt + T`
2. Terminal opens!

**Or:**
1. Press `Super/Windows Key`
2. Type: `terminal`
3. Press Enter

---

## Step 2: Navigate to the Game Folder

You need to find where you downloaded/cloned the game.

### Find the Project Folder

The folder is probably in one of these locations:

**Windows:**
- `C:\Users\YourName\Downloads\abstract-flappy-game`
- `C:\Users\YourName\Documents\abstract-flappy-game`
- `C:\Users\YourName\Desktop\abstract-flappy-game`

**Mac/Linux:**
- `~/Downloads/abstract-flappy-game`
- `~/Documents/abstract-flappy-game`
- `~/Desktop/abstract-flappy-game`

### Navigate Using Terminal

Type this in your terminal (replace with your actual path):

**Windows:**
```bash
cd C:\Users\YourName\Downloads\abstract-flappy-game
```

**Mac/Linux:**
```bash
cd ~/Downloads/abstract-flappy-game
```

**Not sure where it is?** If it's on your Desktop:

**Windows:**
```bash
cd Desktop\abstract-flappy-game
```

**Mac/Linux:**
```bash
cd ~/Desktop/abstract-flappy-game
```

Press **Enter** after typing the command!

---

## Step 3: Run the Game

Once you're in the folder, just type:

**Mac/Linux:**
```bash
./test-local.sh
```

**Windows (PowerShell):**
```bash
python -m http.server 8000
```

**Windows (if Python 3 installed):**
```bash
python3 -m http.server 8000
```

Press **Enter**!

You should see:
```
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

---

## Step 4: Open Your Browser

1. Open any web browser (Chrome, Firefox, Safari, Edge)
2. In the address bar, type: `http://localhost:8000`
3. Press Enter

**🎮 The game should load!**

---

## Complete Example (Mac/Linux)

```bash
# 1. Open terminal (press Cmd+Space, type "terminal")

# 2. Go to the folder
cd ~/Downloads/abstract-flappy-game

# 3. Run the game
./test-local.sh

# 4. Choose option 1

# 5. Open browser to http://localhost:8000
```

---

## Complete Example (Windows)

```bash
# 1. Open PowerShell (press Windows+R, type "powershell")

# 2. Go to the folder
cd C:\Users\YourName\Downloads\abstract-flappy-game

# 3. Run Python server
python -m http.server 8000

# 4. Open browser to http://localhost:8000
```

---

## 🆘 Troubleshooting

### "Command not found" or "'python' is not recognized"

**You need to install Python first:**

1. Go to https://www.python.org/downloads/
2. Download Python (latest version)
3. Run installer
4. **IMPORTANT:** Check "Add Python to PATH" during installation!
5. Restart your terminal
6. Try again

### "No such file or directory"

**You're in the wrong folder!**

Find where you actually downloaded the game:

**Windows - List files in current folder:**
```bash
dir
```

**Mac/Linux - List files in current folder:**
```bash
ls
```

You should see files like:
- index.html
- test-local.sh
- README.md
- backend/

If you don't see these, you're in the wrong place!

**Try this to find it:**

**Windows:**
```bash
cd C:\Users\YourName
dir /s /b abstract-flappy-game
```

**Mac/Linux:**
```bash
find ~ -name "abstract-flappy-game" -type d 2>/dev/null
```

### "Permission denied" (Mac/Linux)

Make the script executable:
```bash
chmod +x test-local.sh
```

Then try again:
```bash
./test-local.sh
```

---

## Even Easier Option - Just Double Click!

### Windows:

1. Open File Explorer
2. Navigate to the `abstract-flappy-game` folder
3. Double-click `index.html`

**Game opens in your browser!** (Might not work in all browsers due to security - use the terminal method if this fails)

### Mac:

1. Open Finder
2. Navigate to the `abstract-flappy-game` folder
3. Right-click `index.html`
4. Choose: Open With → Google Chrome (or your browser)

**Game opens!**

---

## 🎯 Quick Visual Guide

```
Desktop or Downloads folder
    └── abstract-flappy-game/     ← This is where you need to be!
        ├── index.html            ← The game
        ├── test-local.sh         ← Run this
        ├── backend/              ← API server
        └── README.md             ← Documentation
```

---

## ✅ You're Ready When You See:

**In Terminal:**
```
Serving HTTP on 0.0.0.0 port 8000 ...
```

**In Browser (at http://localhost:8000):**
- You see the game screen
- Abstract logo/bird visible
- "Press Enter or Click to Start!" message

---

## Need More Help?

**Still stuck? Try this:**

1. Take a screenshot of your terminal
2. Take a screenshot of the error message
3. Note what operating system you're using
4. Check the troubleshooting section above

**Common issues:**
- Python not installed → Install from python.org
- Wrong folder → Use `cd` to navigate to correct folder
- Port already in use → Use port 8001 instead: `python3 -m http.server 8001`

---

## 🎮 Once It's Running

**To play:**
- Press Enter or Spacebar or Click to start
- Spacebar or Click to flap
- Avoid the pipes!

**To stop the server:**
- Press `Ctrl + C` in the terminal

---

**That's it! You're ready to play!** 🚀

If you can see this file, you're already in the right folder - just open terminal and type the commands!
