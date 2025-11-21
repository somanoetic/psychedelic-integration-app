# Fix for "No channel named preview" Error

## The Problem

The error you're seeing happens because:
- **EAS Update** requires a custom development build
- **Expo Go** can't use EAS Update channels without a compatible build first
- We need to either: build a development build OR use the tunnel method

## Solution: Two Options

---

### Option 1: Development Server with Tunnel (EASIEST - Works Now)

This is the fastest way to share with testers **right now**.

**Step 1:** Start the tunnel server (in your project directory):
```bash
npx expo start --tunnel
```

**Step 2:** You'll see output like:
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Using Expo Go
› Press s │ switch to development build

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press j │ open debugger
› Press r │ reload app
› Press m │ toggle menu
› Press o │ open project code in your editor

› Press ? │ show all commands

Logs for your project will appear below. Press Ctrl+C to exit.
```

**Step 3:** Screenshot the QR code and send to friends with instructions:
1. Install Expo Go
2. Scan this QR code
3. Test the app!

**Pros:**
- Works immediately
- No build process needed
- Fast development/testing cycle

**Cons:**
- Your computer must stay running
- Link changes each time you restart
- Only works while tunnel is active

---

### Option 2: Build Development Build for Stable Link (Takes ~15-20 mins)

This creates a permanent shareable link that works even when your computer is off.

**Step 1:** Create a development build:
```bash
npx eas-cli build --profile development --platform android
```

For iOS (if you have Apple Developer account):
```bash
npx eas-cli build --profile development --platform ios
```

**Step 2:** Wait for build to complete (~15-20 minutes)

**Step 3:** Install the development build:
- Android: Download APK from EAS dashboard and install
- iOS: Use TestFlight or direct install

**Step 4:** Now EAS Update will work:
```bash
npx eas-cli update --branch preview --message "Beta version"
```

**Step 5:** Share the link:
```
exp://u.expo.dev/51f2a410-267f-47c9-a2c8-f77b168d782c?channel-name=preview
```

**Pros:**
- Permanent stable link
- Works when computer is off
- Professional approach
- Easy to push updates

**Cons:**
- Initial build takes 15-20 minutes
- Requires EAS build setup
- Testers need to install the development build APK/IPA (not just Expo Go)

---

### Option 3: Quick Test with Expo Go Publish (Deprecated but might work)

Some older projects can still use the classic publish method:

```bash
npx expo publish --release-channel production
```

Then share:
```
exp://exp.host/@alleviationtherapeutics/psychedelic-integration-app
```

⚠️ This might not work as it's deprecated, but worth trying.

---

## Recommended Approach

### For Immediate Testing (Today):
**Use Option 1 - Tunnel Method**

1. Run: `npx expo start --tunnel`
2. Screenshot QR code
3. Send to friends
4. They scan with Expo Go
5. Done!

### For Long-term Beta Testing:
**Use Option 2 - Development Build**

This gives you a permanent link and professional setup.

---

## Updated Tester Instructions (Tunnel Method)

**Send this to your friends:**

> Hey! I'd like you to test my Psychedelic Integration app.
>
> **What you need:**
> 1. Install "Expo Go" app (free)
>    - Android: https://play.google.com/store/apps/details?id=host.exp.exponent
>    - iOS: https://apps.apple.com/app/expo-go/id982107779
>
> 2. Scan this QR code with Expo Go (I'll send you a screenshot)
>
> 3. Create an account and start testing!
>
> **Found a bug or have ideas?**
> Tap the blue floating button on the home screen to submit feedback.
>
> Thanks for helping test! 🙏

---

## Quick Commands

**Start tunnel for immediate sharing:**
```bash
npx expo start --tunnel
```

**Build development build for permanent link:**
```bash
npx eas-cli build --profile development --platform android
```

**Push update after development build:**
```bash
npx eas-cli update --branch preview --message "Your update"
```

---

## Next Steps

1. **Right now:** Run `npx expo start --tunnel` and share QR with friends
2. **This weekend:** Build development build for permanent solution
3. **Long term:** Build production apps for app stores

Let me know which approach you want to take!
