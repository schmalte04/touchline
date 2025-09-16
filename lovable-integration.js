// Simple integration for Lovable App - Just copy this into your component

// For your "Interact with our AI" section, replace the existing content with:

const FootballChatWidget = () => {
  const [messages, setMessages] = React.useState([]);
  const [inputValue, setInputValue] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);
  const messagesEndRef = React.useRef(null);

  React.useEffect(() => {
    // Test connection and add welcome message
    const testConnection = async () => {
      try {
        const response = await fetch('https://shark-app-robkv.ondigitalocean.app/api/health');
        if (response.ok) {
          setIsConnected(true);
          setMessages([{
            id: 1,
            type: 'assistant',
            content: "Hi! Ask me about football matches, odds, or predictions.",
            timestamp: new Date()
          }]);
        }
      } catch (error) {
        setMessages([{
          id: 1,
          type: 'error',
          content: "Connection failed. Please try again.",
          timestamp: new Date()
        }]);
      }
    };
    testConnection();
  }, []);

  React.useEffect(() => {
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
      const response = await fetch('https://shark-app-robkv.ondigitalocean.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          context: 'lovable-widget'
        })
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'assistant',
        content: data.response || 'Sorry, I couldn\'t process that request.',
        timestamp: new Date()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'error',
        content: 'Sorry, there was an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '500px',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      backgroundColor: 'white',
      overflow: 'hidden'
    }}>
      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.map((message) => (
          <div key={message.id} style={{
            display: 'flex',
            justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
          }}>
            <div style={{
              maxWidth: '80%',
              padding: '12px 16px',
              borderRadius: '18px',
              fontSize: '14px',
              backgroundColor: 
                message.type === 'user' ? '#3b82f6' :
                message.type === 'error' ? '#ef4444' : '#f3f4f6',
              color: 
                message.type === 'user' ? 'white' :
                message.type === 'error' ? 'white' : '#374151'
            }}>
              {message.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '18px',
              backgroundColor: '#f3f4f6',
              color: '#6b7280'
            }}>
              Thinking...
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #e5e7eb',
        backgroundColor: '#fafafa',
        display: 'flex',
        gap: '8px'
      }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask about matches, odds, predictions..."
          disabled={!isConnected || isLoading}
          style={{
            flex: 1,
            padding: '12px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '20px',
            outline: 'none',
            fontSize: '14px'
          }}
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
            fontSize: '14px'
          }}
        >
          {isLoading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

// Then in your main component, replace the "Interact with our AI" section:
<div className="hero-chat-container">
  <FootballChatWidget />
</div>
