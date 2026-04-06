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
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AVATAR_OPTIONS } from './AvatarSelector';
import conversationalRoutingService from '../lib/conversationalRoutingService';
import { colors } from '../theme/colors';

const ConversationalHomeScreen = ({ navigation, user }) => {
  const [selectedAvatar, setSelectedAvatar] = useState('brain');
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
    try {
      const avatar = await AsyncStorage.getItem('huxley_avatar');
      if (avatar) setSelectedAvatar(avatar);

      // Get user name from profile if available
      if (user?.user_metadata?.name) {
        setUserName(user.user_metadata.name.split(' ')[0]);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const initializeConversation = () => {
    conversationalRoutingService.reset();
    const greeting = {
      id: Date.now().toString(),
      text: `Hello${userName !== 'friend' ? ` ${userName}` : ''}! 👋\n\nI'm here to support your journey. What's going on for you today?`,
      isAI: true,
      timestamp: new Date(),
    };
    setMessages([greeting]);
  };

  const getAvatar = () => {
    return AVATAR_OPTIONS.find(a => a.id === selectedAvatar) || AVATAR_OPTIONS[0];
  };

  const avatar = getAvatar();

  // Quick action buttons (shown as suggestions)
  const quickActions = [
    { text: "I'm triggered", icon: 'sos', color: '#ef4444' },
    { text: "I want to journal", icon: 'edit-note', color: '#06b6d4' },
    { text: "Process an experience", icon: 'auto-awesome', color: colors.primary },
    { text: "Explore my parts", icon: 'psychology', color: '#3b82f6' },
    { text: "Learn something", icon: 'school', color: '#10b981' },
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
      daily_journal: 'DailyJournal',
      post_session_journal: 'SessionTools', // Will create integration journal
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
    if (actualRoute === 'Education' || actualRoute === 'AllSessions') {
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>Psycheteleos</Text>
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => {
              /* TODO: Open avatar selector */
            }}
          >
            <View style={[styles.avatarIcon, { backgroundColor: avatar.color }]}>
              <MaterialIcons name={avatar.icon} size={24} color="#ffffff" />
            </View>
          </TouchableOpacity>
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
                    source={require('../assets/images/huxley therapist.png')}
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
                  source={require('../assets/images/huxley therapist.png')}
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
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.quickActionChip, { borderColor: action.color }]}
                  onPress={() => handleQuickAction(action.text)}
                >
                  <MaterialIcons name={action.icon} size={16} color={action.color} />
                  <Text style={[styles.quickActionText, { color: action.color }]}>
                    {action.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor="#9ca3af"
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
            <MaterialIcons
              name="send"
              size={24}
              color={!userInput.trim() || isSending ? '#9ca3af' : '#ffffff'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  avatarButton: {
    padding: 4,
  },
  avatarIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
    width: 40,
    height: 40,
    marginRight: 8,
  },
  typingText: {
    fontSize: 14,
    color: '#6b7280',
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
    color: '#374151',
  },
  userText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#ffffff',
  },
  quickActionsContainer: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
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
    borderTopColor: '#e5e7eb',
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
    color: '#1f2937',
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
    backgroundColor: '#e5e7eb',
  },
});

export default ConversationalHomeScreen;
