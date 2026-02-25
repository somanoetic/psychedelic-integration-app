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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AVATAR_OPTIONS } from './AvatarSelector';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';

const ConversationalAllSessions = ({ navigation }) => {
  const [selectedAvatar, setSelectedAvatar] = useState('brain');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [filter, setFilter] = useState('all'); // all, inProgress, completed

  useEffect(() => {
    loadPreferences();
    loadSessions();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadPreferences = async () => {
    try {
      const avatar = await AsyncStorage.getItem('huxley_avatar');
      if (avatar) setSelectedAvatar(avatar);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

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

  const getAvatar = () => {
    return AVATAR_OPTIONS.find(a => a.id === selectedAvatar) || AVATAR_OPTIONS[0];
  };

  const avatar = getAvatar();

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

    if (integration?.completed) return { text: 'Integrated', emoji: '✅', color: '#10b981', category: 'completed' };
    if (experience?.completed) return { text: 'Processed', emoji: '📝', color: '#3b82f6', category: 'inProgress' };
    if (prep?.completedSections?.length > 0) return { text: 'In Progress', emoji: '⏳', color: '#f59e0b', category: 'inProgress' };
    return { text: 'New', emoji: '✨', color: '#6b7280', category: 'inProgress' };
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
        <View style={[styles.huxleyAvatarSmall, { backgroundColor: `${avatar.color}20` }]}>
          <MaterialIcons name={avatar.icon} size={24} color={avatar.color} />
        </View>
        <Text style={styles.huxleyName}>{avatar.name}</Text>
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
        color={filter === filterValue ? '#ffffff' : '#6b7280'}
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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.appName}>My Sessions</Text>
        <View style={{ width: 24 }} />
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
              <ActivityIndicator size="large" color={avatar.color} />
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
                        <Text style={styles.statusEmoji}>{status.emoji}</Text>
                      </View>
                    </View>

                    {/* Progress Indicators */}
                    <View style={styles.progressRow}>
                      <View style={styles.progressDot}>
                        <MaterialIcons
                          name={session.session_data?.preparation?.completedSections?.length > 0 ? 'check-circle' : 'radio-button-unchecked'}
                          size={16}
                          color={session.session_data?.preparation?.completedSections?.length > 0 ? '#10b981' : '#d1d5db'}
                        />
                        <Text style={styles.progressLabel}>Prep</Text>
                      </View>
                      <View style={styles.progressDot}>
                        <MaterialIcons
                          name={session.session_data?.experienceProcessing?.completed ? 'check-circle' : 'radio-button-unchecked'}
                          size={16}
                          color={session.session_data?.experienceProcessing?.completed ? '#10b981' : '#d1d5db'}
                        />
                        <Text style={styles.progressLabel}>Process</Text>
                      </View>
                      <View style={styles.progressDot}>
                        <MaterialIcons
                          name={session.session_data?.integration?.completed ? 'check-circle' : 'radio-button-unchecked'}
                          size={16}
                          color={session.session_data?.integration?.completed ? '#10b981' : '#d1d5db'}
                        />
                        <Text style={styles.progressLabel}>Integrate</Text>
                      </View>
                    </View>

                    <View style={styles.sessionFooter}>
                      <Text style={styles.tapToOpen}>Tap to continue →</Text>
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
                style={[styles.responseBubble, { backgroundColor: '#10b981' }]}
                onPress={() => navigation.navigate('SessionTools')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="add-circle" size={20} color="#ffffff" style={styles.responseIcon} />
                <Text style={styles.responseText}>Create my first session</Text>
                <MaterialIcons name="arrow-forward" size={16} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.responseBubble, { backgroundColor: '#6b7280' }]}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  huxleyBubble: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderTopLeftRadius: 4,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  huxleyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  huxleyAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  huxleyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  huxleyText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  filterContainer: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
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
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  filterBubbleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#ffffff',
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
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sessionsListContainer: {
    marginBottom: 24,
  },
  sessionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionDate: {
    fontSize: 13,
    color: '#6b7280',
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
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginBottom: 8,
  },
  progressDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  sessionFooter: {
    alignItems: 'center',
  },
  tapToOpen: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  optionsContainer: {
    marginTop: 12,
  },
  optionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
    marginLeft: 4,
  },
  responseBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderTopRightRadius: 4,
    marginBottom: 12,
    alignSelf: 'flex-end',
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  responseIcon: {
    marginRight: 12,
  },
  responseText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default ConversationalAllSessions;
