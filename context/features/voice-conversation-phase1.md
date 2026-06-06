# Voice Conversation with Huxley — Phase 1 + 2

**Status:** Phase 1 (plumbing) + Phase 2 (chat-screen integration + full voice loop) complete. Awaiting first real-device test.
**Started:** 2026-05-15
**Phase 2 completed:** 2026-05-15
**Decision context:** STT → Claude → TTS turn-based pipeline. Voice toggle inside existing Huxley chat (not a separate screen). Phase 2 uses tap-to-interrupt; true barge-in deferred to Phase 3.

## What's done in Phase 1

| Piece | File |
|---|---|
| `expo-audio` installed, mic permissions declared | [app.config.js](../../app.config.js), [app.json](../../app.json) |
| Client voice helpers (transcribe + speak) | [lib/voiceService.js](../../lib/voiceService.js) |
| Whisper STT edge function | [supabase/functions/whisper-transcribe/index.ts](../../supabase/functions/whisper-transcribe/index.ts) |
| ElevenLabs TTS edge function | [supabase/functions/elevenlabs-tts/index.ts](../../supabase/functions/elevenlabs-tts/index.ts) |

Both edge functions mirror the auth/rate-limit/usage-logging pattern of [claude-proxy](../../supabase/functions/claude-proxy/index.ts).

## Required Supabase secrets

Before the edge functions will work, set these via `supabase secrets set`:

```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set ELEVENLABS_API_KEY=...
supabase secrets set ELEVENLABS_VOICE_ID=<picked-from-elevenlabs-library>
```

`ELEVENLABS_VOICE_ID` is the default Huxley voice — recommended starting point is one of ElevenLabs' "warm, calm" presets (e.g. "Charlotte", "Adam", or a custom clone). You can override per-request from the client if you ever want user voice choice (see [feedback_design_not_dark_theme.md] memory for brand voice direction).

## Required rate-limit / usage-log services

Both functions write to existing tables `user_rate_limits` and `api_usage_logs` with new `service` values:

- `whisper_api`
- `elevenlabs_tts`

No schema changes needed — both are `text` columns. The existing usage summary view will pick them up automatically.

## Deploy

```bash
supabase functions deploy whisper-transcribe
supabase functions deploy elevenlabs-tts
```

## Native rebuild required

`expo-audio` adds native code (mic permission, native recorder). A JS-only OTA update won't pick this up — you need a new **EAS dev-client build** before voice will work on device:

```bash
eas build --profile development --platform ios
# or
eas build --profile development --platform android
```

## Smoke test (after Phase 2 wires the UI)

1. Open Huxley chat in the new dev-client build, tap voice toggle.
2. Grant mic permission on first prompt.
3. Speak: "Huxley, can you hear me?" → see your transcribed text appear as a user bubble.
4. Hear Huxley's response read aloud through the device speaker.
5. Check Supabase → Edge Functions → logs for `whisper-transcribe` and `elevenlabs-tts` invocations.
6. Check `api_usage_logs` table for two new rows per turn (one whisper, one elevenlabs).

## Manual edge-function smoke test (no app needed)

If you want to verify the edge functions before wiring the UI:

```bash
# Get a JWT from any signed-in user session, then:
curl -X POST "$SUPABASE_URL/functions/v1/elevenlabs-tts" \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, this is Huxley."}' \
  | jq -r '.audio_base64' | base64 -d > test.mp3 && open test.mp3
```

## Phase 2 — done

- Voice toggle button added to chat header ([HuxleyChatScreen.js](../../components/HuxleyChatScreen.js))
- New [HuxleyVoiceController.js](../../components/HuxleyVoiceController.js) owns the voice state machine: `idle → listening → transcribing → thinking → speaking → idle`
- `useAudioRecorder` with metering enabled (`isMeteringEnabled: true`) for VAD
- VAD silence detection: polls `metering` every 100ms; stops on -40 dB sustained for 1.5s
- Voice mode auto-opens mic with 1s grace beat (revisit per [project_voice_phase2_decisions](../../../.claude/projects/c--Users-hadfi-psychedelic-integration-app/memory/project_voice_phase2_decisions.md))
- Empty transcripts silently re-open mic (provisional — revisit on real-device test)
- Tap anywhere overlay → interrupts Huxley while speaking, or submits early while listening
- `ROUTE: directive` stripped before TTS via `sanitizeForTts()`
- Voice mode hides the text input and skips the 1s "thinking" delay (text mode keeps both)
- Typewriter already skipped in voice mode (landed in pre-voice cleanup)

## Open testing items (do these on first real-device run)

1. **Silent empty-transcript recovery** — does it leave the user wondering if Huxley heard them? If yes, switch to a subtle "didn't catch that" visual cue without an extra TTS call.
2. **Accidental toggle** — does the 1s grace beat give users enough time to flip the toggle back off, or do they end up with a hot mic they didn't want?
3. **VAD threshold** — `-40 dB` and `1500ms` are guesses. Check in normal environments (room ambient, near a fan, on a couch, etc.) — too sensitive means cutoffs mid-thought; too lax means long awkward waits.
4. **Latency** — measure end-to-end (user-stops-talking → Huxley-starts-speaking). Target <3s. If higher, check whisper-transcribe round-trip vs elevenlabs-tts vs Claude.
5. **Permission denial path** — confirm the banner copy is clear; verify behavior when permission is denied after initial grant (rare but possible if user revokes mid-session).

## Phase 3 — true barge-in (not done)

- Detect audio route (headphones vs loudspeaker) via expo-audio output route info
- Headphones connected: enable concurrent recording during TTS playback for true barge-in
- Loudspeaker: keep tap-to-interrupt fallback
- Echo cancellation / iOS AVAudioSession `.measurement` mode tuning

## Phase 4 — polish (not done)

- Audition ElevenLabs voices and lock the default `ELEVENLABS_VOICE_ID`
- Settings UI for voice picker (if persona testing surfaces user demand)
- Verify TestFlight/Play Console permission strings render correctly
- Persona matrix run with voice mode on (does VAD interact badly with any persona's speech pattern?)
