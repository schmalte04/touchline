const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Touchline API and Telegram Bot with independent process management...');

let apiServer = null;
let telegramBot = null;
let isShuttingDown = false;

// Restart counters and limits
const restartLimits = {
    api: { count: 0, maxRestarts: 5, window: 300000 }, // 5 restarts in 5 minutes
    bot: { count: 0, maxRestarts: 10, window: 300000 }  // 10 restarts in 5 minutes (bots can be more flaky)
};

// Reset restart counters after time window
setInterval(() => {
    restartLimits.api.count = 0;
    restartLimits.bot.count = 0;
    console.log('🔄 Restart counters reset');
}, restartLimits.api.window);

// Function to start API server with restart capability
function startAPIServer() {
    if (isShuttingDown) return;
    
    console.log('🌐 Starting API server...');
    apiServer = spawn('node', ['api-server/server.js'], {
        cwd: __dirname,
        stdio: ['inherit', 'inherit', 'inherit']
    });

    apiServer.on('exit', (code, signal) => {
        if (isShuttingDown) return;
        
        console.log(`🌐 API server exited with code ${code}, signal: ${signal}`);
        
        if (code !== 0 && restartLimits.api.count < restartLimits.api.maxRestarts) {
            restartLimits.api.count++;
            console.log(`🔄 Restarting API server (attempt ${restartLimits.api.count}/${restartLimits.api.maxRestarts}) in 5 seconds...`);
            setTimeout(startAPIServer, 5000);
        } else if (restartLimits.api.count >= restartLimits.api.maxRestarts) {
            console.error('🔴 API server reached maximum restart attempts. Manual intervention required.');
            console.log('🤖 Telegram bot will continue running independently.');
        }
    });

    apiServer.on('error', (error) => {
        console.error('🔴 API server error:', error);
    });
}

// Function to start Telegram bot with restart capability
function startTelegramBot() {
    if (isShuttingDown) return;
    
    console.log('🤖 Starting Telegram bot...');
    telegramBot = spawn('node', ['bot.js'], {
        cwd: path.join(__dirname, 'telegram-bot'),
        stdio: ['inherit', 'inherit', 'inherit']
    });

    telegramBot.on('exit', (code, signal) => {
        if (isShuttingDown) return;
        
        console.log(`🤖 Telegram bot exited with code ${code}, signal: ${signal}`);
        
        if (code !== 0 && restartLimits.bot.count < restartLimits.bot.maxRestarts) {
            restartLimits.bot.count++;
            console.log(`🔄 Restarting Telegram bot (attempt ${restartLimits.bot.count}/${restartLimits.bot.maxRestarts}) in 3 seconds...`);
            setTimeout(startTelegramBot, 3000);
        } else if (restartLimits.bot.count >= restartLimits.bot.maxRestarts) {
            console.error('🔴 Telegram bot reached maximum restart attempts. Manual intervention required.');
            console.log('🌐 API server will continue running independently.');
        }
    });

    telegramBot.on('error', (error) => {
        console.error('🔴 Telegram bot error:', error);
    });
}

// Function to handle graceful shutdown
function gracefulShutdown() {
    if (isShuttingDown) return;
    isShuttingDown = true;
    
    console.log('📴 Shutting down services gracefully...');
    
    if (apiServer) {
        console.log('🌐 Stopping API server...');
        apiServer.kill('SIGTERM');
    }
    
    if (telegramBot) {
        console.log('🤖 Stopping Telegram bot...');
        telegramBot.kill('SIGTERM');
    }
    
    // Force exit after 10 seconds if processes don't terminate
    setTimeout(() => {
        console.log('⚠️ Force terminating remaining processes...');
        if (apiServer) apiServer.kill('SIGKILL');
        if (telegramBot) telegramBot.kill('SIGKILL');
        process.exit(0);
    }, 10000);
    
    // Exit when both processes are done
    let processesDown = 0;
    const checkExit = () => {
        processesDown++;
        if (processesDown === 2) {
            console.log('✅ All services stopped. Goodbye!');
            process.exit(0);
        }
    };
    
    if (apiServer) apiServer.on('close', checkExit);
    if (telegramBot) telegramBot.on('close', checkExit);
}

// Set up signal handlers
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Start both services
startAPIServer();

// Wait for API to initialize before starting bot
setTimeout(() => {
    startTelegramBot();
    console.log('✅ Both services started with independent monitoring!');
    console.log('📊 Features:');
    console.log('   - Independent crash recovery');
    console.log('   - Automatic restarts (API: 5 attempts, Bot: 10 attempts)');
    console.log('   - Graceful shutdown handling');
    console.log('   - Service isolation (one crash won\'t affect the other)');
}, 3000);

// Keep the process alive and monitor health
setInterval(() => {
    const apiRunning = apiServer && !apiServer.killed;
    const botRunning = telegramBot && !telegramBot.killed;
    
    if (!isShuttingDown) {
        console.log(`💚 Health check - API: ${apiRunning ? '✅' : '❌'}, Bot: ${botRunning ? '✅' : '❌'}`);
    }
}, 60000); // Health check every minute

// Keep the process alive
process.stdin.resume();
