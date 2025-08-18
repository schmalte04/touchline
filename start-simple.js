#!/usr/bin/env node

// Simple production starter for DigitalOcean
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Touchline services...');

// Check if we're in production
const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
    console.log('🌐 Production mode: Starting API server only (bot runs as separate worker)');
    
    // In production, just start the API server
    // The bot should be configured as a separate worker process in DigitalOcean
    const api = spawn('node', ['api-server/server.js'], {
        stdio: 'inherit',
        cwd: __dirname
    });
    
    api.on('exit', (code) => {
        console.log(`API server exited with code ${code}`);
        process.exit(code);
    });
    
} else {
    console.log('🔧 Development mode: Starting both services');
    
    // Development mode - run both
    const api = spawn('node', ['api-server/server.js'], {
        stdio: 'inherit',
        cwd: __dirname
    });
    
    setTimeout(() => {
        const bot = spawn('node', ['bot.js'], {
            stdio: 'inherit',
            cwd: path.join(__dirname, 'telegram-bot')
        });
        
        bot.on('exit', (code) => {
            console.log(`Bot exited with code ${code}`);
        });
    }, 3000);
    
    api.on('exit', (code) => {
        console.log(`API server exited with code ${code}`);
        process.exit(code);
    });
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Shutting down...');
    process.exit(0);
});
