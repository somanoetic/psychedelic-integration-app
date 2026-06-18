import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Pencil,
  PlusCircle,
  ChevronRight,
  Info,
} from 'lucide-react-native';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme/colors';
import userRoleService from '../lib/userRoleService';

// Maps the icon strings passed to <ToolCard icon=... /> to Lucide components.
const TOOL_ICON_MAP = {
  edit: Pencil,
  'add-circle-outline': PlusCircle,
};

const ContributorToolsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [roleData, setRoleData] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [role, verification] = await Promise.all([
        userRoleService.getCurrentUserRole(),
        userRoleService.getVerificationStatus(),
      ]);
      setRoleData(role);
      setVerificationStatus(verification);
    } catch (error) {
      console.error('Error loading contributor tools data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const isVerified =
    roleData?.role === 'contributor' && roleData?.verified === true;
  const isAdmin = roleData?.role === 'admin' && roleData?.verified === true;
  const hasAccess = isVerified || isAdmin;
  const status = verificationStatus?.status;
  const isPending = status === 'pending';
  const isNeedsMoreInfo = status === 'needs_more_info';
  const isRejected = status === 'rejected';
  const reviewNotes = verificationStatus?.data?.review_notes;

  const baseDisplay = userRoleService.getRoleDisplayInfo(
    roleData?.role,
    roleData?.verified,
  );

  // For non-pending non-approved states, the verification status is the
  // load-bearing signal — override the role-derived display so the
  // applicant sees the actual outcome on this screen rather than having
  // to tap through.
  let displayInfo = baseDisplay;
  if (isNeedsMoreInfo) {
    displayInfo = {
      ...baseDisplay,
      title: 'More Information Needed',
      badge: '📋 Info Needed',
      color: '#d97706',
    };
  } else if (isRejected) {
    displayInfo = {
      ...baseDisplay,
      title: 'Application Not Approved',
      badge: '❌ Not Approved',
      color: '#dc2626',
    };
  }

  const ToolCard = ({ icon, title, subtitle, onPress, disabled }) => {
    const ToolIcon = TOOL_ICON_MAP[icon] || Pencil;
    return (
      <TouchableOpacity
        style={[styles.toolCard, disabled && styles.toolCardDisabled]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View style={[styles.toolIcon, disabled && styles.toolIconDisabled]}>
          <ToolIcon
            size={28}
            color={disabled ? colors.textLight : colors.primary}
            strokeWidth={2}
          />
        </View>
        <View style={styles.toolText}>
          <Text style={[styles.toolTitle, disabled && styles.toolTitleDisabled]}>
            {title}
          </Text>
          <Text style={styles.toolSubtitle}>{subtitle}</Text>
        </View>
        <ChevronRight
          size={22}
          color={disabled ? colors.textLight : colors.textSecondary}
          strokeWidth={2}
        />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <LinearGradient
        colors={gradients.standard}
        start={gradients.standardStart}
        end={gradients.standardEnd}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={gradients.standard}
      start={gradients.standardStart}
      end={gradients.standardEnd}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contributor Tools</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView style={styles.content}>
          {/* Status Badge */}
          <View style={styles.statusCard}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: displayInfo.color + '20' },
              ]}
            >
              <Text style={styles.statusBadgeText}>{displayInfo.badge}</Text>
            </View>
            <Text style={styles.statusTitle}>{displayInfo.title}</Text>
            {isPending && (
              <Text style={styles.statusSubtext}>
                Your application is under review. You'll receive an email when
                it's approved.
              </Text>
            )}
            {isNeedsMoreInfo && (
              <>
                <Text style={styles.statusSubtext}>
                  The reviewer has asked for additional information before
                  proceeding.
                </Text>
                {reviewNotes ? (
                  <View style={styles.notesInline}>
                    <Text style={styles.notesInlineLabel}>Reviewer's note</Text>
                    <Text style={styles.notesInlineText}>{reviewNotes}</Text>
                  </View>
                ) : null}
              </>
            )}
            {isRejected && (
              <>
                <Text style={styles.statusSubtext}>
                  Unfortunately, your application was not approved.
                </Text>
                {reviewNotes ? (
                  <View style={styles.notesInline}>
                    <Text style={styles.notesInlineLabel}>Reason</Text>
                    <Text style={styles.notesInlineText}>{reviewNotes}</Text>
                  </View>
                ) : null}
              </>
            )}
            {!hasAccess && !isPending && !isNeedsMoreInfo && !isRejected && (
              <Text style={styles.statusSubtext}>
                Apply to contribute to Multitudes' library.
              </Text>
            )}
          </View>

          {/* Application action — only shown when there's something to do */}
          {!hasAccess && !isRejected && (
            <>
              <Text style={styles.sectionHeader}>
                {isNeedsMoreInfo ? 'Respond' : 'Apply'}
              </Text>
              <View style={styles.card}>
                <ToolCard
                  icon="edit"
                  title={
                    isPending
                      ? 'View Application Status'
                      : isNeedsMoreInfo
                        ? 'Respond to Reviewer'
                        : 'Apply to Contribute'
                  }
                  subtitle={
                    isPending
                      ? 'Check the status of your application'
                      : isNeedsMoreInfo
                        ? 'Update your application and resubmit for review'
                        : 'Tell us about your background and what you’d like to contribute'
                  }
                  onPress={() => navigation.navigate('ContributorApplication')}
                />
              </View>
            </>
          )}

          {/* Contributor Tools */}
          {hasAccess && (
            <>
              <Text style={styles.sectionHeader}>Your Tools</Text>
              <View style={styles.card}>
                <ToolCard
                  icon="add-circle-outline"
                  title="Submit an Exercise"
                  subtitle="Contribute a practice to Multitudes' public library"
                  onPress={() => navigation.navigate('ContributorExerciseSubmission')}
                />
                <View style={styles.separator} />
                <ToolCard
                  icon="edit"
                  title="Application Details"
                  subtitle="View the details you submitted"
                  onPress={() => navigation.navigate('ContributorApplication')}
                />
              </View>
            </>
          )}

          {/* Info */}
          <View style={styles.infoCard}>
            <Info
              size={18}
              color={colors.textSecondary}
              strokeWidth={2}
            />
            <Text style={styles.infoText}>
              Approved contributors can submit exercises and protocols to
              Multitudes' public library. Submissions are reviewed before going
              live and published with attribution to the contributor.
            </Text>
          </View>

          <View style={styles.footer} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadows.soft,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  statusBadgeText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statusSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    ...shadows.soft,
    overflow: 'hidden',
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  toolCardDisabled: {
    opacity: 0.5,
  },
  toolIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolIconDisabled: {
    backgroundColor: `${colors.textLight}15`,
  },
  toolText: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  toolTitleDisabled: {
    color: colors.textSecondary,
  },
  toolSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginLeft: 76,
  },
  notesInline: {
    width: '100%',
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: '#fef9e7',
    borderRadius: borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  notesInlineLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78350f',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  notesInlineText: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: `${colors.primary}08`,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    height: spacing.xxl * 2,
  },
});

export default ContributorToolsScreen;
