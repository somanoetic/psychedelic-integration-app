import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertOctagon,
  FilePen,
  Sparkles,
  Brain,
  GraduationCap,
  Send,
} from 'lucide-react-native';
import conversationalRoutingService from '../lib/conversationalRoutingService';
import { colors, gradients } from '../theme/colors';

const QUICK_ACTION_ICON_MAP = {
  sos: AlertOctagon,
  'edit-note': FilePen,
  'auto-awesome': Sparkles,
  psychology: Brain,
  school: GraduationCap,
};

const ConversationalHomeScreen = ({ navigation, user }) => {
  const [userName, setUserName] = useState('friend');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isSending, setIsSending] = useState(false);
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
    loadPreferences();
    initializeConversation();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadPreferences = async () => {
    if (user?.user_metadata?.name) {
      setUserName(user.user_metadata.name.split(' ')[0]);
    }
  };

  const initializeConversation = () => {
    conversationalRoutingService.reset();
    const greeting = {
      id: Date.now().toString(),
      text: `Hello${userName !== 'friend' ? ` ${userName}` : ''}!\n\nI'm here to support your journey. What's going on for you today?`,
      isAI: true,
      timestamp: new Date(),
    };
    setMessages([greeting]);
  };

  // Quick action buttons (shown as suggestions)
  const quickActions = [
    { text: "I'm triggered", icon: 'sos', color: colors.error },
    { text: "I want to journal", icon: 'edit-note', color: '#06b6d4' },
    { text: "Process an experience", icon: 'auto-awesome', color: colors.primary },
    { text: "Explore my parts", icon: 'psychology', color: colors.primary },
    { text: "Learn something", icon: 'school', color: colors.success },
  ];

  const handleSendMessage = async () => {
    if (!userInput.trim() || isSending) return;

    const userMessage = {
      id: Date.now().toString(),
      text: userInput.trim(),
      isAI: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsSending(true);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await conversationalRoutingService.sendMessage(userMessage.text);

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        isAI: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // If AI provided a route, navigate after brief delay
      if (response.route) {
        setTimeout(() => {
          navigateToRoute(response.route);
        }, 800);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting right now. Please try again.",
        isAI: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleQuickAction = (actionText) => {
    setUserInput(actionText);
  };

  const navigateToRoute = (routeCode) => {
    // Map AI route codes to actual navigation routes
    const routeMap = {
      triggered_support: 'TriggeredSupport',
      daily_journal: 'Journal',
      post_session_journal: 'SessionsHub', // Routes to the sessions hub
      ifs_chat: 'IFSChat',
      nervous_system_mapping: 'NervousSystemMapping',
      triggers_glimmers: 'TriggersGlimmers',
      regulating_resources: 'RegulatingResources',
      core_beliefs: 'CoreBeliefs',
      education: 'Education',
      exercises: 'ExerciseLibrary',
      settings: 'Settings',
    };

    const actualRoute = routeMap[routeCode];
    if (!actualRoute) {
      console.error('Unknown route code:', routeCode);
      return;
    }

    // Tab screens: Education, AllSessions
    // Stack screens: Everything else
    if (actualRoute === 'Education' || actualRoute === 'AllSessions' || actualRoute === 'Journal') {
      navigation.navigate(actualRoute);
    } else {
      // Stack screens - need parent navigator
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate(actualRoute, { user });
      } else {
        navigation.navigate(actualRoute, { user });
      }
    }

    // Reset conversation for next time
    conversationalRoutingService.reset();
  };

  return (
    <LinearGradient
      colors={gradients.standard}
      start={gradients.standardStart}
      end={gradients.standardEnd}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.safeArea}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>Huxley</Text>
          <Image
            source={require('../assets/images/huxley-avatar.png')}
            style={styles.headerAvatar}
            resizeMode="contain"
          />
        </View>

        {/* Conversation Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageBubbleContainer,
                  message.isAI ? styles.aiMessageContainer : styles.userMessageContainer,
                ]}
              >
                {message.isAI && (
                  <Image
                    source={require('../assets/images/huxley-avatar.png')}
                    style={styles.huxleyAvatar}
                    resizeMode="contain"
                  />
                )}
                <View
                  style={[
                    styles.messageBubble,
                    message.isAI ? styles.aiMessage : styles.userMessage,
                  ]}
                >
                  <Text style={message.isAI ? styles.aiText : styles.userText}>
                    {message.text}
                  </Text>
                </View>
              </View>
            ))}

            {isSending && (
              <View style={[styles.messageBubbleContainer, styles.aiMessageContainer]}>
                <Image
                  source={require('../assets/images/huxley-avatar.png')}
                  style={styles.huxleyAvatar}
                  resizeMode="contain"
                />
                <View style={[styles.messageBubble, styles.aiMessage]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.typingText}>Huxley is typing...</Text>
                </View>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Quick Actions (Suggestion Chips) */}
        {messages.length === 1 && (
          <View style={styles.quickActionsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickActionsContent}
            >
              {quickActions.map((action, index) => {
                const Icon = QUICK_ACTION_ICON_MAP[action.icon] || Sparkles;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.quickActionChip, { borderColor: action.color }]}
                    onPress={() => handleQuickAction(action.text)}
                  >
                    <Icon size={16} color={action.color} strokeWidth={2} />
                    <Text style={[styles.quickActionText, { color: action.color }]}>
                      {action.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor={colors.textLight}
            value={userInput}
            onChangeText={setUserInput}
            multiline
            maxLength={500}
            editable={!isSending}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!userInput.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!userInput.trim() || isSending}
          >
            <Send
              size={24}
              color={!userInput.trim() || isSending ? colors.textLight : '#ffffff'}
              strokeWidth={2}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  headerAvatar: {
    width: 48,
    height: 48,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 10,
  },
  messageBubbleContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    flexDirection: 'row-reverse',
  },
  huxleyAvatar: {
    width: 60,
    height: 60,
    marginRight: 8,
  },
  typingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  messageBubble: {
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  aiMessage: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 4,
  },
  userMessage: {
    backgroundColor: colors.primary,
    borderTopRightRadius: 4,
  },
  aiText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  userText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#ffffff',
  },
  quickActionsContainer: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    backgroundColor: '#ffffff',
  },
  quickActionsContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  quickActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: '#ffffff',
    marginRight: 8,
    gap: 6,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    gap: 12,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
});

export default ConversationalHomeScreen;
