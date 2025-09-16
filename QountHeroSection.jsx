import React from 'react';
import TouchlineChatWidget from './TouchlineChatWidget';

const QountHeroSection = () => {
  return (
    <div className="qount-hero-section">
      <div className="hero-grid">
        {/* Left side - Your existing content */}
        <div className="hero-content">
          <div className="info-badge">
            ℹ️ We turn sports trading into a professional asset class
          </div>
          
          <h1 className="hero-title">
            Artificial Intelligence Meets
            <br />
            Algorithmic Trading
          </h1>
          
          <p className="hero-description">
            Our AI exploits mispriced odds in milliseconds — generating consistent 
            alpha across sports markets. We turn market inefficiencies into 
            predictable profit streams through systematic algorithmic execution.
          </p>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">€2M</div>
              <div className="stat-label">Turnover per Season</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">12</div>
              <div className="stat-label">Profitable Strategies</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">€750</div>
              <div className="stat-label">Avg Bet Size</div>
            </div>
          </div>
          
          <button className="cta-button">
            Access Whitepaper →
          </button>
        </div>
        
        {/* Right side - Chat widget */}
        <div className="hero-chat-container">
          <TouchlineChatWidget 
            position="hero"
            theme="qount"
            autoOpen={false}
            style={{
              maxWidth: '420px',
              height: '650px',
              borderRadius: '20px',
              boxShadow: '0 25px 80px rgba(0,0,0,0.15)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          />
        </div>
      </div>
      
      {/* Bottom badges */}
      <div className="hero-badges">
        <span className="badge">✅ Fully Regulatory Compliant</span>
        <span className="badge">✅ Proven Business Model</span>
        <span className="badge">✅ Ready to Scale</span>
      </div>
    </div>
  );
};

export default QountHeroSection;
