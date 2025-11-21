# Quick Start: Testing IFS Context System

## Run the App

```bash
npx expo start --clear
```

This will:
- Clear cache
- Start Metro bundler
- Show QR code for Expo Go
- Display all logs in terminal

**To save logs to file:**
```bash
npx expo start --clear | tee logs.txt
```

---

## Quick Test (5 minutes)

### 1. Navigate to IFS Chat
- Open app
- Education tab (bottom)
- "Teach me about myself"
- "IFS Chat"

### 2. First Session - New Part
You should see:
```
"What part is coming up for you right now?"
```

Type something like:
```
"I'm feeling really anxious about work"
```

AI should start discovery (6 F's).

### 3. Complete Discovery
Answer the questions as they come.

At the end, check Supabase:
- `ifs_parts_inventory` - Should have your new part
- `ifs_session_history` - Should have session record

### 4. Second Session - Known Part
Restart IFS Chat.

You should now see:
```
"Welcome back to IFS Parts Work.

I see you've worked with these parts before:
• [Your part name]

Is one of these parts active right now?"
```

Mention your part - should load context!

---

## Test Automatic Connection Recording (CRITICAL)

### Setup
In Supabase, manually add a simple exile:
```sql
INSERT INTO ifs_parts_inventory (user_id, part_name, part_role, is_exile)
VALUES ('your-user-id', 'Scared Child', 'exile', true);
```

### Test
1. Start new IFS Chat session
2. Describe a protector (e.g., "angry part when criticized")
3. During conversation, mention exile language:
   ```
   "Underneath I'm noticing a scared little kid"
   ```

### Expected Result
Should see:
```
"I'm noticing something... You mentioned feelings that remind me of
**Scared Child**, an exile you've worked with before.

*(I've noted the connection between these parts)*"
```

### VERIFY
**Before selecting any option**, check Supabase:
- Protector's `protects_which_exile` field should have exile ID
- Connection recorded IMMEDIATELY ✅

---

## Issues?

Check:
1. User logged in? (`await AsyncStorage.getItem('user')`)
2. Database tables exist? (ran migrate_context_system_final.sql?)
3. ANTHROPIC_API_KEY in .env?
4. Any console errors?

---

## Next Phase: Cross-Component Integration

See [CONTEXT_EXPANSION_PLAN.md](CONTEXT_EXPANSION_PLAN.md) for Phase 2 features:
- AI draws connections across IFS, nervous system, beliefs, journals
- Example: "This feeling sounds like your Wounded Child exile, and relates to your core belief 'I am powerless' from your assessment"
- Universal context service feeds all AI interactions

This creates a truly integrative AI therapist!
