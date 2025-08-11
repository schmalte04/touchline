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
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendButton = document.getElementById('sendButton');
        this.typingIndicator = document.getElementById('typingIndicator');
    }

    setupEventListeners() {
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => this.sendMessage());
        }
        if (this.chatInput) {
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }
    }

    async startClaude() {
        console.log('🔥 STARTING CLAUDE AI...');
        await this.addBotMessage("🤖 Initializing Claude AI...");
        
        try {
            const apiUrl = this.baseUrl + '/api/chat';
            console.log('📡 Making request to:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: 'Welcome the user to the Claude AI betting assistant. Mention today\'s live matches and be enthusiastic.',
                    context: 'welcome',
                    conversationState: 'greeting'
                })
            });

            console.log('📨 Response status:', response.status);
            console.log('📨 Response ok:', response.ok);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('📥 Response data:', data);
            
            if (data.success) {
                await this.addBotMessage("✅ CLAUDE AI CONNECTED!");
                await this.addBotMessage(data.response);
            } else {
                throw new Error(`Claude API returned error: ${data.error || 'Unknown error'}`);
            }
            
        } catch (error) {
            console.error('❌ Claude connection error details:', error);
            console.error('Error type:', error.constructor.name);
            console.error('Error message:', error.message);
            
            await this.addBotMessage(`❌ Claude AI connection failed: ${error.message}`);
            await this.addBotMessage("🔄 Using fallback mode. You can still chat, but responses may be limited.");
        }
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;

        this.addUserMessage(message);
        this.chatInput.value = '';

        try {
            this.showTyping();
            
            const apiUrl = this.baseUrl + '/api/chat';
            console.log('📤 Sending message to:', apiUrl);
            
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

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('📥 Chat response data:', data);
            
            this.hideTyping();
            
            if (data.success) {
                await this.addBotMessage(data.response);
            } else {
                await this.addBotMessage(`Sorry, Claude returned an error: ${data.error || 'Unknown error'}`);
            }
            
        } catch (error) {
            console.error('❌ Chat error:', error);
            this.hideTyping();
            await this.addBotMessage(`Connection error: ${error.message}. Please try again.`);
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
        
        // Format team matchups
        formatted = formatted.replace(/([A-Z][a-z\s]+)\s+vs\s+([A-Z][a-z\s]+)/g, '<span class="match-teams">$1 vs $2</span>');
        
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
        new ClaudeBettingBot();
    });
} else {
    console.log('🎯 DOM ALREADY READY - STARTING CLAUDE');
    new ClaudeBettingBot();
}

console.log('✅ CLAUDE AI SCRIPT LOADED SUCCESSFULLY');
