# Touchline - AI-Powered Football Betting Assistant

A professional Claude AI-powered betting assistant that provides intelligent football match analysis, ELO ratings, xG predictions, and betting recommendations.

![Touchline Logo](https://img.shields.io/badge/Touchline-AI%20Betting%20Assistant-blue)

## 🚀 Features

- **Real-time Match Analysis** - Live data integration with comprehensive statistics
- **Claude AI Integration** - Powered by Anthropic's Claude for intelligent betting insights
- **ELO & xG Analytics** - Advanced metrics for informed decision making
- **Professional UI** - Clean, responsive design optimized for betting analysis
- **Risk Assessment** - Confidence levels and risk evaluation for each recommendation

## 🎯 Live Demo

**Coming Soon** - Will be deployed on DigitalOcean App Platform

## 🛠 Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **AI**: Anthropic Claude API
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

### Professional Features
- Real-time data updates
- Mobile-responsive design
- Secure API integration
- Production-ready deployment

## 🚀 Quick Start

This application is designed for DigitalOcean App Platform deployment with zero configuration required.

### Automatic Deployment Features
- **SSL/HTTPS** - Automatic certificate management
- **Auto-scaling** - Handles traffic spikes automatically
- **Zero-downtime** - Seamless updates and deployments
- **Monitoring** - Built-in performance metrics
- **Security** - Environment variable encryption

## File Structure

```
digitalocean-app-deploy/
├── .do/
│   └── app.yaml              # App Platform configuration
├── api-server/
│   ├── package.json          # Node.js dependencies
│   └── server.js             # API server
└── website/
    ├── index.html            # Frontend
    ├── styles.css            # Styling
    └── script-claude.js      # JavaScript
```

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
