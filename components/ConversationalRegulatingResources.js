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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import huxleyService from '../lib/huxleyService';
import polyvagalContextService from '../lib/polyvagalContextService';
import { colors } from '../theme/colors';
import ShareWithTherapistButton from './ShareWithTherapistButton';
import { shareRegulatingResources } from '../lib/therapistShareService';

/**
 * Conversational Regulating Resources Discovery
 * Guides user through identifying their personal regulation toolkit
 * organized by nervous system state.
 *
 * Context-aware: loads prior patterns, initializes huxleyService with
 * user context, and saves structured results back to polyvagal_patterns.
 */
const ConversationalRegulatingResources = ({ user: userProp, onComplete, navigation }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [phase, setPhase] = useState('intro'); // 'intro', 'sympathetic', 'dorsal', 'ventral', 'summary', 'complete'
  const [sessionProgress, setSessionProgress] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedResourceData, setSavedResourceData] = useState(null);
  const [currentUser, setCurrentUser] = useState(userProp || null);
  const [isReturning, setIsReturning] = useState(false);
  const scrollViewRef = useRef(null);

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
    initializeConversation();
  }, []);

  const initializeConversation = async () => {
    try {
      // Get user and initialize huxley with full context
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

      // Load prior patterns to personalize opening and detect returning user
      const priorPatterns = user
        ? await polyvagalContextService.getPatternsForAI(user.id)
        : null;

      const hasExistingResources = (priorPatterns?.individualResources?.length > 0) ||
        (priorPatterns?.interactiveResources?.length > 0);

      // Tell the mode handler if this is a returning user
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

      setMessages([{
        id: Date.now(),
        text: openingText,
        isAI: true,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('[Resources] Init error:', error);
      huxleyService.setMode('regulating_resources', { clearHistory: true });
      setMessages([{
        id: Date.now(),
        text: "Hi! Let's get a snapshot of your regulation toolkit. We'll go state by state and just list what you actually do — no judgment, everything counts. Then we'll step back and look at the full picture together. Where would you like to start?",
        isAI: true,
        timestamp: new Date()
      }]);
    } finally {
      setInitializing(false);
    }
  };

  const buildOpeningMessage = (patterns) => {
    const baseMsg = "Hi! Let's get a snapshot of your regulation toolkit. We'll go state by state and just list what you actually do — no judgment, everything counts. Then we'll step back and look at the full picture together. Where would you like to start?";

    if (!patterns || !patterns.hasMappedStates) {
      return baseMsg;
    }

    const hasResources = (patterns.individualResources?.length > 0) || (patterns.interactiveResources?.length > 0);

    if (hasResources) {
      return "Welcome back! Your regulation toolkit is a living document that grows with you. What's changed since last time? Have you tried anything new? Has anything stopped working? Or would you like to do a full fresh snapshot?";
    }

    return "Hi! I can see you've done some nervous system work already. Now let's get a snapshot of what you actually do in each state — everything counts, no judgment. Then we'll review the full picture together. Where would you like to start?";
  };

  const sendMessage = async (overrideText) => {
    const text = (overrideText || inputText).trim();
    if (!text) return;

    const userMessage = {
      id: Date.now(),
      text,
      isAI: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      // Handler controls phase and context automatically
      const response = await huxleyService.chat(text);

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
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleComplete = async () => {
    setSaving(true);

    try {
      // Get structured data from mode handler
      const handlerSummary = huxleyService.getSessionSummary();
      const conversationHistory = huxleyService.getConversationHistory();

      // Save to database — store both state-based and flat resource lists for compatibility
      const allResources = handlerSummary?.resources || {};
      const flatResources = {
        passive: [],
        cognitive: [],
        creative: [],
        movement: [],
        connection: [],
      };

      // Flatten across states for the flat columns
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

      // Also update polyvagal patterns with the new resources
      if (currentUser?.id) {
        const allIndividual = [];
        const allInteractive = [];
        for (const state of ['sympathetic', 'dorsal', 'ventral']) {
          const stateRes = allResources[state] || {};
          allIndividual.push(...(stateRes.passive || []), ...(stateRes.cognitive || []), ...(stateRes.creative || []), ...(stateRes.movement || []));
          allInteractive.push(...(stateRes.connection || []));
        }
        await polyvagalContextService.updateRegulatingResources(currentUser.id, {
          individual: allIndividual,
          interactive: allInteractive,
        });
      }

      // Show completion message
      const completionMessage = {
        id: Date.now(),
        text: "Your regulation toolkit has been saved! These are your personal resources - things that actually work for you. You can revisit and add to this toolkit anytime.",
        isAI: true,
        timestamp: new Date()
      };

      setSavedResourceData({ state_based_resources: allResources, created_at: new Date().toISOString() });
      setMessages(prev => [...prev, completionMessage]);
      setPhase('complete');

      // Notify parent component, then navigate to toolkit view
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

  const renderMessage = (message) => {
    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          message.isAI ? styles.aiMessage : styles.userMessage
        ]}
      >
        {message.isAI && (
          <Image
            source={require('../assets/images/huxley-avatar.png')}
            style={styles.huxleyAvatar}
            resizeMode="contain"
          />
        )}
        <View style={[styles.messageBubble, message.isAI ? styles.aiBubble : styles.userBubble]}>
          <Text style={[styles.messageText, message.isAI ? styles.aiText : styles.userText]}>
            {message.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <MaterialIcons name="self-improvement" size={24} color={colors.primary} />
        <Text style={styles.headerTitle}>Regulating Resources</Text>
      </View>

      {/* Phase indicator */}
      <View style={styles.phaseIndicator}>
        <View style={[styles.phaseItem, phase === 'sympathetic' && styles.phaseActive]}>
          <Text style={styles.phaseText}>Activated ({sessionProgress?.sympatheticCount || 0})</Text>
        </View>
        <View style={[styles.phaseItem, phase === 'dorsal' && styles.phaseActive]}>
          <Text style={styles.phaseText}>Shutdown ({sessionProgress?.dorsalCount || 0})</Text>
        </View>
        <View style={[styles.phaseItem, phase === 'ventral' && styles.phaseActive]}>
          <Text style={styles.phaseText}>Connected ({sessionProgress?.ventralCount || 0})</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {initializing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Loading your context...</Text>
          </View>
        )}
        {messages.map(renderMessage)}
        {loading && (
          <View style={styles.loadingContainer}>
            <Image
              source={require('../assets/images/huxley-avatar.png')}
              style={styles.huxleyAvatar}
              resizeMode="contain"
            />
            <View style={styles.loadingBubble}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Huxley is thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action buttons */}
      {phase !== 'complete' && (
        <View style={styles.actionsContainer}>
          {phase === 'intro' && !isReturning && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => sendMessage("Let's start with what I do when I'm stressed or activated")}
              >
                <Text style={styles.actionButtonText}>Start with Activated State</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => sendMessage("Let's start with what I do when I'm shut down or numb")}
              >
                <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Start with Shutdown State</Text>
              </TouchableOpacity>
            </>
          )}
          {phase === 'intro' && isReturning && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => sendMessage("I've tried some new things and want to update my toolkit")}
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
                <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Fresh Snapshot</Text>
              </TouchableOpacity>
            </>
          )}
          {(phase === 'update' || phase === 'sympathetic' || phase === 'dorsal' || phase === 'ventral' || phase === 'review' || phase === 'summary') && (
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
      )}

      {/* Share button on completion */}
      {phase === 'complete' && savedResourceData && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <ShareWithTherapistButton onShare={() => shareRegulatingResources(savedResourceData)} />
        </View>
      )}

      {/* Input area */}
      {phase !== 'complete' && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Share your resources..."
            placeholderTextColor={colors.textLight}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={() => sendMessage()}
            disabled={loading || !inputText.trim()}
          >
            <MaterialIcons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    gap: 8
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827'
  },
  phaseIndicator: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    gap: 8
  },
  phaseItem: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center'
  },
  phaseActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)'
  },
  phaseText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500'
  },
  messagesContainer: {
    flex: 1
  },
  messagesContent: {
    padding: 16,
    gap: 12
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8
  },
  aiMessage: {
    justifyContent: 'flex-start'
  },
  userMessage: {
    justifyContent: 'flex-end',
    flexDirection: 'row-reverse'
  },
  huxleyAvatar: {
    width: 60,
    height: 60,
    marginRight: 8,
    marginTop: 4
  },
  loadingBubble: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16
  },
  aiBubble: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.lightGray
  },
  userBubble: {
    maxWidth: '75%',
    backgroundColor: colors.primary
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20
  },
  aiText: {
    color: '#111827'
  },
  userText: {
    color: '#fff'
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic'
  },
  actionsContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    gap: 8
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center'
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.primary
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600'
  },
  secondaryButtonText: {
    color: colors.primary
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    gap: 12
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#f9fafb'
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db'
  }
});

export default ConversationalRegulatingResources;
