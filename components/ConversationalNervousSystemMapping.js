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
import { shareNervousSystem } from '../lib/therapistShareService';
import { colors } from '../theme/colors';

/**
 * Conversational Nervous System Mapping
 * AI-guided exploration of polyvagal states, then prompts physical drawing.
 *
 * Context-aware: loads prior patterns, initializes huxleyService with
 * user context, and saves structured results back via polyvagalContextService.
 */
const ConversationalNervousSystemMapping = ({ onComplete, navigation }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [currentState, setCurrentState] = useState('intro');
  const [sessionProgress, setSessionProgress] = useState(null);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const scrollViewRef = useRef(null);
  const insets = useSafeAreaInsets();

  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Track keyboard visibility and scroll to bottom when it opens
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  useEffect(() => {
    initializeMapping();
  }, []);

  const initializeMapping = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        await huxleyService.initialize(user.id);
      }
      huxleyService.setMode('nervous_system_mapping', { clearHistory: true });

      // Load prior patterns to personalize opening
      const priorPatterns = user
        ? await polyvagalContextService.getPatternsForAI(user.id)
        : null;

      const openingText = buildOpeningMessage(priorPatterns);

      setMessages([{
        id: Date.now(),
        text: openingText,
        isAI: true,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('[NS Mapping] Init error:', error);
      huxleyService.setMode('nervous_system_mapping', { clearHistory: true });
      setMessages([{
        id: Date.now(),
        text: "Hi! I'm here to help you map your nervous system. We'll explore three states together and we'll end with your safe, connected state so you leave feeling grounded.\n\nFirst, I'm curious — when you leave that safe, connected place, where do you tend to go? Do you tend to go more toward activation — anxiety, stress, being wired, fight or flight? Or more toward shutdown — numbness, checking out, feeling stuck or collapsed?",
        isAI: true,
        timestamp: new Date()
      }]);
    } finally {
      setInitializing(false);
    }
  };

  const buildOpeningMessage = (patterns) => {
    if (!patterns || !patterns.hasMappedStates) {
      return "Hi! I'm here to help you map your nervous system. We'll explore three states together and we'll end with your safe, connected state so you leave feeling grounded.\n\nFirst, I'm curious — when you leave that safe, connected place, where do you tend to go? Do you tend to go more toward activation — anxiety, stress, being wired, fight or flight? Or more toward shutdown — numbness, checking out, feeling stuck or collapsed?";
    }

    // Returning user — reference what they've mapped before
    const ventral = patterns.ventral?.body_sensations || [];
    const sympathetic = patterns.sympathetic?.body_sensations || [];

    let msg = "Welcome back! I can see you've mapped your nervous system before.";
    if (ventral.length > 0) {
      msg += ` Last time, you noticed sensations like "${ventral.slice(0, 2).join('" and "')}" in your safe state.`;
    }
    msg += "\n\nLet's deepen your map. Has anything shifted since your last mapping? Or would you like to explore a state more thoroughly this time?";

    return msg;
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputText.trim(),
      isAI: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      // Handler controls phase and context automatically
      const response = await huxleyService.chat(inputText.trim());

      const aiMessage = {
        id: Date.now() + 1,
        text: response.message,
        isAI: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Update from mode handler's session progress
      if (response.sessionProgress) {
        setSessionProgress(response.sessionProgress);
        setCurrentState(response.sessionProgress.phase);
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

  const showDrawingGuidance = () => {
    const guidanceMessage = {
      id: Date.now(),
      text: `Here's how to create your body map:

1. Draw a simple outline of a body on your paper (stick figure is fine!)
2. Use different colors for each state:
   • Ventral (safe & connected) - maybe green or blue
   • Sympathetic (activated) - maybe red or orange
   • Dorsal (shutdown) - maybe gray or purple

3. Color or mark where in your body each state lives
4. Add symbols, patterns, or words that represent each state
5. This is YOUR map - there's no right or wrong way!

Take your time with this. When you're done, the app will show you a digital version too.`,
      isAI: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, guidanceMessage]);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleDrawingComplete = async () => {
    Alert.alert(
      'Drawing Complete?',
      'Have you finished creating your body map?',
      [
        {
          text: 'Not yet',
          style: 'cancel'
        },
        {
          text: 'Yes, done!',
          onPress: () => saveMapping()
        }
      ]
    );
  };

  const saveMapping = async () => {
    setSaving(true);

    try {
      if (!currentUser) throw new Error('No user');

      // Get structured data from mode handler
      const handlerSummary = huxleyService.getSessionSummary();
      const mappedStates = handlerSummary?.mappedStates || {};

      // Build mapping data from handler
      const mappingData = {
        ventral: mappedStates.ventral || {},
        sympathetic: mappedStates.sympathetic || {},
        dorsal: mappedStates.dorsal || {},
      };

      // Save via polyvagalContextService (handles upsert + merge with existing)
      await polyvagalContextService.updatePatternsFromMapping(currentUser.id, mappingData);

      Alert.alert(
        'Mapping Saved!',
        'Your nervous system map has been saved.',
        [
          {
            text: 'View Map',
            onPress: () => showDigitalMap(mappingData)
          },
          {
            text: 'Share with Therapist',
            onPress: () => shareNervousSystem({ state_mappings: mappingData, created_at: new Date().toISOString() }).catch(() => {}),
          },
          {
            text: 'Done',
            onPress: () => onComplete?.()
          }
        ]
      );

      huxleyService.setMode('nervous_system_mapping', { clearHistory: true });
    } catch (error) {
      console.error('Error saving mapping:', error);
      Alert.alert('Error', 'Failed to save mapping. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const showDigitalMap = (mappingData) => {
    // This would ideally show a visual body diagram
    // For now, show a text summary
    let summary = "Your Nervous System Map:\n\n";

    if (mappingData.ventral?.body_sensations?.length > 0) {
      summary += "🟢 VENTRAL (Safe & Social):\n";
      summary += `Body: ${mappingData.ventral.body_sensations.join(', ')}\n`;
      summary += `Emotions: ${(mappingData.ventral.emotions || []).join(', ')}\n\n`;
    }

    if (mappingData.sympathetic?.body_sensations?.length > 0) {
      summary += "🔴 SYMPATHETIC (Fight/Flight):\n";
      summary += `Body: ${mappingData.sympathetic.body_sensations.join(', ')}\n`;
      summary += `Emotions: ${(mappingData.sympathetic.emotions || []).join(', ')}\n\n`;
    }

    if (mappingData.dorsal?.body_sensations?.length > 0) {
      summary += "🟣 DORSAL (Shutdown):\n";
      summary += `Body: ${mappingData.dorsal.body_sensations.join(', ')}\n`;
      summary += `Emotions: ${(mappingData.dorsal.emotions || []).join(', ')}\n\n`;
    }

    Alert.alert('Your Digital Map', summary, [
      { text: 'Done', onPress: () => onComplete?.() }
    ]);
  };

  const renderMessage = (message) => {
    if (message.isAI) {
      return (
        <View key={message.id} style={styles.aiMessageRow}>
          <Image
            source={require('../assets/images/huxley-avatar.png')}
            style={styles.huxleyAvatar}
            resizeMode="contain"
          />
          <View style={[styles.messageBubble, styles.aiMessage]}>
            <Text style={[styles.messageText, styles.aiMessageText]}>
              {message.text}
            </Text>
            <Text style={styles.timestamp}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View
        key={message.id}
        style={[styles.messageBubble, styles.userMessage]}
      >
        <Text style={[styles.messageText, styles.userMessageText]}>
          {message.text}
        </Text>
        <Text style={styles.timestamp}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  const renderStateButtons = () => {
    const mappedStates = sessionProgress?.mappedStates || {};
    if (currentState !== 'intro' && currentState !== 'drawing_prompt' && currentState !== 'complete') {
      return (
        <View style={styles.stateProgress}>
          <Text style={styles.stateProgressText}>States Mapped: {sessionProgress?.statesMapped || 0}/3</Text>
          <View style={styles.stateIndicators}>
            <View style={[styles.stateIndicator, mappedStates.ventral?.isMapped && styles.stateCompleted]}>
              <Text style={styles.stateIndicatorText}>Ventral</Text>
            </View>
            <View style={[styles.stateIndicator, mappedStates.sympathetic?.isMapped && styles.stateCompleted]}>
              <Text style={styles.stateIndicatorText}>Sympathetic</Text>
            </View>
            <View style={[styles.stateIndicator, mappedStates.dorsal?.isMapped && styles.stateCompleted]}>
              <Text style={styles.stateIndicatorText}>Dorsal</Text>
            </View>
          </View>
        </View>
      );
    }

    if (currentState === 'drawing_prompt') {
      return (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={showDrawingGuidance}
          >
            <MaterialIcons name="info" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Show Drawing Guide</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.successButton]}
            onPress={handleDrawingComplete}
          >
            <MaterialIcons name="check-circle" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>I'm Done Drawing</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation?.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <MaterialIcons name="psychology" size={24} color={colors.primary} />
          <Text style={styles.headerTitle}>Nervous System Mapping</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {sessionProgress?.phaseLabel || 'Exploring your nervous system states'}
        </Text>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map(renderMessage)}

        {loading && (
          <View style={styles.aiMessageRow}>
            <Image
              source={require('../assets/images/huxley-avatar.png')}
              style={styles.huxleyAvatar}
              resizeMode="contain"
            />
            <View style={[styles.messageBubble, styles.aiMessage]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.aiMessageText}>Huxley is typing...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* State Progress / Action Buttons */}
      {renderStateButtons()}

      {/* Input Area */}
      <View style={[styles.inputContainer, !keyboardVisible && { paddingBottom: 8 + insets.bottom }]}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Share your thoughts..."
          placeholderTextColor="#9ca3af"
          multiline
          maxLength={2000}
          editable={!loading && !saving}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || loading || saving) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || loading || saving}
        >
          <MaterialIcons
            name="send"
            size={24}
            color={inputText.trim() && !loading && !saving ? '#fff' : '#d1d5db'}
          />
        </TouchableOpacity>
      </View>

      {/* Saving Indicator */}
      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.savingText}>Saving your mapping...</Text>
        </View>
      )}
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F1E8'
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 12
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 36
  },
  messagesContainer: {
    flex: 1
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 16
  },
  aiMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  huxleyAvatar: {
    width: 40,
    height: 40,
    marginRight: 8,
    marginTop: 4
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 0,
    flex: 1
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4
  },
  userMessageText: {
    color: '#fff'
  },
  aiMessageText: {
    color: '#1f2937'
  },
  timestamp: {
    fontSize: 11,
    color: '#9ca3af',
    alignSelf: 'flex-end'
  },
  stateProgress: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  stateProgressText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8
  },
  stateIndicators: {
    flexDirection: 'row',
    gap: 8
  },
  stateIndicator: {
    flex: 1,
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d1d5db'
  },
  stateCompleted: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981'
  },
  stateIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563'
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  primaryButton: {
    backgroundColor: colors.primary
  },
  successButton: {
    backgroundColor: '#10b981'
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'flex-end'
  },
  input: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    maxHeight: 80,
    marginRight: 12
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: '#f3f4f6'
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  savingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16
  }
});

export default ConversationalNervousSystemMapping;
