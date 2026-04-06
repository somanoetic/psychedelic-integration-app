# 🚨 URGENT: FIX SUPABASE RLS NOW

**Status:** CRITICAL DATA BREACH - ALL USER DATA EXPOSED
**Time to Fix:** 15-30 minutes
**Last Updated:** 2026-02-07

---

## What's Wrong?

✗ Row Level Security (RLS) is **DISABLED** on ALL 9 database tables
✗ Combined with exposed Supabase key, this means **ANYONE CAN ACCESS ALL DATA**
✗ Private journals, user sessions, all tracking data - **EVERYTHING IS PUBLIC**

---

## Fix It Right Now (4 Steps)

### STEP 1: Enable RLS in Supabase (10 minutes)

1. **Open Supabase SQL Editor:**
   ```
   https://app.supabase.com/project/hxpyeudklnqtwspmdsuz/sql
   ```

2. **Open this file on your computer:**
   ```
   database/enable-rls-fix.sql
   ```

3. **Copy the entire contents** (Ctrl+A, Ctrl+C)

4. **Paste into Supabase SQL Editor** (Ctrl+V)

5. **Click "RUN" button** (or Ctrl+Enter)

6. **Check the output:**
   - Should see "ALTER TABLE" success messages
   - Should see list of tables with `rls_enabled = t` (true)
   - Should see list of policies created

---

### STEP 2: Verify RLS Is Working (2 minutes)

1. **Open terminal in project directory**

2. **Run the check script:**
   ```bash
   node check-rls.js
   ```

3. **Expected output:**
   ```
   ✓ Tables with RLS protection: 9
   ✗ Tables possibly without RLS: 0
   ```

4. **If you see any ✗ (red X):**
   - Something went wrong
   - Check Supabase SQL Editor for error messages
   - Run `enable-rls-fix.sql` again

---

### STEP 3: Rotate Supabase Key (5 minutes)

1. **Go to Supabase API Settings:**
   ```
   https://app.supabase.com/project/hxpyeudklnqtwspmdsuz/settings/api
   ```

2. **Look for anon key section**

3. **Check if there's a "Rotate" or "Regenerate" button**

4. **If yes:**
   - Click it
   - Copy the new key
   - Update your `.env` file:
     ```
     SUPABASE_ANON_KEY=<new-key-here>
     ```
   - Save `.env` (DO NOT COMMIT IT!)

5. **If no rotation option:**
   - RLS is now enabled, so you're protected
   - But monitor for suspicious activity
   - Consider upgrading Supabase plan for key rotation

---

### STEP 4: Test Your App (5 minutes)

1. **Restart your app**

2. **Try to:**
   - Sign up / Sign in
   - Create a journal entry
   - View your data
   - Track a habit/trigger/glimmer

3. **Everything should still work!**
   - RLS allows authenticated users to access *their own* data
   - It just blocks unauthenticated access

4. **If something breaks:**
   - Check browser/app console for errors
   - The SQL script might need adjustment for your schema
   - Contact me for help

---

## What Just Happened?

### Before (BAD):
```
┌──────────────┐
│  Internet    │
│   (Anyone)   │
└──────┬───────┘
       │
       ↓ Supabase anon key (exposed in git)
┌──────────────┐
│  Supabase    │
│  Database    │  ← No protection!
│              │
│ ALL DATA     │  ← Anyone can read/write
│ EXPOSED      │
└──────────────┘
```

### After (GOOD):
```
┌──────────────┐
│  Internet    │
│   (Anyone)   │
└──────┬───────┘
       │
       ↓ Supabase anon key
┌──────────────┐
│  Supabase    │
│  Database    │  ← RLS Protection!
│              │
│  ✓ RLS       │  ← Users can only see
│  Policies    │     their own data
└──────────────┘
```

---

## After You Fix It

- [ ] Run `node check-rls.js` to verify
- [ ] Test your app works correctly
- [ ] Commit the fix SQL file (NOT .env):
  ```bash
  git add database/enable-rls-fix.sql check-rls.js
  git add context/bugs/critical.md
  git add SECURITY_INCIDENT_2026-02-07.md
  git commit -m "Fix BUG-004: Enable Supabase RLS - Critical security fix"
  ```
- [ ] Update the security incident report
- [ ] Consider notifying users (if you have active users)
- [ ] Monitor Supabase logs for suspicious activity

---

## Questions?

- **"Will this break my app?"** - No! Authenticated users can still access their own data.
- **"Can I skip this?"** - NO! This is a critical data breach. Fix it now.
- **"How long has data been exposed?"** - Since November 2025 (when key was committed to git)
- **"Should I notify users?"** - If you have active users with sensitive data, consider it.

---

## Need Help?

If you run into issues:
1. Check error messages in Supabase SQL Editor
2. Share the error with me
3. Don't panic - we can fix this

**GO FIX IT NOW!** 🏃‍♂️💨
