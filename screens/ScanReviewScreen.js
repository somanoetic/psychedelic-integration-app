/**
 * Scan Review Screen
 *
 * After capture + interpretation, show the user:
 *   1. The scanned image (top)
 *   2. What Claude read, field-by-field (worksheet) or as a single block
 *      (free-form). Each block is editable inline.
 *   3. A sticky save bar at the bottom (Re-scan / Save to journal).
 *
 * The user's corrections overwrite the transcription before save. The
 * original image + raw Claude output are persisted alongside, so we never
 * lose what the model originally said even after the user edits.
 *
 * Free-form recovery:
 *   If interpretation arrived with no worksheet (free-form mode), the user
 *   can re-assign it to a recognized worksheet via the "Not a worksheet?"
 *   picker at the top — useful for scans where the glyph was unreadable.
 *   v1 keeps this minimal: a single "Pick a worksheet" link that opens a
 *   modal-style worksheet picker. Not built yet; flagged inline.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, RotateCcw, Check } from 'lucide-react-native';

import { getWorksheet } from '../content/worksheets';
import paperScanService from '../lib/paperScanService';
import { supabase } from '../lib/supabase';
import { colors, spacing, borderRadius, typography, shadows } from '../theme/colors';

export default function ScanReviewScreen({ route, navigation }) {
  const {
    sessionId = null,
    imageUri,
    mediaType,
    worksheetId,
    worksheetVersionFromGlyph,
    interpretation,
  } = route.params ?? {};

  const worksheet = useMemo(
    () => (worksheetId ? getWorksheet(worksheetId) : null),
    [worksheetId],
  );

  // Editable local copies of what Claude returned. The user can correct
  // field-by-field (worksheet mode) or rewrite the whole transcription
  // (free-form mode). Thematic notes are editable in both modes.
  const [editedFields, setEditedFields] = useState(
    interpretation?.transcription?.fields ?? {},
  );
  const [editedFreeText, setEditedFreeText] = useState(
    interpretation?.transcription?.fullText ?? '',
  );
  const [editedThematicNotes, setEditedThematicNotes] = useState(
    interpretation?.thematicNotes ?? '',
  );
  const [therapistShare, setTherapistShare] = useState(true);
  const [saving, setSaving] = useState(false);

  const isWorksheet = !!worksheet;
  const isFreeForm = !worksheet;

  function setFieldValue(fieldId, value) {
    setEditedFields((prev) => ({ ...prev, [fieldId]: value }));
  }

  async function onSave() {
    if (saving) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You need to be signed in to save a scan.');

      const correctedTranscription = isWorksheet
        ? { fields: editedFields }
        : { fullText: editedFreeText };

      await paperScanService.saveScan({
        userId: user.id,
        sessionId,
        imageUri,
        mediaType: mediaType ?? 'image/jpeg',
        worksheet,
        interpretation,
        correctedTranscription,
        thematicNotes: editedThematicNotes,
        therapistShareEnabled: therapistShare,
      });

      // Pop both Review + Capture off the stack so back goes to wherever the
      // user opened the camera from.
      navigation.popToTop();
    } catch (err) {
      console.error('[ScanReview] save failed:', err);
      Alert.alert('Could not save', err?.message ?? 'Please try again.');
      setSaving(false);
    }
  }

  function onRescan() {
    if (saving) return;
    // Replace Review with a fresh Capture run. The previous prepared image
    // stays in cache but is no longer referenced.
    navigation.replace('ScanCapture', { sessionId, worksheetHint: worksheetId });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review scan</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title row + glyph chip */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>
              {isWorksheet ? worksheet.title : 'Free-form page'}
            </Text>
            {worksheetVersionFromGlyph && (
              <View style={styles.glyphChip}>
                <Text style={styles.glyphChipText}>
                  Recognized · v{worksheetVersionFromGlyph}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.subtitle}>Scanned just now</Text>

          {/* Image preview */}
          <View style={styles.imageWrap}>
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="contain"
            />
          </View>

          {/* Transcription section */}
          <Text style={styles.sectionLabel}>What I read in your page</Text>

          {isWorksheet ? (
            worksheet.fields.map((f) => (
              <FieldCard
                key={f.id}
                label={f.label}
                value={editedFields[f.id] ?? ''}
                placeholder="(blank)"
                multiline={f.kind !== 'date'}
                onChange={(v) => setFieldValue(f.id, v)}
              />
            ))
          ) : (
            <FieldCard
              label="Transcription"
              value={editedFreeText}
              placeholder="(blank)"
              multiline
              onChange={setEditedFreeText}
            />
          )}

          {/* Thematic notes */}
          {(editedThematicNotes || isWorksheet || isFreeForm) && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>
                What I noticed
              </Text>
              <FieldCard
                label="Thematic notes"
                value={editedThematicNotes}
                placeholder="(no notes)"
                multiline
                onChange={setEditedThematicNotes}
              />
            </>
          )}

          {/* Therapist share toggle */}
          <TouchableOpacity
            style={[
              styles.therapistToggle,
              therapistShare ? styles.therapistToggleOn : styles.therapistToggleOff,
            ]}
            onPress={() => setTherapistShare((v) => !v)}
            activeOpacity={0.8}
          >
            {therapistShare && <Check size={16} color={'#4a6a4a'} style={{ marginRight: 6 }} />}
            <Text style={[
              styles.therapistToggleText,
              therapistShare ? styles.therapistToggleTextOn : styles.therapistToggleTextOff,
            ]}>
              {therapistShare ? 'Therapist share · on' : 'Therapist share · off'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Sticky save bar */}
        <View style={styles.saveBar}>
          <TouchableOpacity
            style={styles.rescanButton}
            onPress={onRescan}
            disabled={saving}
            activeOpacity={0.75}
          >
            <RotateCcw size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.rescanText}>Re-scan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={onSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.saveText}>Save to journal</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FieldCard({ label, value, placeholder, multiline, onChange }) {
  return (
    <View style={styles.fieldCard}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
        value={value}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        onChangeText={onChange}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.lightGray,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.lg,
    fontWeight: '600',
    color: colors.charcoal,
  },
  headerSpacer: { width: 24 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xl },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: typography.xxl,
    fontWeight: '700',
    color: colors.charcoal,
    flex: 1,
  },
  glyphChip: {
    backgroundColor: 'rgba(139,157,131,0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  glyphChipText: {
    fontSize: typography.xs,
    color: '#4a6a4a',
    fontWeight: '600',
  },
  subtitle: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
  },

  imageWrap: {
    width: '100%',
    aspectRatio: 0.77, // letter-portrait-ish; image is contain-fit anyway
    backgroundColor: '#fdf8ea',
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadows.soft,
  },
  image: { width: '100%', height: '100%' },

  sectionLabel: {
    fontSize: typography.xs,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },

  fieldCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
    ...shadows.soft,
  },
  fieldLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  fieldInput: {
    fontSize: typography.base,
    color: colors.charcoal,
    padding: 0,
    minHeight: 24,
  },
  fieldInputMultiline: {
    minHeight: 72,
    lineHeight: typography.base * typography.normal,
  },

  therapistToggle: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    marginTop: spacing.lg,
  },
  therapistToggleOn: { backgroundColor: 'rgba(139,157,131,0.18)' },
  therapistToggleOff: { backgroundColor: colors.lightGray },
  therapistToggleText: { fontSize: typography.sm, fontWeight: '600' },
  therapistToggleTextOn: { color: '#4a6a4a' },
  therapistToggleTextOff: { color: colors.textSecondary },

  saveBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.lightGray,
  },
  rescanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    backgroundColor: colors.surface,
  },
  rescanText: { color: colors.primary, fontWeight: '600' },
  saveButton: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveText: { color: colors.white, fontWeight: '700', fontSize: typography.base },
});
