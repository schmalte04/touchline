# 🎯 Touchline AI Widget - Integration Guide

## Quick Integration for Turboscores

## 🎯 Live Demos

1. **General Widget Demo**: https://shark-app-robkv.ondigitalocean.app/demo
   - Shows widget features and capabilities

2. **Turboscores Integration Demo**: https://shark-app-robkv.ondigitalocean.app/turboscores-demo
   - Styled specifically for Turboscores branding

3. **Real Website Integration Demo**: https://shark-app-robkv.ondigitalocean.app/turboscores-iframe-demo
   - Shows widget overlaid on actual Turboscores website
   - Demonstrates real-world integration

## 💻 One-Line Integration

### 1-Line Integration

Add this single line to your website's HTML (before closing `</body>` tag):

```html
<script src="https://shark-app-robkv.ondigitalocean.app/widget/touchline-widget.js"></script>
```

**That's it!** The AI chat widget will automatically appear in the bottom right corner.

---

## Features

✅ **Smart Positioning** - Automatically positions like WhoScored Teammate  
✅ **Mobile Responsive** - Full-screen on mobile devices  
✅ **Theme Support** - Light/dark themes + custom colors  
✅ **Multi-language** - German/English support  
✅ **AI-Powered** - Real betting analysis and recommendations  
✅ **Zero Configuration** - Works out of the box  

---

## Advanced Configuration

### Custom Positioning & Styling

```html
<script>
window.TouchlineConfig = {
    position: 'bottom-right',    // bottom-left, top-right, top-left
    theme: 'light',             // light, dark, auto
    primaryColor: '#4CAF50',    // Your brand color
    apiUrl: 'https://shark-app-robkv.ondigitalocean.app'
};
</script>
<script src="https://shark-app-robkv.ondigitalocean.app/widget/touchline-widget.js"></script>
```

### Available Positions
- `bottom-right` (default) - Like WhoScored
- `bottom-left` 
- `top-right`
- `top-left`

### Theme Options
- `light` - Clean white interface
- `dark` - Dark mode interface  
- `auto` - Follows user's system preference

---

## Widget Capabilities

### 🏈 Match Analysis
- ELO rating comparisons
- xG predictions and analysis
- Historical performance data
- League-specific insights

### 🎲 Accumulator Builder
- AI-optimized combinations
- Risk assessment
- Value betting detection
- Confidence scoring

### ⭐ Smart Recommendations
- High-confidence picks
- Market inefficiency detection
- Real-time odds analysis
- Personalized suggestions

### 📊 Live Data Integration
- Real-time match data
- Live odds updates
- In-play analysis
- Statistical insights

---

## Perfect for Turboscores

### Why It Fits
- **Same UX Pattern** as WhoScored Teammate
- **Sports-Focused** betting intelligence
- **Unobtrusive** design that doesn't interfere with your content
- **Mobile-Optimized** for all devices
- **Easy Integration** - no complex setup

### Revenue Potential
- **Affiliate Integration** - Connect to betting partners
- **Premium Features** - Advanced analytics
- **User Engagement** - Keeps users on site longer
- **Data Insights** - Understand user betting preferences

---

## Technical Details

### Performance
- **Lightweight** - <50KB total size
- **Fast Loading** - CDN-delivered
- **No Dependencies** - Pure JavaScript
- **Mobile Optimized** - Responsive design

### Security
- **HTTPS Only** - Secure communications
- **No Data Collection** - Privacy-focused
- **CORS Protected** - Safe cross-origin requests

### Browser Support
- ✅ Chrome, Firefox, Safari, Edge
- ✅ Mobile browsers (iOS/Android)
- ✅ Internet Explorer 11+

---

## Contact & Support

**Demo & Testing**: Try it now at https://shark-app-robkv.ondigitalocean.app/turboscores-demo

**Questions?** The widget is production-ready and can be customized for Turboscores' specific needs.

**Integration Support**: We can help with custom styling, positioning, and feature integration.

---

## Example User Interactions

**User**: "Show me today's best bets"  
**AI**: *Provides detailed analysis of high-value betting opportunities*

**User**: "Build me an accumulator"  
**AI**: *Creates optimized multi-bet combination with risk analysis*

**User**: "Analyze Bayern vs Dortmund"  
**AI**: *Detailed match breakdown with predictions and betting advice*

The AI understands natural language and provides professional betting insights instantly.
