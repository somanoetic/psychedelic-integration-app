/**
 * Parts Summary Screen
 *
 * Displays the user's IFS parts inventory — protectors, exiles,
 * work phases, and key details about each part.
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
import ifsContextService from '../lib/ifsContextService';
import { colors, gradients, shadows, spacing, borderRadius, typography } from '../theme/colors';
import ShareWithTherapistButton from '../components/ShareWithTherapistButton';
import { shareIFSParts } from '../lib/therapistShareService';
import { icons } from '../lib/uiIcons';

const PHASE_CONFIG = {
  discovery: { label: 'Discovery', color: colors.warning },
  accessing: { label: 'Accessing', color: colors.primary },
  unburdening: { label: 'Unburdening', color: '#8b5cf6' },
  integrated: { label: 'Integrated', color: colors.success },
};

const ROLE_CONFIG = {
  manager: { emoji: '🛡️', icon: icons.manager, label: 'Manager' },
  firefighter: { emoji: '🔥', icon: icons.firefighter, label: 'Firefighter' },
  exile: { emoji: '💔', icon: icons.brokenHeart, label: 'Exile' },
};

const PartsSummaryScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [partsData, setPartsData] = useState(null);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const data = await ifsContextService.loadUserParts(user.id);
      setPartsData(data);
    } catch (err) {
      console.error('[PartsSummary] Load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const hasParts = partsData?.allParts?.length > 0;

  const renderPartCard = (part) => {
    const roleConfig = ROLE_CONFIG[part.part_role] || { emoji: '❓', label: part.part_role || 'Unknown' };
    const phaseConfig = PHASE_CONFIG[part.work_phase] || { label: part.work_phase || 'Unknown', color: colors.textLight };

    const details = [];
    if (part.location_in_body) details.push({ icon: 'accessibility', text: part.location_in_body });
    if (part.protective_strategy) details.push({ icon: 'shield', text: part.protective_strategy });
    if (part.part_wants) details.push({ icon: 'favorite', text: `Wants: ${part.part_wants}` });
    if (part.part_fears) details.push({ icon: 'warning', text: `Fears: ${part.part_fears}` });

    return (
      <View key={part.id} style={styles.card}>
        <View style={styles.cardHeader}>
          {roleConfig.icon ? (
            <Image source={roleConfig.icon} style={styles.cardIconImage} />
          ) : (
            <Text style={styles.cardEmoji}>{roleConfig.emoji}</Text>
          )}
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>{part.part_name || 'Unnamed Part'}</Text>
            <Text style={styles.cardSubtitle}>
              {roleConfig.label}
              {part.age_of_part ? `  ·  Age ${part.age_of_part}` : ''}
            </Text>
          </View>
          <View style={[styles.phaseBadge, { backgroundColor: phaseConfig.color + '15' }]}>
            <Text style={[styles.phaseBadgeText, { color: phaseConfig.color }]}>{phaseConfig.label}</Text>
          </View>
        </View>

        {details.length > 0 && (
          <View style={styles.detailsList}>
            {details.map((d, i) => (
              <View key={i} style={styles.detailRow}>
                <MaterialIcons name={d.icon} size={14} color={colors.textSecondary} />
                <Text style={styles.detailText} numberOfLines={2}>{d.text}</Text>
              </View>
            ))}
          </View>
        )}

        {part.unburdened && (
          <View style={styles.unburdenedBadge}>
            <MaterialIcons name="check-circle" size={14} color={colors.success} />
            <Text style={styles.unburdenedText}>Unburdened</Text>
            {part.new_role ? <Text style={styles.newRoleText}>New role: {part.new_role}</Text> : null}
          </View>
        )}
      </View>
    );
  };

  const renderOverview = () => {
    const protectors = partsData.protectors?.length || 0;
    const exiles = partsData.exiles?.length || 0;
    const unburdened = partsData.unburdenedExiles?.length || 0;
    const total = partsData.allParts?.length || 0;

    return (
      <View style={styles.overviewCard}>
        <View style={styles.overviewRow}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewNumber}>{total}</Text>
            <Text style={styles.overviewLabel}>Total</Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={[styles.overviewNumber, { color: colors.primary }]}>{protectors}</Text>
            <Text style={styles.overviewLabel}>Protectors</Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={[styles.overviewNumber, { color: '#8b5cf6' }]}>{exiles}</Text>
            <Text style={styles.overviewLabel}>Exiles</Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={[styles.overviewNumber, { color: colors.success }]}>{unburdened}</Text>
            <Text style={styles.overviewLabel}>Unburdened</Text>
          </View>
        </View>
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
              <Image source={icons.selfEnergy} style={styles.heroIcon} />
              <Text style={styles.heroTitle}>Parts</Text>
              <Text style={styles.heroSubtitle}>
                {hasParts
                  ? 'Your inner family — the protectors and exiles you\'ve met.'
                  : 'Begin getting to know your inner parts through IFS work.'}
              </Text>
            </View>

            {!hasParts ? (
              <View style={styles.emptyContainer}>
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => navigation.navigate('IFSChat')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.startButtonText}>Begin Parts Work</Text>
                  <MaterialIcons name="arrow-forward" size={18} color={colors.textInverse} />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {renderOverview()}

                <View style={styles.cardsContainer}>
                  {partsData.allParts.map(renderPartCard)}
                </View>

                <ShareWithTherapistButton
                  label="Share Parts Inventory"
                  onShare={() => shareIFSParts(partsData.allParts)}
                />

                <TouchableOpacity
                  style={styles.tipBox}
                  onPress={() => navigation.navigate('IFSChat')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tipTitle}>🔮 Continue Parts Work</Text>
                  <Text style={styles.tipText}>
                    Each conversation deepens your relationship with your parts. Return anytime to check in or meet new ones.
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

  // Overview
  overviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  overviewRow: { flexDirection: 'row', justifyContent: 'space-around' },
  overviewItem: { alignItems: 'center' },
  overviewNumber: { fontSize: 24, fontWeight: '700', color: colors.text },
  overviewLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  // Cards
  cardsContainer: { marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardEmoji: { fontSize: 36, marginRight: spacing.md },
  cardIconImage: { width: 96, height: 96, resizeMode: 'contain', marginRight: spacing.md },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 2 },
  cardSubtitle: { fontSize: 14, color: colors.textSecondary },
  phaseBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full },
  phaseBadgeText: { fontSize: 12, fontWeight: '600' },

  // Details
  detailsList: { marginTop: spacing.sm, gap: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  detailText: { fontSize: 13, color: colors.textSecondary, flex: 1, lineHeight: 18 },

  // Unburdened
  unburdenedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.offWhite },
  unburdenedText: { fontSize: 13, fontWeight: '600', color: colors.success },
  newRoleText: { fontSize: 13, color: colors.textSecondary, marginLeft: 'auto' },

  // Empty
  emptyContainer: { alignItems: 'center', paddingVertical: spacing.xl },
  startButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 4, borderRadius: borderRadius.md },
  startButtonText: { color: colors.textInverse, fontSize: 16, fontWeight: '600' },

  // Tip
  tipBox: { backgroundColor: 'rgba(255, 255, 255, 0.7)', padding: spacing.md, borderRadius: borderRadius.lg, borderLeftWidth: 4, borderLeftColor: colors.primary },
  tipTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  tipText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
});

export default PartsSummaryScreen;
