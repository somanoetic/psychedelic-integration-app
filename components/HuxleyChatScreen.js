/**
 * Huxley Chat Screen
 *
 * Wysa-inspired conversational interface with typewriter text effect
 * Text appears gradually at a comfortable reading pace
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, gradients } from '../theme/colors';
import conversationalRoutingService from '../lib/conversationalRoutingService';
import HuxleyWelcomeScreen from './HuxleyWelcomeScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Generate contextual quick replies based on conversation state
 */
const getContextualQuickReplies = (route, routeLabel, messageCount, lastUserMessage) => {
  // If a route was suggested, offer to navigate
  if (route) {
    return [
      { label: `Go to ${routeLabel || 'that'}`, value: `navigate_${route}` },
      { label: "Tell me more first", value: "Can you tell me more about what that involves?" },
      { label: "Not quite right", value: "That's not quite what I'm looking for" },
    ];
  }

  // Early conversation (first 1-2 messages) - exploratory
  if (messageCount <= 2) {
    // Check for emotional content
    if (lastUserMessage.match(/anxious|worried|scared|nervous|stressed/)) {
      return [
        { label: "It's been building up", value: "It's been building up lately" },
        { label: "Something triggered it", value: "Something specific triggered this" },
        { label: "I'm not sure why", value: "I'm not really sure why I feel this way" },
      ];
    }
    if (lastUserMessage.match(/sad|down|depressed|low|heavy/)) {
      return [
        { label: "I want to process this", value: "I'd like to process what I'm feeling" },
        { label: "Just need to vent", value: "I just need to get this out" },
        { label: "Looking for support", value: "I'm looking for some support" },
      ];
    }
    if (lastUserMessage.match(/okay|fine|good|well|alright/)) {
      return [
        { label: "Want to journal", value: "I'd like to journal about my day" },
        { label: "Explore something", value: "I want to explore something on my mind" },
        { label: "Just checking in", value: "Just checking in, nothing specific" },
      ];
    }
    // Default early conversation
    return [
      { label: "Tell you more", value: "Let me tell you more about that" },
      { label: "I'm not sure", value: "I'm not sure how to describe it" },
      { label: "Ask me something", value: "Maybe ask me a question to help" },
    ];
  }

  // Mid conversation (3-5 messages) - deepening
  if (messageCount <= 5) {
    // Check for body/somatic mentions
    if (lastUserMessage.match(/body|chest|stomach|tension|tight|heavy|sensation/)) {
      return [
        { label: "Yes, there's more", value: "Yes, I notice more sensations" },
        { label: "It's hard to describe", value: "It's hard to put into words" },
        { label: "What does this mean?", value: "What do you think this means?" },
      ];
    }
    // Check for parts/internal conflict
    if (lastUserMessage.match(/part of me|voice|conflict|torn|both/)) {
      return [
        { label: "Explore this part", value: "I'd like to explore this part more" },
        { label: "There's another part too", value: "There's another part that feels differently" },
        { label: "This is confusing", value: "This internal conflict is confusing" },
      ];
    }
    // Default mid-conversation
    return [
      { label: "That resonates", value: "That really resonates with me" },
      { label: "I'm realizing...", value: "I'm starting to realize something" },
      { label: "Can we go deeper?", value: "Can we go deeper into this?" },
    ];
  }

  // Later conversation (6+ messages) - integration/action
  return [
    { label: "What should I do?", value: "What do you think I should do with this?" },
    { label: "I want to practice", value: "I'd like a practice or exercise" },
    { label: "This was helpful", value: "This conversation has been really helpful" },
    { label: "Need to sit with this", value: "I need some time to sit with this" },
  ];
};

// Typewriter text component
const TypewriterText = ({ text, onComplete, speed = 30, style }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!text) return;

    setDisplayedText('');
    setIsComplete(false);
    let index = 0;

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.substring(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <Text style={style}>
      {displayedText}
      {!isComplete && <Text style={styles.cursor}>|</Text>}
    </Text>
  );
};

// Track state globally (persists across navigations)
let hasShownWelcome = false;
let persistedMessages = [];
let hasInitializedChat = false;

// Strip markdown formatting from AI messages (safety net)
const cleanMarkdown = (text) => {
  if (!text) return '';
  return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^#+\s/gm, '');
};

const HuxleyChatScreen = ({ navigation }) => {
  const [messages, setMessages] = useState(persistedMessages);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypingIndex, setCurrentTypingIndex] = useState(-1);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [inputEnabled, setInputEnabled] = useState(persistedMessages.length > 0);
  const [showWelcome, setShowWelcome] = useState(!hasShownWelcome);
  const scrollViewRef = useRef(null);
  const messageQueue = useRef([]);
  const isProcessingQueue = useRef(false);
  const insets = useSafeAreaInsets();

  // Load welcome screen state from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem('huxley_welcome_shown').then(value => {
      if (value === 'true') {
        hasShownWelcome = true;
        setShowWelcome(false);
        // If welcome was already shown, start chat if needed
        if (!hasInitializedChat && persistedMessages.length === 0) {
          hasInitializedChat = true;
          startGreetingSequence();
        }
      }
    });
  }, []);

  // Persist messages to module-level variable when they change
  useEffect(() => {
    persistedMessages = messages;
  }, [messages]);

  // Process message queue sequentially
  const processQueue = useCallback(async () => {
    if (isProcessingQueue.current || messageQueue.current.length === 0) return;

    isProcessingQueue.current = true;

    while (messageQueue.current.length > 0) {
      const { message, delay } = messageQueue.current.shift();

      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      setMessages(prev => [...prev, { ...message, isTyping: true }]);
      setCurrentTypingIndex(prev => prev + 1);

      // Wait for typewriter to complete (estimate based on text length)
      const typingDuration = message.content.length * 30 + 500;
      await new Promise(resolve => setTimeout(resolve, typingDuration));

      // Mark message as complete
      setMessages(prev =>
        prev.map((m, i) =>
          i === prev.length - 1 ? { ...m, isTyping: false } : m
        )
      );

      // Show quick replies if this message has them
      if (message.quickReplies) {
        setShowQuickReplies(true);
        setInputEnabled(true);
      }
    }

    isProcessingQueue.current = false;
  }, []);

  // Queue a message to be displayed
  const queueMessage = (message, delay = 0) => {
    messageQueue.current.push({ message, delay });
    processQueue();
  };

  // Handle welcome completion and start chat greeting
  const handleWelcomeComplete = useCallback(() => {
    hasShownWelcome = true;
    setShowWelcome(false);
    AsyncStorage.setItem('huxley_welcome_shown', 'true');

    // Start the greeting messages after welcome is dismissed
    if (!hasInitializedChat) {
      hasInitializedChat = true;
      startGreetingSequence();
    }
  }, []);

  // Start greeting sequence
  const startGreetingSequence = () => {
    const greetings = [
      {
        id: 'welcome-1',
        role: 'assistant',
        content: "Hey there... I'm Huxley.",
      },
      {
        id: 'welcome-2',
        role: 'assistant',
        content: "I'm here to support you on your journey.",
      },
      {
        id: 'welcome-3',
        role: 'assistant',
        content: "What would you like to focus on today?",
        quickReplies: [
          { label: "Prepare for a session", value: "navigate_SessionPreparation" },
          { label: "Process an experience", value: "navigate_ExperienceMapping" },
          { label: "Learn something new", value: "navigate_Learn" },
          { label: "Just talk", value: "I just want to talk and check in" },
        ],
      },
    ];

    setTimeout(() => {
      greetings.forEach((msg, index) => {
        queueMessage(msg, index === 0 ? 0 : 800);
      });
    }, 500);
  };

  // If welcome was already shown but no messages yet (fresh return), start greeting
  useEffect(() => {
    if (hasShownWelcome && !hasInitializedChat && persistedMessages.length === 0) {
      hasInitializedChat = true;
      startGreetingSequence();
    }
  }, []);

  const handleMessageComplete = (index) => {
    setMessages(prev =>
      prev.map((m, i) =>
        i === index ? { ...m, isTyping: false } : m
      )
    );
  };

  const handleSend = async (text = inputText) => {
    if (!text.trim() || isTyping) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      isTyping: false,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setShowQuickReplies(false);
    setInputEnabled(false);
    setIsTyping(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await conversationalRoutingService.routeMessage(text.trim());

      // Small delay before Huxley responds
      await new Promise(resolve => setTimeout(resolve, 1000));

      setIsTyping(false);

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        isTyping: true,
        suggestedRoute: response.route,
        routeLabel: response.routeLabel,
      };

      // Add contextual quick replies based on conversation depth and context
      const messageCount = messages.filter(m => m.role === 'user').length;
      assistantMessage.quickReplies = getContextualQuickReplies(
        response.route,
        response.routeLabel,
        messageCount,
        text.trim().toLowerCase()
      );

      queueMessage(assistantMessage, 0);

    } catch (error) {
      console.error('Huxley chat error:', error);
      setIsTyping(false);

      queueMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having a moment... let me gather my thoughts. Could you try again?",
        isTyping: true,
        quickReplies: [
          { label: "Try again", value: "try_again" },
          { label: "Show me the menu", value: "show_menu" },
        ],
      }, 0);
    }
  };

  const handleQuickReply = (reply) => {
    setShowQuickReplies(false);

    if (reply.value.startsWith('navigate_')) {
      const route = reply.value.replace('navigate_', '');
      if (route === 'Learn') {
        navigation.navigate('MainTabs', { screen: 'Learn' });
      } else {
        navigation.navigate(route);
      }
      return;
    }

    if (reply.value === 'show_menu' || reply.value === 'show_tools') {
      navigation.navigate('MainTabs');
      return;
    }

    handleSend(reply.label);
  };

  const renderMessage = (message, index) => {
    const isUser = message.role === 'user';
    const isLastMessage = index === messages.length - 1;

    return (
      <View key={message.id} style={styles.messageContainer}>
        {!isUser && (
          <View style={styles.huxleyRow}>
            <Image
              source={require('../assets/images/huxley therapist.png')}
              style={styles.huxleyAvatar}
              resizeMode="contain"
            />
            <View style={styles.messageBubble}>
              {message.isTyping ? (
                <TypewriterText
                  text={cleanMarkdown(message.content)}
                  speed={25}
                  style={styles.messageText}
                  onComplete={() => handleMessageComplete(index)}
                />
              ) : (
                <Text style={styles.messageText}>{cleanMarkdown(message.content)}</Text>
              )}
            </View>
          </View>
        )}
        {isUser && (
          <View style={styles.userRow}>
            <View style={[styles.messageBubble, styles.userBubble]}>
              <Text style={[styles.messageText, styles.userText]}>{message.content}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderQuickReplies = () => {
    const lastMessage = messages[messages.length - 1];
    if (!showQuickReplies || !lastMessage?.quickReplies || lastMessage.isTyping) return null;

    return (
      <View style={styles.quickRepliesContainer}>
        {lastMessage.quickReplies.map((reply, index) => (
          <TouchableOpacity
            key={index}
            style={styles.quickReplyButton}
            onPress={() => handleQuickReply(reply)}
            activeOpacity={0.7}
          >
            <Text style={styles.quickReplyText}>{reply.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderThinkingIndicator = () => {
    if (!isTyping) return null;

    return (
      <View style={styles.messageContainer}>
        <View style={styles.huxleyRow}>
          <Image
            source={require('../assets/images/huxley therapist.png')}
            style={styles.huxleyAvatar}
            resizeMode="contain"
          />
          <View style={[styles.messageBubble, styles.thinkingBubble]}>
            <Text style={styles.thinkingText}>thinking...</Text>
          </View>
        </View>
      </View>
    );
  };

  // Show welcome screen first (only on initial app load)
  if (showWelcome) {
    return (
      <HuxleyWelcomeScreen
        onComplete={handleWelcomeComplete}
      />
    );
  }

  return (
    <LinearGradient
      colors={gradients.standard}
      start={gradients.standardStart}
      end={gradients.standardEnd}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation.navigate('MainTabs')}
            >
              <MaterialIcons name="apps" size={28} color={colors.text} />
            </TouchableOpacity>

            {/* Debug: Screen name */}
            {__DEV__ && (
              <Text style={styles.debugScreenName}>HuxleyChatScreen</Text>
            )}
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map(renderMessage)}
            {renderThinkingIndicator()}
            <View style={styles.bottomPadding} />
          </ScrollView>

          {/* Quick Replies */}
          {renderQuickReplies()}

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={500}
              editable={inputEnabled || messages.length > 0}
              onSubmitEditing={() => handleSend()}
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={() => handleSend()}
              disabled={!inputText.trim() || isTyping}
            >
              <MaterialIcons
                name="send"
                size={24}
                color={inputText.trim() ? '#fff' : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  menuButton: {
    padding: 8,
    borderRadius: 12,
  },
  debugScreenName: {
    fontSize: 10,
    color: 'rgba(0,0,0,0.4)',
    fontFamily: 'monospace',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
  },
  messageContainer: {
    marginBottom: 20,
  },
  huxleyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  huxleyAvatar: {
    width: 64,
    height: 64,
    marginRight: 12,
    marginTop: 4,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: SCREEN_WIDTH * 0.75,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 4,
  },
  thinkingBubble: {
    paddingVertical: 12,
  },
  messageText: {
    fontSize: 17,
    lineHeight: 26,
    color: colors.text,
  },
  userText: {
    color: '#fff',
  },
  thinkingText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  cursor: {
    color: colors.textSecondary,
    fontWeight: '300',
  },
  quickRepliesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  quickReplyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  quickReplyText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 16 : 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    color: colors.text,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  bottomPadding: {
    height: 20,
  },
});

export default HuxleyChatScreen;
