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
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme/colors';
import { supabase } from '../lib/supabase';
import huxleyService from '../lib/huxleyService';
import EmbeddedPracticeWidget from '../enhanced-components/EmbeddedPracticeWidget';
import FormattedText from '../components/FormattedText';

const TherapeuticIntegrationScreen = ({ navigation, route }) => {
  console.log('TherapeuticIntegrationScreen route params:', route.params);

  const insets = useSafeAreaInsets();
  const sessionParam = route?.params?.session || null;

  // Core conversation state
  const [session, setSession] = useState(sessionParam);
  const [creatingSession, setCreatingSession] = useState(!sessionParam);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [entities, setEntities] = useState([]);

  // Therapeutic features state
  const [currentPractice, setCurrentPractice] = useState(null);
  const [nervousSystemState, setNervousSystemState] = useState('unknown');
  const [stateConfidence, setStateConfidence] = useState(0);
  const [interventionsFocused, setInterventionsFocused] = useState([]);

  // Session tracking
  const [practicesCompleted, setPracticesCompleted] = useState([]);
  const [regulationInterventions, setRegulationInterventions] = useState(0);

  // Refs and animations
  const scrollViewRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Unified AI service (singleton, no need for useRef)

  // Auto-create session if none provided
  useEffect(() => {
    if (!sessionParam) {
      createNewSession();
    }
  }, []);

  // Initialize conversation once session is ready
  useEffect(() => {
    if (session && session.id && !creatingSession) {
      initializeConversation();
      startHeartbeatAnimation();
    }
  }, [session, creatingSession]);

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
          title: `Therapeutic Integration - ${new Date().toLocaleDateString()}`,
          journey_date: new Date().toISOString().split('T')[0],
          current_step: 1,
          session_data: {
            sessionType: 'therapeutic_integration',
            conversationMode: 'therapeuticIntegration',
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
        start={{ x: 1.0, y: 0.0 }}
        end={{ x: 0.0, y: 1.0 }}
        style={{ flex: 1 }}
      >
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.errorText, { marginTop: 16 }]}>Setting up your session...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!session || !session.id) {
    return (
      <LinearGradient
        colors={gradients.standard}
        start={{ x: 1.0, y: 0.0 }}
        end={{ x: 0.0, y: 1.0 }}
        style={{ flex: 1 }}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Session Error</Text>
          <Text style={styles.errorText}>
            No session data available. Please go back and start a new integration session.
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

  const startHeartbeatAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const initializeConversation = async () => {
    try {
      const hasExistingMessages = await loadMessages();
      
      if (!hasExistingMessages) {
        setTimeout(() => {
          initiateTherapeuticIntegration();
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
        const loadedEntities = sessionData.entities || [];
        const loadedState = sessionData.nervousSystemState || 'unknown';
        const loadedPractices = sessionData.practicesCompleted || [];
        const loadedInterventions = sessionData.interventionsFocused || [];
        
        setMessages(loadedMessages);
        setEntities(loadedEntities);
        setNervousSystemState(loadedState);
        setPracticesCompleted(loadedPractices);
        setInterventionsFocused(loadedInterventions);
        
        // Initialize huxleyService mode
        huxleyService.setMode('therapeutic_integration', { clearHistory: true });

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
      const loadedState = sessionData.nervousSystemState || 'unknown';
      const loadedPractices = sessionData.practicesCompleted || [];
      const loadedInterventions = sessionData.interventionsFocused || [];
      
      console.log('Loading therapeutic integration data:', {
        sessionId: session.id,
        messageCount: loadedMessages.length,
        entityCount: loadedEntities.length,
        nervousSystemState: loadedState,
        practicesCompleted: loadedPractices.length
      });
      
      setMessages(loadedMessages);
      setEntities(loadedEntities);
      setNervousSystemState(loadedState);
      setPracticesCompleted(loadedPractices);
      setInterventionsFocused(loadedInterventions);
      
      // Initialize huxleyService mode
      huxleyService.setMode('therapeutic_integration', { clearHistory: true });

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
        nervousSystemState: nervousSystemState,
        stateConfidence: stateConfidence,
        practicesCompleted: practicesCompleted,
        regulationInterventions: regulationInterventions,
        interventionsFocused: interventionsFocused,
        sessionType: 'integration',
        conversationMode: 'therapeutic_integration',
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

  const initiateTherapeuticIntegration = () => {
    const welcomeMessage = {
      role: 'assistant',
      content: `Welcome to **Therapeutic Integration**! 

I'm here to help you connect insights from your psychedelic experiences to your life patterns and apply specific therapeutic interventions when needed.

My focus is on:
🧠 **Life Pattern Connections** - How your insights relate to current challenges
💆 **Polyvagal Mapping** - Understanding your nervous system responses
🤝 **Parts Work (IFS)** - Exploring different aspects of yourself
🌱 **Somatic Practices** - Reconnecting with your body's wisdom
💝 **Self-Compassion** - Healing shame and inner criticism

Before we dive in, let's check in with your nervous system. How is your body feeling right in this moment?`,
      timestamp: new Date(),
      messageType: 'therapeutic_integration_intro',
      requiresPractice: {
        type: 'polyvagal_assessment',
        priority: 'high',
        reason: 'session_initialization'
      }
    };

    setMessages([welcomeMessage]);
    
    // Automatically show nervous system check-in
    setTimeout(() => {
      setCurrentPractice({
        type: 'polyvagal_assessment',
        title: "Let's check in with your nervous system",
        description: "This helps me understand how to best support you therapeutically",
        onComplete: handleNervousSystemAssessment
      });
    }, 2000);
  };

  const handleNervousSystemAssessment = async (assessmentResult) => {
    const { state, intensity, notes } = assessmentResult;
    
    setNervousSystemState(state);
    setStateConfidence(intensity / 10);
    setCurrentPractice(null);
    
    // Update regulation interventions if needed
    if (state === 'sympathetic' && intensity > 6) {
      setRegulationInterventions(prev => prev + 1);
    }
    
    // Generate therapeutic response based on assessment via huxleyService
    const contextualResponse = await huxleyService.chat(
      `Nervous system check-in: state=${state}, intensity=${intensity}${notes ? ', notes: ' + notes : ''}`,
    );

    const suggestedPractice = contextualResponse.exerciseRecommendation || contextualResponse.therapeuticData?.suggestedPractice || null;

    const responseMessage = {
      role: 'assistant',
      content: contextualResponse.message,
      timestamp: new Date(),
      nervousSystemContext: { state, intensity, notes },
      requiresPractice: suggestedPractice
    };
    
    const updatedMessages = [...messages, responseMessage];
    setMessages(updatedMessages);
    
    // Auto-suggest regulation if needed
    if (suggestedPractice && suggestedPractice.urgency === 'high') {
      setTimeout(() => {
        setCurrentPractice({
          ...suggestedPractice,
          onComplete: handlePracticeComplete
        });
      }, 3000);
    }
    
    await saveMessages(updatedMessages, { 
      nervousSystemState: state,
      stateConfidence: intensity / 10 
    });
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: userInput.trim(),
      timestamp: new Date(),
      nervousSystemState: nervousSystemState
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      // Get therapeutic integration response via huxleyService
      const response = await huxleyService.chat(userInput.trim());

      const extractedEntities = response.therapeuticData?.extractedEntities || [];
      const suggestedPractice = response.exerciseRecommendation || response.therapeuticData?.suggestedPractice || null;
      const nervousSystemUpdate = response.therapeuticData?.nervousSystemUpdate || null;
      const therapeuticThemes = response.therapeuticData?.therapeuticThemes || [];

      const assistantMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        entities: extractedEntities,
        requiresPractice: suggestedPractice,
        nervousSystemUpdate: nervousSystemUpdate,
        therapeuticThemes: therapeuticThemes
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);

      // Update entities if new ones were extracted
      if (extractedEntities.length > 0) {
        const updatedEntities = [...entities, ...extractedEntities];
        setEntities(updatedEntities);
      }

      // Update nervous system state if changed
      if (nervousSystemUpdate) {
        setNervousSystemState(nervousSystemUpdate.state);
        setStateConfidence(nervousSystemUpdate.confidence);
      }

      // Track therapeutic interventions focused on
      if (therapeuticThemes.length > 0) {
        setInterventionsFocused(prev => [...prev, ...therapeuticThemes]);
      }

      // Show practice if recommended
      if (suggestedPractice && suggestedPractice.urgency !== 'low') {
        setTimeout(() => {
          setCurrentPractice({
            ...suggestedPractice,
            onComplete: handlePracticeComplete
          });
        }, 2000);
      }

      await saveMessages(updatedMessages);

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = {
        role: 'assistant',
        content: "I'm here with you. Take a moment to breathe. Would you like to try sharing that again?",
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePracticeComplete = async (practiceResult) => {
    const { practiceType, outcome, duration, effectiveness } = practiceResult;
    
    const completedPractice = {
      type: practiceType,
      completedAt: new Date().toISOString(),
      duration: duration,
      effectiveness: effectiveness,
      outcome: outcome
    };
    
    setPracticesCompleted(prev => [...prev, completedPractice]);
    setCurrentPractice(null);

    // Generate follow-up response via huxleyService
    const followUpResponse = await huxleyService.chat(
      `I just completed a ${completedPractice.type} practice. Duration: ${completedPractice.duration}s. Effectiveness: ${completedPractice.effectiveness}/10. Outcome: ${completedPractice.outcome}`
    );

    const followUpMessage = {
      role: 'assistant',
      content: followUpResponse.message,
      timestamp: new Date(),
      practiceFollowUp: true,
      requiresPractice: followUpResponse.exerciseRecommendation || followUpResponse.therapeuticData?.suggestedPractice || null
    };

    const updatedMessages = [...messages, followUpMessage];
    setMessages(updatedMessages);
    
    await saveMessages(updatedMessages, { 
      practicesCompleted: [...practicesCompleted, completedPractice] 
    });
  };

  const renderNervousSystemHeader = () => {
    const getStateEmoji = () => {
      switch (nervousSystemState) {
        case 'ventral': return '💚';
        case 'sympathetic': return '⚡';
        case 'dorsal': return '🛡️';
        default: return '🧠';
      }
    };

    const getStateLabel = () => {
      switch (nervousSystemState) {
        case 'ventral': return 'Safe & Social';
        case 'sympathetic': return 'Activated';
        case 'dorsal': return 'Protected';
        default: return 'Checking in...';
      }
    };

    return (
      <View style={styles.nervousSystemHeader}>
        <View style={styles.nervousSystemIndicator}>
          <Animated.Text 
            style={[
              styles.stateEmoji,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            {getStateEmoji()}
          </Animated.Text>
          <Text style={styles.stateLabel}>
            {getStateLabel()}
          </Text>
        </View>
        
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionPhaseText}>
            Therapeutic Integration
          </Text>
          <Text style={styles.practiceCount}>
            {practicesCompleted.length} practices completed
          </Text>
        </View>
      </View>
    );
  };

  const renderTherapeuticFocus = () => {
    if (interventionsFocused.length === 0) return null;

    return (
      <View style={styles.therapeuticFocusContainer}>
        <Text style={styles.focusTitle}>Therapeutic Focus Areas:</Text>
        <View style={styles.focusChips}>
          {[...new Set(interventionsFocused)].slice(-4).map((intervention, index) => (
            <View key={index} style={styles.focusChip}>
              <Text style={styles.focusChipText}>{intervention}</Text>
            </View>
          ))}
        </View>
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
        <FormattedText style={[
          styles.messageText,
          message.role === 'user' ? styles.userText : styles.assistantText
        ]}>
          {message.content}
        </FormattedText>

        {/* Show therapeutic themes */}
        {message.therapeuticThemes && message.therapeuticThemes.length > 0 && (
          <View style={styles.therapeuticThemesContainer}>
            {message.therapeuticThemes.map((theme, themeIndex) => (
              <View key={themeIndex} style={styles.therapeuticThemeChip}>
                <Text style={styles.therapeuticThemeText}>{theme}</Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Show extracted entities */}
        {message.entities && message.entities.length > 0 && (
          <View style={styles.entitiesContainer}>
            {message.entities.map((entity, entityIndex) => (
              <View key={entityIndex} style={styles.entityChip}>
                <Text style={styles.entityText}>{entity.name}</Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Show nervous system context */}
        {message.nervousSystemContext && (
          <View style={styles.contextIndicator}>
            <Text style={styles.contextText}>
              State: {message.nervousSystemContext.state} ({message.nervousSystemContext.intensity}/10)
            </Text>
          </View>
        )}
        
        {/* Show practice suggestion */}
        {message.requiresPractice && (
          <TouchableOpacity
            style={styles.practiceIndicator}
            onPress={() => {
              if (message.requiresPractice.urgency === 'low') {
                setCurrentPractice({
                  ...message.requiresPractice,
                  onComplete: handlePracticeComplete
                });
              }
            }}
          >
            <Text style={styles.practiceText}>
              {message.requiresPractice.urgency === 'high' 
                ? '🔄 Practice will appear shortly...' 
                : '💆 Tap for practice: ' + (message.requiresPractice.title || 'Practice available')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    ));
  };

  const renderInput = () => {
    if (currentPractice) {
      return (
        <View style={styles.practiceIndicatorBottom}>
          <Text style={styles.practiceIndicatorText}>
            🧘 Practice in progress: {currentPractice.title}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={userInput}
          onChangeText={setUserInput}
          placeholder={(() => {
            switch(nervousSystemState) {
              case 'sympathetic': return "Take your time... what's present for you?";
              case 'dorsal': return "No pressure... share whatever feels safe";
              default: return "What insights would you like to explore therapeutically?";
            }
          })()}
          multiline
          maxLength={1000}
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
    <LinearGradient
      colors={gradients.standard}
      start={{ x: 1.0, y: 0.0 }}
      end={{ x: 0.0, y: 1.0 }}
      style={{ flex: 1 }}
    >
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Therapeutic Integration</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ExperienceMapping', { session })}>
          <Text style={styles.switchText}>← Switch to Mapping</Text>
        </TouchableOpacity>
      </View>
      
      {/* Nervous System Header */}
      {renderNervousSystemHeader()}
      
      {/* Therapeutic Focus Areas */}
      {renderTherapeuticFocus()}
      
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
            <Text style={styles.typingText}>Considering therapeutic connections...</Text>
            <ActivityIndicator size="small" color="#3b82f6" />
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

      {/* Embedded Practice Widget */}
      {currentPractice && (
        <EmbeddedPracticeWidget
          practice={currentPractice}
          nervousSystemState={nervousSystemState}
          onComplete={handlePracticeComplete}
          onSkip={() => setCurrentPractice(null)}
        />
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
  nervousSystemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  nervousSystemIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stateEmoji: {
    fontSize: 20,
  },
  stateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  sessionInfo: {
    alignItems: 'flex-end',
  },
  sessionPhaseText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  practiceCount: {
    fontSize: 11,
    color: '#9ca3af',
  },
  therapeuticFocusContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  focusTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  focusChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  focusChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
  },
  focusChipText: {
    fontSize: 10,
    color: '#92400e',
    fontWeight: '500',
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
  therapeuticThemesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  therapeuticThemeChip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: '#dcfce7',
    borderRadius: 8,
  },
  therapeuticThemeText: {
    fontSize: 10,
    color: '#166534',
    fontWeight: '500',
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
  contextIndicator: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  contextText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  practiceIndicator: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(212, 114, 92, 0.1)',
    borderRadius: 8,
  },
  practiceText: {
    fontSize: 12,
    color: colors.primary,
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
  practiceIndicatorBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#eff6ff',
    borderTopWidth: 1,
    borderTopColor: '#dbeafe',
  },
  practiceIndicatorText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
};

export default TherapeuticIntegrationScreen;