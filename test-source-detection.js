const https = require('https');

// Test function to make a chat request with specific headers
function testChatWithSource(source, referer, userAgent = 'Node.js Test Script') {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            message: `Test message from ${source}`,
            context: 'source_test'
        });

        const options = {
            hostname: 'shark-app-robkv.ondigitalocean.app',
            port: 443,
            path: '/api/chat',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length,
                'User-Agent': userAgent
            }
        };

        // Add referer if provided
        if (referer) {
            options.headers['Referer'] = referer;
        }

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve({ source, response, expectedSource: source });
                } catch (error) {
                    reject({ source, error: 'Invalid JSON response', data });
                }
            });
        });

        req.on('error', (error) => {
            reject({ source, error: error.message });
        });

        req.write(postData);
        req.end();
    });
}

// Test function to check recent logs
function checkRecentLogs() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'shark-app-robkv.ondigitalocean.app',
            port: 443,
            path: '/api/chat-logs?limit=10',
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

async function runSourceTests() {
    console.log('🧪 Testing Source Detection...\n');

    const testCases = [
        {
            name: 'Lovable Integration',
            source: 'lovable',
            referer: 'https://lovable.dev/projects/12345',
            userAgent: 'Mozilla/5.0 (Chrome/91.0) Lovable'
        },
        {
            name: 'TurboScores Integration', 
            source: 'turboscores',
            referer: 'https://turboscores.com/chat',
            userAgent: 'Mozilla/5.0 (Chrome/91.0)'
        },
        {
            name: 'Direct API Call (curl)',
            source: 'api_direct_curl',
            referer: null,
            userAgent: 'curl/7.68.0'
        },
        {
            name: 'Touchline App',
            source: 'touchline_app',
            referer: 'https://shark-app-robkv.ondigitalocean.app',
            userAgent: 'Mozilla/5.0 (Chrome/91.0)'
        }
    ];

    try {
        // Run all test cases
        console.log('📤 Sending test requests...');
        const results = await Promise.all(
            testCases.map(test => testChatWithSource(test.source, test.referer, test.userAgent))
        );

        // Wait a moment for logs to be written
        console.log('⏳ Waiting for logs to be processed...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check recent logs
        console.log('📋 Checking recent logs...');
        const logsResponse = await checkRecentLogs();

        if (logsResponse.success && logsResponse.logs) {
            console.log('\n✅ Recent Chat Logs (showing source column):');
            console.log('═══════════════════════════════════════════════════════════════');
            
            logsResponse.logs.slice(0, 5).forEach((log, index) => {
                const timestamp = new Date(log.timestamp).toLocaleString();
                const prompt = log.user_prompt.length > 50 
                    ? log.user_prompt.substring(0, 50) + '...' 
                    : log.user_prompt;
                
                console.log(`${index + 1}. ${timestamp}`);
                console.log(`   📍 Source: ${log.source || 'NULL'}`);
                console.log(`   💬 Prompt: ${prompt}`);
                console.log(`   📋 Context: ${log.context || 'none'}`);
                console.log(`   🌐 IP: ${log.ip_address}`);
                console.log('   ─────────────────────────────────────────────');
            });

            // Check if our test messages appear in the logs
            const testLogs = logsResponse.logs.filter(log => 
                log.user_prompt.includes('Test message from') || 
                log.context === 'source_test'
            );

            if (testLogs.length > 0) {
                console.log('\n🎯 Test Messages Found in Logs:');
                testLogs.forEach(log => {
                    console.log(`✅ Source: ${log.source}, Prompt: ${log.user_prompt}`);
                });
            } else {
                console.log('\n⚠️  No test messages found in recent logs (may need to wait longer)');
            }

        } else {
            console.log('❌ Failed to retrieve logs:', logsResponse);
        }

        console.log('\n🏁 Source detection test completed!');
        console.log('\nThe source column is now tracking:');
        console.log('• lovable - Requests from Lovable.dev');
        console.log('• turboscores - Requests from TurboScores');  
        console.log('• qount - Requests from Qount');
        console.log('• api_direct_curl - Direct curl requests');
        console.log('• api_direct_postman - Postman requests');
        console.log('• touchline_app - Main touchline app');
        console.log('• localhost_dev - Development requests');
        console.log('• external_[domain] - Other external sources');
        console.log('• NA - Unknown/undetectable sources');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the tests
runSourceTests();
