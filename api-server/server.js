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

// Helper function to get upcoming matches from MySQL
async function getUpcomingMatches(days = 7) {
    try {
        const query = `
            SELECT * FROM Rawdata_Total 
            WHERE Date >= CURDATE() AND Date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
            ORDER BY Date, Time
            LIMIT 100
        `;
        
        console.log(`📅 Querying upcoming matches for next ${days} days...`);
        const [rows] = await pool.execute(query, [days]);
        console.log(`✅ Found ${rows.length} upcoming matches`);
        
        return rows;
    } catch (error) {
        console.error('❌ Error querying upcoming matches:', error);
        return getMockMatchData();
    }
}

// Helper function to search matches by team name
async function searchMatchesByTeam(teamName) {
    try {
        const query = `
            SELECT * FROM Rawdata_Total 
            WHERE (Home LIKE ? OR Away LIKE ?) AND Date >= CURDATE()
            ORDER BY Date, Time
            LIMIT 50
        `;
        
        const searchTerm = `%${teamName}%`;
        console.log(`🔍 Searching matches for team: ${teamName}`);
        const [rows] = await pool.execute(query, [searchTerm, searchTerm]);
        console.log(`✅ Found ${rows.length} matches for team "${teamName}"`);
        
        return rows;
    } catch (error) {
        console.error('❌ Error searching matches by team:', error);
        return [];
    }
}

// Helper function to search matches by team and specific date
async function searchMatchesByTeamAndDate(teamName, date) {
    try {
        const query = `
            SELECT * FROM Rawdata_Total 
            WHERE (Home LIKE ? OR Away LIKE ?) AND Date = ?
            ORDER BY Time
        `;
        
        const searchTerm = `%${teamName}%`;
        console.log(`🔍 Searching matches for team: ${teamName} on date: ${date}`);
        const [rows] = await pool.execute(query, [searchTerm, searchTerm, date]);
        console.log(`✅ Found ${rows.length} matches for team "${teamName}" on ${date}`);
        
        return rows;
    } catch (error) {
        console.error('❌ Error searching matches by team and date:', error);
        return [];
    }
}

// Helper function to get matches for today
async function getTodaysMatches() {
    try {
        const query = `
            SELECT * FROM Rawdata_Total 
            WHERE Date = CURDATE()
            ORDER BY Time
        `;
        
        console.log(`📅 Querying matches for today...`);
        const [rows] = await pool.execute(query);
        console.log(`✅ Found ${rows.length} matches for today`);
        
        return rows;
    } catch (error) {
        console.error('❌ Error querying today\'s matches:', error);
        return [];
    }
}

// Helper function to get matches for tomorrow
async function getTomorrowsMatches() {
    try {
        // First, let's see what the current date is in MySQL and what tomorrow's date should be
        const dateCheckQuery = `SELECT CURDATE() as today, DATE_ADD(CURDATE(), INTERVAL 1 DAY) as tomorrow`;
        const [dateRows] = await pool.execute(dateCheckQuery);
        console.log(`📅 MySQL dates - Today: ${dateRows[0].today}, Tomorrow: ${dateRows[0].tomorrow}`);
        
        // Also check what dates we have in the database
        const availableDatesQuery = `
            SELECT DISTINCT Date, COUNT(*) as match_count 
            FROM Rawdata_Total 
            WHERE Date >= CURDATE() 
            ORDER BY Date 
            LIMIT 10
        `;
        const [availableRows] = await pool.execute(availableDatesQuery);
        console.log(`📅 Available dates in database:`, availableRows.map(row => `${row.Date}: ${row.match_count} matches`));
        
        const query = `
            SELECT * FROM Rawdata_Total 
            WHERE Date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
            ORDER BY Time
        `;
        
        console.log(`📅 Querying matches for tomorrow...`);
        console.log(`📅 SQL Query: ${query}`);
        const [rows] = await pool.execute(query);
        console.log(`✅ Found ${rows.length} matches for tomorrow`);
        
        // Debug: Log the actual date we're looking for
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        console.log(`📅 Tomorrow's date (JavaScript): ${tomorrow.toISOString().split('T')[0]}`);
        
        return rows;
    } catch (error) {
        console.error('❌ Error querying tomorrow\'s matches:', error);
        return [];
    }
}

// Helper function to parse query and determine what the user wants
function parseUserQuery(query) {
    const lowerQuery = query.toLowerCase();
    
    // Extract team names (look for capitalized words that could be team names)
    const teamMatches = query.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    const potentialTeams = teamMatches.filter(match => 
        match.length > 2 && 
        !['Today', 'Tomorrow', 'Yesterday', 'Next', 'Last', 'This', 'The'].includes(match)
    );
    
    // Determine date context
    let dateContext = 'upcoming';
    if (lowerQuery.includes('today')) {
        dateContext = 'today';
    } else if (lowerQuery.includes('tomorrow')) {
        dateContext = 'tomorrow';
    } else if (lowerQuery.includes('yesterday')) {
        dateContext = 'yesterday';
    }
    
    // Determine query type
    let queryType = 'general';
    if (lowerQuery.includes('score') || lowerQuery.includes('result')) {
        queryType = 'score';
    } else if (lowerQuery.includes('odds') || lowerQuery.includes('betting')) {
        queryType = 'odds';
    } else if (lowerQuery.includes('prediction') || lowerQuery.includes('analysis')) {
        queryType = 'analysis';
    } else if (lowerQuery.includes('matches') || lowerQuery.includes('games') || lowerQuery.includes('fixtures')) {
        queryType = 'matches';
    }
    
    return {
        teams: potentialTeams,
        dateContext,
        queryType,
        originalQuery: query
    };
}

// Fallback mock data if MySQL fails
function getMockMatchData() {
    return [
        {
            MATCH_ID: "19352951",
            Home: "Arsenal",
            Away: "Chelsea", 
            Date: "2025-08-12",
            Time: "15:00",
            League: "Premier League",
            ELO_Home: 1850,
            ELO_Away: 1820,
            xG_Home: 2.1,
            xG_Away: 1.8
        },
        {
            MATCH_ID: "19352952", 
            Home: "Manchester United",
            Away: "Liverpool",
            Date: "2025-08-12",
            Time: "17:30", 
            League: "Premier League",
            ELO_Home: 1830,
            ELO_Away: 1880,
            xG_Home: 1.9,
            xG_Away: 2.3
        }
    ];
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

        // Get matches based on the parsed query
        if (queryInfo.teams.length > 0) {
            console.log(`🎯 Processing team-specific query...`);
            // User mentioned specific teams
            for (const team of queryInfo.teams) {
                let teamMatches = [];
                
                if (queryInfo.dateContext === 'today') {
                    teamMatches = await searchMatchesByTeamAndDate(team, new Date().toISOString().split('T')[0]);
                    contextDescription = `Today's matches for ${team}`;
                } else if (queryInfo.dateContext === 'tomorrow') {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    teamMatches = await searchMatchesByTeamAndDate(team, tomorrow.toISOString().split('T')[0]);
                    contextDescription = `Tomorrow's matches for ${team}`;
                } else {
                    teamMatches = await searchMatchesByTeam(team);
                    contextDescription = `Upcoming matches for ${team}`;
                }
                
                relevantMatches = [...relevantMatches, ...teamMatches];
            }
        } else if (queryInfo.dateContext === 'today') {
            console.log(`🎯 Processing today's matches query...`);
            // User asking about today's matches in general
            relevantMatches = await getTodaysMatches();
            contextDescription = "Today's matches";
        } else if (queryInfo.dateContext === 'tomorrow') {
            console.log(`🎯 Processing tomorrow's matches query...`);
            // User asking about tomorrow's matches in general
            relevantMatches = await getTomorrowsMatches();
            contextDescription = "Tomorrow's matches";
        } else {
            console.log(`🎯 Processing general upcoming matches query...`);
            // General query - get upcoming matches
            relevantMatches = await getUpcomingMatches(7);
            contextDescription = "Upcoming matches (next 7 days)";
        }

        // Remove duplicates
        const uniqueMatches = relevantMatches.filter((match, index, arr) => 
            arr.findIndex(m => m.MATCH_ID === match.MATCH_ID) === index
        );

        console.log(`📊 Found ${uniqueMatches.length} relevant matches for query`);

        // Format match data for Claude with more detail
        let contextData = '';
        if (uniqueMatches.length > 0) {
            contextData = `${contextDescription} (${uniqueMatches.length} matches found):\n\n`;
            contextData += uniqueMatches.slice(0, 15).map(match => {
                const homeElo = match.ELO_Home || 'N/A';
                const awayElo = match.ELO_Away || 'N/A';
                const homeXg = match.xG_Home || 'N/A';
                const awayXg = match.xG_Away || 'N/A';
                const homeScore = match.Score_Home !== undefined ? match.Score_Home : 'TBD';
                const awayScore = match.Score_Away !== undefined ? match.Score_Away : 'TBD';
                
                return `🏆 Match ${match.MATCH_ID}: ${match.Home} vs ${match.Away}
📅 Date: ${match.Date} ${match.Time || ''}
🏟️ League: ${match.League || 'Unknown'}
⚽ Score: ${homeScore} - ${awayScore}
📊 ELO Ratings: ${homeElo} vs ${awayElo}
🎯 Expected Goals: ${homeXg} vs ${awayXg}
💰 Odds: ${match.Odds_Home || 'N/A'} / ${match.Odds_Draw || 'N/A'} / ${match.Odds_Away || 'N/A'}`;
            }).join('\n\n');
        } else {
            contextData = `No matches found for your query: "${userQuery}"`;
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
            default:
                specificInstructions = 'Provide comprehensive betting analysis and recommendations.';
        }

        const prompt = `You are an expert football betting analyst with access to live MySQL database data.

${contextData}

User Query: "${userQuery}"
Query Type: ${queryInfo.queryType}
Special Instructions: ${specificInstructions}

Based on the specific data above, please provide:
1. Direct answer to the user's question
2. Relevant statistical insights from the ELO ratings and xG data
3. Betting recommendations if applicable
4. Risk assessment for any suggested bets

Be conversational and specific to their query. Use the exact match data provided above.`;

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
