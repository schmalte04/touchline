import React, { useState, useEffect, useRef } from 'react';

const MinimalTouchlineChat = ({ 
  className = '',
  style = {},
  placeholder = "Ask about football matches, odds, or predictions...",
  height = "400px"
}) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Test connection on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch('https://touchline-api.schmalte.com/api/health');
        if (response.ok) {
          setIsConnected(true);
          // Add welcome message
          setMessages([{
            id: 1,
            type: 'assistant',
            content: "Hi! I'm your Football Intelligence Assistant. Ask me about matches, odds, predictions, or any football-related questions.",
            timestamp: new Date()
          }]);
        }
      } catch (error) {
        console.error('Connection failed:', error);
        setMessages([{
          id: 1,
          type: 'error',
          content: "Connection failed. Please check your internet connection and try again.",
          timestamp: new Date()
        }]);
      }
    };
    
    testConnection();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading || !isConnected) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('https://touchline-api.schmalte.com/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          context: 'web-widget'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: data.response || 'Sorry, I couldn\'t process that request.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Sorry, there was an error processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div 
      className={`minimal-touchline-chat ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: height,
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        backgroundColor: 'white',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        ...style
      }}
    >
      {/* Messages Container */}
      <div 
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div
              style={{
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: '18px',
                fontSize: '14px',
                lineHeight: '1.4',
                backgroundColor: 
                  message.type === 'user' ? '#3b82f6' :
                  message.type === 'error' ? '#ef4444' : '#f3f4f6',
                color: 
                  message.type === 'user' ? 'white' :
                  message.type === 'error' ? 'white' : '#374151',
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap'
              }}
            >
              {message.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '18px',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                fontSize: '14px'
              }}
            >
              <span>●</span>
              <span style={{ animationDelay: '0.2s' }}>●</span>
              <span style={{ animationDelay: '0.4s' }}>●</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Container */}
      <div 
        style={{
          padding: '16px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#fafafa'
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isConnected ? placeholder : "Connecting..."}
            disabled={!isConnected || isLoading}
            style={{
              flex: 1,
              minHeight: '40px',
              maxHeight: '120px',
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '20px',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              fontSize: '14px',
              lineHeight: '1.4',
              backgroundColor: isConnected ? 'white' : '#f9fafb'
            }}
            rows={1}
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading || !isConnected}
            style={{
              padding: '12px 16px',
              backgroundColor: isConnected && inputValue.trim() ? '#3b82f6' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: isConnected && inputValue.trim() ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '500',
              minWidth: '60px',
              transition: 'background-color 0.2s'
            }}
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 60%, 100% { opacity: 0.4; }
          30% { opacity: 1; }
        }
        
        .minimal-touchline-chat span {
          animation: pulse 1.4s infinite;
        }
      `}</style>
    </div>
  );
};

export default MinimalTouchlineChat;
