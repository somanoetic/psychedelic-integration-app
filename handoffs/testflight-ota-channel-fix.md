# TestFlight OTA channel mismatch (FIXED, device-verified) + master merge (PUSHED)

Status: **DONE. Channel repoint applied server-side and device-verified by user.
Branch merged to `master` and pushed to `origin` (`a4a82ff`). Working tree clean.**

Resume line: **Read handoffs/testflight-ota-channel-fix.md and continue.**

## 1. The bug: TestFlight was receiving zero OTAs, silently

Started as "what's the status of the version on TestFlight?" — turned into a real
find.

**Root cause:** channel→branch indirection was mismatched.

- iOS builds are cut with the **`preview` profile** (`eas.json`) → `channel: preview`.
- Every recent OTA was published with `eas update --branch **production**`.
- The `preview` channel pointed at the stale `preview` branch: runtime `1.0.0`,
  SDK 53, old bundle ID `com.anonymous.psychedelicintegrationapp`, last updated
  9 months prior.

Build 7 is runtime `1.2.0`. The only update on its channel was runtime `1.0.0`,
so **every update was filtered out as a runtime mismatch — which is a silent
no-op, not an error.** Nothing in `eas build:list`, `app.config.js`, or any log
surfaces this. The build looks perfectly healthy while ignoring everything you
publish.

**Fix (no rebuild, no Apple review):**

```
eas channel:edit preview --branch production
```

Verified with `eas channel:view preview` — now resolves to branch `production` @
runtime `1.2.0`, matching build 7. **User confirmed on device**: FAB radial menu
now shows the dark scrim backdrop (`cddc102`), which was the only user-visible
delta between build 7's embedded bundle and the current production OTA.

### TestFlight state as of this session
- Build **`489fad5a`**, appVersion `1.2.0`, buildNumber **7**, SDK 54, `FINISHED`
  Jul 27, `distribution: store`, `buildProfile: preview`.
- Built from commit `8f0616a` — which was HEAD at session start. **Zero unbuilt
  app code.**
- Build 7 was built twice (Jul 26 `859a06c0`, Jul 27 `489fad5a`) with an
  **identical fingerprint hash** — same content, either is equivalent.
- Current OTA on production branch: `cddc102` FAB scrim, on top of a
  roll-back-to-embedded that cleared the mojibake OTA.
- **IPA artifact expires Aug 26, 2026** (EAS 30-day artifact retention; the
  TestFlight 90-day tester window is separate and runs from upload).

### Why no rebuild was needed
`8f0616a` was both build 7's source commit AND HEAD. A rebuild would have shipped
byte-identical app code. Decision: repoint only. See "What's next" for when a
rebuild does become necessary.

## 2. Merge to master (pushed)

`feat/neurobiology-of-connection` was 46 commits ahead of the **stale local**
`master`. After `git fetch`, the real picture: `origin/master` had moved — **PR #1
had already merged an earlier state of this branch** — leaving 23 branch commits
outstanding and 1 merge commit (`c0f3f5e`) inbound.

`c0f3f5e` was NOT an ancestor of the branch, so fast-forward was impossible.
Resolution: merged `master` INTO the feature branch first (clean, no conflicts),
then fast-forwarded `master` and pushed.

- `origin/master`: `c0f3f5e` → **`a4a82ff`** (+25 commits)
- Local `master` and `feat/neurobiology-of-connection` are identical; tree clean.
- User chose direct push over a PR (PR #1 was the prior pattern).

### ⚠️ Incident during the merge — recovered, nothing lost
Ran `git checkout master && git reset --hard origin/master` as a chained command.
The **checkout aborted** (uncommitted `.claude/settings.json`) but the **`reset
--hard` still executed** — on the feature branch, moving it to `origin/master` and
dropping 23 commits from its tip.

Recovered immediately via `git reset --hard fd865e9` from reflog. Verified the
restored tree hash matched the pre-reset commit **exactly** (`248ad9c9…`) and all
24 commits were present before continuing. The pushed result is correct.

**Lesson: never chain a destructive `reset --hard` after a `checkout` without
confirming the checkout succeeded.** `&&` does not protect you here — the abort
and the reset are separate commands.

### `.claude/settings.json` churn
The permission allowlist auto-appended entries **three separate times** mid-merge
(eas commands, then `git checkout *`/`git merge *`, then branch/reset commands),
which is what blocked the checkouts. All committed. Expect this file to keep
moving whenever new command shapes are approved.

## Current state

- Branch: `master` (and `feat/neurobiology-of-connection`, identical) @ `a4a82ff`
- Working tree: **clean**, synced with `origin/master`
- `app.config.js`: `version: "1.2.0"`, iOS `buildNumber: "7"`, iOS
  `runtimeVersion: { policy: "appVersion" }`, Android `runtimeVersion: "1.2.0"`
- No native changes this session → **no rebuild required**

## What's next

1. **Delete the merged branch** (optional, not done):
   `git push origin --delete feat/neurobiology-of-connection` + local `-d`.
2. **Shipping JS/asset changes from here:** `eas update --branch production` —
   now reaches BOTH channels.
3. **Rebuild is required only for:** native changes (modules, permission strings,
   icon/splash, native `app.config.js` fields), an Expo SDK bump, or a `version`
   bump. Everything else goes OTA.
4. **⚠️ `version` bump gotcha:** iOS `runtimeVersion` uses `policy: appVersion`,
   so it tracks `version` (`1.2.0`), NOT `buildNumber`. Bumping to `1.3.0`
   **orphans existing installs from new OTAs** until a fresh binary ships. Bump
   `buildNumber` alone for OTA-compatible builds.
5. **Cleanup to fold into the next real build:** cut it with
   `eas build -p ios --profile production` so profile, channel, and branch all
   agree and the channel indirection stops being load-bearing. Not urgent — the
   repoint holds.
6. **After ANY future iOS build:** sanity-check `eas channel:view <channel>` and
   confirm its Runtime Version matches the build's `runtimeVersion`. This failure
   mode is invisible otherwise.

## Where things live

- Build profiles / channel definitions: `eas.json`
- Version, buildNumber, runtimeVersion policy, bundle IDs: `app.config.js`
- Permission allowlist (churns often): `.claude/settings.json`
- FAB scrim change that served as the device-verification tell: commit `cddc102`
- Prior related handoff: `handoffs/rag-query-expansion.md` (the perf work that
  makes up much of the merged 25 commits)
