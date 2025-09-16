# Updated Integration Code for Qount.AI

## ✅ Correct DigitalOcean URL: `https://shark-app-robkv.ondigitalocean.app`

## 🚀 Complete Script for Your Lovable App

```html
<!-- Copy this entire block into your Lovable app where you want the chat -->
<div id="minimal-football-chat">
  <!-- Chat messages container -->
  <div id="chat-messages"></div>
  
  <!-- Input container -->
  <div id="chat-input-container">
    <textarea 
      id="chat-input" 
      placeholder="Ask about football matches, odds, or predictions..."
      rows="1"
    ></textarea>
    <button id="send-button" disabled>Send</button>
  </div>
</div>

<style>
#minimal-football-chat {
  display: flex;
  flex-direction: column;
  height: 500px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background-color: white;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  max-width: 100%;
  margin: 0 auto;
}

#chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message.assistant, .message.error {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.message.user .message-bubble {
  background-color: #3b82f6;
  color: white;
}

.message.assistant .message-bubble {
  background-color: #f3f4f6;
  color: #374151;
}

.message.error .message-bubble {
  background-color: #ef4444;
  color: white;
}

.typing-indicator {
  display: flex;
  justify-content: flex-start;
}

.typing-bubble {
  padding: 12px 16px;
  border-radius: 18px;
  background-color: #f3f4f6;
  color: #6b7280;
  font-size: 14px;
}

.typing-dots span {
  animation: pulse 1.4s infinite;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse {
  0%, 60%, 100% { opacity: 0.4; }
  30% { opacity: 1; }
}

#chat-input-container {
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  background-color: #fafafa;
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

#chat-input {
  flex: 1;
  min-height: 40px;
  max-height: 120px;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 20px;
  resize: none;
  outline: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.4;
  background-color: white;
}

#chat-input:disabled {
  background-color: #f9fafb;
}

#send-button {
  padding: 12px 16px;
  background-color: #9ca3af;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: not-allowed;
  font-size: 14px;
  font-weight: 500;
  min-width: 60px;
  transition: background-color 0.2s;
}

#send-button:not(:disabled) {
  background-color: #3b82f6;
  cursor: pointer;
}

#send-button:not(:disabled):hover {
  background-color: #2563eb;
}

/* Responsive design */
@media (max-width: 768px) {
  #minimal-football-chat {
    height: 400px;
    border-radius: 8px;
  }
  
  #chat-messages {
    padding: 12px;
  }
  
  #chat-input-container {
    padding: 12px;
  }
}
</style>

<script>
class MinimalFootballChat {
  constructor() {
    this.messages = [];
    this.isLoading = false;
    this.isConnected = false;
    
    this.messagesContainer = document.getElementById('chat-messages');
    this.inputElement = document.getElementById('chat-input');
    this.sendButton = document.getElementById('send-button');
    
    this.init();
  }
  
  async init() {
    // Set up event listeners
    this.inputElement.addEventListener('input', () => this.updateSendButton());
    this.inputElement.addEventListener('keypress', (e) => this.handleKeyPress(e));
    this.sendButton.addEventListener('click', () => this.sendMessage());
    
    // Test connection
    await this.testConnection();
  }
  
  async testConnection() {
    try {
      const response = await fetch('https://shark-app-robkv.ondigitalocean.app/api/health');
      if (response.ok) {
        this.isConnected = true;
        this.inputElement.disabled = false;
        this.inputElement.placeholder = "Ask about football matches, odds, or predictions...";
        this.addMessage({
          type: 'assistant',
          content: "Hi! I'm your Football Intelligence Assistant. Ask me about matches, odds, predictions, or any football-related questions."
        });
      }
    } catch (error) {
      console.error('Connection failed:', error);
      this.addMessage({
        type: 'error',
        content: "Connection failed. Please check your internet connection and try again."
      });
    }
    this.updateSendButton();
  }
  
  addMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.type}`;
    
    const bubbleElement = document.createElement('div');
    bubbleElement.className = 'message-bubble';
    bubbleElement.textContent = message.content;
    
    messageElement.appendChild(bubbleElement);
    this.messagesContainer.appendChild(messageElement);
    
    // Scroll to bottom
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }
  
  showTypingIndicator() {
    const typingElement = document.createElement('div');
    typingElement.className = 'typing-indicator';
    typingElement.id = 'typing-indicator';
    
    const bubbleElement = document.createElement('div');
    bubbleElement.className = 'typing-bubble';
    
    const dotsElement = document.createElement('div');
    dotsElement.className = 'typing-dots';
    dotsElement.innerHTML = '<span>●</span><span>●</span><span>●</span>';
    
    bubbleElement.appendChild(dotsElement);
    typingElement.appendChild(bubbleElement);
    this.messagesContainer.appendChild(typingElement);
    
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }
  
  hideTypingIndicator() {
    const typingElement = document.getElementById('typing-indicator');
    if (typingElement) {
      typingElement.remove();
    }
  }
  
  updateSendButton() {
    const hasText = this.inputElement.value.trim().length > 0;
    this.sendButton.disabled = !hasText || this.isLoading || !this.isConnected;
  }
  
  handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }
  
  async sendMessage() {
    const message = this.inputElement.value.trim();
    if (!message || this.isLoading || !this.isConnected) return;
    
    // Add user message
    this.addMessage({
      type: 'user',
      content: message
    });
    
    // Clear input
    this.inputElement.value = '';
    this.isLoading = true;
    this.updateSendButton();
    
    // Show typing indicator
    this.showTypingIndicator();
    
    try {
      const response = await fetch('https://shark-app-robkv.ondigitalocean.app/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          context: 'qount-ai-lovable-widget'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      
      // Hide typing indicator
      this.hideTypingIndicator();
      
      // Add assistant response
      this.addMessage({
        type: 'assistant',
        content: data.response || 'Sorry, I couldn\'t process that request.'
      });
      
    } catch (error) {
      console.error('Error sending message:', error);
      this.hideTypingIndicator();
      this.addMessage({
        type: 'error',
        content: 'Sorry, there was an error processing your request. Please try again.'
      });
    } finally {
      this.isLoading = false;
      this.updateSendButton();
    }
  }
}

// Initialize the chat when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new MinimalFootballChat();
  });
} else {
  new MinimalFootballChat();
}
</script>
```

## 🎯 Updated URLs:

**Test the widgets:**
- **Minimal Chat**: https://shark-app-robkv.ondigitalocean.app/minimal-chat
- **Complete Hero**: https://shark-app-robkv.ondigitalocean.app/hero
- **Qount Demo**: https://shark-app-robkv.ondigitalocean.app/qount-demo
- **CORS Test**: https://shark-app-robkv.ondigitalocean.app/cors-test.html

**Now working with team name mapping:**
- "Manchester United matches" → automatically maps to "Man United"
- "Manchester City fixtures" → automatically maps to "Man City"
- All 1000+ team name variations supported

## ✅ All widgets now use the correct DigitalOcean URL!
