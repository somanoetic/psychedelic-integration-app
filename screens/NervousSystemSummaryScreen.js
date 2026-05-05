/**
 * Nervous System Summary Screen
 *
 * Displays polyvagal patterns — what the user has mapped about their
 * three nervous system states (ventral, sympathetic, dorsal).
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import polyvagalContextService from '../lib/polyvagalContextService';
import { colors, gradients, shadows, spacing, borderRadius, typography } from '../theme/colors';
import ShareWithTherapistButton from '../components/ShareWithTherapistButton';
import { shareNervousSystem } from '../lib/therapistShareService';
import { icons } from '../lib/uiIcons';

const STATES = [
  { key: 'ventral', emoji: '💚', icon: icons.droplet, label: 'Safe & Connected', subtitle: 'Ventral vagal' },
  { key: 'sympathetic', emoji: '⚡', icon: icons.steam, label: 'Fight / Flight', subtitle: 'Sympathetic' },
  { key: 'dorsal', emoji: '🫥', icon: icons.iceberg, label: 'Shutdown / Freeze', subtitle: 'Dorsal vagal' },
];

const PATTERN_FIELDS = [
  { key: 'situations', icon: 'place', label: 'Situations' },
  { key: 'body_sensations', icon: 'accessibility', label: 'Body Sensations' },
  { key: 'thoughts', icon: 'psychology', label: 'Thoughts' },
  { key: 'behaviors', icon: 'directions-run', label: 'Behaviors' },
];

const NervousSystemSummaryScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patterns, setPatterns] = useState(null);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const data = await polyvagalContextService.loadUserPatterns(user.id);
      setPatterns(data);
    } catch (err) {
      console.error('[NSSummary] Load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const hasMapped = patterns && (
    patterns.ventral_patterns?.situations?.length > 0 ||
    patterns.sympathetic_patterns?.situations?.length > 0 ||
    patterns.dorsal_patterns?.situations?.length > 0
  );

  const renderChips = (items) => (
    <View style={styles.chipContainer}>
      {items.map((item, i) => (
        <View key={i} style={styles.chip}>
          <Text style={styles.chipText}>{typeof item === 'string' ? item : item.description || item.type || JSON.stringify(item)}</Text>
        </View>
      ))}
    </View>
  );

  const renderStateCard = ({ key, emoji, icon, label, subtitle }) => {
    const statePatterns = patterns?.[`${key}_patterns`] || {};
    const fields = PATTERN_FIELDS.filter(f => statePatterns[f.key]?.length > 0);
    const totalItems = fields.reduce((sum, f) => sum + statePatterns[f.key].length, 0);

    return (
      <View key={key} style={styles.card}>
        <View style={styles.cardHeader}>
          {icon ? (
            <Image source={icon} style={styles.cardIconImage} />
          ) : (
            <Text style={styles.cardEmoji}>{emoji}</Text>
          )}
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>{label}</Text>
            <Text style={styles.cardSubtitle}>
              {totalItems > 0
                ? `${subtitle}  ·  ${totalItems} pattern${totalItems !== 1 ? 's' : ''} mapped`
                : `${subtitle}  ·  Not yet explored`}
            </Text>
          </View>
        </View>

        {fields.map(f => (
          <View key={f.key} style={styles.fieldGroup}>
            <View style={styles.fieldHeader}>
              <MaterialIcons name={f.icon} size={14} color={colors.textSecondary} />
              <Text style={styles.fieldLabel}>{f.label}</Text>
            </View>
            {renderChips(statePatterns[f.key])}
          </View>
        ))}
      </View>
    );
  };

  const renderMetaCard = () => {
    if (!patterns) return null;
    const items = [];
    if (patterns.regulation_capacity) items.push({ label: 'Regulation', value: patterns.regulation_capacity });
    if (patterns.awareness_level) items.push({ label: 'Awareness', value: patterns.awareness_level });
    if (patterns.mapping_sessions_count) items.push({ label: 'Sessions', value: `${patterns.mapping_sessions_count}` });
    if (patterns.early_warning_signs?.length) items.push({ label: 'Warning signs', value: `${patterns.early_warning_signs.length} identified` });
    if (patterns.successful_interventions?.length) items.push({ label: 'Interventions', value: `${patterns.successful_interventions.length} known` });

    if (!items.length) return null;

    return (
      <View style={styles.metaCard}>
        {items.map((item, i) => (
          <View key={i} style={styles.metaRow}>
            <Text style={styles.metaLabel}>{item.label}</Text>
            <Text style={styles.metaValue}>{item.value}</Text>
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
              <Image source={icons.nsMap} style={styles.heroIcon} />
              <Text style={styles.heroTitle}>Nervous System</Text>
              <Text style={styles.heroSubtitle}>
                {hasMapped
                  ? 'Your polyvagal map — how you experience each state.'
                  : 'Map your nervous system states to understand your patterns.'}
              </Text>
            </View>

            {!hasMapped ? (
              <View style={styles.emptyContainer}>
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => navigation.navigate('NervousSystemMapping')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.startButtonText}>Map Your States</Text>
                  <MaterialIcons name="arrow-forward" size={18} color={colors.textInverse} />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {renderMetaCard()}

                <View style={styles.cardsContainer}>
                  {STATES.map(renderStateCard)}
                </View>

                <ShareWithTherapistButton
                  label="Share Nervous System Map"
                  onShare={() => shareNervousSystem({
                    state_mappings: {
                      ventral: patterns.ventral_patterns,
                      sympathetic: patterns.sympathetic_patterns,
                      dorsal: patterns.dorsal_patterns,
                    },
                    dominant_state: patterns.dominant_state,
                    updated_at: patterns.updated_at,
                  })}
                />

                <TouchableOpacity
                  style={styles.tipBox}
                  onPress={() => navigation.navigate('NervousSystemMapping')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tipTitle}>🔄 Deepen Your Map</Text>
                  <Text style={styles.tipText}>
                    Your nervous system map evolves as your awareness grows. Revisit anytime to add new patterns.
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
  heroIcon: { width: 192, height: 192, marginBottom: spacing.md, resizeMode: 'contain' },
  heroTitle: { fontSize: 28, fontFamily: typography.serif, color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
  heroSubtitle: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', lineHeight: 24, paddingHorizontal: spacing.md },

  // Meta card
  metaCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  metaLabel: { fontSize: 14, color: colors.textSecondary },
  metaValue: { fontSize: 14, fontWeight: '600', color: colors.text, textTransform: 'capitalize' },

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
  cardIconImage: { width: 96, height: 96, resizeMode: 'contain', marginRight: spacing.md },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 2 },
  cardSubtitle: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },

  // Field groups
  fieldGroup: { marginBottom: spacing.sm },
  fieldHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  fieldLabel: { fontSize: 13, color: colors.textLight },

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

export default NervousSystemSummaryScreen;
