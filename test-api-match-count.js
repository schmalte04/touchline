#!/usr/bin/env node

// Test script to verify match count via API endpoint
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:8080';

// Test function to check match count on 2025-08-15
async function testMatchCountViaAPI() {
    console.log('🧪 Starting test: Match count on 2025-08-15 via API');
    console.log('📅 Expected: 19 matches');
    console.log('=' .repeat(50));

    try {
        // First check if the server is running
        console.log('🔍 Checking if API server is running...');
        
        try {
            const healthResponse = await fetch(`${API_BASE_URL}/api/health`);
            const healthData = await healthResponse.json();
            console.log('✅ API server is running');
            console.log(`📊 Database connected: ${healthData.database_connected}`);
            
            if (!healthData.database_connected) {
                console.log('❌ Database is not connected. Please check your database configuration.');
                process.exit(1);
            }
        } catch (error) {
            console.log('❌ API server is not running. Please start it first with: npm start');
            console.log('   Or run: node api-server/server.js');
            process.exit(1);
        }

        // Test the chat endpoint with a query for matches on 2025-08-15
        console.log('\n🔍 Querying matches for 2025-08-15...');
        
        const testQuery = "Show me all matches on 2025-08-15";
        
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: testQuery,
                context: 'test'
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(`API returned error: ${data.error}`);
        }

        const actualCount = data.matchCount || 0;
        const expectedCount = 19;

        console.log('\n📊 RESULTS:');
        console.log(`   Query: "${testQuery}"`);
        console.log(`   Actual count: ${actualCount}`);
        console.log(`   Expected count: ${expectedCount}`);

        if (actualCount === expectedCount) {
            console.log('✅ TEST PASSED: Match count is correct!');
            console.log('\n📋 API Response:');
            console.log(data.response.substring(0, 200) + '...');
        } else {
            console.log('❌ TEST FAILED: Match count mismatch!');
            console.log(`   Difference: ${actualCount - expectedCount} matches`);
            console.log('\n📋 API Response:');
            console.log(data.response);
        }

        // Additional test with different query format
        console.log('\n🔍 Testing alternative query format...');
        const altQuery = "matches on 15th August 2025";
        
        const altResponse = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: altQuery,
                context: 'test'
            })
        });

        const altData = await altResponse.json();
        const altCount = altData.matchCount || 0;
        
        console.log(`   Alternative query: "${altQuery}"`);
        console.log(`   Count: ${altCount}`);
        
        if (altCount === expectedCount) {
            console.log('✅ Alternative query also passed!');
        } else {
            console.log('⚠️  Alternative query returned different count');
        }

        console.log('\n' + '='.repeat(50));
        console.log(actualCount === expectedCount ? '✅ OVERALL TEST: PASSED' : '❌ OVERALL TEST: FAILED');

        process.exit(actualCount === expectedCount ? 0 : 1);

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        process.exit(1);
    }
}

// Check if node-fetch is available, if not suggest installation
async function checkDependencies() {
    try {
        require('node-fetch');
        return true;
    } catch (error) {
        console.log('❌ node-fetch not found. Installing...');
        const { exec } = require('child_process');
        
        return new Promise((resolve, reject) => {
            exec('npm install node-fetch@2', (error, stdout, stderr) => {
                if (error) {
                    console.error('Failed to install node-fetch:', error);
                    reject(error);
                } else {
                    console.log('✅ node-fetch installed successfully');
                    resolve(true);
                }
            });
        });
    }
}

// Run the test
checkDependencies().then(() => {
    testMatchCountViaAPI();
}).catch((error) => {
    console.error('❌ Failed to set up dependencies:', error);
    process.exit(1);
});
