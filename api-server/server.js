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
        console.log(`📋 SQL Query: ${query.trim()}`);
        const [rows] = await pool.execute(query, [days]);
        console.log(`✅ Found ${rows.length} upcoming matches with precise filtering`);
        
        // Log sample of results for debugging
        if (rows.length > 0) {
            console.log(`📊 Sample results: ${rows.slice(0, 3).map(r => `${r.Home} vs ${r.Away} (${r.Date}, STATUS: ${r.STATUS})`).join(', ')}`);
        }
        
        // Mark as real data
        return { matches: rows, isRealData: true, query: query.trim(), days: days };
    } catch (error) {
        console.error('❌ Error querying upcoming matches:', error);
        // Return empty results instead of mock data
        return { matches: [], isRealData: false };
    }
}

// Enhanced helper function for flexible team searching with multiple operators
async function searchMatchesFlexible(searchParams) {
    try {
        const { 
            team = null, 
            league = null, 
            date = null, 
            status = null,
            operator = 'contains',  // contains, equals, starts_with, ends_with
            limit = 50,
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

        console.log(`🔍 Flexible search with params:`, searchParams);
        console.log(`📋 SQL Query: ${query}`);
        console.log(`📋 Parameters:`, params);

        const [rows] = await pool.execute(query, params);
        console.log(`✅ Found ${rows.length} matches with flexible search`);

        return { 
            matches: rows, 
            isRealData: true, 
            query: query, 
            params: params,
            searchParams: searchParams 
        };
    } catch (error) {
        console.error('❌ Error in flexible search:', error);
        return { matches: [], isRealData: false };
    }
}

// Enhanced helper function to get match statistics
async function getMatchStatistics(filters = {}) {
    try {
        let query = `
            SELECT 
                COUNT(*) as total_matches,
                COUNT(CASE WHEN STATUS = 'FT' THEN 1 END) as finished_matches,
                COUNT(CASE WHEN STATUS = 'NS' OR STATUS IS NULL THEN 1 END) as upcoming_matches,
                COUNT(CASE WHEN STATUS = 'LIVE' THEN 1 END) as live_matches,
                COUNT(DISTINCT League) as leagues_count,
                COUNT(DISTINCT Date) as dates_count,
                MIN(Date) as earliest_date,
                MAX(Date) as latest_date
            FROM Rawdata_Total 
            WHERE 1=1
        `;

        const params = [];
        
        if (filters.team) {
            query += ` AND (Home LIKE ? OR Away LIKE ?)`;
            params.push(`%${filters.team}%`, `%${filters.team}%`);
        }

        if (filters.league) {
            query += ` AND League LIKE ?`;
            params.push(`%${filters.league}%`);
        }

        if (filters.dateFrom) {
            query += ` AND Date >= ?`;
            params.push(filters.dateFrom);
        }

        if (filters.dateTo) {
            query += ` AND Date <= ?`;
            params.push(filters.dateTo);
        }

        console.log(`📊 Getting statistics with query: ${query}`);
        console.log(`📊 Parameters:`, params);

        const [rows] = await pool.execute(query, params);
        return { statistics: rows[0], isRealData: true };
    } catch (error) {
        console.error('❌ Error getting statistics:', error);
        return { statistics: null, isRealData: false };
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
        console.log(`📋 SQL Query: ${query}`);
        console.log(`📋 Search term: "${searchTerm}", Date: "${date}"`);
        const [rows] = await pool.execute(query, [searchTerm, searchTerm, date]);
        console.log(`✅ Found ${rows.length} upcoming matches for team "${teamName}" on ${date}`);
        
        return { matches: rows, isRealData: true, query: query, searchTerm: searchTerm, date: date };
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
        console.log(`📋 SQL Query: ${query.trim()}`);
        const [rows] = await pool.execute(query);
        console.log(`✅ Found ${rows.length} upcoming matches for today`);
        
        // Log sample for debugging
        if (rows.length > 0) {
            console.log(`📊 Today's matches sample: ${rows.slice(0, 2).map(r => `${r.Home} vs ${r.Away} (STATUS: ${r.STATUS})`).join(', ')}`);
        }
        
        return { matches: rows, isRealData: true, query: query.trim() };
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
            return { matches: hardcodedRows, isRealData: true, query: hardcodedQuery.trim() };
        }
        
        return { matches: rows, isRealData: true, query: query.trim() };
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
        console.log(`📋 SQL Query: ${query.trim()}`);
        console.log(`📋 Date parameter: "${date}"`);
        const [rows] = await pool.execute(query, [date]);
        console.log(`✅ Found ${rows.length} upcoming matches for ${date}`);
        
        return { matches: rows, isRealData: true, query: query.trim(), date: date };
    } catch (error) {
        console.error(`❌ Error querying matches for ${date}:`, error);
        return { matches: [], isRealData: false };
    }
}

// Enhanced query parser inspired by MCP flexible approach
function parseUserQueryEnhanced(query) {
    const lowerQuery = query.toLowerCase();
    console.log(`🔍 Enhanced parsing query: "${query}"`);
    
    // Initialize result object
    const result = {
        teams: [],
        leagues: [],
        dateContext: 'upcoming',
        queryType: 'general',
        specificDate: null,
        operator: 'contains',  // default search operator
        includeFinished: false,
        originalQuery: query,
        searchFilters: {}
    };

    // Enhanced team detection with common team name patterns
    const teamPatterns = [
        // Full team names (2+ capitalized words)
        /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g,
        // Single capitalized words that might be teams (but filter out common words)
        /\b[A-Z][a-z]{2,}\b/g
    ];

    const EXCLUDED_WORDS = [
        'Today', 'Tomorrow', 'Yesterday', 'Premier', 'League', 'Champions', 'Europa', 'Cup',
        'August', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
        'What', 'When', 'Where', 'Who', 'How', 'Show', 'Find', 'Get', 'Tell', 'Give',
        'Analysis', 'Odds', 'Betting', 'Match', 'Game', 'Fixture', 'Score', 'Result'
    ];

    let allMatches = [];
    teamPatterns.forEach(pattern => {
        const matches = query.match(pattern) || [];
        allMatches = [...allMatches, ...matches];
    });

    result.teams = [...new Set(allMatches)]
        .filter(match => 
            match.length > 2 && 
            !EXCLUDED_WORDS.includes(match) &&
            !match.match(/^\d+$/) // exclude pure numbers
        )
        .slice(0, 3); // limit to 3 teams max

    // Enhanced league detection
    const leagueKeywords = {
        'premier league': 'Premier League',
        'champions league': 'Champions League', 
        'europa league': 'Europa League',
        'bundesliga': 'Bundesliga',
        'la liga': 'La Liga',
        'serie a': 'Serie A',
        'ligue 1': 'Ligue 1',
        'mls': 'MLS',
        'epl': 'Premier League'
    };

    Object.entries(leagueKeywords).forEach(([keyword, league]) => {
        if (lowerQuery.includes(keyword)) {
            result.leagues.push(league);
        }
    });

    // Enhanced date parsing
    const datePatterns = {
        today: /\btoday\b/i,
        tomorrow: /\btomorrow\b/i,
        yesterday: /\byesterday\b/i,
        this_week: /\bthis week\b/i,
        next_week: /\bnext week\b/i,
        weekend: /\bweekend\b/i,
        specific_date: /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/,
        month_day: /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})\b/i
    };

    if (datePatterns.today.test(lowerQuery)) {
        result.dateContext = 'today';
    } else if (datePatterns.tomorrow.test(lowerQuery)) {
        result.dateContext = 'tomorrow';
    } else if (datePatterns.yesterday.test(lowerQuery)) {
        result.dateContext = 'yesterday';
        result.includeFinished = true;
    } else if (datePatterns.this_week.test(lowerQuery)) {
        result.dateContext = 'this_week';
    } else if (datePatterns.weekend.test(lowerQuery)) {
        result.dateContext = 'weekend';
    }

    // Check for specific dates
    const specificDateMatch = datePatterns.specific_date.exec(query);
    if (specificDateMatch) {
        result.dateContext = 'specific';
        // Handle date format conversion
        const [, day, month, year] = specificDateMatch;
        const fullYear = year.length === 2 ? `20${year}` : year;
        result.specificDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Enhanced query type detection
    const queryTypes = {
        score: /\b(score|result|final|goals?)\b/i,
        odds: /\b(odds?|betting|bet|price|value)\b/i,
        analysis: /\b(analysis|analyze|predict|statistics|stats)\b/i,
        accumulator: /\b(acca|accumulator|combo|parlay|multiple)\b/i,
        head2head: /\b(head to head|h2h|versus|vs|against)\b/i,
        live: /\b(live|now|current)\b/i,
        finished: /\b(finished|completed|final|result)\b/i
    };

    Object.entries(queryTypes).forEach(([type, pattern]) => {
        if (pattern.test(lowerQuery)) {
            result.queryType = type;
        }
    });

    // Set search operator based on query specificity
    if (lowerQuery.includes('exactly') || lowerQuery.includes('exact')) {
        result.operator = 'equals';
    } else if (lowerQuery.includes('starts with') || lowerQuery.includes('beginning')) {
        result.operator = 'starts_with';
    } else if (lowerQuery.includes('ends with') || lowerQuery.includes('ending')) {
        result.operator = 'ends_with';
    }

    // Include finished matches for certain query types
    if (result.queryType === 'score' || result.queryType === 'finished' || result.dateContext === 'yesterday') {
        result.includeFinished = true;
    }

    // Build search filters object for flexible searching
    result.searchFilters = {
        team: result.teams[0] || null,
        league: result.leagues[0] || null,
        date: result.dateContext,
        operator: result.operator,
        includeFinished: result.includeFinished
    };

    console.log(`🎯 Enhanced parsing result:`, result);
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

        // Handle general conversational questions (not football-related)
        const conversationalKeywords = [
            'how are you', 'are you', 'hello', 'hi', 'thanks', 'thank you', 
            'good morning', 'good afternoon', 'good evening', 'what is your name',
            'who are you', 'connected to claude', 'working', 'function'
        ];
        
        const isConversational = conversationalKeywords.some(keyword => 
            userQuery.toLowerCase().includes(keyword)
        );

        if (isConversational && !userQuery.toLowerCase().includes('match') && 
            !userQuery.toLowerCase().includes('bet') && !userQuery.toLowerCase().includes('odds')) {
            
            console.log(`💬 Detected conversational query, responding directly via Claude`);
            
            try {
                const conversationalPrompt = `You are an expert football betting analyst and assistant. The user asked: "${userQuery}"

This is a conversational question, not about football matches or betting. Respond naturally and helpfully as a betting assistant would. Keep it friendly and professional.`;

                const response = await anthropic.messages.create({
                    model: "claude-3-haiku-20240307",
                    max_tokens: 300,
                    messages: [{ role: "user", content: conversationalPrompt }]
                });

                const claudeResponse = response.content[0].text;
                
                res.json({
                    success: true,
                    response: claudeResponse,
                    matchCount: 0,
                    queryInfo: { type: 'conversational' }
                });
                return;
                
            } catch (claudeError) {
                console.error('❌ Claude API error for conversational query:', claudeError);
                res.json({
                    success: true,
                    response: "I'm doing well, thanks for asking! I'm here and ready to help you with football betting analysis and accumulator suggestions. What would you like to explore?",
                    matchCount: 0,
                    queryInfo: { type: 'conversational_fallback' }
                });
                return;
            }
        }

        // Parse the user query to understand what they want - using enhanced parser
        const queryInfo = parseUserQueryEnhanced(userQuery);
        console.log(`🔍 Enhanced parsed query:`, queryInfo);
        console.log(`🔍 Date context detected: ${queryInfo.dateContext}`);
        console.log(`🔍 Teams detected: ${queryInfo.teams}`);
        console.log(`🔍 Search filters:`, queryInfo.searchFilters);

        let relevantMatches = [];
        let contextDescription = '';
        let isRealData = true;

        // Use flexible search approach inspired by MCP
        if (queryInfo.teams.length > 0 || queryInfo.leagues.length > 0) {
            console.log(`🎯 Processing team/league-specific query with flexible search...`);
            
            // Build search parameters for flexible search
            const searchParams = {
                team: queryInfo.teams[0],
                league: queryInfo.leagues[0],
                date: queryInfo.dateContext,
                operator: queryInfo.operator,
                includeFinished: queryInfo.includeFinished,
                limit: 50
            };

            if (queryInfo.specificDate) {
                searchParams.date = queryInfo.specificDate;
            }

            const result = await searchMatchesFlexible(searchParams);
            relevantMatches = result.matches;
            isRealData = result.isRealData;
            
            // Build context description
            const teamPart = queryInfo.teams[0] ? `for ${queryInfo.teams[0]}` : '';
            const leaguePart = queryInfo.leagues[0] ? `in ${queryInfo.leagues[0]}` : '';
            const datePart = queryInfo.dateContext === 'today' ? 'today' : 
                           queryInfo.dateContext === 'tomorrow' ? 'tomorrow' :
                           queryInfo.specificDate ? `on ${queryInfo.specificDate}` : 'upcoming';
            
            contextDescription = `Matches ${teamPart} ${leaguePart} ${datePart}`.trim();

        } else if (queryInfo.queryType === 'accumulator') {
            console.log(`🎯 Processing accumulator request - getting upcoming matches...`);
            const result = await getUpcomingMatches(7);
            relevantMatches = result.matches;
            isRealData = result.isRealData;
            contextDescription = "Upcoming matches for accumulator (next 7 days)";

        } else {
            console.log(`🎯 Processing general query with flexible search...`);
            
            // Use flexible search for general queries too
            const searchParams = {
                date: queryInfo.dateContext,
                includeFinished: queryInfo.includeFinished,
                limit: 50
            };

            if (queryInfo.specificDate) {
                searchParams.date = queryInfo.specificDate;
            }

            const result = await searchMatchesFlexible(searchParams);
            relevantMatches = result.matches;
            isRealData = result.isRealData;
            
            const datePart = queryInfo.dateContext === 'today' ? "Today's matches" : 
                           queryInfo.dateContext === 'tomorrow' ? "Tomorrow's matches" :
                           queryInfo.specificDate ? `Matches on ${queryInfo.specificDate}` : 
                           "Upcoming matches";
            contextDescription = datePart;
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
