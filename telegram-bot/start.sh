#!/bin/bash

# Touchline Telegram Bot Startup Script

echo "🤖 Starting Touchline Telegram Bot..."

# Check if .env file exists
if [ ! -f "../.env" ]; then
    echo "❌ .env file not found in parent directory"
    echo "📝 Please create a .env file with your configuration"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "📝 Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check for required environment variables
source ../.env

if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "❌ TELEGRAM_BOT_TOKEN not found in .env file"
    echo "📝 Steps to get a bot token:"
    echo "   1. Message @BotFather on Telegram"
    echo "   2. Send /newbot command"
    echo "   3. Follow instructions to create your bot"
    echo "   4. Copy the token to your .env file"
    echo "   5. Add: TELEGRAM_BOT_TOKEN=your_token_here"
    exit 1
fi

echo "✅ Configuration looks good!"
echo "🚀 Starting bot..."

# Start the bot
node bot.js
