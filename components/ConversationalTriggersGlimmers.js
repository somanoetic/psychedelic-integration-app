import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import huxleyService from '../lib/huxleyService';
import polyvagalContextService from '../lib/polyvagalContextService';
import { colors } from '../theme/colors';

/**
 * Conversational Triggers & Glimmers Exploration
 * AI-guided discovery of what dysregulates and regulates the nervous system.
 *
 * Context-aware: loads prior patterns, initializes huxleyService with
 * user context, and saves structured results via polyvagalContextService.
 */
const ConversationalTriggersGlimmers = ({ onComplete, navigation }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [phase, setPhase] = useState('intro');
  const [sessionProgress, setSessionProgress] = useState(null);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const scrollViewRef = useRef(null);
  const insets = useSafeAreaInsets();

  // Scroll to bottom when keyboard opens
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(showEvent, () => {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    initializeExploration();
  }, []);

  const initializeExploration = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        await huxleyService.initialize(user.id);
      }
      huxleyService.setMode('triggers_glimmers', { clearHistory: true });

      const priorPatterns = user
        ? await polyvagalContextService.getPatternsForAI(user.id)
        : null;

      const openingText = buildOpeningMessage(priorPatterns);

      setMessages([{
        id: Date.now(),
        text: openingText,
        isAI: true,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('[T&G] Init error:', error);
      huxleyService.setMode('triggers_glimmers', { clearHistory: true });
      setMessages([{
        id: Date.now(),
        text: "Hi! Let's explore what impacts your nervous system. We'll look at triggers — things that dysregulate you — and glimmers — small moments that bring you back to safety and connection. What would you like to start with?",
        isAI: true,
        timestamp: new Date()
      }]);
    } finally {
      setInitializing(false);
    }
  };

  const buildOpeningMessage = (patterns) => {
    if (!patterns) {
      return "Hi! Let's explore what impacts your nervous system. We'll look at triggers — things that dysregulate you — and glimmers — small moments that bring you back to safety and connection. What would you like to start with?";
    }

    const hasTriggers = patterns.knownTriggers?.length > 0;
    const hasGlimmers = patterns.knownGlimmers?.length > 0;

    if (hasTriggers && hasGlimmers) {
      return "Welcome back! You've already identified some triggers and glimmers. Let's deepen your awareness — have you noticed any new patterns since last time? Or would you like to explore a specific trigger or glimmer more thoroughly?";
    }

    if (hasTriggers) {
      return "Welcome back! You've explored some triggers before. Let's balance that out by discovering your glimmers — those small moments of safety and connection that your nervous system responds to. What comes to mind?";
    }

    if (patterns.hasMappedStates) {
      return "Hi! I can see you've mapped your nervous system states. Now let's get specific — what triggers pull you out of your safe state, and what glimmers bring you back? Would you like to start with triggers or glimmers?";
    }

    return "Hi! Let's explore what impacts your nervous system. We'll look at triggers — things that dysregulate you — and glimmers — small moments that bring you back to safety and connection. What would you like to start with?";
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputText.trim(),
      isAI: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      // Handler controls phase and context automatically
      const response = await huxleyService.chat(inputText.trim());

      const aiMessage = {
        id: Date.now() + 1,
        text: response.message,
        isAI: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Update from mode handler
      if (response.sessionProgress) {
        setSessionProgress(response.sessionProgress);
        setPhase(response.sessionProgress.phase);
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to send message.');
    } finally {
      setLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleComplete = async () => {
    setSaving(true);

    try {
      if (!currentUser) throw new Error('No user');

      // Get structured data from mode handler
      const handlerSummary = huxleyService.getSessionSummary();
      const triggers = handlerSummary?.triggers || {};
      const glimmers = handlerSummary?.glimmers || {};

      // Save to polyvagal patterns via context service
      await polyvagalContextService.updateTriggersAndGlimmers(currentUser.id, {
        sympathetic_triggers: triggers.sympathetic || triggers.general || [],
        dorsal_triggers: triggers.dorsal || [],
        glimmers: [
          ...(glimmers.sensory || []),
          ...(glimmers.relational || []),
          ...(glimmers.activities || []),
          ...(glimmers.nature || []),
        ],
      });

      Alert.alert(
        'Saved!',
        'Your triggers and glimmers have been mapped. You can use this awareness to navigate your nervous system more skillfully.',
        [{ text: 'Done', onPress: () => onComplete?.() }]
      );

      huxleyService.setMode('triggers_glimmers', { clearHistory: true });
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save mapping.');
    } finally {
      setSaving(false);
    }
  };

  const renderMessage = (message) => {
    if (message.isAI) {
      return (
        <View key={message.id} style={styles.aiMessageRow}>
          <Image
            source={require('../assets/images/huxley-avatar.png')}
            style={styles.huxleyAvatar}
            resizeMode="contain"
          />
          <View style={[styles.messageBubble, styles.aiMessage]}>
            <Text style={[styles.messageText, styles.aiMessageText]}>
              {message.text}
            </Text>
            <Text style={styles.timestamp}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View
        key={message.id}
        style={[styles.messageBubble, styles.userMessage]}
      >
        <Text style={[styles.messageText, styles.userMessageText]}>
          {message.text}
        </Text>
        <Text style={styles.timestamp}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={100}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation?.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <MaterialIcons name="waves" size={24} color="#ec4899" />
          <Text style={styles.headerTitle}>Triggers & Glimmers</Text>
        </View>
        <Text style={styles.headerSubtitle}>Mapping what impacts your nervous system</Text>
      </View>

      <ScrollView ref={scrollViewRef} style={styles.messagesContainer} contentContainerStyle={styles.messagesContent}>
        {messages.map(renderMessage)}
        {loading && (
          <View style={styles.aiMessageRow}>
            <Image
              source={require('../assets/images/huxley-avatar.png')}
              style={styles.huxleyAvatar}
              resizeMode="contain"
            />
            <View style={[styles.messageBubble, styles.aiMessage]}>
              <ActivityIndicator size="small" color="#ec4899" />
              <Text style={styles.aiMessageText}>Huxley is typing...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.doneButton} onPress={handleComplete}>
        <MaterialIcons name="check-circle" size={20} color={colors.success} />
        <Text style={styles.doneButtonText}>Save My Mapping</Text>
      </TouchableOpacity>

      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Share your thoughts..."
          placeholderTextColor={colors.textLight}
          multiline
          maxLength={2000}
          editable={!loading && !saving}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || loading || saving) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || loading || saving}
        >
          <MaterialIcons name="send" size={24} color={inputText.trim() && !loading && !saving ? '#fff' : '#d1d5db'} />
        </TouchableOpacity>
      </View>

      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" color="#ec4899" />
          <Text style={styles.savingText}>Saving your mapping...</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F1E8' },
  header: { backgroundColor: '#fff', padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: colors.lightGray },
  backButton: { padding: 4, marginRight: 8 },
  headerContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginLeft: 12 },
  headerSubtitle: { fontSize: 14, color: colors.textSecondary, marginLeft: 36 },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 80 },
  aiMessageRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  huxleyAvatar: { width: 54, height: 54, marginRight: 8, marginTop: 4 },
  messageBubble: { maxWidth: '75%', padding: 12, borderRadius: 16, marginBottom: 12 },
  userMessage: { alignSelf: 'flex-end', backgroundColor: '#ec4899', borderBottomRightRadius: 4 },
  aiMessage: { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.lightGray, flex: 1, marginBottom: 0 },
  messageText: { fontSize: 16, lineHeight: 22, marginBottom: 4 },
  userMessageText: { color: '#fff' },
  aiMessageText: { color: colors.text },
  timestamp: { fontSize: 11, color: colors.textLight, alignSelf: 'flex-end' },
  doneButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, marginHorizontal: 16, marginBottom: 8, backgroundColor: '#f0fdf4', borderRadius: 12, borderWidth: 1, borderColor: '#86efac' },
  doneButtonText: { color: colors.success, fontSize: 16, fontWeight: '600', marginLeft: 8 },
  inputContainer: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.lightGray, alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: colors.text, maxHeight: 120, marginRight: 12 },
  sendButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#ec4899', alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { backgroundColor: '#f3f4f6' },
  savingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  savingText: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 16 }
});

export default ConversationalTriggersGlimmers;
