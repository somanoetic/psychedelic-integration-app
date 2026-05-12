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
import userRoleService from '../lib/userRoleService';

const STATUS_FILTERS = [
  { key: 'pending', label: 'Pending' },
  { key: 'needs_more_info', label: 'Awaiting' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const STATUS_BADGE = {
  pending: { label: 'Pending', color: colors.warning, bg: '#fef3c7' },
  needs_more_info: { label: 'Needs Info', color: colors.warning, bg: '#fef3c7' },
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

const AdminApplicationReviewScreen = ({ navigation }) => {
  const [statusFilter, setStatusFilter] = useState('pending');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [actionState, setActionState] = useState(null); // { id, type: 'reject'|'needs_more_info', notes }
  const [submitting, setSubmitting] = useState(false);

  const checkAccessAndLoad = useCallback(async () => {
    const isAdmin = await userRoleService.isAdmin();
    if (!isAdmin) {
      Alert.alert('Access Denied', 'You must be an admin to view this screen.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ], { cancelable: false });
      return;
    }
    await loadApplications(statusFilter);
  }, [statusFilter, navigation]);

  useEffect(() => { checkAccessAndLoad(); }, [checkAccessAndLoad]);

  const loadApplications = async (filter) => {
    setLoading(true);
    const result = await userRoleService.listApplications(filter);
    if (!result.success) {
      Alert.alert('Failed to load', result.error || 'Could not load applications.');
      setApplications([]);
    } else {
      setApplications(result.data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadApplications(statusFilter);
  };

  const handleApprove = (app) => {
    Alert.alert(
      'Approve contributor?',
      `Approve ${app.full_name || app.email} as a Huxley contributor?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setSubmitting(true);
            const result = await userRoleService.approveApplication(app.id, app.user_id, null);
            setSubmitting(false);
            if (result.success) {
              setExpandedId(null);
              loadApplications(statusFilter);
            } else {
              Alert.alert('Failed', result.error || 'Could not approve application.');
            }
          },
        },
      ],
    );
  };

  const startNotesAction = (appId, type) => {
    setActionState({ id: appId, type, notes: '' });
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
      ? userRoleService.rejectApplication.bind(userRoleService)
      : userRoleService.requestMoreInfo.bind(userRoleService);
    const result = await fn(id, notes);
    setSubmitting(false);
    if (result.success) {
      setActionState(null);
      setExpandedId(null);
      loadApplications(statusFilter);
    } else {
      Alert.alert('Failed', result.error || 'Could not update application.');
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

  const renderApplicationCard = (app) => {
    const expanded = expandedId === app.id;
    const inNotesFlow = actionState?.id === app.id;
    const specs = Array.isArray(app.specializations)
      ? app.specializations.join(', ')
      : (app.specializations || '');

    return (
      <View key={app.id} style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setExpandedId(expanded ? null : app.id)}
          style={styles.cardHeader}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName}>{app.full_name || '(no name)'}</Text>
            <Text style={styles.cardEmail}>{app.email}</Text>
            <Text style={styles.cardMeta}>Submitted {formatDate(app.created_at)}</Text>
          </View>
          <View style={styles.cardHeaderRight}>
            {renderBadge(app.status)}
            <MaterialIcons
              name={expanded ? 'expand-less' : 'expand-more'}
              size={24}
              color={colors.textLight}
            />
          </View>
        </TouchableOpacity>

        {expanded && (
          <View style={styles.cardBody}>
            <Field label="Professional Background" value={app.professional_background} />
            <Field label="Years of Experience" value={app.years_experience?.toString() || '—'} />
            <Field label="Areas of Focus" value={specs || '—'} />
            <Field label="What They'd Like to Contribute" value={app.contribution_focus} />
            {app.additional_info ? (
              <Field label="Additional Info" value={app.additional_info} />
            ) : null}

            {app.review_notes ? (
              <View style={styles.priorNotes}>
                <Text style={styles.priorNotesLabel}>Prior review notes</Text>
                <Text style={styles.priorNotesText}>{app.review_notes}</Text>
                {app.reviewed_at ? (
                  <Text style={styles.priorNotesMeta}>Reviewed {formatDate(app.reviewed_at)}</Text>
                ) : null}
              </View>
            ) : null}

            {inNotesFlow ? (
              <View style={styles.notesPanel}>
                <Text style={styles.notesLabel}>
                  {actionState.type === 'reject'
                    ? (app.status === 'approved' ? 'Reason for revoking' : 'Reason for rejection')
                    : 'What more do you need?'}
                </Text>
                <TextInput
                  style={styles.notesInput}
                  multiline
                  numberOfLines={4}
                  value={actionState.notes}
                  onChangeText={(t) => setActionState({ ...actionState, notes: t })}
                  placeholder={actionState.type === 'reject'
                    ? (app.status === 'approved'
                        ? 'Shown to the contributor. Revoking returns their account to a regular user.'
                        : 'Will be shown to applicant on their status screen.')
                    : 'Tell the applicant what additional info you need.'}
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
                          ? (app.status === 'approved' ? 'Confirm Revoke' : 'Confirm Rejection')
                          : 'Request Info'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : app.status === 'approved' ? (
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => startNotesAction(app.id, 'reject')}
                  style={[styles.btn, styles.btnGhostDanger]}
                  disabled={submitting}
                >
                  <MaterialIcons name="block" size={18} color={colors.error} />
                  <Text style={styles.btnGhostDangerText}>Revoke Approval</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => handleApprove(app)}
                  style={[styles.btn, styles.btnPrimary]}
                  disabled={submitting}
                >
                  <MaterialIcons name="check" size={18} color={colors.textInverse} />
                  <Text style={styles.btnPrimaryText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => startNotesAction(app.id, 'needs_more_info')}
                  style={[styles.btn, styles.btnGhost]}
                  disabled={submitting}
                >
                  <Text style={styles.btnGhostText}>Need More Info</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => startNotesAction(app.id, 'reject')}
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
          <Text style={styles.headerTitle}>Contributor Applications</Text>
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
            <Text style={styles.centerText}>Loading applications...</Text>
          </View>
        ) : applications.length === 0 ? (
          <View style={styles.centerArea}>
            <MaterialIcons name="inbox" size={48} color={colors.textLight} />
            <Text style={styles.centerText}>No {STATUS_BADGE[statusFilter]?.label.toLowerCase() || ''} applications</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
          >
            {applications.map(renderApplicationCard)}
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
  cardName: { fontSize: 16, fontWeight: '600', color: colors.text },
  cardEmail: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  cardMeta: { fontSize: 12, color: colors.textLight, marginTop: 2 },

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

export default AdminApplicationReviewScreen;
