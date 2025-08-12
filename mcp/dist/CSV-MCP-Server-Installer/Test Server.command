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
