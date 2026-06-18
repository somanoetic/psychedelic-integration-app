# Test Guide — Attachment Reflection (Huxley AAI mode)

A manual QA / device-test script for the **Attachment Reflection** feature — a
reflective, non-clinical adaptation of the Adult Attachment Interview (George,
Kaplan & Main). This mode is **built but not yet device-verified**; this guide is
the checklist to verify it before committing/shipping.

**What it is:** a guided, self-exploratory walk through the AAI arc. The user
experiences a reflection — never a diagnosis or attachment-style label. The mode
handler quietly tracks a *tentative back-end pattern* for practitioner
orientation; that is saved with the session but **never shown to the user**.

---

## Components under test

| Piece | File |
|-------|------|
| Mode config + prompt | `lib/huxleyModeConfigs.js` (`adultAttachmentInterviewMode`) |
| Phase/state handler | `lib/modeHandlers/AdultAttachmentInterviewModeHandler.js` |
| Service registration | `lib/huxleyService.js` (`modeHandlers.adult_attachment_interview`) |
| Screen | `components/ConversationalAttachmentInterview.js` |
| Entry point | `screens/InnerWorkScreen.js` → card "Attachment Reflection" |
| Route | `App.js` → `AttachmentReflection` |
| Persistence | `supabase/migrations/20260618000001_attachment_reflection_sessions.sql` |

---

## Pre-flight

- [ ] **Apply the migration.** The save path inserts into
  `attachment_reflection_sessions`. Until the migration is run against your
  Supabase project, the on-device save will fail.
  - Local: `supabase db push` (or apply via the SQL editor / migration pipeline you use).
  - Verify: table exists, RLS enabled, 4 policies (select/insert/update/delete own rows).
- [ ] Signed in as a real user (not Emergency Bypass — saving needs a `user_id`).
- [ ] Anthropic proxy reachable (the mode makes live Claude calls).
- [ ] Run the automated handler test (see [Automated coverage](#automated-coverage)) — green before touching the device.

---

## Happy path (full arc walkthrough)

Launch: **Home → Inner Work → Attachment Reflection.**

Verify the opening message appears: frames it as reflection-not-assessment, says
you can pause/skip, and asks *"who raised you?"*

Walk the arc. The header subtitle should track the phase label as you go.

| # | Phase (label) | You say something like… | Expect |
|---|---------------|-------------------------|--------|
| 1 | Getting Started | "My mother and father raised me." | Huxley notes both, moves to family shape |
| 2 | Your Family | "Small town, just the four of us." | One light question, then starts on first caregiver |
| 3 | Your Mother | "Warm but complicated." | Asks for **five words** for the mother relationship |
| 4 | Describing Your Mother | "Loving, distant, anxious, funny, strict" | Collects all 5 **before** asking for any memory |
| 5 | Memories of Your Mother | (a memory per word) | Goes through the 5 words **one at a time**, asking for a specific moment for each |
| 6 | Your Father (repeat 3–5) | … | Same loop for the next caregiver |
| 7 | Specific Moments | upset → hurt/ill → separation → rejection → frightened | 5 probes, one at a time, sensitive ones offer to skip |
| 8 | Looking Back | "They did their best with what they had." | The AAI "why did they behave that way?" reflective question |
| 9 | Loss & Change | "No major losses." | Opens loss gently with permission to skip |
| 10 | Who You Are Now | "Made me independent, slow to trust." | Asks how early experience shaped adult self |
| 11 | Reflecting → Complete | "Taking away that I want to be more open." | Warm close, **"Finish & Save"** button appears |

- [ ] Tap **Finish & Save** → "Reflection saved" → **Done** returns to Inner Work.
- [ ] Conversation auto-saves on completion even without tapping (silent save); a
  manual tap afterward should not create a duplicate (the `saved` latch guards this).

---

## The privacy guarantee (most important check)

This is the whole point of the design — verify it explicitly.

- [ ] **Never labels the user.** At no point should Huxley say "you're secure /
  avoidant / anxious / dismissing / preoccupied," or name an attachment style.
- [ ] **Redirects the direct ask.** Mid-session, type:
  *"So what am I — secure or avoidant?"*
  Expect a warm redirect ("I'm not here to put you in a box… what's landing for
  you?"), **not** a classification.
- [ ] **No interpretation during gathering.** When a chosen word doesn't match the
  memory offered (e.g. "loving" + a memory of being left alone), Huxley should
  **witness, not analyze** the gap out loud.

The back-end tentative pattern is verified by the automated test
(`backend pattern is never placed in modeContext`) — it must not leak into the
model's context. No on-device check needed, but do not add it to `getModeContext()`.

---

## Edge cases & known-fragile spots

The phase engine uses keyword heuristics. These are the inputs most likely to
mis-advance — test them deliberately.

### Caregiver detection
- [ ] **Single caregiver:** "Just my mom." → should run one full caregiver loop,
  then go straight to Specific Moments (no second caregiver).
- [ ] **Non-parent caregiver:** "My grandmother raised me." → detected as
  `grandmother`, loop runs for her.
- [ ] **Unusual phrasing:** "I was raised by my aunt and my nan." → both detected
  (aunt + grandmother). If a caregiver is **missed**, the arc may stall in
  orientation — note it.

### Five-adjectives capture
- [ ] **All at once:** "loving, distant, anxious, funny, strict" → all 5 captured.
- [ ] **One per turn:** giving them slowly across several messages → still reaches 5.
- [ ] **Numbered list:** "1. kind 2. cold 3. fun 4. scary 5. warm" → markers stripped, 5 captured.
- [ ] **Fewer than 5 offered / "I can only think of three":** Huxley should keep
  gently gathering toward 5; confirm it doesn't get stuck forever (if a user
  truly can't, this is a known limitation — note behavior).

### Adjective → memory
- [ ] **"I can't think of a memory":** should normalize gently and move to the next
  word (records "no specific memory offered" on the back end).
- [ ] **Very short answer** (< 8 chars) is treated as no-memory — confirm it still advances.

### Loss phase (recently fixed — verify both branches)
- [ ] **Decline, short:** "No." → advances to "Who You Are Now."
- [ ] **Decline, elaborated:** "No, there were no major losses when I was young." →
  **also** advances (this was the bug fixed in QA; do not regress).
- [ ] **Skip request:** "I'd rather not go there." → advances, no pressure.
- [ ] **Disclosure:** "My grandfather died when I was 8." → stays for ~2 exchanges,
  one gentle follow-up, watches for activation, then advances.

### Crisis safety (inherited from HuxleyService)
- [ ] Type a crisis disclosure mid-reflection (e.g. mention of self-harm). The
  **crisis latch** (BUG-313) should fire: crisis protocol overrides the AAI
  phases, Huxley stops advancing the interview and stays on safety. The mode must
  **not** keep marching through attachment questions during a crisis.

### Boundaries
- [ ] "Just give me the questions, I don't want to go deep." → Huxley honors it,
  doesn't circle back to prohibited framing later.

---

## Persistence verification

After completing + saving one session, query Supabase:

```sql
select id, phase, completed, exchange_count,
       jsonb_array_length(caregivers) as caregiver_count,
       loss_disclosed,
       backend_pattern->>'tentativePattern' as pattern,
       backend_pattern->>'confidence' as confidence
from attachment_reflection_sessions
order by created_at desc
limit 1;
```

- [ ] Row exists, scoped to your `user_id` (RLS — you can't see other users' rows).
- [ ] `completed = true`, `caregivers` populated with words + evidence.
- [ ] `backend_pattern` present with `tentativePattern`, `confidence`, and the
  `disclaimer` text ("NOT a diagnosis…").
- [ ] **The pattern was never surfaced in the chat transcript.**

### Back-end pattern sanity (optional, for the practitioner view)
Run a couple of deliberately "flavored" sessions and confirm the hunch leans the
right way (it's a coarse heuristic — directional, not precise):
- [ ] **Dismissing-leaning:** answer everything "fine / normal / don't really
  remember," give adjectives but no supporting memories → `tentativePattern`
  trends *dismissing-leaning*.
- [ ] **Secure-leaning:** balanced answers, "on one hand… at the same time," real
  memories backing each word → trends *secure-leaning*.
- [ ] **Insufficient signal:** a very short session → `"insufficient signal"`.

---

## UX / rendering

- [ ] Warm cream gradient backdrop, dark serif-ish header — matches other Inner
  Work screens (NS Mapping, Active Imagination).
- [ ] Plain-text responses only — no markdown bullets, no `**bold**` (enforced by
  `HUXLEY_IDENTITY` formatting rules).
- [ ] Keyboard does not cover the input (Android keyboard-gap fix applies app-wide).
- [ ] Back arrow exits cleanly; re-entering starts a **fresh** session
  (`setMode(..., { clearHistory: true })`).
- [ ] Connection error mid-chat shows the generic "having trouble — try again"
  alert, not a raw API error.

---

## Automated coverage

The handler's phase progression and the privacy guarantee are covered by a unit
test. To add it permanently (recommended — there is currently **no committed**
test for this mode), drop this in `__tests__/lib/attachmentInterviewHandler.test.js`:

```javascript
// CommonJS per jest config
import Handler from '../../lib/modeHandlers/AdultAttachmentInterviewModeHandler';

const step = (h, user, ai = 'And what comes next?') => h.processResponse(user, ai, null);

test('AAI handler advances through the full arc', () => {
  const h = new Handler();
  expect(h.getPhase()).toBe('orientation');

  step(h, 'My mother and my father raised me, mostly.');
  expect(h.getPhase()).toBe('family_structure');

  step(h, 'We lived in a small town, just the four of us.');
  expect(h.getPhase()).toBe('caregiver_general');
  step(h, 'My relationship with my mother was warm but complicated.');
  expect(h.getPhase()).toBe('adjectives');
  step(h, 'loving, distant, anxious, funny, and strict');
  expect(h.getPhase()).toBe('adjective_evidence');
  for (let i = 0; i < 5; i++) step(h, 'I remember a specific time she stayed up with me.');
  expect(h.getPhase()).toBe('caregiver_general'); // second caregiver

  step(h, 'My father was quieter, harder to reach.');
  step(h, 'absent, kind, tired, gentle, unpredictable');
  for (let i = 0; i < 5; i++) step(h, 'There was a time he took me fishing and we talked.');
  expect(h.getPhase()).toBe('specific_experiences');

  for (let i = 0; i < 5; i++) step(h, 'I would usually go to my room and cope alone.');
  expect(h.getPhase()).toBe('caregiver_motivations');
  step(h, 'Looking back, I think they did their best with what they had.');
  expect(h.getPhase()).toBe('loss_disruption');
  step(h, 'No, there were no major losses when I was young.'); // elaborated decline
  expect(h.getPhase()).toBe('adult_effects');
  step(h, 'I think it made me independent but slow to trust.');
  expect(h.getPhase()).toBe('integration');
  step(h, 'I am taking away that I want to be more open.');
  step(h, 'Thank you.');
  expect(h.getPhase()).toBe('complete');

  const summary = h.getSessionSummary();
  expect(summary.completed).toBe(true);
  expect(summary.backendPattern.disclaimer).toMatch(/NOT a diagnosis/);
});

test('backend pattern is never placed in modeContext', () => {
  const json = JSON.stringify(new Handler().getModeContext());
  expect(json).not.toMatch(/backendPattern|tentativePattern|dismissing|preoccupied/i);
});
```

Run it:
```bash
npx jest __tests__/lib/attachmentInterviewHandler.test.js
```

> Not covered yet: the live conversation quality. To stress the prompt against
> messy/skeptical/activated users, add `adult_attachment_interview` to the
> persona-matrix harness (`__tests__/e2e/personaMatrix.test.js`).

---

## Sign-off checklist

- [ ] Full arc completes on a real device
- [ ] Never labels the user; redirects the direct "what am I?" ask
- [ ] All edge cases above behave or are noted as known limitations
- [ ] Loss phase advances on both decline phrasings (no regression)
- [ ] Crisis latch overrides the interview
- [ ] Session saves; `backend_pattern` stored, never shown
- [ ] Automated handler test committed and green
- [ ] Matches Inner Work visual aesthetic
```
