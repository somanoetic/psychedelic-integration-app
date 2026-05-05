import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  ActivityIndicator,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme/colors';
import { shareExperienceMapping } from '../lib/therapistShareService';
import { icons } from '../lib/uiIcons';

const ConversationalAllSessions = ({ navigation }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [filter, setFilter] = useState('all'); // all, inProgress, completed

  useEffect(() => {
    loadSessions();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadSessions = async () => {
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

      if (error) {
        console.error('Error loading sessions:', error);
      } else {
        setSessions(data || []);
      }
    } catch (error) {
      console.error('Unexpected error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const getSessionStatus = (session) => {
    const prep = session.session_data?.preparation;
    const experience = session.session_data?.experienceProcessing;
    const integration = session.session_data?.integration;

    if (integration?.completed) return { text: 'Integrated', emoji: '✅', icon: icons.integration, color: colors.success, category: 'completed' };
    if (experience?.completed) return { text: 'Processed', emoji: '📝', icon: icons.journal, color: colors.primary, category: 'inProgress' };
    if (prep?.completedSections?.length > 0) return { text: 'In Progress', emoji: '⏳', icon: icons.trailProgress, color: colors.warning, category: 'inProgress' };
    return { text: 'New', emoji: '✨', icon: icons.newBeginning, color: colors.textSecondary, category: 'inProgress' };
  };

  const getFilteredSessions = () => {
    if (filter === 'all') return sessions;
    return sessions.filter(session => {
      const status = getSessionStatus(session);
      return status.category === filter;
    });
  };

  const filteredSessions = getFilteredSessions();

  const getHuxleyMessage = () => {
    if (loading) {
      return "Let me check your sessions...";
    }

    if (sessions.length === 0) {
      return "It looks like you haven't created any sessions yet. Would you like to start your first session together?";
    }

    const inProgress = sessions.filter(s => getSessionStatus(s).category === 'inProgress').length;
    const completed = sessions.filter(s => getSessionStatus(s).category === 'completed').length;

    if (filter === 'all') {
      return `You have ${sessions.length} session${sessions.length === 1 ? '' : 's'} in your library. ${inProgress > 0 ? `${inProgress} in progress` : ''}${inProgress > 0 && completed > 0 ? ' and ' : ''}${completed > 0 ? `${completed} completed` : ''}. Which one would you like to explore?`;
    } else if (filter === 'inProgress') {
      return `Here are your ${filteredSessions.length} session${filteredSessions.length === 1 ? '' : 's'} that ${filteredSessions.length === 1 ? 'is' : 'are'} still in progress. Let's continue where you left off!`;
    } else {
      return `You've completed ${filteredSessions.length} session${filteredSessions.length === 1 ? '' : 's'}! You can review them anytime.`;
    }
  };

  const renderHuxleyMessage = (message) => (
    <View style={styles.huxleyBubble}>
      <View style={styles.huxleyHeader}>
        <Image
          source={require('../assets/images/huxley-avatar.png')}
          style={styles.huxleyAvatarSmall}
          resizeMode="contain"
        />
        <Text style={styles.huxleyName}>Huxley</Text>
      </View>
      <Text style={styles.huxleyText}>{message}</Text>
    </View>
  );

  const renderFilterOption = (text, filterValue, icon) => (
    <TouchableOpacity
      style={[
        styles.filterBubble,
        filter === filterValue && styles.filterBubbleActive
      ]}
      onPress={() => setFilter(filterValue)}
      activeOpacity={0.8}
    >
      <MaterialIcons
        name={icon}
        size={18}
        color={filter === filterValue ? '#ffffff' : colors.textSecondary}
        style={{ marginRight: 6 }}
      />
      <Text style={[
        styles.filterText,
        filter === filterValue && styles.filterTextActive
      ]}>
        {text}
      </Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={gradients.standard}
      start={gradients.standardStart}
      end={gradients.standardEnd}
      style={styles.gradientFill}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBack} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.appName}>My Sessions</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Huxley's Message */}
            {renderHuxleyMessage(getHuxleyMessage())}

          {/* Filter Options */}
          {sessions.length > 0 && (
            <View style={styles.filterContainer}>
              <Text style={styles.filterLabel}>Show me:</Text>
              <View style={styles.filterRow}>
                {renderFilterOption('All sessions', 'all', 'view-list')}
                {renderFilterOption('In Progress', 'inProgress', 'pending-actions')}
                {renderFilterOption('Completed', 'completed', 'check-circle')}
              </View>
            </View>
          )}

          {/* Sessions List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : filteredSessions.length === 0 && sessions.length > 0 ? (
            <View style={styles.emptyFilterContainer}>
              <Text style={styles.emptyFilterText}>
                No sessions match this filter. Try selecting a different option above!
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
                    onPress={() => navigation.navigate('SessionDetail', { session })}
                  >
                    <View style={styles.sessionHeader}>
                      <View style={styles.sessionTitleContainer}>
                        <Text style={styles.sessionTitle}>{session.title}</Text>
                        <View style={styles.sessionMeta}>
                          <Text style={styles.sessionDate}>
                            📅 {formatDate(session.journey_date)}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                        {status.icon ? (
                          <Image source={status.icon} style={styles.statusIconImage} />
                        ) : (
                          <Text style={styles.statusEmoji}>{status.emoji}</Text>
                        )}
                      </View>
                    </View>

                    {/* Progress Indicators */}
                    <View style={styles.progressRow}>
                      <View style={styles.progressDot}>
                        <MaterialIcons
                          name={session.session_data?.preparation?.completedSections?.length > 0 ? 'check-circle' : 'radio-button-unchecked'}
                          size={16}
                          color={session.session_data?.preparation?.completedSections?.length > 0 ? colors.success : '#d1d5db'}
                        />
                        <Text style={styles.progressLabel}>Prep</Text>
                      </View>
                      <View style={styles.progressDot}>
                        <MaterialIcons
                          name={session.session_data?.experienceProcessing?.completed ? 'check-circle' : 'radio-button-unchecked'}
                          size={16}
                          color={session.session_data?.experienceProcessing?.completed ? colors.success : '#d1d5db'}
                        />
                        <Text style={styles.progressLabel}>Process</Text>
                      </View>
                      <View style={styles.progressDot}>
                        <MaterialIcons
                          name={session.session_data?.integration?.completed ? 'check-circle' : 'radio-button-unchecked'}
                          size={16}
                          color={session.session_data?.integration?.completed ? colors.success : '#d1d5db'}
                        />
                        <Text style={styles.progressLabel}>Integrate</Text>
                      </View>
                    </View>

                    <View style={styles.sessionFooter}>
                      <Text style={styles.tapToOpen}>Tap to continue →</Text>
                      <TouchableOpacity
                        style={styles.shareIcon}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          shareExperienceMapping(session).catch(() => {});
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <MaterialIcons name="share" size={18} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Action Buttons */}
          {sessions.length === 0 ? (
            <View style={styles.optionsContainer}>
              <Text style={styles.optionsLabel}>You:</Text>
              <TouchableOpacity
                style={[styles.responseBubble, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('SessionTools')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="add-circle" size={20} color="#ffffff" style={styles.responseIcon} />
                <Text style={styles.responseText}>Create my first session</Text>
                <MaterialIcons name="arrow-forward" size={16} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.responseBubble, { backgroundColor: colors.darkGray }]}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
              >
                <MaterialIcons name="arrow-back" size={20} color="#ffffff" style={styles.responseIcon} />
                <Text style={styles.responseText}>Go back</Text>
                <MaterialIcons name="arrow-forward" size={16} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </View>
          ) : null}
          </Animated.View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerBack: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  huxleyBubble: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderTopLeftRadius: 4,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  huxleyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  huxleyAvatarSmall: {
    width: 54,
    height: 54,
    marginRight: spacing.sm,
  },
  huxleyName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  huxleyText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  filterContainer: {
    marginBottom: spacing.lg,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.sand,
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
    color: colors.textInverse,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyFilterContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyFilterText: {
    fontSize: 15,
    color: colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sessionsListContainer: {
    marginBottom: spacing.lg,
  },
  sessionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    ...shadows.soft,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  },
  sessionDate: {
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
  statusEmoji: {
    fontSize: 18,
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
  shareIcon: {
    padding: 4,
  },
  tapToOpen: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  optionsContainer: {
    marginTop: spacing.sm,
  },
  optionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  responseBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderTopRightRadius: 4,
    marginBottom: spacing.sm,
    alignSelf: 'flex-end',
    maxWidth: '85%',
    ...shadows.soft,
  },
  responseIcon: {
    marginRight: spacing.sm,
  },
  responseText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },
});

export default ConversationalAllSessions;
