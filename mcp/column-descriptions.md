# CSV Column Descriptions

## Rawdata_Total.csv - Gaming Dataset

**File Description:** Gaming dataset containing information about video games, their ratings, sales, and metadata

### Columns:
- **MATCH_ID**: Unique Identifier for each game entry


---

## Price_Data.csv - Game Pricing Information

**File Description:** Pricing information for video games across different platforms and regions

### Columns:
- **MATCH_ID**: Name of the game (should match with Rawdata_Total.csv)

---

## Glossary_GASheet_21052025.csv - Reference/Dictionary Data

**File Description:** Glossary/Dictionary containing definitions, mappings, and reference data to help understand and connect information across the gaming datasets

### Columns:
- **Feature**: Name of the feature/column being described
- **Description**: Detailed description of what this feature represents  
- **Side**: Side or perspective information (if applicable)
- **Type**: Data type or category of the feature
- **Class**: Classification or grouping of the feature
- **Draw**: Drawing or visualization notes (if applicable)

---

## fuzzy_analytics_fixtures_past.csv - Historical Trading Analytics

**File Description:** Historical trading analytics data containing results of past trades for different strategies, including match data, odds, stakes, and profit/loss information

### Columns:
- **MATCH_ID**: Unique identifier for each match (links to other datasets)
- **Strategy_ID**: Identifier for the trading strategy used
- **placed_odd**: Odds at which the bet was placed
- **timestamp**: Timestamp when the analysis was performed
- **League**: Football league or competition
- **Date**: Match date
- **Home**: Home team name
- **Away**: Away team name
- **market**: Market type (home/away/over/under etc.)
- **PH**: Probability for home win
- **PD**: Probability for draw  
- **PA**: Probability for away win
- **Price**: Final price/odds used
- **PL**: Profit/Loss result for each trade
- **Stake**: Amount staked on the bet
- **STATUS**: Match status (FT = Full Time, etc.)
- **Res**: Match result - H is a home win, D is a draw, A is an away win
- **HG**: Home team goals in that match
- **AG**: Away team goals in that match
- **betType**: Type of bet placed
- **side**: Side of the bet (TEAM1/TEAM2/OVER/UNDER etc.)
- **handicap**: Handicap value if applicable
- **Odds**: Final odds value
- **traded**: Whether the trade was executed
- **Kelly_Staking_WeScore**: Kelly staking amount for WeScore model
- **Kelly_Staking_ProScore**: Kelly staking amount for ProScore model

*Note: This file contains many more columns for detailed analytics*

---

## How to Update Descriptions

To update the column descriptions in the MCP server:

1. Open `/Users/malte/workspace/mcp/src/index.ts`
2. Find the `CSV_METADATA` object
3. Update the descriptions in the `columns` section for each file
4. Run `npm run build` to recompile
5. Restart the MCP server

The descriptions will automatically appear in:
- `csv-info` tool output (detailed column info)
- `csv-schema` tool output (schema overview)
- `read-csv` tool output (in the summary section)

## Available MCP Tools

### Basic Tools:
1. **`read-csv`** - Read and display CSV contents with pagination (limit: 10 rows)
2. **`search-csv`** - Search for specific values in CSV data (limit: 100 results)
3. **`csv-info`** - Get CSV file structure and column information
4. **`csv-stats`** - Get statistical analysis of specific columns
5. **`filter-csv`** - Filter CSV data based on column values (limit: 100 results)
6. **`csv-schema`** - Get detailed column descriptions and metadata

### Advanced Analysis Tools:
7. **`filter-csv-advanced`** - Filter with multiple conditions and higher limits (up to 1000 results)
   - Supports multiple filters with AND logic
   - Different operators: equals, contains, starts_with, ends_with
   - Can select specific columns to return
   
8. **`count-csv-matches`** - Count matches without returning data
   - Perfect for queries like "How many MLS matches with Strategy_ID AI_390e3?"
   - Supports grouping for analysis
   - No data size limits - just returns counts

### Example Advanced Queries:
```
count-csv-matches with filters:
[
  {"column": "League", "value": "MLS", "operator": "equals"},
  {"column": "Strategy_ID", "value": "AI_390e3", "operator": "equals"}
]
```
