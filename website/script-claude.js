// CLAUDE AI BETTING ASSISTANT - SIMPLIFIED VERSION
console.log('🚀 CLAUDE AI SCRIPT LOADING...');

class ClaudeBettingBot {
    constructor() {
        console.log('🤖 Initializing Claude Betting Assistant');
        
        // Detect if we're running from file:// or http://
        this.baseUrl = this.getBaseUrl();
        console.log('🌐 Base URL detected:', this.baseUrl);
        
        this.initializeElements();
        this.setupEventListeners();
        this.startClaude();
    }

    getBaseUrl() {
        if (window.location.protocol === 'file:') {
            // If opened directly via file://, use localhost server
            return 'http://localhost:3001';
        } else if (window.location.hostname.includes('ondigitalocean.app')) {
            // If on DigitalOcean App Platform, use current domain
            return '';  // Use relative URLs for same domain
        } else {
            // If served by our server, use relative URLs
            return '';
        }
    }

    initializeElements() {
        console.log('🔧 Initializing DOM elements...');
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendButton = document.getElementById('sendButton');
        this.typingIndicator = document.getElementById('typingIndicator');
        
        console.log('📋 Element check:');
        console.log('  - chatMessages:', this.chatMessages ? '✅ Found' : '❌ Missing');
        console.log('  - chatInput:', this.chatInput ? '✅ Found' : '❌ Missing');
        console.log('  - sendButton:', this.sendButton ? '✅ Found' : '❌ Missing');
        console.log('  - typingIndicator:', this.typingIndicator ? '✅ Found' : '❌ Missing');
    }

    setupEventListeners() {
        console.log('🎧 Setting up event listeners...');
        
        if (this.sendButton) {
            console.log('✅ Attaching click listener to send button');
            this.sendButton.addEventListener('click', () => {
                console.log('🖱️ Send button clicked!');
                this.sendMessage();
            });
        } else {
            console.error('❌ Send button not found!');
        }
        
        if (this.chatInput) {
            console.log('✅ Attaching keypress listener to input');
            this.chatInput.addEventListener('keypress', (e) => {
                console.log('⌨️ Key pressed:', e.key);
                if (e.key === 'Enter') {
                    console.log('🎯 Enter key pressed - sending message');
                    this.sendMessage();
                }
            });
        } else {
            console.error('❌ Chat input not found!');
        }
        
        console.log('🎧 Event listeners setup complete');
    }

    async startClaude() {
        console.log('🔥 STARTING CLAUDE AI...');
        
        // Just do a silent health check without showing messages
        try {
            const healthUrl = this.baseUrl + '/api/health';
            console.log('🏥 Testing health endpoint:', healthUrl);
            
            const healthResponse = await fetch(healthUrl);
            console.log('🏥 Health response status:', healthResponse.status);
            
            if (healthResponse.ok) {
                const healthData = await healthResponse.json();
                console.log('🏥 Health data:', healthData);
                console.log('✅ Claude AI is ready!');
            } else {
                console.error('❌ Health check failed:', healthResponse.status);
            }
        } catch (error) {
            console.error('❌ Health check error:', error);
        }
        
        // Send initial greeting message through API to get the proper welcome
        try {
            await this.sendInitialMessage();
        } catch (error) {
            console.error('❌ Could not send initial message:', error);
            // Fallback message if API fails
            await this.addBotMessage("💬 Hello! I'm your AI betting assistant. The connection seems unstable, but you can still try chatting with me!");
        }
    }

    async sendInitialMessage() {
        console.log('📤 Sending initial greeting...');
        
        // Clear the loading message first
        if (this.chatMessages) {
            this.chatMessages.innerHTML = '';
        }
        
        const apiUrl = this.baseUrl + '/api/chat';
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: "Hello! Please introduce yourself and explain how you can help with betting analysis.",
                context: 'initialization',
                conversationState: 'new'
            })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                await this.addBotMessage(data.response);
            }
        }
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        console.log('📝 User typed message:', message);
        
        if (!message) {
            console.log('❌ Empty message, not sending');
            return;
        }

        console.log('✅ Adding user message to chat');
        this.addUserMessage(message);
        this.chatInput.value = '';

        try {
            console.log('🔄 Showing typing indicator');
            this.showTyping();
            
            const apiUrl = this.baseUrl + '/api/chat';
            console.log('📤 Sending message to:', apiUrl);
            console.log('📤 Message payload:', {
                message: message,
                context: 'chat',
                conversationState: 'active'
            });
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    context: 'chat',
                    conversationState: 'active'
                })
            });

            console.log('📨 Chat response status:', response.status);
            console.log('📨 Chat response headers:', response.headers);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Response not OK. Status:', response.status, 'Text:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            console.log('📥 Chat response data:', data);
            
            this.hideTyping();
            
            if (data.success) {
                console.log('✅ Success! Adding bot response');
                await this.addBotMessage(data.response);
            } else {
                console.error('❌ API returned success=false:', data.error);
                await this.addBotMessage(`Sorry, Claude returned an error: ${data.error || 'Unknown error'}`);
            }
            
        } catch (error) {
            console.error('❌ Chat error details:', {
                message: error.message,
                stack: error.stack,
                url: this.baseUrl + '/api/chat'
            });
            this.hideTyping();
            await this.addBotMessage(`Connection error: ${error.message}. Please check the console for details and try again.`);
        }
    }

    addUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${message}</div>
                <div class="message-time">${new Date().toLocaleTimeString()}</div>
            </div>
        `;
        
        if (this.chatMessages) {
            this.chatMessages.appendChild(messageDiv);
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }
    }

    async addBotMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        
        // Format the message with better styling
        const formattedMessage = this.formatBotMessage(message);
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${formattedMessage}</div>
                <div class="message-time">${new Date().toLocaleTimeString()}</div>
            </div>
        `;
        
        if (this.chatMessages) {
            this.chatMessages.appendChild(messageDiv);
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }
        
        // Small delay for visual effect
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    formatBotMessage(message) {
        // Handle special status messages first
        if (message.includes('✅') || message.includes('❌') || message.includes('🤖')) {
            return message.replace(/\n/g, '<br>');
        }
        
        let formatted = message;
        let result = '';
        
        // Convert markdown tables to HTML tables
        formatted = this.convertMarkdownTables(formatted);
        
        // Split into lines for better processing
        const lines = formatted.split('\n');
        let currentSection = '';
        let inList = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line === '') {
                // End current section on empty line
                if (currentSection) {
                    result += this.processSection(currentSection);
                    currentSection = '';
                }
                inList = false;
                continue;
            }
            
            // Check if this line starts a new major section
            if (line.endsWith(':') && line.length < 50 && !line.includes('@')) {
                // Finish previous section
                if (currentSection) {
                    result += this.processSection(currentSection);
                }
                // Start new section with header
                result += `<div class="section-header">${line}</div>`;
                currentSection = '';
                inList = false;
            }
            // Check if this is a numbered recommendation
            else if (/^\d+\.\s+/.test(line)) {
                // Finish previous section
                if (currentSection) {
                    result += this.processSection(currentSection);
                    currentSection = '';
                }
                // Process this as a recommendation
                result += this.formatRecommendation(line);
                inList = false;
            }
            // Check if this is a bullet point
            else if (/^[-•]\s+/.test(line) || line.startsWith('🇨🇱') || line.startsWith('🇧🇷') || line.startsWith('🇲🇽') || line.startsWith('🇦🇷')) {
                // Finish previous section if not in list
                if (currentSection && !inList) {
                    result += this.processSection(currentSection);
                    currentSection = '';
                }
                result += this.formatBulletPoint(line);
                inList = true;
            }
            // Regular content line
            else {
                if (inList) {
                    // End list mode
                    inList = false;
                }
                currentSection += (currentSection ? '\n' : '') + line;
            }
        }
        
        // Process any remaining section
        if (currentSection) {
            result += this.processSection(currentSection);
        }
        
        return result;
    }

    convertMarkdownTables(text) {
        // Convert markdown tables to HTML
        const lines = text.split('\n');
        let result = [];
        let inTable = false;
        let tableRows = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Check if this is a table row (contains | and has multiple cells)
            if (line.includes('|') && line.split('|').filter(cell => cell.trim()).length >= 2) {
                if (!inTable) {
                    inTable = true;
                    tableRows = [];
                }
                
                // Skip separator lines (----)
                if (!line.includes('---') && line !== '|') {
                    tableRows.push(line);
                }
            } else {
                // End of table
                if (inTable) {
                    if (tableRows.length > 0) {
                        result.push(this.createHtmlTable(tableRows));
                    }
                    inTable = false;
                    tableRows = [];
                }
                result.push(line);
            }
        }
        
        // Handle table at end of text
        if (inTable && tableRows.length > 0) {
            result.push(this.createHtmlTable(tableRows));
        }
        
        return result.join('\n');
    }

    createHtmlTable(rows) {
        if (rows.length === 0) return '';
        
        let html = '<table class="matches-table">\n';
        
        // First row is header
        if (rows.length > 0) {
            const headerCells = rows[0].split('|').filter(cell => cell.trim() !== '');
            html += '<thead><tr>\n';
            headerCells.forEach(cell => {
                html += `<th>${cell.trim()}</th>\n`;
            });
            html += '</tr></thead>\n<tbody>\n';
        }
        
        // Remaining rows are data
        for (let i = 1; i < rows.length; i++) {
            const dataCells = rows[i].split('|').filter(cell => cell.trim() !== '');
            if (dataCells.length > 0) {
                html += '<tr>\n';
                dataCells.forEach((cell, index) => {
                    // Add classes for different column types
                    let cellClass = '';
                    if (index === 0) cellClass = 'time-cell';
                    else if (index === 1) cellClass = 'match-cell';
                    else if (index >= 2) cellClass = 'odds-cell';
                    
                    html += `<td class="${cellClass}">${cell.trim()}</td>\n`;
                });
                html += '</tr>\n';
            }
        }
        
        html += '</tbody></table>\n';
        return html;
    }

    processSection(content) {
        if (!content.trim()) return '';
        
        let formatted = content;
        
        // Apply all formatting
        formatted = this.applyInlineFormatting(formatted);
        
        // Check for special section types
        if (formatted.toLowerCase().includes('combined odds')) {
            const oddsMatch = formatted.match(/(\d+\.?\d*)/);
            if (oddsMatch) {
                return `<div class="combined-odds">🎯 Combined Odds: <strong>${oddsMatch[1]}</strong></div>`;
            }
        }
        
        if (formatted.toLowerCase().includes('risk assessment')) {
            return `<div class="risk-header">⚠️ ${formatted}</div>`;
        }
        
        if (/confidence levels?:?/i.test(formatted)) {
            return `<div class="confidence-section">${formatted}</div>`;
        }
        
        // Regular paragraph
        return `<div class="message-paragraph">${formatted.replace(/\n/g, '<br>')}</div>`;
    }

    formatRecommendation(line) {
        const match = line.match(/^(\d+\.\s+)(.+)/);
        if (!match) return `<div class="message-paragraph">${line}</div>`;
        
        const number = match[1];
        let content = match[2];
        
        content = this.applyInlineFormatting(content);
        
        return `<div class="recommendation">
            <span class="rec-number">${number}</span>
            <div class="rec-content">${content}</div>
        </div>`;
    }

    formatBulletPoint(line) {
        let content = line.replace(/^[-•]\s*/, '');
        content = this.applyInlineFormatting(content);
        
        return `<div class="bullet-point">${content}</div>`;
    }

    applyInlineFormatting(text) {
        let formatted = text;
        
        // Format betting odds
        formatted = formatted.replace(/@\s*([\d.]+)/g, ' <span class="odds">@ $1</span>');
        
        // Format percentages
        formatted = formatted.replace(/(\d+)%/g, '<span class="percentage">$1%</span>');
        
        // Format ELO ratings
        formatted = formatted.replace(/ELO[:\s]*([\d.]+)/gi, '<span class="elo-rating">ELO: $1</span>');
        
        // Format xG data
        formatted = formatted.replace(/xG[:\s]*([\d.]+)/gi, '<span class="xg-data">xG: $1</span>');
        
        // Temporarily disabled team matchup formatting to avoid false matches
        // formatted = formatted.replace(/\b([A-Z][a-zA-Z\s]{2,15})\s+vs\s+([A-Z][a-zA-Z\s]{2,15})\b/g, '<span class="match-teams">$1 vs $2</span>');
        
        // Format confidence levels
        formatted = formatted.replace(/(High|Medium|Low)\s+(Confidence|Risk)/gi, '<span class="confidence-badge $1">$1 $2</span>');
        
        // Format star ratings
        formatted = formatted.replace(/(⭐+)/g, '<span class="star-rating">$1</span>');
        
        return formatted;
    }

    showTyping() {
        if (this.typingIndicator) {
            this.typingIndicator.style.display = 'flex';
        }
    }

    hideTyping() {
        if (this.typingIndicator) {
            this.typingIndicator.style.display = 'none';
        }
    }
}

// Start the Claude bot when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🎯 DOM READY - STARTING CLAUDE');
        const bot = new ClaudeBettingBot();
        // Make bot available globally for debugging
        window.claudeBot = bot;
    });
} else {
    console.log('🎯 DOM ALREADY READY - STARTING CLAUDE');
    const bot = new ClaudeBettingBot();
    // Make bot available globally for debugging
    window.claudeBot = bot;
}

// Add a test function for debugging
window.testMessage = function(message = "Hello test") {
    console.log('🧪 Testing message function...');
    if (window.claudeBot) {
        window.claudeBot.chatInput.value = message;
        window.claudeBot.sendMessage();
    } else {
        console.error('❌ Claude bot not available');
    }
};

// Quick Action functions for the buttons
window.quickAction = function(action) {
    console.log('⚡ Quick action triggered:', action);
    
    if (!window.claudeBot) {
        console.error('❌ Claude bot not available');
        return;
    }
    
    let message = '';
    
    switch (action) {
        case 'upcoming_matches':
            message = 'Show me upcoming matches for today and tomorrow';
            break;
        case 'high_confidence':
            message = 'Show me high confidence betting opportunities';
            break;
        case 'build_accumulator':
            message = 'Help me build an accumulator with 3-4 matches';
            break;
        case 'analyze_match':
            message = 'What matches can you analyze for me?';
            break;
        default:
            message = 'Help me with betting analysis';
    }
    
    // Set the message in the input and send it
    window.claudeBot.chatInput.value = message;
    window.claudeBot.sendMessage();
};

console.log('✅ CLAUDE AI SCRIPT LOADED SUCCESSFULLY');
console.log('💡 You can test messaging by typing: testMessage("your message here") in the console');
console.log('⚡ Quick actions are now available via quickAction("action_name")');
