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
import { ArrowLeft } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import huxleyService from '../lib/huxleyService';
import polyvagalContextService from '../lib/polyvagalContextService';
import { colors, gradients } from '../theme/colors';
import ShareWithTherapistButton from './ShareWithTherapistButton';
import { shareRegulatingResources } from '../lib/therapistShareService';
import { ChatConversation } from './chat';

/**
 * Conversational Regulating Resources Discovery
 * Guides user through identifying their personal regulation toolkit
 * organized by nervous system state.
 *
 * Context-aware: loads prior patterns, initializes huxleyService with
 * user context, and saves structured results back to polyvagal_patterns.
 */

// Adapt this screen's {id,text,isAI} shape to ChatConversation's {id,role,content}.
// Keeping the internal shape avoids touching huxleyService.getConversationHistory()
// and the save path; we only translate at the render boundary.
const toChatMessages = (messages) =>
  messages.map((m) => ({
    id: m.id,
    role: m.isAI ? 'assistant' : 'user',
    content: m.text,
  }));

const ConversationalRegulatingResources = ({ user: userProp, onComplete, navigation }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [phase, setPhase] = useState('intro');
  const [sessionProgress, setSessionProgress] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedResourceData, setSavedResourceData] = useState(null);
  const [currentUser, setCurrentUser] = useState(userProp || null);
  const [isReturning, setIsReturning] = useState(false);

  useEffect(() => {
    initializeConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeConversation = async () => {
    try {
      let user = currentUser;
      if (!user) {
        const { data } = await supabase.auth.getUser();
        user = data?.user;
        if (user) setCurrentUser(user);
      }

      if (user) {
        await huxleyService.initialize(user.id);
      }
      huxleyService.setMode('regulating_resources', { clearHistory: true });

      const priorPatterns = user
        ? await polyvagalContextService.getPatternsForAI(user.id)
        : null;

      const hasExistingResources =
        (priorPatterns?.individualResources?.length > 0) ||
        (priorPatterns?.interactiveResources?.length > 0);

      if (hasExistingResources) {
        setIsReturning(true);
        const handler = huxleyService.getModeHandler?.();
        if (handler) {
          handler.isReturningUser = true;
          handler.priorResources = {
            individual: priorPatterns.individualResources,
            interactive: priorPatterns.interactiveResources,
          };
        }
      }

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
      console.error('[Resources] Init error:', error);
      huxleyService.setMode('regulating_resources', { clearHistory: true });
      setMessages([
        {
          id: Date.now(),
          text: "Hi! Let's get a snapshot of your regulation toolkit. We'll go state by state and just list what you actually do — no judgment, everything counts. Then we'll step back and look at the full picture together. Where would you like to start?",
          isAI: true,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setInitializing(false);
    }
  };

  const buildOpeningMessage = (patterns) => {
    const baseMsg =
      "Hi! Let's get a snapshot of your regulation toolkit. We'll go state by state and just list what you actually do — no judgment, everything counts. Then we'll step back and look at the full picture together. Where would you like to start?";

    if (!patterns || !patterns.hasMappedStates) {
      return baseMsg;
    }

    const hasResources =
      (patterns.individualResources?.length > 0) ||
      (patterns.interactiveResources?.length > 0);

    if (hasResources) {
      return "Welcome back! Your regulation toolkit is a living document that grows with you. What's changed since last time? Have you tried anything new? Has anything stopped working? Or would you like to do a full fresh snapshot?";
    }

    return "Hi! I can see you've done some nervous system work already. Now let's get a snapshot of what you actually do in each state — everything counts, no judgment. Then we'll review the full picture together. Where would you like to start?";
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
        setPhase(response.sessionProgress.phase);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setSaving(true);

    try {
      const handlerSummary = huxleyService.getSessionSummary();
      const conversationHistory = huxleyService.getConversationHistory();

      const allResources = handlerSummary?.resources || {};
      const flatResources = {
        passive: [],
        cognitive: [],
        creative: [],
        movement: [],
        connection: [],
      };

      for (const state of ['sympathetic', 'dorsal', 'ventral']) {
        const stateRes = allResources[state] || {};
        for (const category of Object.keys(flatResources)) {
          flatResources[category].push(...(stateRes[category] || []));
        }
      }

      const { data, error } = await supabase
        .from('regulating_resources')
        .insert({
          user_id: currentUser?.id,
          conversation: conversationHistory,
          sensory_resources: flatResources.passive,
          movement_resources: flatResources.movement,
          connection_resources: flatResources.connection,
          creative_resources: flatResources.creative,
          cognitive_resources: flatResources.cognitive,
          state_based_resources: allResources,
          session_type: isReturning ? 'update' : 'initial',
        })
        .select()
        .single();

      if (error) {
        console.error('Save error:', error);
        Alert.alert('Save Error', 'Could not save your resources. Please try again.');
        return;
      }

      console.log('[Resources] Saved successfully:', data.id);

      if (currentUser?.id) {
        const allIndividual = [];
        const allInteractive = [];
        for (const state of ['sympathetic', 'dorsal', 'ventral']) {
          const stateRes = allResources[state] || {};
          allIndividual.push(
            ...(stateRes.passive || []),
            ...(stateRes.cognitive || []),
            ...(stateRes.creative || []),
            ...(stateRes.movement || []),
          );
          allInteractive.push(...(stateRes.connection || []));
        }
        await polyvagalContextService.updateRegulatingResources(currentUser.id, {
          individual: allIndividual,
          interactive: allInteractive,
        });
      }

      const completionMessage = {
        id: Date.now(),
        text: 'Your regulation toolkit has been saved! These are your personal resources - things that actually work for you. You can revisit and add to this toolkit anytime.',
        isAI: true,
        timestamp: new Date(),
      };

      setSavedResourceData({
        state_based_resources: allResources,
        created_at: new Date().toISOString(),
      });
      setMessages((prev) => [...prev, completionMessage]);
      setPhase('complete');

      if (onComplete) {
        setTimeout(() => onComplete(data), 2000);
      } else if (navigation) {
        setTimeout(() => navigation.replace('RegulationToolkit'), 2500);
      }
    } catch (error) {
      console.error('Error completing resources:', error);
      Alert.alert('Error', 'Failed to save resources. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (onComplete ? onComplete() : navigation?.goBack())}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Regulating Resources</Text>
      </View>

      <View style={styles.phaseIndicator}>
        <View style={[styles.phaseItem, phase === 'sympathetic' && styles.phaseActive]}>
          <Text style={styles.phaseText}>
            Activated ({sessionProgress?.sympatheticCount || 0})
          </Text>
        </View>
        <View style={[styles.phaseItem, phase === 'dorsal' && styles.phaseActive]}>
          <Text style={styles.phaseText}>
            Shutdown ({sessionProgress?.dorsalCount || 0})
          </Text>
        </View>
        <View style={[styles.phaseItem, phase === 'ventral' && styles.phaseActive]}>
          <Text style={styles.phaseText}>
            Connected ({sessionProgress?.ventralCount || 0})
          </Text>
        </View>
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
    if (phase === 'complete') {
      if (!savedResourceData) return null;
      return (
        <View style={styles.shareWrapper}>
          <ShareWithTherapistButton
            onShare={() => shareRegulatingResources(savedResourceData)}
          />
        </View>
      );
    }

    return (
      <View style={styles.actionsContainer}>
        {phase === 'intro' && !isReturning && (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                sendMessage("Let's start with what I do when I'm stressed or activated")
              }
            >
              <Text style={styles.actionButtonText}>Start with Activated State</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() =>
                sendMessage("Let's start with what I do when I'm shut down or numb")
              }
            >
              <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
                Start with Shutdown State
              </Text>
            </TouchableOpacity>
          </>
        )}

        {phase === 'intro' && isReturning && (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                sendMessage("I've tried some new things and want to update my toolkit")
              }
            >
              <Text style={styles.actionButtonText}>Update My Toolkit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => {
                setIsReturning(false);
                const handler = huxleyService.getModeHandler?.();
                if (handler) handler.isReturningUser = false;
                sendMessage("Let's do a fresh snapshot of everything");
              }}
            >
              <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
                Fresh Snapshot
              </Text>
            </TouchableOpacity>
          </>
        )}

        {['update', 'sympathetic', 'dorsal', 'ventral', 'review', 'summary'].includes(
          phase,
        ) && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleComplete}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Complete & Save Resources</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Input is hidden during the completion phase. Withholding onSend tells
  // ChatConversation to skip the input row entirely.
  const isComplete = phase === 'complete';

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
          onSend={isComplete ? undefined : (text) => sendMessage(text)}
          inputText={inputText}
          onInputTextChange={setInputText}
          inputPlaceholder="Share your resources..."
          inputDisabled={loading}
          header={renderHeader()}
          belowMessages={renderBelowMessages()}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  phaseIndicator: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  phaseItem: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
  },
  phaseActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  phaseText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
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
  actionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: colors.primary,
  },
  shareWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});

export default ConversationalRegulatingResources;
