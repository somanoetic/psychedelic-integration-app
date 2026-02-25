# Security Fix Deployment Guide

**Critical Security Issues Fixed:**
- FINDING-01: API keys no longer in client bundle ✅
- FINDING-02: Anthropic API now server-side only ✅

**Date:** 2026-02-10
**Estimated Time:** 1-2 hours

---

## Overview

This guide walks through deploying the server-side Claude API proxy that fixes the critical security vulnerability where the Anthropic API key was exposed in the client bundle.

### What Changed

**Before (INSECURE):**
```
Client App → Direct Claude API call with embedded API key
```

**After (SECURE):**
```
Client App → Supabase Auth → Edge Function → Claude API
              (JWT token)    (API key server-side)
```

---

## Prerequisites

- [ ] Supabase project access
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Anthropic API key (you'll set it as a secret)

---

## Step 1: Apply Database Migration

The proxy requires two new tables for rate limiting and usage tracking.

```bash
# Navigate to project root
cd psychedelic-integration-app

# Apply the migration
supabase db push

# Or if using Supabase CLI locally:
supabase db reset
```

**Migration creates:**
- `user_rate_limits` table - tracks requests per user
- `api_usage_logs` table - logs API usage for cost tracking
- RLS policies for secure access

**Verify migration:**
```bash
supabase db diff
```

Should show the new tables and policies.

---

## Step 2: Deploy Edge Function

### 2a. Link your Supabase project

```bash
supabase link --project-ref <your-project-ref>
```

**Find your project ref:**
- Go to Supabase Dashboard → Settings → General
- Copy "Reference ID"

### 2b. Set the Anthropic API key as a secret

```bash
supabase secrets set ANTHROPIC_API_KEY=<your-api-key>
```

**Where to get your API key:**
- Go to https://console.anthropic.com/
- Settings → API Keys
- Copy your existing key OR generate a new one (recommended)

### 2c. Deploy the edge function

```bash
# Deploy claude-proxy function
supabase functions deploy claude-proxy

# View deployment status
supabase functions list
```

**Expected output:**
```
┌──────────────┬────────┬─────────────────┬────────────┐
│ NAME         │ STATUS │ VERSION         │ UPDATED    │
├──────────────┼────────┼─────────────────┼────────────┤
│ claude-proxy │ active │ <version>       │ <timestamp>│
└──────────────┴────────┴─────────────────┴────────────┘
```

### 2d. Test the edge function

```bash
# Get your auth token from Supabase Dashboard or your app
# Settings → API → anon key (for testing)

curl -X POST \
  https://<project-ref>.supabase.co/functions/v1/claude-proxy \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 100,
    "messages": [
      {"role": "user", "content": "Say hello in one word"}
    ]
  }'
```

**Expected response:**
```json
{
  "id": "msg_...",
  "type": "message",
  "role": "assistant",
  "content": [{"type": "text", "text": "Hello!"}],
  "usage": {...},
  "_proxy_metadata": {
    "rate_limit_remaining": 99,
    "rate_limit_reset": "..."
  }
}
```

---

## Step 3: Update Client Code

### 3a. Migration Strategy

You have **12 AI service files** that need to be migrated:

**Files to update:**
- `lib/dailyJournalAIService.js`
- `lib/nervousSystemMappingAIService.js`
- `lib/coreBeliefsAIService.js`
- `lib/polyvagalAIService.js`
- `lib/triggersGlimmersAIService.js`
- `lib/ifsAIService.js`
- `lib/regulatingResourcesAIService.js`
- And 5 more...

### 3b. Migration Pattern

**OLD CODE (Direct API call):**
```javascript
import Anthropic from '@anthropic-ai/sdk';
import config from './config';

const anthropic = new Anthropic({
  apiKey: config.anthropicApiKey, // ❌ INSECURE
});

const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  messages: [{ role: 'user', content: prompt }],
});
```

**NEW CODE (Proxy call):**
```javascript
import claudeProxyService from './claudeProxyService';

const response = await claudeProxyService.sendMessage(
  [{ role: 'user', content: prompt }],
  {
    model: 'claude-sonnet-4-20250514',
    maxTokens: 1024,
  }
);
```

### 3c. Example: Update dailyJournalAIService.js

**See:** `.full-stack-feature/MIGRATION_EXAMPLE.md` for a complete before/after example.

### 3d. Recommended Migration Order

1. **Start with 1 service** (e.g., `dailyJournalAIService.js`)
2. **Test thoroughly** in the app
3. **Migrate the rest** once confident
4. **Remove** `@anthropic-ai/sdk` dependency once all services migrated

```bash
# After all services migrated:
npm uninstall @anthropic-ai/sdk
```

---

## Step 4: Update Environment Variables

### 4a. Update .env.example

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# REMOVED: ANTHROPIC_API_KEY (now server-side only)
# Claude API now accessed via Supabase Edge Function proxy
# To set API key: supabase secrets set ANTHROPIC_API_KEY=sk-...
```

### 4b. Update local .env

Remove the `ANTHROPIC_API_KEY` line from your local `.env`:

```bash
# Before:
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
ANTHROPIC_API_KEY=sk-... ← Remove this line

# After:
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

---

## Step 5: Test & Verify

### 5a. Test in development

```bash
npm start
```

**Test these flows:**
- [ ] Daily journal prompt generation
- [ ] Nervous system mapping
- [ ] Core beliefs exploration
- [ ] Any other AI-powered features

**Check for:**
- ✅ AI responses working correctly
- ✅ No errors in console about missing API key
- ✅ Rate limit headers in responses (dev console)

### 5b. Test rate limiting

Make 101 requests rapidly and verify:
- First 100 succeed
- 101st request returns 429 error with reset time

### 5c. Monitor usage

Check Supabase:
```sql
-- View rate limits
SELECT * FROM user_rate_limits;

-- View API usage
SELECT * FROM api_usage_logs ORDER BY created_at DESC LIMIT 20;

-- View usage summary
SELECT * FROM user_api_usage_summary;
```

---

## Step 6: Deploy to Production

### 6a. EAS Build

If using Expo EAS:

```bash
# Build new version with updated code
eas build --platform all

# Submit to stores (after testing)
eas submit --platform all
```

### 6b. Over-the-Air Update (OTA)

For faster deployment (doesn't require app store approval):

```bash
eas update --branch production --message "Security fix: Move Claude API to server-side"
```

**Note:** OTA updates work for JS changes only, not native code changes.

---

## Step 7: Post-Deployment Verification

### 7a. Check edge function logs

```bash
supabase functions logs claude-proxy

# Or in Supabase Dashboard:
# Edge Functions → claude-proxy → Logs
```

**Look for:**
- ✅ Successful requests (200 status)
- ⚠️ Any 429 rate limits (expected for heavy users)
- ❌ Any 500 errors (investigate immediately)

### 7b. Monitor API costs

```sql
-- Daily API cost summary
SELECT
  DATE(created_at) AS date,
  COUNT(*) AS requests,
  SUM(input_tokens) AS input_tokens,
  SUM(output_tokens) AS output_tokens,
  SUM(cost_estimate) AS total_cost
FROM api_usage_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## Rollback Plan

If issues arise:

### Quick Rollback (Revert client code)

```bash
git revert <commit-hash>
eas update --branch production --message "Rollback: Revert to direct API"
```

**⚠️ WARNING:** This re-exposes the API key! Only use as emergency rollback.

### Proper Rollback (Keep proxy but fix issues)

```bash
# Redeploy edge function with fixes
supabase functions deploy claude-proxy

# No client changes needed
```

---

## Troubleshooting

### Issue: "Authentication required" error

**Cause:** User not logged in or session expired

**Fix:**
```javascript
// Check auth before AI calls
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  // Redirect to login
}
```

### Issue: Edge function returns 500

**Check:**
1. Edge function logs: `supabase functions logs claude-proxy`
2. API key secret is set: `supabase secrets list`
3. Database tables exist: Check `user_rate_limits` and `api_usage_logs`

### Issue: Rate limit too restrictive

**Adjust rate limit:**
Edit `supabase/functions/claude-proxy/index.ts`:
```typescript
const RATE_LIMIT_PER_DAY = 200; // Increase from 100
```

Redeploy:
```bash
supabase functions deploy claude-proxy
```

---

## Security Benefits Summary

✅ **API key never exposed** to client
✅ **Rate limiting** prevents abuse
✅ **Cost tracking** per user
✅ **Authentication** required for all requests
✅ **Audit trail** of all API usage
✅ **Easy monitoring** via Supabase dashboard

---

## Next Steps

After deployment is stable:

1. **Monitor costs** for 1 week
2. **Adjust rate limits** based on actual usage patterns
3. **Migrate remaining AI services** (if not all done yet)
4. **Set up alerts** for high usage or costs
5. **Consider caching** frequently requested prompts

---

## Related Documents

- [Migration Example](./MIGRATION_EXAMPLE.md) - Complete before/after code
- [Security Audit Report](./SECURITY_AUDIT_REPORT.md) - Full security findings
- [Testing Report](./07-testing.md) - Test coverage details

---

**Deployment Owner:** [Your Name]
**Deployment Date:** [Date completed]
**Status:** ⏳ In Progress → ✅ Complete

---

## Checklist

Use this checklist during deployment:

- [ ] Database migration applied
- [ ] Edge function deployed
- [ ] API key set as secret
- [ ] Edge function tested (curl)
- [ ] Client code updated (at least 1 service)
- [ ] Local testing passed
- [ ] Rate limiting verified
- [ ] Usage logs working
- [ ] EAS build created
- [ ] OTA update published (if applicable)
- [ ] Production monitoring active
- [ ] Team notified of deployment
- [ ] Documentation updated
- [ ] .env and .env.example updated

---

**Document Version:** 1.0
**Last Updated:** 2026-02-10
**Next Review:** After deployment complete
