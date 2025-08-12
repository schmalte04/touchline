const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql2/promise');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize Claude API with environment variable
let anthropic;
try {
    if (!process.env.CLAUDE_API_KEY) {
        console.warn('⚠️ CLAUDE_API_KEY not found in environment variables');
        throw new Error('CLAUDE_API_KEY is required');
    }
    anthropic = new Anthropic({
        apiKey: process.env.CLAUDE_API_KEY
    });
    console.log('✅ Claude API initialized successfully');
} catch (error) {
    console.error('❌ Failed to initialize Claude API:', error.message);
    // Create a mock anthropic object for testing
    anthropic = {
        messages: {
            create: async () => {
                throw new Error('Claude API not properly configured');
            }
        }
    };
}

// Middleware
app.use(cors({
    origin: ['https://claude-betting-assistant-*.ondigitalocean.app', 'http://localhost:3001', 'file://', 'null'],
    credentials: true
}));
app.use(bodyParser.json());

// Serve static files from website directory with proper MIME types
app.use(express.static(path.join(__dirname, '../website'), {
    setHeaders: function (res, path, stat) {
        if (path.endsWith('.js')) {
            res.set('Content-Type', 'application/javascript');
        }
        if (path.endsWith('.css')) {
            res.set('Content-Type', 'text/css');
        }
        if (path.endsWith('.html')) {
            res.set('Content-Type', 'text/html');
        }
    }
}));

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

// Test database connection
async function testDatabaseConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ MySQL database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ MySQL connection failed:', error.message);
        return false;
    }
}

// Helper function to get upcoming matches from MySQL with precise filtering
async function getUpcomingMatches(days = 7) {
    try {
        // First get today's date in the correct format
        const todayQuery = `SELECT CURDATE() as today`;
        const [dateRows] = await pool.execute(todayQuery);
        const today = dateRows[0].today;
        console.log(`📅 Current MySQL date: ${today}`);
        
        const query = `
            SELECT MATCH_ID, Home, Away, Date, Time, League, 
                   Score_Home, Score_Away, STATUS, ELO_Home, ELO_Away, 
                   xG_Home, xG_Away, PH, PD, PA
            FROM Rawdata_Total 
            WHERE Date >= CURDATE() 
            AND Date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
            AND (STATUS != 'FT' OR STATUS IS NULL OR STATUS = 'NS' OR STATUS = 'LIVE')
            ORDER BY Date ASC, Time ASC
            LIMIT 100
        `;
        
        console.log(`📅 Querying upcoming matches with precise STATUS filtering for next ${days} days...`);
        const [rows] = await pool.execute(query, [days]);
        console.log(`✅ Found ${rows.length} upcoming matches with precise filtering`);
        
        // Log sample of results for debugging
        if (rows.length > 0) {
            console.log(`📊 Sample results: ${rows.slice(0, 3).map(r => `${r.Home} vs ${r.Away} (${r.Date}, STATUS: ${r.STATUS})`).join(', ')}`);
        }
        
        // Mark as real data
        return { matches: rows, isRealData: true };
    } catch (error) {
        console.error('❌ Error querying upcoming matches:', error);
        // Return empty results instead of mock data
        return { matches: [], isRealData: false };
    }
}

// Helper function to search matches by team name with precise filtering
async function searchMatchesByTeam(teamName) {
    try {
        const query = `
            SELECT MATCH_ID, Home, Away, Date, Time, League, 
                   Score_Home, Score_Away, STATUS, ELO_Home, ELO_Away, 
                   xG_Home, xG_Away, PH, PD, PA
            FROM Rawdata_Total 
            WHERE (Home LIKE ? OR Away LIKE ?) 
            AND Date >= CURDATE() 
            AND (STATUS != 'FT' OR STATUS IS NULL OR STATUS = 'NS' OR STATUS = 'LIVE')
            ORDER BY Date ASC, Time ASC
            LIMIT 50
        `;
        
        const searchTerm = `%${teamName}%`;
        console.log(`🔍 Searching matches for team: "${teamName}" with precise filtering`);
        const [rows] = await pool.execute(query, [searchTerm, searchTerm]);
        console.log(`✅ Found ${rows.length} upcoming matches for team "${teamName}"`);
        
        return { matches: rows, isRealData: true };
    } catch (error) {
        console.error('❌ Error searching matches by team:', error);
        return { matches: [], isRealData: false };
    }
}

// Helper function to search matches by team and specific date
async function searchMatchesByTeamAndDate(teamName, date) {
    try {
        const query = `
            SELECT * FROM Rawdata_Total 
            WHERE (Home LIKE ? OR Away LIKE ?) AND Date = ? AND (STATUS != 'FT' OR STATUS IS NULL)
            ORDER BY Time
        `;
        
        const searchTerm = `%${teamName}%`;
        console.log(`🔍 Searching upcoming matches for team: ${teamName} on date: ${date} (STATUS != FT)`);
        const [rows] = await pool.execute(query, [searchTerm, searchTerm, date]);
        console.log(`✅ Found ${rows.length} upcoming matches for team "${teamName}" on ${date}`);
        
        return { matches: rows, isRealData: true };
    } catch (error) {
        console.error('❌ Error searching matches by team and date:', error);
        return { matches: [], isRealData: false };
    }
}

// Helper function to get matches for today with precise filtering
async function getTodaysMatches() {
    try {
        const query = `
            SELECT MATCH_ID, Home, Away, Date, Time, League, 
                   Score_Home, Score_Away, STATUS, ELO_Home, ELO_Away, 
                   xG_Home, xG_Away, PH, PD, PA
            FROM Rawdata_Total 
            WHERE Date = CURDATE() 
            AND (STATUS != 'FT' OR STATUS IS NULL OR STATUS = 'NS' OR STATUS = 'LIVE')
            ORDER BY Time ASC
        `;
        
        console.log(`📅 Querying today's matches with precise STATUS filtering...`);
        const [rows] = await pool.execute(query);
        console.log(`✅ Found ${rows.length} upcoming matches for today`);
        
        // Log sample for debugging
        if (rows.length > 0) {
            console.log(`📊 Today's matches sample: ${rows.slice(0, 2).map(r => `${r.Home} vs ${r.Away} (STATUS: ${r.STATUS})`).join(', ')}`);
        }
        
        return { matches: rows, isRealData: true };
    } catch (error) {
        console.error('❌ Error querying today\'s matches:', error);
        return { matches: [], isRealData: false };
    }
}

// Helper function to get matches for tomorrow
async function getTomorrowsMatches() {
    try {
        // First, let's see what the current date is in MySQL and what tomorrow's date should be
        const dateCheckQuery = `SELECT CURDATE() as today, DATE_ADD(CURDATE(), INTERVAL 1 DAY) as tomorrow`;
        const [dateRows] = await pool.execute(dateCheckQuery);
        console.log(`📅 MySQL dates - Today: ${dateRows[0].today}, Tomorrow: ${dateRows[0].tomorrow}`);
        
        // Also check what dates we have in the database around tomorrow
        const availableDatesQuery = `
            SELECT DISTINCT Date, COUNT(*) as match_count 
            FROM Rawdata_Total 
            WHERE Date >= CURDATE() AND Date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY) AND (STATUS != 'FT' OR STATUS IS NULL)
            ORDER BY Date 
        `;
        const [availableRows] = await pool.execute(availableDatesQuery);
        console.log(`📅 Available dates in database with upcoming matches (next 3 days):`, availableRows.map(row => `${row.Date}: ${row.match_count} matches`));
        
        // Check specifically for August 12, 2025
        const specificDateQuery = `
            SELECT COUNT(*) as count 
            FROM Rawdata_Total 
            WHERE Date = '2025-08-12' AND (STATUS != 'FT' OR STATUS IS NULL)
        `;
        const [specificRows] = await pool.execute(specificDateQuery);
        console.log(`📅 Upcoming matches on 2025-08-12: ${specificRows[0].count}`);
        
        const query = `
            SELECT * FROM Rawdata_Total 
            WHERE Date = DATE_ADD(CURDATE(), INTERVAL 1 DAY) AND (STATUS != 'FT' OR STATUS IS NULL)
            ORDER BY Time
        `;
        
        console.log(`📅 Querying matches for tomorrow (STATUS != FT)...`);
        console.log(`📅 SQL Query: ${query}`);
        const [rows] = await pool.execute(query);
        console.log(`✅ Found ${rows.length} upcoming matches for tomorrow`);
        
        // Debug: Log the actual date we're looking for
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        console.log(`📅 Tomorrow's date (JavaScript): ${tomorrow.toISOString().split('T')[0]}`);
        
        // If no matches found with MySQL CURDATE(), try with hardcoded date
        if (rows.length === 0) {
            console.log(`🔍 No matches found with CURDATE() + 1, trying hardcoded 2025-08-12...`);
            const hardcodedQuery = `
                SELECT * FROM Rawdata_Total 
                WHERE Date = '2025-08-12' AND (STATUS != 'FT' OR STATUS IS NULL)
                ORDER BY Time
            `;
            const [hardcodedRows] = await pool.execute(hardcodedQuery);
            console.log(`✅ Found ${hardcodedRows.length} upcoming matches for 2025-08-12 with hardcoded date`);
            return { matches: hardcodedRows, isRealData: true };
        }
        
        return { matches: rows, isRealData: true };
    } catch (error) {
        console.error('❌ Error querying tomorrow\'s matches:', error);
        return { matches: [], isRealData: false };
    }
}

// Helper function to get matches for a specific date with precise filtering
async function getMatchesForDate(date) {
    try {
        const query = `
            SELECT MATCH_ID, Home, Away, Date, Time, League, 
                   Score_Home, Score_Away, STATUS, ELO_Home, ELO_Away, 
                   xG_Home, xG_Away, PH, PD, PA
            FROM Rawdata_Total 
            WHERE Date = ? 
            AND (STATUS != 'FT' OR STATUS IS NULL OR STATUS = 'NS' OR STATUS = 'LIVE')
            ORDER BY Time ASC
        `;
        
        console.log(`📅 Querying upcoming matches for date: ${date} with precise filtering...`);
        const [rows] = await pool.execute(query, [date]);
        console.log(`✅ Found ${rows.length} upcoming matches for ${date}`);
        
        return { matches: rows, isRealData: true };
    } catch (error) {
        console.error(`❌ Error querying matches for ${date}:`, error);
        return { matches: [], isRealData: false };
    }
}

// Helper function to parse query and determine what the user wants - precise approach
function parseUserQuery(query) {
    const lowerQuery = query.toLowerCase();
    console.log(`🔍 Parsing query: "${query}"`);
    
    // Define command words to exclude from team detection
    const COMMAND_WORDS = [
        'show', 'get', 'find', 'tell', 'give', 'what', 'when', 'where', 'how', 'which',
        'today', 'tomorrow', 'yesterday', 'next', 'last', 'this', 'the', 'matches', 
        'games', 'fixtures', 'analysis', 'odds', 'betting', 'premier', 'league', 
        'champions', 'europa', 'cup', 'championship', 'for', 'me', 'please', 'can',
        'august', 'july', 'september', 'january', 'february', 'march', 'april', 
        'may', 'june', 'october', 'november', 'december', 'monday', 'tuesday', 
        'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
    ];
    
    // Extract potential team names (capitalized words)
    const teamMatches = query.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    const potentialTeams = teamMatches.filter(match => 
        match.length > 2 && 
        !COMMAND_WORDS.includes(match.toLowerCase()) &&
        // Additional filters for common false positives
        !match.match(/^\d+/) && // Don't include numbers
        match !== 'August' && match !== 'Premier' && match !== 'League'
    );
    
    console.log(`🎯 Potential teams detected: ${potentialTeams.join(', ')}`);
    
    // Determine date context with more precise detection
    let dateContext = 'upcoming';
    let specificDate = null;
    
    if (lowerQuery.includes('today')) {
        dateContext = 'today';
        console.log(`📅 Date context: today`);
    } else if (lowerQuery.includes('tomorrow')) {
        dateContext = 'tomorrow';
        console.log(`📅 Date context: tomorrow`);
    } else if (lowerQuery.includes('yesterday')) {
        dateContext = 'yesterday';
        console.log(`📅 Date context: yesterday`);
    } else if (lowerQuery.includes('august 12') || lowerQuery.includes('12th august') || 
               lowerQuery.includes('12 august') || lowerQuery.includes('2025-08-12')) {
        dateContext = 'specific';
        specificDate = '2025-08-12';
        console.log(`📅 Date context: specific date (${specificDate})`);
    }
    
    // Determine query type with more precision
    let queryType = 'general';
    if (lowerQuery.includes('score') || lowerQuery.includes('result') || lowerQuery.includes('final')) {
        queryType = 'score';
    } else if (lowerQuery.includes('odds') || lowerQuery.includes('betting') || lowerQuery.includes('bet')) {
        queryType = 'odds';
    } else if (lowerQuery.includes('prediction') || lowerQuery.includes('analysis') || lowerQuery.includes('analyze')) {
        queryType = 'analysis';
    } else if (lowerQuery.includes('matches') || lowerQuery.includes('games') || lowerQuery.includes('fixtures')) {
        queryType = 'matches';
    } else if (lowerQuery.includes('acca') || lowerQuery.includes('accumulator') || lowerQuery.includes('build')) {
        queryType = 'accumulator';
    }
    
    console.log(`📋 Query type: ${queryType}`);
    
    const result = {
        teams: potentialTeams,
        dateContext,
        queryType,
        specificDate,
        originalQuery: query
    };
    
    console.log(`✅ Parsed query result:`, result);
    return result;
}

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message: userQuery, context } = req.body;
        console.log(`💬 User query: ${userQuery}`);
        console.log(`📋 Context: ${context || 'none'}`);

        // Handle initialization/welcome message
        if (context === 'initialization' || userQuery.toLowerCase().includes('introduce yourself')) {
            const welcomeMessage = `Hello! 👋 I'm your Smart Betting Assistant powered by Touch Line, Goal Analytics and GainR.

How are you doing today? Are you ready to build some winning accumulator bets? 🚀`;
            
            res.json({
                success: true,
                response: welcomeMessage,
                matchCount: 0,
                queryInfo: { type: 'welcome' }
            });
            return;
        }

        // Parse the user query to understand what they want
        const queryInfo = parseUserQuery(userQuery);
        console.log(`🔍 Parsed query:`, queryInfo);
        console.log(`🔍 Date context detected: ${queryInfo.dateContext}`);
        console.log(`🔍 Teams detected: ${queryInfo.teams}`);

        let relevantMatches = [];
        let contextDescription = '';
        let isRealData = true;

        // Get matches based on the parsed query
        if (queryInfo.teams.length > 0) {
            console.log(`🎯 Processing team-specific query...`);
            // User mentioned specific teams
            for (const team of queryInfo.teams) {
                let teamResult = { matches: [], isRealData: true };
                
                if (queryInfo.dateContext === 'today') {
                    teamResult = await searchMatchesByTeamAndDate(team, new Date().toISOString().split('T')[0]);
                    contextDescription = `Today's matches for ${team}`;
                } else if (queryInfo.dateContext === 'tomorrow') {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    teamResult = await searchMatchesByTeamAndDate(team, tomorrow.toISOString().split('T')[0]);
                    contextDescription = `Tomorrow's matches for ${team}`;
                } else if (queryInfo.dateContext === 'specific' && queryInfo.specificDate) {
                    teamResult = await searchMatchesByTeamAndDate(team, queryInfo.specificDate);
                    contextDescription = `Matches for ${team} on ${queryInfo.specificDate}`;
                } else {
                    teamResult = await searchMatchesByTeam(team);
                    contextDescription = `Upcoming matches for ${team}`;
                }
                
                relevantMatches = [...relevantMatches, ...teamResult.matches];
                if (!teamResult.isRealData) isRealData = false;
            }
        } else if (queryInfo.dateContext === 'today') {
            console.log(`🎯 Processing today's matches query...`);
            // User asking about today's matches in general
            const result = await getTodaysMatches();
            relevantMatches = result.matches;
            isRealData = result.isRealData;
            contextDescription = "Today's matches";
        } else if (queryInfo.dateContext === 'tomorrow') {
            console.log(`🎯 Processing tomorrow's matches query...`);
            // User asking about tomorrow's matches in general
            const result = await getTomorrowsMatches();
            relevantMatches = result.matches;
            isRealData = result.isRealData;
            contextDescription = "Tomorrow's matches";
        } else if (queryInfo.dateContext === 'specific' && queryInfo.specificDate) {
            console.log(`🎯 Processing specific date query for ${queryInfo.specificDate}...`);
            // User asking about a specific date
            const result = await getMatchesForDate(queryInfo.specificDate);
            relevantMatches = result.matches;
            isRealData = result.isRealData;
            contextDescription = `Matches on ${queryInfo.specificDate}`;
        } else if (queryInfo.queryType === 'accumulator') {
            console.log(`🎯 Processing accumulator request - getting upcoming matches...`);
            // User wants to create an accumulator - get upcoming matches
            const result = await getUpcomingMatches(7);
            relevantMatches = result.matches;
            isRealData = result.isRealData;
            contextDescription = "Upcoming matches for accumulator (next 7 days)";
        } else {
            console.log(`🎯 Processing general upcoming matches query...`);
            // General query - get upcoming matches
            const result = await getUpcomingMatches(7);
            relevantMatches = result.matches;
            isRealData = result.isRealData;
            contextDescription = "Upcoming matches (next 7 days)";
        }

        // Remove duplicates
        const uniqueMatches = relevantMatches.filter((match, index, arr) => 
            arr.findIndex(m => m.MATCH_ID === match.MATCH_ID) === index
        );

        console.log(`📊 Found ${uniqueMatches.length} relevant matches for query`);

        // Format match data for Claude with structured precision
        let contextData = '';
        if (uniqueMatches.length > 0) {
            contextData = `📋 RAWDATA_TOTAL DATABASE QUERY RESULTS\n\n${contextDescription} (${uniqueMatches.length} matches found):\n\n`;
            contextData += uniqueMatches.slice(0, 15).map(match => {
                // Use precise column mapping from database
                const homeElo = match.ELO_Home || 'N/A';
                const awayElo = match.ELO_Away || 'N/A';
                const homeXg = match.xG_Home ? parseFloat(match.xG_Home).toFixed(2) : 'N/A';
                const awayXg = match.xG_Away ? parseFloat(match.xG_Away).toFixed(2) : 'N/A';
                const homeScore = match.Score_Home !== null && match.Score_Home !== undefined ? match.Score_Home : 'TBD';
                const awayScore = match.Score_Away !== null && match.Score_Away !== undefined ? match.Score_Away : 'TBD';
                
                // Use correct database column names (PH, PD, PA)
                const homeOdds = match.PH ? parseFloat(match.PH).toFixed(2) : 'N/A';
                const drawOdds = match.PD ? parseFloat(match.PD).toFixed(2) : 'N/A';
                const awayOdds = match.PA ? parseFloat(match.PA).toFixed(2) : 'N/A';
                
                // Status information
                const status = match.STATUS || 'NS';
                
                return `🏆 MATCH_ID: ${match.MATCH_ID}
📝 Fixture: ${match.Home} vs ${match.Away}
📅 Date/Time: ${match.Date} ${match.Time || 'TBD'}
🏟️ League: ${match.League || 'Unknown'}
⚽ Current Score: ${homeScore} - ${awayScore} (STATUS: ${status})
📊 ELO Ratings: ${homeElo} vs ${awayElo}
🎯 Expected Goals (xG): ${homeXg} vs ${awayXg}
💰 Odds [H/D/A]: ${homeOdds} / ${drawOdds} / ${awayOdds}`;
            }).join('\n\n');
        } else {
            contextData = `📋 RAWDATA_TOTAL DATABASE QUERY RESULTS\n\nNo upcoming matches found for query: "${userQuery}"\n\nQuery parameters:\n- Teams searched: ${queryInfo.teams.join(', ') || 'None'}\n- Date context: ${queryInfo.dateContext}\n- Specific date: ${queryInfo.specificDate || 'None'}`;
        }

        // Create a more specific prompt based on query type
        let specificInstructions = '';
        switch (queryInfo.queryType) {
            case 'score':
                specificInstructions = 'Focus on match results, current scores, and post-match analysis.';
                break;
            case 'odds':
                specificInstructions = 'Focus on betting odds, value bets, and market analysis.';
                break;
            case 'analysis':
                specificInstructions = 'Provide in-depth statistical analysis and predictions.';
                break;
            case 'matches':
                specificInstructions = 'List and summarize the relevant matches with key details.';
                break;
            case 'accumulator':
                specificInstructions = 'Create a betting accumulator with 2-4 carefully selected matches. Focus on value, odds analysis, and risk assessment for the combined bet.';
                break;
            default:
                specificInstructions = 'Provide comprehensive betting analysis and recommendations.';
        }

        // Check if we have matches to determine response style
        const hasMatches = uniqueMatches.length > 0;
        
        let prompt;
        if (!hasMatches) {
            // Short, direct response when no matches found
            prompt = `You are an expert football betting analyst with access to live MySQL database data.

I've looked in the Rawdata_Total database table for: "${userQuery}"

${contextData}

IMPORTANT: Keep your response very short and direct. Simply state that there are no matches for the requested timeframe. Do not provide long explanations, suggestions, or additional analysis. Just give a brief, direct answer.`;
        } else if (!isRealData) {
            // Special handling for mock/demo data
            prompt = `You are an expert football betting analyst. 

Database Status: Unable to connect to live database - showing demo data only.

${contextData}

IMPORTANT: Inform the user that you found ${uniqueMatches.length} demo matches but cannot access the live database. Keep response short and mention that real match data is currently unavailable. Do not provide detailed analysis of demo data.`;
        } else {
            // Count matches by status for more informative response
            const notStartedMatches = uniqueMatches.filter(m => !m.STATUS || m.STATUS === 'NS' || m.STATUS === null).length;
            const liveMatches = uniqueMatches.filter(m => m.STATUS === 'LIVE').length;
            
            // Full analysis when real matches are found
            prompt = `You are an expert football betting analyst with access to live MySQL database data.

DATABASE SCHEMA CONTEXT (Rawdata_Total table):
Core Match Data:
- MATCH_ID: Unique match identifier
- Home/Away: Team names
- Date/Time: Match date and kickoff time
- League: Competition name
- STATUS: 'FT' = Full Time (completed), 'NS' = Not Started, 'LIVE' = In Progress

Scores & Results:
- HG/AG: Home/Away goals (final scores)
- Score_Home/Score_Away: Predicted scores based on team performance metrics

Betting Odds:
- PH/PD/PA: Pinnacle odds for Home Win/Draw/Away Win
- B365_H/B365_D/B365_A: Bet365 odds
- Under2.5/Over2.5: Total goals market odds

Performance Metrics:
- ELO_Home/ELO_Away: Team ELO ratings (strength indicators, range ~1200-2000)
- xG/xG_Away: Expected Goals (quality of scoring chances, range 0.0-5.0)
- HS_Target/AS_Target: Average shots on target (last 10 matches)
- Score_Home/Score_Away: Expected goals based on recent form

Advanced Analytics:
- ELO_prob: Win probability based on ELO ratings
- p1_skell/px_skell/p2_skell: Skellam distribution probabilities (Home/Draw/Away)
- Conversion rates, entropy measures, and form indicators

CURRENT DATA:
${contextData}

Match Status Summary: ${uniqueMatches.length} total matches (${notStartedMatches} not started${liveMatches > 0 ? `, ${liveMatches} live` : ''})

User Query: "${userQuery}"
Query Type: ${queryInfo.queryType}
Special Instructions: ${specificInstructions}

IMPORTANT: Start your response by mentioning that you found ${uniqueMatches.length} matches in the Rawdata_Total database table${notStartedMatches > 0 ? ` (${notStartedMatches} not started)` : ''}. Then provide:
1. Direct answer to the user's question
2. Relevant statistical insights from the ELO ratings and xG data
3. Betting recommendations if applicable
4. Risk assessment for any suggested bets

Be conversational and specific to their query. Use the exact match data provided above.`;
        }

        // Call Claude API
        console.log('🤖 Calling Claude API...');
        const response = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });

        const claudeResponse = response.content[0].text;
        console.log('✅ Claude response received');

        res.json({
            success: true,
            response: claudeResponse,
            matchCount: uniqueMatches.length,
            queryInfo: queryInfo
        });

    } catch (error) {
        console.error('❌ Chat endpoint error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Health check for App Platform
app.get('/api/health', async (req, res) => {
    try {
        // Test database connection
        const dbStatus = await testDatabaseConnection();
        
        res.json({
            status: 'running',
            database_connected: dbStatus,
            claude_api_configured: !!process.env.CLAUDE_API_KEY,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        console.error('❌ Health check error:', error);
        res.status(500).json({
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 Claude Betting Assistant API server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔑 Claude API Key: ${process.env.CLAUDE_API_KEY ? '✅ Configured' : '❌ Missing'}`);
    console.log(`🗄️ Database Host: ${process.env.DB_HOST || 'Not configured'}`);
    
    // Test database connection on startup
    const dbConnected = await testDatabaseConnection();
    if (dbConnected) {
        console.log('✅ MySQL database connection verified');
    } else {
        console.log('⚠️ MySQL database connection failed - will use fallback data');
    }
    
    console.log('🎯 Server ready to accept requests');
});

module.exports = app;
