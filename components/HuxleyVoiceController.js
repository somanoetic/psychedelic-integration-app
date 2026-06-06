/**
 * HuxleyVoiceController
 *
 * Owns the full voice conversation loop when voice mode is on:
 *   idle → listening → transcribing → thinking → speaking → listening → ...
 *
 * Mounted/unmounted by HuxleyChatScreen based on voiceMode from context.
 * When unmounted, hook cleanup tears down the recorder. The controller does
 * not render the message bubbles — it renders only the voice-mode overlay
 * (listening pulse, "Huxley is speaking", tap-to-interrupt) on top of the
 * existing chat. Transcripts and responses go through the normal handleSend
 * path passed in as a prop, so voice and text share one source of truth for
 * the conversation.
 *
 * VAD strategy: poll the recorder's `metering` (dB) every 100ms. Each turn
 * starts with a CALIBRATION_WINDOW_MS measurement of room ambient (median),
 * then sets the silence threshold and peak floor as offsets above that
 * ambient. After calibration, if the level stays below the silence threshold
 * for SILENCE_HOLD_MS continuously, the utterance is considered complete.
 * A short MIN_SPEECH_MS guard prevents firing on the initial silence right
 * after calibration if the user hasn't started speaking yet.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
} from 'expo-audio';
import { Mic } from 'lucide-react-native';
import { colors } from '../theme/colors';
import voiceService from '../lib/voiceService';

// VAD tuning. Metering is in dB on a roughly -160 (silent) to 0 (max) scale.
//
// Thresholds are CALIBRATED PER TURN rather than hardcoded. On the first
// CALIBRATION_WINDOW_MS of each listening session we collect metering samples
// without applying VAD, compute the median ambient level, and set:
//   silence threshold = ambient + SILENCE_OFFSET_DB   (anything quieter = silence)
//   peak floor        = ambient + PEAK_OFFSET_DB      (real speech must clear)
// This adapts automatically to whatever room the user is in — quiet bedroom,
// loud office, kid's birthday — without manual calibration UI.
//
// Reasoning for the offsets: in real-device measurements speech-at-mic ran
// roughly 8–10 dB louder than ambient, so a 4 dB silence offset cleanly
// separates "user is talking" from "user stopped," and an 8 dB peak floor
// rejects distant background voices that hover near ambient.
//
// FALLBACK_*_DB values are used if calibration fails (no metering samples
// collected, recorder didn't initialize, etc.) — pinned to values that worked
// in the 2026-05-17 real-device test of a quiet home office.
// SILENCE_HOLD_MS: how long the user's silence must persist before VAD fires.
// History: 1500ms → 900ms → 700ms → 500ms. Each reduction was paired with
// either tighter calibration or wider silence-offset to keep VAD reliable.
// At +8 dB silence offset, the threshold is comfortably above ambient, so
// when the user actually stops talking, the metering crosses cleanly. 500ms
// is enough to ride out brief thinking pauses ("I want to talk about... ah,
// ketamine") but short enough that single-word answers submit promptly.
const SILENCE_HOLD_MS = 500;
const MIN_SPEECH_MS = 600;             // ignore the initial pre-speech window
const METERING_POLL_MS = 100;
// Brief beat applied ONLY on the FIRST turn of a voice-mode session — gives
// the user a moment to settle in after tapping the toggle. Between turns we
// skip this entirely so the conversation feels responsive: as soon as Huxley
// finishes speaking, calibration starts and the mic opens.
const VOICE_MODE_ENTRY_GRACE_MS = 1000;
// Shortened from 800ms on 2026-05-20 to cut between-turn dead air. 500ms was
// too aggressive — the early ~300ms of the window is dominated by recorder
// warmup samples (metering pinned near -160 dB), which we filter out. At
// 500ms we got only 2 valid samples per window, making the median unstable.
// 600ms gives 5-7 valid samples reliably while still saving ~200ms per turn
// vs the original 800ms.
const CALIBRATION_WINDOW_MS = 600;
// SILENCE_OFFSET_DB started at +4 but real-device testing on 2026-05-27 showed
// that at ambient ~-32 dB with threshold at -28 dB, the user's between-word
// breath/rustle noise hovered right at the boundary, so silence was never
// sustained long enough for VAD to fire — user had to tap and often repeated
// themselves ("ketamine psychedelic journey twice"). Widened to +8 dB so the
// threshold is comfortably above ambient with headroom for natural mic noise.
const SILENCE_OFFSET_DB = 8;
// PEAK_OFFSET_DB started at +8 but real-device testing on 2026-05-18 showed
// legitimate speech (~-20 dB at mic) was getting rejected when ambient was
// in the -25 to -28 dB range (floor would land at -17 to -20, too tight).
// Lowered to +5 dB — distant background voices typically only beat ambient
// by 2-3 dB, so they're still rejected, while speaking *to* the mic reliably
// clears the floor by 5+ dB.
const PEAK_OFFSET_DB = 5;              // ambient + this = peak floor
const FALLBACK_SILENCE_DB_THRESHOLD = -22;
const FALLBACK_MIN_PEAK_DB = -18;

// Whisper occasionally hallucinates these short stock phrases on near-silent or
// noise-only audio (artifact of its training data — YouTube captions are full
// of these closers). If a transcript is just one of these, treat it as empty.
const WHISPER_ARTIFACT_PATTERNS = [
  /^thanks?(\s+(you|for\s+watching))?\.?$/i,
  /^thank\s+you\.?$/i,
  /^bye\.?$/i,
  /^goodbye\.?$/i,
  /^you\.?$/i,
  /^\.+$/,
  /^subtitles?\s+by.*$/i,
];

// Matches characters outside basic Latin + extended Latin + common punctuation.
// We force Whisper to English via the language parameter, but a defense in
// depth here: if the transcript still contains any CJK, Cyrillic, Arabic, etc.,
// it's almost certainly a hallucination on muffled or ambient audio. The
// 2026-05-27 incident produced a string of Chinese characters attributed to
// the user while voice mode was orphaned on a hidden screen.
const NON_LATIN_RE = /[Ͱ-ϿЀ-ӿԀ-ԯ԰-֏֐-׿؀-ۿ　-鿿가-힯豈-﫿]/;

function isLikelyArtifact(text) {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (trimmed.length < 4) return true; // anything under 4 chars is almost never a real utterance
  if (NON_LATIN_RE.test(trimmed)) return true; // CJK / Cyrillic / Arabic / Greek hallucinations
  return WHISPER_ARTIFACT_PATTERNS.some((re) => re.test(trimmed));
}

// Strip the routing-protocol "ROUTE: foo" sentinel before TTS so it doesn't
// get spoken aloud. The router already strips this from the visible message
// but be defensive — voice mode would be embarrassing if it slipped through.
function sanitizeForTts(text) {
  if (!text) return '';
  return text.replace(/ROUTE:\s*\w+/gi, '').trim();
}

export default function HuxleyVoiceController({
  voiceMode,
  onTranscript,       // (text) => Promise<{ message: string, ... }>  — calls routing service
  lastAssistantText,  // string — the latest assistant message to speak
  lastAssistantId,    // string — id of that message; used to detect "new response to speak"
  onSpeakingEnd,      // () => void — fires when Huxley finishes speaking the latest message.
                      // Used by the chat screen to auto-navigate when a route was suggested
                      // (in voice mode the user can't tap "Go to X" — Huxley's verbal cue
                      // is the consent signal).
}) {
  // State machine: 'idle' | 'calibrating' | 'listening' | 'transcribing' | 'thinking' | 'speaking'
  //
  // 'calibrating' is a sub-state of "mic is open" — we're measuring ambient
  // noise but VAD isn't armed yet. The UI shows a distinct pill so users
  // don't start talking before the measurement window closes (which would
  // pollute the ambient median with their voice and inflate thresholds).
  const [phase, setPhase] = useState('idle');
  const [permissionDenied, setPermissionDenied] = useState(false);

  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
  const recorderState = useAudioRecorderState(recorder, METERING_POLL_MS);

  // Track which assistant message we've already spoken so re-renders don't
  // trigger duplicate playback.
  const lastSpokenIdRef = useRef(null);

  // Tracks whether the upcoming idle→listening transition is the FIRST one
  // of this voice-mode session. Reset to true on toggle-on, flipped false
  // after the first startListening. Only the first transition gets the
  // VOICE_MODE_ENTRY_GRACE_MS pause — between-turn transitions skip it so
  // the conversation feels responsive.
  const isFirstListenOfSessionRef = useRef(true);

  // VAD bookkeeping (refs so they don't trigger re-renders mid-poll).
  const recordingStartedAtRef = useRef(0);
  // Set when phase flips from 'calibrating' → 'listening'. MIN_SPEECH_MS is
  // measured from this, NOT from recording start — otherwise the warmup buffer
  // is consumed entirely by calibration and VAD fires the moment listening
  // begins (causing the first-turn "Getting ready → Listening → Got it" loop
  // observed 2026-05-27 when the user hadn't said anything yet).
  const listeningStartedAtRef = useRef(0);
  const silenceStartedAtRef = useRef(null);
  const utteranceFinishingRef = useRef(false); // prevents double-stop
  // Loudest sample seen during the current recording. Compared to the per-turn
  // peakFloorRef to decide whether the user actually spoke *to* the mic
  // (vs distant background voices triggering VAD on a quieter ambient signal).
  const peakDbRef = useRef(-160);
  // Flips true the first time metering crosses the peak floor — i.e. when the
  // user has actually started speaking. VAD's silence detection is gated on
  // this: we never "finish an utterance" the user never started. Without this
  // flag, the silence timer fires during the brief quiet at session start
  // before the user begins speaking, producing an empty recording, peak-floor
  // rejection, and an instant re-listen loop ("Got it..." → "Getting ready..."
  // → repeat observed 2026-05-27).
  const hasSpeechBeenDetectedRef = useRef(false);

  // Per-turn adaptive calibration. Each new listening session collects ambient
  // samples during CALIBRATION_WINDOW_MS, then computes thresholds from the
  // median. If calibration fails (no samples), falls back to the static values.
  const calibrationSamplesRef = useRef([]);
  const silenceThresholdRef = useRef(FALLBACK_SILENCE_DB_THRESHOLD);
  const peakFloorRef = useRef(FALLBACK_MIN_PEAK_DB);
  const calibratedRef = useRef(false); // flips true after the window completes

  // ---------------------------------------------------------------------------
  // RECORDING LIFECYCLE
  // ---------------------------------------------------------------------------

  // Reset per-turn state (calibration buffers, peak tracking, silence timer)
  // without touching the recorder itself.
  const resetTurnState = useCallback(() => {
    recordingStartedAtRef.current = Date.now();
    silenceStartedAtRef.current = null;
    utteranceFinishingRef.current = false;
    peakDbRef.current = -160;
    hasSpeechBeenDetectedRef.current = false;
    calibrationSamplesRef.current = [];
    silenceThresholdRef.current = FALLBACK_SILENCE_DB_THRESHOLD;
    peakFloorRef.current = FALLBACK_MIN_PEAK_DB;
    calibratedRef.current = false;
  }, []);

  const startListening = useCallback(async () => {
    if (phase !== 'idle') return;
    try {
      const perm = await voiceService.requestMicPermission();
      if (!perm.granted) {
        setPermissionDenied(true);
        setPhase('idle');
        return;
      }
      await voiceService.configureAudioMode({ forRecording: true });

      // Defensive: a prior turn that errored out (e.g. TTS 402 in testing) may
      // have left the recorder in a "prepared" state without record() ever
      // being called. prepareToRecordAsync would then reject. If the recorder
      // reports any active state from a prior session, stop it first.
      if (recorder.isRecording) {
        try { await recorder.stop(); } catch (e) { /* ignore */ }
      }

      await recorder.prepareToRecordAsync();
      recorder.record();
      resetTurnState();
      setPhase('calibrating');
    } catch (e) {
      console.warn('[VoiceCtl] startListening failed:', e?.message || e);
      try { await recorder.stop(); } catch (_) { /* ignore */ }
      setPhase('idle');
    }
  }, [phase, recorder, resetTurnState]);

  const finishUtterance = useCallback(async () => {
    if (utteranceFinishingRef.current) return;
    utteranceFinishingRef.current = true;

    // Peak-floor gate: if the loudest moment of this recording was below
    // the per-turn peakFloorRef (ambient + PEAK_OFFSET_DB), the user wasn't
    // speaking directly to the mic — it was ambient noise / distant voices
    // / music. Stop the recorder to release the file but skip Whisper
    // entirely, saving the API call and avoiding false transcripts.
    if (peakDbRef.current < peakFloorRef.current) {
      if (__DEV__) {
        console.log(
          `[VoiceCtl] Skipping transcription — peak ${peakDbRef.current.toFixed(1)} dB below floor ${peakFloorRef.current.toFixed(1)} dB`,
        );
      }
      try {
        await voiceService.cancelRecordingFrom(recorder);
      } catch (e) {
        // ignore — the recorder may have already stopped
      }
      setPhase('idle');
      return;
    }

    setPhase('transcribing');
    try {
      const transcript = await voiceService.stopAndTranscribe(recorder);
      const cleaned = (transcript || '').trim();

      if (!cleaned || isLikelyArtifact(cleaned)) {
        // Provisional: silently re-open the mic. Tracked in
        // project_voice_phase2_decisions — revisit during real-device testing
        // if users report uncertainty about whether Huxley heard them.
        if (__DEV__ && cleaned) {
          console.log(`[VoiceCtl] Discarding artifact transcript: "${cleaned}"`);
        }
        setPhase('idle');
        return;
      }

      setPhase('thinking');
      await onTranscript(cleaned);
      // After onTranscript resolves, the parent appends the assistant message;
      // a separate effect (below) picks it up and transitions us to 'speaking'.
    } catch (e) {
      console.warn('[VoiceCtl] finishUtterance failed:', e?.message || e);
      setPhase('idle');
    }
  }, [recorder, onTranscript]);

  // VAD watcher — runs every time recorderState updates (≈ METERING_POLL_MS).
  //
  // Two phases per turn:
  //   1. 'calibrating' (first CALIBRATION_WINDOW_MS): collect ambient samples.
  //      VAD does NOT fire. UI shows a distinct "Calibrating..." pill so the
  //      user knows not to start talking yet.
  //   2. 'listening': calibration complete, thresholds set, VAD armed.
  useEffect(() => {
    if (phase !== 'calibrating' && phase !== 'listening') return;
    if (!recorderState?.isRecording) return;

    const level = recorderState.metering;
    if (typeof level !== 'number') return;

    // Track loudest sample regardless of phase — peak floor check at end-of-turn
    // needs to consider the whole recording, including calibration window.
    if (level > peakDbRef.current) {
      peakDbRef.current = level;
    }

    const elapsed = Date.now() - recordingStartedAtRef.current;

    // ── Calibration phase ───────────────────────────────────────────────
    if (!calibratedRef.current) {
      calibrationSamplesRef.current.push(level);
      if (elapsed >= CALIBRATION_WINDOW_MS) {
        // Window closed — compute thresholds from a trimmed median.
        //
        // Step 1: drop "no signal" warmup artifacts. The recorder reports
        // metering very close to the scale floor (~-160 dB) during the brief
        // window after record() before the audio pipeline initializes. These
        // aren't real ambient readings — they're "no data yet." Including
        // them tanks the median and produces nonsense thresholds (e.g. the
        // 2026-05-18 bug where first-turn calibration set silence<-156 dB).
        //
        // Step 2: drop the LOUDEST 30% so a cough, chair bump, or nearby
        // voice during the window doesn't inflate the estimate.
        const RECORDER_WARMUP_FLOOR = -100;
        const samples = calibrationSamplesRef.current.filter(
          (s) => s > RECORDER_WARMUP_FLOOR,
        );
        if (samples.length >= 2) {
          const sorted = [...samples].sort((a, b) => a - b); // ascending: quietest first
          const keepCount = Math.max(1, Math.ceil(sorted.length * 0.7));
          const trimmed = sorted.slice(0, keepCount);
          const median = trimmed[Math.floor(trimmed.length / 2)];
          silenceThresholdRef.current = median + SILENCE_OFFSET_DB;
          peakFloorRef.current = median + PEAK_OFFSET_DB;
          if (__DEV__) {
            console.log(
              `[VoiceCtl] Calibrated: ambient=${median.toFixed(1)}dB ` +
              `silence<${silenceThresholdRef.current.toFixed(1)}dB ` +
              `peak>${peakFloorRef.current.toFixed(1)}dB ` +
              `(${trimmed.length}/${samples.length} valid samples, ${calibrationSamplesRef.current.length} raw)`,
            );
          }
        } else if (__DEV__) {
          console.log(
            `[VoiceCtl] Calibration skipped — too few valid samples ` +
            `(${samples.length}/${calibrationSamplesRef.current.length}). ` +
            `Using fallback thresholds.`,
          );
        }
        // If filtered samples is empty/sparse, fallback constants stay.
        calibratedRef.current = true;
        listeningStartedAtRef.current = Date.now();
        setPhase('listening');
      }
      return; // Don't VAD during calibration regardless
    }

    // ── Active VAD phase ────────────────────────────────────────────────
    // MIN_SPEECH_MS is measured from when LISTENING began (not from recording
    // start) so the warmup buffer survives the calibration window.
    const sinceListening = Date.now() - listeningStartedAtRef.current;
    if (sinceListening < MIN_SPEECH_MS) {
      silenceStartedAtRef.current = null;
      return;
    }

    // Flip "speech started" the first time we hear anything above the peak
    // floor. The silence detector below only counts if this is true — we
    // never close out a turn the user never began.
    if (!hasSpeechBeenDetectedRef.current && level >= peakFloorRef.current) {
      hasSpeechBeenDetectedRef.current = true;
    }

    // Silence detection only runs once real speech has been heard. Without
    // this gate, the first turn loops endlessly: user hasn't started talking,
    // metering is at ambient (below silence threshold), silence timer fires
    // immediately, peak-floor rejects empty recording, mic reopens, repeat.
    if (!hasSpeechBeenDetectedRef.current) {
      silenceStartedAtRef.current = null;
      return;
    }

    if (level < silenceThresholdRef.current) {
      if (silenceStartedAtRef.current === null) {
        silenceStartedAtRef.current = Date.now();
      } else if (Date.now() - silenceStartedAtRef.current >= SILENCE_HOLD_MS) {
        finishUtterance();
      }
    } else {
      silenceStartedAtRef.current = null;
    }
  }, [phase, recorderState, finishUtterance]);

  // ---------------------------------------------------------------------------
  // SPEAKING LIFECYCLE — react to new assistant messages
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!voiceMode) return;
    if (!lastAssistantText || !lastAssistantId) return;
    if (lastSpokenIdRef.current === lastAssistantId) return;
    if (phase === 'speaking') return; // already speaking (shouldn't happen, defensive)

    lastSpokenIdRef.current = lastAssistantId;
    const toSpeak = sanitizeForTts(lastAssistantText);
    if (!toSpeak) {
      setPhase('idle');
      return;
    }

    setPhase('speaking');
    voiceService
      .speak(toSpeak)
      .catch((e) => console.warn('[VoiceCtl] speak failed:', e?.message || e))
      .finally(() => {
        // After Huxley finishes, drop to idle; the toggle-on / phase effect
        // below will reopen the mic for the next turn.
        setPhase('idle');
        // Let the chat screen react to "Huxley just finished speaking" —
        // typically used to auto-navigate when a route was suggested in
        // voice mode (no tap available).
        if (onSpeakingEnd) {
          try { onSpeakingEnd(); } catch (e) {
            if (__DEV__) console.warn('[VoiceCtl] onSpeakingEnd threw:', e);
          }
        }
      });
  }, [voiceMode, lastAssistantText, lastAssistantId, phase, onSpeakingEnd]);

  // When voice mode toggles ON, treat whatever is currently the latest
  // assistant message as "already spoken." Without this, toggling voice on
  // mid-conversation makes Huxley re-read the most recent existing bubble
  // (e.g. the greeting that was already on screen), which is jarring. Only
  // brand-new responses produced *after* voice toggle-on should be spoken.
  useEffect(() => {
    if (voiceMode) {
      lastSpokenIdRef.current = lastAssistantId ?? null;
    }
    // Only run when voiceMode itself flips, not on every new lastAssistantId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceMode]);

  // Hard cleanup on component unmount: even if voiceMode toggling off should
  // have torn down playback, a navigation that unmounts the chat screen mid-
  // playback can race with the toggle-off cleanup. This runs synchronously
  // on unmount to guarantee no orphaned player survives to echo across a
  // subsequent re-mount.
  useEffect(() => {
    return () => {
      voiceService.stopSpeaking().catch(() => {});
    };
  }, []);

  // ---------------------------------------------------------------------------
  // VOICE-MODE TOGGLE — open mic on entry, tear down on exit
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!voiceMode) {
      // User turned voice off mid-loop — cancel everything.
      voiceService.stopSpeaking().catch(() => {});
      if (recorderState?.isRecording) {
        recorder.stop().catch(() => {});
      }
      setPhase('idle');
      lastSpokenIdRef.current = null;
      isFirstListenOfSessionRef.current = true;
      return;
    }

    // idle → listening transition. First time per voice-mode session gets a
    // small grace beat (lets the user settle in after toggling on). Every
    // subsequent transition (between turns) opens the mic immediately — the
    // calibration window itself provides the visual "Getting ready" beat.
    if (phase === 'idle') {
      const delay = isFirstListenOfSessionRef.current
        ? VOICE_MODE_ENTRY_GRACE_MS
        : 0;
      const t = setTimeout(() => {
        // Re-check voiceMode in case the user toggled off during the grace beat.
        if (voiceMode) {
          isFirstListenOfSessionRef.current = false;
          startListening();
        }
      }, delay);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceMode, phase]);

  // ---------------------------------------------------------------------------
  // TAP-TO-INTERRUPT
  // ---------------------------------------------------------------------------

  const handleInterrupt = useCallback(() => {
    if (phase === 'speaking') {
      voiceService.stopSpeaking().catch(() => {});
      setPhase('idle'); // triggers the toggle-on effect to reopen mic
    } else if (phase === 'listening') {
      // User taps while listening — treat as "I'm done, send it" early submit.
      finishUtterance();
    }
  }, [phase, finishUtterance]);

  // ---------------------------------------------------------------------------
  // RENDER OVERLAY
  // ---------------------------------------------------------------------------

  if (!voiceMode) return null;

  // Tap-to-interrupt is now bound to the status pill itself, not a full-screen
  // overlay. The previous full-screen Pressable blocked scroll gestures, which
  // both prevented users from reading back chat history during a turn and
  // produced false interrupts when a scroll attempt was interpreted as a tap.
  // The pill is a large, visible target near the bottom of the screen — easy
  // to hit deliberately, never hit accidentally.
  const tapCaptureActive = phase === 'speaking' || phase === 'listening';

  const pillAccessibility = phase === 'speaking'
    ? 'Tap to interrupt Huxley'
    : phase === 'listening'
      ? 'Tap to finish speaking and send'
      : undefined;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {permissionDenied && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Microphone permission denied. Enable it in Settings to use voice mode.
          </Text>
        </View>
      )}

      {phase === 'calibrating' && (
        <View style={styles.statusPill}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.statusText}>Getting ready…</Text>
        </View>
      )}
      {phase === 'listening' && (
        <Pressable
          style={styles.statusPill}
          onPress={tapCaptureActive ? handleInterrupt : undefined}
          accessibilityRole="button"
          accessibilityLabel={pillAccessibility}
        >
          <Mic size={16} color="#fff" />
          <Text style={styles.statusText}>Listening</Text>
        </Pressable>
      )}
      {phase === 'transcribing' && (
        <View style={styles.statusPill}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.statusText}>Got it…</Text>
        </View>
      )}
      {phase === 'thinking' && (
        <View style={styles.statusPill}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.statusText}>Huxley is thinking…</Text>
        </View>
      )}
      {phase === 'speaking' && (
        <Pressable
          style={styles.statusPill}
          onPress={tapCaptureActive ? handleInterrupt : undefined}
          accessibilityRole="button"
          accessibilityLabel={pillAccessibility}
        >
          <Text style={styles.statusText}>Huxley is speaking — tap to interrupt</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Floating bottom overlay; sits above the input row. pointerEvents="box-none"
  // on the View itself lets taps pass through the empty regions while still
  // letting children (the status pill) receive their own taps.
  overlay: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  banner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#c0392b',
  },
  bannerText: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
  },
});
