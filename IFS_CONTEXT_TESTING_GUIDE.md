# IFS Context System - Testing Guide

## Prerequisites

Before testing, make sure:
1. ✅ Database migration ran successfully (migrate_context_system_final.sql)
2. ✅ You're logged in as a user (so context can be saved)
3. ✅ ANTHROPIC_API_KEY is set in your .env file (for AI features)

---

## Quick Test Sequence

### Test 1: First-Time User Experience (New Part Discovery)

**Goal:** Verify the universal entry point and new part discovery flow

1. **Start the app and navigate to IFS Chat:**
   - Open app → Education tab → "Teach me about myself" → "IFS Chat"

2. **You should see:**
   ```
   Welcome to IFS Parts Work.

   **What part is coming up for you right now?**

   Take a moment to notice... Is there a part that's active right now?
   ```

3. **Type something like:**
   ```
   "I'm feeling anxious about this presentation"
   ```

4. **Expected behavior:**
   - AI should respond and begin the 6 F's discovery process
   - Should ask about location: "Where do you notice this anxious part in your body?"

5. **Continue the discovery:**
   - Answer the questions (location, appearance, role, feelings toward it, etc.)
   - Complete the full 6 F's

6. **At the end you should see:**
   ```
   You've done beautiful work getting to know this part.

   **Part You Worked With:** [what you described]
   **Location:** [what you said]
   ... etc.
   ```

7. **Verify database save:**
   - Go to Supabase dashboard
   - Check `ifs_parts_inventory` table
   - You should see your new part saved
   - Check `ifs_session_history` table
   - You should see a session record with `session_type = 'discovery'`

✅ **Test 1 Complete** - New part discovered and saved!

---

### Test 2: Returning User (Known Part Check-In)

**Goal:** Verify context loading for known parts

1. **Restart IFS Chat** (go back and re-enter)

2. **You should now see:**
   ```
   Welcome back to IFS Parts Work.

   **What part is coming up for you right now?**

   I see you've worked with these parts before:
   • [Your part from Test 1]

   Is one of these parts active right now, or is this a new part wanting attention?
   ```

3. **Type the name of your part from Test 1:**
   ```
   "My anxious part" or whatever you called it
   ```

4. **Expected behavior:**
   - Should recognize it as a known part
   - Should show context:
     ```
     Great! Let's check in with **[Part Name]**.

     You last worked with this part on [today's date].

     **Reminder about this part:**
     • Role: manager (or whatever it was)
     • Location: [where you said]
     • Strategy: [what you described]

     How is this part showing up for you right now?
     ```

5. **Have a short conversation:**
   - Answer the question
   - AI should continue check-in (not full discovery)

6. **Complete the session**

7. **Verify database update:**
   - Check `ifs_parts_inventory` table
   - Same part should have updated `last_worked_with` timestamp
   - Check `ifs_session_history` table
   - New session with `session_type = 'check_in'` and `part_was_known = true`

✅ **Test 2 Complete** - Known part recognized and context loaded!

---

### Test 3: Duplicate Detection

**Goal:** Verify system catches potential duplicates

1. **Start a new IFS Chat session**

2. **Describe what sounds like your existing part, but with different words:**
   ```
   "There's this worried feeling that makes me overthink everything"

   (If your first part was about anxiety/worry)
   ```

3. **Expected behavior:**
   - AI begins discovery
   - After a few exchanges (during find/focus phase)
   - You should get a message like:
     ```
     This sounds similar to **[Your Existing Part]**, a manager you've worked with before.

     Is this the same part showing up in a new way, or is this definitely a new part?

     Options:
     - Merge with: [Existing Part]
     - This is a new part
     - Not sure yet
     ```

4. **Test the merge:**
   - Select "Merge with: [Existing Part]"
   - Should see: "Got it - we'll continue with [Existing Part]. All your insights from this session have been added to that part's history."

5. **Verify database:**
   - Check `ifs_parts_inventory` table
   - Should still only have ONE part (no duplicate created)
   - Session notes should be updated

✅ **Test 3 Complete** - Duplicate prevented!

---

### Test 4: Protector-Exile Connection (CRITICAL TEST)

**Goal:** Verify automatic connection recording when exile emerges

**Setup:** You need at least one part marked as an exile in the database.

**Quick setup option:**
1. Go to Supabase dashboard
2. In `ifs_parts_inventory` table, manually add a simple exile:
   ```sql
   INSERT INTO ifs_parts_inventory (user_id, part_name, part_role, is_exile)
   VALUES ('your-user-id', 'Scared Child', 'exile', true);
   ```

**Now test:**

1. **Start new IFS Chat session**

2. **Describe a protector part:**
   ```
   "I have this angry part that lashes out when I feel criticized"
   ```

3. **Go through discovery until you get to "befriend" or "fears" phase**

4. **Then mention exile-like language:**
   ```
   "Underneath the anger, I'm noticing a scared little kid who feels rejected"
   ```

5. **Expected behavior - THIS IS THE KEY TEST:**
   - System should detect exile language
   - Should show:
     ```
     I'm noticing something... You mentioned feelings and language that remind me of
     **Scared Child**, an exile you've worked with before.

     Is that part showing up right now? Sometimes protectors reveal the exiles they protect.

     *(I've noted the connection between these parts)*

     Options:
     - Switch to: Scared Child
     - Continue with current part
     - Tell me more
     ```

6. **VERIFY CONNECTION WAS RECORDED IMMEDIATELY:**
   - **Before selecting any option**, go to Supabase
   - Check `ifs_parts_inventory` table
   - Find your protector part
   - Check `protects_which_exile` field - should have the exile's ID
   - Find your exile part
   - Check `protected_by_parts` array - should contain protector's ID

7. **Now test each option:**

   **Option A: Select "Continue with current part"**
   - Should see: "The connection to the exile has been noted - this helps us understand why this protector works so hard."
   - Connection still in database ✅

   **Option B: Select "Switch to: Scared Child"** (in a different session)
   - Should save current progress
   - Should load exile context
   - Connection still in database ✅

   **Option C: Select "Tell me more"** (in a different session)
   - Should explain the protector-exile dynamic
   - Then offer: Switch or Continue
   - Connection still in database ✅

✅ **Test 4 Complete** - Automatic connection recording works!

---

### Test 5: Mid-Session Part Switch

**Goal:** Verify switching between parts during a session

1. **Start IFS Chat, work with a protector**

2. **When exile emerges, select "Switch to: [Exile Name]"**

3. **Expected behavior:**
   - Current protector progress saved
   - Session shifts to exile
   - Header should show: "Working with: [Exile Name]"
   - Context loaded for exile

4. **Continue working with exile**

5. **Verify database:**
   - Both parts should have updated `last_worked_with`
   - Session history should note the switch

✅ **Test 5 Complete** - Mid-session switching works!

---

## Visual Verification Checklist

### In the App:

**First time:**
- [ ] Shows "What part is coming up for you right now?" with no parts list
- [ ] Begins discovery (6 F's) when describing new part
- [ ] Shows summary at end with all gathered info

**Second time:**
- [ ] Shows "Welcome back" with list of known parts
- [ ] Recognizes when you mention a known part
- [ ] Loads context reminder (last worked, location, strategy)
- [ ] Starts check-in conversation (not full discovery)

**Duplicate detection:**
- [ ] Catches similarity during early discovery
- [ ] Offers merge option
- [ ] Prevents duplicate if merged

**Exile emergence:**
- [ ] Detects exile keywords in conversation
- [ ] Shows "*(I've noted the connection between these parts)*"
- [ ] Offers Switch / Continue / Tell me more
- [ ] Connection visible in database BEFORE user selects option

### In Supabase Dashboard:

**ifs_parts_inventory table:**
- [ ] New parts appear after discovery
- [ ] `last_worked_with` updates on check-ins
- [ ] `protects_which_exile` populated when connection detected
- [ ] `protected_by_parts` array updated for exiles
- [ ] No duplicates created when merge selected

**ifs_session_history table:**
- [ ] New row for each session
- [ ] `session_type = 'discovery'` for new parts
- [ ] `session_type = 'check_in'` for known parts
- [ ] `part_was_known` correctly set
- [ ] `conversation_summary` populated
- [ ] `part_id` links to correct part

---

## Common Issues & Troubleshooting

### Issue 1: "Loading your parts..." never finishes

**Cause:** No user logged in or database connection issue

**Fix:**
1. Check AsyncStorage for user session: `await AsyncStorage.getItem('user')`
2. Verify Supabase connection in app
3. Check console for errors

### Issue 2: No parts list shows even though I created parts

**Cause:** Parts created for different user ID, or RLS blocking access

**Fix:**
1. Verify you're logged in as the same user
2. Check Supabase RLS policies are enabled
3. Verify user_id in parts matches your current auth.uid()

### Issue 3: Duplicate detection not triggering

**Cause:** Similarity threshold not reached (needs >60%)

**Debug:**
- Parts need to share words in name, strategy, or feelings
- Try describing with MORE similar language
- Example: If part is "Anxious Manager", say "worried manager" or "anxiety"

### Issue 4: Exile not detected

**Cause:** Keywords not present in conversation

**Exile keywords:** young, child, scared, hurt, wounded, sad, alone, abandoned, small, vulnerable

**Fix:** Use these words explicitly in your message

### Issue 5: Connection not recording

**Cause:** Current part is also an exile (only protector→exile connections recorded)

**Fix:**
- Ensure current part has `is_exile = false`
- Detected part must have `is_exile = true`

---

## Quick Database Check Queries

### See all your parts:
```sql
SELECT part_name, part_role, is_exile, last_worked_with
FROM ifs_parts_inventory
WHERE user_id = 'your-user-id'
ORDER BY last_worked_with DESC;
```

### See protector-exile relationships:
```sql
SELECT
  p.part_name as protector,
  e.part_name as exile
FROM ifs_parts_inventory p
JOIN ifs_parts_inventory e ON p.protects_which_exile = e.id
WHERE p.user_id = 'your-user-id';
```

### See all your sessions:
```sql
SELECT
  s.session_type,
  s.part_was_known,
  p.part_name,
  s.session_date
FROM ifs_session_history s
LEFT JOIN ifs_parts_inventory p ON s.part_id = p.id
WHERE s.user_id = 'your-user-id'
ORDER BY s.session_date DESC;
```

---

## Expected Timeline

**Test 1-2:** ~10-15 minutes (discovery + check-in)
**Test 3:** ~5 minutes (duplicate detection)
**Test 4:** ~10 minutes (connection recording) - MOST IMPORTANT
**Test 5:** ~5 minutes (switching)

**Total:** ~30-35 minutes for full test suite

---

## Success Criteria

✅ System remembers parts across sessions
✅ Context loaded for known parts (not full discovery again)
✅ Duplicates prevented with merge option
✅ **Protector-exile connections recorded AUTOMATICALLY (regardless of user choice)**
✅ Mid-session switching preserves progress
✅ All data saved correctly to database
✅ Session history tracks discovery vs check-in

---

## What to Report

If you find any issues, please note:
1. Which test case
2. What you expected to happen
3. What actually happened
4. Any console errors
5. Database state (screenshot of tables)

---

## Next Steps After Testing

Once tests pass:
1. Use it naturally over multiple sessions
2. Build up your parts inventory
3. Notice patterns in protector-exile relationships
4. Test with different types of parts (managers, firefighters, exiles)

The real power shows over time as the system learns your internal family!
