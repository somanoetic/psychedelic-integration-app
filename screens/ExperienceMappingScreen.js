import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Image
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import huxleyService from '../lib/huxleyService';
import FormattedText from '../components/FormattedText';

const ExperienceMappingScreen = ({ navigation, route }) => {
  console.log('ExperienceMappingScreen route params:', route.params);

  const insets = useSafeAreaInsets();
  const sessionParam = route?.params?.session || null;

  // Core conversation state
  const [session, setSession] = useState(sessionParam);
  const [creatingSession, setCreatingSession] = useState(!sessionParam);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionProgress, setSessionProgress] = useState(null);
  const [showPaperReminder, setShowPaperReminder] = useState(true);

  // Refs
  const scrollViewRef = useRef(null);
  const paperReminderOpacity = useRef(new Animated.Value(1)).current;

  // Auto-create session if none provided
  useEffect(() => {
    if (!sessionParam) {
      createNewSession();
    }
  }, []);

  // Initialize conversation (must be before early returns)
  useEffect(() => {
    if (session && session.id && !creatingSession) {
      initializeConversation();
    }
  }, [session, creatingSession]);

  const dismissPaperReminder = () => {
    Animated.timing(paperReminderOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowPaperReminder(false));
  };

  // Auto-dismiss paper reminder after 8 seconds
  useEffect(() => {
    if (showPaperReminder) {
      const timer = setTimeout(dismissPaperReminder, 8000);
      return () => clearTimeout(timer);
    }
  }, [showPaperReminder]);

  const createNewSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please sign in to start a session.');
        navigation.goBack();
        return;
      }

      const { data, error } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          title: `Experience Processing - ${new Date().toLocaleDateString()}`,
          journey_date: new Date().toISOString().split('T')[0],
          current_step: 1,
          session_data: {
            sessionType: 'experience_processing',
            conversationMode: 'experienceProcessing',
          },
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        Alert.alert('Error', 'Could not create session. Please try again.');
        navigation.goBack();
        return;
      }

      setSession(data);
      setCreatingSession(false);
    } catch (err) {
      console.error('Error creating session:', err);
      Alert.alert('Error', 'Could not create session. Please try again.');
      navigation.goBack();
    }
  };

  if (creatingSession) {
    return (
      <View style={styles.errorContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.errorText, { marginTop: 16 }]}>Setting up your session...</Text>
      </View>
    );
  }

  if (!session || !session.id) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Session Error</Text>
        <Text style={styles.errorText}>
          No session data available. Please go back and start a new experience processing session.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initializeConversation = async () => {
    try {
      const hasExistingMessages = await loadMessages();

      if (!hasExistingMessages) {
        setTimeout(() => {
          initiateExperienceMapping();
        }, 1000);
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
    }
  };

  const loadMessages = async () => {
    try {
      // Check if this is a temporary session (offline/local)
      if (session.id && session.id.startsWith('temp_')) {
        console.log('Loading from temporary session (offline mode)');
        // Use session data passed from navigation
        const sessionData = session.session_data || {};
        const loadedMessages = sessionData.messages || [];

        setMessages(loadedMessages);

        // Initialize mode handler with saved context
        const handler = huxleyService.getModeHandler();
        if (handler && handler.initializeWithContext) {
          handler.initializeWithContext(sessionData.experienceData || {});
        }

        return loadedMessages.length > 0;
      }

      // Regular database session
      const { data, error } = await supabase
        .from('sessions')
        .select('session_data')
        .eq('id', session.id)
        .single();

      if (error) throw error;

      const sessionData = data?.session_data || {};
      const loadedMessages = sessionData.messages || [];

      console.log('Loading experience mapping data:', {
      sessionId: session.id,
      messageCount: loadedMessages.length,
      });

      setMessages(loadedMessages);

      // Initialize mode handler with saved context
      const handler = huxleyService.getModeHandler();
      if (handler && handler.initializeWithContext) {
        handler.initializeWithContext(sessionData.experienceData || {});
      }

      return loadedMessages.length > 0;

    } catch (error) {
      console.error('Error loading messages:', error);
      return false;
    }
  };

  const saveMessages = async (newMessages, additionalData = {}) => {
    try {
      const sessionData = {
        messages: newMessages,
        sessionType: 'experience',
        conversationMode: 'experience_mapping',
        lastUpdated: new Date().toISOString(),
        ...additionalData
      };

      // Try to save to database if session has a real ID
      if (session.id && !session.id.startsWith('temp_')) {
        try {
          const { error } = await supabase
            .from('sessions')
            .update({
              session_data: sessionData
            })
            .eq('id', session.id);

          if (error) {
            console.error('Database save failed, using local storage:', error);
            // Fall back to local storage
            await saveToLocalStorage(sessionData);
          } else {
            console.log('Session saved to database successfully');
          }
        } catch (dbError) {
          console.error('Database unavailable, using local storage:', dbError);
          await saveToLocalStorage(sessionData);
        }
      } else {
        // Session is temporary, save to local storage
        await saveToLocalStorage(sessionData);
      }
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  const saveToLocalStorage = async (sessionData) => {
    try {
      // In a real app, you'd use AsyncStorage here
      // For now, just log that we're saving locally
      console.log('Saving session data locally:', {
        sessionId: session.id,
        messageCount: sessionData.messages.length,
      });
      // TODO: Implement AsyncStorage.setItem(session.id, JSON.stringify(sessionData))
    } catch (error) {
      console.error('Local storage save failed:', error);
    }
  };

  const initiateExperienceMapping = () => {
    // Set Huxley to experience_mapping mode with a clean history
    huxleyService.setMode('experience_mapping', { clearHistory: true });

    const welcomeContent = `Welcome to **Experience Processing**!

I'm here to help you systematically explore and document your psychedelic experience.

**Before we begin:** Do you have paper and pen nearby? Writing things down helps anchor the memories.

We'll work through 4 phases:
**Gathering Details** - Capturing symbols, sensations, emotions
**Exploring Connections** - Mapping relationships
**Finding Meaning** - Life connections
**Creating Practices** - Integration methods

**Let's start:** What are the first images or experiences that come to mind from your journey?`;

    const welcomeMessage = {
      role: 'assistant',
      content: welcomeContent,
      timestamp: new Date(),
      currentPhase: 1,
      messageType: 'experience_mapping_intro',
    };

    setMessages([welcomeMessage]);
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const currentPhase = sessionProgress?.phase || 1;

    const userMessage = {
      role: 'user',
      content: userInput.trim(),
      timestamp: new Date(),
      currentPhase: currentPhase
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await huxleyService.chat(userInput.trim());

      const assistantMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        currentPhase: response.sessionProgress?.phase || currentPhase,
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);

      // Update session progress from handler
      if (response.sessionProgress) {
        setSessionProgress(response.sessionProgress);
      }

      await saveMessages(updatedMessages);

    } catch (error) {
      console.error('Error sending message:', error);

      // Enhanced error handling with network diagnostics
      let errorContent = "I'm here with you. Take a moment to breathe.";
      let showNetworkTest = false;

      if (error.message && error.message.includes('Network request failed')) {
        errorContent = `I'm experiencing connectivity issues right now. This appears to be a network problem rather than anything you've done.

Would you like me to run a network diagnostic to help identify the issue?`;
        showNetworkTest = true;
      } else if (error.message && error.message.includes('API request failed')) {
        errorContent = `I'm having trouble connecting to my AI service right now. This is a temporary technical issue.

You can continue documenting your experience, and I'll be back online soon.`;
        showNetworkTest = true;
      }

      const errorMessage = {
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
        isError: true,
        showNetworkTest: showNetworkTest
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // (dismissPaperReminder moved up before early returns)

  const renderInlineProgress = () => {
    const currentPhase = sessionProgress?.phase || 1;
    const phaseNames = ['Gathering', 'Dynamics', 'Interpretation', 'Ritual'];

    return (
      <View style={styles.inlineProgress}>
        {phaseNames.map((name, i) => {
          const num = i + 1;
          const isComplete = num < currentPhase;
          const isCurrent = num === currentPhase;
          return (
            <React.Fragment key={num}>
              {i > 0 && (
                <View style={[
                  styles.progressLine,
                  isComplete && styles.progressLineComplete,
                ]} />
              )}
              <View style={[
                styles.progressDot,
                isComplete && styles.progressDotComplete,
                isCurrent && styles.progressDotCurrent,
              ]}>
                <Text style={[
                  styles.progressDotText,
                  (isComplete || isCurrent) && styles.progressDotTextActive,
                ]}>{num}</Text>
              </View>
            </React.Fragment>
          );
        })}
        <Text style={styles.progressLabel}>
          {phaseNames[currentPhase - 1] || 'Gathering'}
        </Text>
      </View>
    );
  };

  const renderMessages = () => {
    return messages.map((message, index) => (
      <View
        key={index}
        style={[
          styles.messageRow,
          message.role === 'user' ? styles.userRow : styles.assistantRow
        ]}
      >
        {message.role === 'assistant' && (
          <Image
            source={require('../assets/images/huxley-avatar.png')}
            style={styles.huxleyAvatar}
            resizeMode="contain"
          />
        )}
        <View
          style={[
            styles.messageBubble,
            message.role === 'user' ? styles.userBubble : styles.assistantBubble
          ]}
        >
        <FormattedText style={[
          styles.messageText,
          message.role === 'user' ? styles.userText : styles.assistantText
        ]}>
          {message.content}
        </FormattedText>

        {/* Show network test button for connectivity errors */}
        {message.showNetworkTest && (
          <TouchableOpacity
            style={styles.networkTestButton}
            onPress={() => navigation.navigate('NetworkTest')}
          >
            <Text style={styles.networkTestButtonText}>Run Network Test</Text>
          </TouchableOpacity>
        )}
        </View>
      </View>
    ));
  };

  const renderInput = () => {
    const currentPhase = sessionProgress?.phase || 1;

    return (
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={userInput}
          onChangeText={setUserInput}
          placeholder={(() => {
            switch(currentPhase) {
              case 1: return "Share what you experienced - and write it down on your paper...";
              case 2: return "How did different elements relate to each other?";
              case 3: return "What meaning do these experiences hold for your life?";
              case 4: return "What practices would help you integrate these insights?";
              default: return "Share your thoughts about the experience...";
            }
          })()}
          multiline
          maxLength={1500}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!userInput.trim() || isLoading) && styles.sendButtonDisabled
          ]}
          onPress={handleSendMessage}
          disabled={!userInput.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.sendButtonText}>→</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient colors={gradients.standard} start={{ x: 1.0, y: 0.0 }} end={{ x: 0.0, y: 1.0 }} style={{ flex: 1 }}>
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header with inline progress */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        {renderInlineProgress()}
        <TouchableOpacity onPress={() => navigation.navigate('TherapeuticIntegration', { session })} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.switchText}>Integration →</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
      >
        {renderMessages()}

        {isLoading && (
          <View style={styles.typingIndicator}>
            <Image
              source={require('../assets/images/huxley-avatar.png')}
              style={styles.huxleyAvatar}
              resizeMode="contain"
            />
            <Text style={styles.typingText}>Processing your experience...</Text>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
        style={{ flexShrink: 0 }}
      >
        {renderInput()}
      </KeyboardAvoidingView>

      {/* Paper reminder toast */}
      {showPaperReminder && (sessionProgress?.phase || 1) === 1 && (
        <Animated.View style={[styles.paperToast, { opacity: paperReminderOpacity }]}>
          <Text style={styles.paperToastText}>Have paper & pen nearby to anchor memories</Text>
          <TouchableOpacity onPress={dismissPaperReminder} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.paperToastDismiss}>✕</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
    </LinearGradient>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  backButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '600',
  },
  switchText: {
    fontSize: 12,
    color: colors.success,
  },
  inlineProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  progressDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f3f4f6',
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotComplete: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  progressDotCurrent: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  progressDotText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textLight,
  },
  progressDotTextActive: {
    color: '#fff',
  },
  progressLine: {
    width: 12,
    height: 2,
    backgroundColor: '#d1d5db',
  },
  progressLineComplete: {
    backgroundColor: colors.success,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 8,
    fontWeight: '500',
  },
  paperToast: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bubbleArchetypal,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  paperToastText: {
    fontSize: 13,
    color: '#92400e',
    fontWeight: '500',
    flex: 1,
  },
  paperToastDismiss: {
    fontSize: 16,
    color: '#92400e',
    paddingLeft: 12,
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  huxleyAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 8,
    marginBottom: 2,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  userBubble: {
    maxWidth: '80%',
    backgroundColor: colors.primary,
  },
  assistantBubble: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: colors.textInverse,
  },
  assistantText: {
    color: colors.text,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  typingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    alignItems: 'flex-end',
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 120,
    backgroundColor: colors.surface,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  sendButtonText: {
    fontSize: 20,
    color: colors.textInverse,
    fontWeight: 'bold',
  },
  networkTestButton: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  networkTestButtonText: {
    fontSize: 12,
    color: colors.textInverse,
    fontWeight: '500',
  },
};

export default ExperienceMappingScreen;