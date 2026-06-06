import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft,
  Calendar,
  List,
  Hourglass,
  CheckCircle2,
  Circle,
  Share2,
  ChevronRight,
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { colors, gradients, spacing, borderRadius, shadows, typography } from '../theme/colors';
import { shareExperienceMapping } from '../lib/therapistShareService';
import { icons } from '../lib/uiIcons';
import { getSessionStatus } from '../lib/sessionLifecycle';

const FILTER_ICON_MAP = {
  'view-list': List,
  'pending-actions': Hourglass,
  'check-circle': CheckCircle2,
};

// The session archive (History tab). Read-only: it mirrors the Sessions hub's
// clean card aesthetic but cannot create new sessions — that lives in
// SessionsHubScreen ("Prepare for a Journey"). Keeps the archive-specific
// extras (status filters, per-card stage progress, share) that are useful when
// browsing many past sessions.
const ConversationalAllSessions = ({ navigation }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, inProgress, completed

  // Reload on focus so sessions created/updated elsewhere stay current.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          setLoading(true);
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError || !user) {
            console.error('Auth error:', userError);
            return;
          }
          const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          if (cancelled) return;
          if (error) {
            console.error('Error loading sessions:', error);
          } else {
            setSessions(data || []);
          }
        } catch (error) {
          console.error('Unexpected error loading sessions:', error);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => { cancelled = true; };
    }, [])
  );

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString();
  };

  // Status/category come from the shared lifecycle helper so this archive,
  // the Prepare hub, and the Process & Integrate picker all agree on what
  // counts as in-progress vs closed.

  const getFilteredSessions = () => {
    if (filter === 'all') return sessions;
    return sessions.filter((session) => getSessionStatus(session).category === filter);
  };

  const filteredSessions = getFilteredSessions();

  const subtitle = () => {
    if (loading) return 'Gathering your sessions…';
    if (sessions.length === 0) return 'Your past sessions will appear here.';
    const inProgress = sessions.filter((s) => getSessionStatus(s).category === 'inProgress').length;
    const closed = sessions.filter((s) => getSessionStatus(s).category === 'closed').length;
    const parts = [];
    if (inProgress > 0) parts.push(`${inProgress} in progress`);
    if (closed > 0) parts.push(`${closed} closed`);
    const detail = parts.length ? ` · ${parts.join(' · ')}` : '';
    return `${sessions.length} session${sessions.length === 1 ? '' : 's'}${detail}`;
  };

  const renderFilterOption = (text, filterValue, icon) => {
    const Icon = FILTER_ICON_MAP[icon] || List;
    const active = filter === filterValue;
    return (
      <TouchableOpacity
        style={[styles.filterBubble, active && styles.filterBubbleActive]}
        onPress={() => setFilter(filterValue)}
        activeOpacity={0.8}
      >
        <Icon
          size={16}
          color={active ? colors.white : colors.textSecondary}
          strokeWidth={2}
          style={{ marginRight: 6 }}
        />
        <Text style={[styles.filterText, active && styles.filterTextActive]}>
          {text}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={gradients.standard}
      start={gradients.standardStart}
      end={gradients.standardEnd}
      style={styles.gradientFill}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerBack} onPress={() => navigation.goBack()}>
              <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.hero}>
            <Image source={icons.mapRefined} style={styles.heroIcon} />
            <Text style={styles.heroTitle}>Sessions</Text>
            <Text style={styles.heroSubtitle}>{subtitle()}</Text>
          </View>

          {/* Filters */}
          {sessions.length > 0 && (
            <View style={styles.filterRow}>
              {renderFilterOption('All', 'all', 'view-list')}
              {renderFilterOption('In Progress', 'inProgress', 'pending-actions')}
              {renderFilterOption('Closed', 'closed', 'check-circle')}
            </View>
          )}

          {/* Sessions */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : sessions.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                No sessions yet. Start one from “Prepare for a Journey” on the home
                screen, and it will show up here.
              </Text>
            </View>
          ) : filteredSessions.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                No sessions match this filter.
              </Text>
            </View>
          ) : (
            <View style={styles.sessionsListContainer}>
              {filteredSessions.map((session) => {
                const status = getSessionStatus(session);
                return (
                  <TouchableOpacity
                    key={session.id}
                    style={styles.sessionCard}
                    onPress={() => navigation.navigate('ProcessIntegrate', { session })}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sessionHeader}>
                      <View style={styles.sessionTitleContainer}>
                        <Text style={styles.sessionTitle} numberOfLines={1}>
                          {session.title}
                        </Text>
                        <View style={styles.sessionMeta}>
                          <Calendar size={13} color={colors.textSecondary} strokeWidth={2} />
                          <Text style={styles.sessionDate}>
                            {formatDate(session.journey_date)}
                          </Text>
                          <Text style={styles.sessionDot}>·</Text>
                          <Text style={styles.sessionStatusText}>{status.text}</Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                        <Image source={status.icon} style={styles.statusIconImage} />
                      </View>
                    </View>

                    {/* Stage progress */}
                    <View style={styles.progressRow}>
                      <View style={styles.progressDot}>
                        {session.session_data?.preparation?.completedSections?.length > 0 ? (
                          <CheckCircle2 size={16} color={colors.success} strokeWidth={2} />
                        ) : (
                          <Circle size={16} color={'#d1d5db'} strokeWidth={2} />
                        )}
                        <Text style={styles.progressLabel}>Prep</Text>
                      </View>
                      <View style={styles.progressDot}>
                        {session.session_data?.experienceProcessing?.completed ? (
                          <CheckCircle2 size={16} color={colors.success} strokeWidth={2} />
                        ) : (
                          <Circle size={16} color={'#d1d5db'} strokeWidth={2} />
                        )}
                        <Text style={styles.progressLabel}>Process</Text>
                      </View>
                      <View style={styles.progressDot}>
                        {session.session_data?.integration?.completed ? (
                          <CheckCircle2 size={16} color={colors.success} strokeWidth={2} />
                        ) : (
                          <Circle size={16} color={'#d1d5db'} strokeWidth={2} />
                        )}
                        <Text style={styles.progressLabel}>Integrate</Text>
                      </View>
                    </View>

                    <View style={styles.sessionFooter}>
                      <View style={styles.openRow}>
                        <Text style={styles.tapToOpen}>Open</Text>
                        <ChevronRight size={16} color={colors.primary} strokeWidth={2} />
                      </View>
                      <TouchableOpacity
                        style={styles.shareIcon}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          shareExperienceMapping(session).catch(() => {});
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Share2 size={18} color={colors.primary} strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientFill: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerBack: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
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
    paddingHorizontal: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.lg,
  },
  filterBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.sand,
    ...shadows.soft,
  },
  filterBubbleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  sessionsListContainer: {
    marginBottom: spacing.lg,
  },
  sessionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sessionTitleContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  sessionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sessionDate: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  sessionDot: {
    fontSize: 13,
    color: colors.textLight,
  },
  sessionStatusText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statusBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIconImage: {
    width: 52,
    height: 52,
    resizeMode: 'contain',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.sand,
    marginBottom: spacing.xs,
  },
  progressDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  sessionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  openRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  shareIcon: {
    padding: 4,
  },
  tapToOpen: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default ConversationalAllSessions;
