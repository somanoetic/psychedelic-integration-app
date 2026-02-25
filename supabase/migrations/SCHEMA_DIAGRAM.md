# AI Monitoring Schema Diagram

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AI MONITORING SYSTEM                            │
│                         Database Schema v1.0                            │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   auth.users         │
│   (Supabase Auth)    │
├──────────────────────┤
│ • id (UUID)          │
│ • email              │
│ • metadata           │
│   - role             │
│   - account_type     │
└──────┬───────────────┘
       │
       │ FK (CASCADE DELETE)
       │
       ├─────────────────────────────────────────────────────────────┐
       │                                                               │
       │                                                               │
       ▼                                                               ▼
┌─────────────────────────────────────┐                    ┌──────────────────────┐
│ ai_metrics (Event Stream)           │                    │ ai_conversations     │
├─────────────────────────────────────┤                    ├──────────────────────┤
│ • id (UUID, PK)                     │                    │ • id (UUID, PK)      │
│ • created_at (timestamptz)          │                    │ • conversation_id ◄──┼──┐
│ • service_name (text)               │                    │ • user_id (FK) ──────┤  │
│ • operation_type (text)             │                    │ • total_messages     │  │
│ • user_id (UUID, FK) ───────────────┤                    │ • total_tokens       │  │
│ • conversation_id (UUID) ───────────┼──────────────────► │ • total_cost_usd     │  │
│ • duration_ms (int)                 │  References        │ • error_count        │  │
│ • tokens_input (int)                │                    │ • success_rate       │  │
│ • tokens_output (int)               │                    │ • crisis_detected    │  │
│ • tokens_total (computed)           │                    │ • flagged_for_review │  │
│ • estimated_cost_usd (decimal)      │                    └──────────────────────┘  │
│ • status (enum)                     │                                              │
│ • error_message (text)              │                    ┌──────────────────────┐  │
│ • model_name (text)                 │                    │ ai_daily_summary     │  │
│ • cache_hit (boolean)               │                    ├──────────────────────┤  │
│ • flagged_for_review (boolean)      │                    │ • id (UUID, PK)      │  │
│ • metadata (JSONB)                  │                    │ • summary_date (date)│  │
└───┬────────┬────────────────────────┘                    │ • total_calls        │  │
    │        │                                              │ • total_tokens       │  │
    │        │ FK (CASCADE DELETE)                          │ • total_cost_usd     │  │
    │        │                                              │ • by_service (JSONB) │  │
    │        ▼                                              │ • success_rate       │  │
    │  ┌──────────────────────────────────┐               │ • cache_hit_rate     │  │
    │  │ ai_routing_decisions             │               └──────────────────────┘  │
    │  ├──────────────────────────────────┤                                         │
    │  │ • id (UUID, PK)                  │                                         │
    │  │ • created_at (timestamptz)       │                                         │
    │  │ • metric_id (UUID, FK) ──────────┤                                         │
    │  │ • user_id (UUID, FK)             │                                         │
    │  │ • conversation_id (UUID) ────────┼─────────────────────────────────────────┘
    │  │ • user_input_preview (text)      │   (Soft link - no FK constraint)
    │  │ • selected_route (enum)          │
    │  │ • confidence_score (decimal)     │
    │  │ • reasoning (text)               │
    │  │ • alternative_routes (JSONB)     │
    │  │ • context_signals (JSONB)        │
    │  │ • flagged_for_review (boolean)   │
    │  └──────────────────────────────────┘
    │
    │ FK (CASCADE DELETE)
    │
    ▼
┌──────────────────────────────────┐
│ ai_errors                        │
├──────────────────────────────────┤
│ • id (UUID, PK)                  │
│ • created_at (timestamptz)       │
│ • metric_id (UUID, FK)           │
│ • user_id (UUID, FK)             │
│ • service_name (text)            │
│ • operation_type (text)          │
│ • error_type (enum)              │
│ • error_message (text)           │
│ • error_code (text)              │
│ • stack_trace (text)             │
│ • sentry_id (text) ──────────┐   │
│ • sentry_url (text)          │   │
│ • retry_count (int)          │   │
│ • recovered (boolean)        │   │
│ • user_impact (enum)         │   │
└──────────────────────────────┼───┘
                               │
                               │ External Integration
                               ▼
                        ┌─────────────┐
                        │   Sentry    │
                        │  (External) │
                        └─────────────┘
```

---

## Materialized Views

```
┌─────────────────────────────────────────────────────────────────┐
│                    MATERIALIZED VIEWS                           │
│              (Refreshed every 15 minutes)                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────┐
│ mv_service_performance_last_7d   │
├──────────────────────────────────┤
│ Aggregates: ai_metrics           │
│ Time Range: Last 7 days          │
│ Grouped By: service_name         │
├──────────────────────────────────┤
│ • service_name                   │
│ • total_calls                    │
│ • success_rate                   │
│ • avg/p95/p99 duration           │
│ • total_tokens                   │
│ • total_cost_usd                 │
│ • cache_hit_rate                 │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ mv_top_errors_last_24h           │
├──────────────────────────────────┤
│ Aggregates: ai_errors            │
│ Time Range: Last 24 hours        │
│ Grouped By: service, type, code  │
│ Limit: Top 50 by occurrence      │
├──────────────────────────────────┤
│ • service_name                   │
│ • error_type                     │
│ • error_code                     │
│ • occurrence_count               │
│ • affected_users                 │
│ • avg_impact_score               │
│ • sentry_ids (array)             │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ mv_routing_quality_daily         │
├──────────────────────────────────┤
│ Aggregates: ai_routing_decisions │
│ Time Range: Last 30 days         │
│ Grouped By: date, route          │
├──────────────────────────────────┤
│ • routing_date                   │
│ • selected_route                 │
│ • total_routes                   │
│ • avg_confidence                 │
│ • low_confidence_count           │
│ • low_confidence_rate            │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ mv_user_cost_last_30d            │
├──────────────────────────────────┤
│ Aggregates: ai_metrics           │
│ Time Range: Last 30 days         │
│ Grouped By: user_id              │
├──────────────────────────────────┤
│ • user_id                        │
│ • total_calls                    │
│ • total_tokens                   │
│ • total_cost_usd                 │
│ • conversation_count             │
│ • error_count                    │
└──────────────────────────────────┘
```

---

## Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                         DATA FLOW                                │
└──────────────────────────────────────────────────────────────────┘

1. User Message Arrives
        │
        ▼
   ┌─────────────────────┐
   │ conversational      │
   │ RoutingService      │
   └──────┬──────────────┘
          │
          │ Logs routing decision
          │
          ▼
   ┌────────────────────────────┐
   │ ai_routing_decisions       │ ◄─── Trigger: Auto-flag low confidence
   │ (confidence, route chosen) │
   └────────────────────────────┘
          │
          │ Route to appropriate service
          │
          ▼
   ┌─────────────────────┐
   │ AI Service          │
   │ (huxley, ifs, etc)  │
   └──────┬──────────────┘
          │
          │ Logs metric (start/end)
          │
          ▼
   ┌────────────────────────────┐
   │ ai_metrics                 │ ◄─── Trigger: Update conversation aggregate
   │ (tokens, cost, duration)   │
   └────────┬───────────────────┘
            │
            │ If error occurs
            │
            ▼
   ┌────────────────────────────┐
   │ ai_errors                  │
   │ (error details, stack)     │
   └────────────────────────────┘
            │
            │ Linked to Sentry
            │
            ▼
   ┌────────────────────────────┐
   │ Sentry                     │
   │ (error tracking platform)  │
   └────────────────────────────┘

2. Aggregation (via Trigger)
   ┌────────────────────────────┐
   │ ai_metrics                 │
   │ (new row inserted)         │
   └────────┬───────────────────┘
            │
            │ Trigger: update_conversation_aggregate()
            │
            ▼
   ┌────────────────────────────┐
   │ ai_conversations           │
   │ (increments totals)        │
   └────────────────────────────┘

3. Daily Rollup (Scheduled Job)
   ┌────────────────────────────┐
   │ Cron Job (2 AM daily)      │
   └────────┬───────────────────┘
            │
            │ Computes daily aggregates
            │
            ▼
   ┌────────────────────────────┐
   │ ai_daily_summary           │
   │ (1 row per day)            │
   └────────────────────────────┘

4. Dashboard Queries
   ┌────────────────────────────┐
   │ Admin Dashboard            │
   └────────┬───────────────────┘
            │
            │ Query materialized views
            │
            ▼
   ┌────────────────────────────┐
   │ mv_service_performance_*   │
   │ mv_top_errors_*            │
   │ mv_routing_quality_*       │
   │ mv_user_cost_*             │
   └────────────────────────────┘
            │
            │ Refreshed every 15 min
            │
            ▼
   ┌────────────────────────────┐
   │ Fast query results (<100ms)│
   └────────────────────────────┘
```

---

## Row Level Security (RLS)

```
┌──────────────────────────────────────────────────────────────────┐
│                    RLS POLICIES                                  │
└──────────────────────────────────────────────────────────────────┘

User Types:
1. Regular Users    (auth.uid() = user_id)
2. Admins           (raw_user_meta_data->>'role' = 'admin')
3. Service Accounts (raw_user_meta_data->>'account_type' = 'service')

┌─────────────────────────┬──────────┬──────────┬──────────┐
│ Table                   │ User     │ Admin    │ Service  │
├─────────────────────────┼──────────┼──────────┼──────────┤
│ ai_metrics              │ SELECT   │ SELECT   │ INSERT   │
│                         │ (own)    │ (all)    │ (only)   │
├─────────────────────────┼──────────┼──────────┼──────────┤
│ ai_routing_decisions    │ None     │ SELECT   │ INSERT   │
│                         │          │ (all)    │ (only)   │
├─────────────────────────┼──────────┼──────────┼──────────┤
│ ai_errors               │ SELECT   │ SELECT   │ INSERT   │
│                         │ (own)    │ (all)    │ (only)   │
├─────────────────────────┼──────────┼──────────┼──────────┤
│ ai_conversations        │ SELECT   │ SELECT   │ INSERT   │
│                         │ (own)    │ (all)    │ UPDATE   │
├─────────────────────────┼──────────┼──────────┼──────────┤
│ ai_daily_summary        │ SELECT   │ SELECT   │ INSERT   │
│                         │ (all)    │ (all)    │ UPDATE   │
└─────────────────────────┴──────────┴──────────┴──────────┘

Note: ai_routing_decisions is admin-only because it contains
      user_input_preview (first 200 chars of user message)
```

---

## Index Strategy

```
┌──────────────────────────────────────────────────────────────────┐
│                     INDEX TYPES                                  │
└──────────────────────────────────────────────────────────────────┘

1. B-Tree Indexes (23 indexes)
   • Time-based queries (created_at DESC)
   • Service performance (service_name + created_at)
   • User history (user_id + created_at)
   • Conversation tracking (conversation_id)

2. Partial Indexes (6 indexes)
   • Error queries (WHERE status != 'success')
   • Flagged items (WHERE flagged_for_review = TRUE)
   • Low confidence routes (WHERE confidence_score < 0.7)
   • Unrecovered errors (WHERE recovered = FALSE)
   • High impact errors (WHERE user_impact IN ('high', 'medium'))
   • Crisis detection (WHERE crisis_detected = TRUE)

3. GIN Indexes (2 indexes)
   • JSONB searches (metadata, by_service, alternative_routes)
   • Array searches (services_used, flag_reasons)

┌──────────────────────────────────────────────────────────────────┐
│                   INDEX USAGE EXAMPLES                           │
└──────────────────────────────────────────────────────────────────┘

Fast Queries:
✓ SELECT * FROM ai_metrics WHERE service_name = 'huxley' ORDER BY created_at DESC LIMIT 10;
✓ SELECT * FROM ai_metrics WHERE user_id = 'uuid' AND created_at > NOW() - INTERVAL '7 days';
✓ SELECT * FROM ai_routing_decisions WHERE confidence_score < 0.7;
✓ SELECT * FROM ai_errors WHERE user_impact = 'high' ORDER BY created_at DESC;
✓ SELECT * FROM ai_conversations WHERE crisis_detected = TRUE;

Slow Queries (avoid these):
✗ SELECT * FROM ai_metrics WHERE error_message LIKE '%timeout%'; (no index)
✗ SELECT * FROM ai_metrics WHERE metadata->>'some_deep_key' = 'value'; (slow JSONB)
```

---

## Storage & Performance

```
┌──────────────────────────────────────────────────────────────────┐
│                STORAGE ESTIMATES (1K Users)                      │
└──────────────────────────────────────────────────────────────────┘

ai_metrics:           ~500 MB/year (10K rows/day)
ai_routing_decisions: ~100 MB/year (2K rows/day)
ai_errors:            ~50 MB/year (100 rows/day)
ai_conversations:     ~150 MB/year (5K rows/day)
ai_daily_summary:     ~10 MB/year (1 row/day)
Indexes:              ~150 MB/year (15% overhead)
──────────────────────────────────────────────────
Total:                ~860 MB/year

With 90-day retention: ~215 MB steady state

┌──────────────────────────────────────────────────────────────────┐
│                 QUERY PERFORMANCE TARGETS                        │
└──────────────────────────────────────────────────────────────────┘

Materialized Views:   <100ms (p95)
Direct Table Queries: <500ms (p95)
Aggregation Queries:  <1s (p95)
Write Operations:     <10ms (p95)
```

---

## Automation & Maintenance

```
┌──────────────────────────────────────────────────────────────────┐
│                    SCHEDULED JOBS                                │
└──────────────────────────────────────────────────────────────────┘

1. Materialized View Refresh
   Frequency: Every 15 minutes
   Function: refresh_ai_monitoring_views()
   Purpose: Keep dashboard data fresh
   Runtime: ~5-10 seconds

2. Data Archival
   Frequency: Daily at 2 AM
   Function: archive_old_ai_metrics()
   Purpose: Delete data older than 90 days
   Runtime: ~30 seconds to 2 minutes

3. Daily Summary Computation
   Frequency: Daily at 1 AM
   Function: compute_daily_summary()
   Purpose: Create ai_daily_summary row
   Runtime: ~10-30 seconds
   (Note: This function needs to be implemented)

┌──────────────────────────────────────────────────────────────────┐
│                      TRIGGERS                                    │
└──────────────────────────────────────────────────────────────────┘

1. update_conversation_aggregate()
   Fires: AFTER INSERT on ai_metrics
   Purpose: Auto-update ai_conversations aggregates
   Runtime: <5ms per row

2. auto_flag_routing_decisions()
   Fires: BEFORE INSERT on ai_routing_decisions
   Purpose: Auto-flag low confidence or crisis routes
   Runtime: <1ms per row
```

---

## GDPR Compliance

```
┌──────────────────────────────────────────────────────────────────┐
│               DATA DELETION FOR GDPR                             │
└──────────────────────────────────────────────────────────────────┘

Function: delete_user_ai_data(target_user_id UUID)

Deletes:
✓ ai_metrics (all rows with user_id)
✓ ai_routing_decisions (all rows with user_id)
✓ ai_errors (all rows with user_id)
✓ ai_conversations (all rows with user_id)

Keeps:
• ai_daily_summary (anonymized, no user_id)

Cascade:
• All FK constraints have ON DELETE CASCADE
• Child records automatically deleted

Usage:
SELECT delete_user_ai_data('user-uuid-here');
```

---

## Legend

```
┌──────────────────────────────────────────────────────────────────┐
│                         LEGEND                                   │
└──────────────────────────────────────────────────────────────────┘

PK    = Primary Key
FK    = Foreign Key
JSONB = JSON Binary (indexed, searchable)
UUID  = Universally Unique Identifier
enum  = Constrained to specific values

───► = Foreign Key relationship (enforced)
──── = Soft link (not enforced, for reference)

Indexes:
├── B-tree: Standard index for sorting and equality
├── Partial: Index only on subset of rows (WHERE clause)
└── GIN: Generalized Inverted Index (for JSONB/arrays)

RLS = Row Level Security
CASCADE DELETE = When parent deleted, children also deleted
SECURITY DEFINER = Function runs with elevated privileges
```

---

**Schema Version:** 1.0
**Last Updated:** 2026-02-09
**Migration File:** `20260209000000_ai_monitoring_schema.sql`
