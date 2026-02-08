# Supabase Row Level Security (RLS) Guide

**Project:** Psychedelic Integration App
**Last Updated:** 2026-02-07

---

## What is RLS?

Row Level Security (RLS) is a PostgreSQL feature that restricts which rows users can access in database tables. It's your primary security mechanism when using Supabase's `anon` key in client-side code.

**Without RLS:** Anyone with your anon key can read/write ALL data
**With RLS:** Users can only access rows permitted by your policies

---

## Checking Your RLS Status

### Quick Check (Supabase Dashboard)

1. Go to: https://app.supabase.com/project/hxpyeudklnqtwspmdsuz/database/tables
2. For each table, look for:
   - 🟢 "RLS enabled" badge = Good!
   - 🔴 "RLS disabled" = Dangerous!
   - 📋 Click "Policies" to see rules

### Tables in Your App

Based on your codebase, you likely have these tables:
- `users` - User profiles
- `sessions` - Integration sessions
- `journal_entries` - Daily journal entries
- `exercises` - Practice exercises
- `habit_tracker` - Habit tracking data
- `trigger_logs` - Trigger tracking
- `glimmer_logs` - Glimmer tracking
- `exercise_progress` - Exercise completion

**All of these should have RLS enabled!**

---

## Example RLS Policies

### For User-Owned Data (Most Common)

Tables like `journal_entries`, `sessions`, `habit_tracker`, etc. should allow users to only access their own data:

#### Enable RLS
```sql
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
```

#### Policy: Users can view their own entries
```sql
CREATE POLICY "Users can view own journal entries"
ON journal_entries
FOR SELECT
USING (auth.uid() = user_id);
```

#### Policy: Users can insert their own entries
```sql
CREATE POLICY "Users can insert own journal entries"
ON journal_entries
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

#### Policy: Users can update their own entries
```sql
CREATE POLICY "Users can update own journal entries"
ON journal_entries
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

#### Policy: Users can delete their own entries
```sql
CREATE POLICY "Users can delete own journal entries"
ON journal_entries
FOR DELETE
USING (auth.uid() = user_id);
```

---

### For Public Read, User Write

If you have tables that everyone can read but only the owner can modify (like user profiles):

#### Policy: Anyone can view profiles
```sql
CREATE POLICY "Public profiles are viewable"
ON users
FOR SELECT
USING (true);
```

#### Policy: Users can update their own profile
```sql
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

---

### For Shared/Reference Data

If you have reference tables (like `exercises` or educational content) that should be read-only:

#### Policy: Anyone can view exercises
```sql
CREATE POLICY "Exercises are publicly viewable"
ON exercises
FOR SELECT
USING (true);
```

---

## Testing Your RLS Policies

### Method 1: Supabase Dashboard

1. Go to SQL Editor: https://app.supabase.com/project/hxpyeudklnqtwspmdsuz/sql
2. Run test queries as different users

### Method 2: Test Script

Run this from your app:

```javascript
// Test RLS with anonymous user (should fail)
const { data, error } = await supabase
  .from('journal_entries')
  .select('*');

console.log('Anonymous access:', error ? 'BLOCKED ✅' : 'ALLOWED ❌');

// Test RLS with authenticated user (should work)
await supabase.auth.signInWithPassword({ email: 'test@example.com', password: 'password' });
const { data: userData, error: userError } = await supabase
  .from('journal_entries')
  .select('*');

console.log('Authenticated access:', userError ? 'BLOCKED ❌' : 'ALLOWED ✅');
```

---

## Quick Fix: Enable RLS on All Tables

If you're not sure if RLS is enabled, run this in Supabase SQL Editor:

```sql
-- Enable RLS on all user data tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE trigger_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE glimmer_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_progress ENABLE ROW LEVEL SECURITY;

-- Add basic policies (customize as needed)
-- Example for journal_entries:
CREATE POLICY "Users can manage own journal entries"
ON journal_entries
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

## Common Mistakes

### ❌ Mistake 1: RLS Disabled
**Problem:** Anyone can read/write all data
**Fix:** Enable RLS on all tables with user data

### ❌ Mistake 2: Too Permissive Policies
**Problem:** Policies using `USING (true)` for write operations
**Fix:** Always check `auth.uid() = user_id` for user data

### ❌ Mistake 3: Using service_role Key Client-Side
**Problem:** Bypasses ALL RLS policies
**Fix:** Never use service_role key in client code!

### ❌ Mistake 4: Forgetting WITH CHECK
**Problem:** Users can change row ownership during updates
**Fix:** Always include `WITH CHECK (auth.uid() = user_id)`

---

## Security Checklist

- [ ] RLS enabled on all tables with user data
- [ ] Policies check `auth.uid() = user_id` for user data
- [ ] `service_role` key never used client-side (only in .env on server)
- [ ] `anon` key used in React Native app
- [ ] Test policies with different user accounts
- [ ] No policies using `USING (true)` for write operations on user data
- [ ] Public/reference data has read-only policies

---

## Your Current Status

Based on the test we ran earlier:

```
⚠️  Connection test returned error: Could not find the table 'public.users' in the schema cache
(This might be normal if table doesn't exist or RLS is strict)
```

This error suggests either:
1. The `users` table doesn't exist (check your schema)
2. RLS is enabled and blocking access (good!)
3. Your anon key doesn't have permission (check policies)

**Next Steps:**
1. Log into Supabase dashboard
2. Check which tables exist
3. Verify RLS is enabled on each table
4. Add appropriate policies if missing

---

## Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Policy Templates](https://supabase.com/docs/guides/database/postgres/row-level-security#policy-templates)

---

## Need Help?

If you're unsure about your RLS setup:
1. Check the Supabase dashboard for RLS status
2. Review your policies in SQL Editor
3. Test with the script above
4. Consider hiring a Supabase expert for audit

**Remember:** The `anon` key being exposed is OK as long as RLS is properly configured!
