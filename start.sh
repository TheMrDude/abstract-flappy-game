#!/bin/bash
# Start Abstract Flappy Game Local Server

echo "🎮 Abstract Flappy - Starting Local Server..."
echo ""

# Check if Python is available
if command -v python3 &> /dev/null; then
    echo "✅ Python3 found"
    echo "🚀 Starting server on http://localhost:8000"
    echo ""
    echo "📖 Open your browser to: http://localhost:8000"
    echo "🛑 Press Ctrl+C to stop the server"
    echo ""
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "✅ Python found"
    echo "🚀 Starting server on http://localhost:8000"
    echo ""
    echo "📖 Open your browser to: http://localhost:8000"
    echo "🛑 Press Ctrl+C to stop the server"
    echo ""
    python -m SimpleHTTPServer 8000
elif command -v npx &> /dev/null; then
    echo "✅ Node.js found"
    echo "🚀 Starting server on http://localhost:8000"
    echo ""
    echo "📖 Open your browser to: http://localhost:8000"
    echo "🛑 Press Ctrl+C to stop the server"
    echo ""
    npx http-server -p 8000
else
    echo "❌ Error: No server found"
    echo ""
    echo "Please install one of the following:"
    echo "  - Python 3: https://python.org"
    echo "  - Node.js: https://nodejs.org"
    echo ""
    echo "Or manually open index.html in your browser"
    exit 1
fi
