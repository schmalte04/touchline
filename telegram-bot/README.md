# Touchline Telegram Bot 🤖

A Telegram bot that provides AI-powered football betting recommendations and analysis through your existing Touchline API.

## Features

🎯 **Smart Betting Analysis** - Get AI-powered match insights
🎲 **Accumulator Builder** - Create optimized multi-bet combinations  
⭐ **High Confidence Picks** - Best value betting opportunities
📊 **Live Match Data** - Real-time odds and statistics
🔍 **Specific Match Analysis** - Deep dive on any fixture

## Quick Setup

### 1. Create a Telegram Bot

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` command
3. Follow the instructions to name your bot
4. Copy the bot token (looks like `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`)

### 2. Environment Setup

Add to your `.env` file in the root directory:
```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here

# API Configuration (if different from default)
API_BASE_URL=http://localhost:8080
```

### 3. Install Dependencies

```bash
cd telegram-bot
npm install
```

### 4. Run the Bot

```bash
# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm start
```

## Bot Commands

### Quick Actions
- `/start` - Welcome message and introduction
- `/help` - Show all available commands
- `/upcoming` - Show interesting upcoming matches
- `/accumulator` - Build a smart accumulator bet
- `/confidence` - Get high confidence betting picks
- `/analyze [match]` - Analyze specific match (e.g., "Arsenal vs Chelsea")
- `/stats` - Show your usage statistics

### Natural Language
The bot understands natural language! Try:
- "Help me build an accumulator for this weekend"
- "What are the best bets for Premier League today?"
- "Show me high confidence picks"
- "Analyze Manchester United vs Liverpool"

## Architecture

```
Telegram User ↔ Telegram Bot ↔ Your API Server ↔ Claude AI + Database
```

The bot acts as a Telegram interface to your existing betting analysis API, providing the same intelligence through a convenient chat interface.

## Features in Detail

### 🎲 Accumulator Builder
- Analyzes multiple matches for optimal combinations
- Considers odds, form, and risk factors
- Provides combined odds and confidence scores

### ⭐ High Confidence Picks
- Filters matches with highest success probability
- Shows detailed reasoning for each recommendation
- Includes risk assessment and stake suggestions

### 📊 Match Analysis
- Deep statistical analysis of any match
- Historical head-to-head data
- Form analysis and injury reports
- Market value assessment

### 🔍 Smart Formatting
- Converts HTML tables to readable text
- Adds relevant emojis for better UX
- Handles long messages with automatic splitting
- Preserves important formatting and structure

## Production Deployment

### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the bot with PM2
pm2 start bot.js --name "touchline-telegram-bot"

# Save PM2 configuration
pm2 save

# Setup auto-restart on system reboot
pm2 startup
```

### Using Docker

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "bot.js"]
```

Build and run:
```bash
docker build -t touchline-telegram-bot .
docker run -d --name telegram-bot --env-file ../.env touchline-telegram-bot
```

## Security & Best Practices

### Rate Limiting
The bot includes built-in delays between messages to respect Telegram's rate limits.

### Error Handling
- Graceful error handling for API failures
- User-friendly error messages
- Automatic retry mechanisms

### Session Management
- Tracks user sessions and statistics
- Memory-based storage (consider Redis for production)
- Clean session cleanup

## Monitoring & Logs

The bot provides detailed logging:
- API call successes/failures
- User interaction statistics
- Error tracking and debugging info

For production, consider:
- Log aggregation (ELK stack, Splunk)
- Monitoring alerts for downtime
- Performance metrics tracking

## Customization

### Message Formatting
Edit the `formatTelegramMessage()` function to customize how API responses are displayed.

### Additional Commands
Add new commands by following the pattern:
```javascript
bot.onText(/\/newcommand/, async (msg) => {
    const chatId = msg.chat.id;
    // Your command logic here
});
```

### Webhook Mode (Alternative to Polling)
For production, consider webhook mode instead of polling:
```javascript
const bot = new TelegramBot(token, { webHook: true });
bot.setWebHook(`${process.env.WEBHOOK_URL}/bot${token}`);
```

## Troubleshooting

### Bot Not Responding
1. Check if bot token is correct in `.env`
2. Verify API server is running on correct port
3. Check network connectivity to Telegram servers
4. Review console logs for error messages

### API Connection Issues
1. Confirm API server is accessible
2. Check `API_BASE_URL` configuration
3. Verify firewall settings
4. Test API endpoints manually

### Message Formatting Issues
1. Check if HTML is being converted properly
2. Verify Markdown parsing is working
3. Test with shorter messages first
4. Review Telegram message size limits

## Support

For issues related to:
- **Bot functionality**: Check the console logs and error messages
- **API integration**: Verify your API server is running and accessible
- **Telegram features**: Refer to [Telegram Bot API documentation](https://core.telegram.org/bots/api)

---

## Example Usage

Once set up, users can interact with your bot like this:

**User**: `/start`
**Bot**: Welcome message with instructions

**User**: "Help me build an accumulator"
**Bot**: [Analyzes matches and provides accumulator recommendations]

**User**: `/analyze Arsenal vs Chelsea`
**Bot**: [Provides detailed match analysis with odds and predictions]

The bot provides the same powerful AI analysis as your web interface, but in a convenient Telegram chat format!
