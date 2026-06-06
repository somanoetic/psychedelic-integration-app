/**
 * Paper Scan Service
 *
 * One-shot Claude vision interpretation for handwritten paper scans.
 *
 * Why this is separate from huxleyService:
 *   huxleyService is built around multi-turn therapeutic conversations with
 *   per-mode phase handlers, crisis-latch state, mode switching, and shared
 *   history. A scan interpretation is none of those — it's a single
 *   stateless image-in / structured-text-out call. Routing it through
 *   huxleyService would force a fake "mode," skip every handler it has, and
 *   dilute that service's purpose. The "Reflect with Huxley" affordance on
 *   a saved scan does go through huxleyService, but as a normal journal-mode
 *   message handing off the transcription text — not as a scan-aware mode.
 *
 * Flow for a single scan (the screens are wired up in Chunk C):
 *   1. captureAndPrepare(uri)        — read file, downscale, base64 encode
 *   2. detectGlyph(b64)              — fast model: is there an MT-... glyph?
 *   3. interpretScan(b64, worksheet) — primary model: structured extraction
 *   4. (caller) uploads image + persists row in paper_scans
 *
 * This file is the skeleton — methods stubbed where they need camera/storage
 * code that doesn't exist yet. Each stub throws with a clear message so
 * accidental early use surfaces fast.
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

import claudeProxyService from './claudeProxyService';
import { supabase } from './supabase';
import { MODELS } from './aiModels';

// Output schema versions. Bumped if the JSON contract changes so callers can
// fail closed on unknown shapes rather than silently mis-parsing.
const TRANSCRIPTION_SCHEMA_VERSION = 1;

// Glyph format: MT-{worksheet-id}-v{n}. Worksheet id is alphanumeric + hyphens,
// version is a positive integer. Anchored so partial matches inside other text
// don't false-positive.
const GLYPH_RE = /^MT-([a-z0-9-]+)-v(\d+)$/i;

class PaperScanService {
  // ===========================================================================
  // GLYPH DETECTION (step 2)
  // ===========================================================================

  /**
   * Look for a Multitudes worksheet glyph in the scan. Uses the fast model
   * because the answer is short (an ID string or "none") and we don't need
   * Sonnet-level reasoning to read a corner mark.
   *
   * Returns: { worksheetId, version } if found, otherwise null.
   * Throws only on transport errors — a missing glyph is null, not an error.
   */
  async detectGlyph(imageBase64, mediaType = 'image/jpeg') {
    const system =
      'You inspect scanned worksheet images for a small identifying glyph in ' +
      'the corner of the page. The glyph encodes a worksheet identifier in the ' +
      'form "MT-{worksheet-id}-v{n}" (for example "MT-psi-v1"). If you see ' +
      'such a glyph, respond with ONLY the glyph text on a single line. If you ' +
      'do not see one, respond with ONLY the single word "none". Do not add ' +
      'any other text, punctuation, or explanation.';

    const response = await claudeProxyService.sendMessage(
      [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: imageBase64 },
            },
            { type: 'text', text: 'What glyph, if any, is on this page?' },
          ],
        },
      ],
      {
        model: MODELS.FAST,
        maxTokens: 32,
        temperature: 0,
        system,
      }
    );

    const raw = response?.content?.[0]?.text?.trim() ?? '';
    if (!raw || raw.toLowerCase() === 'none') return null;

    const match = raw.match(GLYPH_RE);
    if (!match) {
      console.warn('[PaperScan] Glyph response did not match format:', raw);
      return null;
    }
    return {
      worksheetId: match[1].toLowerCase(),
      version: parseInt(match[2], 10),
    };
  }

  // ===========================================================================
  // INTERPRETATION (step 3)
  // ===========================================================================

  /**
   * Read a scan with Claude vision. Behavior splits on whether a worksheet
   * config was supplied:
   *   - worksheet provided: structured per-field extraction matching the
   *     worksheet's field schema. Returns { fields: { fieldId: text } }.
   *   - no worksheet: full transcription of the handwriting + light thematic
   *     notes (parts, body refs, themes). Returns { fullText, thematicNotes }.
   *
   * Either way the wrapper shape is the same:
   *   {
   *     schemaVersion: 1,
   *     mode: 'worksheet' | 'free_form',
   *     transcription: <see above>,
   *     thematicNotes: string,
   *     raw: <unparsed Claude response — debugging only>,
   *   }
   *
   * Caller decides what to persist; we don't touch the DB here.
   */
  async interpretScan({ imageBase64, mediaType = 'image/jpeg', worksheet = null }) {
    if (worksheet) {
      return this._interpretWorksheet({ imageBase64, mediaType, worksheet });
    }
    return this._interpretFreeForm({ imageBase64, mediaType });
  }

  async _interpretWorksheet({ imageBase64, mediaType, worksheet }) {
    // Build a per-field prompt block. Each worksheet field declares an `id`,
    // a `label` (what the human sees on the page), a `kind`, and an optional
    // `promptForClaude` hint. Field shape is defined in content/worksheets/.
    //
    // The field-kind hint tells Claude what to output for each:
    //   free-text -> the transcribed handwriting (string)
    //   date      -> the date string as written (string)
    //   list      -> the list items joined by "\n" (string)
    //   checkbox-list -> the user's selected options joined by ", " (string)
    //                    Include any "Other:" write-in. If none checked, "".
    //   scale     -> the circled/marked number as a string (e.g. "7")
    //                If unclear or unmarked, "".
    const fieldLines = worksheet.fields
      .map((f) => {
        const hint = f.promptForClaude ? ` — ${f.promptForClaude}` : '';
        const kindNote = ` [${f.kind}]`;
        return `  - ${f.id} ("${f.label}")${kindNote}${hint}`;
      })
      .join('\n');

    const system =
      'You are reading a handwritten worksheet that a user filled in by hand. ' +
      'For each field, output what the user actually marked or wrote — not ' +
      'what you think they meant. If a field appears blank, return an empty ' +
      'string for it.\n\n' +
      'Field kinds (shown in brackets) tell you the expected format:\n' +
      '  - [free-text]     : faithful transcription, preserve voice + line breaks\n' +
      '  - [date]          : the date string as written\n' +
      '  - [list]          : items separated by newlines, in the order written\n' +
      '  - [checkbox-list] : the checked options joined by ", " (include any\n' +
      '                      "Other:" write-in like "Other: walking"). If none\n' +
      '                      are checked, return "".\n' +
      '  - [scale]         : the circled/marked number as a string (e.g. "7").\n' +
      '                      If unclear or unmarked, return "".\n\n' +
      'After the field extraction, write a short paragraph of "thematic ' +
      'notes" — light observations about parts, body references, or themes ' +
      'that showed up. Be gentle and non-interpretive; this is meant to ' +
      'reflect what is present, not analyze it.\n\n' +
      `Worksheet: "${worksheet.title}"\n` +
      `Fields to extract:\n${fieldLines}\n\n` +
      'Respond with ONLY a JSON object in this exact shape:\n' +
      '{\n' +
      '  "fields": { "<fieldId>": "<extracted value>", ... },\n' +
      '  "thematicNotes": "<short paragraph>"\n' +
      '}\n' +
      'No prose before or after the JSON. No markdown fences.';

    const response = await claudeProxyService.sendMessage(
      [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: imageBase64 },
            },
            { type: 'text', text: 'Read this worksheet.' },
          ],
        },
      ],
      {
        model: MODELS.PRIMARY,
        maxTokens: 4096,
        temperature: 0.2,
        system,
      }
    );

    const text = response?.content?.[0]?.text?.trim() ?? '';
    const parsed = this._parseJsonResponse(text);

    return {
      schemaVersion: TRANSCRIPTION_SCHEMA_VERSION,
      mode: 'worksheet',
      transcription: { fields: parsed?.fields ?? {} },
      thematicNotes: parsed?.thematicNotes ?? '',
      raw: response,
    };
  }

  async _interpretFreeForm({ imageBase64, mediaType }) {
    const system =
      'You are reading a handwritten free-form journal page that a user wrote ' +
      'by hand. Transcribe the entire page faithfully — preserve the user\'s ' +
      'voice, line breaks where meaningful, and do not paraphrase or correct. ' +
      'After the transcription, write a short paragraph of "thematic notes" — ' +
      'light observations about parts, body references, or themes that showed ' +
      'up. Be gentle and non-interpretive.\n\n' +
      'Respond with ONLY a JSON object in this exact shape:\n' +
      '{\n' +
      '  "fullText": "<faithful transcription>",\n' +
      '  "thematicNotes": "<short paragraph>"\n' +
      '}\n' +
      'No prose before or after the JSON. No markdown fences.';

    const response = await claudeProxyService.sendMessage(
      [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: imageBase64 },
            },
            { type: 'text', text: 'Read this page.' },
          ],
        },
      ],
      {
        model: MODELS.PRIMARY,
        maxTokens: 4096,
        temperature: 0.2,
        system,
      }
    );

    const text = response?.content?.[0]?.text?.trim() ?? '';
    const parsed = this._parseJsonResponse(text);

    return {
      schemaVersion: TRANSCRIPTION_SCHEMA_VERSION,
      mode: 'free_form',
      transcription: { fullText: parsed?.fullText ?? '' },
      thematicNotes: parsed?.thematicNotes ?? '',
      raw: response,
    };
  }

  // Defensive JSON parsing. The system prompt forbids markdown fences and
  // surrounding prose, but models occasionally violate it. Try the strict
  // path first, then fall back to the first {...} block we can find.
  _parseJsonResponse(text) {
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return null;
      try {
        return JSON.parse(match[0]);
      } catch (err) {
        console.warn('[PaperScan] Failed to parse JSON response:', err.message);
        return null;
      }
    }
  }

  // ===========================================================================
  // IMAGE PREPARATION (step 1)
  // ===========================================================================

  /**
   * Take a raw image URI from the doc-scanner (or library picker) and produce
   * a vision-ready JPEG. Downscales to at most 2000px on the longest edge —
   * Claude vision accepts up to ~8000x8000 but past about 1568px the model
   * doesn't gain accuracy on dense handwriting, and the extra bytes cost
   * proportionally more in tokens. 2000px gives comfortable headroom while
   * keeping the upload + base64 string small.
   *
   * Returns: { uri, base64, mediaType, width, height, byteLength }
   *   - uri is the new file:// path of the processed JPEG
   *   - base64 is the file contents ready for Claude vision
   *   - mediaType is always 'image/jpeg' (we re-encode regardless of source)
   */
  async prepareImage(rawUri) {
    const MAX_EDGE = 2000;
    const JPEG_QUALITY = 0.85;

    // Read source dimensions cheaply via a no-op manipulate call (just to get
    // the size back). ImageManipulator's manipulateAsync requires at least one
    // action — pass an empty resize that effectively no-ops if image is small.
    const info = await ImageManipulator.manipulateAsync(rawUri, [], {
      base64: false,
      compress: 1,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    const longEdge = Math.max(info.width, info.height);
    const needsResize = longEdge > MAX_EDGE;

    const actions = needsResize
      ? [{
          resize: info.width >= info.height
            ? { width: MAX_EDGE }
            : { height: MAX_EDGE },
        }]
      : [];

    const result = await ImageManipulator.manipulateAsync(rawUri, actions, {
      base64: true,
      compress: JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    return {
      uri: result.uri,
      base64: result.base64,
      mediaType: 'image/jpeg',
      width: result.width,
      height: result.height,
      byteLength: result.base64 ? Math.floor((result.base64.length * 3) / 4) : 0,
    };
  }

  // ===========================================================================
  // STORAGE UPLOAD (step 4)
  // ===========================================================================

  /**
   * Upload a prepared JPEG to the paper-scans Storage bucket. Path layout
   * matches the RLS policy in 20260525000003_paper_scans_bucket.sql —
   * first segment is the user's auth.uid().
   *
   *   {userId}/{scanUuid}.jpg
   *
   * Returns the storage path (NOT a URL) — that's what we persist in
   * paper_scans.image_storage_path. Callers signurl on read.
   */
  async uploadImage({ userId, scanUuid, imageUri, mediaType = 'image/jpeg' }) {
    if (!userId) throw new Error('[PaperScan] uploadImage requires userId');
    if (!scanUuid) throw new Error('[PaperScan] uploadImage requires scanUuid');

    const ext = mediaType === 'image/png' ? 'png' : 'jpg';
    const path = `${userId}/${scanUuid}.${ext}`;

    // Supabase Storage's React Native upload path: read the file as a binary
    // ArrayBuffer (NOT base64 — that double-encodes). expo-file-system/legacy
    // returns base64, so we have to decode it to bytes manually.
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const bytes = _decodeBase64ToBytes(base64);

    const { error } = await supabase.storage
      .from('paper-scans')
      .upload(path, bytes, {
        contentType: mediaType,
        upsert: false,
      });

    if (error) throw error;
    return path;
  }

  /**
   * Get a short-lived signed URL for a stored scan, suitable for <Image>.
   * The bucket is private; we never serve public URLs.
   */
  async getSignedUrl(storagePath, expiresInSec = 60 * 60) {
    const { data, error } = await supabase.storage
      .from('paper-scans')
      .createSignedUrl(storagePath, expiresInSec);
    if (error) throw error;
    return data.signedUrl;
  }

  // ===========================================================================
  // PERSISTENCE (saveScan) — ties capture + interpretation into a DB row
  // ===========================================================================

  /**
   * Persist a completed scan. Caller has already:
   *   - captured + prepared the image (prepareImage)
   *   - detected the glyph if any (detectGlyph)
   *   - run vision interpretation (interpretScan)
   *   - allowed the user to correct field transcriptions in the review UI
   *
   * This method handles the storage upload + DB insert atomically-ish:
   * if the upload succeeds but the insert fails, we attempt to remove the
   * orphan object so the bucket doesn't grow garbage.
   *
   * Returns the inserted row.
   */
  async saveScan({
    userId,
    sessionId = null,
    imageUri,
    mediaType = 'image/jpeg',
    worksheet = null,         // worksheet config object, or null for free-form
    interpretation,           // result of interpretScan()
    correctedTranscription,   // user-edited copy of interpretation.transcription
    thematicNotes,            // user-edited copy of interpretation.thematicNotes
    therapistShareEnabled = true,
  }) {
    if (!userId) throw new Error('[PaperScan] saveScan requires userId');
    if (!imageUri) throw new Error('[PaperScan] saveScan requires imageUri');
    if (!interpretation) throw new Error('[PaperScan] saveScan requires interpretation');

    // Generate the row id up front so the storage path includes it. Lets us
    // reconstruct path -> row -> user without extra joins.
    const scanUuid = _uuid();
    const storagePath = await this.uploadImage({
      userId,
      scanUuid,
      imageUri,
      mediaType,
    });

    const row = {
      id: scanUuid,
      user_id: userId,
      session_id: sessionId,
      image_storage_path: storagePath,
      worksheet_id: worksheet?.id ?? null,
      worksheet_version: worksheet?.version ?? null,
      transcription: correctedTranscription ?? interpretation.transcription ?? {},
      thematic_notes: thematicNotes ?? interpretation.thematicNotes ?? '',
      ai_raw_output: interpretation.raw ?? {},
      therapist_share_enabled: therapistShareEnabled,
    };

    const { data, error } = await supabase
      .from('paper_scans')
      .insert(row)
      .select()
      .single();

    if (error) {
      // Best-effort orphan cleanup. If this fails too, log and move on —
      // we'll catch orphans later with a periodic sweep if it becomes an issue.
      try {
        await supabase.storage.from('paper-scans').remove([storagePath]);
      } catch (cleanupErr) {
        console.warn('[PaperScan] Failed to clean up orphan after insert error:', cleanupErr);
      }
      throw error;
    }

    return data;
  }
}

// =============================================================================
// Helpers (file-private)
// =============================================================================

// Decode a base64 string to a Uint8Array. atob is available in Hermes.
function _decodeBase64ToBytes(base64) {
  const binary = global.atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Lightweight RFC4122-ish v4 UUID. Avoids pulling in a uuid package for one
// call site. Sufficient for primary-key generation when collisions across a
// per-user namespace are astronomically improbable.
function _uuid() {
  const rand = () => Math.floor(Math.random() * 0xffffffff);
  const hex = (n, len) => n.toString(16).padStart(len, '0');
  const a = rand();
  const b = rand();
  const c = rand();
  const d = rand();
  // Set version (4) and variant (10xx) bits.
  const cClamped = (c & 0x0fff) | 0x4000;
  const dClamped = (d & 0x3fff) | 0x8000;
  return (
    hex(a, 8) + '-' +
    hex(b >>> 16, 4) + '-' +
    hex(cClamped, 4) + '-' +
    hex(dClamped, 4) + '-' +
    hex(b & 0xffff, 4) + hex(rand(), 8)
  );
}

export default new PaperScanService();
