import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../theme/colors';
import { supabase } from '../lib/supabase';
import huxleyService from '../lib/huxleyService';
import { ChatConversation } from '../components/chat';

const ExperienceMappingScreen = ({ navigation, route }) => {
  const sessionParam = route?.params?.session || null;

  const [session, setSession] = useState(sessionParam);
  const [creatingSession, setCreatingSession] = useState(!sessionParam);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionProgress, setSessionProgress] = useState(null);
  const [showPaperReminder, setShowPaperReminder] = useState(true);

  const paperReminderOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!sessionParam) {
      createNewSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (session && session.id && !creatingSession) {
      initializeConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, creatingSession]);

  const dismissPaperReminder = () => {
    Animated.timing(paperReminderOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowPaperReminder(false));
  };

  useEffect(() => {
    if (showPaperReminder) {
      const timer = setTimeout(dismissPaperReminder, 8000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <LinearGradient
        colors={gradients.standard}
        start={gradients.standardStart}
        end={gradients.standardEnd}
        style={styles.container}
      >
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.errorText, { marginTop: 16 }]}>
            Setting up your session...
          </Text>
        </View>
      </LinearGradient>
    );
  }

  if (!session || !session.id) {
    return (
      <LinearGradient
        colors={gradients.standard}
        start={gradients.standardStart}
        end={gradients.standardEnd}
        style={styles.container}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Session Error</Text>
          <Text style={styles.errorText}>
            No session data available. Please go back and start a new
            experience processing session.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const initializeConversation = async () => {
    try {
      const hasExistingMessages = await loadMessages();
      if (!hasExistingMessages) {
        setTimeout(() => initiateExperienceMapping(), 1000);
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
    }
  };

  const loadMessages = async () => {
    try {
      if (session.id && session.id.startsWith('temp_')) {
        const sessionData = session.session_data || {};
        const loadedMessages = sessionData.messages || [];
        setMessages(loadedMessages);
        const handler = huxleyService.getModeHandler();
        if (handler && handler.initializeWithContext) {
          handler.initializeWithContext(sessionData.experienceData || {});
        }
        return loadedMessages.length > 0;
      }

      const { data, error } = await supabase
        .from('sessions')
        .select('session_data')
        .eq('id', session.id)
        .single();

      if (error) throw error;

      const sessionData = data?.session_data || {};
      const loadedMessages = sessionData.messages || [];
      setMessages(loadedMessages);

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
        ...additionalData,
      };

      if (session.id && !session.id.startsWith('temp_')) {
        try {
          const { error } = await supabase
            .from('sessions')
            .update({ session_data: sessionData })
            .eq('id', session.id);
          if (error) {
            console.error('Database save failed:', error);
          }
        } catch (dbError) {
          console.error('Database unavailable:', dbError);
        }
      }
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  const initiateExperienceMapping = () => {
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

    setMessages([
      {
        role: 'assistant',
        content: welcomeContent,
        timestamp: new Date(),
        currentPhase: 1,
        messageType: 'experience_mapping_intro',
      },
    ]);
  };

  const handleSendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const currentPhase = sessionProgress?.phase || 1;

    const userMessage = {
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
      currentPhase,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await huxleyService.chat(trimmed);

      const assistantMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        currentPhase: response.sessionProgress?.phase || currentPhase,
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);

      if (response.sessionProgress) {
        setSessionProgress(response.sessionProgress);
      }

      await saveMessages(updatedMessages);
    } catch (error) {
      console.error('Error sending message:', error);

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

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: errorContent,
          timestamp: new Date(),
          isError: true,
          showNetworkTest,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Adapt {role, content, ...extras} → ChatConversation message shape, generating
  // stable-ish ids since the original messages don't carry them.
  const toChatMessages = (msgs) =>
    msgs.map((m, i) => ({
      id: m.timestamp ? `${i}-${new Date(m.timestamp).getTime()}` : `${i}`,
      role: m.role,
      content: m.content,
      // pass-through fields used by renderMessageExtras
      showNetworkTest: m.showNetworkTest,
    }));

  const currentPhase = sessionProgress?.phase || 1;

  const phasePlaceholder = (() => {
    switch (currentPhase) {
      case 1: return 'Share what you experienced - and write it down on your paper...';
      case 2: return 'How did different elements relate to each other?';
      case 3: return 'What meaning do these experiences hold for your life?';
      case 4: return 'What practices would help you integrate these insights?';
      default: return 'Share your thoughts about the experience...';
    }
  })();

  const renderHeader = () => {
    const phaseNames = ['Gathering', 'Dynamics', 'Interpretation', 'Ritual'];

    return (
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <View style={styles.inlineProgress}>
          {phaseNames.map((name, i) => {
            const num = i + 1;
            const isComplete = num < currentPhase;
            const isCurrent = num === currentPhase;
            return (
              <React.Fragment key={num}>
                {i > 0 && (
                  <View
                    style={[
                      styles.progressLine,
                      isComplete && styles.progressLineComplete,
                    ]}
                  />
                )}
                <View
                  style={[
                    styles.progressDot,
                    isComplete && styles.progressDotComplete,
                    isCurrent && styles.progressDotCurrent,
                  ]}
                >
                  <Text
                    style={[
                      styles.progressDotText,
                      (isComplete || isCurrent) && styles.progressDotTextActive,
                    ]}
                  >
                    {num}
                  </Text>
                </View>
              </React.Fragment>
            );
          })}
          <Text style={styles.progressLabel}>
            {phaseNames[currentPhase - 1] || 'Gathering'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('TherapeuticIntegration', { session })}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.switchText}>Integration →</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Network-test button rendered inside the bubble for error messages
  // that flagged showNetworkTest.
  const renderMessageExtras = (message) => {
    if (!message.showNetworkTest) return null;
    return (
      <TouchableOpacity
        style={styles.networkTestButton}
        onPress={() => navigation.navigate('NetworkTest')}
      >
        <Text style={styles.networkTestButtonText}>Run Network Test</Text>
      </TouchableOpacity>
    );
  };

  // Paper reminder toast — only on phase 1, auto-dismisses after 8s.
  // Sits absolutely positioned above the input via the `toast` slot.
  const renderToast = () => {
    if (!showPaperReminder || currentPhase !== 1) return null;
    return (
      <Animated.View style={[styles.paperToast, { opacity: paperReminderOpacity }]}>
        <Text style={styles.paperToastText}>
          Have paper & pen nearby to anchor memories
        </Text>
        <TouchableOpacity
          onPress={dismissPaperReminder}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.paperToastDismiss}>✕</Text>
        </TouchableOpacity>
      </Animated.View>
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
          isTyping={isLoading}
          onSend={handleSendMessage}
          inputText={userInput}
          onInputTextChange={setUserInput}
          inputPlaceholder={phasePlaceholder}
          inputDisabled={isLoading}
          header={renderHeader()}
          toast={renderToast()}
          renderMessageExtras={renderMessageExtras}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
    color: colors.text,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  backButton: {
    backgroundColor: colors.primary,
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
  },
  backText: {
    fontSize: 22,
    color: colors.primary,
    fontWeight: '600',
  },
  switchText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
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
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
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
    color: colors.text,
  },
  progressDotTextActive: {
    color: '#fff',
  },
  progressLine: {
    width: 12,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  progressLineComplete: {
    backgroundColor: colors.success,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.text,
    marginLeft: 8,
    fontWeight: '600',
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
  networkTestButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  networkTestButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
};

export default ExperienceMappingScreen;
