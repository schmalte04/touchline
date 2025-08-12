# CSV MCP Server

An MCP (Model Context Protocol) server that provides Claude Desktop with access to CSV file data for reading, searching, and analysis.

## Features

- **Read CSV Data**: View CSV contents with pagination support
- **Search CSV**: Search for specific values across all columns or within specific columns
- **CSV Information**: Get detailed information about CSV structure, columns, and data types
- **Column Statistics**: Get statistical analysis for numeric columns (min, max, average, etc.)
- **Filter Data**: Filter CSV rows based on column values with partial matching

## Setup

1. **Place your CSV file**: Put your `Rawdata_Total.csv` file in the project root directory
2. **Build the project**: Run `npm run build`
3. **Configure Claude Desktop**: Add the server configuration to your Claude Desktop config

## Available Tools

### 1. read-csv
Read and display CSV contents with optional pagination.
- `limit`: Maximum number of rows to return (default: 10)
- `offset`: Number of rows to skip (default: 0)

### 2. search-csv
Search for specific values in the CSV data.
- `query`: Search term to look for
- `column`: Specific column to search in (optional, searches all columns if not specified)
- `limit`: Maximum number of results to return (default: 10)

### 3. csv-info
Get information about the CSV file structure and columns.
Returns file information, column names, sample values, and basic statistics.

### 4. csv-stats
Get statistical analysis of a specific column.
- `column`: Name of the column to analyze

### 5. filter-csv
Filter CSV data based on column values.
- `column`: Name of the column to filter by
- `value`: Value to filter for (partial match)
- `limit`: Maximum number of results to return (default: 10)

## Claude Desktop Configuration

Add this configuration to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "csv-server": {
      "command": "node",
      "args": ["/absolute/path/to/your/project/build/index.js"]
    }
  }
}
```

Replace `/absolute/path/to/your/project` with the actual path to this project directory.

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev
```

## File Structure

```
.
├── src/
│   └── index.ts          # Main MCP server implementation
├── build/                # Compiled JavaScript output
├── .github/
│   └── copilot-instructions.md
├── .vscode/
│   └── mcp.json         # VS Code MCP configuration
├── package.json
├── tsconfig.json
├── README.md
└── Rawdata_Total.csv    # Your CSV file (place here)
```

## Usage with Claude Desktop

Once configured, you can use natural language commands in Claude Desktop like:

- "Show me the first 20 rows of the CSV"
- "Search for 'example' in the data"
- "What columns are available in the CSV?"
- "Give me statistics for the price column"
- "Filter the data where category contains 'electronics'"

The server will automatically handle the CSV parsing and return formatted results that Claude can interpret and present to you in a user-friendly way.
