# Touchline Chat Widget React Component

A flexible React component for embedding the Qount.AI football intelligence chatbot in your Lovable project.

## Installation

1. Copy the `TouchlineChatWidget.jsx` file to your Lovable project's components folder
2. Import and use the component in your pages

## Basic Usage

### Hero Section Integration
```jsx
import TouchlineChatWidget from './components/TouchlineChatWidget';

function HeroSection() {
  return (
    <div className="hero-section">
      <div className="hero-content">
        <h1>AI-Powered Football Trading</h1>
        <p>Get intelligent betting insights with our advanced AI assistant</p>
      </div>
      
      {/* Embedded chat widget in hero */}
      <div className="hero-chat">
        <TouchlineChatWidget 
          position="hero"
          theme="qount"
          autoOpen={true}
        />
      </div>
    </div>
  );
}
```

### Floating Chat Button
```jsx
import TouchlineChatWidget from './components/TouchlineChatWidget';

function App() {
  return (
    <div className="app">
      {/* Your app content */}
      
      {/* Floating chat widget */}
      <TouchlineChatWidget 
        position="bottom-right"
        theme="qount"
        minimized={true}
        showOnHover={false}
      />
    </div>
  );
}
```

### Inline Widget
```jsx
import TouchlineChatWidget from './components/TouchlineChatWidget';

function DataRoomPage() {
  return (
    <div className="data-room">
      <h2>Access Data Room</h2>
      
      {/* Inline widget */}
      <TouchlineChatWidget 
        position="inline"
        theme="qount"
        className="my-custom-widget"
      />
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | string | `'bottom-right'` | Widget position: `'bottom-right'`, `'bottom-left'`, `'inline'`, `'hero'` |
| `theme` | string | `'qount'` | Branding theme: `'qount'`, `'turboscores'`, `'custom'` |
| `customBranding` | object | `null` | Custom branding config (overrides theme) |
| `className` | string | `''` | Additional CSS classes |
| `style` | object | `{}` | Additional inline styles |
| `autoOpen` | boolean | `false` | Auto-open widget on load |
| `showOnHover` | boolean | `false` | Show/hide on hover (floating widgets) |
| `minimized` | boolean | `false` | Start in minimized state |

## Custom Branding

```jsx
const customBranding = {
  title: 'My Custom Chat',
  subtitle: 'AI Assistant',
  footer: 'powered by My Company',
  icon: '🤖'
};

<TouchlineChatWidget 
  theme="custom"
  customBranding={customBranding}
/>
```

## Styling

The component includes built-in styles, but you can override them:

```css
.touchline-chat-widget {
  /* Your custom styles */
}

.hero-chat .touchline-chat-widget {
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  border-radius: 20px;
}
```

## Examples for Different Positions

### 1. Hero Section (Recommended for landing page)
- Large, prominent display
- Perfect for showcasing the AI capability
- Built-in loading states with branded styling

### 2. Floating Button
- Unobtrusive, always accessible
- Minimizes when not in use
- Hover interactions available

### 3. Inline Integration
- Part of the page flow
- Great for dedicated chat pages
- Full customization options

## Connection Handling

The component automatically:
- Tests API connectivity
- Shows loading states
- Handles connection errors gracefully
- Displays appropriate status messages

## Browser Compatibility

Works with all modern browsers that support:
- ES6+ JavaScript
- CSS Grid/Flexbox
- Fetch API
