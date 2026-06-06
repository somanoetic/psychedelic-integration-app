/**
 * Scan Detail Screen
 *
 * Opens when the user taps a saved scan in the journal past-entries list.
 * Shows:
 *   - The full-resolution scanned image (signed URL from Storage)
 *   - The interpretation field-by-field (or transcription for free-form)
 *   - Thematic notes
 *   - Actions: Reflect with Huxley, toggle therapist-share, delete
 *
 * Loads its own data — only takes a scanId param. Keeps the past-entries
 * list rendering cheap (no image URLs there).
 *
 * Deletion removes BOTH the storage object and the DB row, in that order.
 * If storage delete succeeds but DB delete fails we'd have a phantom row
 * pointing at nothing — we surface the DB error to the user and let them
 * retry. The opposite order (DB first then storage) would leave orphaned
 * bytes in the bucket if storage delete failed, which is worse.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  MessageCircle,
  Check,
  Trash2,
} from 'lucide-react-native';

import { supabase } from '../lib/supabase';
import paperScanService from '../lib/paperScanService';
import huxleyService from '../lib/huxleyService';
import { getWorksheet } from '../content/worksheets';
import { colors, spacing, borderRadius, typography, shadows } from '../theme/colors';

export default function ScanDetailScreen({ route, navigation }) {
  const { scanId } = route.params ?? {};

  const [loading, setLoading] = useState(true);
  const [scan, setScan] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [sharePending, setSharePending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  const worksheet = useMemo(
    () => (scan?.worksheet_id ? getWorksheet(scan.worksheet_id) : null),
    [scan?.worksheet_id],
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!scanId) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('paper_scans')
          .select('*')
          .eq('id', scanId)
          .single();
        if (error) throw error;
        if (cancelled) return;
        setScan(data);

        // Signed URL for the private bucket. 1-hour expiry is plenty for a
        // detail view; if the user comes back later we re-sign on remount.
        try {
          const url = await paperScanService.getSignedUrl(data.image_storage_path, 60 * 60);
          if (!cancelled) setImageUrl(url);
        } catch (urlErr) {
          console.warn('[ScanDetail] Failed to sign image URL:', urlErr);
        }
      } catch (err) {
        console.error('[ScanDetail] Failed to load scan:', err);
        if (!cancelled) {
          Alert.alert('Could not load scan', err?.message ?? 'Please try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [scanId]);

  async function onToggleShare() {
    if (!scan || sharePending) return;
    const newValue = !scan.therapist_share_enabled;
    setSharePending(true);
    // Optimistic — flip locally first so the chip responds instantly.
    setScan((prev) => ({ ...prev, therapist_share_enabled: newValue }));
    try {
      const { error } = await supabase
        .from('paper_scans')
        .update({ therapist_share_enabled: newValue })
        .eq('id', scan.id);
      if (error) throw error;
    } catch (err) {
      console.error('[ScanDetail] Toggle share failed:', err);
      Alert.alert('Could not update', err?.message ?? 'Please try again.');
      // Roll back the optimistic flip.
      setScan((prev) => ({ ...prev, therapist_share_enabled: !newValue }));
    } finally {
      setSharePending(false);
    }
  }

  async function onDelete() {
    if (!scan || deletePending) return;
    Alert.alert(
      'Delete this scan?',
      'The image and your transcription will be removed. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletePending(true);
            try {
              // Storage object first, then DB row. See file header for why.
              const { error: storageErr } = await supabase.storage
                .from('paper-scans')
                .remove([scan.image_storage_path]);
              if (storageErr) {
                console.warn('[ScanDetail] Storage delete failed (continuing):', storageErr);
              }
              const { error: dbErr } = await supabase
                .from('paper_scans')
                .delete()
                .eq('id', scan.id);
              if (dbErr) throw dbErr;
              navigation.goBack();
            } catch (err) {
              console.error('[ScanDetail] Delete failed:', err);
              Alert.alert('Could not delete', err?.message ?? 'Please try again.');
            } finally {
              setDeletePending(false);
            }
          },
        },
      ],
    );
  }

  function onReflect() {
    if (!scan) return;
    // Reset huxley into journal mode with a fresh history, then hand off
    // the scan's text content. huxleyService consumes pendingHandoff on the
    // next chat() call and uses it as a HANDOFF CONTEXT layer in the
    // system prompt — see lib/huxleyService.js _buildSystemPrompt for the
    // contract (plain string, one-shot, auto-cleared after first use).
    const text = buildReflectionHandoff(scan, worksheet);
    huxleyService.setMode('journal', { clearHistory: true });
    huxleyService.acceptHandoff(text);
    navigation.navigate('Journal');
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Scan" onBack={() => navigation.goBack()} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!scan) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Scan" onBack={() => navigation.goBack()} />
        <View style={styles.loadingWrap}>
          <Text style={styles.emptyText}>This scan no longer exists.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const title = worksheet?.title || 'Free-form page';
  const isWorksheet = !!worksheet;
  const fields = scan.transcription?.fields ?? {};
  const fullText = scan.transcription?.fullText ?? '';
  const therapistShareOn = !!scan.therapist_share_enabled;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Scan" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          {new Date(scan.created_at).toLocaleString(undefined, {
            weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
          })}
        </Text>

        {/* Image */}
        <View style={styles.imageWrap}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
        </View>

        {/* Transcription */}
        <Text style={styles.sectionLabel}>Transcription</Text>
        {isWorksheet ? (
          worksheet.fields.map((f) => (
            <View key={f.id} style={styles.fieldCard}>
              <Text style={styles.fieldLabel}>{f.label}</Text>
              <Text style={styles.fieldText}>
                {fields[f.id]?.trim() ? fields[f.id] : '(blank)'}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.fieldCard}>
            <Text style={styles.fieldText}>
              {fullText.trim() ? fullText : '(blank)'}
            </Text>
          </View>
        )}

        {/* Thematic notes */}
        {scan.thematic_notes?.trim() ? (
          <>
            <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>
              What I noticed
            </Text>
            <View style={styles.fieldCard}>
              <Text style={styles.fieldText}>{scan.thematic_notes}</Text>
            </View>
          </>
        ) : null}

        {/* Actions */}
        <View style={styles.actionGroup}>
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={onReflect}
            activeOpacity={0.85}
          >
            <MessageCircle size={18} color={colors.white} style={{ marginRight: 6 }} />
            <Text style={styles.primaryActionText}>Reflect with Huxley</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.shareToggle,
              therapistShareOn ? styles.shareToggleOn : styles.shareToggleOff,
              sharePending && styles.actionPending,
            ]}
            onPress={onToggleShare}
            disabled={sharePending}
            activeOpacity={0.8}
          >
            {therapistShareOn && (
              <Check size={16} color={'#4a6a4a'} style={{ marginRight: 6 }} />
            )}
            <Text
              style={[
                styles.shareToggleText,
                therapistShareOn ? styles.shareToggleTextOn : styles.shareToggleTextOff,
              ]}
            >
              {therapistShareOn ? 'Therapist share · on' : 'Therapist share · off'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteAction, deletePending && styles.actionPending]}
            onPress={onDelete}
            disabled={deletePending}
            activeOpacity={0.7}
          >
            {deletePending ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <>
                <Trash2 size={16} color={colors.error} style={{ marginRight: 6 }} />
                <Text style={styles.deleteActionText}>Delete scan</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ title, onBack }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={onBack}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <ArrowLeft size={24} color={colors.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

// Format a scan's content as a single block of text suitable for handoff to
// the journal-mode huxleyService. Worksheets get a labelled field dump;
// free-form scans get their full transcription.
function buildReflectionHandoff(scan, worksheet) {
  const header = worksheet
    ? `I just scanned in a paper worksheet ("${worksheet.title}"). Here's what I wrote:`
    : `I just scanned in a handwritten journal page. Here's what I wrote:`;

  let body;
  if (worksheet) {
    const lines = worksheet.fields.map((f) => {
      const v = scan.transcription?.fields?.[f.id]?.trim();
      return v ? `${f.label}: ${v}` : null;
    }).filter(Boolean);
    body = lines.join('\n\n');
  } else {
    body = scan.transcription?.fullText?.trim() ?? '';
  }

  const notes = scan.thematic_notes?.trim()
    ? `\n\n---\nA reflection I jotted alongside it:\n${scan.thematic_notes.trim()}`
    : '';

  return `${header}\n\n${body}${notes}`;
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

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  emptyText: { color: colors.textSecondary, fontSize: typography.base, textAlign: 'center' },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl },

  title: {
    fontSize: typography.xxl,
    fontWeight: '700',
    color: colors.charcoal,
  },
  subtitle: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
  },

  imageWrap: {
    width: '100%',
    aspectRatio: 0.77,
    backgroundColor: '#fdf8ea',
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadows.soft,
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },

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
  fieldText: {
    fontSize: typography.base,
    color: colors.charcoal,
    lineHeight: typography.base * typography.normal,
  },

  actionGroup: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  primaryActionText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: typography.base,
  },

  shareToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
  },
  shareToggleOn: { backgroundColor: 'rgba(139,157,131,0.18)' },
  shareToggleOff: { backgroundColor: colors.lightGray },
  shareToggleText: { fontSize: typography.sm, fontWeight: '600' },
  shareToggleTextOn: { color: '#4a6a4a' },
  shareToggleTextOff: { color: colors.textSecondary },

  deleteAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  deleteActionText: {
    color: colors.error,
    fontSize: typography.sm,
    fontWeight: '600',
  },
  actionPending: { opacity: 0.6 },
});
