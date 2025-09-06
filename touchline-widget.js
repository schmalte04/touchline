(function() {
    'use strict';
    
    // Configuration
    const config = window.TouchlineConfig || {};
    const position = config.position || 'bottom-right';
    const theme = config.theme || 'dark';
    const primaryColor = config.primaryColor || '#4ECDC4';
    const apiUrl = config.apiUrl || 'https://shark-app-robkv.ondigitalocean.app';
    const zIndex = config.zIndex || 10000;
    const openByDefault = config.openByDefault || false;
    
    // Widget HTML template
    const widgetHTML = `
        <div class="touchline-widget ${theme}-theme" data-position="${position}">
            <div class="widget-bubble" id="touchline-bubble">
                <div class="widget-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V19C3 20.11 3.89 21 5 21H11V19H5V3H13V9H21ZM18 23L16.5 18.5H15.5L17 23H18ZM22 23L20.5 18.5H19.5L21 23H22ZM19.5 17.5H16.5L18 13L19.5 17.5Z"/>
                    </svg>
                </div>
                <div class="widget-pulse"></div>
                <div class="widget-badge">AI</div>
            </div>
            
            <div class="widget-chat" id="touchline-chat">
                <div class="widget-header">
                    <div class="widget-header-content">
                        <div class="widget-title">
                            <span class="widget-logo">⚽</span>
                            <span>Turboscores AI Assistant</span>
                        </div>
                        <div class="widget-subtitle">Ask me about betting insights</div>
                    </div>
                    <button class="widget-close" id="touchline-close">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                        </svg>
                    </button>
                </div>
                
                <div class="widget-messages" id="touchline-messages">
                    <div class="widget-message bot-message">
                        <div class="message-avatar">🤖</div>
                        <div class="message-content">
                            <div class="message-text">
                                👋 <strong>Hi! I'm your AI betting assistant.</strong><br><br>
                                I can help you with:
                                <br>• 🏈 Match analysis & predictions
                                <br>• 🎲 Building accumulators
                                <br>• ⭐ High confidence picks
                                <br>• 📊 Live odds analysis
                                <br><br>
                                Try asking: <em>"Show me today's best bets"</em>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="widget-quick-actions">
                    <button class="quick-action-btn" data-action="upcoming">📅 Upcoming Matches</button>
                    <button class="quick-action-btn" data-action="accumulator">🎲 Build Accumulator</button>
                    <button class="quick-action-btn" data-action="confidence">⭐ Best Picks</button>
                </div>
                
                <div class="widget-input-container">
                    <div class="widget-typing" id="touchline-typing" style="display: none;">
                        <div class="typing-dots">
                            <span></span><span></span><span></span>
                        </div>
                        <span>AI is analyzing...</span>
                    </div>
                    <div class="widget-input">
                        <input type="text" id="touchline-input" placeholder="Ask me about betting..." maxlength="500">
                        <button class="widget-send" id="touchline-send">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="widget-footer">
                    <span>Powered by <strong>GainR.ai</strong></span>
                </div>
            </div>
        </div>
    `;
    
    // CSS Styles
    const widgetCSS = `
        .touchline-widget {
            position: fixed;
            z-index: ${zIndex};
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.4;
        }
        
        .touchline-widget[data-position="bottom-right"] {
            bottom: 20px;
            right: 20px;
        }
        
        .touchline-widget[data-position="bottom-left"] {
            bottom: 20px;
            left: 20px;
        }
        
        .touchline-widget[data-position="top-right"] {
            top: 20px;
            right: 20px;
        }
        
        .touchline-widget[data-position="top-left"] {
            top: 20px;
            left: 20px;
        }
        
        .widget-bubble {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, ${primaryColor}, #6C5CE7);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
            color: white;
        }
        
        .widget-bubble:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 25px rgba(0,0,0,0.2);
        }
        
        .widget-icon {
            width: 28px;
            height: 28px;
        }
        
        .widget-pulse {
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            border-radius: 50%;
            border: 2px solid ${primaryColor};
            animation: pulse 2s infinite;
            opacity: 0.6;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.1); opacity: 0.3; }
            100% { transform: scale(1); opacity: 0.6; }
        }
        
        .widget-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            background: #FF6B6B;
            color: white;
            font-size: 10px;
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 10px;
            border: 2px solid white;
        }
        
        .widget-chat {
            width: 480px;
            height: 600px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            display: none;
            flex-direction: column;
            position: absolute;
            bottom: 80px;
            right: 0;
            overflow: hidden;
        }
        
        .touchline-widget[data-position="bottom-left"] .widget-chat,
        .touchline-widget[data-position="top-left"] .widget-chat {
            right: auto;
            left: 0;
        }
        
        .touchline-widget[data-position="top-right"] .widget-chat,
        .touchline-widget[data-position="top-left"] .widget-chat {
            bottom: auto;
            top: 80px;
        }
        
        .dark-theme .widget-chat {
            background: #2C3E50;
            color: white;
        }
        
        .widget-header {
            background: linear-gradient(135deg, ${primaryColor}, #6C5CE7);
            color: white;
            padding: 16px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .widget-title {
            font-weight: 600;
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .widget-logo {
            font-size: 18px;
        }
        
        .widget-subtitle {
            font-size: 12px;
            opacity: 0.9;
            margin-top: 2px;
        }
        
        .widget-close {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .widget-close:hover {
            background: rgba(255,255,255,0.1);
        }
        
        .widget-messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            background: #f8f9fa;
        }
        
        .dark-theme .widget-messages {
            background: #34495E;
        }
        
        .widget-message {
            display: flex;
            margin-bottom: 16px;
            animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .message-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: linear-gradient(135deg, ${primaryColor}, #6C5CE7);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            margin-right: 12px;
            flex-shrink: 0;
        }
        
        .user-message .message-avatar {
            background: #95A5A6;
        }
        
        .message-content {
            flex: 1;
        }
        
        .message-text {
            background: white;
            padding: 12px 16px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            line-height: 1.5;
        }
        
        .dark-theme .message-text {
            background: #2C3E50;
            color: white;
        }
        
        .user-message .message-text {
            background: linear-gradient(135deg, ${primaryColor}, #6C5CE7);
            color: white;
        }
        
        /* Table styling for better data presentation */
        .message-text table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0;
            font-size: 11px;
            background: white;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .message-text th,
        .message-text td {
            padding: 6px 8px;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
            word-wrap: break-word;
            max-width: 80px;
        }
        
        .message-text th {
            background: #f8f9fa;
            font-weight: 600;
            color: #495057;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .message-text tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        .message-text tr:hover {
            background: #e9ecef;
        }
        
        .message-text tr:last-child td {
            border-bottom: none;
        }
        
        /* Handle pre-formatted text better */
        .message-text pre {
            background: #f8f9fa;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 11px;
            line-height: 1.4;
            overflow-x: auto;
            white-space: pre-wrap;
            word-break: break-word;
            border-left: 3px solid ${primaryColor};
        }
        
        /* Dark theme table adjustments */
        .dark-theme .message-text table {
            background: #34495e;
        }
        
        .dark-theme .message-text th {
            background: #2c3e50;
            color: #ecf0f1;
        }
        
        .dark-theme .message-text tr:nth-child(even) {
            background: #2c3e50;
        }
        
        .dark-theme .message-text tr:hover {
            background: #34495e;
        }
        
        .dark-theme .message-text pre {
            background: #2c3e50;
            color: #ecf0f1;
        }
        
        .widget-quick-actions {
            padding: 16px 20px;
            background: #f8f9fa;
            border-top: 1px solid #e9ecef;
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        
        .dark-theme .widget-quick-actions {
            background: #34495E;
            border-color: #2C3E50;
        }
        
        .quick-action-btn {
            background: white;
            border: 1px solid #e9ecef;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
        }
        
        .dark-theme .quick-action-btn {
            background: #2C3E50;
            color: white;
            border-color: #34495E;
        }
        
        .quick-action-btn:hover {
            background: ${primaryColor};
            color: white;
            border-color: ${primaryColor};
        }
        
        .widget-input-container {
            position: relative;
        }
        
        .widget-typing {
            padding: 12px 20px;
            background: #f8f9fa;
            border-top: 1px solid #e9ecef;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            color: #6c757d;
        }
        
        .dark-theme .widget-typing {
            background: #34495E;
            border-color: #2C3E50;
            color: #BDC3C7;
        }
        
        .typing-dots {
            display: flex;
            gap: 2px;
        }
        
        .typing-dots span {
            width: 4px;
            height: 4px;
            background: ${primaryColor};
            border-radius: 50%;
            animation: typingDots 1.4s infinite ease-in-out;
        }
        
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        
        @keyframes typingDots {
            0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
            40% { transform: scale(1); opacity: 1; }
        }
        
        .widget-input {
            display: flex;
            padding: 16px 20px;
            background: white;
            border-top: 1px solid #e9ecef;
        }
        
        .dark-theme .widget-input {
            background: #2C3E50;
            border-color: #34495E;
        }
        
        .widget-input input {
            flex: 1;
            border: 1px solid #e9ecef;
            border-radius: 20px;
            padding: 10px 16px;
            font-size: 14px;
            outline: none;
            background: #f8f9fa;
        }
        
        .dark-theme .widget-input input {
            background: #34495E;
            border-color: #2C3E50;
            color: white;
        }
        
        .widget-input input:focus {
            border-color: ${primaryColor};
            background: white;
        }
        
        .dark-theme .widget-input input:focus {
            background: #2C3E50;
        }
        
        .widget-send {
            background: ${primaryColor};
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            margin-left: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            transition: all 0.2s ease;
        }
        
        .widget-send:hover {
            transform: scale(1.1);
        }
        
        .widget-send svg {
            width: 18px;
            height: 18px;
        }
        
        .widget-footer {
            padding: 8px 20px;
            background: #f8f9fa;
            text-align: center;
            font-size: 11px;
            color: #6c757d;
            border-top: 1px solid #e9ecef;
        }
        
        .dark-theme .widget-footer {
            background: #34495E;
            color: #BDC3C7;
            border-color: #2C3E50;
        }
        
        .widget-expanded .widget-chat {
            display: flex;
        }
        
        .widget-expanded .widget-bubble {
            display: none;
        }
        
        @media (max-width: 520px) {
            .widget-chat {
                width: calc(100vw - 40px);
                height: calc(100vh - 40px);
                bottom: 20px;
                right: 20px;
                left: 20px;
                top: 20px;
            }
            
            .touchline-widget[data-position="bottom-left"] .widget-chat,
            .touchline-widget[data-position="top-left"] .widget-chat,
            .touchline-widget[data-position="top-right"] .widget-chat {
                right: 20px;
                left: 20px;
                top: 20px;
                bottom: 20px;
            }
        }
    `;
    
    // Initialize widget
    function initWidget() {
        // Create style element
        const style = document.createElement('style');
        style.textContent = widgetCSS;
        document.head.appendChild(style);
        
        // Create widget container
        const container = document.getElementById('touchline-widget') || document.body;
        container.insertAdjacentHTML('beforeend', widgetHTML);
        
        // Get widget elements
        const widget = document.querySelector('.touchline-widget');
        const bubble = document.getElementById('touchline-bubble');
        const chat = document.getElementById('touchline-chat');
        const closeBtn = document.getElementById('touchline-close');
        const input = document.getElementById('touchline-input');
        const sendBtn = document.getElementById('touchline-send');
        const messages = document.getElementById('touchline-messages');
        const typing = document.getElementById('touchline-typing');
        
        // State
        let isExpanded = false;
        
        // Event handlers
        bubble.addEventListener('click', () => {
            isExpanded = true;
            widget.classList.add('widget-expanded');
        });
        
        closeBtn.addEventListener('click', () => {
            isExpanded = false;
            widget.classList.remove('widget-expanded');
        });
        
        // Open by default if configured
        if (openByDefault) {
            setTimeout(() => {
                isExpanded = true;
                widget.classList.add('widget-expanded');
            }, 1000); // Small delay to let the page load
        }
        
        // Quick actions
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                let message = '';
                
                switch(action) {
                    case 'upcoming':
                        message = 'Show me interesting upcoming matches for betting';
                        break;
                    case 'accumulator':
                        message = 'Help me build a smart accumulator';
                        break;
                    case 'confidence':
                        message = 'Show me high confidence betting picks for today';
                        break;
                }
                
                if (message) {
                    sendMessage(message);
                }
            });
        });
        
        // Send message
        function sendMessage(text = null) {
            const message = text || input.value.trim();
            if (!message) return;
            
            // Add user message
            addMessage(message, 'user');
            input.value = '';
            
            // Show typing indicator
            typing.style.display = 'flex';
            scrollToBottom();
            
            // Call API
            callAPI(message);
        }
        
        // Add message to chat
        function addMessage(text, type = 'bot') {
            // Process text to convert markdown tables to HTML
            let processedText = text;
            if (type === 'bot') {
                console.log('🚀 Processing bot message for tables...');
                console.log('🔍 Original text:', text);
                
                processedText = formatMarkdownTables(text);
                console.log('📝 After formatMarkdownTables:', processedText);
                
                // Force check if we have any pipe characters that should be tables
                if (text.includes('|') && processedText === text) {
                    console.log('⚠️ Text contains pipes but no conversion happened, forcing simple conversion...');
                    processedText = forceTableConversion(text);
                    console.log('🔧 After forceTableConversion:', processedText);
                }
                
                // Additional fallback - check if we still have pipes
                if (processedText.includes('|') && !processedText.includes('<table>')) {
                    console.log('🚨 Still has pipes but no table HTML, applying emergency conversion...');
                    processedText = emergencyTableConversion(processedText);
                    console.log('🆘 After emergency conversion:', processedText);
                }
            }
            
            // Create message element
            const messageDiv = document.createElement('div');
            messageDiv.className = `widget-message ${type}-message`;
            
            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'message-avatar';
            avatarDiv.textContent = type === 'user' ? '👤' : '🤖';
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            
            const textDiv = document.createElement('div');
            textDiv.className = 'message-text';
            
            // Insert HTML directly to preserve table structure
            textDiv.innerHTML = processedText;
            
            contentDiv.appendChild(textDiv);
            messageDiv.appendChild(avatarDiv);
            messageDiv.appendChild(contentDiv);
            
            messages.appendChild(messageDiv);
            scrollToBottom();
        }
        
        // Emergency table conversion - most aggressive approach
        function emergencyTableConversion(text) {
            console.log('🆘 Emergency table conversion started');
            
            // Split into lines and find any line with multiple pipes
            const lines = text.split('\n');
            const processedLines = [];
            
            let currentTableLines = [];
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                // Check if line has multiple pipes (potential table)
                if (line.includes('|') && line.split('|').length >= 3) {
                    currentTableLines.push(line);
                } else {
                    // Process any accumulated table lines
                    if (currentTableLines.length > 0) {
                        const tableHtml = bruteForcePipeToTable(currentTableLines);
                        processedLines.push(tableHtml);
                        currentTableLines = [];
                    }
                    
                    // Add non-table line
                    if (line.length > 0) {
                        processedLines.push(line);
                    }
                }
            }
            
            // Handle any remaining table lines
            if (currentTableLines.length > 0) {
                const tableHtml = bruteForcePipeToTable(currentTableLines);
                processedLines.push(tableHtml);
            }
            
            return processedLines.join('<br>');
        }
        
        // Brute force pipe to table conversion
        function bruteForcePipeToTable(lines) {
            console.log('💥 Brute force conversion:', lines);
            
            if (lines.length === 0) return '';
            
            // Remove separator lines and clean data
            const cleanLines = lines.filter(line => {
                const cleaned = line.replace(/[\s\-]/g, '');
                return cleaned !== '' && !cleaned.match(/^[\|]+$/);
            });
            
            if (cleanLines.length < 1) return lines.join('<br>');
            
            // Parse each line
            const tableRows = cleanLines.map(line => {
                // Clean the line and split by pipes
                let clean = line.trim();
                if (clean.startsWith('|')) clean = clean.substring(1);
                if (clean.endsWith('|')) clean = clean.substring(0, clean.length - 1);
                
                return clean.split('|').map(cell => cell.trim());
            });
            
            console.log('🔨 Parsed table rows:', tableRows);
            
            // Build HTML table
            let html = '<table style="width:100%; border-collapse: collapse; margin: 8px 0;">';
            
            // First row as header
            if (tableRows.length > 0) {
                html += '<thead><tr>';
                tableRows[0].forEach(cell => {
                    html += `<th style="padding: 6px 8px; border: 1px solid #ddd; background: #f5f5f5;">${cell || ''}</th>`;
                });
                html += '</tr></thead>';
            }
            
            // Data rows
            if (tableRows.length > 1) {
                html += '<tbody>';
                for (let i = 1; i < tableRows.length; i++) {
                    html += '<tr>';
                    tableRows[i].forEach(cell => {
                        html += `<td style="padding: 6px 8px; border: 1px solid #ddd;">${cell || ''}</td>`;
                    });
                    html += '</tr>';
                }
                html += '</tbody>';
            }
            
            html += '</table>';
            
            console.log('💪 Brute force result:', html);
            return html;
        }
        
        // Force table conversion for any text with pipes
        function forceTableConversion(text) {
            console.log('🔧 Force converting pipes to table...');
            
            const lines = text.split('\n');
            let result = [];
            let tableLines = [];
            
            for (const line of lines) {
                if (line.includes('|') && line.split('|').length > 2) {
                    tableLines.push(line.trim());
                } else {
                    // Non-table line
                    if (tableLines.length > 0) {
                        // Convert accumulated table lines
                        const tableHtml = simpleTableConvert(tableLines);
                        result.push(tableHtml);
                        tableLines = [];
                    }
                    result.push(line);
                }
            }
            
            // Handle remaining table lines
            if (tableLines.length > 0) {
                const tableHtml = simpleTableConvert(tableLines);
                result.push(tableHtml);
            }
            
            return result.join('\n');
        }
        
        // Simple table conversion
        function simpleTableConvert(lines) {
            if (lines.length < 2) return lines.join('\n');
            
            console.log('🔨 Simple table convert:', lines);
            
            // Filter out separator lines
            const dataLines = lines.filter(line => !line.match(/^[\|\s\-]+$/));
            
            if (dataLines.length < 2) return lines.join('\n');
            
            const rows = dataLines.map(line => {
                return line.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
            });
            
            let html = '<table><thead><tr>';
            rows[0].forEach(header => {
                html += `<th>${header}</th>`;
            });
            html += '</tr></thead><tbody>';
            
            for (let i = 1; i < rows.length; i++) {
                html += '<tr>';
                rows[i].forEach(cell => {
                    html += `<td>${cell}</td>`;
                });
                html += '</tr>';
            }
            
            html += '</tbody></table>';
            console.log('🎉 Simple table result:', html);
            return html;
        }
        
        // Convert markdown-style tables to HTML tables
        function formatMarkdownTables(text) {
            console.log('🔍 Table parsing input:', text);
            
            // More aggressive approach - look for any lines with multiple pipes
            const lines = text.split('\n');
            let result = [];
            let i = 0;
            
            while (i < lines.length) {
                const line = lines[i].trim();
                
                // Check if this line has multiple pipes (potential table row)
                const pipeCount = (line.match(/\|/g) || []).length;
                
                if (pipeCount >= 2 && line.includes('|')) {
                    console.log('🎯 Found potential table line:', line);
                    
                    // Look ahead to find consecutive table lines
                    const tableLines = [];
                    let j = i;
                    
                    while (j < lines.length) {
                        const currentLine = lines[j].trim();
                        const currentPipes = (currentLine.match(/\|/g) || []).length;
                        
                        if (currentPipes >= 2 && currentLine.includes('|')) {
                            // Skip separator lines (lines with mostly dashes)
                            if (!currentLine.match(/^[\|\s\-]+$/)) {
                                tableLines.push(currentLine);
                            }
                            j++;
                        } else {
                            break;
                        }
                    }
                    
                    console.log('📊 Table lines found:', tableLines);
                    
                    if (tableLines.length >= 2) {
                        // Convert to HTML table
                        const tableHtml = createHtmlTable(tableLines);
                        result.push(tableHtml);
                        i = j; // Skip processed lines
                        continue;
                    }
                }
                
                // Not a table line, add as regular text
                if (line.length > 0) {
                    result.push(line);
                }
                i++;
            }
            
            const finalResult = result.join('\n\n');
            console.log('✅ Final processed text:', finalResult);
            return finalResult;
        }
        
        // Create HTML table from pipe-separated lines
        function createHtmlTable(tableLines) {
            if (tableLines.length === 0) return '';
            
            console.log('🏗️ Creating table from lines:', tableLines);
            
            // Clean and parse all lines
            const rows = tableLines.map(line => {
                // Remove leading/trailing pipes and split
                let cleanLine = line.trim();
                if (cleanLine.startsWith('|')) cleanLine = cleanLine.substring(1);
                if (cleanLine.endsWith('|')) cleanLine = cleanLine.substring(0, cleanLine.length - 1);
                
                return cleanLine.split('|').map(cell => cell.trim());
            }).filter(row => row.length > 1); // Only keep rows with multiple cells
            
            if (rows.length === 0) return tableLines.join('\n');
            
            console.log('📋 Parsed rows:', rows);
            
            // First row is header
            const headers = rows[0];
            const dataRows = rows.slice(1);
            
            let html = '<table>';
            
            // Add header
            html += '<thead><tr>';
            headers.forEach(header => {
                html += `<th>${header || ''}</th>`;
            });
            html += '</tr></thead>';
            
            // Add data rows
            if (dataRows.length > 0) {
                html += '<tbody>';
                dataRows.forEach(row => {
                    html += '<tr>';
                    for (let i = 0; i < headers.length; i++) {
                        const cell = row[i] || '';
                        html += `<td>${cell}</td>`;
                    }
                    html += '</tr>';
                });
                html += '</tbody>';
            }
            
            html += '</table>';
            
            console.log('🎨 Generated table HTML:', html);
            return html;
        }
        
        // Scroll to bottom
        function scrollToBottom() {
            messages.scrollTop = messages.scrollHeight;
        }
        
        // Call API
        async function callAPI(message) {
            try {
                const response = await fetch(`${apiUrl}/api/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: message,
                        context: 'widget',
                        userId: 'widget-user'
                    })
                });
                
                typing.style.display = 'none';
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        // Format response for display
                        let formattedResponse = data.response || data.reply;
                        formattedResponse = formattedResponse.replace(/\n/g, '<br>');
                        addMessage(formattedResponse);
                    } else {
                        addMessage('Sorry, I encountered an error processing your request. Please try again.');
                    }
                } else {
                    addMessage('I\'m having trouble connecting right now. Please try again in a moment.');
                }
            } catch (error) {
                typing.style.display = 'none';
                console.error('Widget API Error:', error);
                addMessage('Connection error. Please check your internet connection and try again.');
            }
        }
        
        // Input handlers
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        
        sendBtn.addEventListener('click', () => {
            sendMessage();
        });
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (isExpanded && !widget.contains(e.target)) {
                isExpanded = false;
                widget.classList.remove('widget-expanded');
            }
        });
        
        // Prevent widget clicks from closing
        widget.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        console.log('🎯 Touchline AI Widget loaded successfully!');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }
})();
