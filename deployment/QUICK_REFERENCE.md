# FEAT-101 Deployment Quick Reference

**Quick Start Guide for Deployment Engineers**

---

## Pre-Deployment (5 Minutes)

```bash
# 1. Verify code is ready
git status
# Expected: clean

# 2. Check all tests passing
npm run test

# 3. Validate migrations
supabase db validate

# 4. Verify no secrets
git log --all -S 'sk-ant-' | wc -l
# Expected: 0
```

---

## Deploy to Staging (2-3 Hours)

### Option A: Automatic via CI/CD

```bash
git push origin master
# Pipeline runs automatically, follow progress in GitHub Actions
```

### Option B: Manual Deployment

```bash
# 1. Validate
supabase db validate
supabase functions validate claude-proxy

# 2. Create backup
supabase link --project-ref <staging-id>
# Backup via Supabase Dashboard

# 3. Deploy database
supabase db push

# 4. Deploy edge function
supabase secrets set ANTHROPIC_API_KEY="sk-ant-..."
supabase functions deploy claude-proxy

# 5. Build app
eas build --platform all --non-interactive

# 6. Create OTA update
eas update --branch staging --message "FEAT-101: Session Checklist"

# 7. Verify
supabase functions logs claude-proxy --limit 10
# Check for errors
```

---

## Deploy to Production (3-4 Hours)

### Pre-deployment

```bash
# Ensure staging is stable for 24+ hours
# Monitor for errors, check adoption rate
# Get tech lead approval
```

### Execute Deployment

```bash
# Same as staging, but use production Supabase project
supabase link --project-ref <prod-id>

# Deploy database
supabase db push

# Deploy edge function
supabase secrets set ANTHROPIC_API_KEY="sk-ant-..."
supabase functions deploy claude-proxy

# Build and deploy app
eas build --platform all
eas update --branch production --message "FEAT-101: Session Checklist"
```

### Enable Feature Flag

```bash
# Edit deployment/feature-flags.json
# Set: feat_101_session_checklist.enabled: false → true
# Set: percentage: 0 → 10 (start with 10% of users)

git add deployment/feature-flags.json
git commit -m "Enable FEAT-101: Session Checklist (Phase 1)"
git push origin master

# Monitor Phase 1 for 2-3 days before Phase 2
```

---

## Monitor Deployment

### Key Commands

```bash
# Check error rate
curl -s "$SUPABASE_URL/rest/v1/api_usage_logs?select=count()" \
  -H "Authorization: Bearer $SUPABASE_KEY" | jq .

# Check function logs
supabase functions logs claude-proxy --tail

# Check database health
psql "$SUPABASE_DB_URL" -c "SELECT version();"

# Check feature adoption
psql "$SUPABASE_DB_URL" << 'SQL'
  SELECT COUNT(DISTINCT user_id) FROM session_checklists
  WHERE created_at > NOW() - INTERVAL '24 hours';
SQL
```

### Critical Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Error Rate | >1% | >5% for 5 min |
| P99 Latency | >500ms | >5000ms for 10 min |
| RLS Violations | >0 | Any |
| Database Down | - | Any |
| Edge Function Down | - | >3 min |

---

## Rollback (15-30 Minutes)

### Quick Rollback (Feature Flag Only)

```bash
# Edit deployment/feature-flags.json
# Set: enabled: true → false

git add deployment/feature-flags.json
git commit -m "Emergency: Disable FEAT-101"
git push

# Users get old version on next app restart
# Timeline: 2-5 minutes for flag change
```

### Full Rollback (Database + App)

```bash
# 1. Disable feature flag (as above)

# 2. Rollback database
psql "$SUPABASE_DB_URL" < supabase/migrations/*_rollback.sql

# 3. Revert app to previous version
eas update --branch production --republish

# 4. Verify everything working
supabase functions logs claude-proxy | head
# Should show old version or no requests
```

---

## Health Checks

### Post-Deployment Verification

```bash
# 1. Database tables exist
psql "$SUPABASE_DB_URL" << 'SQL'
  \dt public.session_checklists
  \dt public.session_checklist_items
SQL

# 2. Edge function responding
curl -X POST "https://$SUPABASE_URL/functions/v1/claude-proxy" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model":"claude-opus-4-6",
    "max_tokens":50,
    "messages":[{"role":"user","content":"test"}]
  }' | jq .

# 3. No errors in logs
supabase functions logs claude-proxy --limit 20 | grep -i error

# 4. Manual end-to-end test
# - Start app on device
# - Log in
# - Create session
# - See checklist
# - Toggle items
# - Verify data persists
```

---

## Troubleshooting

### "Database migration failed"
```bash
# Check what went wrong
supabase db push --verbose

# Restore backup via Supabase Dashboard
# Settings → Backups → Restore

# Investigate migration file
cat supabase/migrations/*session_checklist*.sql
```

### "Edge function returns 500"
```bash
# Check logs
supabase functions logs claude-proxy --limit 50

# Check API key is set
supabase secrets list | grep ANTHROPIC

# If missing:
supabase secrets set ANTHROPIC_API_KEY="sk-ant-..."
supabase functions deploy claude-proxy
```

### "RLS policies not working"
```bash
# Check RLS is enabled
psql "$SUPABASE_DB_URL" << 'SQL'
  SELECT tablename, rowsecurity FROM pg_tables
  WHERE tablename LIKE 'session_checklist%';
SQL

# Check policies exist
psql "$SUPABASE_DB_URL" << 'SQL'
  SELECT tablename, policyname FROM pg_policies
  WHERE tablename LIKE 'session_checklist%';
SQL

# If missing, rollback and re-apply migration
```

---

## Contact & Escalation

### On-Call Rotation

- **Primary:** [Name] (Slack: @[user])
- **Backup:** [Name] (Slack: @[user])
- **Tech Lead:** [Name] (Slack: @[user])

### Communication Channels

- **Deployment Updates:** #deployment
- **Incidents:** #incidents
- **Feature Discussion:** #feat-101-status

---

## Checklist Templates

### Pre-Deployment (Paste into Slack)

```
FEAT-101 Deployment Starting
Target: [staging/production]
Duration: ~2-3 hours
Status: 🟡 In Progress

Phase 1: Validation ✅
Phase 2: Database ⏳
Phase 3: Edge Function ⏳
Phase 4: App Build ⏳
Phase 5: Verification ⏳
Phase 6: Done ⏳

No issues so far.
```

### Post-Deployment (Paste into Slack)

```
✅ FEAT-101 Deployment Complete

Deployment: [X]h [Y]m
Result: ✅ Successful
Features: Database ✅, Edge Function ✅, App ✅

Metrics:
- Error Rate: <1% ✅
- P99 Latency: <1s ✅
- Adoption: 10-15% ✅

Next: Monitor for 24h, then Phase 2 rollout
On-Call: @[name] until [time]
```

---

## Documentation

- **Full Runbook:** `deployment/DEPLOYMENT_RUNBOOK.md`
- **Monitoring:** `deployment/monitoring.yaml`
- **Infrastructure:** `deployment/infrastructure.yaml`
- **Feature Flags:** `deployment/feature-flags.json`
- **Checklist:** `deployment/DEPLOYMENT_CHECKLIST.md`

---

## Environment Variables

```bash
# Set these before deployment

export ENVIRONMENT=staging  # or production
export SUPABASE_PROJECT_ID="your-project-id"
export SUPABASE_ACCESS_TOKEN="your-token"
export SUPABASE_DB_URL="postgresql://..."
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export ANTHROPIC_API_KEY="sk-ant-..."
export EAS_TOKEN="your-eas-token"
```

---

## File Locations

```
deployment/
├── DEPLOYMENT_RUNBOOK.md               # Complete deployment guide
├── DEPLOYMENT_CHECKLIST.md             # Step-by-step checklist
├── DEPLOYMENT_INFRASTRUCTURE_SUMMARY.md # Executive summary
├── QUICK_REFERENCE.md                  # This file
├── monitoring.yaml                     # Monitoring & alerts
├── feature-flags.json                  # Feature flag config
└── infrastructure.yaml                 # Infrastructure as code

.github/workflows/
└── feat-101-deployment.yml            # CI/CD pipeline

.full-stack-feature/
├── SECURITY_FIX_DEPLOYMENT.md         # Security fixes
├── 07-testing.md                      # Test results
├── 03-architecture.md                 # Architecture
└── 04-database-implementation.md      # Database design

supabase/
├── migrations/
│   ├── 20260210000000_session_checklist_schema.sql
│   └── 20260210000000_session_checklist_rollback.sql
└── functions/
    └── claude-proxy/
        └── index.ts
```

---

## Success Criteria

✅ All checkpoints completed:
- Database tables created
- Edge function responding
- App builds successful
- Error rate < 1%
- No RLS violations
- Feature flag enabled
- Users accessing feature
- Monitoring alerts operational

---

**Keep this handy during deployment!**

Last updated: 2026-02-10
