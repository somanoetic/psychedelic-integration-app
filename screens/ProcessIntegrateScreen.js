/**
 * Process & Integrate — session-scoped
 *
 * Reached from the Process & Integrate picker with a specific session. Shows
 * that session's post-experience work (Process an Experience, Therapeutic
 * Integration, Integration Journal), plus Session Tools, Share, and a "Close
 * session" action. The Prepare side of the lifecycle lives behind the Prepare
 * for a Journey tile.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, ChevronRight, Clock, Lightbulb, Wrench, CheckCircle2, Calendar } from 'lucide-react-native';
import { colors, gradients, spacing, borderRadius, shadows, typography } from '../theme/colors';
import { icons } from '../lib/uiIcons';
import { supabase } from '../lib/supabase';
import { isClosed, closeSessionPatch, reopenSessionPatch } from '../lib/sessionLifecycle';
import ShareWithTherapistButton from '../components/ShareWithTherapistButton';
import { shareExperienceMapping } from '../lib/therapistShareService';

const ProcessIntegrateScreen = ({ navigation, route }) => {
  const [session, setSession] = useState(route?.params?.session || null);
  const sessionId = route?.params?.session?.id;

  // Refetch on focus so status / progress reflect work done in sub-screens.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!sessionId) return;
      (async () => {
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionId)
          .single();
        if (!cancelled && !error && data) setSession(data);
      })();
      return () => { cancelled = true; };
    }, [sessionId])
  );

  const closed = isClosed(session);

  // The two processing actions, scoped to this session.
  const options = [
    {
      id: 'experience',
      title: 'Process an Experience',
      icon: icons.singlePuzzlePiece,
      description: 'Walk through your experience with AI guidance to uncover insights and meaning',
      estimatedTime: '20-40 min',
      route: 'ExperienceMapping',
      params: { session },
    },
    {
      id: 'therapeutic',
      title: 'Therapeutic Integration',
      icon: icons.repairedHeart,
      description: 'Deeper therapeutic processing using IFS and somatic frameworks',
      estimatedTime: '30-45 min',
      route: 'TherapeuticIntegration',
      params: { session },
    },
    {
      id: 'journal',
      title: 'Integration Journal',
      icon: icons.journal,
      description: 'Free-form journaling to capture thoughts, feelings, and realizations',
      estimatedTime: '10-20 min',
      // The single Supabase-backed Journal (nav tab), not a per-session copy.
      route: 'MainTabs',
      params: { screen: 'Journal' },
    },
  ];

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const persistPatch = async (patch) => {
    if (!sessionId) return;
    const { data, error } = await supabase
      .from('sessions')
      .update(patch)
      .eq('id', sessionId)
      .select()
      .single();
    if (error) {
      const msg = `Could not update session: ${error.message}`;
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
      return;
    }
    if (data) setSession(data);
  };

  const handleCloseToggle = () => {
    if (closed) {
      persistPatch(reopenSessionPatch(session));
      return;
    }
    Alert.alert(
      'Close this session?',
      'It will move to your closed sessions. You can reopen it anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Close session', onPress: () => persistPatch(closeSessionPatch(session)) },
      ]
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
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Hero */}
          <View style={styles.hero}>
            <Image source={icons.singlePuzzlePiece} style={styles.heroIcon} />
            <Text style={styles.heroTitle}>{session?.title || 'Process & Integrate'}</Text>
            <View style={styles.heroDateRow}>
              <Calendar size={15} color={colors.textSecondary} strokeWidth={2} />
              <Text style={styles.heroSubtitle}>{formatDate(session?.journey_date)}</Text>
              {closed && <Text style={styles.closedPill}>Closed</Text>}
            </View>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionCard}
                onPress={() => navigation.navigate(option.route, option.params)}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  <Image source={option.icon} style={styles.optionIconImage} />
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                    <View style={styles.optionTimeRow}>
                      <Clock size={14} color={colors.textLight} strokeWidth={2} />
                      <Text style={styles.optionTime}>{option.estimatedTime}</Text>
                    </View>
                  </View>
                </View>
                <ChevronRight size={24} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Session Tools — in-the-moment supports */}
          <TouchableOpacity
            style={styles.utilityCard}
            onPress={() => navigation.navigate('SessionTools')}
            activeOpacity={0.7}
          >
            <View style={styles.utilityLeft}>
              <Image source={icons.tools} style={styles.utilityIcon} />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Session Tools</Text>
                <Text style={styles.optionDescription}>
                  Glimmer Swiper, grounding & other in-the-moment supports
                </Text>
              </View>
            </View>
            <ChevronRight size={22} color={colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>

          {session && (
            <ShareWithTherapistButton
              label="Share This Session"
              onShare={() => shareExperienceMapping(session)}
            />
          )}

          {/* Close / reopen */}
          {session && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseToggle}
              activeOpacity={0.8}
            >
              <CheckCircle2 size={18} color={colors.textSecondary} strokeWidth={2} />
              <Text style={styles.closeButtonText}>
                {closed ? 'Reopen session' : 'Close session'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Tip */}
          <View style={styles.tipBox}>
            <View style={styles.tipTitleRow}>
              <Lightbulb size={18} color={colors.primary} strokeWidth={2} />
              <Text style={styles.tipTitle}>Integration Tip</Text>
            </View>
            <Text style={styles.tipText}>
              The most important work happens after the experience. Give yourself time and space to process at your own pace.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 80,
  },
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
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  heroIcon: {
    width: 160,
    height: 160,
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
  },
  heroDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  closedPill: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
    backgroundColor: 'rgba(123,157,111,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginLeft: 4,
    overflow: 'hidden',
  },
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
  optionIconImage: {
    width: 96,
    height: 96,
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
  optionTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  optionTime: {
    fontSize: 13,
    color: colors.textLight,
  },
  utilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  utilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  utilityIcon: {
    width: 56,
    height: 56,
    resizeMode: 'contain',
    marginRight: spacing.md,
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tipBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  tipTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  tipText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default ProcessIntegrateScreen;
