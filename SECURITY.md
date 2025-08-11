# Security Configuration for DigitalOcean App Platform

## Environment Variables Setup

When deploying to DigitalOcean App Platform, you'll need to set your Claude API key as an environment variable:

### Via App Platform Dashboard:
1. Go to your app settings
2. Navigate to "Environment Variables"
3. Add: `CLAUDE_API_KEY` = `[YOUR_ACTUAL_CLAUDE_API_KEY]`
4. Mark as "Encrypted"

### Via app.yaml (Alternative):
Replace `YOUR_CLAUDE_API_KEY_HERE` in `.do/app.yaml` with your actual Claude API key:

```yaml
- key: CLAUDE_API_KEY
  value: [YOUR_ACTUAL_CLAUDE_API_KEY]
  type: SECRET
```

## Why This Approach?

✅ **Security**: API keys not exposed in public repository
✅ **Best Practice**: Environment variables for sensitive data
✅ **Flexibility**: Easy to update keys without code changes
✅ **GitHub Protection**: Prevents accidental key exposure

## Your Claude API Key

The key starts with `sk-ant-api03-` and you have it from your Claude account.
Set it securely in DigitalOcean's environment variables section.
