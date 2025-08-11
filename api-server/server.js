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
        const { message: userQuery } = req.body;
        console.log(`💬 User query: ${userQuery}`);

        // Get data from MySQL
        const allMatches = await getUpcomingMatches(7);
        
        // Check for specific team searches
        let specificMatches = [];
        const teamKeywords = userQuery.toLowerCase().match(/\b([a-z\s]{3,20})\b/g) || [];
        
        for (const keyword of teamKeywords) {
            if (keyword.length > 3) {
                const teamMatches = await searchMatchesByTeam(keyword);
                if (teamMatches.length > 0) {
                    specificMatches = [...specificMatches, ...teamMatches];
                }
            }
        }

        // Use specific matches if found, otherwise use all upcoming matches
        const relevantMatches = specificMatches.length > 0 ? specificMatches : allMatches;
        
        // Format match data for Claude
        let contextData = '';
        if (relevantMatches.length > 0) {
            contextData = relevantMatches.slice(0, 10).map(match => 
                `Match ${match.MATCH_ID}: ${match.Home} vs ${match.Away} | ${match.Date} ${match.Time} | ${match.League} | ELO: ${match.ELO_Home || 'N/A'} vs ${match.ELO_Away || 'N/A'} | xG: ${match.xG_Home || 'N/A'} vs ${match.xG_Away || 'N/A'}`
            ).join('\n');
        } else {
            contextData = 'No matches found in the database.';
        }

        // Create prompt for Claude
        const prompt = `You are an expert football betting analyst with access to live MySQL database data. 

${contextData}

User Query: "${userQuery}"

Please provide:
1. Statistical analysis using the ELO ratings, xG data, and odds
2. Value betting opportunities based on data discrepancies  
3. Risk assessment and confidence levels
4. Specific recommendations with reasoning
5. Market value identification

Current database contains ${allMatches.length} matches. Answer the user's query with detailed analysis.

Be conversational, insightful, and focus on actionable betting advice. Use the real data provided above.`;

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
            matchCount: relevantMatches.length
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
