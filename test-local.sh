#!/bin/bash

# Local Testing Helper Script
# Helps you test the game with backend integration

set -e

echo "🎮 Abstract Flappy - Local Testing Helper"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
  echo -e "${GREEN}✅${NC} $1"
}

print_error() {
  echo -e "${RED}❌${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠️${NC} $1"
}

print_info() {
  echo -e "${BLUE}ℹ️${NC} $1"
}

# Check if backend directory exists
if [ ! -d "backend" ]; then
  print_error "backend directory not found!"
  echo "Please run this script from the project root directory."
  exit 1
fi

# Ask user what they want to do
echo "What would you like to test?"
echo ""
echo "1) Quick demo (no backend, localStorage only) - Fastest!"
echo "2) Full stack (backend + frontend) - Requires MongoDB"
echo "3) Backend only (start backend server)"
echo "4) Frontend only (start frontend server)"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
  1)
    print_info "Starting demo mode (no backend)..."
    echo ""
    print_status "Game runs in offline/demo mode"
    print_status "Data saved to localStorage only"
    echo ""

    # Find available Python
    if command -v python3 &> /dev/null; then
      print_status "Starting server on port 8000..."
      echo ""
      echo "🌐 Open http://localhost:8000 in your browser"
      echo "Press Ctrl+C to stop"
      echo ""
      python3 -m http.server 8000
    elif command -v python &> /dev/null; then
      print_status "Starting server on port 8000..."
      echo ""
      echo "🌐 Open http://localhost:8000 in your browser"
      echo "Press Ctrl+C to stop"
      echo ""
      python -m SimpleHTTPServer 8000
    else
      print_error "Python not found!"
      echo "Please install Python or use Node.js:"
      echo "  npx http-server -p 8000"
      exit 1
    fi
    ;;

  2)
    print_info "Starting full stack mode..."
    echo ""

    # Check if node_modules exists
    if [ ! -d "backend/node_modules" ]; then
      print_warning "Backend dependencies not installed"
      print_info "Installing backend dependencies..."
      cd backend
      npm install
      cd ..
      print_status "Dependencies installed"
      echo ""
    fi

    # Check if .env exists
    if [ ! -f "backend/.env" ]; then
      print_error "backend/.env not found!"
      echo ""
      echo "Please create backend/.env file with:"
      echo "  MONGODB_URI=your_mongodb_connection_string"
      echo "  JWT_SECRET=local-dev-secret-key-for-testing-only-minimum-32-chars"
      echo ""
      echo "See LOCAL_TESTING.md for detailed setup instructions."
      exit 1
    fi

    print_status "Configuration found"
    echo ""
    print_warning "Make sure MongoDB is running!"
    echo "  - MongoDB Atlas: Check connection string in backend/.env"
    echo "  - Local MongoDB: Run 'mongod' in another terminal"
    echo ""
    read -p "Press Enter when MongoDB is ready..."
    echo ""

    # Start backend in background
    print_info "Starting backend server..."
    cd backend
    npm start &
    BACKEND_PID=$!
    cd ..

    # Wait for backend to start
    sleep 3

    # Check if backend is running
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
      print_status "Backend running on port 3000"
    else
      print_error "Backend failed to start!"
      kill $BACKEND_PID 2>/dev/null || true
      echo ""
      echo "Check the error messages above for details."
      echo "Common issues:"
      echo "  - MongoDB not running"
      echo "  - Port 3000 already in use"
      echo "  - Missing .env configuration"
      exit 1
    fi

    echo ""
    print_info "Starting frontend server..."

    # Start frontend
    if command -v python3 &> /dev/null; then
      print_status "Frontend running on port 8000"
      echo ""
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo -e "${GREEN}🎮 GAME READY!${NC}"
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo ""
      echo "🌐 Open http://localhost:8000 in your browser"
      echo ""
      echo "✅ Backend:  http://localhost:3000 (running)"
      echo "✅ Frontend: http://localhost:8000 (running)"
      echo ""
      echo "Check browser console (F12) for connection status:"
      echo "  - '✅ ONLINE MODE' = Backend connected"
      echo "  - '📴 OFFLINE MODE' = Using localStorage only"
      echo ""
      echo "Press Ctrl+C to stop both servers"
      echo ""

      # Cleanup function
      cleanup() {
        echo ""
        print_info "Stopping servers..."
        kill $BACKEND_PID 2>/dev/null || true
        print_status "Servers stopped"
        exit 0
      }

      trap cleanup INT TERM

      python3 -m http.server 8000
    else
      print_error "Python not found!"
      kill $BACKEND_PID 2>/dev/null || true
      exit 1
    fi
    ;;

  3)
    print_info "Starting backend only..."
    echo ""

    # Check dependencies
    if [ ! -d "backend/node_modules" ]; then
      print_warning "Installing dependencies first..."
      cd backend
      npm install
      cd ..
    fi

    # Check .env
    if [ ! -f "backend/.env" ]; then
      print_error "backend/.env not found!"
      echo "See LOCAL_TESTING.md for setup instructions."
      exit 1
    fi

    cd backend
    print_status "Backend starting on port 3000..."
    echo ""
    echo "API will be available at http://localhost:3000"
    echo "Health check: http://localhost:3000/health"
    echo ""
    npm start
    ;;

  4)
    print_info "Starting frontend only..."
    echo ""
    print_warning "Backend not running - game will use demo mode"
    echo ""

    if command -v python3 &> /dev/null; then
      print_status "Starting server on port 8000..."
      echo ""
      echo "🌐 Open http://localhost:8000 in your browser"
      echo ""
      python3 -m http.server 8000
    else
      print_error "Python not found!"
      exit 1
    fi
    ;;

  *)
    print_error "Invalid choice!"
    echo "Please run again and choose 1-4."
    exit 1
    ;;
esac
