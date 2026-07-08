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

## 3. Per-stage timing in the search response (automatic once deployed)

`handleSearch` now returns `timing: { authMs, authPath, embedMs, embedCacheHit,
rpcMs }` in the JSON response, so a **device turn shows the real auth/embed/rpc
split directly** without reading Supabase edge logs. The client surfaces it:
- `lib/ragService.js` stashes it on `ragService.lastServerTiming` (+ `clientMs`).
- `lib/huxleyService.js` appends it to the PERF line:
  `[Huxley PERF] … rag=NNNms [auth=NN(local) embed=NNM rpc=NN net=NN] …`
  (`net` = client wall-time − the three server stages = TLS/transfer.)

The split only appears on a **live** search — a RAG client-cache hit, timeout, or
empty-query turn shows `rag=…` with no bracket (reset to null each turn).

## 4. Local JWT verification — the auth-hop removal (opt-in via a secret)

Option A from `handoffs/rag-speed-and-quality.md`. The search RPC runs on the
service-role client (bypasses RLS), so token validation is the **only** auth gate.
It was a ~1s network `auth.getUser()` call. This project signs access tokens with
**HS256** (the anon key JWT header is `{alg:'HS256'}`), so the function now verifies
the signature **locally** with the project JWT secret (`verifyJwtLocal`, <1ms,
Web Crypto HMAC) — checking signature, `exp`, and `role === 'authenticated'`.

**Engaging it requires setting a secret.** The name is `RAG_JWT_SECRET` — NOT
`SUPABASE_JWT_SECRET`: the Supabase CLI refuses to set any secret starting with
`SUPABASE_` (that prefix is reserved for platform-injected vars). Until the secret
is set, the function **safely falls back to the network `getUser()` path** — never
runs unauthenticated.

The value is the project's **legacy JWT secret**: Dashboard → Settings → JWT Keys →
**"Legacy JWT Secret"** tab (this project still uses the legacy secret; do NOT click
"Migrate JWT secret" — that switches to asymmetric signing keys, which are not
HS256 and would need a different verify path). Then:
```
npx supabase secrets set RAG_JWT_SECRET=<legacy JWT secret>
npx supabase functions deploy embeddings
```
Confirm which path ran on-device via the PERF split: `auth=NN(local)` = fast path
engaged; `auth=NN(network)` = secret not set, still on the old hop.

**Risk (why this is the higher-risk item):** local verify trusts a token until it
**expires** (~1h) — a user signed out / disabled server-side still passes until
`exp`. Acceptable here because the endpoint returns only published clinical corpus
(no user data). If real-time revocation ever matters, unset `RAG_JWT_SECRET`
to revert to `getUser()` with no code change.

## After deploying + scheduling — re-measure, then drop the timeout

1. Run a multi-turn IFS session on device. Watch `[Huxley PERF] rag=` and the
   `[embeddings] … cache HIT/MISS` function logs.
2. Confirm: warm turns land well under 800ms, and the **first** turn no longer
   spikes to ~1.5–2.9s (warm-ping working).
3. Only THEN drop `RAG_TIMEOUT_MS` 2000 → 800 in `lib/huxleyService.js`.
   Dropping it before the warm-ping is live would make cold first-turns always
   time out (they'd exceed 800ms), so this step is gated on step 2.
