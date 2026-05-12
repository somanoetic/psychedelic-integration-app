// ADR-009 Phase B2: admin-side review queue for contributor-submitted
// exercises. Mirrors the structure of AdminApplicationReviewScreen:
//
//   - Status tabs (pending / needs_revision / approved / rejected)
//   - Expandable cards showing the full exercise (title, attribution,
//     category, duration, instructions, steps)
//   - Actions: Approve & publish / Request revision / Reject
//   - Reject + request-revision require notes (shown to the contributor)
//
// Admin gate: checked on mount; blocks render if non-admin reaches the
// route (RLS on the underlying table also enforces this).

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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme/colors';
import contributedExerciseService from '../lib/contributedExerciseService';
import userRoleService from '../lib/userRoleService';
import { exerciseCategories } from '../content/exercises-comprehensive';

const STATUS_FILTERS = [
  { key: 'pending', label: 'Pending' },
  { key: 'needs_revision', label: 'Revision' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const STATUS_BADGE = {
  pending: { label: 'Pending', color: colors.warning, bg: '#fef3c7' },
  needs_revision: { label: 'Revision', color: colors.warning, bg: '#fef3c7' },
  approved: { label: 'Approved', color: colors.success, bg: '#d1fae5' },
  rejected: { label: 'Rejected', color: colors.error, bg: '#fee2e2' },
};

const categoryLabel = (id) => {
  const found = exerciseCategories.find((c) => c.id === id);
  return found ? found.name : id;
};

const formatDate = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch { return iso; }
};

const AdminContentReviewScreen = ({ navigation }) => {
  const [statusFilter, setStatusFilter] = useState('pending');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [actionState, setActionState] = useState(null); // { id, type: 'reject'|'revision', notes }
  const [submitting, setSubmitting] = useState(false);

  const loadSubmissions = useCallback(async (filter) => {
    setLoading(true);
    const result = await contributedExerciseService.listForReview(filter);
    if (!result.success) {
      Alert.alert('Failed to load', result.error || 'Could not load submissions.');
      setSubmissions([]);
    } else {
      setSubmissions(result.data);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  const checkAccessAndLoad = useCallback(async () => {
    const isAdmin = await userRoleService.isAdmin();
    if (!isAdmin) {
      Alert.alert(
        'Access Denied',
        'You must be an admin to view this screen.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
        { cancelable: false },
      );
      return;
    }
    await loadSubmissions(statusFilter);
  }, [statusFilter, navigation, loadSubmissions]);

  useEffect(() => { checkAccessAndLoad(); }, [checkAccessAndLoad]);

  const onRefresh = () => {
    setRefreshing(true);
    loadSubmissions(statusFilter);
  };

  const handleApprove = (row) => {
    Alert.alert(
      'Publish this exercise?',
      `Approve "${row.title}" by ${row.attribution_name} and publish it to the library?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve & publish',
          onPress: async () => {
            setSubmitting(true);
            const result = await contributedExerciseService.approveSubmission(row.id);
            setSubmitting(false);
            if (result.success) {
              setExpandedId(null);
              loadSubmissions(statusFilter);
            } else {
              Alert.alert('Failed', result.error || 'Could not approve submission.');
            }
          },
        },
      ],
    );
  };

  const startNotesAction = (id, type) => {
    setActionState({ id, type, notes: '' });
  };

  const cancelNotesAction = () => setActionState(null);

  const submitNotesAction = async () => {
    if (!actionState) return;
    const { id, type, notes } = actionState;
    if (!notes.trim()) {
      Alert.alert('Notes required', 'Add a short note explaining the decision.');
      return;
    }
    setSubmitting(true);
    const fn = type === 'reject'
      ? contributedExerciseService.rejectSubmission.bind(contributedExerciseService)
      : contributedExerciseService.requestRevision.bind(contributedExerciseService);
    const result = await fn(id, notes);
    setSubmitting(false);
    if (result.success) {
      setActionState(null);
      setExpandedId(null);
      loadSubmissions(statusFilter);
    } else {
      Alert.alert('Failed', result.error || 'Could not update submission.');
    }
  };

  const renderBadge = (status) => {
    const b = STATUS_BADGE[status] || STATUS_BADGE.pending;
    return (
      <View style={[styles.badge, { backgroundColor: b.bg }]}>
        <Text style={[styles.badgeText, { color: b.color }]}>{b.label}</Text>
      </View>
    );
  };

  const renderCard = (row) => {
    const expanded = expandedId === row.id;
    const inNotesFlow = actionState?.id === row.id;
    const steps = Array.isArray(row.steps) ? row.steps : [];

    return (
      <View key={row.id} style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setExpandedId(expanded ? null : row.id)}
          style={styles.cardHeader}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{row.title}</Text>
            <Text style={styles.cardMeta}>
              By {row.attribution_name} · {categoryLabel(row.category)} · {row.duration} min
            </Text>
            <Text style={styles.cardSubmittedAt}>Submitted {formatDate(row.submitted_at)}</Text>
          </View>
          <View style={styles.cardHeaderRight}>
            {renderBadge(row.review_status)}
            <MaterialIcons
              name={expanded ? 'expand-less' : 'expand-more'}
              size={24}
              color={colors.textLight}
            />
          </View>
        </TouchableOpacity>

        {expanded && (
          <View style={styles.cardBody}>
            <Field label="Purpose" value={row.instructions} />

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Steps</Text>
              {steps.length === 0 ? (
                <Text style={styles.fieldValue}>—</Text>
              ) : (
                steps.map((step, idx) => (
                  <View key={idx} style={styles.stepRow}>
                    <View style={styles.stepBullet}>
                      <Text style={styles.stepBulletText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))
              )}
            </View>

            {row.review_notes ? (
              <View style={styles.priorNotes}>
                <Text style={styles.priorNotesLabel}>Prior review notes</Text>
                <Text style={styles.priorNotesText}>{row.review_notes}</Text>
                {row.reviewed_at ? (
                  <Text style={styles.priorNotesMeta}>Reviewed {formatDate(row.reviewed_at)}</Text>
                ) : null}
              </View>
            ) : null}

            {inNotesFlow ? (
              <View style={styles.notesPanel}>
                <Text style={styles.notesLabel}>
                  {actionState.type === 'reject'
                    ? (row.review_status === 'approved' ? 'Reason for unpublishing' : 'Reason for rejection')
                    : (row.review_status === 'approved' ? 'What needs revising?' : 'What needs revising?')}
                </Text>
                <TextInput
                  style={styles.notesInput}
                  multiline
                  numberOfLines={4}
                  value={actionState.notes}
                  onChangeText={(t) => setActionState({ ...actionState, notes: t })}
                  placeholder={actionState.type === 'reject'
                    ? (row.review_status === 'approved'
                        ? 'Shown to the contributor. Removes the exercise from the public library.'
                        : 'Shown to the contributor on their submissions screen.')
                    : (row.review_status === 'approved'
                        ? 'Unpublishes the exercise and asks the contributor to revise.'
                        : 'Tell the contributor what to change before resubmitting.')}
                  placeholderTextColor={colors.textLight}
                  editable={!submitting}
                />
                <View style={styles.notesActions}>
                  <TouchableOpacity
                    onPress={cancelNotesAction}
                    style={[styles.btn, styles.btnGhost]}
                    disabled={submitting}
                  >
                    <Text style={styles.btnGhostText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={submitNotesAction}
                    style={[styles.btn, actionState.type === 'reject' ? styles.btnDanger : styles.btnWarn]}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color={colors.textInverse} />
                    ) : (
                      <Text style={styles.btnPrimaryText}>
                        {actionState.type === 'reject'
                          ? (row.review_status === 'approved' ? 'Confirm Unpublish' : 'Confirm Rejection')
                          : (row.review_status === 'approved' ? 'Unpublish & Request Revision' : 'Request Revision')}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : row.review_status === 'approved' ? (
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => startNotesAction(row.id, 'revision')}
                  style={[styles.btn, styles.btnGhost]}
                  disabled={submitting}
                >
                  <MaterialIcons name="edit" size={18} color={colors.text} />
                  <Text style={styles.btnGhostText}>Unpublish for revision</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => startNotesAction(row.id, 'reject')}
                  style={[styles.btn, styles.btnGhostDanger]}
                  disabled={submitting}
                >
                  <MaterialIcons name="block" size={18} color={colors.error} />
                  <Text style={styles.btnGhostDangerText}>Unpublish & reject</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => handleApprove(row)}
                  style={[styles.btn, styles.btnPrimary]}
                  disabled={submitting}
                >
                  <MaterialIcons name="check" size={18} color={colors.textInverse} />
                  <Text style={styles.btnPrimaryText}>Approve & Publish</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => startNotesAction(row.id, 'revision')}
                  style={[styles.btn, styles.btnGhost]}
                  disabled={submitting}
                >
                  <Text style={styles.btnGhostText}>Request Revision</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => startNotesAction(row.id, 'reject')}
                  style={[styles.btn, styles.btnGhostDanger]}
                  disabled={submitting}
                >
                  <Text style={styles.btnGhostDangerText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={gradients.standard}
      start={gradients.standardStart}
      end={gradients.standardEnd}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Exercise Submissions</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.tabsRow}>
          {STATUS_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setStatusFilter(f.key)}
              style={[styles.tab, statusFilter === f.key && styles.tabActive]}
            >
              <Text style={[styles.tabText, statusFilter === f.key && styles.tabTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.centerArea}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.centerText}>Loading submissions...</Text>
          </View>
        ) : submissions.length === 0 ? (
          <View style={styles.centerArea}>
            <MaterialIcons name="inbox" size={48} color={colors.textLight} />
            <Text style={styles.centerText}>
              No {STATUS_BADGE[statusFilter]?.label.toLowerCase() || ''} submissions
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
          >
            {submissions.map(renderCard)}
            <View style={{ height: spacing.xxl }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const Field = ({ label, value }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value || '—'}</Text>
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
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },

  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  tab: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: colors.textInverse },

  list: { flex: 1 },
  listContent: { padding: spacing.md },

  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    ...shadows.soft,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  cardMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  cardSubmittedAt: { fontSize: 12, color: colors.textLight, marginTop: 2 },

  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  cardBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: spacing.sm,
  },
  field: { marginTop: spacing.sm },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldValue: { fontSize: 14, color: colors.text, marginTop: 2, lineHeight: 20 },

  stepRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs, alignItems: 'flex-start' },
  stepBullet: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  stepBulletText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  stepText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },

  priorNotes: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: '#fef9e7',
    borderRadius: borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  priorNotesLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  priorNotesText: { fontSize: 13, color: colors.text, marginTop: 4, lineHeight: 18 },
  priorNotesMeta: { fontSize: 11, color: colors.textLight, marginTop: 4, fontStyle: 'italic' },

  actions: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.md, flexWrap: 'wrap' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryText: { color: colors.textInverse, fontSize: 14, fontWeight: '600' },
  btnGhost: { backgroundColor: colors.lightGray },
  btnGhostText: { color: colors.text, fontSize: 14, fontWeight: '500' },
  btnGhostDanger: { backgroundColor: '#fee2e2' },
  btnGhostDangerText: { color: colors.error, fontSize: 14, fontWeight: '500' },
  btnWarn: { backgroundColor: colors.warning },
  btnDanger: { backgroundColor: colors.error },

  notesPanel: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
  },
  notesLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  notesInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: 14,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  notesActions: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm, justifyContent: 'flex-end' },

  centerArea: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.sm },
  centerText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
});

export default AdminContentReviewScreen;
