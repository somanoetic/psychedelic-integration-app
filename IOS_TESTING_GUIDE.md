# iOS Testing Guide - Best Options

Since most of your testers are on iOS, here are the best approaches:

## ⭐ RECOMMENDED: Development Server with Tunnel (Free, Works Now)

This is the **easiest and fastest** way for iOS testing without needing Apple Developer account.

### Setup (You - One Time):

```bash
npx expo start --tunnel
```

### What Happens:
- Server starts on your computer
- Creates a publicly accessible tunnel
- Generates a QR code
- Works until you stop the server (Ctrl+C)

### For Testers:

1. Install "Expo Go" from App Store (free)
2. Open Expo Go app
3. Tap "Scan QR code" at the top
4. Scan your QR code
5. App loads instantly!

### Pros:
✅ Works immediately
✅ Free - no Apple Developer account needed
✅ Perfect for quick testing
✅ Instant updates (just save your files)

### Cons:
❌ Your computer must stay running
❌ QR code changes each time you restart
❌ Not suitable for long-term testing

---

## Option 2: TestFlight (Best for Long-term Testing)

If you have an Apple Developer account ($99/year):

### Step 1: Build for iOS
```bash
npx eas-cli build --profile preview --platform ios
```

### Step 2: Submit to TestFlight
```bash
npx eas-cli submit --platform ios
```

### Step 3: Invite Testers
- Go to App Store Connect
- Add testers by email
- They install TestFlight app
- They get your app through TestFlight

### Pros:
✅ Permanent solution
✅ Professional distribution
✅ Up to 10,000 testers
✅ Automatic updates
✅ Works when computer is off
✅ Looks like real App Store experience

### Cons:
❌ Requires $99/year Apple Developer account
❌ Takes 1-2 hours for first build
❌ Apple review required (usually 24-48 hours)

---

## Option 3: Expo Classic Publish (Limited, May Not Work)

This is deprecated but might still work:

```bash
npx expo export --experimental-bundle
```

⚠️ Not recommended - likely won't work with modern Expo

---

## 🎯 My Recommendation

### For Testing This Week:
**Use the Tunnel Method**

**What you do:**
1. Run: `npx expo start --tunnel`
2. Leave terminal open
3. Screenshot the QR code
4. Send to friends with instructions

**Your friends:**
1. Install Expo Go from App Store
2. Scan your QR code
3. Test the app!

**When to keep server running:**
- Schedule a testing session: "Hey everyone, I'll have the app running from 6-9pm tonight for testing"
- Or: "App is live for the next few hours if anyone wants to test"

### For Long-term Beta Testing:
**Invest in Apple Developer Account + TestFlight**

This is the professional approach and worth it if you're serious about the app.

---

## Quick Start (Do This Now)

### Step 1: Start the server

Open terminal in your project folder:
```bash
npx expo start --tunnel
```

### Step 2: Share with testers

**Send them this message:**

> Hi! I'd like you to test my Psychedelic Integration app.
>
> **Setup (one-time, takes 2 minutes):**
> 1. Install "Expo Go" from the App Store (free app)
> 2. Open Expo Go
> 3. Tap "Scan QR code" at the top
> 4. Scan this QR code: [attach screenshot]
>
> **Testing:**
> - The app will load in about 10 seconds
> - Create an account and explore
> - Use the blue feedback button to report bugs or suggest features
>
> **Important:** I'll keep the server running for the next [X hours], so test during that time!
>
> Thanks for helping! 🙏

### Step 3: Collect feedback

- Monitor the Expo terminal for errors
- Check your Supabase "feedback" table for submissions
- Take notes on their experience

### Step 4: When done testing
Press Ctrl+C to stop the server

---

## For Scheduled Testing Sessions

If you can't keep your computer running 24/7, schedule testing sessions:

**Example message:**
> "I'll have the test app running tonight from 7-10pm EST. Install Expo Go now, and I'll send the QR code at 7pm!"

This way testers know when they can access it.

---

## Long-term Solution

If you decide this app is going somewhere, invest in:

1. **Apple Developer Account** ($99/year)
2. Use **TestFlight** for iOS distribution
3. Use **EAS Build** for Android APK (free)

Then you'll have 24/7 persistent access for all testers.

---

## Need Help?

Run into issues? Common fixes:

**"Can't scan QR code":**
- Make sure Expo Go is fully installed
- Try manually entering the URL shown in terminal

**"Build failed" or "Can't connect":**
- Check firewall settings
- Try without VPN
- Restart expo: Ctrl+C, then `npx expo start --tunnel`

**"Takes forever to load":**
- First load is slow (30-60 seconds)
- Subsequent loads are faster
- Tunnel can be slower than local network

---

## Bottom Line

**For immediate testing with iOS friends:**
→ Use `npx expo start --tunnel`

**For serious long-term beta testing:**
→ Get Apple Developer account + use TestFlight

Your call based on urgency and budget!
