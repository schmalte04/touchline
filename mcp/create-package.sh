#!/bin/bash

# CSV MCP Server - Create Standalone Package
# This script creates a distributable package with Node.js bundled

set -e

echo "📦 Creating standalone CSV MCP Server package..."

PACKAGE_NAME="CSV-MCP-Server"
PACKAGE_DIR="./dist/$PACKAGE_NAME"
NODE_VERSION="20.11.0"

# Clean and create package directory
rm -rf ./dist
mkdir -p "$PACKAGE_DIR"

echo "📁 Preparing package structure..."

# Copy application files
cp -r src build package.json README.md tsconfig.json "$PACKAGE_DIR/"
cp *.csv "$PACKAGE_DIR/" 2>/dev/null || echo "No CSV files found to copy"

# Create package structure
mkdir -p "$PACKAGE_DIR/runtime"
mkdir -p "$PACKAGE_DIR/scripts"

# Download Node.js binary for macOS
echo "⬇️  Downloading Node.js runtime..."
if [[ $(uname -m) == "arm64" ]]; then
    NODE_ARCH="arm64"
else
    NODE_ARCH="x64"
fi

NODE_URL="https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-darwin-$NODE_ARCH.tar.gz"
NODE_TAR="node-v$NODE_VERSION-darwin-$NODE_ARCH.tar.gz"

cd "$PACKAGE_DIR/runtime"
curl -L "$NODE_URL" -o "$NODE_TAR"
tar -xzf "$NODE_TAR" --strip-components=1
rm "$NODE_TAR"
cd ../../..

echo "📦 Installing production dependencies..."
cd "$PACKAGE_DIR"
../runtime/bin/npm install --production --no-optional
cd ..

# Create launcher script
echo "🚀 Creating launcher script..."
cat > "$PACKAGE_DIR/scripts/launch.sh" << 'EOF'
#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

# Use bundled Node.js
NODE_BIN="$APP_DIR/runtime/bin/node"
SERVER_SCRIPT="$APP_DIR/build/index.js"

# Launch the server
exec "$NODE_BIN" "$SERVER_SCRIPT" "$@"
EOF

chmod +x "$PACKAGE_DIR/scripts/launch.sh"

# Create installer script for the package
cat > "$PACKAGE_DIR/install.sh" << 'EOF'
#!/bin/bash

set -e

echo "🚀 Installing CSV MCP Server..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="$HOME/.csv-mcp-server"
CONFIG_DIR="$HOME/Library/Application Support/Claude"
CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"

# Remove existing installation
if [ -d "$INSTALL_DIR" ]; then
    echo "🗑️  Removing existing installation..."
    rm -rf "$INSTALL_DIR"
fi

# Copy everything to installation directory
echo "📁 Installing to $INSTALL_DIR..."
cp -r "$SCRIPT_DIR" "$INSTALL_DIR"

# Make launcher executable
chmod +x "$INSTALL_DIR/scripts/launch.sh"

# Build if needed
cd "$INSTALL_DIR"
if [ ! -d "build" ] || [ ! -f "build/index.js" ]; then
    echo "🔨 Building server..."
    ./runtime/bin/npm run build
fi

# Create Claude Desktop config directory
mkdir -p "$CONFIG_DIR"

# Update or create Claude Desktop config
echo "⚙️  Configuring Claude Desktop..."

LAUNCHER_PATH="$INSTALL_DIR/scripts/launch.sh"

if [ -f "$CONFIG_FILE" ]; then
    # Backup existing config
    cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo "📄 Backed up existing Claude Desktop config"
    
    # Check if our server is already configured
    if grep -q "csv-server" "$CONFIG_FILE"; then
        echo "🔄 Updating existing csv-server configuration..."
        # Use Python to properly update JSON
        python3 -c "
import json
import sys

try:
    with open('$CONFIG_FILE', 'r') as f:
        config = json.load(f)
    
    if 'mcpServers' not in config:
        config['mcpServers'] = {}
    
    config['mcpServers']['csv-server'] = {
        'command': '$LAUNCHER_PATH',
        'args': []
    }
    
    with open('$CONFIG_FILE', 'w') as f:
        json.dump(config, f, indent=2)
    
    print('✅ Updated Claude Desktop configuration')
except Exception as e:
    print(f'❌ Error updating config: {e}')
    sys.exit(1)
"
    else
        echo "➕ Adding csv-server to existing configuration..."
        python3 -c "
import json
import sys

try:
    with open('$CONFIG_FILE', 'r') as f:
        config = json.load(f)
    
    if 'mcpServers' not in config:
        config['mcpServers'] = {}
    
    config['mcpServers']['csv-server'] = {
        'command': '$LAUNCHER_PATH',
        'args': []
    }
    
    with open('$CONFIG_FILE', 'w') as f:
        json.dump(config, f, indent=2)
    
    print('✅ Added csv-server to Claude Desktop configuration')
except Exception as e:
    print(f'❌ Error updating config: {e}')
    sys.exit(1)
"
    fi
else
    echo "📝 Creating new Claude Desktop config..."
    cat > "$CONFIG_FILE" << EOFCONFIG
{
  "mcpServers": {
    "csv-server": {
      "command": "$LAUNCHER_PATH",
      "args": []
    }
  }
}
EOFCONFIG
fi

# Create CSV data directory
echo "📊 Setting up CSV data directory..."
CSV_DATA_DIR="$HOME/csv-mcp-data"
mkdir -p "$CSV_DATA_DIR"

# Copy CSV files if they exist
for csv_file in "$INSTALL_DIR"/*.csv; do
    if [ -f "$csv_file" ]; then
        filename=$(basename "$csv_file")
        cp "$csv_file" "$CSV_DATA_DIR/"
        echo "📄 Copied $filename to $CSV_DATA_DIR"
    fi
done

# Update the server to look in the CSV data directory
if [ -f "$INSTALL_DIR/build/index.js" ]; then
    sed -i '' "s|process.cwd()|'$CSV_DATA_DIR'|g" "$INSTALL_DIR/build/index.js"
fi

# Create uninstaller
echo "🗑️  Creating uninstaller..."
cat > "$INSTALL_DIR/uninstall.sh" << 'EOFUNINSTALL'
#!/bin/bash

echo "🗑️  Uninstalling CSV MCP Server..."

INSTALL_DIR="$HOME/.csv-mcp-server"
CONFIG_FILE="$HOME/Library/Application Support/Claude/claude_desktop_config.json"

# Remove from Claude Desktop config
if [ -f "$CONFIG_FILE" ]; then
    echo "⚙️  Removing from Claude Desktop config..."
    python3 -c "
import json
import sys

try:
    with open('$CONFIG_FILE', 'r') as f:
        config = json.load(f)
    
    if 'mcpServers' in config and 'csv-server' in config['mcpServers']:
        del config['mcpServers']['csv-server']
        
        # If mcpServers is now empty, remove it
        if not config['mcpServers']:
            del config['mcpServers']
    
    with open('$CONFIG_FILE', 'w') as f:
        json.dump(config, f, indent=2)
    
    print('✅ Removed csv-server from Claude Desktop config')
except Exception as e:
    print(f'⚠️  Could not modify config: {e}')
" 2>/dev/null || echo "⚠️  Could not modify Claude Desktop config automatically"
fi

# Remove installation directory
if [ -d "$INSTALL_DIR" ]; then
    rm -rf "$INSTALL_DIR"
    echo "✅ Removed installation directory"
fi

echo "🎉 CSV MCP Server uninstalled successfully!"
echo "💡 You may need to restart Claude Desktop for changes to take effect."
EOFUNINSTALL

chmod +x "$INSTALL_DIR/uninstall.sh"

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
echo "3. The csv-server should now be available in Claude Desktop"
echo ""
echo "🗑️  To uninstall: $INSTALL_DIR/uninstall.sh"
echo ""
echo "💡 If you encounter issues, check the Claude Desktop logs in Console.app"
EOF

chmod +x "$PACKAGE_DIR/install.sh"

# Create README for the package
cat > "$PACKAGE_DIR/README.txt" << 'EOF'
CSV MCP Server - Standalone Package
==================================

This package contains everything needed to run the CSV MCP Server on macOS,
including a bundled Node.js runtime.

Installation:
1. Double-click install.sh (or run ./install.sh in Terminal)
2. Place your CSV files in ~/csv-mcp-data/
3. Restart Claude Desktop

The server will be available as "csv-server" in Claude Desktop.

Features:
- Read CSV data with pagination
- Search CSV content
- Get CSV structure information
- Statistical analysis of columns
- Filter data by column values

Uninstallation:
Run the uninstaller at ~/.csv-mcp-server/uninstall.sh

For support, see the full README.md file.
EOF

cd ..

# Create distributable archive
echo "📦 Creating distributable archive..."
cd dist
tar -czf "$PACKAGE_NAME-standalone.tar.gz" "$PACKAGE_NAME"
zip -r "$PACKAGE_NAME-standalone.zip" "$PACKAGE_NAME" > /dev/null

echo ""
echo "🎉 Standalone package created successfully!"
echo ""
echo "📦 Package location: ./dist/$PACKAGE_NAME"
echo "📁 Archives created:"
echo "   - ./dist/$PACKAGE_NAME-standalone.tar.gz"
echo "   - ./dist/$PACKAGE_NAME-standalone.zip"
echo ""
echo "📋 To distribute:"
echo "1. Send the .zip or .tar.gz file to your colleague"
echo "2. They should extract it and run ./install.sh"
echo "3. No Node.js installation required!"
EOF

chmod +x /Users/malte/workspace/mcp/create-package.sh
