# Running Expo Tunnel on a Virtual Machine (24/7)

## Perfect Solution for iOS Testers!

A cloud VM gives you a 24/7 server running the Expo tunnel without:
- ❌ Keeping a physical computer on
- ❌ Paying $99/year for Apple Developer
- ❌ Dealing with complex iOS builds

**Cost:** $0-5/month (cheaper than Apple Developer!)

---

## Recommended: Digital Ocean ($5/month)

### Why Digital Ocean?
- ✅ Cheap: $5/month for basic VM
- ✅ Simple setup
- ✅ Reliable
- ✅ Easy to manage
- ✅ Can destroy when not needed

### Free Alternatives:
- **Oracle Cloud** - Always Free tier (2 VMs forever!)
- **AWS EC2** - Free for 12 months
- **Google Cloud** - $300 credit

---

## Step-by-Step Setup (Digital Ocean)

### 1. Create Account & Droplet

1. Sign up at https://digitalocean.com (get $200 credit with referral)
2. Click "Create" → "Droplets"
3. Choose:
   - **Image:** Ubuntu 22.04 LTS
   - **Plan:** Basic ($5/month)
   - **CPU:** Regular (1GB RAM is enough)
   - **Region:** Closest to you
4. Add SSH key (or use password)
5. Click "Create Droplet"

### 2. Connect to Your VM

```bash
ssh root@your-droplet-ip
```

### 3. Install Node.js & Git

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs git

# Verify
node --version
npm --version
```

### 4. Clone Your Project

```bash
# Clone from GitHub
git clone https://github.com/YOUR-USERNAME/psychedelic-integration-app.git
cd psychedelic-integration-app

# Install dependencies
npm install
npm install -g @expo/ngrok pm2
```

### 5. Set Up Environment Variables

```bash
# Create .env file
nano .env
```

Paste your environment variables:
```
SUPABASE_URL=your-url
SUPABASE_ANON_KEY=your-key
ANTHROPIC_API_KEY=your-key
DEBUG_CLAUDE=true
```

Save: `Ctrl+X`, `Y`, `Enter`

### 6. Start Expo with PM2 (Auto-Restart)

```bash
# Create start script
cat > start-expo.sh << 'EOF'
#!/bin/bash
cd /root/psychedelic-integration-app
npx expo start --tunnel
EOF

chmod +x start-expo.sh

# Start with PM2
pm2 start start-expo.sh --name expo-tunnel
pm2 save
pm2 startup
```

### 7. Get Your Shareable Link

```bash
pm2 logs expo-tunnel
```

Look for output like:
```
› Metro waiting on exp://abc123.ngrok.io:80
› Scan the QR code above
```

**That's your permanent shareable URL!**

---

## Managing Your VM

### Check if Running:
```bash
ssh root@your-droplet-ip
pm2 status
```

### View Logs:
```bash
pm2 logs expo-tunnel
```

### Restart:
```bash
pm2 restart expo-tunnel
```

### Stop (save money when not testing):
```bash
pm2 stop expo-tunnel
```

### Update Your App:
```bash
cd /root/psychedelic-integration-app
git pull
pm2 restart expo-tunnel
```

---

## Share with Testers

Once running, share this with your iOS friends:

> Hi! Test my Psychedelic Integration app:
>
> **Setup (2 minutes):**
> 1. Install "Expo Go" from App Store (free)
> 2. Open Expo Go
> 3. Scan this QR code: [attach screenshot from `pm2 logs`]
>    OR
>    Tap this link: exp://YOUR-NGROK-URL
>
> **Testing:**
> - Create an account and explore
> - Use the blue feedback button for bugs/ideas
>
> Thanks! 🙏

---

## Cost Comparison

| Method | Cost | Setup Time | Technical Level |
|--------|------|------------|-----------------|
| VM (Digital Ocean) | $5/month | 30 min | Medium |
| VM (Oracle Free) | $0 | 30 min | Medium |
| Apple Developer | $99/year | 2 hours | High |
| Physical Desktop | $10/month (power) | 10 min | Low |

---

## FREE Option: Oracle Cloud Always Free

Oracle gives you **2 VMs forever free**!

### Oracle Cloud Setup:

1. Sign up: https://cloud.oracle.com/free
2. Create Compute Instance
3. Choose: **Always Free Eligible** (Ampere ARM or AMD)
4. Follow same setup steps above
5. **$0 cost forever!**

**Note:** Oracle's free tier is generous but can be slow to provision.

---

## Alternative: Render.com (Easiest)

Render.com has a free tier that's even easier:

1. Sign up at https://render.com
2. Connect GitHub repo
3. Create "Background Worker"
4. Build command: `npm install && npm install -g @expo/ngrok`
5. Start command: `npx expo start --tunnel`
6. Deploy!

**Pros:** Super easy, free tier
**Cons:** Free tier has limitations (may sleep after inactivity)

---

## Keeping ngrok Tunnel Stable

The free ngrok tunnel URL changes on restart. For a **permanent URL**:

### Option A: ngrok Paid Plan ($8/month)
- Get reserved domain
- URL never changes
- More reliable

### Option B: Free ngrok Account
- Sign up at https://ngrok.com
- Get auth token
- Add to VM:
  ```bash
  ngrok authtoken YOUR_TOKEN
  ```
- Still random URL but better reliability

---

## Recommended Setup

**For Testing (Next 1-2 months):**
→ Use **Oracle Cloud Always Free** ($0)
→ Or **Digital Ocean** ($5/month, more reliable)

**For Production:**
→ Invest in **Apple Developer + TestFlight** ($99/year)
→ Build proper iOS app
→ Professional distribution

---

## Quick Start Checklist

- [ ] Sign up for VM service (Oracle/Digital Ocean)
- [ ] Create VM (Ubuntu 22.04)
- [ ] SSH into VM
- [ ] Install Node.js, npm, git
- [ ] Clone project
- [ ] Set up .env file
- [ ] Install dependencies
- [ ] Install PM2 and ngrok
- [ ] Start expo tunnel with PM2
- [ ] Get shareable URL from logs
- [ ] Screenshot QR code
- [ ] Share with testers
- [ ] Set up Supabase feedback table

---

## Need Help?

**VM won't start:**
- Check security group/firewall allows SSH
- Verify you're using correct SSH key

**Can't connect to tunnel:**
- Check PM2 status: `pm2 status`
- View logs: `pm2 logs expo-tunnel`
- Restart: `pm2 restart expo-tunnel`

**ngrok errors:**
- Install globally: `npm install -g @expo/ngrok`
- Get free account at ngrok.com for better limits

**Tunnel URL changes:**
- This is normal with free ngrok
- Consider paid ngrok ($8/month) for stable URL
- Or just share new URL when it changes

---

## Bottom Line

**Best option for you:**
1. Set up **Oracle Cloud** VM (free forever)
2. Run expo tunnel 24/7
3. Share QR code with iOS testers
4. They use regular Expo Go app
5. Super simple for non-technical users!

Cost: **$0**
Time: **30 minutes setup**
Works: **24/7 permanently**

Want help setting this up? I can guide you through it!
