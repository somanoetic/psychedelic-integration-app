# Deployment Guide - Expo Go Sharing

## Step 1: Set Up Feedback Database Table

Before sharing with testers, you need to create the feedback table in Supabase:

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `hxpyeudklnqtwspmdsuz`
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste the contents of `database/create_feedback_table.sql`
6. Click "Run" to execute the SQL

This creates a table where all bug reports and feature requests will be stored.

## Step 2: Login to Expo

Open a terminal in your project directory and run:

```bash
npx expo login
```

If you don't have an Expo account:
```bash
npx expo register
```

## Step 3: Publish Your App to Expo

Once logged in, publish your app:

```bash
npx expo publish
```

This will:
- Bundle your app
- Upload it to Expo's servers
- Generate a permanent link you can share

## Step 4: Get Your Shareable Link

After publishing, you'll see output like:

```
Published
Project page: https://expo.dev/@your-username/psychedelic-integration-app
```

You can also get the link anytime with:

```bash
npx expo publish --release-channel production
```

## Step 5: Share with Testers

Send your friends:

1. **The QR Code** - They can scan it with their phone camera
2. **The Link** - Something like: `exp://exp.host/@your-username/psychedelic-integration-app`

### For Testers to Use:

**Android Users:**
1. Install Expo Go from Google Play Store
2. Open Expo Go app
3. Scan the QR code OR tap the link you sent

**iOS Users:**
1. Install Expo Go from App Store
2. Open Expo Go app
3. Scan the QR code OR tap the link you sent

## Step 6: View Feedback from Testers

To view feedback submitted by your testers:

1. Go to Supabase Dashboard
2. Click "Table Editor"
3. Select the "feedback" table
4. You'll see all submissions with:
   - Type (bug/feature/feedback)
   - Title
   - Description
   - Platform (iOS/Android)
   - Timestamp

## Updating Your App

When you make changes and want to push updates to testers:

```bash
npx expo publish
```

Testers will automatically get the update next time they open the app (no reinstall needed!).

## Troubleshooting

### If publish fails:
- Make sure you're logged in: `npx expo whoami`
- Check your internet connection
- Try: `npx expo publish --clear`

### If testers can't open the app:
- Make sure they have the latest Expo Go installed
- Check that they're using the correct link
- Verify your app is published: `npx expo publish:history`

## Environment Variables

**IMPORTANT:** Your `.env` file contains sensitive API keys. These are only used locally and won't be exposed in the published app. However:

- Never commit `.env` to git
- Keep your `.env` file secure
- Don't share your API keys publicly

The app uses Expo's secure environment variable system which keeps your keys safe.

## Next Steps for Production

When you're ready for a full release:

1. **Build Native Apps:**
   ```bash
   npx eas build --platform android
   npx eas build --platform ios
   ```

2. **Submit to App Stores:**
   ```bash
   npx eas submit --platform android
   npx eas submit --platform ios
   ```

But for beta testing with friends, Expo Go is perfect!
