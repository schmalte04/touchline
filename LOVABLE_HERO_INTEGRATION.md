# Lovable Hero Section Integration

## 🚀 Embed Football Chat in Your Hero Section

### Option 1: React Component (Recommended)

Copy the `lovable-hero-embed.jsx` component into your Lovable app:

```jsx
import HeroWithFootballChat from './lovable-hero-embed';

// Use in your app
<HeroWithFootballChat />
```

### Option 2: Direct iframe Integration

If you want to add just the chat to an existing hero section:

```jsx
<div className="your-existing-hero-classes">
  {/* Your existing hero content */}
  
  {/* Add this chat section */}
  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl max-w-md">
    <div className="mb-4">
      <h3 className="text-xl font-semibold text-white mb-2">Football Assistant</h3>
      <p className="text-gray-300 text-sm">Ask about matches, odds, or predictions</p>
    </div>
    
    <div className="bg-white rounded-xl overflow-hidden shadow-lg">
      <iframe
        src="https://shark-app-robkv.ondigitalocean.app/minimal-chat"
        className="w-full h-96 border-0"
        title="Football Chat Assistant"
        allow="web-share"
        loading="lazy"
      />
    </div>
  </div>
</div>
```

### Option 3: Mobile-Responsive Version

For better mobile experience:

```jsx
<div className="w-full max-w-lg mx-auto">
  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 md:p-6 shadow-2xl">
    <div className="mb-4">
      <h3 className="text-lg md:text-xl font-semibold text-white mb-2">
        Football Intelligence
      </h3>
      <p className="text-gray-300 text-xs md:text-sm">
        Get instant answers about football matches and predictions
      </p>
    </div>
    
    <div className="bg-white rounded-xl overflow-hidden shadow-lg">
      <iframe
        src="https://shark-app-robkv.ondigitalocean.app/minimal-chat"
        className="w-full h-80 md:h-96 border-0"
        title="Football Chat Assistant"
        allow="web-share"
        loading="lazy"
      />
    </div>
    
    <div className="mt-3 text-center">
      <p className="text-xs text-gray-400">
        Powered by Touchline AI
      </p>
    </div>
  </div>
</div>
```

## 🎨 Styling Notes

The iframe approach gives you:
- ✅ Clean integration with your existing design
- ✅ No JavaScript conflicts with your Lovable app
- ✅ Automatic updates when we improve the chat
- ✅ Responsive design that works on all devices
- ✅ Easy to customize the container styling

## 🔧 Customization

You can customize the container around the iframe:
- Change background colors and blur effects
- Adjust sizing (`h-96` = 384px height)
- Modify border radius and shadows
- Add your own branding elements

## 📱 Mobile Considerations

The chat is fully responsive, but you might want to:
- Use different heights on mobile (`h-80 md:h-96`)
- Adjust padding for smaller screens (`p-4 md:p-6`)
- Consider a modal/popup approach on very small screens

## 🚀 Ready to Use

The URL `https://shark-app-robkv.ondigitalocean.app/minimal-chat` is production-ready with:
- Team name mapping (Manchester United → Man United)
- Real-time football data
- Responsive design
- Clean, minimal interface
