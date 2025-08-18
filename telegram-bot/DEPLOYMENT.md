# Touchline Telegram Bot - DigitalOcean Deployment

This directory contains the Telegram bot component for Touchline Betting Assistant, configured for deployment on DigitalOcean App Platform.

## DigitalOcean Deployment Options

### Option 1: DigitalOcean App Platform (Recommended)

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Add Telegram bot for deployment"
   git push origin main
   ```

2. **Create App on DigitalOcean**:
   - Go to [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
   - Click "Create App"
   - Connect your GitHub repository: `schmalte04/touchline`
   - Select the `main` branch
   - Choose "Node.js" as the build pack
   - Set source directory to `telegram-bot/`

3. **Configure Environment Variables**:
   - `TELEGRAM_BOT_TOKEN`: Your bot token from @BotFather
   - `API_BASE_URL`: https://shark-app-robkv.ondigitalocean.app
   - `NODE_ENV`: production

4. **App Configuration**:
   - Build Command: `npm install`
   - Run Command: `npm start`
   - Instance Size: Basic ($5/month)

### Option 2: Using the included app.yaml

The `.do/app.yaml` file contains the complete configuration. You can:

1. **Deploy via doctl CLI**:
   ```bash
   doctl apps create --spec .do/app.yaml
   ```

2. **Or upload the YAML** in the DigitalOcean dashboard when creating a new app.

## Important Notes

- The bot uses **polling mode** (not webhooks) for simplicity
- It connects to your existing API at `shark-app-robkv.ondigitalocean.app`
- No database connection needed - it communicates through your API
- Minimal resource requirements (basic-xxs instance is sufficient)

## Bot Features

- Natural language betting queries
- Real-time analysis via your Claude AI system
- Accumulator building
- Match recommendations
- Mobile-friendly interface

## Security

- Bot token is stored as encrypted environment variable
- API communication over HTTPS
- No sensitive data stored locally

## Monitoring

Once deployed, monitor your bot through:
- DigitalOcean App Platform dashboard
- Telegram bot analytics
- API server logs

The bot will be available 24/7 for users to interact with via Telegram.
