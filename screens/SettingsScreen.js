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
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme/colors';
import { supabase } from '../lib/supabase';
import { exportAndShare } from '../lib/dataExportService';
import userRoleService from '../lib/userRoleService';

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

  const SettingsRow = ({ icon, title, subtitle, onPress, danger, loading }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, danger && styles.iconContainerDanger]}>
        <MaterialIcons name={icon} size={22} color={danger ? colors.error : colors.primary} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, danger && styles.rowTitleDanger]}>{title}</Text>
        {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <MaterialIcons name="chevron-right" size={22} color={colors.textLight} />
      )}
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={gradients.standard} start={gradients.standardStart} end={gradients.standardEnd} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView style={styles.content}>
          {/* Legal */}
          <Text style={styles.sectionHeader}>Legal</Text>
          <View style={styles.card}>
            <SettingsRow
              icon="privacy-tip"
              title="Privacy Policy"
              subtitle="How we handle your data"
              onPress={() => navigation.navigate('PrivacyPolicy')}
            />
            <View style={styles.separator} />
            <SettingsRow
              icon="description"
              title="Terms of Service"
              subtitle="Rules for using the app"
              onPress={() => navigation.navigate('TermsOfService')}
            />
          </View>

          {/* Support */}
          <Text style={styles.sectionHeader}>Support</Text>
          <View style={styles.card}>
            <SettingsRow
              icon="support-agent"
              title="Find Support"
              subtitle="Crisis lines, therapist directories, and resources"
              onPress={() => navigation.navigate('FindSupport')}
            />
          </View>

          {/* Contribute */}
          <Text style={styles.sectionHeader}>Contribute</Text>
          <View style={styles.card}>
            <SettingsRow
              icon="edit"
              title="Contributor Tools"
              subtitle="Apply to contribute, manage your training scenarios"
              onPress={() => navigation.navigate('ContributorTools')}
            />
          </View>

          {/* Data */}
          <Text style={styles.sectionHeader}>Your Data</Text>
          <View style={styles.card}>
            <SettingsRow
              icon="download"
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
                  icon="dashboard"
                  title="AI Metrics Dashboard"
                  subtitle="System-level AI service health and cost"
                  onPress={() => navigation.navigate('AdminMetricsDashboard')}
                />
              </View>
            </>
          )}

          {/* Account */}
          <Text style={styles.sectionHeader}>Account</Text>
          <View style={styles.card}>
            <SettingsRow
              icon="logout"
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
