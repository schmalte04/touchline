const https = require('https');

// Test function to simulate minimal-chat-widget request
function testMinimalWidget() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            message: 'Test from minimal chat widget',
            context: 'minimal-web-widget'
        });

        const options = {
            hostname: 'shark-app-robkv.ondigitalocean.app',
            port: 443,
            path: '/api/chat',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length,
                'X-Widget-Source': 'minimal-chat-widget',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve(response);
                } catch (error) {
                    reject('Invalid JSON response');
                }
            });
        });

        req.on('error', (error) => {
            reject(error.message);
        });

        req.write(postData);
        req.end();
    });
}

// Check recent logs for our test
function checkLogs() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'shark-app-robkv.ondigitalocean.app',
            port: 443,
            path: '/api/chat-logs?limit=5',
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
                    resolve(response);
                } catch (error) {
                    reject('Invalid JSON response');
                }
            });
        });

        req.on('error', (error) => {
            reject(error.message);
        });

        req.end();
    });
}

// Test function to simulate touchline-widget request
function testTouchlineWidget() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            message: 'Test from touchline widget',
            context: 'widget',
            userId: 'widget-user'
        });

        const options = {
            hostname: 'shark-app-robkv.ondigitalocean.app',
            port: 443,
            path: '/api/chat',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length,
                'X-Widget-Source': 'touchline-widget',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve(response);
                } catch (error) {
                    reject('Invalid JSON response');
                }
            });
        });

        req.on('error', (error) => {
            reject(error.message);
        });

        req.write(postData);
        req.end();
    });
}

async function testAllWidgetSources() {
    console.log('🧪 Testing All Widget Source Detection...\n');

    try {
        // Send test messages from both widgets
        console.log('📤 Sending test message from minimal chat widget...');
        const minimalResponse = await testMinimalWidget();
        
        if (minimalResponse.success) {
            console.log('✅ Minimal widget API responded successfully');
        } else {
            console.log('❌ Minimal widget API error:', minimalResponse.error);
        }

        console.log('📤 Sending test message from touchline widget...');
        const touchlineResponse = await testTouchlineWidget();
        
        if (touchlineResponse.success) {
            console.log('✅ Touchline widget API responded successfully');
        } else {
            console.log('❌ Touchline widget API error:', touchlineResponse.error);
        }

        // Wait for log to be written
        console.log('\n⏳ Waiting for log to be processed...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check recent logs
        console.log('📋 Checking recent logs...');
        const logsResponse = await checkLogs();

        if (logsResponse.success && logsResponse.logs) {
            console.log('\n✅ Recent Chat Logs:');
            console.log('═══════════════════════════════════════════════════');
            
            const widgetLogs = logsResponse.logs.filter(log => 
                log.source === 'minimal-chat-widget' || 
                log.source === 'touchline-widget' ||
                log.context === 'minimal-web-widget' ||
                log.context === 'widget' ||
                log.user_prompt.includes('Test from minimal chat widget') ||
                log.user_prompt.includes('Test from touchline widget')
            );

            if (widgetLogs.length > 0) {
                console.log('\n🎯 Widget Logs Found:');
                widgetLogs.forEach((log, index) => {
                    const timestamp = new Date(log.timestamp).toLocaleString();
                    const isCorrect = (
                        (log.context === 'minimal-web-widget' && log.source === 'minimal-chat-widget') ||
                        (log.context === 'widget' && log.source === 'touchline-widget')
                    );
                    console.log(`${index + 1}. ${timestamp}`);
                    console.log(`   📍 Source: ${log.source} ← ${isCorrect ? '✅ CORRECT!' : '❌ Wrong'}`);
                    console.log(`   💬 Prompt: ${log.user_prompt}`);
                    console.log(`   📋 Context: ${log.context}`);
                    console.log('   ─────────────────────────────────────────');
                });
                
                const minimalCorrect = widgetLogs.some(log => log.source === 'minimal-chat-widget');
                const touchlineCorrect = widgetLogs.some(log => log.source === 'touchline-widget');
                
                if (minimalCorrect && touchlineCorrect) {
                    console.log('\n🎉 SUCCESS! Both widgets are correctly identified!');
                } else {
                    console.log(`\n⚠️  Results: Minimal widget ${minimalCorrect ? '✅' : '❌'}, Touchline widget ${touchlineCorrect ? '✅' : '❌'}`);
                }
            } else {
                console.log('\n⚠️  No widget logs found yet - may need to wait longer or check deployment');
            }

            // Show all recent logs for context
            console.log('\n📊 All Recent Logs (for context):');
            logsResponse.logs.slice(0, 3).forEach((log, index) => {
                const timestamp = new Date(log.timestamp).toLocaleString();
                console.log(`${index + 1}. Source: ${log.source}, Context: ${log.context}, Prompt: ${log.user_prompt.substring(0, 40)}...`);
            });
        } else {
            console.log('❌ Failed to retrieve logs:', logsResponse);
        }

        console.log('\n🏁 Test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testAllWidgetSources();
