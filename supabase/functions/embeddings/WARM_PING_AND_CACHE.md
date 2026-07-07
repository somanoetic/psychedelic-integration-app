# embeddings edge function — query cache + warm-ping (RAG speed)

Two speed changes landed in `index.ts` (Task A of `handoffs/rag-speed-and-quality.md`).
Both need a **deploy**, and the warm-ping needs a **scheduler** wired up to take effect.

## 1. Per-instance query-embedding cache (automatic once deployed)

`handleSearch` now caches `query → embedding` in an in-memory Map (`embedCache`,
max 500 entries, LRU-ish) on each warm function instance. Identical search queries
(short openers, repeated follow-ups) skip the ~330ms OpenAI embedding call.

- No config. Works the moment the function is deployed.
- Cache is per warm instance; a cold start starts empty and repopulates.
- Only the `search` action uses it. `embed`/`ingest` bypass it (unique bulk text).
- Verify from function logs: `[embeddings] search embed=…ms (cache HIT|MISS) rpc=…ms`.
  On a repeat query you should see `embed≈0ms (cache HIT)`.

## 2. Warm-ping endpoint (needs a scheduler)

A cold instance costs 0.7–1.4s of cold-start — that spike is what blew the
2000ms RAG timeout on the first turn of a session. The function answers a cheap
no-op **before** any secret/OpenAI/DB work and before its own `getUser()` hop:

- `GET` to the function URL, **or** any request with header `x-warm-ping: 1`
- Returns `{ ok: true, warm: true }` instantly.

**The ping still needs the anon key.** Supabase's platform gateway enforces
`verify_jwt` on this function and returns 401 for a request with **no**
Authorization header *before* our handler runs (verified against the deployed
function: no header → `401 UNAUTHORIZED_NO_AUTH_HEADER`; anon key → `200 warm`).
So the pinger must send the project **anon key** (a public client key that
already ships in the app bundle) as `apikey` + `Authorization: Bearer`. It does
NOT need a real user session — the search-path `getUser()` is skipped for pings.

Pinging every ~5 min keeps ≥1 instance hot. Pick ONE mechanism:

### Option A — external pinger / GitHub Actions (simplest, no DB deps) ← chosen
The committed workflow `.github/workflows/embeddings-warm-ping.yml` does this on
a `*/5` schedule. It needs two repo **variables** (non-secret) set under
Settings → Secrets and variables → Actions → Variables:
- `EMBEDDINGS_FUNCTION_URL` = `https://<project-ref>.supabase.co/functions/v1/embeddings`
- `SUPABASE_ANON_KEY` = the project's public anon key

Equivalent raw call (any cron/uptime service works too):
```
curl -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <ANON_KEY>" \
     -H 'x-warm-ping: 1' https://<project-ref>.supabase.co/functions/v1/embeddings
```

Whichever you use, the anon-key auth above is required either way.

### Option B — in-DB pg_cron + pg_net (keeps it in Supabase)
Requires enabling both extensions (not currently used anywhere in this project —
this would be the first pg_net dependency, so weigh that). Sketch:
```sql
-- one-time
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- every 5 minutes, fire a GET at the function (anon key required — see above)
select cron.schedule(
  'embeddings-warm-ping',
  '*/5 * * * *',
  $$ select net.http_get(
       'https://<project-ref>.supabase.co/functions/v1/embeddings',
       headers := jsonb_build_object(
         'apikey', '<ANON_KEY>',
         'Authorization', 'Bearer <ANON_KEY>'
       )
     ) $$
);
```
If you go this route, add it as a real migration
(`supabase/migrations/YYYYMMDD_embeddings_warm_ping.sql`) rather than running it
ad-hoc, so it's reproducible.

**Recommendation:** Option A. It's zero new DB surface, trivially reversible, and
the warm-ping is pure ops — it doesn't belong in the data schema.

## Deploy

The embed-cache + warm-ping code is **already deployed** (verified: a `GET` with
the anon key returns `{"ok":true,"warm":true}` from production). Redeploy only to
pick up the comment/doc corrections in this pass (no behavior change):

```
supabase functions deploy embeddings
```
(No new secrets required. The Supabase CLI isn't installed in this workspace, so
run this from a machine that has it / is linked to the project.)

## After deploying + scheduling — re-measure, then drop the timeout

1. Run a multi-turn IFS session on device. Watch `[Huxley PERF] rag=` and the
   `[embeddings] … cache HIT/MISS` function logs.
2. Confirm: warm turns land well under 800ms, and the **first** turn no longer
   spikes to ~1.5–2.9s (warm-ping working).
3. Only THEN drop `RAG_TIMEOUT_MS` 2000 → 800 in `lib/huxleyService.js`.
   Dropping it before the warm-ping is live would make cold first-turns always
   time out (they'd exceed 800ms), so this step is gated on step 2.
