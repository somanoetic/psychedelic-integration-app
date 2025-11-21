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
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import nervousSystemMappingAIService from '../lib/nervousSystemMappingAIService';

/**
 * Conversational Nervous System Mapping
 * AI-guided exploration of polyvagal states, then prompts physical drawing
 */
const ConversationalNervousSystemMapping = ({ onComplete }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentState, setCurrentState] = useState('intro');
  const [statesCompleted, setStatesCompleted] = useState({
    ventral: false,
    sympathetic: false,
    dorsal: false
  });
  const [saving, setSaving] = useState(false);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    initializeMapping();
  }, []);

  const initializeMapping = () => {
    nervousSystemMappingAIService.reset();

    const openingMessage = {
      id: Date.now(),
      text: "Hi! I'm here to help you map your nervous system states. We'll explore three different states together: times when you feel safe and connected, times when you're activated or stressed, and times when you feel shut down. Which state feels most accessible to you right now?",
      isAI: true,
      timestamp: new Date()
    };

    setMessages([openingMessage]);
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
      const response = await nervousSystemMappingAIService.sendMessage(
        inputText.trim(),
        currentState
      );

      const aiMessage = {
        id: Date.now() + 1,
        text: response.message,
        isAI: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
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

  const markStateComplete = (state) => {
    setStatesCompleted(prev => ({ ...prev, [state]: true }));

    // Check if all states are done
    const updated = { ...statesCompleted, [state]: true };
    if (updated.ventral && updated.sympathetic && updated.dorsal) {
      // All states mapped, move to drawing prompt
      setTimeout(() => {
        promptDrawing();
      }, 1000);
    }
  };

  const promptDrawing = async () => {
    setCurrentState('drawing_prompt');
    setLoading(true);

    const drawingMessage = {
      id: Date.now(),
      text: "Great work exploring your nervous system states! Now for the creative part. I'd like you to grab some paper and colored pencils, crayons, or markers. We're going to create a visual body map showing where each state lives in your body. Ready?",
      isAI: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, drawingMessage]);
    setLoading(false);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      // Extract structured data
      const mappingData = await nervousSystemMappingAIService.extractMappingData();
      const conversation = nervousSystemMappingAIService.getConversationHistory();

      // Save each state's data to polyvagal_patterns table
      for (const [state, data] of Object.entries(mappingData)) {
        if (Object.keys(data).length === 0) continue; // Skip empty states

        const stateType = state === 'ventral' ? 'ventral_vagal' :
                         state === 'sympathetic' ? 'sympathetic' : 'dorsal_vagal';

        // Check if pattern exists
        const { data: existing } = await supabase
          .from('polyvagal_patterns')
          .select('id')
          .eq('user_id', user.id)
          .eq('state_type', stateType)
          .single();

        const patternData = {
          user_id: user.id,
          state_type: stateType,
          conversation: conversation,
          ...data
        };

        if (existing) {
          // Update existing
          await supabase
            .from('polyvagal_patterns')
            .update(patternData)
            .eq('id', existing.id);
        } else {
          // Insert new
          await supabase
            .from('polyvagal_patterns')
            .insert(patternData);
        }
      }

      Alert.alert(
        'Mapping Saved!',
        'Your nervous system map has been saved. You can view your digital visual map now.',
        [
          {
            text: 'View Map',
            onPress: () => showDigitalMap(mappingData)
          },
          {
            text: 'Done',
            onPress: () => onComplete?.()
          }
        ]
      );

      nervousSystemMappingAIService.reset();
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
    return (
      <View
        key={message.id}
        style={[
          styles.messageBubble,
          message.isAI ? styles.aiMessage : styles.userMessage
        ]}
      >
        <Text style={[
          styles.messageText,
          message.isAI ? styles.aiMessageText : styles.userMessageText
        ]}>
          {message.text}
        </Text>
        <Text style={styles.timestamp}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  const renderStateButtons = () => {
    if (currentState !== 'intro' && currentState !== 'drawing_prompt') {
      return (
        <View style={styles.stateProgress}>
          <Text style={styles.stateProgressText}>States Mapped:</Text>
          <View style={styles.stateIndicators}>
            <View style={[styles.stateIndicator, statesCompleted.ventral && styles.stateCompleted]}>
              <Text style={styles.stateIndicatorText}>Ventral</Text>
            </View>
            <View style={[styles.stateIndicator, statesCompleted.sympathetic && styles.stateCompleted]}>
              <Text style={styles.stateIndicatorText}>Sympathetic</Text>
            </View>
            <View style={[styles.stateIndicator, statesCompleted.dorsal && styles.stateCompleted]}>
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialIcons name="psychology" size={24} color="#8b5cf6" />
          <Text style={styles.headerTitle}>Nervous System Mapping</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {currentState === 'intro' && 'Exploring your nervous system states'}
          {currentState === 'ventral' && 'Mapping: Safe & Social'}
          {currentState === 'sympathetic' && 'Mapping: Fight/Flight'}
          {currentState === 'dorsal' && 'Mapping: Shutdown'}
          {currentState === 'drawing_prompt' && 'Time to create your visual map!'}
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
          <View style={[styles.messageBubble, styles.aiMessage]}>
            <ActivityIndicator size="small" color="#8b5cf6" />
            <Text style={styles.aiMessageText}>Huxley is typing...</Text>
          </View>
        )}
      </ScrollView>

      {/* State Progress / Action Buttons */}
      {renderStateButtons()}

      {/* Input Area */}
      <View style={styles.inputContainer}>
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
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.savingText}>Saving your mapping...</Text>
        </View>
      )}
    </KeyboardAvoidingView>
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
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
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
    paddingBottom: 100
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#8b5cf6',
    borderBottomRightRadius: 4
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb'
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
    backgroundColor: '#8b5cf6'
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
    padding: 16,
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
    maxHeight: 120,
    marginRight: 12
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8b5cf6',
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
