# Football Database Schema Documentation

## Overview
This database contains comprehensive football match data, betting odds, and analytics for multiple leagues and competitions. The data supports betting analysis, match predictions, and statistical insights.

## Main Tables

### 1. Rawdata_Total
**Primary match data table containing all historical and upcoming fixtures**

**Purpose**: Complete match records with teams, dates, scores, and key statistics

**Key Columns**:
- `MATCH_ID` (VARCHAR): Unique identifier for each match
- `Home` (VARCHAR): Home team name
- `Away` (VARCHAR): Away team name  
- `Date` (DATE): Match date (YYYY-MM-DD format)
- `Time` (TIME): Match kickoff time
- `League` (VARCHAR): Competition/league name
- `Score_Home` (INT): Home team final score (NULL for future matches)
- `Score_Away` (INT): Away team final score (NULL for future matches)

**Statistical Columns**:
- `ELO_Home` (DECIMAL): Home team ELO rating
- `ELO_Away` (DECIMAL): Away team ELO rating
- `xG_Home` (DECIMAL): Home team expected goals
- `xG_Away` (DECIMAL): Away team expected goals
- `HS_Target` (INT): Home team shots
- `AS_Target` (INT): Away team shots
- `ShotsOnTarget_Home` (INT): Home team shots on target
- `ShotsOnTarget_Away` (INT): Away team shots on target

**Betting Odds**:
- `PH` (DECIMAL): Home win odds
- `PD` (DECIMAL): Draw odds  
- `PA` (DECIMAL): Away win odds

**Data Range**: Contains matches from 2022-01-01 onwards
**Record Count**: ~50,000+ matches
**Update Frequency**: Daily for new fixtures and results

### 2. Price_Data
**Betting market prices and odds for various bet types**

**Purpose**: Detailed betting odds for different markets (handicaps, totals, etc.)

**Key Columns**:
- `MATCH_ID` (VARCHAR): Links to Rawdata_Total.MATCH_ID
- `Market_Type` (VARCHAR): Type of bet (e.g., "Home -0.5", "Away +1", "Over 2.5")
- `Price` (DECIMAL): Current betting odds/price
- `Timestamp` (DATETIME): When odds were recorded

**Common Market Types**:
- Home/Away handicaps: "Home -0.5", "Away +1.5"
- Total goals: "Over 2.5", "Under 1.5"
- Asian handicaps: Various fractional handicaps

### 3. HomeMarketContext
**Analysis framework for Home team betting markets**

**Purpose**: Provides thresholds and criteria for evaluating Home team bets

**Key Columns**:
- `Variable` (VARCHAR): Statistical metric name
- `Threshold_Min` (DECIMAL): Minimum threshold for positive signal
- `Threshold_Max` (DECIMAL): Maximum threshold for positive signal
- `Importance` (DECIMAL): Weight/importance of this variable (0-1)
- `Description` (TEXT): Explanation of what this variable measures

**Usage**: Used by analysis engine to evaluate Home team betting opportunities

### 4. AwayMarketContext / TypeContext
**Analysis frameworks for Away team and market type evaluation**

**Purpose**: Similar to HomeMarketContext but for Away team scenarios and market types

**Structure**: Same as HomeMarketContext with different thresholds optimized for Away team analysis

## Data Relationships

```
Rawdata_Total (1) ←→ (many) Price_Data
    MATCH_ID           MATCH_ID

HomeMarketContext → Used for analyzing Home team bets
AwayMarketContext → Used for analyzing Away team bets  
TypeContext → Used for market-specific analysis
```

## Common Query Patterns

### Get Today's Matches
```sql
SELECT * FROM Rawdata_Total 
WHERE Date = CURDATE()
ORDER BY Time
```

### Get Tomorrow's Matches
```sql
SELECT * FROM Rawdata_Total 
WHERE Date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
ORDER BY Time  
```

### Find Team Matches
```sql
SELECT * FROM Rawdata_Total 
WHERE (Home LIKE '%TeamName%' OR Away LIKE '%TeamName%') 
AND Date >= CURDATE()
ORDER BY Date, Time
```

### Get Match with Betting Odds
```sql
SELECT r.*, p.Market_Type, p.Price
FROM Rawdata_Total r
LEFT JOIN Price_Data p ON r.MATCH_ID = p.MATCH_ID
WHERE r.MATCH_ID = 'specific_match_id'
```

## Data Quality Notes

- **Dates**: All in MySQL DATE format (YYYY-MM-DD)
- **Times**: In 24-hour format (HH:MM:SS)
- **Team Names**: Standardized but may have slight variations
- **NULL Values**: Future matches have NULL scores
- **ELO Ratings**: Typically range from 1200-2000
- **Expected Goals (xG)**: Usually 0.0-5.0 per team
- **Odds**: Decimal format (e.g., 2.50 = 5/2)

## Analysis Context

The database supports:
1. **Match Outcome Prediction** using ELO and xG data
2. **Betting Value Analysis** using odds comparison
3. **Team Performance Tracking** across competitions
4. **Statistical Trend Analysis** for betting strategies
5. **Risk Assessment** using historical performance

## Usage for Claude Queries

When users ask about:
- **"Tomorrow's matches"** → Query Date = DATE_ADD(CURDATE(), 1)
- **"Team performance"** → Filter by Home/Away team names
- **"Betting odds"** → Join with Price_Data table
- **"League fixtures"** → Filter by League column
- **"High-scoring games"** → Look at xG_Home + xG_Away values
- **"Close matches"** → Compare ELO_Home vs ELO_Away differences
