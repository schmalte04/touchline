#!/bin/bash

# CSV MCP Server Installer
# This script installs the CSV MCP Server on macOS

set -e

echo "🚀 Installing CSV MCP Server..."

# Define installation directory
INSTALL_DIR="$HOME/.csv-mcp-server"
CONFIG_DIR="$HOME/Library/Application Support/Claude"
CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"

# Create installation directory
echo "📁 Creating installation directory..."
mkdir -p "$INSTALL_DIR"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "📦 Node.js not found. Installing Node.js..."
    
    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
        echo "🍺 Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        # Add Homebrew to PATH for current session
        if [[ $(uname -m) == "arm64" ]]; then
            export PATH="/opt/homebrew/bin:$PATH"
        else
            export PATH="/usr/local/bin:$PATH"
        fi
    fi
    
    # Install Node.js
    brew install node
fi

# Get Node.js path
NODE_PATH=$(which node)
echo "✅ Using Node.js at: $NODE_PATH"

# Copy server files
echo "📋 Copying server files..."
cp -r "$(dirname "$0")"/* "$INSTALL_DIR/"

# Install dependencies if not already installed
cd "$INSTALL_DIR"
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --production
fi

# Build the server if build directory doesn't exist
if [ ! -d "build" ] || [ ! -f "build/index.js" ]; then
    echo "🔨 Building server..."
    npm run build
fi

# Create Claude Desktop config directory
mkdir -p "$CONFIG_DIR"

# Update or create Claude Desktop config
echo "⚙️  Configuring Claude Desktop..."

if [ -f "$CONFIG_FILE" ]; then
    # Backup existing config
    cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo "📄 Backed up existing Claude Desktop config"
    
    # Check if our server is already configured
    if grep -q "csv-server" "$CONFIG_FILE"; then
        echo "🔄 Updating existing csv-server configuration..."
        # Use sed to update the command path
        sed -i '' "s|\"command\": \".*\"|\"command\": \"$NODE_PATH\"|g" "$CONFIG_FILE"
        sed -i '' "s|\"args\": \\[\".*\"\\]|\"args\": [\"$INSTALL_DIR/build/index.js\"]|g" "$CONFIG_FILE"
    else
        echo "➕ Adding csv-server to existing configuration..."
        # Remove the closing brace, add our server, then close
        sed -i '' '$d' "$CONFIG_FILE"
        cat >> "$CONFIG_FILE" << EOF
    "csv-server": {
      "command": "$NODE_PATH",
      "args": ["$INSTALL_DIR/build/index.js"]
    }
  }
}
EOF
    fi
else
    echo "📝 Creating new Claude Desktop config..."
    cat > "$CONFIG_FILE" << EOF
{
  "mcpServers": {
    "csv-server": {
      "command": "$NODE_PATH",
      "args": ["$INSTALL_DIR/build/index.js"]
    }
  }
}
EOF
fi

# Create uninstaller
echo "🗑️  Creating uninstaller..."
cat > "$INSTALL_DIR/uninstall.sh" << 'EOF'
#!/bin/bash

echo "🗑️  Uninstalling CSV MCP Server..."

INSTALL_DIR="$HOME/.csv-mcp-server"
CONFIG_FILE="$HOME/Library/Application Support/Claude/claude_desktop_config.json"

# Remove from Claude Desktop config
if [ -f "$CONFIG_FILE" ]; then
    echo "⚙️  Removing from Claude Desktop config..."
    # Create a temporary file without the csv-server section
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
EOF

chmod +x "$INSTALL_DIR/uninstall.sh"

# Create CSV data directory and symlink
echo "📊 Setting up CSV data directory..."
CSV_DATA_DIR="$HOME/csv-mcp-data"
mkdir -p "$CSV_DATA_DIR"

# Copy CSV files if they exist
for csv_file in *.csv; do
    if [ -f "$csv_file" ]; then
        cp "$csv_file" "$CSV_DATA_DIR/"
        echo "📄 Copied $csv_file to $CSV_DATA_DIR"
    fi
done

# Update the server to look in the CSV data directory
sed -i '' "s|process.cwd()|'$CSV_DATA_DIR'|g" "$INSTALL_DIR/build/index.js"

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
