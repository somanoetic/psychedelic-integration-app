import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ShieldCheck,
  FileText,
  Download,
  LayoutDashboard,
  UserCheck,
  MessageSquareCheck,
  Bug,
  RefreshCw,
  LogOut,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react-native';
import * as Sentry from '@sentry/react-native';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme/colors';
import { supabase } from '../lib/supabase';
import { exportAndShare } from '../lib/dataExportService';
import userRoleService from '../lib/userRoleService';
import {
  DISCLOSURE_STORAGE_KEY,
  PRACTITIONER_FLAG_KEY,
} from './NonClinicalDisclosureScreen';

const SettingsScreen = ({ navigation }) => {
  const [exporting, setExporting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    userRoleService.isAdmin().then(setIsAdmin).catch(() => setIsAdmin(false));
  }, []);

  const handleExportData = async () => {
    setExporting(true);
    try {
      await exportAndShare();
    } catch (error) {
      Alert.alert('Export Failed', error.message);
    } finally {
      setExporting(false);
    }
  };

  // Manual Sentry verification helper. Visible in dev to anyone and in
  // production to admins only — gated on the row render below. Each click
  // produces a uniquely-tagged event so you can find it in the Sentry
  // dashboard without confusing it with real errors.
  const handleTriggerTestException = () => {
    const tag = `verify-${Date.now()}`;
    Sentry.captureException(new Error(`Sentry test exception (${tag})`), {
      tags: { source: 'manual-verify', tag },
    });
    Alert.alert(
      'Test exception sent',
      `An exception was reported to Sentry with tag "${tag}". It should appear in your Sentry dashboard within ~30 seconds.`,
    );
  };

  // DEV-only: clears every gate that keeps the first-launch flow from showing
  // again (onboarding carousel, non-clinical disclosure, Huxley welcome screen).
  // After clearing, signing out also returns the user to AuthScreen.
  const handleResetFirstTimeFlow = () => {
    Alert.alert(
      'Reset first-time flow?',
      'Clears onboarding, disclosure, and Huxley welcome flags. After this you can sign out to also see the auth screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset & sign out',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove([
              'onboarding_completed',
              DISCLOSURE_STORAGE_KEY,
              PRACTITIONER_FLAG_KEY,
              'huxley_welcome_shown',
            ]);
            await supabase.auth.signOut();
          },
        },
        {
          text: 'Reset only',
          onPress: async () => {
            await AsyncStorage.multiRemove([
              'onboarding_completed',
              DISCLOSURE_STORAGE_KEY,
              PRACTITIONER_FLAG_KEY,
              'huxley_welcome_shown',
            ]);
            Alert.alert(
              'Flags cleared',
              'Restart the app (or sign out) to see the first-time flow.',
            );
          },
        },
      ],
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
          },
        },
      ]
    );
  };

  const SettingsRow = ({ Icon, title, subtitle, onPress, danger, loading }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, danger && styles.iconContainerDanger]}>
        <Icon size={22} color={danger ? colors.error : colors.primary} strokeWidth={2} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, danger && styles.rowTitleDanger]}>{title}</Text>
        {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <ChevronRight size={22} color={colors.textLight} strokeWidth={2} />
      )}
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={gradients.standard} start={gradients.standardStart} end={gradients.standardEnd} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView style={styles.content}>
          {/* Legal */}
          <Text style={styles.sectionHeader}>Legal</Text>
          <View style={styles.card}>
            <SettingsRow
              Icon={ShieldCheck}
              title="Privacy Policy"
              subtitle="How we handle your data"
              onPress={() => navigation.navigate('PrivacyPolicy')}
            />
            <View style={styles.separator} />
            <SettingsRow
              Icon={FileText}
              title="Terms of Service"
              subtitle="Rules for using the app"
              onPress={() => navigation.navigate('TermsOfService')}
            />
          </View>

          {/* Find Support and Contribute moved out of Settings into the global
              FAB radial menu (beta feedback). See components/GlobalHuxleyFab.js. */}

          {/* Data */}
          <Text style={styles.sectionHeader}>Your Data</Text>
          <View style={styles.card}>
            <SettingsRow
              Icon={Download}
              title="Export My Data"
              subtitle="Download all your data as JSON"
              onPress={handleExportData}
              loading={exporting}
            />
          </View>

          {/* Admin (admin-only) */}
          {isAdmin && (
            <>
              <Text style={styles.sectionHeader}>Admin</Text>
              <View style={styles.card}>
                <SettingsRow
                  Icon={LayoutDashboard}
                  title="AI Metrics Dashboard"
                  subtitle="System-level AI service health and cost"
                  onPress={() => navigation.navigate('AdminMetricsDashboard')}
                />
                <View style={styles.separator} />
                <SettingsRow
                  Icon={UserCheck}
                  title="Contributor Applications"
                  subtitle="Review pending contributor applications"
                  onPress={() => navigation.navigate('AdminApplicationReview')}
                />
                <View style={styles.separator} />
                <SettingsRow
                  Icon={MessageSquareCheck}
                  title="Exercise Submissions"
                  subtitle="Review pending contributed exercises"
                  onPress={() => navigation.navigate('AdminContentReview')}
                />
              </View>
            </>
          )}

          {/* Diagnostics — visible in dev to all, in prod to admins only */}
          {(__DEV__ || isAdmin) && (
            <>
              <Text style={styles.sectionHeader}>Diagnostics</Text>
              <View style={styles.card}>
                <SettingsRow
                  Icon={Bug}
                  title="Trigger Test Exception"
                  subtitle="Reports a tagged error to Sentry to verify capture"
                  onPress={handleTriggerTestException}
                />
                {__DEV__ && (
                  <>
                    <View style={styles.separator} />
                    <SettingsRow
                      Icon={RefreshCw}
                      title="Reset First-Time Flow (DEV)"
                      subtitle="Clears onboarding, disclosure, and welcome flags"
                      onPress={handleResetFirstTimeFlow}
                    />
                  </>
                )}
              </View>
            </>
          )}

          {/* Account */}
          <Text style={styles.sectionHeader}>Account</Text>
          <View style={styles.card}>
            <SettingsRow
              Icon={LogOut}
              title="Sign Out"
              danger
              onPress={handleSignOut}
            />
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerDanger: {
    backgroundColor: `${colors.error}15`,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  rowTitleDanger: {
    color: colors.error,
  },
  rowSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginLeft: 68,
  },
  footer: {
    height: spacing.xxl * 2,
  },
});

export default SettingsScreen;
