# Easy Sharing Guide - Quick Beta Testing

## The Simplest Way to Share with Friends

For beta testing with friends, you don't need complex deployment. Here's the easiest approach:

## Option 1: Development Server with Tunnel (Recommended for Testing)

### Step 1: Start the Expo Server
```bash
npx expo start --tunnel
```

This will:
- Start your app
- Create a tunnel URL that's accessible from anywhere
- Generate a QR code

### Step 2: Share the QR Code
- The QR code is displayed in your terminal
- Take a screenshot and send to friends
- OR send them the link shown (starts with `exp://`)

### Step 3: Friends Open in Expo Go
They need to:
1. Install "Expo Go" app (free on iOS/Android)
2. Scan your QR code OR tap the link
3. App loads instantly!

**Pros:**
- Super simple, no configuration
- Instant updates when you save files
- No account setup needed

**Cons:**
- Only works while your computer is running the server
- QR code changes if you restart

---

## Option 2: EAS Update (Stable Permanent Link)

For a **permanent shareable link** that works even when your computer is off:

### Step 1: Create EAS Project (One-Time Setup)

You'll need to run this interactively in your terminal:

```bash
npx eas-cli init
```

Answer the prompts:
- Create a project? **Yes**
- Use your Expo account (you're already logged in)

This adds a project ID to your `app.json`.

### Step 2: Configure EAS Update

Create `eas.json`:

```bash
npx eas-cli build:configure
```

Choose:
- Platform: **All**
- Accept defaults

### Step 3: Create a Preview Build or Development Build

For Expo Go testing:
```bash
npx eas-cli update --branch preview --message "First beta version"
```

This creates a permanent channel your friends can connect to.

### Step 4: Share the Link

After the update, you'll get a link like:
```
exp://u.expo.dev/[project-id]?channel-name=preview
```

Send this to your friends!

**Pros:**
- Permanent link
- Works when your computer is off
- Professional approach

**Cons:**
- Requires EAS setup (we hit interactive prompt issues)
- More complex initial setup

---

## Option 3: Build APK for Android (Full Native App)

If your friends primarily use Android:

```bash
npx eas-cli build --platform android --profile preview
```

This creates an actual APK file they can install directly (no Expo Go needed).

---

## ⚡ RECOMMENDED FOR NOW: Option 1

Since you want to **share quickly with friends**, I recommend **Option 1** for now:

1. Open terminal in your project folder
2. Run: `npx expo start --tunnel`
3. Screenshot the QR code
4. Send to friends with instructions to install Expo Go

When you're ready for a more permanent solution, we can set up Option 2 properly through interactive terminal commands.

---

## 📱 The Feedback Button

Already set up! The blue floating button appears on the home screen. Testers can submit:
- Bug reports
- Feature requests
- General feedback

All saved to your Supabase database (just need to run the SQL migration first).

## 🗄️ Setting Up Feedback Database

Before sharing, run this SQL in Supabase:

1. Go to https://supabase.com/dashboard
2. Select your project
3. SQL Editor → New Query
4. Copy/paste from `database/create_feedback_table.sql`
5. Run it

Now you're ready to collect feedback!

---

## Quick Start Checklist

- [ ] Run feedback SQL in Supabase
- [ ] Run `npx expo start --tunnel`
- [ ] Screenshot QR code
- [ ] Send to friends with Expo Go instructions
- [ ] Test the feedback button yourself
- [ ] Check Supabase to see submitted feedback

That's it! Your friends can now test your app.
