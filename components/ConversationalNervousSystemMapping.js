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
import { ArrowLeft, CheckCircle2, Info } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import huxleyService from '../lib/huxleyService';
import polyvagalContextService from '../lib/polyvagalContextService';
import { shareNervousSystem } from '../lib/therapistShareService';
import { colors, gradients } from '../theme/colors';
import { ChatConversation } from './chat';

/**
 * Conversational Nervous System Mapping
 * AI-guided exploration of polyvagal states, then prompts physical drawing.
 *
 * Context-aware: loads prior patterns, initializes huxleyService with
 * user context, and saves structured results back via polyvagalContextService.
 */

// Adapt this screen's {id,text,isAI,timestamp} shape to ChatConversation's
// {id,role,content}. Internal shape stays unchanged so huxleyService and the
// save path don't need to learn anything new.
const toChatMessages = (messages) =>
  messages.map((m) => ({
    id: m.id,
    role: m.isAI ? 'assistant' : 'user',
    content: m.text,
  }));

const ConversationalNervousSystemMapping = ({ onComplete, navigation }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [currentState, setCurrentState] = useState('intro');
  const [sessionProgress, setSessionProgress] = useState(null);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    initializeMapping();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeMapping = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        await huxleyService.initialize(user.id);
      }
      huxleyService.setMode('nervous_system_mapping', { clearHistory: true });

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
      console.error('[NS Mapping] Init error:', error);
      huxleyService.setMode('nervous_system_mapping', { clearHistory: true });
      setMessages([
        {
          id: Date.now(),
          text: "Hi! I'm here to help you map your nervous system. We'll explore three states together and we'll end with your safe, connected state so you leave feeling grounded.\n\nFirst, I'm curious — when you leave that safe, connected place, where do you tend to go? Do you tend to go more toward activation — anxiety, stress, being wired, fight or flight? Or more toward shutdown — numbness, checking out, feeling stuck or collapsed?",
          isAI: true,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setInitializing(false);
    }
  };

  const buildOpeningMessage = (patterns) => {
    if (!patterns || !patterns.hasMappedStates) {
      return "Hi! I'm here to help you map your nervous system. We'll explore three states together and we'll end with your safe, connected state so you leave feeling grounded.\n\nFirst, I'm curious — when you leave that safe, connected place, where do you tend to go? Do you tend to go more toward activation — anxiety, stress, being wired, fight or flight? Or more toward shutdown — numbness, checking out, feeling stuck or collapsed?";
    }

    const ventral = patterns.ventral?.body_sensations || [];

    let msg = "Welcome back! I can see you've mapped your nervous system before.";
    if (ventral.length > 0) {
      msg += ` Last time, you noticed sensations like "${ventral.slice(0, 2).join('" and "')}" in your safe state.`;
    }
    msg += "\n\nLet's deepen your map. Has anything shifted since your last mapping? Or would you like to explore a state more thoroughly this time?";

    return msg;
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

      if (response.sessionProgress) {
        setSessionProgress(response.sessionProgress);
        setCurrentState(response.sessionProgress.phase);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showDrawingGuidance = () => {
    const guidanceMessage = {
      id: Date.now(),
      text: `Here's how to create your body map:

1. Draw a simple outline of a body on your paper (stick figure is fine!)
2. Use different colors for each state:
   • Ventral (safe & connected) - maybe green or blue
   • Sympathetic (activated) - maybe red or orange
   • Dorsal (shutdown) - maybe gray or purple

3. Color or mark where in your body each state lives
4. Add symbols, patterns, or words that represent each state
5. This is YOUR map - there's no right or wrong way!

Take your time with this. When you're done, the app will show you a digital version too.`,
      isAI: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, guidanceMessage]);
  };

  const handleDrawingComplete = () => {
    Alert.alert('Drawing Complete?', 'Have you finished creating your body map?', [
      { text: 'Not yet', style: 'cancel' },
      { text: 'Yes, done!', onPress: () => saveMapping() },
    ]);
  };

  const saveMapping = async () => {
    setSaving(true);

    try {
      if (!currentUser) throw new Error('No user');

      const handlerSummary = huxleyService.getSessionSummary();
      const mappedStates = handlerSummary?.mappedStates || {};

      const mappingData = {
        ventral: mappedStates.ventral || {},
        sympathetic: mappedStates.sympathetic || {},
        dorsal: mappedStates.dorsal || {},
      };

      await polyvagalContextService.updatePatternsFromMapping(currentUser.id, mappingData);

      Alert.alert('Mapping Saved!', 'Your nervous system map has been saved.', [
        { text: 'View Map', onPress: () => showDigitalMap(mappingData) },
        {
          text: 'Share with Therapist',
          onPress: () =>
            shareNervousSystem({
              state_mappings: mappingData,
              created_at: new Date().toISOString(),
            }).catch(() => {}),
        },
        { text: 'Done', onPress: () => onComplete?.() },
      ]);

      huxleyService.setMode('nervous_system_mapping', { clearHistory: true });
    } catch (error) {
      console.error('Error saving mapping:', error);
      Alert.alert('Error', 'Failed to save mapping. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const showDigitalMap = (mappingData) => {
    let summary = 'Your Nervous System Map:\n\n';

    if (mappingData.ventral?.body_sensations?.length > 0) {
      summary += 'VENTRAL (Safe & Social):\n';
      summary += `Body: ${mappingData.ventral.body_sensations.join(', ')}\n`;
      summary += `Emotions: ${(mappingData.ventral.emotions || []).join(', ')}\n\n`;
    }

    if (mappingData.sympathetic?.body_sensations?.length > 0) {
      summary += 'SYMPATHETIC (Fight/Flight):\n';
      summary += `Body: ${mappingData.sympathetic.body_sensations.join(', ')}\n`;
      summary += `Emotions: ${(mappingData.sympathetic.emotions || []).join(', ')}\n\n`;
    }

    if (mappingData.dorsal?.body_sensations?.length > 0) {
      summary += 'DORSAL (Shutdown):\n';
      summary += `Body: ${mappingData.dorsal.body_sensations.join(', ')}\n`;
      summary += `Emotions: ${(mappingData.dorsal.emotions || []).join(', ')}\n\n`;
    }

    Alert.alert('Your Digital Map', summary, [
      { text: 'Done', onPress: () => onComplete?.() },
    ]);
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
          <Text style={styles.headerTitle}>Nervous System Mapping</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {sessionProgress?.phaseLabel || 'Exploring your nervous system states'}
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

  const renderBelowMessages = () => {
    const mappedStates = sessionProgress?.mappedStates || {};

    // The mapping mode handler emits phase 'drawing' (not 'drawing_prompt'),
    // so gate the drawing-guide/done buttons on the phase it actually produces.
    if (currentState === 'drawing') {
      return (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={showDrawingGuidance}
          >
            <Info size={20} color="#fff" strokeWidth={2} />
            <Text style={styles.primaryButtonText}>Show Drawing Guide</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.successButton]}
            onPress={handleDrawingComplete}
          >
            <CheckCircle2 size={20} color="#fff" strokeWidth={2} />
            <Text style={styles.primaryButtonText}>I'm Done Drawing</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (currentState !== 'intro' && currentState !== 'complete') {
      return (
        <View style={styles.stateProgress}>
          <Text style={styles.stateProgressText}>
            States Mapped: {sessionProgress?.statesMapped || 0}/3
          </Text>
          <View style={styles.stateIndicators}>
            <View
              style={[
                styles.stateIndicator,
                mappedStates.ventral?.isMapped && styles.stateCompleted,
              ]}
            >
              <Text style={styles.stateIndicatorText}>Ventral</Text>
            </View>
            <View
              style={[
                styles.stateIndicator,
                mappedStates.sympathetic?.isMapped && styles.stateCompleted,
              ]}
            >
              <Text style={styles.stateIndicatorText}>Sympathetic</Text>
            </View>
            <View
              style={[
                styles.stateIndicator,
                mappedStates.dorsal?.isMapped && styles.stateCompleted,
              ]}
            >
              <Text style={styles.stateIndicatorText}>Dorsal</Text>
            </View>
          </View>
        </View>
      );
    }

    return null;
  };

  const renderSavingOverlay = () => {
    if (!saving) return null;
    return (
      <View style={styles.savingOverlay} pointerEvents="auto">
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.savingText}>Saving your mapping...</Text>
      </View>
    );
  };

  const inputBlocked = loading || saving;

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
          inputDisabled={inputBlocked}
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
  stateProgress: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  stateProgressText: {
    fontSize: 13,
    color: colors.text,
    opacity: 0.75,
    marginBottom: 8,
    fontWeight: '500',
  },
  stateIndicators: {
    flexDirection: 'row',
    gap: 8,
  },
  stateIndicator: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    alignItems: 'center',
  },
  stateCompleted: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  stateIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  successButton: {
    backgroundColor: colors.success,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
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

export default ConversationalNervousSystemMapping;
