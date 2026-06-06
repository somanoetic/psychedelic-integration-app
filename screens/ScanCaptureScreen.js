/**
 * Scan Capture Screen
 *
 * Orchestrator for the camera + interpretation pipeline. Not a "screen" in
 * the usual sense — it has no resting UI. On mount it immediately fires the
 * doc-scanner's native modal (or the image-picker fallback). When the user
 * finishes capture, this screen runs the vision interpretation in the
 * background while showing a calm progress state, then navigates to
 * ScanReview with the result.
 *
 * Flow:
 *   1. Trigger doc-scanner -> get scanned image URI (auto-cropped + dewarped).
 *   2. prepareImage() to downscale + base64.
 *   3. detectGlyph() to find an MT-... glyph if any.
 *   4. If a glyph was found AND we recognize the worksheet -> interpret as
 *      that worksheet. Otherwise -> free-form interpretation.
 *   5. Navigate to ScanReview with the prepared image + interpretation.
 *
 * Error / cancel handling:
 *   - User cancels the scanner -> goBack() to wherever they came from.
 *   - Capture, prepare, or interpret throws -> show a friendly retry sheet.
 *
 * Why not just call the scanner from the journal composer directly: the
 * interpretation step takes 3-6 seconds. We want a real screen with a calm
 * loading state for that, not a blocking spinner inside the composer.
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DocumentScanner from 'react-native-document-scanner-plugin';

import { getWorksheet } from '../content/worksheets';
import paperScanService from '../lib/paperScanService';
import { colors, spacing, borderRadius, typography, shadows } from '../theme/colors';

// Phases drive the UI. Keep them descriptive so a slow connection doesn't
// look like the app is stuck.
const PHASE = {
  CAPTURING: 'capturing',       // doc-scanner is up
  PREPARING: 'preparing',       // downscale + base64
  DETECTING_GLYPH: 'glyph',     // fast Haiku call
  INTERPRETING: 'interpreting', // primary Sonnet call
  ERROR: 'error',
};

const PHASE_COPY = {
  [PHASE.CAPTURING]: { title: 'Capturing your page', body: 'Frame the page and tap the shutter. The scanner will auto-detect the edges.' },
  [PHASE.PREPARING]: { title: 'Preparing your page', body: 'Cleaning up the image.' },
  [PHASE.DETECTING_GLYPH]: { title: 'Recognizing the page', body: 'Looking for a worksheet marker.' },
  [PHASE.INTERPRETING]: { title: 'Reading your handwriting', body: 'This usually takes a few seconds.' },
};

export default function ScanCaptureScreen({ route, navigation }) {
  // Optional: caller can hint a session_id and/or worksheet_id. We use the
  // worksheet_id only as a fallback if glyph detection finds nothing.
  const {
    sessionId = null,
    worksheetHint = null,
  } = route.params ?? {};

  const [phase, setPhase] = useState(PHASE.CAPTURING);
  const [errorMessage, setErrorMessage] = useState(null);

  // useRef to gate against double-fires from React StrictMode + the auto-run
  // useEffect. If the effect runs twice, we don't want to open two scanners.
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    runScanPipeline();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runScanPipeline() {
    try {
      // 1. CAPTURE
      setPhase(PHASE.CAPTURING);
      const scanResult = await DocumentScanner.scanDocument({
        // Single page for v1.
        maxNumDocuments: 1,
        // 'jpg' (Android default) / 'image' (iOS) both fine; the manipulator
        // re-encodes anyway.
        responseType: 'imageFilePath',
        // letImageFromGallery lets the user pick from library if they
        // already photographed the page elsewhere.
        letUserAdjustCrop: true,
      });

      // User canceled. The plugin's contract varies by platform but a
      // missing/empty scannedImages array is the universal "nothing happened."
      const uri = scanResult?.scannedImages?.[0];
      if (!uri) {
        navigation.goBack();
        return;
      }

      // 2. PREPARE
      setPhase(PHASE.PREPARING);
      const prepared = await paperScanService.prepareImage(uri);

      // 3. GLYPH DETECTION (fast model, short response)
      setPhase(PHASE.DETECTING_GLYPH);
      const glyph = await paperScanService.detectGlyph(prepared.base64, prepared.mediaType);

      // Glyph result -> known worksheet? Caller hint as fallback. Null -> free-form.
      let worksheet = null;
      if (glyph) {
        worksheet = getWorksheet(glyph.worksheetId);
        // If the glyph version mismatches what we have shipped, we still use
        // the current worksheet config but flag it in the raw output for
        // diagnostics. The data model permits this — worksheet_version stores
        // what the glyph actually said, not what the app currently ships.
      } else if (worksheetHint) {
        worksheet = getWorksheet(worksheetHint);
      }

      // 4. INTERPRET
      setPhase(PHASE.INTERPRETING);
      const interpretation = await paperScanService.interpretScan({
        imageBase64: prepared.base64,
        mediaType: prepared.mediaType,
        worksheet,
      });

      // 5. ROUTE TO REVIEW. We pass the PREPARED uri (not the raw scanner uri)
      // so the review screen and saveScan upload the same bytes Claude saw.
      navigation.replace('ScanReview', {
        sessionId,
        imageUri: prepared.uri,
        mediaType: prepared.mediaType,
        worksheetId: worksheet?.id ?? null,
        worksheetVersionFromGlyph: glyph?.version ?? null,
        interpretation,
      });
    } catch (err) {
      console.error('[ScanCapture] Pipeline failed:', err);
      setErrorMessage(err?.message ?? 'Something went wrong.');
      setPhase(PHASE.ERROR);
    }
  }

  function onRetry() {
    setErrorMessage(null);
    ranRef.current = false;
    setPhase(PHASE.CAPTURING);
    runScanPipeline();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        {phase === PHASE.ERROR ? (
          <ErrorPanel
            message={errorMessage}
            onRetry={onRetry}
            onCancel={() => navigation.goBack()}
          />
        ) : (
          <ProgressPanel phase={phase} />
        )}
      </View>
    </SafeAreaView>
  );
}

function ProgressPanel({ phase }) {
  const copy = PHASE_COPY[phase] ?? PHASE_COPY[PHASE.PREPARING];
  return (
    <View style={styles.panel}>
      <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: spacing.lg }} />
      <Text style={styles.panelTitle}>{copy.title}</Text>
      <Text style={styles.panelBody}>{copy.body}</Text>
    </View>
  );
}

function ErrorPanel({ message, onRetry, onCancel }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.errorTitle}>We couldn't read that page</Text>
      <Text style={styles.panelBody}>{message}</Text>
      <View style={styles.errorActions}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.75}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.75}>
          <Text style={styles.retryButtonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  panel: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    width: '100%',
    maxWidth: 360,
    ...shadows.soft,
  },
  panelTitle: {
    fontSize: typography.xl,
    fontWeight: '600',
    color: colors.charcoal,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  panelBody: {
    fontSize: typography.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.base * typography.relaxed,
  },
  errorTitle: {
    fontSize: typography.xl,
    fontWeight: '600',
    color: colors.charcoal,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border ?? colors.lightGray,
    backgroundColor: colors.surface,
  },
  cancelButtonText: { color: colors.primary, fontWeight: '600' },
  retryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  retryButtonText: { color: colors.white, fontWeight: '600' },
});
