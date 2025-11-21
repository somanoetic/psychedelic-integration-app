import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
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

const ConversationalSessionTools = ({ navigation }) => {
  const [selectedAvatar, setSelectedAvatar] = useState('brain');
  const [conversationStep, setConversationStep] = useState('initial'); // initial, ask_type, create_new, view_existing
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

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
        .order('created_at', { ascending: false })
        .limit(5);

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

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const createSession = async () => {
    if (isCreating) return;

    try {
      setIsCreating(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        showAlert('Authentication Error', 'Please log in again');
        return;
      }

      const newSession = {
        user_id: user.id,
        title: sessionTitle || `Session ${new Date().toLocaleDateString()}`,
        journey_date: sessionDate,
        current_step: 1,
        session_data: {
          sessionType: 'full_session',
          conversationMode: 'preparation',
          sessionInfo: {},
          preparation: {},
          experienceProcessing: {},
          integration: {}
        }
      };

      const { data, error } = await supabase
        .from('sessions')
        .insert([newSession])
        .select()
        .single();

      if (error) {
        showAlert('Error', `Failed to create session: ${error.message}`);
      } else {
        // Navigate to the new session detail view
        navigation.navigate('SessionDetail', { session: data });
      }
    } catch (error) {
      showAlert('Error', `Failed to create session: ${error.message}`);
    } finally {
      setIsCreating(false);
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

    if (integration?.completed) return { text: 'Integrated', emoji: '✅' };
    if (experience?.completed) return { text: 'Processed', emoji: '📝' };
    if (prep?.completedSections?.length > 0) return { text: 'In Progress', emoji: '⏳' };
    return { text: 'New', emoji: '✨' };
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

  const renderUserOption = (text, onPress, icon, color = '#8b5cf6') => (
    <TouchableOpacity
      style={[styles.responseBubble, { backgroundColor: color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <MaterialIcons name={icon} size={20} color="#ffffff" style={styles.responseIcon} />
      <Text style={styles.responseText}>{text}</Text>
      <MaterialIcons name="arrow-forward" size={16} color="rgba(255,255,255,0.8)" />
    </TouchableOpacity>
  );

  const renderInitialStep = () => (
    <>
      {renderHuxleyMessage(
        "Welcome! I'm here to help you with your integration sessions. Would you like to create a new session, continue with an existing one, or try a recovery game?"
      )}
      <View style={styles.optionsContainer}>
        <Text style={styles.optionsLabel}>You:</Text>
        {renderUserOption('Create a new session', () => setConversationStep('create_new'), 'add-circle', '#10b981')}
        {sessions.length > 0 && renderUserOption(
          'View my recent sessions',
          () => setConversationStep('view_existing'),
          'history',
          '#3b82f6'
        )}
        {renderUserOption('Play Glimmer Swiper 🎮', () => navigation.navigate('GlimmerSwiper'), 'sports-esports', '#06b6d4')}
        {renderUserOption('Go back', () => navigation.goBack(), 'arrow-back', '#6b7280')}
      </View>
    </>
  );

  const renderCreateNewStep = () => (
    <>
      {renderHuxleyMessage(
        "Great! Let's create a new session. What would you like to call it? You can also leave it blank for a default name."
      )}

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Session Title (optional)</Text>
        <TextInput
          style={styles.textInput}
          value={sessionTitle}
          onChangeText={setSessionTitle}
          placeholder="e.g., Healing Session - December 2024"
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.inputLabel}>Journey Date</Text>
        <TextInput
          style={styles.textInput}
          value={sessionDate}
          onChangeText={setSessionDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.optionsContainer}>
        <Text style={styles.optionsLabel}>You:</Text>
        {renderUserOption(
          isCreating ? 'Creating...' : 'Create this session',
          createSession,
          'check-circle',
          '#10b981'
        )}
        {renderUserOption('Go back', () => setConversationStep('initial'), 'arrow-back', '#6b7280')}
      </View>
    </>
  );

  const renderViewExistingStep = () => (
    <>
      {renderHuxleyMessage(
        `Here are your ${sessions.length} most recent sessions. Tap any session to continue working on it.`
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      ) : (
        <View style={styles.sessionsListContainer}>
          {sessions.map((session) => {
            const status = getSessionStatus(session);
            return (
              <TouchableOpacity
                key={session.id}
                style={styles.sessionBubble}
                onPress={() => navigation.navigate('SessionDetail', { session })}
              >
                <View style={styles.sessionBubbleHeader}>
                  <Text style={styles.sessionBubbleTitle}>{session.title}</Text>
                  <Text style={styles.sessionBubbleStatus}>{status.emoji} {status.text}</Text>
                </View>
                <Text style={styles.sessionBubbleDate}>
                  📅 {formatDate(session.journey_date)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={styles.optionsContainer}>
        <Text style={styles.optionsLabel}>You:</Text>
        {renderUserOption('Create a new session instead', () => setConversationStep('create_new'), 'add-circle', '#10b981')}
        {renderUserOption('Go back', () => setConversationStep('initial'), 'arrow-back', '#6b7280')}
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.appName}>Session Tools</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {conversationStep === 'initial' && renderInitialStep()}
          {conversationStep === 'create_new' && renderCreateNewStep()}
          {conversationStep === 'view_existing' && renderViewExistingStep()}
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
  optionsContainer: {
    marginBottom: 24,
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
  inputContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  sessionsListContainer: {
    marginBottom: 24,
  },
  sessionBubble: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sessionBubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionBubbleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  sessionBubbleStatus: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
  sessionBubbleDate: {
    fontSize: 13,
    color: '#9ca3af',
  },
});

export default ConversationalSessionTools;
