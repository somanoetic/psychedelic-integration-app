# Building iOS Internal Distribution

## What This Does

Creates an **iOS app (.ipa file)** that your friends can install **without the App Store**!

✅ No Apple Developer account needed
✅ Permanent shareable link
✅ Works 24/7 without your computer
✅ Up to 100 iOS devices
✅ Easy updates via EAS Update

## Step-by-Step Instructions

### Step 1: Start the Build

Open your terminal in the project folder and run:

```bash
npx eas-cli build --profile preview --platform ios
```

### Step 2: Answer the Prompts

You'll be asked several questions. Here are the answers:

**Q: "iOS app only uses standard/exempt encryption?"**
**A:** Type `y` and press Enter
(We're using standard HTTPS encryption, which is exempt)

**Q: "Would you like EAS to handle credentials?"**
**A:** Type `y` and press Enter
(EAS will automatically manage certificates)

**Q: "Generate a new Apple Distribution Certificate?"**
**A:** Type `y` and press Enter
(EAS creates this for you)

**Q: "Generate a new Apple Provisioning Profile?"**
**A:** Type `y` and press Enter
(EAS handles this too)

### Step 3: Wait for Build (~15-20 minutes)

The build will happen on Expo's servers. You'll see:
```
✔ Build started, it may take a few minutes to complete.
Build URL: https://expo.dev/accounts/alleviationtherapeutics/projects/psychedelic-integration-app/builds/...
```

You can close the terminal and check the build status at that URL.

### Step 4: Get Your Shareable Link

Once the build completes, you'll get an **install URL** like:
```
https://expo.dev/accounts/alleviationtherapeutics/projects/psychedelic-integration-app/builds/abc123
```

This URL is permanent and shareable!

---

## Sharing with Testers (iOS)

### Option A: Share the Build Link (Easiest)

**Send testers this message:**

> Hi! I'd like you to test my Psychedelic Integration app.
>
> **To install (iOS):**
> 1. Open this link on your iPhone: [your-build-url]
> 2. Tap "Install"
> 3. Go to Settings > General > Device Management
> 4. Trust the developer certificate
> 5. Open the app from your home screen
> 6. Create an account and start testing!
>
> **Found bugs or have ideas?**
> Tap the blue feedback button in the app!
>
> Thanks! 🙏

### Option B: QR Code

1. Go to your build page: https://expo.dev/accounts/alleviationtherapeutics/projects/psychedelic-integration-app/builds
2. Find your build
3. Click "Share" to get a QR code
4. Testers scan with their iPhone camera
5. Follows same install steps

---

## Updating Your App (After Testers Install)

When you make changes and want to send updates:

```bash
npx eas-cli update --branch preview --message "Fixed login bug"
```

Testers get updates **automatically** next time they open the app - no reinstall needed!

---

## Important Notes

### Device Limit (iOS)
- Ad-hoc distribution allows **100 devices** max
- Each tester's iPhone uses 1 device slot
- This is an Apple limitation, not Expo

### First Install (iOS)
iOS users need to "trust" the developer certificate:
1. Install the app
2. Try to open it (will show "Untrusted Developer")
3. Go to Settings > General > Device Management
4. Tap your email/certificate
5. Tap "Trust"
6. App now opens normally

### Certificate Expires
- Certificates last 1 year
- After 1 year, rebuild with: `npx eas-cli build --profile preview --platform ios`

---

## For Android Too

Want to build for Android as well?

```bash
npx eas-cli build --profile preview --platform android
```

Android is easier - users just download and install the APK file!

---

## Cost: FREE!

✅ No Apple Developer account required
✅ No hosting costs
✅ Expo handles certificates for free
✅ Up to 100 devices

---

## Troubleshooting

**Build fails:**
- Check that `app.json` has correct bundle identifier
- Make sure all dependencies are installed
- Try: `npx eas-cli build --profile preview --platform ios --clear-cache`

**Can't install on device:**
- Make sure device has iOS 13.4 or higher
- Check that you haven't exceeded 100 device limit
- Verify you're using the correct install URL

**Updates not working:**
- Verify the build has same `runtimeVersion`
- Check that updates URL matches in app.json
- Try forcing a full rebuild

---

## Next Steps

1. Run: `npx eas-cli build --profile preview --platform ios`
2. Answer prompts (all `y`)
3. Wait ~15-20 minutes
4. Get shareable link
5. Send to iOS friends
6. Collect feedback!

Need help? Let me know!
