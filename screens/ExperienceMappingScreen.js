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
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import ExperienceMappingService from '../lib/experienceMappingService';

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
  const [entities, setEntities] = useState([]);

  // Auto-create session if none provided
  useEffect(() => {
    if (!sessionParam) {
      createNewSession();
    }
  }, []);

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
  
  // Experience processing state
  const [experienceData, setExperienceData] = useState({
    associations: [],
    dynamics: [],
    integrations: [],
    rituals: [],
    currentPhase: 1
  });

  // Onboarding state - removed, now using AI for everything
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);
  
  // Refs
  const scrollViewRef = useRef(null);
  
  // Experience Mapping Service
  const experienceMapper = useRef(new ExperienceMappingService()).current;

  // Initialize conversation
  useEffect(() => {
    initializeConversation();
  }, []);

  const initializeConversation = async () => {
    try {
      const hasExistingMessages = await loadMessages();

      // Check if user has done experience processing before
      await checkUserHistory();

      if (!hasExistingMessages) {
        setTimeout(() => {
          initiateExperienceMapping();
        }, 1000);
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
    }
  };

  const checkUserHistory = async () => {
    try {
      // Query for previous experience processing sessions
      const { data, error } = await supabase
        .from('sessions')
        .select('id, session_data')
        .eq('session_type', 'experience')
        .not('session_data->experienceData', 'is', null)
        .limit(1);

      if (!error && data && data.length > 0) {
        setIsReturningUser(true);
        console.log('Returning user detected - will use shorter onboarding');
      }
    } catch (error) {
      console.log('Could not check user history (offline?):', error);
      // Assume new user if we can't check
      setIsReturningUser(false);
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
        const loadedEntities = sessionData.entities || [];
        const loadedExperienceData = sessionData.experienceData || {
        associations: [],
        dynamics: [],
        integrations: [],
        rituals: [],
        currentPhase: 1
        };
        
        setMessages(loadedMessages);
        setEntities(loadedEntities);
        setExperienceData(loadedExperienceData);
        
        // Initialize service with context
        experienceMapper.initializeSession({
          sessionId: session.id,
          messages: loadedMessages,
          entities: loadedEntities,
          experienceData: loadedExperienceData
        });
        
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
      const loadedEntities = sessionData.entities || [];
      const loadedExperienceData = sessionData.experienceData || {
        associations: [],
        dynamics: [],
        integrations: [],
        rituals: [],
        currentPhase: 1
      };
      
      console.log('Loading experience mapping data:', {
      sessionId: session.id,
      messageCount: loadedMessages.length,
      entityCount: loadedEntities.length,
      currentPhase: loadedExperienceData.currentPhase
      });
      
      setMessages(loadedMessages);
      setEntities(loadedEntities);
      setExperienceData(loadedExperienceData);
      
      // Initialize service with context
      experienceMapper.initializeSession({
        sessionId: session.id,
        messages: loadedMessages,
        entities: loadedEntities,
        experienceData: loadedExperienceData
      });
      
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
        entities: entities,
        experienceData: experienceData,
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
        entityCount: sessionData.entities?.length || 0
      });
      // TODO: Implement AsyncStorage.setItem(session.id, JSON.stringify(sessionData))
    } catch (error) {
      console.error('Local storage save failed:', error);
    }
  };

  const initiateExperienceMapping = () => {
    let welcomeContent = '';

    if (isReturningUser) {
      // Shorter welcome for returning users
      welcomeContent = `Welcome back to **Experience Processing**!

Ready to explore another journey? Let's dive right in.

**What are the first images or experiences that come to mind from your recent journey?**`;
    } else {
      // Full welcome for new users
      welcomeContent = `Welcome to **Experience Processing**!

I'm here to help you systematically explore and document your psychedelic experience.

**Before we begin:** Do you have paper and pen nearby? Writing things down helps anchor the memories.

We'll work through 4 phases:
📝 **Gathering Details** - Capturing symbols, sensations, emotions
🔗 **Exploring Connections** - Mapping relationships
💡 **Finding Meaning** - Life connections
🎯 **Creating Practices** - Integration methods

**Let's start:** What are the first images or experiences that come to mind from your journey?`;
    }

    const welcomeMessage = {
      role: 'assistant',
      content: welcomeContent,
      timestamp: new Date(),
      currentPhase: 1,
      messageType: 'experience_mapping_intro',
      isOnboarding: true,
      systemContext: {
        isReturningUser: isReturningUser,
        onboardingMode: true
      }
    };

    setMessages([welcomeMessage]);

    // Initialize the experience mapper with onboarding context
    experienceMapper.initializeSession({
      sessionId: session.id,
      messages: [welcomeMessage],
      entities: [],
      experienceData: experienceData,
      isReturningUser: isReturningUser,
      onboardingActive: true
    });
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: userInput.trim(),
      timestamp: new Date(),
      currentPhase: experienceData.currentPhase
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      // Get AI-powered experience mapping response
      // The AI will handle onboarding responses naturally
      const response = await experienceMapper.continueExperienceMapping(
        userInput.trim(),
        {
          messages: newMessages,
          entities: entities,
          experienceData: experienceData,
          isReturningUser: isReturningUser,
          isOnboarding: messages.length <= 3 // First few exchanges might still be onboarding
        }
      );

      const assistantMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        entities: response.extractedEntities || [],
        currentPhase: response.currentPhase,
        experienceUpdate: response.experienceUpdate
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);

      // Update entities if new ones were extracted
      if (response.extractedEntities && response.extractedEntities.length > 0) {
        const updatedEntities = [...entities, ...response.extractedEntities];
        setEntities(updatedEntities);
      }

      // Update experience data if new information was gathered
      if (response.experienceUpdate) {
        setExperienceData(prev => ({
          ...prev,
          ...response.experienceUpdate
        }));
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

  // Dev helper: Jump to phase for testing
  const jumpToPhase = (phaseNumber) => {
    if (__DEV__) {  // Only in development mode
      Alert.alert(
        'Dev Mode: Jump to Phase',
        `Jump to Phase ${phaseNumber}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Jump',
            onPress: () => {
              setExperienceData(prev => ({
                ...prev,
                currentPhase: phaseNumber
              }));
              console.log(`🔧 DEV: Jumped to Phase ${phaseNumber}`);
            }
          }
        ]
      );
    }
  };

  const renderProcessingProgress = () => {
    const phases = [
      { number: 1, name: 'Gathering', complete: experienceData.gatheredElements?.length > 0 },
      { number: 2, name: 'Associations', complete: experienceData.associations?.length > 0 },
      { number: 3, name: 'Connections', complete: experienceData.dynamics?.length > 0 },
      { number: 4, name: 'Meaning', complete: experienceData.integrations?.length > 0 },
      { number: 5, name: 'Practices', complete: experienceData.rituals?.length > 0 }
    ];

    return (
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>Experience Processing:</Text>
        <View style={styles.phaseIndicators}>
          {phases.map((phase) => (
            <TouchableOpacity
              key={phase.number}
              style={styles.phaseIndicator}
              onLongPress={() => jumpToPhase(phase.number)}
              delayLongPress={1000}
            >
              <View style={[
                styles.phaseCircle,
                phase.complete && styles.phaseCircleComplete,
                experienceData.currentPhase === phase.number && styles.phaseCircleCurrent
              ]}>
                <Text style={[
                  styles.phaseNumber,
                  phase.complete && styles.phaseNumberComplete
                ]}>
                  {phase.number}
                </Text>
              </View>
              <Text style={styles.phaseName}>{phase.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Phase Summary */}
        <View style={styles.phaseSummary}>
          <Text style={styles.phaseSummaryText}>
            Current: Phase {experienceData.currentPhase} - {(() => {
              switch(experienceData.currentPhase) {
                case 1: return 'Gathering elements from your experience';
                case 2: return 'Making associations to each element';
                case 3: return 'Exploring connections and patterns';
                case 4: return 'Finding meaning and life connections';
                case 5: return 'Creating integration practices';
                default: return 'Processing experience';
              }
            })()}
          </Text>
        </View>

        {/* Phase 1 Paper Reminder */}
        {experienceData.currentPhase === 1 && (
          <View style={styles.paperReminder}>
            <Text style={styles.paperReminderText}>
              📝 Remember: Write each element on your paper as we talk
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderMessages = () => {
    return messages.map((message, index) => (
      <View
        key={index}
        style={[
          styles.messageBubble,
          message.role === 'user' ? styles.userBubble : styles.assistantBubble
        ]}
      >
        <Text style={[
          styles.messageText,
          message.role === 'user' ? styles.userText : styles.assistantText
        ]}>
          {message.content}
        </Text>
        
        {/* Show current phase indicator */}
        {message.currentPhase > 0 && (
          <View style={styles.phaseStepIndicator}>
            <Text style={styles.phaseStepText}>
              Phase {message.currentPhase}: {(() => {
                switch(message.currentPhase) {
                  case 1: return 'Gathering Details';
                  case 2: return 'Exploring Connections';
                  case 3: return 'Finding Meaning';
                  case 4: return 'Creating Practices';
                  default: return 'Processing';
                }
              })()}
            </Text>
          </View>
        )}
        
        {/* Show extracted entities - only in Phase 2+ */}
        {message.entities && message.entities.length > 0 && experienceData.currentPhase >= 2 && (
          <View style={styles.entitiesContainer}>
            {message.entities.map((entity, entityIndex) => (
              <View key={entityIndex} style={styles.entityChip}>
                <Text style={styles.entityText}>{entity.name}</Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Show network test button for connectivity errors */}
        {message.showNetworkTest && (
          <TouchableOpacity
            style={styles.networkTestButton}
            onPress={() => navigation.navigate('NetworkTest')}
          >
            <Text style={styles.networkTestButtonText}>🔍 Run Network Test</Text>
          </TouchableOpacity>
        )}
      </View>
    ));
  };

  const renderInput = () => {
    return (
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={userInput}
          onChangeText={setUserInput}
          placeholder={(() => {
            switch(experienceData.currentPhase) {
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
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Experience Processing</Text>
        <TouchableOpacity onPress={() => navigation.navigate('TherapeuticIntegration', { session })}>
          <Text style={styles.switchText}>Switch to Integration →</Text>
        </TouchableOpacity>
      </View>
      
      {/* Progress Indicator */}
      {renderProcessingProgress()}
      
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
            <Text style={styles.typingText}>Processing your experience...</Text>
            <ActivityIndicator size="small" color="#3b82f6" />
          </View>
        )}
      </ScrollView>

      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={{ flexShrink: 0 }}
      >
        {renderInput()}
      </KeyboardAvoidingView>
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
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backText: {
    fontSize: 16,
    color: colors.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  switchText: {
    fontSize: 12,
    color: '#10b981',
  },
  progressContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  phaseIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  phaseIndicator: {
    alignItems: 'center',
    flex: 1,
  },
  phaseCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  phaseCircleComplete: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  phaseCircleCurrent: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  phaseNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  phaseNumberComplete: {
    color: colors.textInverse,
  },
  phaseName: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  phaseSummary: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  phaseSummaryText: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  paperReminder: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  paperReminderText: {
    fontSize: 11,
    color: '#92400e',
    textAlign: 'center',
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubble: {
    marginVertical: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    maxWidth: '85%',
  },
  userBubble: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
  },
  assistantBubble: {
    backgroundColor: colors.surface,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
  phaseStepIndicator: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
  },
  phaseStepText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
  },
  entitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  entityChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
  },
  entityText: {
    fontSize: 12,
    color: '#0891b2',
    fontWeight: '500',
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
    borderTopColor: '#e5e7eb',
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
    backgroundColor: '#9ca3af',
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