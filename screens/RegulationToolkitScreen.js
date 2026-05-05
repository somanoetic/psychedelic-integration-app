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
import { colors, gradients, shadows, spacing, borderRadius, typography } from '../theme/colors';
import ShareWithTherapistButton from '../components/ShareWithTherapistButton';
import { shareRegulatingResources } from '../lib/therapistShareService';
import { icons } from '../lib/uiIcons';

const STATE_EMOJIS = { ventral: '💚', sympathetic: '⚡', dorsal: '🫥' };
const STATE_LABELS = { ventral: 'Safe & Connected', sympathetic: 'Fight / Flight', dorsal: 'Shutdown / Freeze' };
const STATE_SUBTITLES = { ventral: 'Ventral vagal', sympathetic: 'Sympathetic', dorsal: 'Dorsal vagal' };

const INDIVIDUAL_CATEGORIES = ['passive', 'cognitive', 'creative', 'movement'];

const CATEGORY_LABELS = {
  passive: 'Sensory',
  cognitive: 'Cognitive',
  creative: 'Creative',
  movement: 'Movement',
  connection: 'Connection',
};

const CATEGORY_ICONS = {
  passive: 'spa',
  cognitive: 'psychology',
  creative: 'palette',
  movement: 'directions-run',
  connection: 'people',
};

const RegulationToolkitScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resources, setResources] = useState(null);

  const loadResources = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('regulating_resources')
        .select('state_based_resources, session_type, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') console.error('[Toolkit] Load error:', error);
        setResources(null);
      } else {
        setResources(data?.state_based_resources || null);
      }
    } catch (err) {
      console.error('[Toolkit] Load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadResources(); }, []);

  // Sort categories by count descending
  const getCategoryCounts = (stateData, categories) => {
    return categories
      .map(cat => ({ category: cat, items: stateData?.[cat] || [] }))
      .filter(c => c.items.length > 0)
      .sort((a, b) => b.items.length - a.items.length);
  };

  const renderChips = (items) => (
    <View style={styles.chipContainer}>
      {items.map((item, i) => (
        <View key={i} style={styles.chip}>
          <Text style={styles.chipText}>{item}</Text>
        </View>
      ))}
    </View>
  );

  const renderCategoryGroup = (category, items) => (
    <View key={category} style={styles.categoryGroup}>
      <View style={styles.categoryHeader}>
        <MaterialIcons name={CATEGORY_ICONS[category]} size={14} color={colors.textSecondary} />
        <Text style={styles.categoryLabel}>{CATEGORY_LABELS[category]}</Text>
      </View>
      {renderChips(items)}
    </View>
  );

  const renderStateCard = (stateKey) => {
    const stateData = resources?.[stateKey] || {};
    const individual = getCategoryCounts(stateData, INDIVIDUAL_CATEGORIES);
    const social = getCategoryCounts(stateData, ['connection']);
    const totalIndividual = individual.reduce((sum, c) => sum + c.items.length, 0);
    const totalSocial = social.reduce((sum, c) => sum + c.items.length, 0);
    const totalAll = totalIndividual + totalSocial;

    return (
      <View key={stateKey} style={styles.stateCard}>
        {/* State header row */}
        <View style={styles.stateHeader}>
          <Text style={styles.stateEmoji}>{STATE_EMOJIS[stateKey]}</Text>
          <View style={styles.stateHeaderText}>
            <Text style={styles.stateTitle}>{STATE_LABELS[stateKey]}</Text>
            <Text style={styles.stateSubtitle}>
              {totalAll > 0
                ? `${totalAll} resource${totalAll !== 1 ? 's' : ''}  ·  ${totalIndividual} individual  ·  ${totalSocial} social`
                : 'No resources mapped yet'}
            </Text>
          </View>
        </View>

        {totalAll > 0 && (
          <View style={styles.columnsContainer}>
            {/* Individual */}
            {totalIndividual > 0 && (
              <View style={styles.column}>
                <View style={styles.columnLabel}>
                  <MaterialIcons name="person" size={14} color={colors.textSecondary} />
                  <Text style={styles.columnLabelText}>Individual</Text>
                </View>
                {individual.map(({ category, items }) => renderCategoryGroup(category, items))}
              </View>
            )}

            {/* Social */}
            {totalSocial > 0 && (
              <View style={styles.column}>
                <View style={styles.columnLabel}>
                  <MaterialIcons name="people" size={14} color={colors.textSecondary} />
                  <Text style={styles.columnLabelText}>Social</Text>
                </View>
                {social.map(({ category, items }) => renderCategoryGroup(category, items))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

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
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadResources(true)} />}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <MaterialIcons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Hero */}
            <View style={styles.hero}>
              <Image source={icons.tools} style={styles.heroIcon} />
              <Text style={styles.heroTitle}>Regulation Toolkit</Text>
              <Text style={styles.heroSubtitle}>
                {resources
                  ? 'Your personal resources organized by nervous system state.'
                  : 'Map your regulating resources to build your personal toolkit.'}
              </Text>
            </View>

            {!resources ? (
              /* Empty state */
              <View style={styles.emptyContainer}>
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => navigation.navigate('RegulatingResources')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.startButtonText}>Map Your Resources</Text>
                  <MaterialIcons name="arrow-forward" size={18} color={colors.textInverse} />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* State cards */}
                <View style={styles.cardsContainer}>
                  {['ventral', 'sympathetic', 'dorsal'].map(renderStateCard)}
                </View>

                <ShareWithTherapistButton
                  label="Share Regulation Toolkit"
                  onShare={() => shareRegulatingResources({ state_based_resources: resources })}
                />

                {/* Update tip */}
                <TouchableOpacity
                  style={styles.tipBox}
                  onPress={() => navigation.navigate('RegulatingResources')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tipTitle}>🔄 Update Your Toolkit</Text>
                  <Text style={styles.tipText}>
                    Your toolkit is a living document. Revisit anytime to add new resources or update what's working.
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

// ---------------------------------------------------------------------------
// Styles — matching PracticeScreen / InnerAtlas pattern
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 80,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hero
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  heroIcon: {
    width: 192,
    height: 192,
    marginBottom: spacing.md,
    resizeMode: 'contain',
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: typography.serif,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },

  // State cards
  cardsContainer: {
    marginBottom: spacing.lg,
  },
  stateCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  stateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stateEmoji: {
    fontSize: 36,
    marginRight: spacing.md,
  },
  stateHeaderText: {
    flex: 1,
  },
  stateTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  stateSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Columns (individual / social)
  columnsContainer: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  column: {
    gap: spacing.sm,
  },
  columnLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  columnLabelText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Category groups
  categoryGroup: {
    marginBottom: spacing.xs,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 13,
    color: colors.textLight,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: colors.offWhite,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 13,
    color: colors.text,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.md,
  },
  startButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },

  // Tip box
  tipBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tipText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default RegulationToolkitScreen;
