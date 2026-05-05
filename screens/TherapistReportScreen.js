/**
 * Therapist Report Screen
 *
 * A stylized, comprehensive clinical-style summary of the patient's
 * Inner Atlas data — designed for sharing with a therapist in-app.
 */

import React, { useState, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import polyvagalContextService from '../lib/polyvagalContextService';
import ifsContextService from '../lib/ifsContextService';
import { shareAll } from '../lib/therapistShareService';
import ShareWithTherapistButton from '../components/ShareWithTherapistButton';
import { colors, gradients, shadows, spacing, borderRadius } from '../theme/colors';

// ---------------------------------------------------------------------------
// Config
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

const NS_STATES = [
  { key: 'ventral', emoji: '💚', label: 'Safe & Connected' },
  { key: 'sympathetic', emoji: '⚡', label: 'Fight / Flight' },
  { key: 'dorsal', emoji: '🫥', label: 'Shutdown / Freeze' },
];

const ROLE_CONFIG = {
  manager: { emoji: '🛡️', label: 'Manager' },
  firefighter: { emoji: '🔥', label: 'Firefighter' },
  exile: { emoji: '💔', label: 'Exile' },
};

const getScoreColor = (score) => {
  if (score <= 3) return colors.error;
  if (score <= 5) return colors.warning;
  if (score <= 7) return colors.success;
  return colors.primary;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TherapistReportScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [report, setReport] = useState({});

  const loadReport = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [patterns, parts, resourcesRow, beliefsRow, triggersRow, journalsRow] = await Promise.all([
        polyvagalContextService.loadUserPatterns(user.id).catch(() => null),
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
        supabase
          .from('daily_journals')
          .select('title, mood, emotions, themes, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3),
      ]);

      setReport({
        patterns,
        parts,
        resources: resourcesRow?.data?.state_based_resources,
        beliefs: beliefsRow?.data,
        triggers: triggersRow?.data,
        journals: journalsRow?.data,
      });
    } catch (err) {
      console.error('[TherapistReport] Load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadReport(); }, [loadReport]));

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  // ---------------------------------------------------------------------------
  // Section renderers
  // ---------------------------------------------------------------------------

  const renderSectionHeader = (emoji, title, date) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <Text style={styles.sectionEmoji}>{emoji}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {date ? <Text style={styles.sectionDate}>{formatDate(date)}</Text> : null}
    </View>
  );

  const renderNervousSystem = () => {
    const p = report.patterns;
    if (!p) return null;
    const hasMapped = p.ventral_patterns?.situations?.length > 0
      || p.sympathetic_patterns?.situations?.length > 0
      || p.dorsal_patterns?.situations?.length > 0;
    if (!hasMapped) return null;

    return (
      <View style={styles.section}>
        {renderSectionHeader('💚', 'Nervous System Map')}

        {/* Meta stats */}
        <View style={styles.metaRow}>
          {p.regulation_capacity && (
            <View style={styles.metaPill}>
              <Text style={styles.metaPillLabel}>Regulation</Text>
              <Text style={styles.metaPillValue}>{p.regulation_capacity}</Text>
            </View>
          )}
          {p.awareness_level && (
            <View style={styles.metaPill}>
              <Text style={styles.metaPillLabel}>Awareness</Text>
              <Text style={styles.metaPillValue}>{p.awareness_level}</Text>
            </View>
          )}
        </View>

        {NS_STATES.map(({ key, emoji, label }) => {
          const state = p[`${key}_patterns`] || {};
          const items = [
            ...(state.situations || []),
            ...(state.body_sensations || []),
            ...(state.thoughts || []),
            ...(state.behaviors || []),
          ];
          if (!items.length) return null;

          return (
            <View key={key} style={styles.subsection}>
              <Text style={styles.subsectionTitle}>{emoji} {label}</Text>
              {state.body_sensations?.length > 0 && (
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Body:</Text>
                  <Text style={styles.fieldValue}>{state.body_sensations.map(s => typeof s === 'string' ? s : s.description || s.type).join(', ')}</Text>
                </View>
              )}
              {state.thoughts?.length > 0 && (
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Thoughts:</Text>
                  <Text style={styles.fieldValue}>{state.thoughts.map(s => typeof s === 'string' ? s : s.description || s.type).join(', ')}</Text>
                </View>
              )}
              {state.behaviors?.length > 0 && (
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Behaviors:</Text>
                  <Text style={styles.fieldValue}>{state.behaviors.map(s => typeof s === 'string' ? s : s.description || s.type).join(', ')}</Text>
                </View>
              )}
              {state.situations?.length > 0 && (
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Situations:</Text>
                  <Text style={styles.fieldValue}>{state.situations.map(s => typeof s === 'string' ? s : s.description || s.type).join(', ')}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderCoreBeliefs = () => {
    const cb = report.beliefs;
    if (!cb) return null;

    const scored = BELIEF_DOMAINS
      .map(d => ({ ...d, score: cb[d.key] }))
      .filter(d => d.score != null)
      .sort((a, b) => b.score - a.score);
    if (!scored.length) return null;

    const avg = Math.round((scored.reduce((s, d) => s + d.score, 0) / scored.length) * 10) / 10;

    return (
      <View style={styles.section}>
        {renderSectionHeader('💭', 'Core Beliefs', cb.created_at)}

        <View style={styles.avgRow}>
          <Text style={styles.avgLabel}>Overall</Text>
          <Text style={[styles.avgValue, { color: getScoreColor(avg) }]}>{avg}/10</Text>
        </View>

        {scored.map(d => {
          const pct = Math.min((d.score / 10) * 100, 100);
          const color = getScoreColor(d.score);
          return (
            <View key={d.key} style={styles.beliefRow}>
              <Text style={styles.beliefLabel}>{d.label}</Text>
              <View style={styles.beliefBarBg}>
                <View style={[styles.beliefBarFill, { width: `${pct}%`, backgroundColor: color }]} />
              </View>
              <Text style={[styles.beliefScore, { color }]}>{d.score}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderResources = () => {
    const res = report.resources;
    if (!res) return null;

    const allCategories = ['passive', 'cognitive', 'creative', 'movement', 'connection'];
    const catLabels = { passive: 'Sensory', cognitive: 'Cognitive', creative: 'Creative', movement: 'Movement', connection: 'Connection' };

    return (
      <View style={styles.section}>
        {renderSectionHeader('🛠️', 'Regulation Toolkit')}
        {['ventral', 'sympathetic', 'dorsal'].map(state => {
          const stateData = res[state] || {};
          const cats = allCategories.filter(c => stateData[c]?.length > 0);
          if (!cats.length) return null;

          const stateLabel = { ventral: '💚 Safe & Connected', sympathetic: '⚡ Fight / Flight', dorsal: '🫥 Shutdown / Freeze' }[state];
          return (
            <View key={state} style={styles.subsection}>
              <Text style={styles.subsectionTitle}>{stateLabel}</Text>
              {cats.map(cat => (
                <View key={cat} style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>{catLabels[cat]}:</Text>
                  <Text style={styles.fieldValue}>{stateData[cat].join(', ')}</Text>
                </View>
              ))}
            </View>
          );
        })}
      </View>
    );
  };

  const renderTriggersGlimmers = () => {
    const tg = report.triggers;
    if (!tg) return null;

    const triggers = [
      ...(tg.sympathetic_triggers || []),
      ...(tg.dorsal_triggers || []),
      ...(tg.general_triggers || []),
    ];
    const glimmers = [
      ...(tg.sensory_glimmers || []),
      ...(tg.relational_glimmers || []),
      ...(tg.activity_glimmers || []),
      ...(tg.nature_glimmers || []),
    ];
    if (!triggers.length && !glimmers.length) return null;

    return (
      <View style={styles.section}>
        {renderSectionHeader('⚡', 'Triggers & Glimmers', tg.created_at)}
        {triggers.length > 0 && (
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Triggers ({triggers.length})</Text>
            <View style={styles.chipContainer}>
              {triggers.map((t, i) => (
                <View key={i} style={[styles.chip, styles.chipTrigger]}>
                  <Text style={styles.chipTextTrigger}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        {glimmers.length > 0 && (
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Glimmers ({glimmers.length})</Text>
            <View style={styles.chipContainer}>
              {glimmers.map((g, i) => (
                <View key={i} style={[styles.chip, styles.chipGlimmer]}>
                  <Text style={styles.chipTextGlimmer}>{g}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderParts = () => {
    const parts = report.parts?.allParts;
    if (!parts?.length) return null;

    return (
      <View style={styles.section}>
        {renderSectionHeader('🔮', 'IFS Parts Inventory')}

        <View style={styles.partsOverview}>
          <Text style={styles.partsOverviewText}>
            {report.parts.protectors?.length || 0} protectors  ·  {report.parts.exiles?.length || 0} exiles  ·  {report.parts.unburdenedExiles?.length || 0} unburdened
          </Text>
        </View>

        {parts.map(part => {
          const role = ROLE_CONFIG[part.part_role] || { emoji: '❓', label: part.part_role || 'Unknown' };
          return (
            <View key={part.id} style={styles.partRow}>
              <Text style={styles.partEmoji}>{role.emoji}</Text>
              <View style={styles.partInfo}>
                <Text style={styles.partName}>{part.part_name || 'Unnamed'}</Text>
                <Text style={styles.partDetail}>
                  {role.label}
                  {part.protective_strategy ? ` — ${part.protective_strategy}` : ''}
                  {part.location_in_body ? ` (${part.location_in_body})` : ''}
                </Text>
              </View>
              {part.unburdened && (
                <MaterialIcons name="check-circle" size={16} color={colors.success} />
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderRecentJournals = () => {
    const journals = report.journals;
    if (!journals?.length) return null;

    return (
      <View style={styles.section}>
        {renderSectionHeader('📓', 'Recent Journal Themes')}
        {journals.map((j, i) => (
          <View key={i} style={styles.journalRow}>
            <Text style={styles.journalDate}>{formatDate(j.created_at)}</Text>
            <View style={styles.journalContent}>
              {j.mood && <Text style={styles.journalMood}>Mood: {j.mood}</Text>}
              {j.emotions?.length > 0 && (
                <Text style={styles.journalEmotions}>{j.emotions.join(', ')}</Text>
              )}
              {j.themes?.length > 0 && (
                <Text style={styles.journalThemes}>Themes: {j.themes.join(', ')}</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  // Count how many sections have data
  const sectionCount = [
    report.patterns,
    report.beliefs,
    report.resources,
    report.triggers,
    report.parts?.allParts?.length,
  ].filter(Boolean).length;

  // ---------------------------------------------------------------------------
  // Render
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
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadReport(true)} />}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <MaterialIcons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Report header */}
            <View style={styles.reportHeader}>
              <View style={styles.reportBadge}>
                <MaterialIcons name="medical-services" size={20} color={colors.primary} />
                <Text style={styles.reportBadgeText}>Clinical Summary</Text>
              </View>
              <Text style={styles.reportTitle}>Integration Report</Text>
              <Text style={styles.reportSubtitle}>
                Generated {formatDate(new Date().toISOString())}  ·  {sectionCount} domain{sectionCount !== 1 ? 's' : ''} mapped
              </Text>
            </View>

            {/* Disclaimer */}
            <View style={styles.disclaimer}>
              <MaterialIcons name="info-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.disclaimerText}>
                This report reflects the user's self-reported experience and AI-guided exploration. It is not a clinical assessment.
              </Text>
            </View>

            {sectionCount === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No atlas data to report yet. Begin exploring your Inner Atlas to generate a report.
                </Text>
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => navigation.navigate('InnerAtlas')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.startButtonText}>Go to Inner Atlas</Text>
                  <MaterialIcons name="arrow-forward" size={18} color={colors.textInverse} />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {renderNervousSystem()}
                {renderCoreBeliefs()}
                {renderResources()}
                {renderTriggersGlimmers()}
                {renderParts()}
                {renderRecentJournals()}

                {/* Share button */}
                <ShareWithTherapistButton
                  label="Share Full Report"
                  onShare={async () => {
                    if (userId) await shareAll(userId);
                  }}
                  style={{ marginTop: spacing.md }}
                />
              </>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: 80 },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  backButton: { padding: spacing.sm, borderRadius: borderRadius.sm, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },

  // Report header
  reportHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  reportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${colors.primary}12`,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
  },
  reportBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reportTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  reportSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Disclaimer
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.textLight,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    fontStyle: 'italic',
  },

  // Sections
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionEmoji: { fontSize: 22 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  sectionDate: { fontSize: 12, color: colors.textLight },

  // Meta pills
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metaPill: {
    backgroundColor: colors.offWhite,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaPillLabel: { fontSize: 12, color: colors.textSecondary },
  metaPillValue: { fontSize: 12, fontWeight: '600', color: colors.text, textTransform: 'capitalize' },

  // Subsections
  subsection: {
    marginBottom: spacing.md,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },

  // Field rows
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    width: 80,
  },
  fieldValue: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
    lineHeight: 18,
  },

  // Beliefs
  avgRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
  },
  avgLabel: { fontSize: 14, color: colors.textSecondary },
  avgValue: { fontSize: 20, fontWeight: '700' },

  beliefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: spacing.sm,
  },
  beliefLabel: { fontSize: 13, color: colors.text, width: 90 },
  beliefBarBg: { flex: 1, height: 6, backgroundColor: colors.offWhite, borderRadius: 3, overflow: 'hidden' },
  beliefBarFill: { height: '100%', borderRadius: 3 },
  beliefScore: { fontSize: 13, fontWeight: '700', width: 20, textAlign: 'right' },

  // Chips (triggers/glimmers)
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  chipTrigger: { backgroundColor: '#fef2f2' },
  chipTextTrigger: { fontSize: 13, color: '#dc2626' },
  chipGlimmer: { backgroundColor: '#f0fdf4' },
  chipTextGlimmer: { fontSize: 13, color: '#16a34a' },

  // Parts
  partsOverview: { marginBottom: spacing.md },
  partsOverviewText: { fontSize: 13, color: colors.textSecondary },
  partRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
    gap: 8,
  },
  partEmoji: { fontSize: 20 },
  partInfo: { flex: 1 },
  partName: { fontSize: 14, fontWeight: '600', color: colors.text },
  partDetail: { fontSize: 12, color: colors.textSecondary, lineHeight: 16 },

  // Journals
  journalRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
    gap: spacing.sm,
  },
  journalDate: { fontSize: 12, color: colors.textLight, width: 70 },
  journalContent: { flex: 1 },
  journalMood: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 2 },
  journalEmotions: { fontSize: 12, color: colors.textSecondary },
  journalThemes: { fontSize: 12, color: colors.textLight, fontStyle: 'italic', marginTop: 2 },

  // Empty
  emptyContainer: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: spacing.lg },
  startButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 4, borderRadius: borderRadius.md },
  startButtonText: { color: colors.textInverse, fontSize: 16, fontWeight: '600' },
});

export default TherapistReportScreen;
