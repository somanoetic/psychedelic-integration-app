# ADR-003: Use Supabase for Backend Infrastructure

**Date:** 2026-02-08 (Retrospective - original decision ~2023)
**Status:** Accepted
**Deciders:** Project Lead

---

## Context

The app needed a backend solution to handle:
- User authentication and authorization
- Relational database for structured data (journal entries, sessions, exercises)
- Row-level security for user data privacy
- Real-time capabilities (future chat features)
- File storage (future image/audio uploads)
- Serverless architecture for cost efficiency
- Low maintenance overhead for small team

**Requirements:**
- PostgreSQL database (complex queries, ACID compliance)
- Built-in authentication (email/password, social logins)
- Strong security model (RLS - Row Level Security)
- Scalable without DevOps team
- Affordable for early-stage product
- Developer-friendly (good DX)

**Constraints:**
- Solo developer (no dedicated backend team)
- Need to focus on app features, not infrastructure
- Budget-conscious (bootstrapped project)
- Privacy-critical (psychedelic integration = sensitive data)

---

## Decision

Use **Supabase** as the primary backend infrastructure:
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth (email/password)
- **Security**: Row Level Security (RLS) policies
- **API**: Auto-generated REST and Realtime APIs
- **Storage**: Supabase Storage (future use)

**Integration:**
- Client SDK: `@supabase/supabase-js` v2.55.0
- Direct database access from React Native app
- RLS ensures user data isolation

---

## Rationale

### Why Supabase:
1. **PostgreSQL Foundation**: Full-featured relational database
   - JSONB support for flexible schemas
   - Complex queries and joins
   - Full SQL power when needed

2. **Built-in Authentication**:
   - Email/password ready out-of-box
   - Social logins available (Google, Apple)
   - JWT-based, secure
   - Integrates seamlessly with RLS

3. **Row Level Security (RLS)**:
   - Database-level security (not just app-level)
   - User data automatically isolated
   - Critical for privacy-sensitive mental health app
   - Policies written in SQL (version controlled)

4. **Serverless & Scalable**:
   - No server management needed
   - Auto-scales with usage
   - Pay only for what we use
   - Can handle growth without architecture changes

5. **Developer Experience**:
   - Excellent documentation
   - Auto-generated API (no need to write endpoints)
   - Dashboard for data management
   - TypeScript support
   - Real-time subscriptions out-of-box

6. **Cost-Effective**:
   - Generous free tier for development
   - Affordable paid tiers ($25/month)
   - No upfront infrastructure costs
   - Includes auth, database, storage

### Why This Fits Our Needs:
- **Privacy-first**: RLS at database level
- **Solo-developer friendly**: Minimal backend code
- **Fast development**: No API layer to build
- **Production-ready**: Battle-tested by thousands of apps
- **Open source**: Can self-host if needed (future option)

---

## Consequences

### Positive ✅
- Zero backend code to maintain (no Express/Fastify server)
- Built-in auth system saved weeks of development
- RLS provides strong security guarantees
- Real-time capabilities for future features (live sessions)
- Can write complex SQL queries when needed
- Excellent documentation and community
- Dashboard makes data debugging easy
- Automated backups included

### Negative ⚠️
- **Vendor lock-in**: Migration to self-hosted PostgreSQL possible but work
- **RLS complexity**: Initially disabled (BUG-004), learning curve
- **API latency**: Extra network hop vs. local database
- **Limited backend logic**: No server-side code execution (Functions exist but separate)
- **Query limitations**: Some complex operations need database functions
- **Cost at scale**: Can get expensive with high usage

### Neutral ℹ️
- Need to learn Supabase-specific patterns (RLS policies, triggers)
- Dashboard access requires internet (can't work fully offline on backend)
- Updates/migrations need SQL knowledge
- TypeScript types need regeneration after schema changes

---

## Alternatives Considered

### Option 1: Firebase (Google)
**Pros**: Real-time by default, huge ecosystem, scales infinitely
**Cons**: NoSQL (harder for complex queries), expensive at scale, vendor lock-in, less SQL-friendly
**Why not chosen**: Need relational data model for journal entries/sessions; PostgreSQL more flexible

### Option 2: Self-Hosted PostgreSQL + Express API
**Pros**: Full control, no vendor lock-in, can optimize everything
**Cons**: Significant DevOps overhead, need to build auth, more to maintain, slower development
**Why not chosen**: Solo dev can't maintain infrastructure; want to focus on app features

### Option 3: AWS Amplify
**Pros**: AWS ecosystem, powerful, scalable
**Cons**: Complex setup, steep learning curve, DynamoDB not ideal for relational data
**Why not chosen**: Too complex for solo dev; prefer PostgreSQL

### Option 4: Hasura + PostgreSQL
**Pros**: GraphQL API, powerful real-time, open source
**Cons**: Need to host PostgreSQL separately, GraphQL overkill for our needs, more complex
**Why not chosen**: Supabase simpler for REST use case; don't need GraphQL

### Option 5: PlanetScale (MySQL-based)
**Pros**: Great branching model, generous free tier
**Cons**: MySQL not PostgreSQL (less features), no built-in auth, REST API not included
**Why not chosen**: Need PostgreSQL features (JSONB); Supabase more complete solution

### Option 6: MongoDB Atlas
**Pros**: Flexible schema, great for rapid prototyping
**Cons**: NoSQL model awkward for relational data (users → sessions → entries), no RLS
**Why not chosen**: Relational data model better fit; want ACID guarantees

---

## Implementation Notes

### Database Schema:
- 30+ tables for different features
- Heavy use of foreign keys and joins
- JSONB columns for flexible metadata
- Indexes on frequently queried fields

### Authentication Flow:
```javascript
// Login
const { user, session } = await supabase.auth.signInWithPassword({
  email, password
})

// Auto-refresh handled by SDK
// JWT included in all database requests
```

### RLS Policies:
```sql
-- Example: Users can only see their own journal entries
CREATE POLICY "Users can view own entries"
  ON journal_entries FOR SELECT
  USING (auth.uid() = user_id);
```

### Database Migrations:
- SQL files in `database/` directory
- Run manually via Supabase dashboard or CLI
- Version controlled with code

### Best Practices:
- Always enable RLS on new tables
- Test RLS policies thoroughly
- Use database functions for complex logic
- Batch operations when possible to reduce API calls
- Use Supabase local development for testing

---

## Security Incident (2026-02-07)

**Issue:** RLS was initially disabled on several tables (BUG-004)
**Impact:** All user data potentially accessible to any authenticated user
**Resolution:**
- ✅ Enabled RLS on all 30 tables
- ✅ Added proper policies for each table
- ✅ Verified all tables protected
- ✅ Documented in SECURITY_INCIDENT_2026-02-07.md

**Lesson:** RLS must be default-on from start; easy to forget during rapid prototyping.

---

## Migration Path (Future)

If we need to migrate away from Supabase:
1. **Self-hosted Supabase**: Use Docker, same API
2. **Plain PostgreSQL**: Migrate schema, implement auth separately
3. **Hasura**: Similar GraphQL-based approach
4. **Custom backend**: Build Express/Fastify API

**When to consider migration:**
- Cost becomes prohibitive (>$200/month)
- Need features Supabase doesn't provide
- Want full infrastructure control
- Team grows to support backend developers

**Migration difficulty:** Medium (database is PostgreSQL, but need to replace auth/API layer)

---

## References

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Docs](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- Project: `lib/supabase.js` for initialization
- Security Incident: `SECURITY_INCIDENT_2026-02-07.md`

---

## Review

**Works Well:**
- ✅ Zero backend maintenance overhead
- ✅ Authentication "just works"
- ✅ RLS provides strong security (when enabled!)
- ✅ Dashboard great for debugging
- ✅ Real-time updates work seamlessly
- ✅ Cost is affordable ($25/month currently)

**Challenges:**
- ⚠️ RLS was disabled initially (security risk)
- ⚠️ Learning curve for RLS policies
- ⚠️ Some queries need optimization (N+1 issues)
- ⚠️ Need to regenerate TypeScript types after schema changes

**Would Choose Again:** ✅ Yes
For a solo developer building a privacy-sensitive app, Supabase is ideal. The built-in features (auth, RLS, real-time) save months of development time.

**Key Improvement:** Enable RLS by default on all tables from day 1.

**Next Review:** 2026-06-01 (after 6 months of production use)

---

**Status:** Accepted and Validated
**Production Since:** 2025-10 (estimate)
**Current Usage:** 30+ tables, ~1000s of rows, RLS enabled on all tables
