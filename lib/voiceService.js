/**
 * Voice Service - Speech-to-Text and Text-to-Speech for Huxley
 *
 * Phase 1 plumbing for voice conversations with Huxley.
 *
 * Pipeline:
 *   record audio (expo-audio useAudioRecorder hook, owned by component)
 *     -> stopAndTranscribe(recorder) -> Whisper edge function -> text
 *   text -> speak(text) -> ElevenLabs edge function -> AudioPlayer playback
 *
 * Recording lifecycle lives in the component (hook), because expo-audio's
 * recorder is hook-based. Playback lives here because Audio.createAudioPlayer
 * is an imperative API that works fine outside a component.
 *
 * SECURITY: OpenAI and ElevenLabs API keys live as Supabase secrets. The client
 * authenticates with its Supabase JWT (same pattern as claudeProxyService.js).
 */

import {
  AudioModule,
  setAudioModeAsync,
  createAudioPlayer,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';
import config from './config';

const TRANSCRIBE_ENDPOINT = `${config.supabaseUrl}/functions/v1/whisper-transcribe`;
const TTS_ENDPOINT = `${config.supabaseUrl}/functions/v1/elevenlabs-tts`;

let activePlayer = null;
let activePlaybackListener = null;
let isSpeaking = false;

async function getAuthToken() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    throw new Error('Voice features require sign-in.');
  }
  return session.access_token;
}

/**
 * Request microphone permission. Call once before the first recording.
 * Returns the full PermissionResponse so callers can show canAskAgain UI.
 */
export async function requestMicPermission() {
  return AudioModule.requestRecordingPermissionsAsync();
}

/**
 * Configure the audio session. Recording requires allowsRecording on iOS.
 * Call with forRecording:true right before starting a recording, and
 * forRecording:false before playback.
 */
export async function configureAudioMode({ forRecording }) {
  await setAudioModeAsync({
    allowsRecording: !!forRecording,
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    shouldRouteThroughEarpiece: false,
    interruptionMode: 'mixWithOthers',
  });
}

/**
 * Stop the recorder (from useAudioRecorder hook) and send its audio to Whisper.
 *
 * @param {object} recorder - The recorder object returned by useAudioRecorder
 * @returns {Promise<string>} The transcribed text
 *
 * The recorder must have been started by the caller (recorder.record()). This
 * function stops it, reads the file, posts it to the whisper-transcribe edge
 * function, then deletes the local file.
 */
export async function stopAndTranscribe(recorder) {
  if (!recorder) throw new Error('No recorder provided.');

  await recorder.stop();
  const uri = recorder.uri;

  if (!uri) {
    throw new Error('Recording produced no audio file.');
  }

  try {
    // HIGH_QUALITY preset records m4a on both platforms — well under Whisper's
    // 25 MB limit for a typical sub-30s voice turn.
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const ext = (uri.split('.').pop() || 'm4a').toLowerCase();

    const token = await getAuthToken();
    const response = await fetch(TRANSCRIBE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      // language: 'en' forces Whisper to interpret as English. Without this,
      // Whisper's multilingual model sometimes hallucinates non-Latin output
      // (CJK characters, etc.) on near-silent or ambiguous audio, which then
      // gets attributed to the user as a "ghost message." If we add non-English
      // support later, this should become a user preference.
      body: JSON.stringify({ audio_base64: base64, format: ext, language: 'en' }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Transcription failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.text || '';
  } finally {
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch (e) {
      if (__DEV__) console.warn('[Voice] Failed to delete recording temp file:', e);
    }
  }
}

/**
 * Stop the recorder and delete its audio file WITHOUT transcribing.
 *
 * Used when the caller has decided the recording isn't worth sending to Whisper
 * (e.g. peak-volume floor check failed — the user wasn't actually speaking to
 * the mic). Saves an API call and prevents false transcripts on ambient noise.
 *
 * @param {object} recorder - The recorder from useAudioRecorder
 */
export async function cancelRecordingFrom(recorder) {
  if (!recorder) return;
  try {
    await recorder.stop();
  } catch (e) {
    if (__DEV__) console.warn('[Voice] Error stopping recorder during cancel:', e);
  }
  const uri = recorder.uri;
  if (uri) {
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch (e) {
      // ignore — temp file cleanup is best-effort
    }
  }
}

/**
 * Synthesize `text` via ElevenLabs and play it through the device speaker.
 *
 * Returns a promise that resolves when playback finishes (or rejects on error).
 * Call stopSpeaking() to cancel early.
 */
export async function speak(text) {
  if (!text || !text.trim()) return;

  await stopSpeaking();
  await configureAudioMode({ forRecording: false });

  const token = await getAuthToken();
  const response = await fetch(TTS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`TTS failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  if (!data.audio_base64) {
    throw new Error('TTS response missing audio.');
  }

  const ext = (data.mime || 'audio/mpeg').includes('mpeg') ? 'mp3' : 'wav';
  const filename = `huxley-tts-${Date.now()}.${ext}`;
  const fileUri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(fileUri, data.audio_base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  activePlayer = createAudioPlayer({ uri: fileUri });
  isSpeaking = true;

  return new Promise((resolve, reject) => {
    activePlaybackListener = activePlayer.addListener(
      'playbackStatusUpdate',
      (status) => {
        if (status.didJustFinish) {
          cleanupPlayback(fileUri);
          resolve();
        }
      },
    );

    try {
      activePlayer.play();
    } catch (e) {
      cleanupPlayback(fileUri);
      reject(e);
    }
  });
}

/**
 * Stop any in-progress TTS playback immediately. Safe to call when nothing is playing.
 *
 * Aggressively tears down the active player. The 2026-05-27 echo bug surfaced
 * when navigation away from the chat screen during playback left a player
 * in a half-cleaned-up state — its native audio buffer continued draining
 * while a new speak() created a second player on screen re-entry, producing
 * two slightly-offset voices.
 *
 * Defense: pause AND seek-to-zero AND remove, with each step in a try/catch
 * so a failure on one doesn't skip the others.
 */
export async function stopSpeaking() {
  if (!activePlayer) {
    // Even with no active player, reset isSpeaking in case it got stuck.
    isSpeaking = false;
    return;
  }
  const player = activePlayer;
  try { player.pause(); } catch (e) { if (__DEV__) console.warn('[Voice] pause failed:', e); }
  // Seek-to-zero is the most reliable way to halt any pipelined audio that
  // pause() alone doesn't catch on some Android audio stacks.
  try {
    if (typeof player.seekTo === 'function') {
      await player.seekTo(0);
    }
  } catch (e) {
    if (__DEV__) console.warn('[Voice] seekTo failed:', e);
  }
  cleanupPlayback();
}

function cleanupPlayback(fileUri) {
  if (activePlaybackListener) {
    try {
      activePlaybackListener.remove();
    } catch (e) {
      // ignore
    }
    activePlaybackListener = null;
  }
  if (activePlayer) {
    try {
      activePlayer.remove();
    } catch (e) {
      // ignore
    }
    activePlayer = null;
  }
  isSpeaking = false;
  if (fileUri) {
    FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => {});
  }
}

export function getVoiceState() {
  return { isSpeaking };
}

export default {
  requestMicPermission,
  configureAudioMode,
  stopAndTranscribe,
  cancelRecordingFrom,
  speak,
  stopSpeaking,
  getVoiceState,
};
