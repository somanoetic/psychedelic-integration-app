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
import { MaterialIcons } from '@expo/vector-icons';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme/colors';
import userRoleService from '../lib/userRoleService';

const TherapistToolsScreen = ({ navigation }) => {
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
      console.error('Error loading therapist tools data:', error);
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
    roleData?.role === 'therapist' && roleData?.verified === true;
  const isAdmin = roleData?.role === 'admin' && roleData?.verified === true;
  const hasAccess = isVerified || isAdmin;
  const isPending = verificationStatus?.status === 'pending';

  const displayInfo = userRoleService.getRoleDisplayInfo(
    roleData?.role,
    roleData?.verified,
  );

  const ToolCard = ({ icon, title, subtitle, onPress, disabled }) => (
    <TouchableOpacity
      style={[styles.toolCard, disabled && styles.toolCardDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={[styles.toolIcon, disabled && styles.toolIconDisabled]}>
        <MaterialIcons
          name={icon}
          size={28}
          color={disabled ? colors.textLight : colors.primary}
        />
      </View>
      <View style={styles.toolText}>
        <Text style={[styles.toolTitle, disabled && styles.toolTitleDisabled]}>
          {title}
        </Text>
        <Text style={styles.toolSubtitle}>{subtitle}</Text>
      </View>
      <MaterialIcons
        name="chevron-right"
        size={22}
        color={disabled ? colors.textLight : colors.textSecondary}
      />
    </TouchableOpacity>
  );

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
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Professional Tools</Text>
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
                Your verification is under review. You'll receive an email when
                it's approved.
              </Text>
            )}
            {!hasAccess && !isPending && (
              <Text style={styles.statusSubtext}>
                Verify your credentials to access professional tools and help
                improve Huxley's therapeutic responses.
              </Text>
            )}
          </View>

          {/* Verification */}
          {!hasAccess && (
            <>
              <Text style={styles.sectionHeader}>Get Verified</Text>
              <View style={styles.card}>
                <ToolCard
                  icon="verified-user"
                  title={
                    isPending
                      ? 'View Verification Status'
                      : 'Request Verification'
                  }
                  subtitle={
                    isPending
                      ? 'Check the status of your application'
                      : 'Submit your professional credentials'
                  }
                  onPress={() => navigation.navigate('TherapistVerification')}
                />
              </View>
            </>
          )}

          {/* Professional Tools */}
          <Text style={styles.sectionHeader}>
            {hasAccess ? 'Your Tools' : 'Available After Verification'}
          </Text>
          <View style={styles.card}>
            <ToolCard
              icon="school"
              title="Upload Training Scenarios"
              subtitle="Teach Huxley from your therapeutic expertise"
              onPress={() => navigation.navigate('ScenarioUpload')}
              disabled={!hasAccess}
            />
            <View style={styles.separator} />
            <ToolCard
              icon="dashboard"
              title="AI Metrics Dashboard"
              subtitle="Monitor AI service performance and usage"
              onPress={() => navigation.navigate('AdminMetricsDashboard')}
              disabled={!hasAccess}
            />
            {hasAccess && (
              <>
                <View style={styles.separator} />
                <ToolCard
                  icon="verified-user"
                  title="Verification Details"
                  subtitle="View your professional credentials"
                  onPress={() => navigation.navigate('TherapistVerification')}
                />
              </>
            )}
          </View>

          {/* Info */}
          <View style={styles.infoCard}>
            <MaterialIcons
              name="info-outline"
              size={18}
              color={colors.textSecondary}
            />
            <Text style={styles.infoText}>
              Professional tools allow verified therapists and guides to
              contribute training data that improves Huxley's integration
              support. All uploads are reviewed for quality and safety.
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

export default TherapistToolsScreen;
