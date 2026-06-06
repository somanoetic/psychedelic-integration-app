# Guided Exercise Narration — Plan

**Status:** v1 implemented 2026-06-02 (replaces Phase 2 voice-conversation work, paused 2026-06-02). Not yet device-verified.
**Owner:** TBD
**Estimated effort:** ~1-2 days for v1 (depending on scope of step-by-step pacing)

## v1 resolution (2026-06-02)

Open questions resolved with user, all matching the doc's leans:
1. **Default OFF** — user opts in via header toggle (Volume2/VolumeX icon, accent color when on).
2. **Tap Next while speaking → stop & speak N+1** — relies on `speak()` calling `stopSpeaking()` internally.
3. **Steps only, from step 0** — no instructions-card narration, no step titles.

Built in [GuidedExerciseScreen](../../screens/GuidedExerciseScreen.js): `voiceOn`/`isSpeaking` state,
narration `useEffect` keyed on `currentStep`/`voiceOn`, `useFocusEffect`-on-blur cleanup, header toggle,
and a "Speaking…" indicator under the step text. Auto-advance (v1.5) and opening-instructions narration NOT built.

## What this is

Add a voice-narration toggle to the existing [GuidedExerciseScreen](screens/GuidedExerciseScreen.js) so the user can have Huxley **read each step aloud** instead of (or alongside) reading it themselves. Eyes-closed friendly. No mic, no VAD, no transcription — pure one-way TTS that reuses the proven [voiceService.speak()](lib/voiceService.js) plumbing.

## Why this is the right scope

Voice conversation (Phase 2) failed the "talking to a guide IRL" bar because turn-based STT can't deliver the conversational rhythm therapeutic work requires. Narration sidesteps every one of those problems:

- One-way audio — no mic, no VAD, no calibration, no echo cancellation
- Matches the long history of guided meditation/somatic audio (users know what to do with it)
- Eyes-closed ergonomic match — exactly the moment a screen-reading interaction breaks down
- Reuses the half of voice that already works perfectly: ElevenLabs TTS via the existing edge function

## What already exists (we don't need to build)

- **Exercise content** — [content/exercises-comprehensive.js](content/exercises-comprehensive.js) already has every exercise as `{ id, title, steps[], duration, instructions, ... }`. The `steps` array is the narration script. No new scripts to write.
- **Guided playback UI** — [screens/GuidedExerciseScreen.js](screens/GuidedExerciseScreen.js) already walks the user step-by-step with previous/next controls and a progress bar.
- **TTS pipeline** — [lib/voiceService.js](lib/voiceService.js) `speak()` works reliably. ElevenLabs edge function is deployed. Voice ID is configured.
- **Audio session handling** — `configureAudioMode({ forRecording: false })` already correctly routes audio through the device speaker.

## What needs to be built — minimum viable

### 1. Narration toggle on `GuidedExerciseScreen`

A simple voice on/off button in the header. State persists in the screen (or in a small `useNarrationSettings` hook if you want it remembered across sessions).

When toggled on:
- Each time `currentStep` changes (including the first `Begin Exercise` → step 0 transition), call `voiceService.speak(exercise.steps[currentStep])`
- Show a small "speaking" indicator (pulse or wave near the step text) while audio is playing

When toggled off mid-exercise:
- Immediately call `voiceService.stopSpeaking()`
- No further narration on subsequent steps

### 2. Auto-advance option (optional, v1.5)

Currently the user taps "Next" to advance steps. With narration on, an *optional* auto-advance:
- When TTS playback of step N finishes, wait `pauseBetweenStepsMs` (configurable, default ~2-3s), then advance to step N+1
- Toggle this as a sub-option of voice (so users can have narration without auto-advance)

This is the v1.5 feature because some steps benefit from holding ("Notice the sensation for a moment") and not all steps should auto-advance. Could be controlled per-exercise via a `pacingHints` field, but simplest start is: same `pauseBetweenStepsMs` for all steps.

### 3. Opening narration (instructions card)

When voice is on and the user taps "Begin Exercise," speak the `exercise.instructions` text first as a gentle introduction before stepping into step 0. Or — start directly with step 0 to avoid talking over the user's intention-setting. Pick one default; expose later if needed.

### 4. Cleanup on screen unmount / navigation away

Reuse the `useFocusEffect`-on-blur pattern we already wrote for the chat screen. When the user leaves the exercise mid-flow, stop any playback so audio doesn't continue when they're on another screen.

## What does NOT need to be built (yet)

- **Voice picker** — keep the existing `ELEVENLABS_VOICE_ID` secret. If users want choice later, that's a separate feature.
- **Background music / tones** — easy to add later as a layered audio track. Skip for v1.
- **Per-step pacing metadata** — start with a single pause-between-steps duration. If specific exercises feel rushed or sluggish, that's the feedback that says "this exercise needs custom timing."
- **Mic / response capture** — the whole point of this pivot. Not building this.

## Open questions

1. **Should narration be ON by default or OFF by default?** Argument for ON: it's a feature, surfacing it via "voice is enabled" tells users it exists. Argument for OFF: respects user agency, doesn't surprise them with audio. I lean OFF-by-default with a prominent toggle.
2. **Speak the step title in addition to body, or just the body?** Step bodies are usually self-contained. Titles are mostly navigational ("Step 3 of 7"). I'd skip titles.
3. **What happens if the user taps "Next" while TTS is still speaking step N?** Two options: (a) `stopSpeaking()` and immediately start speaking N+1, or (b) ignore the tap until audio finishes. (a) respects user agency, (b) prevents accidental skips. I lean (a).

## Implementation sketch

Roughly the GuidedExerciseScreen changes look like:

```js
const [voiceOn, setVoiceOn] = useState(false);

useEffect(() => {
  if (!voiceOn) return;
  if (currentStep < 0 || currentStep >= totalSteps) return;
  voiceService.speak(exercise.steps[currentStep]).catch(noop);
}, [currentStep, voiceOn]);

useFocusEffect(useCallback(() => {
  return () => { voiceService.stopSpeaking().catch(noop); };
}, []));
```

Plus a header toggle button and a small "speaking" pulse near the step text. That's the v1.

## Acceptance criteria

- Toggle voice on, tap "Begin Exercise" → Huxley speaks step 0 within ~500ms
- Tap "Next" → playback of current step stops, step N+1 begins speaking
- Tap "Previous" → same behavior backward
- Toggle voice off mid-step → playback stops immediately, no further narration
- Navigate away → no orphaned playback continues on the next screen
- All 13 exercise categories (breathing, grounding, somatic, polyvagal, partsWork, etc.) work with the same toggle (they all share the same data shape)

## Related

- [voice-conversation-phase1.md](voice-conversation-phase1.md) — the conversational voice work that this replaces. The `voiceService.speak()` + edge function plumbing built there is reused entirely.
