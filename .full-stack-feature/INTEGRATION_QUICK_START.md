# Quick Start: Integrating FEAT-102 into the App

This guide will help you quickly integrate the Set Intention Screen into your app.

---

## Step 1: Add Screen to Navigation

Edit `App.js` to add the new screen to your stack navigator.

**File:** `App.js`

**Add import:**
```javascript
import SetIntentionScreen from './screens/SetIntentionScreen';
```

**Add screen to Stack.Navigator:**
```javascript
<Stack.Screen
  name="SetIntention"
  component={SetIntentionScreen}
  options={{ headerShown: false }}
/>
```

---

## Step 2: Navigate to Screen

From any screen where you want to trigger intention setting (e.g., Session Preparation Screen):

```javascript
navigation.navigate('SetIntention', {
  sessionId: session?.id || null,        // Optional - session UUID
  sessionData: session || null,          // Optional - session object
  userId: user.id,                       // Required - user UUID from auth
});
```

**Example: From a Session Prep Menu**
```javascript
<TouchableOpacity
  onPress={() => navigation.navigate('SetIntention', {
    userId: user.id,
    sessionId: session.id,
    sessionData: session,
  })}
>
  <Text>Set Your Intention</Text>
</TouchableOpacity>
```

---

## Step 3: Verify Backend Services

Make sure these services exist and are working:

**Check files exist:**
- ✅ `lib/intentionGuidanceAIService.js`
- ✅ `lib/intentionGuidanceService.js`
- ✅ `lib/supabase.js`
- ✅ `lib/config.js`

**Test API connection:**
```javascript
import intentionGuidanceAIService from './lib/intentionGuidanceAIService';

// Test loading user preferences
const prefs = await intentionGuidanceAIService.getUserPreferences(userId);
console.log('User preferences:', prefs);

// Test loading templates
const templates = await intentionGuidanceAIService.getTemplates();
console.log('Templates loaded:', templates.length);
```

---

## Step 4: Verify Database Tables

Run this query in Supabase SQL Editor to check tables:

```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('intention_templates', 'session_intentions', 'user_intention_preferences');

-- Check template count
SELECT COUNT(*) FROM intention_templates WHERE is_active = true;
```

**Expected:** 3 tables exist, templates have data

---

## Step 5: Test the Screen

1. **Navigate to the screen** from your app
2. **Welcome Mode:**
   - Select a session type
   - Select a framework
   - Toggle privacy setting
   - Click "Start Conversation"
3. **Conversation Mode:**
   - Send a message
   - Wait for AI response
   - Verify response appears
4. **Templates Mode:**
   - Click tab to switch
   - Browse templates
   - Click "Use This Template"
5. **Draft Mode:**
   - Edit the intention text
   - Click "Get AI Feedback"
   - Click "Save"
   - Verify save works

---

## Troubleshooting

### Screen doesn't load

**Check:**
- Is `SetIntentionScreen` imported in `App.js`?
- Is the screen added to Stack.Navigator?
- Are you passing `userId` in navigation params?

### "Failed to load preferences" error

**Check:**
- Is user authenticated?
- Does `user_intention_preferences` table exist?
- Are RLS policies configured correctly?

**Fix:** Run database migrations (Step 4)

### "Failed to start conversation" error

**Check:**
- Is `ANTHROPIC_API_KEY` set in `.env`?
- Is Claude API accessible (not rate limited)?
- Check console logs for API errors

**Fix:** Verify API key and check network connectivity

### Templates not loading

**Check:**
- Does `intention_templates` table exist?
- Are there active templates (is_active = true)?
- Check console logs for database errors

**Fix:** Insert sample templates (see database implementation)

### AsyncStorage errors on Android

**Check:**
- Is AsyncStorage installed? (`npm list @react-native-async-storage/async-storage`)
- Are permissions granted?

**Fix:** Reinstall: `npm install @react-native-async-storage/async-storage`

---

## Sample Navigation Integration

Here's a complete example of integrating into a Session Preparation menu:

**File:** `screens/PreparationScreen.js`

```javascript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing } from '../theme/colors';

const PreparationScreen = ({ navigation, route }) => {
  const session = route.params?.session;
  const user = route.params?.user; // From auth context

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Session Preparation</Text>

      {/* Set Intention Button */}
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigation.navigate('SetIntention', {
          userId: user.id,
          sessionId: session?.id,
          sessionData: session,
        })}
      >
        <MaterialIcons name="spa" size={24} color={colors.primary} />
        <View style={styles.menuText}>
          <Text style={styles.menuTitle}>Set Your Intention</Text>
          <Text style={styles.menuSubtitle}>
            AI-guided intention setting for your session
          </Text>
        </View>
        <MaterialIcons name="arrow-forward" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Other menu items... */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  menuSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});

export default PreparationScreen;
```

---

## Next Steps

1. ✅ Add screen to navigation
2. ✅ Test basic navigation
3. ✅ Test all screen modes
4. ✅ Test offline functionality
5. ✅ Test on both iOS and Android
6. ✅ Get user feedback
7. ✅ Iterate and improve

---

## Support

If you encounter issues:
1. Check console logs for errors
2. Verify backend services are running
3. Check database tables and RLS policies
4. Review frontend implementation docs: `feat-102-06-frontend-impl.md`
5. Review backend implementation docs: `feat-102-05-backend-impl.md`

---

**Ready to integrate!** 🚀

Follow these steps and your intention setting feature will be live in minutes.
