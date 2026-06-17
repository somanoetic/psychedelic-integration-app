/**
 * Huxley Chat Screen
 *
 * Wysa-inspired conversational interface with typewriter text effect
 * Text appears gradually at a comfortable reading pace
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Send, ChevronDown } from 'lucide-react-native';
import { colors, gradients } from '../theme/colors';
import { icons } from '../lib/uiIcons';
import conversationalRoutingService from '../lib/conversationalRoutingService';
import huxleyService from '../lib/huxleyService';
import { useHuxleyChat } from '../contexts/HuxleyChatContext';
import HuxleyWelcomeScreen from './HuxleyWelcomeScreen';
import FormattedText from './FormattedText';
import HuxleyVoiceController from './HuxleyVoiceController';

// Routes where seeding a recent-context handoff into huxleyService is useful.
// Home / Learn are navigation hubs, not Huxley conversations, so skip them.
const HANDOFF_ROUTES = new Set([
  'TriggeredSupport',
  'Journal',
  'ExperienceMapping',
  'IFSChat',
  'NervousSystemMapping',
  'TriggersGlimmers',
  'RegulatingResources',
  'CoreBeliefs',
  'SessionPreparation',
]);

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

// Strip markdown formatting from AI messages (safety net)
const cleanMarkdown = (text) => {
  if (!text) return '';
  return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^#+\s/gm, '');
};

const HuxleyChatScreen = ({ navigation }) => {
  const {
    messages,
    setMessages,
    welcomeShown,
    setWelcomeShown,
    voiceMode,
    setVoiceMode,
    markChatInitialized,
    isChatInitialized,
  } = useHuxleyChat();

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypingIndex, setCurrentTypingIndex] = useState(-1);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [inputEnabled, setInputEnabled] = useState(messages.length > 0);
  const [showWelcome, setShowWelcome] = useState(!welcomeShown);
  const scrollViewRef = useRef(null);
  const messageQueue = useRef([]);
  const isProcessingQueue = useRef(false);
  const insets = useSafeAreaInsets();

  // Smart auto-scroll: only stick to bottom when the user is already near it.
  // If they've scrolled up to read history, new messages won't yank them back.
  const isNearBottomRef = useRef(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const handleScroll = useCallback((e) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    const nearBottom = distanceFromBottom < 80;
    isNearBottomRef.current = nearBottom;
    setShowScrollToBottom(prev => (prev === nearBottom ? !nearBottom : prev));
  }, []);
  const handleContentSizeChange = useCallback(() => {
    if (isNearBottomRef.current) {
      // Unanimated: typewriter fires this every ~30ms per character, and
      // animated scrolls don't complete fast enough to keep up — the result
      // was that we lagged behind the actual content bottom while Huxley
      // typed. Snap-to-bottom is invisible character-to-character but keeps
      // the view pinned to the latest content reliably.
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }
  }, []);
  const scrollToBottom = useCallback(() => {
    isNearBottomRef.current = true;
    setShowScrollToBottom(false);
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, []);

  // Scroll to bottom when keyboard opens
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(showEvent, () => {
      setTimeout(() => {
        isNearBottomRef.current = true;
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    });
    return () => sub.remove();
  }, []);

  // Keyboard avoidance, per platform (mirrors components/chat/ChatConversation.js):
  //
  // iOS — KeyboardAvoidingView behavior="padding" works correctly, so we keep it.
  //
  // Android — KAV behavior="height"/"padding" left a residual gap (≈ nav-bar
  // inset) on dismiss because the KAV measures the keyboard frame from the
  // screen bottom but sits inside the wrapping <SafeAreaView edges={['bottom']}>
  // which already reserves that inset, so the padding never collapsed to 0.
  // Instead we drive bottom padding ourselves from the real keyboard height.
  // We pad by the FULL keyboard height: when the keyboard opens the soft
  // nav-bar inset collapses (the keyboard takes that space), so subtracting
  // insets.bottom under-pads and lets the keyboard cover the input. On dismiss
  // the height goes to 0 and the padding collapses cleanly — no gap.
  const useOwnKav = Platform.OS === 'ios';
  const keyboardPad = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const onShow = (e) => {
      const kbHeight = e?.endCoordinates?.height ?? 0;
      keyboardPad.setValue(kbHeight);
    };
    const onHide = () => keyboardPad.setValue(0);
    const showSub = Keyboard.addListener('keyboardDidShow', onShow);
    const hideSub = Keyboard.addListener('keyboardDidHide', onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardPad]);

  // Tracks when the user last interacted with this screen. Used by the
  // return-to-chat acknowledgment below to decide whether enough time has
  // passed to warrant a "welcome back" beat (we don't want to acknowledge a
  // 2-second tab switch). Persists across navigations in the ref because
  // the chat screen stays mounted in the stack.
  const lastBlurAtRef = useRef(null);
  const RETURN_ACK_THRESHOLD_MS = 30 * 1000; // 30s gone away → worth acknowledging

  // Turn voice mode OFF when the chat screen loses focus (e.g. Huxley routes
  // to Session Preparation, user navigates back out to tabs, etc.). Without
  // this, the orphaned voice controller keeps the mic open in the background
  // — which is both a privacy concern (recording when the user isn't on a
  // voice-enabled screen) and surfaces ghost transcripts attributed to the
  // user (Whisper hallucinating on muffled ambient audio while the user is
  // doing something else).
  //
  // The user can re-toggle voice mode when they come back to this screen.
  useFocusEffect(
    useCallback(() => {
      // On re-focus: if the user was away long enough, append a gentle
      // acknowledgment so Huxley doesn't just sit there with the last message
      // frozen. This is a passive bubble — no quick replies, no question —
      // an opening for the user to continue if they want.
      if (lastBlurAtRef.current && messages.length > 0) {
        const awayMs = Date.now() - lastBlurAtRef.current;
        if (awayMs >= RETURN_ACK_THRESHOLD_MS) {
          const ackText = "Hey, you're back. Want to keep going or start with something new?";
          conversationalRoutingService.seedAssistantGreeting(ackText);
          queueMessage(
            {
              id: `welcome-back-${Date.now()}`,
              role: 'assistant',
              content: ackText,
              isTyping: true,
            },
            300,
          );
        }
        lastBlurAtRef.current = null;
      }
      return () => {
        // On blur: force voice off and stamp the blur time.
        setVoiceMode(false);
        lastBlurAtRef.current = Date.now();
      };
      // queueMessage is stable enough — we intentionally don't depend on
      // messages.length here because it'd re-run on every new message.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setVoiceMode]),
  );

  // Load welcome screen state from AsyncStorage on mount.
  // When the user has already seen the full HuxleyWelcomeScreen ("Hi, I'm Huxley..."),
  // the chat greeting drops the self-introduction so we don't re-introduce him every launch.
  useEffect(() => {
    AsyncStorage.getItem('huxley_welcome_shown').then(value => {
      if (value === 'true') {
        setWelcomeShown(true);
        setShowWelcome(false);
        if (!isChatInitialized() && messages.length === 0) {
          markChatInitialized();
          startGreetingSequence({ returning: true });
        }
      }
    });
    // Messages length is intentionally not a dependency — we only check it once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Process message queue sequentially.
  // In voice mode we skip the typewriter (text appears at once so TTS playback
  // stays in sync), so the per-message dwell time collapses to a small fixed beat.
  const processQueue = useCallback(async () => {
    if (isProcessingQueue.current || messageQueue.current.length === 0) return;

    isProcessingQueue.current = true;

    while (messageQueue.current.length > 0) {
      const { message, delay } = messageQueue.current.shift();

      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // In voice mode, isTyping=false means "show full text immediately."
      // In text mode, isTyping=true triggers the typewriter render path.
      const useTypewriter = !voiceMode;
      setMessages(prev => [...prev, { ...message, isTyping: useTypewriter }]);
      setCurrentTypingIndex(prev => prev + 1);

      const dwell = useTypewriter
        ? message.content.length * 15 + 500
        : 250;
      await new Promise(resolve => setTimeout(resolve, dwell));

      if (useTypewriter) {
        setMessages(prev =>
          prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, isTyping: false } : m
          )
        );
      }

      if (message.quickReplies) {
        setShowQuickReplies(true);
        setInputEnabled(true);
      }
    }

    isProcessingQueue.current = false;
  }, [voiceMode, setMessages]);

  // Queue a message to be displayed
  const queueMessage = (message, delay = 0) => {
    messageQueue.current.push({ message, delay });
    processQueue();
  };

  // Handle welcome completion and start chat greeting
  const handleWelcomeComplete = useCallback(() => {
    setWelcomeShown(true);
    setShowWelcome(false);
    AsyncStorage.setItem('huxley_welcome_shown', 'true');

    // First launch: HuxleyWelcomeScreen just introduced him, so the chat
    // greeting skips the re-introduction and goes straight to the question.
    if (!isChatInitialized()) {
      markChatInitialized();
      startGreetingSequence({ returning: false });
    }
  }, [setWelcomeShown, isChatInitialized, markChatInitialized]);

  // Start greeting sequence.
  // HuxleyWelcomeScreen handles the "Hi, I'm Huxley" introduction on first launch only;
  // chat greetings never re-introduce him — they just open the conversation.
  const startGreetingSequence = ({ returning } = { returning: false }) => {
    const opener = returning ? "Welcome back." : "Hey there 👋";
    const question = "What would you like to focus on today?";

    // Seed the routing service so it knows this greeting already happened.
    // Otherwise the user's first reply arrives at the router as a cold turn 1
    // and the router responds with its own greeting on top of ours.
    conversationalRoutingService.seedAssistantGreeting(opener);
    conversationalRoutingService.seedAssistantGreeting(question);

    const greetings = [
      {
        id: 'welcome-1',
        role: 'assistant',
        content: opener,
      },
      {
        id: 'welcome-2',
        role: 'assistant',
        content: question,
        quickReplies: [
          { label: "Explore the app", value: "navigate_Home" },
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

  // If welcome was already shown but no messages yet (fresh return), start greeting.
  // Reads from context state set by the AsyncStorage-loading effect above.
  useEffect(() => {
    if (welcomeShown && !isChatInitialized() && messages.length === 0) {
      markChatInitialized();
      startGreetingSequence({ returning: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [welcomeShown]);

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
      if (isNearBottomRef.current) {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }
    }, 100);

    try {
      const response = await conversationalRoutingService.routeMessage(text.trim());

      // Small delay before Huxley responds — feels warmer in text mode,
      // but in voice mode it just adds dead air before TTS speaks, so skip it.
      if (!voiceMode) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

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

      // Hand off recent routing turns to huxleyService so the destination mode
      // greets with continuity instead of starting cold. Only for routes that
      // actually use huxleyService (the conversational modes).
      if (HANDOFF_ROUTES.has(route)) {
        const recent = conversationalRoutingService.getRecentContextSummary(3);
        if (recent) huxleyService.acceptHandoff(recent);
      }

      navigation.navigate(route);
      return;
    }

    if (reply.value === 'show_menu' || reply.value === 'show_tools') {
      navigation.navigate('Home');
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
              source={require('../assets/images/huxley-avatar.png')}
              style={styles.huxleyAvatar}
              resizeMode="contain"
            />
            <View style={styles.messageBubble}>
              {message.isTyping ? (
                <TypewriterText
                  text={cleanMarkdown(message.content)}
                  speed={15}
                  style={styles.messageText}
                  onComplete={() => handleMessageComplete(index)}
                />
              ) : (
                <FormattedText style={styles.messageText}>{message.content}</FormattedText>
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
            source={require('../assets/images/huxley-avatar.png')}
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

  // Most-recent assistant message — handed to the voice controller so it
  // knows when there's a new response to speak. Looks backward from the end
  // so we ignore in-flight user bubbles or the thinking indicator.
  const latestAssistant = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') return messages[i];
    }
    return null;
  })();

  // iOS uses a real KeyboardAvoidingView; Android uses a plain Animated.View
  // whose paddingBottom we animate from the measured keyboard height (effect
  // above). See the long comment near that effect for why.
  const KeyboardWrapper = useOwnKav ? KeyboardAvoidingView : Animated.View;
  const keyboardWrapperProps = useOwnKav
    ? {
        behavior: 'padding',
        style: styles.keyboardView,
        // Forced to 0: the wrapping SafeAreaView owns the bottom inset.
        keyboardVerticalOffset: 0,
      }
    : {
        style: [styles.keyboardView, { paddingBottom: keyboardPad }],
      };

  return (
    <LinearGradient
      colors={gradients.standard}
      start={gradients.standardStart}
      end={gradients.standardEnd}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardWrapper {...keyboardWrapperProps}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Image source={icons.home} style={styles.homeIcon} />
            </TouchableOpacity>

            {/* Voice conversation toggle paused 2026-06-02 — the turn-based
                Whisper + VAD architecture doesn't clear the "talking to a
                guide IRL" bar for therapeutic conversation. Plumbing is
                preserved (HuxleyVoiceController, voiceService, edge functions)
                but the entry point is hidden. Narration-only voice (Huxley
                reading guided exercises) is being pursued instead — see
                context/features/voice-conversation-phase1.md. */}
          </View>

          {/* Messages */}
          <View style={styles.messagesWrapper}>
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              onContentSizeChange={handleContentSizeChange}
            >
              {messages.map(renderMessage)}
              {renderThinkingIndicator()}
              {/* In voice mode the status pill sits ~bottom:90 (≈130px above
                  the screen bottom). Without extra padding, the last bubble
                  scrolls behind the pill and stays hidden. Adds breathing
                  room above the pill rather than letting content slide under it. */}
              <View style={voiceMode ? styles.voiceBottomPadding : styles.bottomPadding} />
            </ScrollView>
            {showScrollToBottom && (
              <TouchableOpacity
                style={styles.scrollToBottomButton}
                onPress={scrollToBottom}
                activeOpacity={0.85}
                accessibilityLabel="Scroll to latest message"
              >
                <ChevronDown size={22} color="#fff" strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Replies */}
          {renderQuickReplies()}

          {/* Input — hidden in voice mode; voice controller drives the loop instead */}
          {!voiceMode && (
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
                <Send
                  size={24}
                  color={inputText.trim() ? '#fff' : colors.textSecondary}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Voice mode overlay + recorder lifecycle */}
          <HuxleyVoiceController
            voiceMode={voiceMode}
            onTranscript={(t) => handleSend(t)}
            lastAssistantText={latestAssistant?.content}
            lastAssistantId={latestAssistant?.id}
            onSpeakingEnd={() => {
              // In voice mode, the user can't tap "Go to X" — when Huxley
              // says he'll take them somewhere, that verbal cue is the
              // navigation. After Huxley finishes speaking, auto-navigate
              // if the last response carried a route.
              if (!voiceMode) return;
              const route = latestAssistant?.suggestedRoute;
              if (!route) return;
              if (HANDOFF_ROUTES.has(route)) {
                const recent = conversationalRoutingService.getRecentContextSummary(3);
                if (recent) huxleyService.acceptHandoff(recent);
              }
              navigation.navigate(route);
            }}
          />
        </KeyboardWrapper>
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
  voiceToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceToggleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  homeIcon: {
    width: 44,
    height: 44,
    resizeMode: 'contain',
  },
  messagesWrapper: {
    flex: 1,
    position: 'relative',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
  },
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  messageContainer: {
    marginBottom: 20,
  },
  huxleyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  huxleyAvatar: {
    width: 96,
    height: 96,
    marginRight: 12,
    marginTop: 4,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  messageBubble: {
    flex: 1,
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
    flex: 0,
    maxWidth: SCREEN_WIDTH * 0.75,
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
  voiceBottomPadding: {
    // pill at bottom:90 + pill height (~44) + comfortable air = 160px clear
    height: 160,
  },
});

export default HuxleyChatScreen;
