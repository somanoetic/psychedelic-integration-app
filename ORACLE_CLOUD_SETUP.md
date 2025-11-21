# Oracle Cloud Always Free Setup - Step by Step

## Why Oracle Cloud?
- ✅ **Free FOREVER** (not a trial)
- ✅ 2 VMs included
- ✅ 24GB RAM total
- ✅ No credit card charges ever (on free tier)

---

## Step 1: Create Oracle Cloud Account

1. Go to: https://cloud.oracle.com/free
2. Click **"Start for free"**
3. Fill in:
   - Email address
   - Country
   - Create password
4. Verify email
5. Complete signup (may ask for credit card but **won't charge** for free tier)

**Note:** Oracle sometimes has high demand. If signup is slow, be patient!

---

## Step 2: Create a Free VM (Compute Instance)

### 2.1 Access Console
1. Log into Oracle Cloud
2. Click hamburger menu (☰) top left
3. Go to: **Compute** → **Instances**
4. Click **"Create Instance"**

### 2.2 Configure Instance
Choose these settings:

**Name:** `expo-tunnel-server` (or whatever you like)

**Placement:** Leave default

**Image and Shape:**
- Click **"Change Image"**
- Select: **Ubuntu 22.04** (Canonical Ubuntu)
- Click **"Change Shape"**
- Select: **VM.Standard.E2.1.Micro** (Always Free eligible)
  - 1 OCPU
  - 1 GB RAM
  - ⚠️ Make sure it says "Always Free-eligible"!

**Networking:**
- Leave default VCN
- Check: **"Assign a public IPv4 address"**

**Add SSH Keys:**
- Select: **"Generate SSH key pair"**
- Click **"Save Private Key"** (downloads `ssh-key-xxx.key`)
- Click **"Save Public Key"** (optional backup)
- **IMPORTANT:** Save this key file! You'll need it to connect.

**Boot Volume:** Leave defaults

### 2.3 Create!
Click **"Create"** button at bottom

Wait 2-3 minutes for provisioning. Status will change to **"Running"** (green).

---

## Step 3: Note Your Instance Details

Once running, you'll see:

**Public IP Address:** `xxx.xxx.xxx.xxx` ← Copy this!

You'll need this IP to connect.

---

## Step 4: Configure Firewall (Important!)

Oracle blocks most ports by default. We need to allow SSH:

### 4.1 Open Security List
1. Click your instance name
2. Under **"Instance Details"**, find **"Primary VNIC"**
3. Click the **Subnet** link (looks like: `subnet-xxxxxxx`)
4. Click **"Default Security List for ..."**

### 4.2 Add Ingress Rule
1. Click **"Add Ingress Rules"**
2. Fill in:
   - **Source CIDR:** `0.0.0.0/0`
   - **Destination Port Range:** `22`
   - **Description:** `SSH access`
3. Click **"Add Ingress Rules"**

**Note:** Expo tunnel uses ngrok, so we only need port 22 for SSH!

---

## Step 5: Connect to Your VM

### 5.1 Prepare SSH Key (Windows)

If you're on Windows:

1. Move downloaded key to safe place: `C:\Users\YOUR_USERNAME\.ssh\oracle-key.key`
2. Open PowerShell
3. Set permissions:
```powershell
icacls "C:\Users\YOUR_USERNAME\.ssh\oracle-key.key" /inheritance:r
icacls "C:\Users\YOUR_USERNAME\.ssh\oracle-key.key" /grant:r "$($env:USERNAME):(R)"
```

### 5.2 Connect via SSH

```bash
ssh -i C:\Users\YOUR_USERNAME\.ssh\oracle-key.key ubuntu@YOUR_PUBLIC_IP
```

Replace:
- `YOUR_USERNAME` with your Windows username
- `YOUR_PUBLIC_IP` with the IP from Step 3

First time will ask "Are you sure?" → Type `yes`

**You should now be connected to your VM!** 🎉

---

## Step 6: Install Node.js and Dependencies

Copy and paste these commands one by one:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x

# Install global packages
sudo npm install -g @expo/ngrok pm2
```

---

## Step 7: Set Up Your Project

### 7.1 Clone Repository

If your code is on GitHub:
```bash
git clone https://github.com/YOUR_USERNAME/psychedelic-integration-app.git
cd psychedelic-integration-app
```

If not on GitHub yet, you can use `scp` to copy from your computer:
```bash
# On your Windows machine (new PowerShell window):
scp -i C:\Users\YOUR_USERNAME\.ssh\oracle-key.key -r C:\Users\hadfi\psychedelic-integration-app ubuntu@YOUR_PUBLIC_IP:~/
```

### 7.2 Install Project Dependencies

```bash
cd psychedelic-integration-app
npm install
```

### 7.3 Create .env File

```bash
nano .env
```

Paste your environment variables:
```
SUPABASE_URL=https://hxpyeudklnqtwspmdsuz.supabase.co
SUPABASE_ANON_KEY=[SUPABASE_ANON_KEY_REDACTED]
ANTHROPIC_API_KEY=[ANTHROPIC_API_KEY_REDACTED]
DEBUG_CLAUDE=true
```

Save and exit:
- Press `Ctrl+X`
- Press `Y` (yes to save)
- Press `Enter`

---

## Step 8: Start Expo Tunnel with PM2

### 8.1 Create Start Script

```bash
cat > ~/psychedelic-integration-app/start-tunnel.sh << 'EOF'
#!/bin/bash
cd ~/psychedelic-integration-app
npx expo start --tunnel
EOF

chmod +x ~/psychedelic-integration-app/start-tunnel.sh
```

### 8.2 Start with PM2

```bash
cd ~/psychedelic-integration-app
pm2 start ./start-tunnel.sh --name expo-tunnel
```

### 8.3 Configure PM2 to Start on Boot

```bash
pm2 save
pm2 startup
# Copy and run the command it outputs (starts with sudo)
```

---

## Step 9: Get Your Shareable Link!

View the logs to see your tunnel URL:

```bash
pm2 logs expo-tunnel
```

Look for output like:
```
› Metro waiting on exp://abc123xyz.ngrok.io:80
› Scan the QR code above with Expo Go
```

**That's your shareable URL!**

You'll also see an ASCII QR code in the logs.

---

## Step 10: Share with Testers

Screenshot or copy the info from the logs and send to your iOS friends:

### Message to Send:

> Hi! I'd like you to test my Psychedelic Integration app.
>
> **Setup (takes 2 minutes):**
> 1. Install "Expo Go" from the App Store (free app)
> 2. Open Expo Go
> 3. Tap "Scan QR code"
> 4. Scan this QR code: [attach screenshot]
>
>    OR manually enter this URL in Expo Go:
>    `exp://YOUR-NGROK-URL`
>
> **Testing:**
> - Create an account and start exploring
> - Use the blue floating feedback button to report bugs or suggest features
>
> Thanks for helping test! 🙏

---

## Managing Your VM

### Check Status (from your computer):
```bash
ssh -i C:\Users\YOUR_USERNAME\.ssh\oracle-key.key ubuntu@YOUR_PUBLIC_IP "pm2 status"
```

### View Logs:
```bash
ssh -i C:\Users\YOUR_USERNAME\.ssh\oracle-key.key ubuntu@YOUR_PUBLIC_IP
pm2 logs expo-tunnel
```

### Restart Tunnel:
```bash
pm2 restart expo-tunnel
```

### Update Your App Code:
```bash
cd ~/psychedelic-integration-app
git pull origin main  # or master
pm2 restart expo-tunnel
```

Testers will automatically get updates next time they open the app!

### Stop Tunnel (saves resources):
```bash
pm2 stop expo-tunnel
```

### Start Again:
```bash
pm2 start expo-tunnel
```

---

## Important Notes

### ⚠️ Free Tier Limits
- 1 GB RAM (enough for Expo tunnel)
- 1 OCPU (enough)
- 50 GB storage
- **Always Free** - no expiration!

### 🔄 Tunnel URL Changes
The free ngrok tunnel URL changes when you restart. Options:
1. **Accept it** - just share new URL when needed
2. **Upgrade ngrok** ($8/month for permanent URL)
3. **Get ngrok free account** - Better rate limits

### 🔒 Security
- Your API keys are on the VM (secure them!)
- Only share expo tunnel URL with trusted testers
- Consider adding firewall rules for extra security

### 💡 Tips
- VM stays running 24/7 even if you disconnect
- You can stop PM2 when not testing to save resources
- Oracle may reclaim instances if unused for 30+ days (just start it again)

---

## Troubleshooting

### Can't connect via SSH:
- Check security list has port 22 open
- Verify using correct private key file
- Check instance is "Running" (green)
- Try: `ssh -v -i keyfile ubuntu@ip` for verbose output

### Expo won't start:
- Check Node.js installed: `node --version`
- Check in right directory: `cd ~/psychedelic-integration-app`
- Check .env file exists: `cat .env`
- Try: `npx expo start --tunnel --clear`

### PM2 not found:
```bash
sudo npm install -g pm2
```

### ngrok errors:
```bash
sudo npm install -g @expo/ngrok
```

### Out of memory:
- Oracle free tier is 1GB RAM
- Should be enough for Expo tunnel
- If issues, restart: `pm2 restart expo-tunnel`

---

## Quick Reference Commands

```bash
# Connect to VM
ssh -i ~/.ssh/oracle-key.key ubuntu@YOUR_IP

# Check tunnel status
pm2 status

# View logs and get URL
pm2 logs expo-tunnel

# Restart tunnel
pm2 restart expo-tunnel

# Update code
cd ~/psychedelic-integration-app && git pull && pm2 restart expo-tunnel

# Stop tunnel
pm2 stop expo-tunnel

# Start tunnel
pm2 start expo-tunnel
```

---

## Cost: $0 Forever! 🎉

You now have a 24/7 server running your Expo tunnel at **zero cost**!

Your iOS friends can test anytime by:
1. Installing Expo Go
2. Scanning your QR code
3. Testing!

No technical knowledge needed for them. Perfect! 👍

---

Need help with any step? Let me know!
