// ADR-009 Phase B2: contributor-facing screen for submitting exercises to
// the public library. Two modes:
//
//   1. List mode (default): shows the contributor's past submissions with
//      review status, and a "Submit a New Exercise" CTA.
//   2. Form mode: title, attribution, category, duration, instructions,
//      dynamic steps[]. Doubles as the revise-after-needs_revision path
//      when launched from a needs_revision row.
//
// Gate: only approved contributors (role=therapist & verified) or admins
// can reach the form. Other users see a soft empty state with a CTA back
// to the application flow.

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Lock,
  X,
  Plus,
  ArrowLeft,
  PlusCircle,
  ChevronRight,
  Inbox,
} from 'lucide-react-native';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme/colors';
import { exerciseCategories } from '../content/exercises-comprehensive';
import contributedExerciseService from '../lib/contributedExerciseService';
import userRoleService from '../lib/userRoleService';

const CATEGORY_OPTIONS = exerciseCategories.filter((c) => c.id !== 'all');

const STATUS_DISPLAY = {
  pending: { label: 'Pending review', color: colors.warning, bg: '#fef3c7' },
  needs_revision: { label: 'Needs revision', color: colors.warning, bg: '#fef3c7' },
  approved: { label: 'Approved', color: colors.success, bg: '#d1fae5' },
  rejected: { label: 'Rejected', color: colors.error, bg: '#fee2e2' },
};

const formatDate = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch { return iso; }
};

const emptyForm = (attribution = '') => ({
  title: '',
  attribution_name: attribution,
  category: 'breathing',
  duration: '5',
  instructions: '',
  steps: [''],
});

const ContributorExerciseSubmissionScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [defaultAttribution, setDefaultAttribution] = useState('');
  const [submissions, setSubmissions] = useState([]);

  const [mode, setMode] = useState('list'); // 'list' | 'form'
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const role = await userRoleService.getCurrentUserRole();
      const verification = await userRoleService.getVerificationStatus();
      const approved =
        (role?.role === 'contributor' && role?.verified === true) ||
        (role?.role === 'admin' && role?.verified === true);

      setHasAccess(approved);
      const attribution = verification?.data?.full_name || '';
      setDefaultAttribution(attribution);

      if (approved) {
        const result = await contributedExerciseService.listMySubmissions();
        if (result.success) {
          setSubmissions(result.data);
        }
      }
    } catch (error) {
      console.error('Error loading submission screen:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const startNewSubmission = () => {
    setEditingId(null);
    setForm(emptyForm(defaultAttribution));
    setMode('form');
  };

  const startRevise = (row) => {
    setEditingId(row.id);
    setForm({
      title: row.title || '',
      attribution_name: row.attribution_name || defaultAttribution,
      category: row.category || 'breathing',
      duration: row.duration != null ? String(row.duration) : '5',
      instructions: row.instructions || '',
      steps: Array.isArray(row.steps) && row.steps.length > 0 ? row.steps : [''],
    });
    setMode('form');
  };

  const cancelForm = () => {
    setMode('list');
    setEditingId(null);
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateStep = (index, value) => {
    setForm((prev) => {
      const next = [...prev.steps];
      next[index] = value;
      return { ...prev, steps: next };
    });
  };

  const addStep = () => {
    setForm((prev) => ({ ...prev, steps: [...prev.steps, ''] }));
  };

  const removeStep = (index) => {
    setForm((prev) => {
      if (prev.steps.length <= 1) return prev;
      return { ...prev, steps: prev.steps.filter((_, i) => i !== index) };
    });
  };

  const handleSubmit = async () => {
    const payload = {
      title: form.title,
      attribution_name: form.attribution_name,
      category: form.category,
      instructions: form.instructions,
      steps: form.steps.map((s) => s.trim()).filter(Boolean),
      duration: parseInt(form.duration, 10) || 0,
    };

    setSubmitting(true);
    const result = editingId
      ? await contributedExerciseService.reviseSubmission(editingId, payload)
      : await contributedExerciseService.submitExercise(payload);
    setSubmitting(false);

    if (!result.success) {
      Alert.alert('Could not submit', result.error || 'Please check the form and try again.');
      return;
    }

    Alert.alert(
      editingId ? 'Submission updated' : 'Submission received',
      editingId
        ? "Your revised exercise is back in the review queue. We'll let you know when it's reviewed."
        : "Thanks for contributing. We'll review your exercise and publish it to the library once approved.",
      [{ text: 'OK' }]
    );

    setMode('list');
    setEditingId(null);
    setForm(emptyForm(defaultAttribution));
    loadData();
  };

  const handleDelete = (row) => {
    Alert.alert(
      'Delete this submission?',
      'This will remove your submission from the queue. You can submit a new one any time.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await contributedExerciseService.deleteSubmission(row.id);
            if (!result.success) {
              Alert.alert('Could not delete', result.error || 'Please try again.');
              return;
            }
            loadData();
          },
        },
      ],
    );
  };

  const renderBadge = (status) => {
    const cfg = STATUS_DISPLAY[status] || STATUS_DISPLAY.pending;
    return (
      <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
        <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={gradients.standard} start={gradients.standardStart} end={gradients.standardEnd} style={{ flex: 1 }}>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.centerArea}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!hasAccess) {
    return (
      <LinearGradient colors={gradients.standard} start={gradients.standardStart} end={gradients.standardEnd} style={{ flex: 1 }}>
        <SafeAreaView style={styles.container} edges={['top']}>
          <Header navigation={navigation} title="Submit an Exercise" />
          <View style={styles.centerArea}>
            <Lock size={42} color={colors.textLight} strokeWidth={1.5} />
            <Text style={styles.centerTitle}>Approved contributors only</Text>
            <Text style={styles.centerText}>
              Submitting exercises is open to approved contributors. Apply via Contributor Tools and we'll review your application.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('ContributorApplication')}
            >
              <Text style={styles.primaryButtonText}>Open application</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (mode === 'form') {
    return (
      <LinearGradient colors={gradients.standard} start={gradients.standardStart} end={gradients.standardEnd} style={{ flex: 1 }}>
        <SafeAreaView style={styles.container} edges={['top']}>
          <Header
            navigation={navigation}
            title={editingId ? 'Revise Exercise' : 'New Exercise'}
            onBack={cancelForm}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
            style={{ flex: 1 }}
          >
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.formContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              automaticallyAdjustKeyboardInsets
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.helperText}>
                Submissions are reviewed before they appear in the library. Once published, contributions are attributed to you and shown with a "reviewed for safety" disclaimer.
              </Text>

              <Field label="Title *">
                <TextInput
                  style={styles.input}
                  value={form.title}
                  onChangeText={(v) => updateField('title', v)}
                  placeholder="e.g. Three-Part Breath for Grounding"
                  placeholderTextColor={colors.textLight}
                  maxLength={200}
                  spellCheck={true}
                  autoCorrect={true}
                  autoCapitalize="sentences"
                />
              </Field>

              <Field label="Attribution name *" hint="How your name appears on the exercise.">
                <TextInput
                  style={styles.input}
                  value={form.attribution_name}
                  onChangeText={(v) => updateField('attribution_name', v)}
                  placeholder="e.g. Jane Doe, LMFT"
                  placeholderTextColor={colors.textLight}
                  maxLength={120}
                />
              </Field>

              <Field label="Category *">
                <View style={styles.categoryGrid}>
                  {CATEGORY_OPTIONS.map((opt) => {
                    const active = form.category === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        onPress={() => updateField('category', opt.id)}
                        style={[styles.categoryChip, active && { backgroundColor: opt.color }]}
                      >
                        <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                          {opt.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Field>

              <Field label="Duration (minutes) *">
                <TextInput
                  style={styles.input}
                  value={form.duration}
                  onChangeText={(v) => updateField('duration', v.replace(/[^0-9]/g, ''))}
                  placeholder="5"
                  placeholderTextColor={colors.textLight}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </Field>

              <Field label="Purpose / Instructions *" hint="One paragraph on what this practice is for and what it does.">
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={form.instructions}
                  onChangeText={(v) => updateField('instructions', v)}
                  placeholder="e.g. A grounding practice for users in a post-session activated state. Combines breath and somatic anchoring to bring attention back to the body."
                  placeholderTextColor={colors.textLight}
                  multiline
                  maxLength={2000}
                  spellCheck={true}
                  autoCorrect={true}
                  autoCapitalize="sentences"
                />
              </Field>

              <Field label="Steps *" hint="Add each step the user should follow, one at a time.">
                {form.steps.map((step, idx) => (
                  <View key={idx} style={styles.stepRow}>
                    <Text style={styles.stepNumber}>{idx + 1}.</Text>
                    <TextInput
                      style={[styles.input, styles.stepInput]}
                      value={step}
                      onChangeText={(v) => updateStep(idx, v)}
                      placeholder={`Step ${idx + 1}`}
                      placeholderTextColor={colors.textLight}
                      multiline
                      spellCheck={true}
                      autoCorrect={true}
                      autoCapitalize="sentences"
                    />
                    {form.steps.length > 1 && (
                      <TouchableOpacity
                        onPress={() => removeStep(idx)}
                        style={styles.stepRemove}
                      >
                        <X size={18} color={colors.textSecondary} strokeWidth={2} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                <TouchableOpacity onPress={addStep} style={styles.addStepButton}>
                  <Plus size={18} color={colors.primary} strokeWidth={2} />
                  <Text style={styles.addStepText}>Add step</Text>
                </TouchableOpacity>
              </Field>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.ghostButton, styles.flexButton]}
                  onPress={cancelForm}
                  disabled={submitting}
                >
                  <Text style={styles.ghostButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryButton, styles.flexButton]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color={colors.textInverse} />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {editingId ? 'Resubmit' : 'Submit for review'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // list mode
  return (
    <LinearGradient colors={gradients.standard} start={gradients.standardStart} end={gradients.standardEnd} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header navigation={navigation} title="Submit an Exercise" />
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadData(); }}
              tintColor={colors.primary}
            />
          }
        >
          <TouchableOpacity style={styles.newCard} onPress={startNewSubmission}>
            <PlusCircle size={28} color={colors.primary} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={styles.newCardTitle}>Submit a new exercise</Text>
              <Text style={styles.newCardSubtitle}>
                Reviewed before going live. Published with attribution and a safety disclaimer.
              </Text>
            </View>
            <ChevronRight size={24} color={colors.textLight} strokeWidth={2} />
          </TouchableOpacity>

          <Text style={styles.sectionHeader}>Your submissions</Text>

          {submissions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Inbox size={36} color={colors.textLight} strokeWidth={1.5} />
              <Text style={styles.emptyCardText}>
                Nothing here yet. Tap "Submit a new exercise" to contribute your first one.
              </Text>
            </View>
          ) : (
            submissions.map((row) => (
              <View key={row.id} style={styles.subCard}>
                <View style={styles.subCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subCardTitle}>{row.title}</Text>
                    <Text style={styles.subCardMeta}>
                      {row.category} · Submitted {formatDate(row.submitted_at)}
                    </Text>
                  </View>
                  {renderBadge(row.review_status)}
                </View>

                {row.review_notes ? (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesLabel}>Reviewer note</Text>
                    <Text style={styles.notesText}>{row.review_notes}</Text>
                  </View>
                ) : null}

                <View style={styles.subCardActions}>
                  {(row.review_status === 'pending' || row.review_status === 'needs_revision') && (
                    <>
                      <TouchableOpacity
                        onPress={() => startRevise(row)}
                        style={[styles.ghostButton, styles.smallButton]}
                      >
                        <Text style={styles.ghostButtonText}>
                          {row.review_status === 'needs_revision' ? 'Revise & resubmit' : 'Edit'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(row)}
                        style={[styles.ghostDangerButton, styles.smallButton]}
                      >
                        <Text style={styles.ghostDangerButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ))
          )}

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const Header = ({ navigation, title, onBack }) => (
  <View style={styles.header}>
    <TouchableOpacity
      onPress={onBack ? onBack : () => navigation.goBack()}
      style={styles.headerButton}
    >
      <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>{title}</Text>
    <View style={styles.headerButton} />
  </View>
);

const Field = ({ label, hint, children }) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },

  content: { flex: 1 },
  listContent: { padding: spacing.md },
  // Bottom padding is intentionally large so the last fields (steps,
  // submit row) can scroll above the soft keyboard on both platforms.
  // Combined with KeyboardAvoidingView this keeps the active TextInput
  // visible while typing.
  formContent: { padding: spacing.md, paddingBottom: 320 },

  centerArea: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: spacing.lg, gap: spacing.sm,
  },
  centerTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: spacing.sm },
  centerText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  helperText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: spacing.md,
  },

  newCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.soft,
  },
  newCardTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  newCardSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },

  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },

  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.soft,
  },
  emptyCardText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },

  subCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.soft,
  },
  subCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  subCardTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  subCardMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  subCardActions: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm, flexWrap: 'wrap' },

  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  notesBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: '#fef9e7',
    borderRadius: borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  notesLabel: {
    fontSize: 11, fontWeight: '600', color: '#78350f',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  notesText: { fontSize: 13, color: '#78350f', marginTop: 4, lineHeight: 18 },

  fieldGroup: { marginBottom: spacing.md },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 4 },
  fieldHint: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.xs, lineHeight: 16 },

  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.text,
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  categoryChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  categoryChipText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  categoryChipTextActive: { color: colors.textInverse },

  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, marginBottom: spacing.xs },
  stepNumber: { fontSize: 14, color: colors.textSecondary, paddingTop: spacing.sm + 2, width: 22 },
  stepInput: { flex: 1, minHeight: 44 },
  stepRemove: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.lightGray,
    marginTop: spacing.xs,
  },
  addStepButton: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: spacing.xs, alignSelf: 'flex-start',
  },
  addStepText: { fontSize: 14, color: colors.primary, fontWeight: '500' },

  formActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  flexButton: { flex: 1 },
  smallButton: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },

  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: colors.textInverse, fontSize: 14, fontWeight: '600' },
  ghostButton: {
    backgroundColor: colors.lightGray,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButtonText: { color: colors.text, fontSize: 14, fontWeight: '500' },
  ghostDangerButton: {
    backgroundColor: '#fee2e2',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostDangerButtonText: { color: colors.error, fontSize: 14, fontWeight: '500' },
});

export default ContributorExerciseSubmissionScreen;
