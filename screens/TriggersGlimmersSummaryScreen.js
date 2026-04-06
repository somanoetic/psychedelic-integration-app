/**
 * Triggers & Glimmers Summary Screen
 *
 * Displays mapped triggers (by nervous system state) and glimmers (by type).
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { colors, gradients, shadows, spacing, borderRadius } from '../theme/colors';
import ShareWithTherapistButton from '../components/ShareWithTherapistButton';
import { shareTriggersGlimmers } from '../lib/therapistShareService';

const TRIGGER_GROUPS = [
  { key: 'sympathetic_triggers', emoji: '⚡', label: 'Fight / Flight Triggers' },
  { key: 'dorsal_triggers', emoji: '🫥', label: 'Shutdown Triggers' },
  { key: 'general_triggers', emoji: '🔴', label: 'General Triggers' },
];

const GLIMMER_GROUPS = [
  { key: 'sensory_glimmers', emoji: '✨', label: 'Sensory' },
  { key: 'relational_glimmers', emoji: '🤝', label: 'Relational' },
  { key: 'activity_glimmers', emoji: '🎨', label: 'Activities' },
  { key: 'nature_glimmers', emoji: '🌿', label: 'Nature' },
];

const TriggersGlimmersSummaryScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: row, error } = await supabase
        .from('triggers_glimmers_mapping')
        .select('sympathetic_triggers, dorsal_triggers, general_triggers, sensory_glimmers, relational_glimmers, activity_glimmers, nature_glimmers, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') console.error('[TGSummary] Load error:', error);
        setData(null);
      } else {
        setData(row);
      }
    } catch (err) {
      console.error('[TGSummary] Load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const totalTriggers = data
    ? (data.sympathetic_triggers?.length || 0) + (data.dorsal_triggers?.length || 0) + (data.general_triggers?.length || 0)
    : 0;
  const totalGlimmers = data
    ? (data.sensory_glimmers?.length || 0) + (data.relational_glimmers?.length || 0) + (data.activity_glimmers?.length || 0) + (data.nature_glimmers?.length || 0)
    : 0;

  const renderChips = (items) => (
    <View style={styles.chipContainer}>
      {items.map((item, i) => (
        <View key={i} style={styles.chip}>
          <Text style={styles.chipText}>{item}</Text>
        </View>
      ))}
    </View>
  );

  const renderGroupCard = (groups, sectionLabel, sectionEmoji) => {
    const nonEmpty = groups.filter(g => data?.[g.key]?.length > 0);
    if (!nonEmpty.length) return null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardEmoji}>{sectionEmoji}</Text>
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>{sectionLabel}</Text>
          </View>
        </View>
        {nonEmpty.map(g => (
          <View key={g.key} style={styles.fieldGroup}>
            <View style={styles.fieldHeader}>
              <Text style={styles.fieldEmoji}>{g.emoji}</Text>
              <Text style={styles.fieldLabel}>{g.label}</Text>
              <Text style={styles.fieldCount}>{data[g.key].length}</Text>
            </View>
            {renderChips(data[g.key])}
          </View>
        ))}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={gradients.standard}
      start={gradients.standardStart}
      end={gradients.standardEnd}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}
          >
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <MaterialIcons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.hero}>
              <Text style={styles.heroEmoji}>⚡</Text>
              <Text style={styles.heroTitle}>Triggers & Glimmers</Text>
              <Text style={styles.heroSubtitle}>
                {data
                  ? `${totalTriggers} trigger${totalTriggers !== 1 ? 's' : ''} and ${totalGlimmers} glimmer${totalGlimmers !== 1 ? 's' : ''} mapped.`
                  : 'Discover what activates you and what brings you back.'}
              </Text>
            </View>

            {!data ? (
              <View style={styles.emptyContainer}>
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => navigation.navigate('TriggersGlimmers')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.startButtonText}>Map Triggers & Glimmers</Text>
                  <MaterialIcons name="arrow-forward" size={18} color={colors.textInverse} />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Balance bar */}
                {(totalTriggers + totalGlimmers) > 0 && (
                  <View style={styles.balanceCard}>
                    <View style={styles.balanceLabels}>
                      <Text style={styles.balanceLabelLeft}>Triggers ({totalTriggers})</Text>
                      <Text style={styles.balanceLabelRight}>Glimmers ({totalGlimmers})</Text>
                    </View>
                    <View style={styles.balanceBar}>
                      <View style={[styles.balanceSegment, { flex: totalTriggers || 1, backgroundColor: '#ef4444', borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }]} />
                      <View style={[styles.balanceSegment, { flex: totalGlimmers || 1, backgroundColor: '#10b981', borderTopRightRadius: 4, borderBottomRightRadius: 4 }]} />
                    </View>
                  </View>
                )}

                <View style={styles.cardsContainer}>
                  {renderGroupCard(TRIGGER_GROUPS, 'Triggers', '🔴')}
                  {renderGroupCard(GLIMMER_GROUPS, 'Glimmers', '✨')}
                </View>

                <ShareWithTherapistButton
                  label="Share Triggers & Glimmers"
                  onShare={() => shareTriggersGlimmers(data)}
                />

                <TouchableOpacity
                  style={styles.tipBox}
                  onPress={() => navigation.navigate('TriggersGlimmers')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tipTitle}>🔄 Update Your Map</Text>
                  <Text style={styles.tipText}>
                    As your awareness grows, you'll notice new triggers and discover new glimmers.
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: 80 },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  backButton: { padding: spacing.sm, borderRadius: borderRadius.sm, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },

  hero: { alignItems: 'center', marginBottom: spacing.xl },
  heroEmoji: { fontSize: 56, marginBottom: spacing.md },
  heroTitle: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
  heroSubtitle: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', lineHeight: 24, paddingHorizontal: spacing.md },

  // Balance
  balanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  balanceLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  balanceLabelLeft: { fontSize: 13, color: '#ef4444', fontWeight: '600' },
  balanceLabelRight: { fontSize: 13, color: '#10b981', fontWeight: '600' },
  balanceBar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden' },
  balanceSegment: { height: '100%' },

  // Cards
  cardsContainer: { marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  cardEmoji: { fontSize: 36, marginRight: spacing.md },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: colors.text },

  // Field groups
  fieldGroup: { marginBottom: spacing.sm },
  fieldHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  fieldEmoji: { fontSize: 16 },
  fieldLabel: { fontSize: 13, color: colors.textSecondary, flex: 1 },
  fieldCount: { fontSize: 13, color: colors.textLight },

  // Chips
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: colors.offWhite, borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  chipText: { fontSize: 13, color: colors.text },

  // Empty
  emptyContainer: { alignItems: 'center', paddingVertical: spacing.xl },
  startButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 4, borderRadius: borderRadius.md },
  startButtonText: { color: colors.textInverse, fontSize: 16, fontWeight: '600' },

  // Tip
  tipBox: { backgroundColor: 'rgba(255, 255, 255, 0.7)', padding: spacing.md, borderRadius: borderRadius.lg, borderLeftWidth: 4, borderLeftColor: colors.primary },
  tipTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  tipText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
});

export default TriggersGlimmersSummaryScreen;
