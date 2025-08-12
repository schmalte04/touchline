CSV MCP Server - Installation Instructions
==========================================

This package allows you to add CSV file analysis capabilities to Claude Desktop.

REQUIREMENTS:
- macOS (tested on macOS 10.14+)
- Node.js (the installer will guide you if not installed)
- Claude Desktop application

INSTALLATION:
1. Double-click "INSTALL.command"
2. Follow the on-screen instructions
3. If Node.js is not installed, the installer will direct you to download it
4. After installation, restart Claude Desktop

USAGE:
1. Place your CSV files in: ~/csv-mcp-data/
2. Open Claude Desktop
3. You can now ask Claude to:
   - "Read the first 10 rows of my CSV"
   - "Search for data containing 'example'"
   - "Show me information about the CSV structure"
   - "Get statistics for the 'price' column"
   - "Filter data where category contains 'electronics'"

UNINSTALLATION:
Double-click the UNINSTALL.command file that will be created in ~/.csv-mcp-server/

TROUBLESHOOTING:
- If Claude Desktop doesn't show the server, restart the application
- Check Console.app for any error messages
- Ensure your CSV files are in ~/csv-mcp-data/
- Make sure Claude Desktop has necessary permissions

For technical support, refer to the README.md file.
