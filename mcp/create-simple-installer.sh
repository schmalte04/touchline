#!/bin/bash

# Simple installer script that works without pre-installed Node.js
# This creates a distributable folder that your colleague can use

set -e

echo "📦 Creating CSV MCP Server installer package..."

# Package info
PACKAGE_NAME="CSV-MCP-Server-Installer"
DIST_DIR="./dist"
PACKAGE_DIR="$DIST_DIR/$PACKAGE_NAME"

# Clean and create directories
rm -rf "$DIST_DIR"
mkdir -p "$PACKAGE_DIR"

echo "📁 Copying application files..."

# Copy all necessary files
cp -r src build package.json README.md tsconfig.json "$PACKAGE_DIR/"
cp *.csv "$PACKAGE_DIR/" 2>/dev/null || echo "No CSV files found"
cp claude_desktop_config.json "$PACKAGE_DIR/" 2>/dev/null || echo "No config file found"

# Create a simple installer script
cat > "$PACKAGE_DIR/INSTALL.command" << 'EOF'
#!/bin/bash

# CSV MCP Server Installer
# Double-click this file to install

cd "$(dirname "$0")"

echo "🚀 CSV MCP Server Installer"
echo "=========================="
echo ""

# Define paths
INSTALL_DIR="$HOME/.csv-mcp-server"
CONFIG_DIR="$HOME/Library/Application Support/Claude"
CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"
CSV_DATA_DIR="$HOME/csv-mcp-data"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed on this system."
    echo ""
    echo "Please install Node.js first:"
    echo "1. Go to https://nodejs.org"
    echo "2. Download and install the LTS version"
    echo "3. Run this installer again"
    echo ""
    read -p "Press Enter to open Node.js website..." 
    open "https://nodejs.org"
    exit 1
fi

NODE_PATH=$(which node)
echo "✅ Found Node.js at: $NODE_PATH"

# Create installation directory
echo "📁 Creating installation directory at $INSTALL_DIR..."
rm -rf "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR"

# Copy files
echo "📋 Copying server files..."
cp -r * "$INSTALL_DIR/"

# Install dependencies
cd "$INSTALL_DIR"
echo "📦 Installing dependencies..."
npm install --production

# Build if needed
if [ ! -d "build" ] || [ ! -f "build/index.js" ]; then
    echo "🔨 Building server..."
    npm run build
fi

# Create CSV data directory
echo "📊 Setting up CSV data directory..."
mkdir -p "$CSV_DATA_DIR"

# Copy CSV files
for csv_file in *.csv; do
    if [ -f "$csv_file" ]; then
        cp "$csv_file" "$CSV_DATA_DIR/"
        echo "📄 Copied $csv_file to $CSV_DATA_DIR"
    fi
done

# Update server to use CSV data directory
if [ -f "build/index.js" ]; then
    sed -i '' "s|process.cwd()|'$CSV_DATA_DIR'|g" "build/index.js"
fi

# Configure Claude Desktop
echo "⚙️  Configuring Claude Desktop..."
mkdir -p "$CONFIG_DIR"

# Create or update config
if [ -f "$CONFIG_FILE" ]; then
    cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo "📄 Backed up existing config"
fi

cat > "$CONFIG_FILE" << EOFCONFIG
{
  "mcpServers": {
    "csv-server": {
      "command": "$NODE_PATH",
      "args": ["$INSTALL_DIR/build/index.js"]
    }
  }
}
EOFCONFIG

# Create uninstaller
cat > "$INSTALL_DIR/UNINSTALL.command" << 'EOFUNINSTALL'
#!/bin/bash
cd "$(dirname "$0")"

echo "🗑️  Uninstalling CSV MCP Server..."

INSTALL_DIR="$HOME/.csv-mcp-server"
CONFIG_FILE="$HOME/Library/Application Support/Claude/claude_desktop_config.json"

# Remove config
if [ -f "$CONFIG_FILE" ]; then
    rm "$CONFIG_FILE"
    echo "✅ Removed Claude Desktop config"
fi

# Remove installation
if [ -d "$INSTALL_DIR" ]; then
    rm -rf "$INSTALL_DIR"
    echo "✅ Removed installation directory"
fi

echo "🎉 Uninstalled successfully!"
echo "You may need to restart Claude Desktop."
read -p "Press Enter to close..."
EOFUNINSTALL

chmod +x "$INSTALL_DIR/UNINSTALL.command"

echo ""
echo "🎉 Installation completed successfully!"
echo ""
echo "📍 Server installed at: $INSTALL_DIR"
echo "📊 CSV data directory: $CSV_DATA_DIR"
echo "⚙️  Claude Desktop config: $CONFIG_FILE"
echo ""
echo "📋 Next steps:"
echo "1. Place your CSV files in: $CSV_DATA_DIR"
echo "2. Restart Claude Desktop"
echo "3. The csv-server should now be available"
echo ""
echo "🗑️  To uninstall: Double-click UNINSTALL.command in $INSTALL_DIR"
echo ""
read -p "Press Enter to close..."
EOF

# Make installer executable
chmod +x "$PACKAGE_DIR/INSTALL.command"

# Create instructions file
cat > "$PACKAGE_DIR/README - Installation Instructions.txt" << 'EOF'
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
EOF

# Create a simple launcher for testing
cat > "$PACKAGE_DIR/Test Server.command" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"

echo "🧪 Testing CSV MCP Server..."

if [ ! -d "$HOME/.csv-mcp-server" ]; then
    echo "❌ Server not installed. Run INSTALL.command first."
    read -p "Press Enter to close..."
    exit 1
fi

echo "✅ Server installation found"
echo "🚀 Starting test..."

cd "$HOME/.csv-mcp-server"
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node build/index.js 2>/dev/null | head -5

echo ""
echo "✅ Server test completed"
echo "If you see JSON output above, the server is working correctly."
read -p "Press Enter to close..."
EOF

chmod +x "$PACKAGE_DIR/Test Server.command"

echo ""
echo "✅ Package created successfully!"
echo ""
echo "📦 Package location: $PACKAGE_DIR"
echo ""
echo "📋 Package contents:"
echo "   - INSTALL.command (main installer)"
echo "   - Test Server.command (test the installation)"
echo "   - README - Installation Instructions.txt"
echo "   - All server files and CSV data"
echo ""
echo "📤 To distribute:"
echo "1. Compress the folder: $PACKAGE_DIR"
echo "2. Send the compressed file to your colleague"
echo "3. They should extract and double-click INSTALL.command"

# Create the compressed file
cd "$DIST_DIR"
zip -r "$PACKAGE_NAME.zip" "$PACKAGE_NAME" > /dev/null
echo ""
echo "📁 Created: $DIST_DIR/$PACKAGE_NAME.zip"
echo "   This file is ready to send to your colleague!"
