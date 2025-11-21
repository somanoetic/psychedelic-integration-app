# Running Expo Tunnel 24/7 on a Desktop

## Yes! You Can Do This

If you have access to a desktop computer (Windows, Mac, or Linux) that can stay on 24/7, you can run the Expo tunnel continuously. This gives you a **permanent shareable link** without needing Apple Developer account or EAS builds!

## Requirements

- Desktop computer that stays on 24/7
- Stable internet connection
- Node.js installed
- This project cloned on that desktop

## Setup (One-Time)

### Step 1: Clone Project on Desktop

```bash
git clone <your-repo-url>
cd psychedelic-integration-app
```

### Step 2: Install Dependencies

```bash
npm install
npm install -g @expo/ngrok
```

### Step 3: Copy .env File

Copy your `.env` file with API keys to the desktop project folder.

### Step 4: Test the Tunnel

```bash
npx expo start --tunnel
```

You should see:
```
Tunnel ready.
exp://YOUR-TUNNEL-URL
```

Screenshot the QR code that appears!

---

## Running 24/7 (Auto-Restart)

### Option A: Using PM2 (Recommended - Auto Restart)

PM2 will keep the tunnel running even if it crashes or the desktop reboots.

#### Install PM2:
```bash
npm install -g pm2
```

#### Create Start Script:

Create `start-tunnel.js`:
```javascript
const { spawn } = require('child_process');

const expo = spawn('npx', ['expo', 'start', '--tunnel'], {
  cwd: __dirname,
  stdio: 'inherit'
});

expo.on('close', (code) => {
  console.log(`Expo process exited with code ${code}`);
  process.exit(code);
});
```

#### Start with PM2:
```bash
pm2 start start-tunnel.js --name expo-tunnel
pm2 save
pm2 startup
```

This will:
- Start the tunnel
- Auto-restart if it crashes
- Start automatically when desktop reboots

#### PM2 Commands:
```bash
pm2 status           # Check if running
pm2 logs expo-tunnel # View logs
pm2 restart expo-tunnel # Restart
pm2 stop expo-tunnel # Stop
pm2 delete expo-tunnel # Remove
```

---

### Option B: Using Screen (Linux/Mac) or Windows Task Scheduler

#### Linux/Mac with Screen:
```bash
screen -S expo
npx expo start --tunnel
# Press Ctrl+A then D to detach
# Reconnect with: screen -r expo
```

#### Windows Task Scheduler:
1. Create `start-expo.bat`:
```batch
@echo off
cd C:\path\to\your\project
npx expo start --tunnel
```

2. Open Task Scheduler
3. Create Basic Task
4. Trigger: At system startup
5. Action: Start a program
6. Program: `C:\path\to\start-expo.bat`
7. Check "Run with highest privileges"

---

## Getting Your Shareable Link

Once running, the tunnel URL will be shown in the terminal output. It looks like:

```
exp://abc123xyz.ngrok.io:80
```

### To Get QR Code:

1. Look at the terminal - there's an ASCII QR code
2. OR visit: http://localhost:8081 in a browser on that desktop
3. Screenshot the QR code
4. Share with testers!

### To Get Text Link:

The tunnel URL from terminal can be shared directly. Testers can:
1. Open Expo Go
2. Tap "Enter URL manually"
3. Paste your tunnel URL

---

## Monitoring & Maintenance

### Check if Running:
```bash
pm2 status
# OR
curl http://localhost:8081/_expo/health
```

### View Logs:
```bash
pm2 logs expo-tunnel --lines 100
```

### Restart if Needed:
```bash
pm2 restart expo-tunnel
```

### Update Your App:
1. Make changes to code
2. Push to git
3. On desktop: `git pull`
4. Restart: `pm2 restart expo-tunnel`
5. Testers automatically get updates next time they open the app!

---

## Important Notes

### ⚠️ Security

- Your `.env` file has sensitive API keys
- Make sure the desktop is secure
- Don't share the tunnel URL publicly
- Only share with trusted testers

### 🌐 Network Requirements

- Stable internet connection
- Router/firewall should allow ngrok connections
- If it stops working, usually just restart helps

### 🔄 Tunnel URL Changes

The ngrok free tier gives you a new URL each time you restart. To get a **permanent URL**:

1. Sign up for ngrok account: https://ngrok.com
2. Get auth token
3. Run: `ngrok authtoken YOUR_TOKEN`
4. Get a reserved domain (free on ngrok)
5. Configure in expo start

### ⚡ Power & Internet

- Set desktop to never sleep
- Consider UPS for power backup
- Monitor internet connectivity

---

## Cost Analysis

| Method | Cost | Persistent | Setup Time |
|--------|------|------------|------------|
| Desktop 24/7 | Power costs (~$5-10/month) | ✅ Yes | 30 minutes |
| Apple TestFlight | $99/year | ✅ Yes | 2-3 hours |
| EAS Hosting | Free (for now) | ✅ Yes | 1 hour |
| Scheduled Sessions | Free | ❌ No | 5 minutes |

---

## Recommended Setup

**For your situation:**

1. **Set up PM2 on a desktop** (this weekend)
2. **Share the QR code** with friends
3. **Monitor for first week** to ensure stability
4. **Eventually migrate to TestFlight** when ready for production

This gives you a stable testing environment without upfront costs!

---

## Quick Start Checklist

- [ ] Desktop computer identified for 24/7 use
- [ ] Node.js installed on desktop
- [ ] Project cloned to desktop
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file copied with API keys
- [ ] PM2 installed (`npm install -g pm2`)
- [ ] PM2 start script created
- [ ] Tunnel started with PM2
- [ ] QR code screenshot taken
- [ ] QR code shared with testers
- [ ] Supabase feedback table created

---

## Troubleshooting

**Tunnel won't start:**
- Check internet connection
- Reinstall ngrok: `npm install -g @expo/ngrok`
- Try: `npx expo start --tunnel --clear`

**Can't connect from phone:**
- Verify tunnel is running: `pm2 status`
- Check logs: `pm2 logs`
- Restart: `pm2 restart expo-tunnel`

**URL keeps changing:**
- Get free ngrok account for stable URL
- Or use EAS builds for truly permanent solution

---

Need help setting this up? Let me know!
