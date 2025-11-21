# 🎉 Your App is Ready to Share!

## ✅ Published Successfully

Your app is now live on Expo and ready for beta testing!

**Update Dashboard:** https://expo.dev/accounts/alleviationtherapeutics/projects/psychedelic-integration-app/updates/f9a7091a-6eed-4e14-8af0-ab9b78ff73fa

---

## 📱 Share This With Your Friends

### Shareable Link (Use in Expo Go)
```
exp://u.expo.dev/51f2a410-267f-47c9-a2c8-f77b168d782c?channel-name=preview
```

### Instructions for Testers

**Copy and send this to your friends:**

---

> Hi! I'd like you to beta test my Psychedelic Integration app. Here's how to access it:
>
> **Step 1:** Install Expo Go
> - **Android:** https://play.google.com/store/apps/details?id=host.exp.exponent
> - **iOS:** https://apps.apple.com/app/expo-go/id982107779
>
> **Step 2:** Open this link on your phone:
> ```
> exp://u.expo.dev/51f2a410-267f-47c9-a2c8-f77b168d782c?channel-name=preview
> ```
>
> OR scan this QR code (coming below)
>
> **Step 3:** Create an account and start testing!
>
> **Found a bug or have a feature idea?**
> Tap the blue floating button on the home screen to submit feedback directly in the app.
>
> Thanks for helping me test! 🙏

---

## 🔗 Alternative: QR Code Method

To generate a QR code, visit this URL in your browser:

```
https://expo.dev/accounts/alleviationtherapeutics/projects/psychedelic-integration-app
```

Then click on the "preview" branch to see the QR code.

OR run this command to open the project dashboard:
```bash
npx eas-cli open
```

---

## 📊 Viewing Tester Feedback

All bug reports and feature requests submitted via the feedback button are saved to your Supabase database.

**To view feedback:**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "Table Editor"
4. Select "feedback" table

**IMPORTANT:** You need to run the SQL migration first! See below.

---

## 🗄️ Set Up Feedback Database (Do This Now!)

Before testers can submit feedback, create the database table:

1. Go to https://supabase.com/dashboard
2. Select your project: `hxpyeudklnqtwspmdsuz`
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste this SQL:

\`\`\`sql
-- Create feedback table for bug reports and feature requests
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'feedback')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  app_version TEXT,
  platform TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- Enable Row Level Security
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own feedback (or anonymous feedback)
CREATE POLICY "Users can submit feedback"
  ON feedback
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can view their own feedback
CREATE POLICY "Users can view own feedback"
  ON feedback
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
\`\`\`

6. Click "Run" or press Ctrl+Enter

---

## 🔄 Updating Your App

When you make changes and want to push updates to testers:

```bash
npx eas-cli update --branch preview --message "Your update message here"
```

Testers will get the update automatically next time they open the app - no reinstall needed!

---

## 📈 Monitor Your Updates

View all updates and analytics:
- **Project Dashboard:** https://expo.dev/accounts/alleviationtherapeutics/projects/psychedelic-integration-app
- **Updates List:** https://expo.dev/accounts/alleviationtherapeutics/projects/psychedelic-integration-app/updates

---

## 🎯 Next Steps for Production

When ready for full release:

1. **Build Native Apps:**
   ```bash
   npx eas-cli build --platform android
   npx eas-cli build --platform ios
   ```

2. **Submit to App Stores:**
   ```bash
   npx eas-cli submit --platform android
   npx eas-cli submit --platform ios
   ```

But for now, you're all set for beta testing! 🚀
