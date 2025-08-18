#!/bin/bash

# Start script for combined API and Telegram bot
echo "🚀 Starting Touchline API and Telegram Bot..."

# Function to handle cleanup
cleanup() {
    echo "📴 Shutting down services..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Start API server in background
echo "🌐 Starting API server..."
node api-server/server.js &
API_PID=$!

# Wait a moment for API to start
sleep 2

# Start Telegram bot in background
echo "🤖 Starting Telegram bot..."
cd telegram-bot && node bot.js &
BOT_PID=$!

# Return to root directory
cd ..

echo "✅ Both services started successfully!"
echo "   - API Server PID: $API_PID"
echo "   - Telegram Bot PID: $BOT_PID"

# Wait for any background process to exit
wait
