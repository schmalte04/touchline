#!/usr/bin/env node

/**
 * Test script to verify that Claude response logging is working
 */

const https = require('https');

const testData = {
    message: "Can you tell me about today's football matches?",
    context: "test_claude_response_logging"
};

const postData = JSON.stringify(testData);

const options = {
    hostname: 'shark-app-robkv.ondigitalocean.app',
    port: 443,
    path: '/api/chat',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log('🧪 Testing Claude response logging...');
console.log('📤 Sending request to chat API...');

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            console.log('✅ Chat API Response Status:', response.success ? 'Success' : 'Failed');
            
            if (response.success) {
                console.log('📝 Response length:', response.response?.length || 0, 'characters');
                console.log('🔍 Response preview:', response.response?.substring(0, 100) + '...');
                
                // Now check if it was logged
                setTimeout(() => {
                    console.log('\n📊 Checking if response was logged...');
                    checkLogs();
                }, 2000);
            } else {
                console.error('❌ Chat API failed:', response.error);
            }
        } catch (error) {
            console.error('❌ Failed to parse response:', error.message);
            console.log('Raw response:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Request failed:', error.message);
});

req.write(postData);
req.end();

function checkLogs() {
    const options = {
        hostname: 'shark-app-robkv.ondigitalocean.app',
        port: 443,
        path: '/api/chat-logs?limit=1',
        method: 'GET'
    };

    const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                if (response.success && response.logs.length > 0) {
                    const latestLog = response.logs[0];
                    console.log('✅ Latest log entry found:');
                    console.log('   📅 Timestamp:', latestLog.timestamp);
                    console.log('   💬 User prompt:', latestLog.user_prompt);
                    console.log('   🤖 Claude response:', latestLog.claude_response ? 
                        (latestLog.claude_response.substring(0, 100) + '...') : 
                        '(NOT LOGGED)');
                    console.log('   📏 Response length:', latestLog.response_length);
                    console.log('   🏷️  Context:', latestLog.context);
                    
                    if (latestLog.claude_response) {
                        console.log('\n🎉 SUCCESS: Claude responses are now being logged!');
                    } else {
                        console.log('\n⚠️  WARNING: Claude response not found in log entry');
                    }
                } else {
                    console.log('❌ No log entries found');
                }
            } catch (error) {
                console.error('❌ Failed to parse logs response:', error.message);
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ Log check request failed:', error.message);
    });

    req.end();
}
