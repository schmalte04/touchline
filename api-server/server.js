const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql2/promise');
const Anthropic = require('@anthropic-ai/sdk');


// Load environment variables from .env file (for local development)
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Global variable to store executed SQL queries for debugging
global.lastExecutedQueries = [];

const app = express();
const PORT = process.env.PORT || 8080;

// =============================================================================
// STANDARD PROMPT TEMPLATES
// =============================================================================
const PROMPT_TEMPLATES = {
    // Base system prompt for all interactions
    BASE_SYSTEM_PROMPT: `You are an expert football betting analyst with access to live MySQL database data.

CORE IDENTITY:
- Professional betting analyst
- Focus on statistical analysis and data-driven insights
- Provide clear, actionable betting information

IMPORTANT RESTRICTIONS - DO NOT:
- Make specific stake recommendations (e.g., "Limit stakes to 1-2% of bankroll")
- Suggest specific betting amounts or percentages of bankroll
- Give bankroll management advice
- Recommend how much money to wager
- Use phrases like "stake 1% of your bankroll" or similar
- Provide financial planning or money management advice

FOCUS ON:
- Match analysis and predictions
- Odds value assessment
- Team form and statistics
- Match outcome probabilities
- Risk assessment for bets (low/medium/high risk)
- Bookmaker suggestions
- Market analysis and trends`,

    // Conversational responses
    CONVERSATIONAL_PROMPT: `You are an expert football betting analyst and assistant.

This is a conversational question, not about football matches or betting. Respond naturally and helpfully as a betting assistant would. Keep it friendly and professional.

IMPORTANT: Never provide stake recommendations, bankroll management advice, or suggest specific betting amounts or percentages.`,

    // When no matches are found
    NO_MATCHES_PROMPT: `You are an expert football betting analyst with access to live MySQL database data.

IMPORTANT: Keep your response very short and direct. Simply state that there are no matches for the requested timeframe. Do not provide long explanations, suggestions, or additional analysis. Just give a brief, direct answer.`,

    // When using demo data
    DEMO_DATA_PROMPT: `You are an expert football betting analyst. 

Database Status: Unable to connect to live database - showing demo data only.

IMPORTANT: Inform the user about demo data limitations. Keep response short and mention that real match data is currently unavailable. Do not provide detailed analysis of demo data.`,

    // Betting guidelines
    BETTING_GUIDELINES: `BETTING GUIDELINES:
- Focus on match analysis, team form, and value in odds
- Assess risk levels (low/medium/high risk)
- Never suggest specific stake amounts or bankroll percentages
- Do not provide bankroll management advice
- Avoid phrases like "stake 1% of bankroll" or similar

IMPORTANT: When making betting recommendations, END your response with bookmaker suggestions using clickable links:
"You can place this bet on [Bet365](https://www.bet365.com), [Tipico](https://www.tipico.de), [Betway](https://betway.com), or [William Hill](https://www.williamhill.com) for the best odds."

Always format bookmaker names as clickable markdown links with their official websites.`,

    // Comprehensive bookmaker links for recommendations
    BOOKMAKER_LINKS: `
**Recommended Bookmakers:**
- [Bet365](https://www.bet365.com) - Excellent odds and live betting
- [Tipico](https://www.tipico.de) - Popular in Germany and Austria  
- [Betway](https://betway.com) - Great for accumulators
- [William Hill](https://www.williamhill.com) - Established UK bookmaker
- [Bwin](https://www.bwin.com) - Comprehensive sports coverage
- [Unibet](https://www.unibet.com) - Good European coverage
- [888sport](https://www.888sport.com) - Competitive odds
- [Paddy Power](https://www.paddypower.com) - Creative betting markets
- [Pinnacle](https://www.pinnacle.com) - High limits and best odds
- [FanDuel](https://www.fanduel.com) - Popular in the US
- [DraftKings](https://www.draftkings.com) - Leading US sportsbook

Choose the bookmaker that's available in your region and offers the best odds for your specific bet.`,

    // Extended betting guidelines with full bookmaker list
    BETTING_GUIDELINES_EXTENDED: `BETTING GUIDELINES:
- Focus on match analysis, team form, and value in odds
- Assess risk levels (low/medium/high risk)
- Never suggest specific stake amounts or bankroll percentages
- Do not provide bankroll management advice
- Avoid phrases like "stake 1% of bankroll" or similar

**Recommended Bookmakers:**
- [Bet365](https://www.bet365.com) - Excellent odds and live betting
- [Tipico](https://www.tipico.de) - Popular in Germany and Austria  
- [Betway](https://betway.com) - Great for accumulators
- [William Hill](https://www.williamhill.com) - Established UK bookmaker
- [Bwin](https://www.bwin.com) - Comprehensive sports coverage
- [Unibet](https://www.unibet.com) - Good European coverage
- [888sport](https://www.888sport.com) - Competitive odds
- [Paddy Power](https://www.paddypower.com) - Creative betting markets
- [Pinnacle](https://www.pinnacle.com) - High limits and best odds
- [FanDuel](https://www.fanduel.com) - Popular in the US
- [DraftKings](https://www.draftkings.com) - Leading US sportsbook

Choose the bookmaker that's available in your region and offers the best odds for your specific bet.`,

    // Comprehensive database context with league codes and structure
    DATABASE_CONTEXT: `DATABASE SCHEMA CONTEXT (Rawdata_Total table):

Core Match Data:
- MATCH_ID: Unique match identifier
- Home/Away: Team names
- Date/Time: Match date and kickoff time (format: YYYY-MM-DD HH:MM)
- League: Competition name with shortcodes
- Country: Country of the league
- STATUS: 'FT' = Full Time (completed), 'NS' = Not Started, 'LIVE' = In Progress

LEAGUE SHORTCODES & MAPPINGS:
European Top Leagues:
- D1 = German Bundesliga (Germany)
- E0 = English Premier League (England)
- E1 = English Championship (England)
- E2 = English League One (England)
- E3 = English League Two (England)
- League Two = English 
- SP1 = Spanish La Liga (Spain)
- SP2 = Spanish Segunda División (Spain)
- I1 = Italian Serie A (Italy)
- I2 = Italian Serie B (Italy)
- F1 = French Ligue 1 (France)
- F2 = French Ligue 2 (France)
- N1 = Dutch Eredivisie (Netherlands)
- B1 = Belgian First Division A (Belgium)
- P1 = Portuguese Primeira Liga (Portugal)
- T1 = Turkish Süper Lig (Turkey)
- G1 = Greek Super League (Greece)

Other Major Leagues:
- SC0 = Scottish Premier League (Scotland)
- SC1 = Scottish Championship (Scotland)
- ARG = Argentine Primera División (Argentina)
- BRA = Brazilian Série A (Brazil)
- Liga MX = Mexican Liga MX (Mexico)
- MLS = Major League Soccer (USA)
- J-League = Japanese J1 League (Japan)
- AUS = Australian A-League (Australia)

Scores & Results:
- HG/AG: Home/Away goals (final scores for completed matches)
- Score_Home/Score_Away: Predicted scores based on team performance metrics
- FTHG/FTAG: Full-time home/away goals
- HTHG/HTAG: Half-time home/away goals

Betting Odds (Decimal Format):
- PH/PD/PA: Pinnacle odds for Home Win/Draw/Away Win
- B365_H/B365_D/B365_A: Bet365 odds for Home/Draw/Away
- BW_H/BW_D/BW_A: Betway odds for Home/Draw/Away
- IW_H/IW_D/IW_A: Interwetten odds
- PS_H/PS_D/PS_A: Pinnacle odds
- WH_H/WH_D/WH_A: William Hill odds
- VC_H/VC_D/VC_A: VC Bet odds
- Under2.5/Over2.5: Total goals market odds
- AH_-0.5/AH_0.5: Asian Handicap odds

Performance Metrics:
- ELO_Home/ELO_Away: Team ELO ratings (strength indicators, range ~1200-2000)
- ELO_prob: Win probability based on ELO ratings (0-1 scale)
- xG/xG_Away: Expected Goals (quality of scoring chances, range 0.0-5.0)
- HS_Target/AS_Target: Average shots on target (last 10 matches)
- HS/AS: Total shots home/away
- HST/AST: Shots on target home/away
- HF/AF: Fouls home/away
- HY/AY: Yellow cards home/away
- HR/AR: Red cards home/away

Advanced Analytics:
- p1_skell/px_skell/p2_skell: Skellam distribution probabilities (Home/Draw/Away)
- Conversion rates, entropy measures, and form indicators
- Team form metrics and recent performance data

IMPORTANT NOTES:
- League field contains the shortcode (e.g., "D1", "E0") not the full name
- To find Bundesliga matches, search for League = "D1"
- To find Premier League matches, search for League = "E0" 
- Country field contains the full country name
- Use LIKE operator for flexible team name searches
- Date format is YYYY-MM-DD for consistent filtering
- Time format is HH:MM (CEST), so if someone from UK is asking you need to convert it`,


    // Table formatting instructions
    TABLE_FORMAT_INSTRUCTIONS: `ALWAYS present match data using proper markdown table format (not ASCII art). Use this EXACT format:

| Date | Time | Match | Home | Draw | Away |
|------|------|-------|------|------|------|
| 2025-08-12 | 19:00 | Team A vs Team B | 2.1 | 3.4 | 3.8 |
| 2025-08-12 | 19:30 | Team C vs Team D | 1.8 | 3.2 | 4.1 |

Rules:
- Use proper markdown table syntax with | separators
- No ASCII art tables with dashes and characters
- Include Date column in YYYY-MM-DD format
- Keep team names concise 
- Show odds to 1 decimal place
- Include all matches from the provided data

Then provide brief analysis and recommendations.`
};

// =============================================================================
// HELPER FUNCTIONS FOR QUERY PROCESSING
// =============================================================================

// Map league names to database shortcodes
function mapLeagueToShortcode(leagueName) {
    const leagueMapping = {
        'Bundesliga': 'D1',
        'German Bundesliga': 'D1',
        'Premier League': 'E0',
        'English Premier League': 'E0',
        'EPL': 'E0',
        'Championship': 'E1',
        'English Championship': 'E1',
        'League One': 'E2',
        'English League One': 'E2',
        'League Two': 'E3',
        'English League Two': 'E3',
        'La Liga': 'SP1',
        'Spanish La Liga': 'SP1',
        'Primera División': 'SP1',
        'Segunda División': 'SP2',
        'Serie A': 'I1',
        'Italian Serie A': 'I1',
        'Serie B': 'I2',
        'Italian Serie B': 'I2',
        'Ligue 1': 'F1',
        'French Ligue 1': 'F1',
        'Ligue 2': 'F2',
        'French Ligue 2': 'F2',
        'Eredivisie': 'N1',
        'Dutch Eredivisie': 'N1',
        'Belgian First Division A': 'B1',
        'Primeira Liga': 'P1',
        'Portuguese Primeira Liga': 'P1',
        'Süper Lig': 'T1',
        'Turkish Süper Lig': 'T1',
        'Super League': 'G1',
        'Greek Super League': 'G1',
        'Scottish Premier League': 'SC0',
        'Scottish Championship': 'SC1',
        'MLS': 'USA',
        'Major League Soccer': 'USA'
    };
    
    return leagueMapping[leagueName] || leagueName;
}

// Calculate weekend date range (Saturday and Sunday)
function getWeekendDateRange() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    let saturday, sunday;
    
    if (dayOfWeek === 0) {
        // It's Sunday, get this Sunday and next Saturday
        sunday = new Date(today);
        saturday = new Date(today);
        saturday.setDate(today.getDate() + 6);
    } else if (dayOfWeek === 6) {
        // It's Saturday, get today and tomorrow (Sunday)
        saturday = new Date(today);
        sunday = new Date(today);
        sunday.setDate(today.getDate() + 1);
    } else {
        // It's Monday-Friday, get upcoming weekend
        const daysUntilSaturday = 6 - dayOfWeek;
        saturday = new Date(today);
        saturday.setDate(today.getDate() + daysUntilSaturday);
        sunday = new Date(saturday);
        sunday.setDate(saturday.getDate() + 1);
    }
    
    const formatDate = (date) => date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    return {
        start: formatDate(saturday),
        end: formatDate(sunday),
        dates: [formatDate(saturday), formatDate(sunday)]
    };
}

// =============================================================================
// CLAUDE API INITIALIZATION
// =============================================================================

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

// Middleware - Allow all origins for widget embedding
app.use(cors({
    origin: true, // Allow all origins for widget embedding
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(bodyParser.json());

// Root route - serve Turboscores iframe demo as main page
app.get('/', (req, res) => {
    try {
        const demoPath = path.join(__dirname, '../turboscores-iframe-demo.html');
        res.sendFile(demoPath);
    } catch (error) {
        console.error('❌ Error serving iframe demo:', error);
        res.status(500).send('Demo not available');
    }
});

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
                   PH, PD, PA
            FROM Rawdata_Total 
            WHERE Date >= CURDATE() 
            AND Date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
            AND (STATUS != 'FT' OR STATUS IS NULL OR STATUS = 'NS' OR STATUS = 'LIVE')
            ORDER BY Date ASC, Time ASC
            LIMIT 500
        `;
        
        console.log(`📅 Querying upcoming matches with precise STATUS filtering for next ${days} days...`);
        console.log(`📋 SQL Query: ${query.trim()}`);
        
        // Store query for debugging
        global.lastExecutedQueries.push({
            function: 'getUpcomingMatches',
            query: query.trim(),
            params: [days],
            timestamp: new Date().toISOString()
        });
        
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
            country = null,
            date = null, 
            status = null,
            operator = 'contains',  // contains, equals, starts_with, ends_with
            limit = 500,
            includeFinished = false
        } = searchParams;

        let query = `
            SELECT MATCH_ID, Home, Away, Date, Time, League, Country,
                   Score_Home, Score_Away, STATUS, ELO_Home, ELO_Away, p1_skell_xgboost,
                   PH, PD, PA
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

        // League filter - handle league shortcodes properly
        if (league) {
            // Map common league names to shortcodes
            const leagueShortcode = mapLeagueToShortcode(league);
            console.log(`🏆 League mapping: "${league}" -> "${leagueShortcode}"`);
            
            if (leagueShortcode !== league) {
                // Use exact match for shortcodes
                conditions.push(`League = ?`);
                params.push(leagueShortcode);
            } else if (league === 'Premier League' || league.toLowerCase().includes('english')) {
                // For English/Premier League, include multiple English competitions
                conditions.push(`(League = 'E0' OR League = 'E1' OR League = 'E2' OR League = 'E3')`);
            } else {
                // Fallback to LIKE search for unmapped leagues
                conditions.push(`League LIKE ?`);
                params.push(`%${league}%`);
            }
        }

        // Country filter - prioritize this for country-based queries
        if (country) {
            conditions.push(`Country = ?`);
            params.push(country);
            console.log(`🌍 Adding country filter: Country = "${country}"`);
        }

        // Date filter - handle special date contexts
        if (date) {
            if (date === 'today') {
                conditions.push(`Date = CURDATE()`);
            } else if (date === 'tomorrow') {
                conditions.push(`Date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)`);
            } else if (date === 'weekend') {
                const weekend = getWeekendDateRange();
                console.log(`📅 Weekend date range: ${weekend.start} to ${weekend.end}`);
                conditions.push(`(Date = ? OR Date = ?)`);
                params.push(weekend.start, weekend.end);
            } else if (date === 'upcoming') {
                conditions.push(`Date >= CURDATE()`);
            } else if (date === 'this_week') {
                conditions.push(`Date >= CURDATE() AND Date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)`);
            } else {
                // Specific date
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

        // Store query for debugging
        global.lastExecutedQueries.push({
            function: 'searchMatchesFlexible',
            query: query,
            params: params,
            searchParams: searchParams,
            timestamp: new Date().toISOString()
        });

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
                    PH, PD, PA
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
                   STATUS,  PH, PD, PA
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
        countries: [],
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
        'Analysis', 'Odds', 'Betting', 'Match', 'Game', 'Fixture', 'Score', 'Result',
        'Help', 'Please', 'Can', 'Could', 'Would', 'Should', 'Need', 'Want', 'Create', 'Make', 'Build',
        'Analyse', 'Next', 'This', 'The', 'That', 'These', 'Those', 'First', 'Last', 'Second'
    ];

    let allMatches = [];
    teamPatterns.forEach(pattern => {
        const matches = query.match(pattern) || [];
        allMatches = [...allMatches, ...matches];
    });

    // Enhanced query type detection - do this BEFORE team detection
    const queryTypes = {
        score: /\b(score|result|final|goals?)\b/i,
        odds: /\b(odds?|betting|bet|price|value)\b/i,
        analysis: /\b(analysis|analyze|analyse|predict|statistics|stats)\b/i,
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

    // Skip team detection for accumulator queries - they should get all upcoming matches
    if (result.queryType !== 'accumulator') {
        // First pass: Get all potential matches
        let potentialTeams = [...new Set(allMatches)]
            .filter(match => 
                match.length > 2 && 
                !EXCLUDED_WORDS.includes(match) &&
                !match.match(/^\d+$/) // exclude pure numbers
            );
        
        // Second pass: Clean up team names by removing excluded words from multi-word matches
        result.teams = potentialTeams.map(team => {
            // Split multi-word team names and filter out excluded words
            const words = team.split(/\s+/);
            const cleanWords = words.filter(word => !EXCLUDED_WORDS.includes(word));
            return cleanWords.join(' ');
        })
        .filter(team => team.length > 0) // Remove empty results
        .slice(0, 3); // limit to 3 teams max
        
        console.log(`🏷️ Original team matches: ${potentialTeams.join(', ')}`);
        console.log(`🏷️ Cleaned team names: ${result.teams.join(', ')}`);
    } else {
        result.teams = []; // No team filtering for accumulator queries
    }

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
        'epl': 'Premier League',
        'championship': 'Championship',
        'league one': 'League One',
        'league two': 'League Two'
    };

    // Country detection for database Country field
    const countryKeywords = {
        'english': 'England',
        'england': 'England',
        'english football': 'England',
        'english matches': 'England',
        'german': 'Germany', 
        'germany': 'Germany',
        'spanish': 'Spain',
        'spain': 'Spain',
        'italian': 'Italy',
        'italy': 'Italy',
        'french': 'France',
        'france': 'France',
        'american': 'USA',
        'usa': 'USA',
        'united states': 'USA'
    };

    // Check for countries first
    result.countries = [];
    Object.entries(countryKeywords).forEach(([keyword, country]) => {
        if (lowerQuery.includes(keyword)) {
            result.countries.push(country);
            console.log(`🌍 Country detected: "${keyword}" -> "${country}"`);
        }
    });

    // Then check for specific leagues
    Object.entries(leagueKeywords).forEach(([keyword, league]) => {
        if (lowerQuery.includes(keyword)) {
            result.leagues.push(league);
            console.log(`🏆 League detected: "${keyword}" -> "${league}"`);
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
        country: result.countries[0] || null,
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
        // Clear previous SQL queries for this request
        global.lastExecutedQueries = [];
        
        const { message: userQuery, context } = req.body;
        console.log(`💬 User query: ${userQuery}`);
        console.log(`📋 Context: ${context || 'none'}`);

        // Handle initialization/welcome message
        if (context === 'initialization' || userQuery.toLowerCase().includes('introduce yourself')) {
            const welcomeMessage = `Hello! 👋 I'm your Touchline Betting Assistant.

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
                const conversationalPrompt = `${PROMPT_TEMPLATES.CONVERSATIONAL_PROMPT}
                
User Query: "${userQuery}"`;

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
        console.log(`🔍 Countries detected: ${queryInfo.countries}`);
        console.log(`🔍 Search filters:`, queryInfo.searchFilters);

        let relevantMatches = [];
        let contextDescription = '';
        let isRealData = true;

        // Use flexible search approach inspired by MCP
        if (queryInfo.teams.length > 0 || queryInfo.leagues.length > 0 || queryInfo.countries.length > 0) {
            console.log(`🎯 Processing team/league/country-specific query with flexible search...`);
            
            // Build search parameters for flexible search
            const searchParams = {
                team: queryInfo.teams[0],
                league: queryInfo.leagues[0] ? mapLeagueToShortcode(queryInfo.leagues[0]) : undefined,
                country: queryInfo.countries[0],
                date: queryInfo.dateContext,
                operator: queryInfo.operator,
                includeFinished: queryInfo.includeFinished,
                limit: 500
            };

            if (queryInfo.specificDate) {
                searchParams.date = queryInfo.specificDate;
            }

            console.log(`🔍 Flexible search with params:`, searchParams);

            const result = await searchMatchesFlexible(searchParams);
            relevantMatches = result.matches;
            isRealData = result.isRealData;
            
            // Build context description
            const teamPart = queryInfo.teams[0] ? `for ${queryInfo.teams[0]}` : '';
            const leaguePart = queryInfo.leagues[0] ? `in ${queryInfo.leagues[0]}` : '';
            const countryPart = queryInfo.countries[0] ? `in ${queryInfo.countries[0]}` : '';
            const datePart = queryInfo.dateContext === 'today' ? 'today' : 
                           queryInfo.dateContext === 'tomorrow' ? 'tomorrow' :
                           queryInfo.specificDate ? `on ${queryInfo.specificDate}` : 'upcoming';
            
            contextDescription = `Matches ${teamPart} ${leaguePart} ${countryPart} ${datePart}`.trim();

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

        // Format match data for Claude in table format
        let contextData = '';
        if (uniqueMatches.length > 0) {
            contextData = `📋 UPCOMING MATCHES TABLE\n\n${contextDescription} (${uniqueMatches.length} matches found):\n\n`;
            
            // Create table header with Date and Country columns
            contextData += `| Date | Time | Match | Home | Draw | Away | League | Country |\n`;
            contextData += `|------|------|-------|------|------|------|--------|--------|\n`;
            
            // Add table rows
            contextData += uniqueMatches.slice(0, 15).map(match => {
                const date = match.Date || 'TBD';
                const time = match.Time ? match.Time.substring(0, 5) : 'TBD';
                const homeTeam = match.Home || 'TBD';
                const awayTeam = match.Away || 'TBD';
                const matchup = `${homeTeam} vs ${awayTeam}`;
                
                // Format odds
                const homeOdds = match.PH ? parseFloat(match.PH).toFixed(1) : 'N/A';
                const drawOdds = match.PD ? parseFloat(match.PD).toFixed(1) : 'N/A';
                const awayOdds = match.PA ? parseFloat(match.PA).toFixed(1) : 'N/A';
                
                const league = match.League ? match.League.substring(0, 15) + (match.League.length > 15 ? '...' : '') : 'Unknown';
                const country = match.Country || 'Unknown';
                
                return `| ${date} | ${time} | ${matchup} | ${homeOdds} | ${drawOdds} | ${awayOdds} | ${league} | ${country} |`;
            }).join('\n');
            
            contextData += `\n\n📊 Additional Data Available:\n`;
            contextData += `- ELO Ratings for analysis\n`;
            contextData += `- Status information available\n`;
        } else {
            contextData = `📋 UPCOMING MATCHES TABLE\n\nNo upcoming matches found for query: "${userQuery}"\n\nQuery parameters:\n- Teams searched: ${queryInfo.teams.join(', ') || 'None'}\n- Countries searched: ${queryInfo.countries.join(', ') || 'None'}\n- Date context: ${queryInfo.dateContext}\n- Specific date: ${queryInfo.specificDate || 'None'}`;
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
            prompt = `${PROMPT_TEMPLATES.NO_MATCHES_PROMPT}

I've looked in the Rawdata_Total database table for: "${userQuery}"

${contextData}`;
        } else if (!isRealData) {
            // Special handling for mock/demo data
            prompt = `${PROMPT_TEMPLATES.DEMO_DATA_PROMPT}

${contextData}

Found ${uniqueMatches.length} demo matches but cannot access live database.`;
        } else {
            // Count matches by status for more informative response
            const notStartedMatches = uniqueMatches.filter(m => !m.STATUS || m.STATUS === 'NS' || m.STATUS === null).length;
            const liveMatches = uniqueMatches.filter(m => m.STATUS === 'LIVE').length;
            
            // Full analysis when real matches are found
            prompt = `${PROMPT_TEMPLATES.BASE_SYSTEM_PROMPT}

${PROMPT_TEMPLATES.DATABASE_CONTEXT}

CURRENT DATA:
${contextData}

Match Status Summary: ${uniqueMatches.length} total matches (${notStartedMatches} not started${liveMatches > 0 ? `, ${liveMatches} live` : ''})

User Query: "${userQuery}"
Query Type: ${queryInfo.queryType}
Special Instructions: ${specificInstructions}

${PROMPT_TEMPLATES.TABLE_FORMAT_INSTRUCTIONS}

Then provide brief analysis and recommendations.

${PROMPT_TEMPLATES.BETTING_GUIDELINES}`;
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
            queryInfo: queryInfo,
            sqlQueries: global.lastExecutedQueries || [] // Include executed SQL queries
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

// Widget endpoints for embeddable chat widget
app.get('/widget/touchline-widget.js', (req, res) => {
    try {
        const widgetPath = path.join(__dirname, '../touchline-widget.js');
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minute cache
        res.sendFile(widgetPath);
    } catch (error) {
        console.error('❌ Widget file error:', error);
        res.status(500).send('// Widget loading error');
    }
});

// Widget demo pages
app.get('/demo', (req, res) => {
    try {
        const demoPath = path.join(__dirname, '../widget-demo.html');
        res.sendFile(demoPath);
    } catch (error) {
        res.status(500).send('Demo not available');
    }
});

app.get('/turboscores-demo', (req, res) => {
    try {
        const demoPath = path.join(__dirname, '../turboscores-demo.html');
        res.sendFile(demoPath);
    } catch (error) {
        res.status(500).send('Demo not available');
    }
});

app.get('/turboscores-iframe-demo', (req, res) => {
    try {
        const demoPath = path.join(__dirname, '../turboscores-iframe-demo.html');
        res.sendFile(demoPath);
    } catch (error) {
        res.status(500).send('Demo not available');
    }
});

app.get('/qount-demo', (req, res) => {
    try {
        const demoPath = path.join(__dirname, '../qount-demo.html');
        res.sendFile(demoPath);
    } catch (error) {
        res.status(500).send('Demo not available');
    }
});

// Original website route
app.get('/website', (req, res) => {
    try {
        const websitePath = path.join(__dirname, '../website/index.html');
        res.sendFile(websitePath);
    } catch (error) {
        res.status(500).send('Website not available');
    }
});

// Password validation endpoint
app.post('/api/validate-password', (req, res) => {
    try {
        const { password } = req.body;
        const correctPassword = process.env.WEBSITE_PASSWORD || 'Touchline2024!';
        
        console.log('🔐 Password validation attempt');
        
        if (password === correctPassword) {
            res.json({ success: true, message: 'Access granted' });
        } else {
            res.json({ success: false, message: 'Invalid password' });
        }
    } catch (error) {
        console.error('❌ Password validation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
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
