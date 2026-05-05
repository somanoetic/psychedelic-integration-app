import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import polyvagalContextService from '../lib/polyvagalContextService';
import ifsContextService from '../lib/ifsContextService';
import { colors, gradients, shadows, spacing, borderRadius, typography } from '../theme/colors';
import ShareWithTherapistButton from '../components/ShareWithTherapistButton';
import { shareAll } from '../lib/therapistShareService';
import { icons } from '../lib/uiIcons';

// ---------------------------------------------------------------------------
// Domain config
// ---------------------------------------------------------------------------

const BELIEF_DOMAINS = [
  { key: 'value_worthiness', label: 'Self-Worth' },
  { key: 'security_safety', label: 'Safety' },
  { key: 'performance_competence', label: 'Competence' },
  { key: 'control_power', label: 'Power' },
  { key: 'love_nurturance', label: 'Love' },
  { key: 'autonomy_independence', label: 'Autonomy' },
  { key: 'justice_fairness', label: 'Justice' },
  { key: 'belonging_connection', label: 'Belonging' },
  { key: 'others_trust', label: 'Trust' },
  { key: 'standards_compassion', label: 'Compassion' },
];

const countResources = (stateData, categories) => {
  if (!stateData) return 0;
  return categories.reduce((sum, cat) => sum + (stateData[cat]?.length || 0), 0);
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const InnerAtlasScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [atlas, setAtlas] = useState({});

  const loadAtlas = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [patterns, parts, resourcesRow, beliefsRow, triggersRow] = await Promise.all([
        polyvagalContextService.getPatternsForAI(user.id).catch(() => null),
        ifsContextService.loadUserParts(user.id).catch(() => null),
        supabase
          .from('regulating_resources')
          .select('state_based_resources, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('core_beliefs_assessments')
          .select('*')
          .eq('user_id', user.id)
          .eq('completed', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('triggers_glimmers_mapping')
          .select('sympathetic_triggers, dorsal_triggers, general_triggers, sensory_glimmers, relational_glimmers, activity_glimmers, nature_glimmers, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      // -- Nervous System --
      const ns = {};
      if (patterns?.hasMappedStates) {
        ns.mapped = true;
        ns.capacity = patterns.capacity;
        ns.awareness = patterns.awareness;
        ns.statesMapped = [
          patterns.ventral?.situations?.length > 0,
          patterns.sympathetic?.situations?.length > 0,
          patterns.dorsal?.situations?.length > 0,
        ].filter(Boolean).length;
      }

      // -- Resources --
      const res = {};
      const resData = resourcesRow?.data?.state_based_resources;
      if (resData) {
        res.mapped = true;
        const indCats = ['passive', 'cognitive', 'creative', 'movement'];
        let indTotal = 0;
        let socTotal = 0;
        for (const state of ['ventral', 'sympathetic', 'dorsal']) {
          indTotal += countResources(resData[state], indCats);
          socTotal += countResources(resData[state], ['connection']);
        }
        res.individual = indTotal;
        res.social = socTotal;
        res.total = indTotal + socTotal;
      }

      // -- Triggers & Glimmers --
      const tg = {};
      const tgData = triggersRow?.data;
      if (tgData) {
        const triggers = [
          ...(tgData.sympathetic_triggers || []),
          ...(tgData.dorsal_triggers || []),
          ...(tgData.general_triggers || []),
        ];
        const glimmers = [
          ...(tgData.sensory_glimmers || []),
          ...(tgData.relational_glimmers || []),
          ...(tgData.activity_glimmers || []),
          ...(tgData.nature_glimmers || []),
        ];
        if (triggers.length || glimmers.length) {
          tg.mapped = true;
          tg.triggers = triggers.length;
          tg.glimmers = glimmers.length;
        }
      }

      // -- Core Beliefs --
      const cb = {};
      const cbData = beliefsRow?.data;
      if (cbData) {
        cb.mapped = true;
        const scored = BELIEF_DOMAINS
          .map(d => ({ ...d, score: cbData[d.key] }))
          .filter(d => d.score != null)
          .sort((a, b) => b.score - a.score);
        if (scored.length) {
          cb.strongest = scored[0];
          cb.growing = scored[scored.length - 1];
          cb.avg = Math.round((scored.reduce((s, d) => s + d.score, 0) / scored.length) * 10) / 10;
        }
      }

      // -- Parts --
      const p = {};
      if (parts?.allParts?.length) {
        p.mapped = true;
        p.protectors = parts.protectors?.length || 0;
        p.exiles = parts.exiles?.length || 0;
        p.total = parts.allParts.length;
        p.unburdened = parts.unburdenedExiles?.length || 0;
      }

      setAtlas({ nervousSystem: ns, resources: res, triggersGlimmers: tg, coreBeliefs: cb, parts: p });
    } catch (err) {
      console.error('[InnerAtlas] Load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadAtlas(); }, [loadAtlas]));

  // ---------------------------------------------------------------------------
  // Card builder
  // ---------------------------------------------------------------------------

  const buildSummary = (domainKey) => {
    const d = atlas[domainKey] || {};
    if (!d.mapped) return null;

    switch (domainKey) {
      case 'nervousSystem': {
        const lines = [`${d.statesMapped}/3 states mapped`];
        if (d.capacity) lines.push(`Regulation: ${d.capacity}`);
        if (d.awareness) lines.push(`Awareness: ${d.awareness}`);
        return lines.join('  ·  ');
      }
      case 'resources':
        return `${d.total} resources  ·  ${d.individual} individual  ·  ${d.social} social`;
      case 'triggersGlimmers':
        return `${d.triggers} trigger${d.triggers !== 1 ? 's' : ''}  ·  ${d.glimmers} glimmer${d.glimmers !== 1 ? 's' : ''}`;
      case 'coreBeliefs':
        return `Strongest: ${d.strongest?.label} (${d.strongest?.score})  ·  Growing: ${d.growing?.label} (${d.growing?.score})`;
      case 'parts': {
        const bits = [`${d.protectors} protector${d.protectors !== 1 ? 's' : ''}`, `${d.exiles} exile${d.exiles !== 1 ? 's' : ''}`];
        if (d.unburdened > 0) bits.push(`${d.unburdened} unburdened`);
        return bits.join('  ·  ');
      }
      default:
        return null;
    }
  };

  const DOMAINS = [
    { key: 'nervousSystem', emoji: '💚', icon: icons.nsMap, title: 'Nervous System', route: 'NervousSystemSummary', actionRoute: 'NervousSystemMapping', description: 'Your polyvagal map — states, patterns, and awareness' },
    { key: 'resources', emoji: '🛠️', icon: icons.regulatingResources, title: 'Regulation Toolkit', route: 'RegulationToolkit', actionRoute: 'RegulatingResources', description: 'What actually helps you regulate in each state' },
    { key: 'triggersGlimmers', emoji: '⚡', icon: icons.triggerGlimmerMap, title: 'Triggers & Glimmers', route: 'TriggersGlimmersSummary', actionRoute: 'TriggersGlimmers', description: 'What activates you and what brings you back' },
    { key: 'coreBeliefs', emoji: '💭', icon: icons.coreBeliefs, title: 'Core Beliefs', route: 'CoreBeliefsSummary', actionRoute: 'CoreBeliefs', description: 'The deep beliefs that shape your experience' },
    { key: 'parts', emoji: '🔮', icon: icons.roles, title: 'Parts', route: 'PartsSummary', actionRoute: 'IFSChat', description: 'Your inner family — protectors, exiles, and Self' },
  ];

  const renderCard = (domain) => {
    const d = atlas[domain.key] || {};
    const summary = buildSummary(domain.key);
    const isMapped = !!d.mapped;
    const route = isMapped ? domain.route : (domain.actionRoute || domain.route);

    return (
      <TouchableOpacity
        key={domain.key}
        style={styles.optionCard}
        onPress={() => navigation.navigate(route)}
        activeOpacity={0.7}
      >
        <View style={styles.optionLeft}>
          {domain.icon ? (
            <Image source={domain.icon} style={styles.optionIconImage} />
          ) : (
            <Text style={styles.optionEmoji}>{domain.emoji}</Text>
          )}
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>{domain.title}</Text>
            {isMapped ? (
              <Text style={styles.optionSummary}>{summary}</Text>
            ) : (
              <Text style={styles.optionDescription}>{domain.description}</Text>
            )}
            {!isMapped && (
              <Text style={styles.optionCta}>Not yet explored — tap to begin</Text>
            )}
          </View>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  const mappedCount = Object.values(atlas).filter(d => d?.mapped).length;

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
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadAtlas(true)} />}
          >
            {/* Hero */}
            <View style={styles.hero}>
              <Image source={icons.foldedMap} style={styles.heroIcon} />
              <Text style={styles.heroTitle}>Inner Atlas</Text>
              <Text style={styles.heroSubtitle}>
                {mappedCount === 0
                  ? 'Begin mapping your inner landscape. Each domain is a page in your personal atlas.'
                  : `${mappedCount} of 5 domains explored. Your map grows with every session.`}
              </Text>
            </View>

            {/* Domain cards */}
            <View style={styles.optionsContainer}>
              {DOMAINS.map(renderCard)}
            </View>

            {/* Therapist Report + Share */}
            {mappedCount > 0 && (
              <>
                <TouchableOpacity
                  style={styles.reportButton}
                  onPress={() => navigation.navigate('TherapistReport')}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="medical-services" size={18} color={colors.primary} />
                  <Text style={styles.reportButtonText}>View Therapist Report</Text>
                  <MaterialIcons name="chevron-right" size={20} color={colors.primary} />
                </TouchableOpacity>

                <ShareWithTherapistButton
                  label="Share Complete Summary"
                  onShare={async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) await shareAll(user.id);
                  }}
                />
              </>
            )}

            {/* Insights link */}
            <TouchableOpacity
              style={styles.tipBox}
              onPress={() => navigation.navigate('Insights')}
              activeOpacity={0.7}
            >
              <Text style={styles.tipTitle}>📊 Insights & Trends</Text>
              <Text style={styles.tipText}>
                See how your nervous system, parts, and habits change over time.
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

// ---------------------------------------------------------------------------
// Styles — matching PracticeScreen pattern
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

  // Cards
  optionsContainer: {
    marginBottom: spacing.lg,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionEmoji: {
    fontSize: 36,
    marginRight: spacing.md,
  },
  optionIconImage: {
    width: 112,
    height: 112,
    resizeMode: 'contain',
    marginRight: spacing.md,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  optionSummary: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  optionCta: {
    fontSize: 13,
    color: colors.textLight,
    fontStyle: 'italic',
  },

  // Report button
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    ...shadows.soft,
  },
  reportButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    flex: 1,
  },

  // Tip / Insights link
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

export default InnerAtlasScreen;
