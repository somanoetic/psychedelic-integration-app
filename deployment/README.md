# Deployment Guide: AI Monitoring & Observability (FEAT-203)

**Quick Start - Deploy in 45 Minutes**

---

## Overview

This directory contains deployment automation and documentation for the **AI Monitoring & Observability** feature (FEAT-203).

**What's included:**
- Database setup and migration scripts
- Rollback procedures
- Health checks and verification
- Comprehensive deployment guide with troubleshooting

**Key files:**
- `08-deployment.md` - Complete 50+ page deployment guide
- `setup-database.sql` - Database setup and configuration
- `rollback.sql` - Safe rollback procedure
- `health-check.sql` - Post-deployment verification
- `README.md` - This file

---

## Quick Start (5 minutes)

### Prerequisites
- Supabase project ready
- Sentry account configured
- PostgreSQL client tools installed (`psql`)
- `.env` file with environment variables

### One-Command Deployment

```bash
# 1. Verify environment
cat .env | grep SUPABASE

# 2. Run database setup
psql -h "[project-id].supabase.co" -U postgres -d postgres -f deployment/setup-database.sql

# 3. Run health checks
psql -h "[project-id].supabase.co" -U postgres -d postgres -f deployment/health-check.sql

# 4. If health checks pass, deployment is complete!
```

**Total time: 35-45 minutes (fully automated)**

---

## Files in This Directory

### `08-deployment.md` (Complete Guide)

The main deployment documentation with:

**7 Deployment Phases:**
1. Pre-Deployment (15 min) - Environment verification, backups
2. Database Deployment (10-15 min) - Run migrations, verify
3. Service Account Setup (5-10 min) - Create service account
4. Environment Configuration (5 min) - Configure app environment
5. Scheduled Jobs (10 min) - Set up pg_cron jobs
6. Install Dependencies (5 min) - Install Sentry SDK
7. Deploy to EAS (varies) - Build and submit to app stores

**Includes:**
- Pre-deployment checklists (security, environment)
- Step-by-step instructions with code examples
- Post-deployment verification procedures
- Comprehensive rollback procedure
- Monitoring setup and alerts
- 6 troubleshooting scenarios with solutions
- 24/7 monitoring guidelines

**Read this first:** `08-deployment.md`

---

### `setup-database.sql` (Database Setup)

Automated database setup that:

1. ✅ Enables required PostgreSQL extensions
2. ✅ Runs main migration (5 tables, 4 views, 31 indexes)
3. ✅ Creates service account for metrics
4. ✅ Seeds initial admin user
5. ✅ Sets up 3 scheduled jobs:
   - View refresh (every 15 minutes)
   - Daily summary generation (1 AM UTC)
   - Data archival (2 AM UTC)

**Usage:**

```bash
# Via psql
psql -h "[project-id].supabase.co" -U postgres -d postgres -f setup-database.sql

# Or via Supabase CLI
npx supabase db push --project-id "[project-id]"

# Or copy/paste into Supabase SQL editor
```

**Output:**
- 5 tables created
- 4 materialized views created
- 31 indexes created
- 3 scheduled jobs created
- Service account ready
- Admin user ready

---

### `rollback.sql` (Quick Rollback)

Safe rollback procedure that:

1. ✅ Cancels all scheduled jobs
2. ✅ Drops materialized views
3. ✅ Drops all tables (with data)
4. ✅ Removes triggers and functions
5. ✅ Cleans up service accounts
6. ✅ Verifies complete rollback

**Usage:**

```bash
# Full rollback (deletes all data)
psql -h "[project-id].supabase.co" -U postgres -d postgres -f rollback.sql

# Or copy/paste into Supabase SQL editor
```

**WARNING:** This deletes all metrics data permanently.

**Recovery:** Restore from Supabase backup if needed.

---

### `health-check.sql` (Verification)

Post-deployment verification with 11 sections:

1. ✅ Table verification (5 tables)
2. ✅ Index verification (31 indexes)
3. ✅ Materialized views (4 views)
4. ✅ RLS policies (access control)
5. ✅ Triggers and functions
6. ✅ Scheduled jobs (3 jobs)
7. ✅ Data quality checks
8. ✅ Performance metrics
9. ✅ Sentry integration
10. ✅ User/service account verification
11. ✅ Summary report with health score

**Usage:**

```bash
# Run all health checks
psql -h "[project-id].supabase.co" -U postgres -d postgres -f health-check.sql

# Or in Supabase SQL editor:
# 1. Copy contents
# 2. Paste into editor
# 3. Click "Run" and review results
```

**Expected output:**
```
Health Check Summary
====================
Tables: 5 / 5
Indexes: 31+ / 31
Materialized Views: 4 / 4
RLS Policies: 5+ (expected > 5)
Scheduled Jobs: 3 / 3

===== HEALTH SCORE: 100% / 100 =====
Status: ✓ ALL CHECKS PASSED - Deployment Successful!
```

---

## Environment Variables

### Required for Deployment

Create `.env` file with these variables:

```bash
# Supabase
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_KEY=[your-service-key]  # Backend only

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-[your-key]

# Sentry (Error Tracking)
SENTRY_DSN=https://[key]@sentry.io/[project-id]

# Development
DEBUG_CLAUDE=false
```

### Getting Your Keys

**Supabase URL & Keys:**
1. Log in to https://app.supabase.com
2. Select your project
3. Settings > API
4. Copy `Project URL` and `Anon Key`
5. Copy `Service Role Key` (for backend operations)

**Anthropic API Key:**
1. Log in to https://console.anthropic.com
2. Settings > API Keys
3. Create new key or copy existing
4. Add to `.env`

**Sentry DSN:**
1. Log in to https://sentry.io
2. Select your project
3. Settings > DSN
4. Copy provided URL
5. Add to `.env`

---

## Deployment Checklist

### Pre-Deployment (15 minutes)

**Security:**
- [ ] API keys rotated (Anthropic, Supabase)
- [ ] `.env` file in `.gitignore`
- [ ] No secrets in git history
- [ ] Auth bypass button removed or gated

**Infrastructure:**
- [ ] Supabase project ready
- [ ] Sentry account active
- [ ] Database backup created
- [ ] Rollback procedure reviewed

**Environment:**
- [ ] Node.js 18+ installed
- [ ] PostgreSQL client tools ready
- [ ] `.env` file configured
- [ ] Git SSH keys set up

### Deployment (35-45 minutes)

**Database:**
- [ ] Run `setup-database.sql`
- [ ] Verify no SQL errors
- [ ] Check table creation

**Verification:**
- [ ] Run `health-check.sql`
- [ ] Health score = 100%
- [ ] All checks passed

**Testing:**
- [ ] Test metrics insertion
- [ ] Verify dashboard access
- [ ] Check Sentry integration
- [ ] Monitor first 24 hours

### Post-Deployment (Ongoing)

**Monitoring:**
- [ ] Check metrics flow daily
- [ ] Monitor error rates
- [ ] Review Sentry issues
- [ ] Verify view refresh

**Maintenance:**
- [ ] Archive old metrics monthly
- [ ] Monitor storage usage
- [ ] Review query performance
- [ ] Plan capacity upgrades

---

## Common Deployment Scenarios

### Scenario 1: Fresh Production Deploy

**Time: 45 minutes**

```bash
# 1. Backup (Supabase dashboard)
Settings > Database > Backups > Create Backup

# 2. Setup database
psql -h "[prod-project].supabase.co" -U postgres -d postgres \
  -f deployment/setup-database.sql

# 3. Verify
psql -h "[prod-project].supabase.co" -U postgres -d postgres \
  -f deployment/health-check.sql

# 4. Deploy app
eas build --platform all --auto-submit
```

### Scenario 2: Staging Test Before Production

**Time: 35 minutes**

```bash
# 1. Deploy to staging (separate Supabase project)
psql -h "[staging-project].supabase.co" -U postgres -d postgres \
  -f deployment/setup-database.sql

# 2. Test thoroughly
# ... (manual testing) ...

# 3. If successful, deploy to production
# ... (repeat scenario 1) ...
```

### Scenario 3: Quick Rollback (Emergency)

**Time: < 5 minutes**

```bash
# Option A: Code rollback (keep DB)
git revert --no-edit HEAD
eas build --platform all --auto-submit

# Option B: Full database rollback (restore from backup)
# Via Supabase dashboard:
# Settings > Database > Backups > Restore

# Option C: SQL rollback
psql -h "[project-id].supabase.co" -U postgres -d postgres \
  -f deployment/rollback.sql
```

---

## Troubleshooting Quick Fixes

### Tables Not Created

```sql
-- Verify migration ran
SELECT COUNT(*) FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'ai_%';
-- Should return 5

-- If 0, run migration:
psql -h "[project-id].supabase.co" -U postgres -d postgres \
  -f supabase/migrations/20260209000000_ai_monitoring_schema.sql
```

### Metrics Not Flowing

```javascript
// In app console
import metricsService from './lib/metricsService';
metricsService.logAIMetric({
  serviceName: 'test',
  operation: 'test',
  durationMs: 100,
  status: 'success'
});

// Wait 15 seconds, then check DB:
// SELECT * FROM ai_metrics WHERE service_name = 'test';
```

### Dashboard Loads Slowly

```sql
-- Check query performance
EXPLAIN ANALYZE
SELECT * FROM mv_service_performance_last_7d;

-- If slow, check for missing indexes:
SELECT * FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND tablename LIKE 'ai_%'
ORDER BY idx_scan DESC;
```

### Scheduled Jobs Not Running

```sql
-- Check pg_cron status
SELECT * FROM cron.job
WHERE command LIKE '%mv_%' OR command LIKE '%archive%';

-- Check job execution logs
SELECT jobid, last_run_status, last_start, last_end
FROM cron.job
WHERE command LIKE '%mv_%';

-- If not running, recreate job:
SELECT cron.schedule('refresh-ai-views', '*/15 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_service_performance_last_7d;'
);
```

---

## Support Resources

**Documentation:**
- `08-deployment.md` - Complete deployment guide (50+ pages)
- `docs/MONITORING.md` - Monitoring setup and alerts
- `docs/AI_ARCHITECTURE.md` - System architecture
- `.full-stack-feature/03-architecture.md` - Feature architecture

**External Resources:**
- Supabase docs: https://supabase.com/docs
- Sentry docs: https://docs.sentry.io
- PostgreSQL docs: https://www.postgresql.org/docs

**Getting Help:**
1. Check troubleshooting section in `08-deployment.md`
2. Run `health-check.sql` to identify issues
3. Check app logs and Sentry dashboard
4. Review commit history for context

---

## File Manifest

```
deployment/
├── README.md                        # This file
├── 08-deployment.md                 # Complete deployment guide (50+ pages)
├── setup-database.sql               # Database setup automation
├── rollback.sql                     # Safe rollback procedure
├── health-check.sql                 # Post-deployment verification
└── monitoring-scripts/              # (Optional) Monitoring automation
    └── check-health.sh              # Bash script for continuous monitoring
```

---

## Key Metrics

**Deployment Success Criteria:**

| Metric | Expected | Threshold |
|--------|----------|-----------|
| Tables Created | 5 | ≥ 5 |
| Indexes Created | 31+ | ≥ 30 |
| Views Created | 4 | = 4 |
| RLS Policies | 5+ | ≥ 5 |
| Scheduled Jobs | 3 | = 3 |
| Health Score | 100% | ≥ 100% |

**Post-Deployment Monitoring:**

| Metric | Normal | Alert Threshold |
|--------|--------|-----------------|
| Metrics/minute | 166 | < 80 |
| Error rate | < 1% | > 5% |
| Query time (p95) | < 100ms | > 1s |
| Table size | < 500MB | > 500MB |
| Disk usage | < 80% | > 90% |

---

## Timeline

**Estimated Deployment Timeline:**

| Phase | Duration | Status |
|-------|----------|--------|
| 1. Pre-Deployment | 15 min | Manual |
| 2. Database Setup | 10-15 min | Automated (SQL) |
| 3. Verification | 5-10 min | Automated (SQL) |
| 4. App Config | 5 min | Automated (code) |
| 5. Dependencies | 5 min | Automated (npm) |
| 6. EAS Build | 5-15 min | Automated (cloud) |
| **Total** | **45-65 min** | Mostly Automated |

---

## Next Steps

1. **Read the full guide:** `08-deployment.md`
2. **Prepare environment:** Set up `.env` with credentials
3. **Create backup:** Via Supabase dashboard
4. **Run setup:** Execute `setup-database.sql`
5. **Verify:** Run `health-check.sql`
6. **Monitor:** Check metrics for 24 hours
7. **Celebrate:** 🎉 Feature is live!

---

**Last Updated:** 2026-02-09
**Version:** 1.0.0
**Status:** ✅ Ready for Production Deployment
