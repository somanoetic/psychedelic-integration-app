# AI Monitoring & Observability Database Design

**Feature:** FEAT-203 - AI Monitoring & Observability  
**Version:** 1.0  
**Date:** 2026-02-09  
**Database:** Supabase (PostgreSQL 15+)

---

## Key Design Highlights

### Core Tables
1. **ai_metrics** - Event stream for all AI service interactions (10K rows/day expected)
2. **ai_routing_decisions** - Audit log for routing with PII protection (2K rows/day)
3. **ai_errors** - Detailed error tracking with Sentry integration (100 rows/day)
4. **ai_conversations** - Aggregated conversation metrics (5K rows/day)
5. **ai_daily_summary** - Pre-computed daily rollups (1 row/day)

### Security Features
- Row Level Security (RLS) on all tables
- Admin-only access to routing decisions (contains user input text)
- Service accounts have write-only access for logging
- GDPR compliance with data deletion functions

### Performance Features
- Composite indexes for common query patterns (service + timestamp)
- Partial indexes for filtered queries (errors, flagged items only)
- GIN indexes for JSONB and array searches
- Materialized views for dashboard performance (4 views, refreshed every 15 min - 24 hours)
- Estimated 860 MB/year for 1K users (scales to 50K users = 43 GB without partitioning)

### Key Query Patterns
- **Real-time dashboard**: Service performance metrics (last 24h)
- **Cost tracking**: Per-user token usage and costs
- **Quality monitoring**: Flagged conversations, crisis detections
- **Error analysis**: Top errors by service with occurrence counts

### Automation
- Triggers auto-update conversation aggregates
- Triggers auto-flag suspicious routing decisions (low confidence, crisis, distressed sentiment)
- Scheduled functions compute daily summaries
- Automated data archival after 90 days

---

## Complete Schema Details

**See full agent output above for:**
- Detailed table definitions with all columns, constraints, and indexes
- RLS policies for each table
- Migration scripts (safe, with rollback)
- Materialized view definitions
- Trigger functions for automation
- Repository interface design (TypeScript)
- Query patterns and optimization strategies
- GDPR compliance functions
- Testing strategies
- Deployment checklist

---

## Next Steps

1. Review schema with stakeholders
2. Run migration script in staging environment
3. Test RLS policies with service and user accounts
4. Create materialized views
5. Implement metricsService.js repository layer
6. Test integration with AI services

---

**Estimated Storage:** 860 MB/year (1K users), 43 GB/year (50K users)  
**Query Performance Target:** <100ms for 95th percentile  
**Data Retention:** 90 days (then archive to cold storage)  
**RLS:** Enabled on all tables, admin-only for sensitive data

