const https = require('https');

// Test function to send message with minimal-chat-widget source
function testCompanyQuery(message) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            message: message,
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
                'User-Agent': 'Mozilla/5.0 (Test Company Response)'
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

// Test function to send message from different source (should not get company response)
function testNonCompanyQuery(message) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            message: message,
            context: 'regular_chat'
        });

        const options = {
            hostname: 'shark-app-robkv.ondigitalocean.app',
            port: 443,
            path: '/api/chat',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length,
                'User-Agent': 'curl/7.68.0'
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

async function testCompanyResponses() {
    console.log('🧪 Testing Company-Specific Responses...\n');

    const testCases = [
        {
            name: 'ROI Question (from minimal widget)',
            message: 'What was the ROI over the last 3 months?',
            source: 'minimal-chat-widget',
            shouldGetCompanyResponse: true
        },
        {
            name: 'ROI Question (from different source)',
            message: 'What was the ROI over the last 3 months?',
            source: 'api_direct',
            shouldGetCompanyResponse: false
        },
        {
            name: 'Performance Question (from minimal widget)',
            message: 'What are your results?',
            source: 'minimal-chat-widget',
            shouldGetCompanyResponse: true
        },
        {
            name: 'Regular Football Question (from minimal widget)',
            message: 'What matches are playing today?',
            source: 'minimal-chat-widget',
            shouldGetCompanyResponse: false
        }
    ];

    try {
        for (const testCase of testCases) {
            console.log(`📤 Testing: ${testCase.name}`);
            console.log(`💬 Message: "${testCase.message}"`);
            console.log(`📍 Source: ${testCase.source}`);
            
            let response;
            if (testCase.source === 'minimal-chat-widget') {
                response = await testCompanyQuery(testCase.message);
            } else {
                response = await testNonCompanyQuery(testCase.message);
            }
            
            if (response.success) {
                const isCompanyResponse = response.queryInfo?.type === 'company_response';
                const responsePreview = response.response.substring(0, 100) + (response.response.length > 100 ? '...' : '');
                
                console.log(`📝 Response Type: ${response.queryInfo?.type || 'normal_chat'}`);
                console.log(`💬 Response: "${responsePreview}"`);
                
                if (testCase.shouldGetCompanyResponse) {
                    if (isCompanyResponse) {
                        console.log('✅ CORRECT: Got company-specific response as expected');
                    } else {
                        console.log('❌ WRONG: Expected company response but got normal chat response');
                    }
                } else {
                    if (isCompanyResponse) {
                        console.log('❌ WRONG: Got company response when it should be normal chat');
                    } else {
                        console.log('✅ CORRECT: Got normal chat response as expected');
                    }
                }
            } else {
                console.log(`❌ API Error: ${response.error}`);
            }
            
            console.log('─────────────────────────────────────────────────────\n');
            
            // Wait between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('🏁 Company Response Testing Complete!\n');
        
        console.log('📋 Summary:');
        console.log('• Company responses should only work for minimal-chat-widget source');
        console.log('• ROI/performance questions should trigger company responses');
        console.log('• Regular football questions should use normal chat flow');
        console.log('• Other sources should never get company responses');
        
        console.log('\n🔧 Management:');
        console.log('• Visit /admin/company-responses to manage responses');
        console.log('• Add/remove company-specific Q&As');
        console.log('• Responses are stored in memory (restart to reset)');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the tests
testCompanyResponses();
