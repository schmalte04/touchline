const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');
const moment = require('moment');
require('dotenv').config({ path: '../.env' });

const token = process.env.TELEGRAM_BOT_TOKEN;
const webhookUrl = process.env.WEBHOOK_URL;
const port = process.env.BOT_PORT || 3001;
const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:8080';

if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN not found in environment variables');
    process.exit(1);
}

// Create bot with webhook
const bot = new TelegramBot(token, { webHook: true });
const app = express();

// Set webhook
if (webhookUrl) {
    bot.setWebHook(`${webhookUrl}/bot${token}`);
    console.log(`🌐 Webhook set to: ${webhookUrl}/bot${token}`);
} else {
    console.log('⚠️ No WEBHOOK_URL provided, using polling mode');
    bot.stopPolling();
    // Use the polling version instead
    require('./bot.js');
    return;
}

app.use(express.json());

// Webhook endpoint
app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Store user sessions
const userSessions = new Map();

// Helper functions (same as in bot.js)
async function callBettingAPI(message, userId) {
    try {
        const response = await axios.post(`${apiBaseUrl}/api/chat`, {
            message: message,
            userId: userId
        }, {
            timeout: 30000
        });
        
        return response.data.reply;
    } catch (error) {
        console.error('❌ API call failed:', error.message);
        return '⚠️ Sorry, I\'m having trouble connecting to my analysis engine. Please try again later.';
    }
}

function formatTelegramMessage(text) {
    let formatted = text.replace(/<table[^>]*>/gi, '\n📊 **MATCH DATA**\n');
    formatted = formatted.replace(/<\/table>/gi, '\n');
    formatted = formatted.replace(/<thead[^>]*>.*?<\/thead>/gis, '');
    formatted = formatted.replace(/<tr[^>]*>/gi, '');
    formatted = formatted.replace(/<\/tr>/gi, '\n');
    formatted = formatted.replace(/<td[^>]*>/gi, '| ');
    formatted = formatted.replace(/<\/td>/gi, ' ');
    formatted = formatted.replace(/<th[^>]*>/gi, '**');
    formatted = formatted.replace(/<\/th>/gi, '** ');
    formatted = formatted.replace(/<br\s*\/?>/gi, '\n');
    formatted = formatted.replace(/<div[^>]*>/gi, '\n');
    formatted = formatted.replace(/<\/div>/gi, '');
    formatted = formatted.replace(/<span[^>]*>/gi, '');
    formatted = formatted.replace(/<\/span>/gi, '');
    formatted = formatted.replace(/<strong>/gi, '**');
    formatted = formatted.replace(/<\/strong>/gi, '**');
    formatted = formatted.replace(/<b>/gi, '**');
    formatted = formatted.replace(/<\/b>/gi, '**');
    formatted = formatted.replace(/\n\s*\n\s*\n/g, '\n\n');
    formatted = formatted.replace(/\n{3,}/g, '\n\n');
    formatted = formatted.replace(/@ ([\d.]+)/g, '💰 $1');
    formatted = formatted.replace(/(\d+)%/g, '📊 $1%');
    
    return formatted.trim();
}

// Bot event handlers (same as in bot.js but using webhook bot instance)
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name || 'there';
    
    userSessions.set(chatId, {
        userId: msg.from.id,
        startTime: new Date(),
        messageCount: 0
    });
    
    const welcomeMessage = `
🎯 **Welcome to Touchline Betting Assistant, ${userName}!**

I'm your AI-powered betting analysis bot. I can help you with:

🏈 **Match Analysis** - Get detailed insights on upcoming matches
🎲 **Accumulator Building** - Smart multi-bet recommendations  
⭐ **High Confidence Bets** - Best value opportunities
📊 **Live Odds Analysis** - Real-time market insights
🔍 **Specific Match Lookup** - Deep dive on any fixture

**Quick Commands:**
/help - Show all commands
/upcoming - Show interesting upcoming matches
/accumulator - Build a smart accumulator
/confidence - High confidence bets today

Or just ask me anything about football betting! 

*Example: "Help me build an accumulator for this weekend"*
    `;
    
    bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// Add all other bot handlers here (same as in bot.js)
// ... (include all the bot.onText handlers from bot.js)

app.listen(port, () => {
    console.log(`🚀 Telegram Bot Webhook server listening on port ${port}`);
    console.log(`🤖 Bot is ready to receive messages via webhook`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Shutting down webhook server...');
    process.exit(0);
});
