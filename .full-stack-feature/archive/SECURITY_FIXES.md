# Security Fixes - AI Monitoring & Observability

**Date:** 2026-02-09
**Auditor:** Security Engineering
**Scope:** AI Monitoring & Observability feature (FEAT-203)

---

## Summary

Six security issues (2 CRITICAL, 4 HIGH) were identified and remediated during a security audit of the AI Monitoring & Observability feature. All fixes are backward-compatible and do not break existing functionality.

---

## CRITICAL Issues Fixed

### 1. Hardcoded API Keys in Git Repository

**Severity:** CRITICAL
**Files Changed:**
- `lib/config.js` - Removed hardcoded Supabase URL, anon key, and Anthropic API key
- `lib/supabase.js` - Removed hardcoded Supabase URL and anon key
- `app.config.js` - Changed from hardcoded values to `process.env.*` references
- `app.json` - Cleared hardcoded secret values (set to empty strings)
- `.env.example` - Updated with security warnings, removed SUPABASE_SERVICE_KEY

**What was wrong:**
API keys for Supabase and Anthropic were hardcoded directly in source files committed to git. This means anyone with repository access (or who found the repo) could extract these credentials and:
- Access the Supabase database directly
- Make API calls using the project's Anthropic key (cost and abuse risk)
- Potentially escalate privileges using the exposed keys

**How it was fixed:**
- `lib/config.js` now reads from Expo Constants (`Constants.expoConfig.extra`) which are injected at build time from environment variables
- `lib/supabase.js` now imports configuration from the centralized `lib/config.js`
- `app.config.js` reads secrets from `process.env` via `dotenv/config`
- `app.json` no longer contains any secret values
- `.env.example` documents required variables without actual values
- `.gitignore` already excludes `.env` (verified)

**Action required after merge:**
- Rotate all compromised keys immediately (Supabase anon key, Anthropic API key)
- For EAS builds, set secrets via `eas secret:create` or in `eas.json` secrets section
- Verify `.env` file exists locally with correct values after checkout

---

### 2. Emergency Auth Bypass Button in Production

**Severity:** CRITICAL
**File Changed:** `App.js` (lines 289-299)

**What was wrong:**
A "Emergency Bypass (Test Mode)" button was rendered unconditionally in the loading screen. In production builds, users could tap this button to bypass authentication entirely and access all app features without logging in.

**How it was fixed:**
The button is now wrapped in a `{__DEV__ && (...)}` conditional. React Native's `__DEV__` global is `true` only in development builds and `false` in production. The button will never render in production builds - the code is stripped entirely by the JavaScript bundler during production builds.

---

## HIGH Issues Fixed

### 3. Service Role Key Used Client-Side

**Severity:** HIGH
**File Changed:** `lib/metricsService.js`

**What was wrong:**
The `MetricsService.initialize()` method created a Supabase admin client using `SUPABASE_SERVICE_KEY`. The service role key bypasses all Row Level Security (RLS) policies, meaning:
- If the key leaked from the client bundle, an attacker could read/write/delete any data in the database
- Even without leaking, using the service key on the client violates the principle of least privilege

**How it was fixed:**
- Removed the `createClient` import and all references to `SUPABASE_SERVICE_KEY`
- The service now uses the shared authenticated Supabase client (from `lib/supabase.js`) which uses the anon key + user's JWT
- Added new RLS policies in the security migration (`20260209000001_security_fixes.sql`) that allow authenticated users to INSERT their own metrics
- Admin dashboard reads still work via existing admin RLS policies

**Remaining consideration:**
For admin-only operations that require elevated privileges (like refreshing materialized views), a Supabase Edge Function should be created. This keeps the service role key on the server side only. The current admin dashboard read operations will work for users with the admin role via existing RLS policies.

---

### 4. PII (User Input Text) Stored in Routing Decisions

**Severity:** HIGH
**Files Changed:**
- `lib/metricsService.js` - `logRoutingDecision()` no longer accepts `inputText`
- `lib/conversationalRoutingService.js` - Callers updated to pass `inputLength` and `detectedIntents` instead of `userMessage`
- `supabase/migrations/20260209000001_security_fixes.sql` - Clears existing PII data, deprecates column

**What was wrong:**
User input text (up to 500 characters) was being stored in the `ai_routing_decisions` table via `metricsService.logRoutingDecision({ inputText: userMessage, ... })`. This is a privacy violation because:
- User input may contain sensitive personal information (mental health disclosures, trauma descriptions)
- GDPR Article 5(1)(c) requires data minimization - only collect what is necessary
- The text was not needed for routing quality analysis

**How it was fixed:**
- `logRoutingDecision()` API changed: removed `inputText` parameter, added `inputLength` (number) and `detectedIntents` (array of strings)
- Callers in `conversationalRoutingService.js` updated to pass only metadata
- Database column `user_input_preview` is set to NULL for all existing rows
- Column marked as DEPRECATED with a comment clarifying it must not contain user text
- The `input_length` and `detected_intents` fields are stored in the `metadata` JSONB column instead

**What is logged now (non-PII):**
- `input_length`: Character count of the message (e.g., 42)
- `detected_intents`: Array of matched intent keywords (e.g., ["nervous_system_mapping"])
- `selected_route`: The route chosen
- `confidence`: Confidence score
- `alternatives`: Alternative routes considered

---

### 5. GDPR Deletion Function Unrestricted

**Severity:** HIGH
**File Changed:** `supabase/migrations/20260209000001_security_fixes.sql`

**What was wrong:**
The `delete_user_ai_data(target_user_id UUID)` function had no authorization check. Any authenticated user could call `SELECT delete_user_ai_data('any-user-id')` and delete another user's AI monitoring data.

**How it was fixed:**
Added authorization check at the start of the function:
```sql
IF auth.uid() != target_user_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
END IF;
```

Users can now only delete their own data. Admins can delete any user's data (required for GDPR right-to-erasure requests processed by support staff).

---

### 6. Admin Check Uses Mutable User Metadata

**Severity:** HIGH
**File Changed:** `supabase/migrations/20260209000001_security_fixes.sql`

**What was wrong:**
The `is_admin()` and `is_service_account()` functions checked `raw_user_meta_data->>'role'` from the `auth.users` table. This metadata is user-modifiable via `supabase.auth.updateUser({ data: { role: 'admin' } })`, meaning any authenticated user could escalate their privileges to admin.

**How it was fixed:**
- Created a new `user_roles` table with RLS policies that only admins can modify
- `is_admin()` now checks `SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'`
- `is_service_account()` similarly updated
- The `user_roles` table includes an audit trail (`granted_by` column)
- RLS policies on `user_roles` ensure only existing admins can grant/revoke roles

**Action required after merge:**
- Insert the initial admin user(s) into the `user_roles` table via a database migration or direct SQL. Example:
  ```sql
  INSERT INTO public.user_roles (user_id, role) VALUES ('your-admin-user-uuid', 'admin');
  ```

---

## Files Changed Summary

| File | Change Type | Issue |
|------|------------|-------|
| `lib/config.js` | Modified | CRITICAL #1 - Removed hardcoded keys |
| `lib/supabase.js` | Modified | CRITICAL #1 - Uses config.js |
| `app.config.js` | Modified | CRITICAL #1 - Reads from process.env |
| `app.json` | Modified | CRITICAL #1 - Cleared hardcoded keys |
| `.env.example` | Modified | CRITICAL #1 - Updated template |
| `App.js` | Modified | CRITICAL #2 - __DEV__ gate on bypass button |
| `lib/metricsService.js` | Modified | HIGH #3 + #4 - Removed service key, removed PII |
| `lib/conversationalRoutingService.js` | Modified | HIGH #4 - Removed PII from logging calls |
| `supabase/migrations/20260209000001_security_fixes.sql` | Created | HIGH #5 + #6 - Auth check, user_roles table |

---

## Remaining Considerations

1. **Key Rotation Required:** The previously exposed Supabase anon key and Anthropic API key should be rotated immediately. Even though they are now removed from source code, they exist in git history.

2. **Git History Cleanup:** Consider using `git filter-branch` or BFG Repo-Cleaner to remove the hardcoded keys from git history entirely. This is especially important if the repository is or will be public.

3. **Supabase Edge Function for Admin Reads:** The admin dashboard currently reads metrics via the authenticated client. If the admin needs to perform operations that bypass RLS (like refreshing materialized views), create a Supabase Edge Function that holds the service role key server-side.

4. **Initial Admin Setup:** After applying the security migration, at least one admin user must be seeded into the `user_roles` table. Until this is done, no user will have admin access to the monitoring dashboards.

5. **EAS Build Secrets:** For production EAS builds, secrets must be configured via `eas secret:create` or the EAS dashboard. The `.env` file is only for local development.

6. **Column Cleanup:** The `user_input_preview` column in `ai_routing_decisions` is deprecated but not dropped (to avoid breaking existing queries). It should be dropped in a future migration after confirming no code references it.

7. **Monitoring:** Set up alerts for failed RLS policy checks (Supabase logs) to detect attempted unauthorized access to metrics tables.
