# Touchline Football Chat System - Changelog

All notable changes to the Touchline football chat system will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.0] - 2025-09-16

### Added
- **Chat Logging System**
  - New `chat_logs` MySQL table to track all user interactions
  - Automatic logging of IP addresses, timestamps, and user prompts
  - Response length tracking for analytics
  - Context tracking (welcome, conversational, betting queries)
  - `/api/chat-logs` endpoint for viewing interaction history
  - `/api/chat-stats` endpoint for usage analytics and statistics

### Enhanced
- **Database Integration**
  - Automatic table creation on server startup
  - Comprehensive IP address detection (supports proxies and load balancers)
  - Error handling for logging failures without affecting chat functionality

## [1.2.0] - 2025-09-16

### Added
- **Comprehensive Team Name Mapping System**
  - Created TeamMapping.csv with 1,036 team name variations
  - Automatic mapping from user queries to database team names
  - Support for common variations (e.g., "Manchester United" → "Man United", "Manchester City" → "Man City")
  - `loadTeamMappingData()` and `mapTeamNameToDatabase()` functions in server.js

### Changed
- **URL Standardization**
  - Updated all components to use correct DigitalOcean domain: `https://shark-app-robkv.ondigitalocean.app`
  - Fixed inconsistent URLs across lovable-integration.js, TouchlineChatWidget.jsx, and cors-test.html
  - Updated integration documentation with correct endpoints

### Fixed
- **Database Query Accuracy**
  - Team name queries now work correctly for all major clubs
  - Improved match search reliability with flexible team name matching

## [1.1.0] - 2025-09-16

### Added
- **Multi-Brand Widget System**
  - Support for multiple brand configurations (TurboScores, Qount.AI)
  - Customizable branding with titles, subtitles, footers, and icons
  - Brand-specific styling and theming
  - New route `/qount-demo` for Qount.AI branded interface

- **Enhanced Embedding Options**
  - `TouchlineChatWidget.jsx` - Advanced React component with multi-brand support
  - `MinimalTouchlineChat.jsx` - Clean, minimal chat-only component
  - `lovable-integration.js` - Simple integration for Lovable applications
  - `qount-hero-complete.html` - Complete hero section with integrated chat

- **New Chat Widget Positions**
  - Hero section integration
  - Floating widget overlay
  - Inline embedded chat
  - Minimal chat-only interface

### Changed
- **CORS Configuration**
  - Updated to allow embedding on external websites
  - Configured for all origins to support third-party integration

## [1.0.0] - 2025-09-16

### Added
- **Core Football Chat System**
  - Real-time football match queries
  - Database integration with comprehensive match data
  - RESTful API endpoints for match information

- **League Support**
  - Bundesliga (D1) support with proper shortcode mapping
  - Premier League (E0) integration
  - Weekend date calculation for match queries
  - League-specific query handling

- **Internationalization**
  - German to English translation for broader market reach
  - Localized user interface elements
  - Multi-language support foundation

### Fixed
- **Database Query Issues**
  - Fixed Bundesliga shortcode mapping (D1)
  - Corrected weekend date calculations
  - Improved query reliability and accuracy

## Technical Infrastructure

### Database Schema
- **Match Data Tables**: Comprehensive football match information
- **Team Mapping**: CSV-based team name normalization
- **League Codes**: Standardized league identification system

### API Endpoints
- `/search-matches` - Match search with flexible team name mapping
- `/minimal-chat` - Minimal chat interface
- `/hero` - Hero section component
- `/qount-demo` - Branded demo interface

### Deployment
- **DigitalOcean App Platform**: `https://shark-app-robkv.ondigitalocean.app`
- **GitHub Repository**: `https://github.com/schmalte04/touchline`
- **Continuous Deployment**: Automated deployment pipeline

## Development Notes

### Team Name Mapping
The system uses a comprehensive CSV file (TeamMapping.csv) to handle team name variations:
- **Database Standard**: Uses Football.Data naming conventions
- **User Input**: Accepts common variations and alternative names
- **Automatic Conversion**: Real-time mapping during queries

### Multi-Brand Architecture
The widget system supports multiple brands through configuration objects:
```javascript
const brandConfig = {
  title: "Brand Name",
  subtitle: "Chat Description", 
  footer: "Powered by Brand",
  icon: "icon-url"
};
```

### Integration Options
Multiple embedding methods available:
1. **React Components** - For React applications
2. **HTML Widgets** - For static websites
3. **JavaScript Integration** - For dynamic sites
4. **Hero Sections** - For landing pages

---

*This changelog is automatically maintained and reflects all major changes to the Touchline football chat system.*
