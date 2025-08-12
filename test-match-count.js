#!/usr/bin/env node

// Test script to verify match count on specific date
const mysql = require('mysql2/promise');
require('dotenv').config();

// MySQL Database Configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'football_data',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create MySQL connection pool
const pool = mysql.createPool(dbConfig);

// Enhanced helper function for flexible searching (copied from server.js)
async function searchMatchesFlexible(searchParams) {
    try {
        const { 
            team = null, 
            league = null, 
            date = null, 
            status = null,
            operator = 'contains',
            limit = 1000,  // Higher limit for testing
            includeFinished = false
        } = searchParams;

        let query = `
            SELECT MATCH_ID, Home, Away, Date, Time, League, 
                   Score_Home, Score_Away, STATUS, ELO_Home, ELO_Away, 
                   xG_Home, xG_Away, PH, PD, PA
            FROM Rawdata_Total 
            WHERE 1=1
        `;
        
        const params = [];
        const conditions = [];

        // Team search with different operators
        if (team) {
            let teamCondition;
            switch (operator) {
                case 'equals':
                    teamCondition = `(Home = ? OR Away = ?)`;
                    params.push(team, team);
                    break;
                case 'starts_with':
                    teamCondition = `(Home LIKE ? OR Away LIKE ?)`;
                    params.push(`${team}%`, `${team}%`);
                    break;
                case 'ends_with':
                    teamCondition = `(Home LIKE ? OR Away LIKE ?)`;
                    params.push(`%${team}`, `%${team}`);
                    break;
                case 'contains':
                default:
                    teamCondition = `(Home LIKE ? OR Away LIKE ?)`;
                    params.push(`%${team}%`, `%${team}%`);
            }
            conditions.push(teamCondition);
        }

        // League filter
        if (league) {
            conditions.push(`League LIKE ?`);
            params.push(`%${league}%`);
        }

        // Date filter
        if (date) {
            if (date === 'today') {
                conditions.push(`Date = CURDATE()`);
            } else if (date === 'tomorrow') {
                conditions.push(`Date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)`);
            } else if (date === 'upcoming') {
                conditions.push(`Date >= CURDATE()`);
            } else {
                conditions.push(`Date = ?`);
                params.push(date);
            }
        }

        // Status filter - unless user wants finished matches
        if (!includeFinished) {
            conditions.push(`(STATUS != 'FT' OR STATUS IS NULL OR STATUS = 'NS' OR STATUS = 'LIVE')`);
        }

        if (status) {
            conditions.push(`STATUS = ?`);
            params.push(status);
        }

        // Combine all conditions
        if (conditions.length > 0) {
            query += ` AND ${conditions.join(' AND ')}`;
        }

        query += ` ORDER BY Date ASC, Time ASC LIMIT ?`;
        params.push(limit);

        console.log(`🔍 Test query: ${query}`);
        console.log(`📋 Parameters:`, params);

        const [rows] = await pool.execute(query, params);
        
        return { 
            matches: rows, 
            isRealData: true, 
            query: query, 
            params: params,
            searchParams: searchParams 
        };
    } catch (error) {
        console.error('❌ Error in test query:', error);
        return { matches: [], isRealData: false };
    }
}

// Test function to check match count on 2025-08-15
async function testMatchCount() {
    console.log('🧪 Starting test: Match count on 2025-08-15');
    console.log('📅 Expected: 19 matches');
    console.log('=' .repeat(50));

    try {
        // Test database connection
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();

        // Search for matches on 2025-08-15 (include all statuses for complete count)
        const searchParams = {
            date: '2025-08-15',
            includeFinished: true,  // Include all matches regardless of status
            limit: 1000
        };

        console.log('🔍 Searching for matches on 2025-08-15...');
        const result = await searchMatchesFlexible(searchParams);

        if (!result.isRealData) {
            console.error('❌ Failed to get real data from database');
            process.exit(1);
        }

        const actualCount = result.matches.length;
        const expectedCount = 19;

        console.log('\n📊 RESULTS:');
        console.log(`   Actual count: ${actualCount}`);
        console.log(`   Expected count: ${expectedCount}`);

        if (actualCount === expectedCount) {
            console.log('✅ TEST PASSED: Match count is correct!');
            
            // Show sample matches for verification
            console.log('\n📋 Sample matches found:');
            result.matches.slice(0, 5).forEach((match, index) => {
                console.log(`   ${index + 1}. ${match.Home} vs ${match.Away} (${match.League || 'Unknown League'}) - STATUS: ${match.STATUS || 'NS'}`);
            });
            
            if (result.matches.length > 5) {
                console.log(`   ... and ${result.matches.length - 5} more matches`);
            }

            // Show status breakdown
            const statusBreakdown = {};
            result.matches.forEach(match => {
                const status = match.STATUS || 'NS';
                statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
            });
            
            console.log('\n📈 Status breakdown:');
            Object.entries(statusBreakdown).forEach(([status, count]) => {
                console.log(`   ${status}: ${count} matches`);
            });

        } else {
            console.log('❌ TEST FAILED: Match count mismatch!');
            console.log(`   Difference: ${actualCount - expectedCount} matches`);
            
            if (actualCount > 0) {
                console.log('\n📋 Found matches:');
                result.matches.slice(0, 10).forEach((match, index) => {
                    console.log(`   ${index + 1}. ${match.Home} vs ${match.Away} (${match.League || 'Unknown'}) - STATUS: ${match.STATUS || 'NS'}`);
                });
            }
        }

        // Additional verification query - raw count
        console.log('\n🔍 Verification with raw count query...');
        const countQuery = `SELECT COUNT(*) as total FROM Rawdata_Total WHERE Date = ?`;
        const [countRows] = await pool.execute(countQuery, ['2025-08-15']);
        const rawCount = countRows[0].total;
        
        console.log(`📊 Raw database count (all statuses): ${rawCount}`);
        
        if (rawCount !== actualCount) {
            console.log('⚠️  Note: Filtered count differs from raw count due to status filtering');
        }

        console.log('\n' + '='.repeat(50));
        console.log(actualCount === expectedCount ? '✅ OVERALL TEST: PASSED' : '❌ OVERALL TEST: FAILED');

        await pool.end();
        process.exit(actualCount === expectedCount ? 0 : 1);

    } catch (error) {
        console.error('❌ Test failed with error:', error);
        await pool.end();
        process.exit(1);
    }
}

// Run the test
testMatchCount();
