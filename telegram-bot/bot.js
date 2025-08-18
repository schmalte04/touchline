const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const moment = require('moment');
require('dotenv').config({ path: '../.env' });

// Telegram Bot Token - Get this from @BotFather on Telegram
const token = process.env.TELEGRAM_BOT_TOKEN;
const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:8080';

if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN not found in environment variables');
    console.log('📝 To create a bot:');
    console.log('1. Message @BotFather on Telegram');
    console.log('2. Use /newbot command');
    console.log('3. Follow instructions to get your token');
    console.log('4. Add TELEGRAM_BOT_TOKEN=your_token to your .env file');
    process.exit(1);
}

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

console.log('🤖 Touchline Betting Bot started successfully!');
console.log(`🌐 API Base URL: ${apiBaseUrl}`);

// Health check function
async function checkAPIHealth() {
    try {
        console.log('🔍 Performing health check...');
        const response = await axios.get(`${apiBaseUrl}/health`, { timeout: 5000 });
        console.log('✅ API health check passed');
        return true;
    } catch (error) {
        console.log('❌ API health check failed:', error.message);
        return false;
    }
}

// Perform initial health check
checkAPIHealth();

// Store user sessions (in production, use Redis or database)
const userSessions = new Map();

// Helper function to call the existing API
async function callBettingAPI(message, userId) {
    try {
        console.log(`🔄 Attempting API call to: ${apiBaseUrl}/api/chat`);
        console.log(`📤 Sending message: "${message}" for user: ${userId}`);
        
        const response = await axios.post(`${apiBaseUrl}/api/chat`, {
            message: message,
            userId: userId
        }, {
            timeout: 30000, // 30 second timeout
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'TelegramBot/1.0'
            }
        });
        
        console.log(`✅ API response received. Status: ${response.status}`);
        return response.data.reply;
    } catch (error) {
        console.error('❌ API call failed:', error.message);
        
        // Detailed error reporting
        if (error.code === 'ECONNREFUSED') {
            console.error('🔴 Connection refused - API server is not running');
            return '🔴 **CONNECTION ERROR**: Cannot reach the API server. The betting analysis service appears to be offline.';
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
            console.error('🔴 Network timeout or DNS error');
            return '🔴 **NETWORK ERROR**: Cannot connect to the analysis server. Please check your internet connection.';
        } else if (error.response) {
            console.error(`🔴 API returned error: ${error.response.status} - ${error.response.statusText}`);
            if (error.response.status === 500) {
                return '🔴 **DATABASE ERROR**: The analysis engine encountered a database connection issue. Please try again later.';
            } else if (error.response.status === 503) {
                return '🔴 **SERVICE UNAVAILABLE**: The betting analysis service is temporarily unavailable.';
            } else {
                return `🔴 **API ERROR**: Server returned error ${error.response.status}. Please try again later.`;
            }
        } else {
            console.error('🔴 Unknown error:', error);
            return `🔴 **UNKNOWN ERROR**: ${error.message}. Please contact support if this persists.`;
        }
    }
}

// Helper function to format message for Telegram
function formatTelegramMessage(text) {
    // Convert HTML tables to text format
    let formatted = text.replace(/<table[^>]*>/gi, '\n📊 **MATCH DATA**\n');
    formatted = formatted.replace(/<\/table>/gi, '\n');
    formatted = formatted.replace(/<thead[^>]*>.*?<\/thead>/gis, '');
    formatted = formatted.replace(/<tr[^>]*>/gi, '');
    formatted = formatted.replace(/<\/tr>/gi, '\n');
    formatted = formatted.replace(/<td[^>]*>/gi, '| ');
    formatted = formatted.replace(/<\/td>/gi, ' ');
    formatted = formatted.replace(/<th[^>]*>/gi, '**');
    formatted = formatted.replace(/<\/th>/gi, '** ');
    
    // Convert other HTML elements
    formatted = formatted.replace(/<br\s*\/?>/gi, '\n');
    formatted = formatted.replace(/<div[^>]*>/gi, '\n');
    formatted = formatted.replace(/<\/div>/gi, '');
    formatted = formatted.replace(/<span[^>]*>/gi, '');
    formatted = formatted.replace(/<\/span>/gi, '');
    formatted = formatted.replace(/<strong>/gi, '**');
    formatted = formatted.replace(/<\/strong>/gi, '**');
    formatted = formatted.replace(/<b>/gi, '**');
    formatted = formatted.replace(/<\/b>/gi, '**');
    
    // Clean up excessive newlines
    formatted = formatted.replace(/\n\s*\n\s*\n/g, '\n\n');
    formatted = formatted.replace(/\n{3,}/g, '\n\n');
    
    // Convert odds and important numbers to emojis
    formatted = formatted.replace(/@ ([\d.]+)/g, '💰 $1');
    formatted = formatted.replace(/(\d+)%/g, '📊 $1%');
    
    return formatted.trim();
}

// Start command
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
/debug - Test system connectivity
/upcoming - Show interesting upcoming matches
/accumulator - Build a smart accumulator
/confidence - High confidence bets today

Or just ask me anything about football betting! 

*Example: "Help me build an accumulator for this weekend"*
    `;
    
    bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// Help command
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    
    const helpMessage = `
🤖 **Touchline Betting Assistant Commands**

**Quick Actions:**
/upcoming - Show upcoming matches with best opportunities
/accumulator - Build a smart accumulator bet
/confidence - Get high confidence betting recommendations
/analyze [team1] vs [team2] - Analyze specific match

**General Commands:**
/start - Welcome message and introduction
/help - Show this help menu
/debug - Test system connectivity and troubleshoot
/stats - Your usage statistics

**Chat Examples:**
• "Show me today's best bets"
• "Build an accumulator for Premier League"
• "Analyze Manchester United vs Arsenal"
• "What are the high confidence picks?"
• "Help me with Champions League betting"

Just type your question naturally - I understand context and can help with complex betting strategies!

💡 **Tip:** Be specific about leagues, dates, or bet types for better recommendations.
    `;
    
    bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// Debug command for connectivity testing
bot.onText(/\/debug/, async (msg) => {
    const chatId = msg.chat.id;
    
    bot.sendMessage(chatId, '🔧 **DEBUG MODE** - Testing system connectivity...\n\n' +
                           '⏳ Checking API connection...');
    
    try {
        // Test API connectivity
        console.log('🔍 Debug command: Testing API health...');
        const healthCheck = await checkAPIHealth();
        
        let debugMessage = '🔧 **SYSTEM DIAGNOSTICS**\n\n';
        debugMessage += `🌐 **API Base URL**: ${apiBaseUrl}\n`;
        debugMessage += `🤖 **Bot Token**: ${token ? '✅ Present' : '❌ Missing'}\n`;
        debugMessage += `🔗 **API Health Check**: ${healthCheck ? '✅ Passed' : '❌ Failed'}\n\n`;
        
        if (healthCheck) {
            debugMessage += '🟢 **STATUS**: All systems operational\n';
            debugMessage += '📝 You can now use the bot normally!';
        } else {
            debugMessage += '🔴 **STATUS**: API connection issues detected\n';
            debugMessage += '💡 **Possible causes**:\n';
            debugMessage += '• API server is not running\n';
            debugMessage += '• Database connection problems\n';
            debugMessage += '• Network connectivity issues\n';
            debugMessage += '• Environment configuration errors';
        }
        
        // Test a simple API call
        try {
            const testResponse = await axios.get(`${apiBaseUrl}/health`, { timeout: 3000 });
            debugMessage += `\n\n📊 **API Response**: ${testResponse.status} ${testResponse.statusText}`;
        } catch (error) {
            debugMessage += `\n\n❌ **API Error**: ${error.message}`;
        }
        
        bot.sendMessage(chatId, debugMessage, { parse_mode: 'Markdown' });
    } catch (error) {
        bot.sendMessage(chatId, `🔴 **DEBUG ERROR**: ${error.message}`, { parse_mode: 'Markdown' });
    }
});

// Upcoming matches command
bot.onText(/\/upcoming/, async (msg) => {
    const chatId = msg.chat.id;
    
    bot.sendMessage(chatId, '🔍 Analyzing upcoming matches... This may take a moment.');
    
    const response = await callBettingAPI('Show me the most interesting upcoming matches for betting', msg.from.id);
    const formattedResponse = formatTelegramMessage(response);
    
    // Split long messages if needed (Telegram has 4096 character limit)
    if (formattedResponse.length > 4000) {
        const parts = formattedResponse.match(/[\s\S]{1,4000}/g);
        for (let i = 0; i < parts.length; i++) {
            await bot.sendMessage(chatId, parts[i], { parse_mode: 'Markdown' });
            if (i < parts.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
            }
        }
    } else {
        bot.sendMessage(chatId, formattedResponse, { parse_mode: 'Markdown' });
    }
});

// Accumulator command
bot.onText(/\/accumulator/, async (msg) => {
    const chatId = msg.chat.id;
    
    bot.sendMessage(chatId, '🎲 Building a smart accumulator... Please wait while I analyze the best combinations.');
    
    const response = await callBettingAPI('Help me build an accumulator with 3-4 matches', msg.from.id);
    const formattedResponse = formatTelegramMessage(response);
    
    if (formattedResponse.length > 4000) {
        const parts = formattedResponse.match(/[\s\S]{1,4000}/g);
        for (let i = 0; i < parts.length; i++) {
            await bot.sendMessage(chatId, parts[i], { parse_mode: 'Markdown' });
            if (i < parts.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    } else {
        bot.sendMessage(chatId, formattedResponse, { parse_mode: 'Markdown' });
    }
});

// High confidence command
bot.onText(/\/confidence/, async (msg) => {
    const chatId = msg.chat.id;
    
    bot.sendMessage(chatId, '⭐ Finding high confidence betting opportunities...');
    
    const response = await callBettingAPI('Show me high confidence bets for today', msg.from.id);
    const formattedResponse = formatTelegramMessage(response);
    
    if (formattedResponse.length > 4000) {
        const parts = formattedResponse.match(/[\s\S]{1,4000}/g);
        for (let i = 0; i < parts.length; i++) {
            await bot.sendMessage(chatId, parts[i], { parse_mode: 'Markdown' });
            if (i < parts.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    } else {
        bot.sendMessage(chatId, formattedResponse, { parse_mode: 'Markdown' });
    }
});

// Analyze specific match
bot.onText(/\/analyze (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const matchQuery = match[1];
    
    bot.sendMessage(chatId, `🔬 Analyzing "${matchQuery}"... Getting detailed insights.`);
    
    const response = await callBettingAPI(`Analyze this match: ${matchQuery}`, msg.from.id);
    const formattedResponse = formatTelegramMessage(response);
    
    if (formattedResponse.length > 4000) {
        const parts = formattedResponse.match(/[\s\S]{1,4000}/g);
        for (let i = 0; i < parts.length; i++) {
            await bot.sendMessage(chatId, parts[i], { parse_mode: 'Markdown' });
            if (i < parts.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    } else {
        bot.sendMessage(chatId, formattedResponse, { parse_mode: 'Markdown' });
    }
});

// Stats command
bot.onText(/\/stats/, (msg) => {
    const chatId = msg.chat.id;
    const session = userSessions.get(chatId);
    
    if (session) {
        const uptime = moment().diff(moment(session.startTime), 'minutes');
        const statsMessage = `
📊 **Your Session Statistics**

⏰ Session started: ${moment(session.startTime).format('HH:mm DD/MM/YYYY')}
🕐 Session duration: ${uptime} minutes
💬 Messages sent: ${session.messageCount}
🆔 User ID: ${session.userId}

Keep exploring for more betting insights! 🎯
        `;
        bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
    } else {
        bot.sendMessage(chatId, '📊 No session data found. Send /start to begin!');
    }
});

// Handle all other messages as general chat
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const messageText = msg.text;
    const userName = msg.from.first_name || 'Unknown';
    
    // Skip if it's a command (starts with /)
    if (messageText && messageText.startsWith('/')) {
        return;
    }
    
    // Log the incoming message
    console.log(`📨 Message from ${userName} (${chatId}): "${messageText}"`);
    
    // Update session
    const session = userSessions.get(chatId);
    if (session) {
        session.messageCount++;
    }
    
    // Show typing indicator
    bot.sendChatAction(chatId, 'typing');
    
    try {
        console.log(`🔄 Processing message for user ${userName}...`);
        const response = await callBettingAPI(messageText, msg.from.id);
        
        if (response.includes('🔴')) {
            // This is an error message from our API call
            console.log(`❌ Error response detected: ${response}`);
        } else {
            console.log(`✅ Successful response received for ${userName}`);
        }
        
        const formattedResponse = formatTelegramMessage(response);
        
        // Handle long messages
        if (formattedResponse.length > 4000) {
            console.log(`📄 Long response (${formattedResponse.length} chars), splitting into parts...`);
            const parts = formattedResponse.match(/[\s\S]{1,4000}/g);
            for (let i = 0; i < parts.length; i++) {
                await bot.sendMessage(chatId, parts[i], { parse_mode: 'Markdown' });
                if (i < parts.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        } else {
            await bot.sendMessage(chatId, formattedResponse, { parse_mode: 'Markdown' });
        }
        
        console.log(`✅ Response sent successfully to ${userName}`);
    } catch (error) {
        console.error(`❌ Error handling message from ${userName}:`, error);
        console.error(`❌ Error details:`, {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        
        let errorMessage = '⚠️ **ERROR PROCESSING REQUEST**\n\n';
        errorMessage += `🔴 **Error Type**: ${error.name || 'Unknown'}\n`;
        errorMessage += `📝 **Details**: ${error.message}\n\n`;
        errorMessage += '💡 **Try these steps**:\n';
        errorMessage += '• Use /debug to check system status\n';
        errorMessage += '• Wait a moment and try again\n';
        errorMessage += '• Rephrase your question\n';
        errorMessage += '• Contact support if problem persists';
        
        bot.sendMessage(chatId, errorMessage, { parse_mode: 'Markdown' });
    }
});

// Error handling
bot.on('error', (error) => {
    console.error('❌ Telegram Bot Error:', error);
});

bot.on('polling_error', (error) => {
    console.error('❌ Polling Error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Shutting down Telegram bot...');
    bot.stopPolling();
    process.exit(0);
});

console.log('🚀 Bot is running! Message it on Telegram to start chatting.');
