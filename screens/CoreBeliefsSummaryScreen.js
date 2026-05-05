/**
 * Core Beliefs Summary Screen
 *
 * Displays the user's most recent core beliefs assessment results
 * across 10 domains, with visual bars and strongest/growing highlights.
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
import { colors, gradients, shadows, spacing, borderRadius, typography } from '../theme/colors';
import ShareWithTherapistButton from '../components/ShareWithTherapistButton';
import { shareCoreBeliefs } from '../lib/therapistShareService';
import { icons } from '../lib/uiIcons';

const DOMAINS = [
  { key: 'value_worthiness', label: 'Value & Worthiness', statement: 'I am worthy' },
  { key: 'security_safety', label: 'Security & Safety', statement: 'I am safe' },
  { key: 'performance_competence', label: 'Competence', statement: 'I am competent' },
  { key: 'control_power', label: 'Control & Power', statement: 'I am powerful' },
  { key: 'love_nurturance', label: 'Love & Nurturance', statement: 'I am loved' },
  { key: 'autonomy_independence', label: 'Autonomy', statement: 'I am autonomous' },
  { key: 'justice_fairness', label: 'Justice & Fairness', statement: 'I am treated justly' },
  { key: 'belonging_connection', label: 'Belonging', statement: 'I belong' },
  { key: 'others_trust', label: 'Trust in Others', statement: 'People are good' },
  { key: 'standards_compassion', label: 'Self-Compassion', statement: 'My standards are reasonable' },
];

const getScoreColor = (score) => {
  if (score <= 3) return colors.error;
  if (score <= 5) return colors.warning;
  if (score <= 7) return colors.success;
  return colors.primary;
};

const getScoreLabel = (score) => {
  if (score <= 3) return 'Limiting';
  if (score <= 5) return 'Developing';
  if (score <= 7) return 'Healthy';
  return 'Strong';
};

const CoreBeliefsSummaryScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assessment, setAssessment] = useState(null);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('core_beliefs_assessments')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') console.error('[CBSummary] Load error:', error);
        setAssessment(null);
      } else {
        setAssessment(data);
      }
    } catch (err) {
      console.error('[CBSummary] Load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const scored = assessment
    ? DOMAINS
        .map(d => ({ ...d, score: assessment[d.key] }))
        .filter(d => d.score != null)
        .sort((a, b) => b.score - a.score)
    : [];

  const avg = scored.length
    ? Math.round((scored.reduce((s, d) => s + d.score, 0) / scored.length) * 10) / 10
    : 0;

  const renderDomainRow = (domain) => {
    const color = getScoreColor(domain.score);
    const pct = Math.min((domain.score / 10) * 100, 100);

    return (
      <View key={domain.key} style={styles.domainRow}>
        <View style={styles.domainInfo}>
          <Text style={styles.domainLabel}>{domain.label}</Text>
          <Text style={styles.domainStatement}>{domain.statement}</Text>
        </View>
        <View style={styles.domainBarContainer}>
          <View style={styles.domainBarBg}>
            <View style={[styles.domainBarFill, { width: `${pct}%`, backgroundColor: color }]} />
          </View>
          <Text style={[styles.domainScore, { color }]}>{domain.score}</Text>
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
              <Image source={icons.coreBeliefs} style={styles.heroIcon} />
              <Text style={styles.heroTitle}>Core Beliefs</Text>
              <Text style={styles.heroSubtitle}>
                {assessment
                  ? 'The deep beliefs that shape your experience of yourself and the world.'
                  : 'Explore the core beliefs that shape your life.'}
              </Text>
            </View>

            {!assessment ? (
              <View style={styles.emptyContainer}>
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => navigation.navigate('CoreBeliefs')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.startButtonText}>Take Assessment</Text>
                  <MaterialIcons name="arrow-forward" size={18} color={colors.textInverse} />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Average card */}
                <View style={styles.avgCard}>
                  <Text style={styles.avgLabel}>Overall Average</Text>
                  <Text style={[styles.avgScore, { color: getScoreColor(avg) }]}>{avg}</Text>
                  <Text style={[styles.avgStatus, { color: getScoreColor(avg) }]}>{getScoreLabel(avg)}</Text>
                </View>

                {/* Highlights */}
                {scored.length >= 2 && (
                  <View style={styles.highlightsRow}>
                    <View style={styles.highlightCard}>
                      <Text style={styles.highlightLabel}>Strongest</Text>
                      <Text style={styles.highlightDomain}>{scored[0].label}</Text>
                      <Text style={[styles.highlightScore, { color: getScoreColor(scored[0].score) }]}>{scored[0].score}/10</Text>
                    </View>
                    <View style={styles.highlightCard}>
                      <Text style={styles.highlightLabel}>Growing Edge</Text>
                      <Text style={styles.highlightDomain}>{scored[scored.length - 1].label}</Text>
                      <Text style={[styles.highlightScore, { color: getScoreColor(scored[scored.length - 1].score) }]}>{scored[scored.length - 1].score}/10</Text>
                    </View>
                  </View>
                )}

                {/* All domains */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardEmoji}>📊</Text>
                    <View style={styles.cardHeaderText}>
                      <Text style={styles.cardTitle}>All Domains</Text>
                      <Text style={styles.cardSubtitle}>Sorted strongest to growing edge</Text>
                    </View>
                  </View>
                  {scored.map(renderDomainRow)}
                </View>

                <ShareWithTherapistButton
                  label="Share Core Beliefs Assessment"
                  onShare={() => shareCoreBeliefs(assessment)}
                />

                <TouchableOpacity
                  style={styles.tipBox}
                  onPress={() => navigation.navigate('CoreBeliefs')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tipTitle}>🔄 Retake Assessment</Text>
                  <Text style={styles.tipText}>
                    Core beliefs shift over time, especially after integration work. Retake periodically to track your growth.
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

  // Average card
  avgCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avgLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  avgScore: { fontSize: 36, fontWeight: '700' },
  avgStatus: { fontSize: 14, fontWeight: '600', marginTop: 2 },

  // Highlights
  highlightsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  highlightCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.soft,
  },
  highlightLabel: { fontSize: 12, color: colors.textLight, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  highlightDomain: { fontSize: 15, fontWeight: '600', color: colors.text, textAlign: 'center', marginBottom: 4 },
  highlightScore: { fontSize: 18, fontWeight: '700' },

  // Domain list card
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  cardEmoji: { fontSize: 36, marginRight: spacing.md },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 2 },
  cardSubtitle: { fontSize: 14, color: colors.textSecondary },

  // Domain rows
  domainRow: { marginBottom: spacing.sm },
  domainInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 },
  domainLabel: { fontSize: 14, fontWeight: '500', color: colors.text },
  domainStatement: { fontSize: 12, color: colors.textLight, fontStyle: 'italic' },
  domainBarContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  domainBarBg: { flex: 1, height: 8, backgroundColor: colors.offWhite, borderRadius: 4, overflow: 'hidden' },
  domainBarFill: { height: '100%', borderRadius: 4 },
  domainScore: { fontSize: 14, fontWeight: '700', width: 24, textAlign: 'right' },

  // Empty
  emptyContainer: { alignItems: 'center', paddingVertical: spacing.xl },
  startButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 4, borderRadius: borderRadius.md },
  startButtonText: { color: colors.textInverse, fontSize: 16, fontWeight: '600' },

  // Tip
  tipBox: { backgroundColor: 'rgba(255, 255, 255, 0.7)', padding: spacing.md, borderRadius: borderRadius.lg, borderLeftWidth: 4, borderLeftColor: colors.primary },
  tipTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  tipText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
});

export default CoreBeliefsSummaryScreen;
