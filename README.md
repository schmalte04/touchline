# Touchline - AI-Powered Football Betting Assistant

A professional Claude AI-powered betting assistant that provides intelligent football match analysis, ELO ratings, xG predictions, and betting recommendations. Available as both a web application and Telegram bot.

![Touchline Logo](https://img.shields.io/badge/Touchline-AI%20Betting%20Assistant-blue)

## 🚀 Features

- **Real-time Match Analysis** - Live data integration with comprehensive statistics
- **Claude AI Integration** - Powered by Anthropic's Claude for intelligent betting insights
- **ELO & xG Analytics** - Advanced metrics for informed decision making
- **Professional Web UI** - Clean, responsive design optimized for betting analysis
- **Telegram Bot** - Convenient chat interface for mobile betting insights
- **Risk Assessment** - Confidence levels and risk evaluation for each recommendation

## 🤖 Access Methods

### 💻 Web Application
Professional web interface with advanced visualizations and detailed analysis

### 📱 Telegram Bot
Instant betting insights through Telegram chat:
- `/start` - Get started with the bot
- `/upcoming` - Show upcoming matches
- `/accumulator` - Build smart accumulators
- `/confidence` - High confidence picks
- Natural language: "Help me build an accumulator for this weekend"

## 🎯 Live Demo

**Coming Soon** - Will be deployed on DigitalOcean App Platform

## 🛠 Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **AI**: Anthropic Claude API
- **Telegram Bot**: Node Telegram Bot API
- **Hosting**: DigitalOcean App Platform
- **Data**: MCP (Model Context Protocol) integration

## 📊 What You Get

### Match Analysis
- ELO rating comparisons
- Expected Goals (xG) predictions
- Historical performance data
- League-specific insights

### Betting Intelligence
- Value betting opportunities
- Risk-adjusted recommendations
- Confidence scoring
- Market inefficiency detection

### Multi-Platform Access
- Professional web interface
- Telegram bot for mobile convenience
- Same AI intelligence across all platforms

## 🚀 Quick Start

### Web Application
This application is designed for DigitalOcean App Platform deployment with zero configuration required.

### Telegram Bot Setup

1. **Create a Telegram Bot:**
   - Message [@BotFather](https://t.me/botfather) on Telegram
   - Send `/newbot` command and follow instructions
   - Copy your bot token

2. **Configure Environment:**
   ```bash
   # Add to your .env file
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   ```

3. **Install and Run:**
   ```bash
   # Install all dependencies (web + bot)
   npm run install-all
   
   # Start the web server
   npm start
   
   # Start the Telegram bot (in another terminal)
   npm run bot
   ```

### Available Scripts
```bash
npm start          # Start web server
npm run dev        # Start web server in dev mode
npm run bot        # Start Telegram bot
npm run bot:dev    # Start Telegram bot in dev mode
npm run install-all # Install all dependencies
```

### Automatic Deployment Features
- **SSL/HTTPS** - Automatic certificate management
- **Auto-scaling** - Handles traffic spikes automatically
- **Zero-downtime** - Seamless updates and deployments
- **Monitoring** - Built-in performance metrics
- **Security** - Environment variable encryption

## File Structure

```
touchline/
├── .do/
│   └── app.yaml              # App Platform configuration
├── api-server/
│   ├── package.json          # Node.js dependencies
│   └── server.js             # API server
├── telegram-bot/
│   ├── package.json          # Bot dependencies
│   ├── bot.js               # Main bot (polling mode)
│   ├── webhook.js           # Webhook mode for production
│   ├── start.sh             # Easy startup script
│   ├── ecosystem.config.json # PM2 configuration
│   └── README.md            # Bot setup guide
└── website/
    ├── index.html           # Frontend
    ├── styles.css           # Styling
    └── script-claude.js     # JavaScript
```

## Deployment Options

### Option 1: Web Application Only
Deploy just the web interface to DigitalOcean App Platform

### Option 2: Full Setup (Web + Telegram Bot)
Deploy both web interface and Telegram bot for complete betting assistant

### Option 3: Telegram Bot Only
Run just the Telegram bot on any server for chat-based betting insights

## What This Setup Provides

✅ **Automatic SSL** - HTTPS enabled by default
✅ **Auto-scaling** - Handles traffic spikes automatically  
✅ **Zero-downtime deployments** - Updates without interruption
✅ **Built-in monitoring** - Performance metrics included
✅ **Custom domain support** - Add your own domain later

## Cost

- **Basic tier**: ~$5/month for the API service
- **Static site**: Free hosting for the frontend
- **Total**: Much cheaper than managing a VPS

## Deployment Steps

1. **Upload to GitHub:**
   ```bash
   # Create new repository on GitHub, then:
   git init
   git add .
   git commit -m "Initial commit - Claude Betting Assistant"
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```

2. **Create App Platform App:**
   - Visit: https://cloud.digitalocean.com/apps
   - Click "Create App"
   - Select "GitHub" as source
   - Choose your repository
   - App Platform will auto-detect the configuration

3. **Your app will be live at:**
   `https://claude-betting-assistant-xxxxx.ondigitalocean.app`

## Security Features

- API key stored as encrypted environment variable
- CORS configured for App Platform domains
- Production-ready error handling
- Health check endpoints for monitoring

## No Server Management Required!

- No SSH access needed
- No npm/Node.js installation
- No nginx configuration
- No PM2 process management
- No server updates or patches

Everything is handled automatically by App Platform!
