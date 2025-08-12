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
