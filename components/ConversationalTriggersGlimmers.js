import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import huxleyService from '../lib/huxleyService';
import polyvagalContextService from '../lib/polyvagalContextService';
import { colors, gradients } from '../theme/colors';
import { ChatConversation } from './chat';

/**
 * Conversational Triggers & Glimmers Exploration
 * AI-guided discovery of what dysregulates and regulates the nervous system.
 *
 * Context-aware: loads prior patterns, initializes huxleyService with
 * user context, and saves structured results via polyvagalContextService.
 */

const toChatMessages = (messages) =>
  messages.map((m) => ({
    id: m.id,
    role: m.isAI ? 'assistant' : 'user',
    content: m.text,
  }));

const ConversationalTriggersGlimmers = ({ onComplete, navigation }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    initializeExploration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      setMessages([
        {
          id: Date.now(),
          text: openingText,
          isAI: true,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('[T&G] Init error:', error);
      huxleyService.setMode('triggers_glimmers', { clearHistory: true });
      setMessages([
        {
          id: Date.now(),
          text: "Hi! Let's explore what impacts your nervous system. We'll look at triggers — things that dysregulate you — and glimmers — small moments that bring you back to safety and connection. What would you like to start with?",
          isAI: true,
          timestamp: new Date(),
        },
      ]);
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

  const sendMessage = async (overrideText) => {
    const text = (overrideText ?? inputText).trim();
    if (!text || loading) return;

    const userMessage = {
      id: Date.now(),
      text,
      isAI: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await huxleyService.chat(text);

      const aiMessage = {
        id: Date.now() + 1,
        text: response.message,
        isAI: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to send message.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setSaving(true);

    try {
      if (!currentUser) throw new Error('No user');

      const handlerSummary = huxleyService.getSessionSummary();
      const triggers = handlerSummary?.triggers || {};
      const glimmers = handlerSummary?.glimmers || {};

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
        [{ text: 'Done', onPress: () => onComplete?.() }],
      );

      huxleyService.setMode('triggers_glimmers', { clearHistory: true });
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save mapping.');
    } finally {
      setSaving(false);
    }
  };

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => (onComplete ? onComplete() : navigation?.goBack())}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Triggers & Glimmers</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Mapping what impacts your nervous system
        </Text>
      </View>

      {initializing && (
        <View style={styles.initializingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.initializingText}>Loading your context...</Text>
        </View>
      )}
    </View>
  );

  const renderBelowMessages = () => (
    <TouchableOpacity
      style={styles.doneButton}
      onPress={handleComplete}
      disabled={saving}
    >
      <CheckCircle2 size={20} color="#fff" strokeWidth={2} />
      <Text style={styles.doneButtonText}>Save My Mapping</Text>
    </TouchableOpacity>
  );

  const renderSavingOverlay = () => {
    if (!saving) return null;
    return (
      <View style={styles.savingOverlay} pointerEvents="auto">
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.savingText}>Saving your mapping...</Text>
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
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ChatConversation
          messages={toChatMessages(messages)}
          isTyping={loading}
          onSend={(text) => sendMessage(text)}
          inputText={inputText}
          onInputTextChange={setInputText}
          inputPlaceholder="Share your thoughts..."
          inputDisabled={loading || saving}
          header={renderHeader()}
          belowMessages={renderBelowMessages()}
          overlay={renderSavingOverlay()}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        />
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.75,
    marginLeft: 40,
  },
  initializingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  initializingText: {
    fontSize: 14,
    color: colors.text,
    fontStyle: 'italic',
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: colors.success,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
});

export default ConversationalTriggersGlimmers;
