import React, { useEffect, useRef, useState } from 'react';

const TouchlineChatWidget = ({ 
  // Customization props
  position = 'bottom-right', // 'bottom-right', 'bottom-left', 'inline', 'hero'
  theme = 'qount', // 'qount', 'turboscores', 'custom'
  customBranding = null,
  className = '',
  style = {},
  // Behavior props
  autoOpen = false,
  showOnHover = false,
  minimized = false
}) => {
  const widgetRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(minimized);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  // Branding configurations
  const brandingConfigs = {
    qount: {
      title: 'q.Chat',
      subtitle: 'Football Intelligence Assistant',
      footer: 'powered by q.AI',
      icon: '⚽'
    },
    turboscores: {
      title: 'Touchline Assistant',
      subtitle: 'Your Football Intelligence Partner',
      footer: 'powered by Turboscores',
      icon: '⚽'
    }
  };

  // Position styles
  const positionStyles = {
    'bottom-right': {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1000,
      width: isMinimized ? '60px' : '350px',
      height: isMinimized ? '60px' : '500px',
      transition: 'all 0.3s ease'
    },
    'bottom-left': {
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      zIndex: 1000,
      width: isMinimized ? '60px' : '350px',
      height: isMinimized ? '60px' : '500px',
      transition: 'all 0.3s ease'
    },
    'inline': {
      width: '100%',
      height: '500px',
      position: 'relative'
    },
    'hero': {
      width: '100%',
      maxWidth: '400px',
      height: '600px',
      position: 'relative',
      margin: '0 auto',
      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
      borderRadius: '16px',
      overflow: 'hidden'
    }
  };

  useEffect(() => {
    const initializeWidget = async () => {
      try {
        // Test connection first
        setConnectionStatus('connecting');
        const healthResponse = await fetch('https://shark-app-robkv.ondigitalocean.app/api/health', {
          method: 'GET',
          mode: 'cors'
        });
        
        if (!healthResponse.ok) {
          throw new Error('API health check failed');
        }
        
        setConnectionStatus('connected');
        
        // Configure the widget
        const branding = customBranding || brandingConfigs[theme] || brandingConfigs.qount;
        
        window.TouchlineConfig = {
          apiUrl: 'https://shark-app-robkv.ondigitalocean.app',
          branding: branding,
          containerId: widgetRef.current?.id || 'touchline-widget-' + Date.now()
        };
        
        // Load the widget script if not already loaded
        if (!window.TouchlineWidget) {
          const script = document.createElement('script');
          script.src = 'https://shark-app-robkv.ondigitalocean.app/widget/touchline-widget.js';
          script.async = true;
          script.onload = () => {
            setIsLoaded(true);
            setConnectionStatus('ready');
          };
          script.onerror = () => {
            setConnectionStatus('error');
            console.error('Failed to load Touchline widget script');
          };
          document.head.appendChild(script);
        } else {
          setIsLoaded(true);
          setConnectionStatus('ready');
        }
        
      } catch (error) {
        setConnectionStatus('error');
        console.error('Failed to initialize Touchline widget:', error);
      }
    };

    initializeWidget();
  }, [theme, customBranding]);

  const handleMinimizeToggle = () => {
    setIsMinimized(!isMinimized);
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connecting': return '🔄';
      case 'connected': return '✅';
      case 'ready': return '⚽';
      case 'error': return '❌';
      default: return '⚽';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connecting': return 'Connecting...';
      case 'connected': return 'Loading widget...';
      case 'ready': return 'Ready to chat!';
      case 'error': return 'Connection failed';
      default: return 'Initializing...';
    }
  };

  return (
    <div
      ref={widgetRef}
      id={`touchline-widget-${Date.now()}`}
      className={`touchline-chat-widget ${className}`}
      style={{
        ...positionStyles[position],
        ...style
      }}
      onMouseEnter={showOnHover ? () => setIsMinimized(false) : undefined}
      onMouseLeave={showOnHover ? () => setIsMinimized(true) : undefined}
    >
      {/* Minimized state for floating widgets */}
      {isMinimized && (position === 'bottom-right' || position === 'bottom-left') && (
        <div
          onClick={handleMinimizeToggle}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'white',
            fontSize: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          {getStatusIcon()}
        </div>
      )}

      {/* Full widget state */}
      {!isMinimized && (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          {/* Minimize button for floating widgets */}
          {(position === 'bottom-right' || position === 'bottom-left') && (
            <button
              onClick={handleMinimizeToggle}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 1001,
                background: 'rgba(255,255,255,0.9)',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          )}

          {/* Loading state */}
          {connectionStatus !== 'ready' && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: position === 'hero' ? '16px' : '8px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                {getStatusIcon()}
              </div>
              <div style={{ fontSize: '18px', fontWeight: '600' }}>
                q.Chat
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
                Football Intelligence Assistant
              </div>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>
                {getStatusText()}
              </div>
            </div>
          )}

          {/* Widget container - will be populated by the script */}
          <div 
            id="touchline-widget"
            style={{ 
              width: '100%', 
              height: '100%',
              display: connectionStatus === 'ready' ? 'block' : 'none'
            }} 
          />
        </div>
      )}
    </div>
  );
};

export default TouchlineChatWidget;
