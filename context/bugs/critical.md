# Critical Bugs (P0)

**File Size Limit:** 300 lines - if exceeded, create critical-2.md
**Last Updated:** 2026-02-07

---

## Active Critical Bugs

### BUG-001: .env File Not in .gitignore
**Priority:** P0 - Critical (Security)
**Status:** ✅ RESOLVED
**Reported:** 2026-02-07 (migrated from old docs)
**Resolved:** 2026-02-07
**Assigned:** Security Audit

**Description:**
Environment variables file (.env) containing API keys was not in .gitignore, posing a security risk. File WAS committed to git history in commit e81ff17 (2025-11-21).

**Resolution:**
1. ✅ Added `.env` to `.gitignore`
2. ✅ Verified .env WAS in git history (commit e81ff17)
3. ✅ Created `.env.example` template
4. 🚨 KEY ROTATION REQUIRED (see SECURITY_INCIDENT_2026-02-07.md)
5. ✅ Documented in security incident report

**Action Required:**
- ✅ **COMPLETE:** Anthropic API key rotated (2026-02-07)
- ⚠️ **OPTIONAL:** Supabase key rotation (RLS provides protection)
- 📊 **ONGOING:** Monitor API usage for anomalies

**Files Changed:**
- `.gitignore` - Added `.env`
- `.env.example` - Created
- `SECURITY_INCIDENT_2026-02-07.md` - Full incident report

---

### BUG-002: SSH Key in Repository
**Priority:** P0 - Critical (Security)
**Status:** ✅ RESOLVED
**Reported:** 2026-02-07 (migrated from old docs)
**Resolved:** 2026-02-07
**Assigned:** Security Audit

**Description:**
SSH key files (ssh-key-2025-10-17.key and .pub) were in project directory. Public key (.pub) WAS committed to git history in e81ff17.

**Resolution:**
1. ✅ Moved SSH keys to `C:\Users\hadfi\.ssh\` directory
2. ✅ Added `*.pub` to .gitignore (*.key already present)
3. ✅ Verified public key was in git history (commit e81ff17)
4. ✅ Private key was NOT in git history (protected by existing .gitignore)
5. ✅ Documented in security incident report

**Action Required:**
- **RECOMMENDED:** Consider rotating SSH key for Oracle Cloud VM
- Review server access logs for unauthorized access
- Document server access procedures separately

**Files Changed:**
- `.gitignore` - Added `*.pub`
- SSH keys moved to `~/.ssh/`
- `SECURITY_INCIDENT_2026-02-07.md` - Full incident report

---

### BUG-003: VM Server Not Accessible Externally
**Priority:** P0 - Critical (Infrastructure)
**Status:** Open
**Reported:** 2026-02-07 (migrated from old docs)
**Assigned:** Unassigned

**Description:**
Development server running on Oracle Cloud VM (129.80.86.121) not accessible from external networks, preventing app sharing with testers.

**Impact:**
- BLOCKS app sharing with testers
- Cannot test on external networks
- Limits development to local machine

**Environment:**
- Server: Oracle Cloud Ubuntu VM
- Public IP: 129.80.86.121
- Ports attempted: 8081, 8082, 8083
- Metro bundler not binding to public IP

**Steps to Reproduce:**
1. Start expo server on VM
2. Try to access from external network (work WiFi, cellular)
3. Connection timeout or failed to download remote update

**Attempted Solutions:**
- ✗ `--host lan` flag
- ✗ `--tunnel` mode
- ✗ EXPO_PACKAGER_HOSTNAME environment variable
- ✗ Multiple port configurations
- ✓ Works locally on Windows (exp://172.16.103.212:8081)

**Proposed Solution:**

**Option A: Fix VM Networking** (Investigate)
1. Review Oracle Cloud VCN configuration
2. Check security lists and ingress rules
3. Verify subnet configuration
4. Test with simple HTTP server first

**Option B: Use EAS (Recommended)**
1. Set up Expo EAS for builds
2. Host on Expo's infrastructure
3. Simple URL sharing for testers
4. Cost: $29/month team plan

**Option C: Use Tunnel Service**
1. ngrok or CloudFlare Tunnel
2. Creates public URL for dev server
3. Free tier available
4. Good for testing

**Next Steps:**
1. Try simple HTTP server on VM to isolate issue
2. If VM network complex, move to EAS immediately
3. Document chosen solution

**Notes:**
- Blocking tester access currently
- Local Windows dev server works fine as temp solution
- May be Oracle Cloud-specific networking

---

## Recently Resolved

### BUG-001: .env File Not in .gitignore
**Priority:** P0 - Critical (Security)
**Status:** ✅ RESOLVED
**Resolved:** 2026-02-07
**Action Required:** KEY ROTATION WITHIN 24-48 HOURS

See details above in Active section (moved to Recently Resolved after 30 days).

---

### BUG-002: SSH Key in Repository
**Priority:** P0 - Critical (Security)
**Status:** ✅ RESOLVED
**Resolved:** 2026-02-07
**Action Required:** Consider SSH key rotation

See details above in Active section (moved to Recently Resolved after 30 days).

---

### BUG-000: GlimmerSwiper Crash
**Priority:** P0 - Critical
**Status:** Resolved
**Reported:** 2026-01-XX
**Resolved:** 2026-02-XX

**Description:**
GlimmerSwiper component crashing on launch.

**Solution:**
Fixed config loading and simplified initialization.

**Commit:** 5518bf6 - "Fix GlimmerSwiper crash and simplify config loading"

---

## Guidelines

**When to Mark P0:**
- App completely unusable
- Data loss or corruption possible
- Security vulnerability (API keys exposed, auth bypass)
- Crashes on core flows
- Blocks all testers/users

**Response Time:**
- Acknowledge within 1 hour
- Fix or workaround within 24-48 hours
- Communicate status to team immediately

**Escalation:**
If you discover a P0 bug:
1. Add to this file immediately
2. Notify team via primary channel
3. Stop other work to address
4. Document workaround if fix takes time

---

**Current Count:** 1 active, 3 resolved (2 today)
**File Status:** Under limit (300 lines)
**✅ KEY ROTATION:** Anthropic key rotated successfully!
