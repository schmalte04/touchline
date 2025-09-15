(function() {
    'use strict';
    
    // Markdown parser loading and initialization
    let marked = null;
    let markedLoaded = false;
    
    // Load marked.js library dynamically
    function loadMarkedJS() {
        return new Promise((resolve, reject) => {
            if (markedLoaded && window.marked) {
                marked = window.marked;
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
            script.onload = () => {
                marked = window.marked;
                markedLoaded = true;
                console.log('✅ Marked.js loaded successfully');
                resolve();
            };
            script.onerror = () => {
                console.warn('⚠️ Failed to load marked.js, using fallback parser');
                reject();
            };
            document.head.appendChild(script);
        });
    }
    
    // Enhanced markdown parser with table support
    function parseMarkdown(text) {
        if (!marked) {
            console.log('📝 Using fallback markdown parser');
            return parseMarkdownFallback(text);
        }
        
        try {
            // Configure marked for better table rendering
            marked.setOptions({
                gfm: true,
                tables: true,
                breaks: true,
                smartLists: true,
                smartypants: false,
                renderer: new marked.Renderer()
            });
            
            // Custom table renderer for professional styling
            const renderer = new marked.Renderer();
            renderer.table = function(header, body) {
                return `<div class="professional-table-container">
                    <table class="professional-table">
                        <thead>${header}</thead>
                        <tbody>${body}</tbody>
                    </table>
                </div>`;
            };
            
            marked.setOptions({ renderer });
            
            const html = marked.parse(text);
            console.log('✅ Markdown parsed successfully with marked.js');
            return html;
        } catch (error) {
            console.warn('⚠️ Marked.js parsing failed, using fallback:', error);
            return parseMarkdownFallback(text);
        }
    }
    
    // Fallback markdown parser for basic formatting
    function parseMarkdownFallback(text) {
        console.log('🔄 Using fallback markdown parser');
        
        let html = text;
        
        // Handle tables first (preserve existing logic)
        html = smartTableDetection(html);
        
        // Basic markdown formatting
        html = html
            // Bold text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic text
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Code blocks
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            // Inline code
            .replace(/`(.*?)`/g, '<code>$1</code>')
            // Line breaks
            .replace(/\n/g, '<br>');
            
        return html;
    }

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
                <div class="widget-resize-handle" id="touchline-resize-handle"></div>
                <div class="widget-header">
                    <button class="mobile-collapse-btn" id="mobile-collapse" style="display: none;">
                        <span>‹</span>
                    </button>
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
        
        /* Mobile positioning adjustments */
        @media (max-width: 768px) {
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
            height: 700px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            display: none;
            flex-direction: column;
            position: absolute;
            bottom: 80px;
            right: 0;
            overflow: hidden;
            min-width: 320px;
            max-width: 800px;
        }
        
        .widget-resize-handle {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 8px;
            background: transparent;
            cursor: ew-resize;
            z-index: 1000;
            transition: all 0.2s ease;
            border-left: 2px solid transparent;
        }
        
        .widget-resize-handle:hover {
            background: rgba(76, 205, 196, 0.1);
            border-left-color: rgba(76, 205, 196, 0.6);
        }
        
        .widget-resize-handle::before {
            content: '⋮⋮';
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%) rotate(90deg);
            color: rgba(76, 205, 196, 0.4);
            font-size: 12px;
            font-weight: bold;
            letter-spacing: -2px;
            opacity: 0;
            transition: opacity 0.2s ease;
            pointer-events: none;
        }
        
        .widget-resize-handle:hover::before {
            opacity: 1;
        }
        
        .widget-chat.resizing .widget-resize-handle {
            background: rgba(76, 205, 196, 0.2);
            border-left-color: #4ECDC4;
        }
        
        .widget-chat.resizing {
            user-select: none;
            pointer-events: none;
        }
        
        .widget-chat.resizing * {
            user-select: none;
            pointer-events: none;
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
        
        .mobile-collapse-btn {
            display: none;
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            width: 32px;
            height: 32px;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: bold;
        }
        
        .mobile-collapse-btn:hover {
            background: rgba(255,255,255,0.3);
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
                width: calc(100vw - 20px) !important;
                height: calc(100vh - 150px) !important;
                bottom: 10px !important;
                right: 10px !important;
                left: 10px !important;
                top: auto !important;
                max-height: 75vh !important;
                position: fixed !important;
                z-index: 999999 !important;
                font-size: 13px !important;
            }
            
            .touchline-widget[data-position="bottom-left"] .widget-chat,
            .touchline-widget[data-position="top-left"] .widget-chat,
            .touchline-widget[data-position="top-right"] .widget-chat,
            .touchline-widget[data-position="bottom-right"] .widget-chat {
                right: 10px !important;
                left: 10px !important;
                bottom: 10px !important;
                top: auto !important;
                width: calc(100vw - 20px) !important;
                height: calc(100vh - 150px) !important;
                max-height: 75vh !important;
                position: fixed !important;
                z-index: 999999 !important;
                font-size: 13px !important;
            }
            
            .widget-bubble {
                width: 56px;
                height: 56px;
                position: fixed !important;
                z-index: 999998 !important;
            }
            
            .touchline-widget[data-position="bottom-right"] .widget-bubble {
                bottom: 20px !important;
                right: 20px !important;
            }
            
            .touchline-widget[data-position="bottom-left"] .widget-bubble {
                left: 20px !important;
                right: auto !important;
                bottom: 20px !important;
            }
            
            .touchline-widget[data-position="top-right"] .widget-bubble,
            .touchline-widget[data-position="top-left"] .widget-bubble {
                top: 20px !important;
                bottom: auto !important;
            }
            
            .widget-icon {
                width: 24px;
                height: 24px;
            }
            
            .widget-header {
                padding: 12px 16px !important;
                position: relative;
            }
            
            .widget-title {
                font-size: 14px !important;
            }
            
            .widget-subtitle {
                font-size: 11px !important;
            }
            
            .widget-close {
                width: 32px !important;
                height: 32px !important;
                display: none !important; /* Hide default close on mobile */
            }
            
            .mobile-collapse-btn {
                display: flex !important;
            }
            
            .widget-messages {
                padding: 12px;
                font-size: 13px !important;
            }
            
            .message-text {
                padding: 10px 12px !important;
                font-size: 13px !important;
                line-height: 1.4 !important;
            }
            
            .widget-quick-actions {
                padding: 10px 12px;
                gap: 6px;
            }
            
            .quick-action-btn {
                font-size: 10px;
                padding: 6px 8px;
            }
            
            .widget-input {
                padding: 10px 12px;
            }
            
            .widget-input input {
                font-size: 14px; /* Prevents zoom on iOS but smaller than before */
                padding: 8px 12px !important;
            }
            
            .widget-send {
                width: 36px !important;
                height: 36px !important;
            }
            
            .widget-footer {
                padding: 6px 12px !important;
                font-size: 10px !important;
            }
            
            /* Force show chat on mobile when expanded */
            .widget-expanded .widget-chat {
                display: flex !important;
                visibility: visible !important;
                opacity: 1 !important;
                position: fixed !important;
                z-index: 999999 !important;
                transform: translateX(0) !important;
            }
            
            /* Hide bubble when expanded on mobile */
            .widget-expanded .widget-bubble {
                display: none !important;
            }
            
            /* Mobile-specific table styling */
            .message-text table {
                font-size: 9px;
                margin: 6px 0;
            }
            
            .message-text th,
            .message-text td {
                padding: 3px 4px;
                max-width: 50px;
                word-break: break-word;
                font-size: 9px !important;
            }
            
            /* Mobile collapse button */
            .mobile-collapse-btn {
                display: block !important;
                position: absolute;
                top: 12px;
                left: 16px;
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 32px;
                height: 32px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        }
        
        /* Professional table styles for markdown tables */
        .professional-table-container {
            margin: 12px 0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .professional-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            background: white;
        }
        
        .professional-table thead {
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        }
        
        .professional-table th {
            padding: 8px 10px;
            text-align: left;
            font-weight: 600;
            color: #495057;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #dee2e6;
        }
        
        .professional-table td {
            padding: 6px 10px;
            border-bottom: 1px solid #f1f3f4;
            color: #212529;
            font-size: 11px;
        }
        
        .professional-table tbody tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        .professional-table tbody tr:hover {
            background-color: #e3f2fd;
        }
        
        /* Mobile adjustments for professional tables */
        @media (max-width: 520px) {
            .professional-table {
                font-size: 9px;
            }
            
            .professional-table th,
            .professional-table td {
                padding: 3px 4px;
                font-size: 9px;
                max-width: 50px;
                word-break: break-word;
            }
            
            /* Hide resize handle on mobile */
            .widget-resize-handle {
                display: none;
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
        const mobileCollapseBtn = document.getElementById('mobile-collapse');
        const resizeHandle = document.getElementById('touchline-resize-handle');
        const input = document.getElementById('touchline-input');
        const sendBtn = document.getElementById('touchline-send');
        const messages = document.getElementById('touchline-messages');
        const typing = document.getElementById('touchline-typing');
        
        // Initialize markdown parser (load asynchronously)
        loadMarkedJS().catch(() => {
            console.log('📝 Using fallback markdown parser');
        });
        
        // State
        let isExpanded = false;
        
        // Event handlers
        bubble.addEventListener('click', () => {
            console.log('📱 Bubble clicked');
            isExpanded = true;
            widget.classList.add('widget-expanded');
            
            // Mobile-specific handling
            if (window.innerWidth <= 520) {
                setTimeout(() => {
                    const chatElement = document.getElementById('touchline-chat');
                    if (chatElement) {
                        chatElement.style.display = 'flex';
                        chatElement.style.position = 'fixed';
                        chatElement.style.zIndex = '999999';
                        chatElement.style.visibility = 'visible';
                        chatElement.style.opacity = '1';
                        chatElement.style.width = 'calc(100vw - 20px)';
                        chatElement.style.height = 'calc(100vh - 150px)';
                        chatElement.style.left = '10px';
                        chatElement.style.right = '10px';
                        chatElement.style.bottom = '10px';
                        chatElement.style.top = 'auto';
                        chatElement.style.fontSize = '13px';
                        console.log('📱 Applied mobile-specific styles');
                    }
                }, 50);
            }
        });
        
        // Add touch support for mobile
        bubble.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('📱 Bubble touched on mobile');
            isExpanded = true;
            widget.classList.add('widget-expanded');
            
            // Force mobile visibility
            if (window.innerWidth <= 520) {
                setTimeout(() => {
                    const chatElement = document.getElementById('touchline-chat');
                    if (chatElement) {
                        chatElement.style.display = 'flex';
                        chatElement.style.position = 'fixed';
                        chatElement.style.zIndex = '999999';
                        chatElement.style.visibility = 'visible';
                        chatElement.style.opacity = '1';
                        console.log('📱 Forced mobile chat visibility');
                    }
                }, 100);
            }
        });
        
        closeBtn.addEventListener('click', () => {
            isExpanded = false;
            widget.classList.remove('widget-expanded');
        });
        
        closeBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            isExpanded = false;
            widget.classList.remove('widget-expanded');
        });
        
        // Mobile collapse button handlers
        mobileCollapseBtn.addEventListener('click', () => {
            isExpanded = false;
            widget.classList.remove('widget-expanded');
        });
        
        mobileCollapseBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            isExpanded = false;
            widget.classList.remove('widget-expanded');
        });
        
        // Resize functionality
        let isResizing = false;
        let startX = 0;
        let startWidth = 480;
        
        if (resizeHandle) {
            resizeHandle.addEventListener('mousedown', (e) => {
                isResizing = true;
                startX = e.clientX;
                startWidth = chat.offsetWidth;
                chat.classList.add('resizing');
                document.body.style.cursor = 'ew-resize';
                e.preventDefault();
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;
                
                const deltaX = startX - e.clientX; // Negative because we're resizing from the left
                const newWidth = Math.max(320, Math.min(800, startWidth + deltaX));
                
                chat.style.width = `${newWidth}px`;
            });
            
            document.addEventListener('mouseup', () => {
                if (isResizing) {
                    isResizing = false;
                    chat.classList.remove('resizing');
                    document.body.style.cursor = '';
                }
            });
            
            // Handle mouse leave to stop resizing
            document.addEventListener('mouseleave', () => {
                if (isResizing) {
                    isResizing = false;
                    chat.classList.remove('resizing');
                    document.body.style.cursor = '';
                }
            });
        }
        
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
            // Process text for markdown and tables
            let processedText = text;
            if (type === 'bot') {
                console.log('🚀 Processing bot message...');
                console.log('🔍 Original text:', text);
                
                // Use markdown parser (which includes smart table detection)
                if (marked) {
                    processedText = parseMarkdown(text);
                } else {
                    // Fallback to existing smart table detection
                    processedText = smartTableDetection(text);
                }
                
                console.log('✨ After markdown processing:', processedText);
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
        
        // Smart table detection - only convert actual tabular data
        function smartTableDetection(text) {
            console.log('🧠 Smart table detection started');
            
            const lines = text.split('\n');
            const result = [];
            let i = 0;
            
            while (i < lines.length) {
                const line = lines[i].trim();
                
                // Check if this looks like a table header (multiple pipes, header-like content)
                if (isTableHeader(line)) {
                    console.log('🎯 Found potential table header:', line);
                    
                    // Look for consecutive table rows
                    const tableLines = [line];
                    let j = i + 1;
                    
                    // Skip separator line if it exists
                    if (j < lines.length && isSeparatorLine(lines[j])) {
                        j++;
                    }
                    
                    // Collect data rows
                    while (j < lines.length && isTableDataRow(lines[j], tableLines[0])) {
                        tableLines.push(lines[j].trim());
                        j++;
                    }
                    
                    console.log('📊 Table lines collected:', tableLines);
                    
                    // Only convert if we have header + at least one data row
                    if (tableLines.length >= 2) {
                        const tableHtml = createProfessionalTable(tableLines);
                        result.push(tableHtml);
                        i = j; // Skip processed lines
                        continue;
                    }
                }
                
                // Regular line - just add it with line breaks preserved
                result.push(line);
                i++;
            }
            
            return result.join('<br>');
        }
        
        // Check if line looks like a table header
        function isTableHeader(line) {
            if (!line.includes('|')) return false;
            
            // Must have at least 3 pipes (for at least 2 columns)
            const pipeCount = (line.match(/\|/g) || []).length;
            if (pipeCount < 3) return false;
            
            // Check for header-like keywords
            const headerKeywords = ['date', 'time', 'match', 'home', 'away', 'draw', 'odds', 'team', 'league', 'score'];
            const lowerLine = line.toLowerCase();
            
            // Must contain at least one header keyword
            return headerKeywords.some(keyword => lowerLine.includes(keyword));
        }
        
        // Check if line is a separator (dashes and pipes)
        function isSeparatorLine(line) {
            if (!line || !line.includes('|')) return false;
            const cleaned = line.replace(/[\|\s\-]/g, '');
            return cleaned === '';
        }
        
        // Check if line is a valid data row for the table
        function isTableDataRow(line, headerLine) {
            if (!line || !line.includes('|')) return false;
            
            const headerPipes = (headerLine.match(/\|/g) || []).length;
            const linePipes = (line.match(/\|/g) || []).length;
            
            // Should have similar number of pipes as header (±1 tolerance)
            return Math.abs(headerPipes - linePipes) <= 1;
        }
        
        // Create professional HTML table
        function createProfessionalTable(tableLines) {
            console.log('🏗️ Creating professional table from:', tableLines);
            
            // Parse header
            const headerLine = tableLines[0];
            let cleanHeader = headerLine.trim();
            if (cleanHeader.startsWith('|')) cleanHeader = cleanHeader.substring(1);
            if (cleanHeader.endsWith('|')) cleanHeader = cleanHeader.substring(0, cleanHeader.length - 1);
            const headers = cleanHeader.split('|').map(h => h.trim());
            
            // Parse data rows (skip header)
            const dataRows = tableLines.slice(1).map(line => {
                let cleanLine = line.trim();
                if (cleanLine.startsWith('|')) cleanLine = cleanLine.substring(1);
                if (cleanLine.endsWith('|')) cleanLine = cleanLine.substring(0, cleanLine.length - 1);
                return cleanLine.split('|').map(cell => cell.trim());
            });
            
            console.log('� Headers:', headers);
            console.log('📊 Data rows:', dataRows);
            
            // Build HTML with professional styling
            let html = `
                <table style="
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 12px 0; 
                    font-size: 11px; 
                    background: white; 
                    border-radius: 8px; 
                    overflow: hidden; 
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                ">
                    <thead>
                        <tr style="background: linear-gradient(135deg, #f8f9fa, #e9ecef);">
            `;
            
            headers.forEach(header => {
                html += `
                    <th style="
                        padding: 8px 10px; 
                        text-align: left; 
                        font-weight: 600; 
                        color: #495057; 
                        font-size: 10px; 
                        text-transform: uppercase; 
                        letter-spacing: 0.5px;
                        border-bottom: 2px solid #dee2e6;
                    ">${header}</th>
                `;
            });
            
            html += `
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            dataRows.forEach((row, index) => {
                const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
                html += `<tr style="background: ${bgColor}; transition: background-color 0.2s;" onmouseover="this.style.background='#e3f2fd'" onmouseout="this.style.background='${bgColor}'">`;
                
                row.forEach(cell => {
                    html += `
                        <td style="
                            padding: 8px 10px; 
                            border-bottom: 1px solid #e9ecef; 
                            color: #495057;
                            font-size: 11px;
                        ">${cell || '-'}</td>
                    `;
                });
                
                html += '</tr>';
            });
            
            html += `
                    </tbody>
                </table>
            `;
            
            console.log('✨ Professional table created');
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
        
        // Close on outside click (desktop only)
        document.addEventListener('click', (e) => {
            if (isExpanded && !widget.contains(e.target) && window.innerWidth > 520) {
                isExpanded = false;
                widget.classList.remove('widget-expanded');
            }
        });
        
        // Mobile-specific close handling
        document.addEventListener('touchend', (e) => {
            if (isExpanded && !widget.contains(e.target) && window.innerWidth <= 520) {
                // On mobile, only close if touching outside and not on input elements
                if (!e.target.closest('input, textarea, button, .widget-chat')) {
                    isExpanded = false;
                    widget.classList.remove('widget-expanded');
                }
            }
        });
        
        // Prevent widget clicks from closing
        widget.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        widget.addEventListener('touchend', (e) => {
            e.stopPropagation();
        });
        
        // Mobile detection and debugging
        const isMobile = window.innerWidth <= 520;
        console.log('🎯 Touchline AI Widget loaded successfully!');
        console.log('📱 Mobile device detected:', isMobile);
        console.log('🖥️ Screen size:', window.innerWidth + 'x' + window.innerHeight);
        console.log('⚙️ Widget config:', { position, theme, openByDefault });
        
        // Auto-expand on mobile if configured
        if (openByDefault && isMobile) {
            setTimeout(() => {
                console.log('📱 Auto-opening widget on mobile...');
                isExpanded = true;
                widget.classList.add('widget-expanded');
                
                // Force mobile chat to show
                const chatElement = document.getElementById('touchline-chat');
                if (chatElement) {
                    chatElement.style.display = 'flex';
                    chatElement.style.position = 'fixed';
                    chatElement.style.zIndex = '999999';
                    chatElement.style.visibility = 'visible';
                    chatElement.style.opacity = '1';
                    chatElement.style.width = 'calc(100vw - 20px)';
                    chatElement.style.height = 'calc(100vh - 150px)';
                    chatElement.style.left = '10px';
                    chatElement.style.right = '10px';
                    chatElement.style.bottom = '10px';
                    chatElement.style.top = 'auto';
                    chatElement.style.fontSize = '13px';
                }
                
                // Double-check visibility on mobile
                setTimeout(() => {
                    if (chatElement) {
                        const computedStyle = window.getComputedStyle(chatElement);
                        console.log('📱 Chat visibility:', computedStyle.display);
                        console.log('📱 Chat position:', computedStyle.position);
                        console.log('📱 Chat z-index:', computedStyle.zIndex);
                        console.log('📱 Chat opacity:', computedStyle.opacity);
                        console.log('📱 Chat dimensions:', computedStyle.width + 'x' + computedStyle.height);
                    }
                }, 500);
            }, 1500); // Longer delay for mobile
        }
        
        // Add mobile-specific debugging
        if (isMobile) {
            console.log('📱 Mobile mode activated');
            console.log('📱 Viewport:', window.innerWidth + 'x' + window.innerHeight);
            
            // Test if the widget container is properly positioned
            setTimeout(() => {
                const widgetElement = document.querySelector('.touchline-widget');
                if (widgetElement) {
                    const style = window.getComputedStyle(widgetElement);
                    console.log('📱 Widget position:', style.position);
                    console.log('📱 Widget z-index:', style.zIndex);
                }
            }, 1000);
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }
})();
