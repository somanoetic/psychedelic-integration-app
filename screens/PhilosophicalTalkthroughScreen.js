/**
 * Philosophical Talkthrough Screen
 *
 * Conversational screen for a single philosophical exploration.
 * Pattern follows ActiveImaginationScreen.js — uses huxleyService in
 * 'philosophical_talkthrough' mode with the same chat UI.
 */

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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import huxleyService from '../lib/huxleyService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';
import { getTopicById } from '../content/philosophicalTalkthroughs';

const PhilosophicalTalkthroughScreen = ({ navigation, route }) => {
  const topicId = route?.params?.topicId;
  const topicData = getTopicById(topicId);

  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAIMode, setIsAIMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currentPhase, setCurrentPhase] = useState('opening_inquiry');
  const [isComplete, setIsComplete] = useState(false);

  const scrollViewRef = useRef(null);

  // Scroll on keyboard show
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(showEvent, () => {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => { initializeSession(); }, []);

  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, isTyping]);

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  const initializeSession = async () => {
    if (!topicData) {
      setLoading(false);
      addMessage('assistant', 'Something went wrong — I couldn\'t find that topic. Please go back and try again.');
      return;
    }

    try {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        await huxleyService.initialize(userData.id);
      }

      huxleyService.setMode('philosophical_talkthrough', { clearHistory: true });

      // Set topic on handler so it can reference themes in phase guidance
      const handler = huxleyService.modeHandlers.philosophical_talkthrough;
      if (handler) {
        handler.selectedTopic = topicData;
      }

      // Get opening message from AI
      setIsTyping(true);
      const response = await huxleyService.chat('', {
        modeContext: { selectedTopic: topicData },
      });

      setIsTyping(false);
      addMessage('assistant', response.message || topicData.openingTheme);
    } catch (error) {
      console.error('[PhilosophicalTalkthrough] Init error:', error);
      // Fallback to topic's opening theme
      addMessage('assistant', topicData.openingTheme + '\n\nWhat comes up for you when you sit with that?');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Message helpers
  // ---------------------------------------------------------------------------

  const addMessage = (sender, text, options = null) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      sender,
      text,
      options,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAI: sender === 'assistant' && isAIMode,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // ---------------------------------------------------------------------------
  // Chat handler
  // ---------------------------------------------------------------------------

  const handleSendMessage = async (messageOverride = null) => {
    const message = messageOverride || userInput.trim();
    if (!message || isComplete) return;

    if (!messageOverride) {
      addMessage('user', message);
      setUserInput('');
    }
    setIsTyping(true);

    try {
      const response = await huxleyService.chat(message, {
        modeContext: { selectedTopic: topicData },
      });

      setIsTyping(false);
      setIsAIMode(response.isAI);

      // Update phase from handler
      if (response.sessionProgress) {
        setCurrentPhase(response.sessionProgress.phase);

        if (response.sessionProgress.isComplete) {
          setIsComplete(true);
        }

        // In journaling phase, offer journal prompts as quick replies
        if (response.sessionProgress.phase === 'journaling' && topicData.journalPrompts) {
          const promptIndex = response.sessionProgress.journalResponseCount || 0;
          if (promptIndex < topicData.journalPrompts.length) {
            addMessage('assistant', response.message, [topicData.journalPrompts[promptIndex]]);
            return;
          }
        }
      }

      addMessage('assistant', response.message);

      // Offer closing option when complete
      if (response.sessionProgress?.isComplete) {
        setTimeout(() => {
          addMessage('assistant',
            'Thank you for sitting with these questions. They don\'t need answers — just your attention.\n\nCarry them lightly.',
            ['Close']
          );
        }, 1500);
      }
    } catch (error) {
      setIsTyping(false);
      console.error('[PhilosophicalTalkthrough] Chat error:', error);
      addMessage('assistant', 'Take your time. What\'s present for you right now?');
    }
  };

  // ---------------------------------------------------------------------------
  // Option handling
  // ---------------------------------------------------------------------------

  const handleOptionSelect = (option) => {
    if (option === 'Close') {
      navigation.goBack();
      return;
    }
    // Journal prompt selected — send as user message
    addMessage('user', option);
    handleSendMessage(option);
  };

  // ---------------------------------------------------------------------------
  // Phase label
  // ---------------------------------------------------------------------------

  const PHASE_LABELS = {
    opening_inquiry: 'Opening Inquiry',
    deepening: 'Deepening',
    contemplation: 'Contemplation',
    journaling: 'Journaling',
    complete: 'Complete',
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const renderMessage = (message) => {
    const isUser = message.sender === 'user';

    if (!isUser) {
      return (
        <View key={message.id} style={styles.assistantMessageRow}>
          <Image
            source={require('../assets/images/huxley-avatar.png')}
            style={styles.huxleyAvatar}
            resizeMode="contain"
          />
          <View style={[styles.messageBubble, styles.assistantBubble]}>
            <Text style={[styles.messageText, styles.assistantText]}>
              {message.text}
            </Text>

            {message.options && (
              <View style={styles.optionsContainer}>
                {message.options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.optionButton}
                    onPress={() => handleOptionSelect(option)}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.messageFooter}>
              <Text style={[styles.timestamp, styles.assistantTimestamp]}>
                {message.timestamp}
              </Text>
              {message.isAI && (
                <Text style={styles.aiIndicator}>AI</Text>
              )}
            </View>
          </View>
        </View>
      );
    }

    return (
      <View key={message.id} style={[styles.messageContainer, styles.userMessageContainer]}>
        <View style={[styles.messageBubble, styles.userBubble]}>
          <Text style={[styles.messageText, styles.userText]}>
            {message.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.timestamp, styles.userTimestamp]}>
              {message.timestamp}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Preparing the space...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack()}>
            <Text style={styles.backButton}>{'\u2190'} Back</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{topicData?.title || 'Talkthrough'}</Text>
            <Text style={styles.phaseIndicator}>
              {PHASE_LABELS[currentPhase] || currentPhase}
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(renderMessage)}

          {isTyping && (
            <View style={styles.assistantMessageRow}>
              <Image
                source={require('../assets/images/huxley-avatar.png')}
                style={styles.huxleyAvatar}
                resizeMode="contain"
              />
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                <View style={styles.typingIndicator}>
                  <View style={styles.typingDot} />
                  <View style={[styles.typingDot, styles.typingDot2]} />
                  <View style={[styles.typingDot, styles.typingDot3]} />
                </View>
                <Text style={styles.typingText}>Huxley is reflecting...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        {!isComplete && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={userInput}
              onChangeText={setUserInput}
              placeholder="Share what comes to mind..."
              placeholderTextColor={colors.textLight}
              multiline
              maxLength={1000}
              onSubmitEditing={() => {
                if (userInput.trim()) handleSendMessage();
              }}
            />
            <TouchableOpacity
              style={[styles.sendButton, !userInput.trim() && styles.sendButtonDisabled]}
              onPress={() => handleSendMessage()}
              disabled={!userInput.trim() || isTyping}
            >
              {isTyping ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.sendButtonText}>Send</Text>
              )}
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
    backgroundColor: colors.surface,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  keyboardAvoid: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  phaseIndicator: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 2,
    fontWeight: '500',
  },
  headerSpacer: {
    width: 60,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  assistantMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  huxleyAvatar: {
    width: 54,
    height: 54,
    marginRight: 8,
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.lightGray,
    flex: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: colors.textInverse,
  },
  assistantText: {
    color: colors.text,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  assistantTimestamp: {
    color: colors.mediumGray,
  },
  aiIndicator: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
    backgroundColor: `${colors.primary}1A`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  optionsContainer: {
    marginTop: 12,
    gap: 8,
  },
  optionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 10,
  },
  optionText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.mediumGray,
  },
  typingDot2: {
    opacity: 0.7,
  },
  typingDot3: {
    opacity: 0.4,
  },
  typingText: {
    fontSize: 14,
    color: colors.mediumGray,
    fontStyle: 'italic',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: colors.offWhite,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    minWidth: 70,
  },
  sendButtonDisabled: {
    backgroundColor: colors.mediumGray,
  },
  sendButtonText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default PhilosophicalTalkthroughScreen;
