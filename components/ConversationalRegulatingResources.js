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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import regulatingResourcesAIService from '../lib/regulatingResourcesAIService';

/**
 * Conversational Regulating Resources Discovery
 * Guides user through identifying their personal regulation toolkit
 */
const ConversationalRegulatingResources = ({ user, onComplete }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState('intro'); // 'intro', 'individual', 'interactive', 'complete'
  const [saving, setSaving] = useState(false);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    initializeConversation();
  }, []);

  const initializeConversation = async () => {
    regulatingResourcesAIService.reset();

    const openingMessage = {
      id: Date.now(),
      text: "Hi! Let's build your personal regulation toolkit together. I want to help you identify what actually helps you feel grounded and safe - both things you do on your own and ways you connect with others. What would you like to explore first?",
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
      const response = await regulatingResourcesAIService.sendMessage(inputText.trim(), phase);

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

  const handlePhaseTransition = (newPhase) => {
    setPhase(newPhase);
  };

  const handleComplete = async () => {
    setSaving(true);

    try {
      // Extract structured data from conversation
      const extractedData = await regulatingResourcesAIService.extractResourcesData();
      const conversationHistory = regulatingResourcesAIService.getConversationHistory();

      // Save to database
      const { data, error } = await supabase
        .from('regulating_resources')
        .insert({
          user_id: user.id,
          conversation: conversationHistory,
          sensory_resources: extractedData.sensory || [],
          movement_resources: extractedData.movement || [],
          connection_resources: extractedData.connection || [],
          creative_resources: extractedData.creative || [],
          spiritual_resources: extractedData.spiritual || [],
          cognitive_resources: extractedData.cognitive || []
        })
        .select()
        .single();

      if (error) {
        console.error('Save error:', error);
        Alert.alert('Save Error', 'Could not save your resources. Please try again.');
        return;
      }

      console.log('[Resources] Saved successfully:', data.id);

      // Show completion message
      const completionMessage = {
        id: Date.now(),
        text: "Your regulation toolkit has been saved! These are your personal resources - things that actually work for you. You can revisit and add to this toolkit anytime.",
        isAI: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, completionMessage]);
      setPhase('complete');

      // Notify parent component
      if (onComplete) {
        setTimeout(() => onComplete(data), 2000);
      }
    } catch (error) {
      console.error('Error completing resources:', error);
      Alert.alert('Error', 'Failed to save resources. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderMessage = (message) => {
    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          message.isAI ? styles.aiMessage : styles.userMessage
        ]}
      >
        {message.isAI && (
          <Image
            source={require('../assets/images/huxley therapist.png')}
            style={styles.huxleyAvatar}
            resizeMode="contain"
          />
        )}
        <View style={[styles.messageBubble, message.isAI ? styles.aiBubble : styles.userBubble]}>
          <Text style={[styles.messageText, message.isAI ? styles.aiText : styles.userText]}>
            {message.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <View style={styles.header}>
        <MaterialIcons name="self-improvement" size={24} color="#8b5cf6" />
        <Text style={styles.headerTitle}>Regulating Resources</Text>
      </View>

      {/* Phase indicator */}
      <View style={styles.phaseIndicator}>
        <View style={[styles.phaseItem, phase === 'intro' && styles.phaseActive]}>
          <Text style={styles.phaseText}>Intro</Text>
        </View>
        <View style={[styles.phaseItem, phase === 'individual' && styles.phaseActive]}>
          <Text style={styles.phaseText}>Individual</Text>
        </View>
        <View style={[styles.phaseItem, phase === 'interactive' && styles.phaseActive]}>
          <Text style={styles.phaseText}>Interactive</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map(renderMessage)}
        {loading && (
          <View style={styles.loadingContainer}>
            <Image
              source={require('../assets/images/huxley therapist.png')}
              style={styles.huxleyAvatar}
              resizeMode="contain"
            />
            <View style={styles.loadingBubble}>
              <ActivityIndicator size="small" color="#8b5cf6" />
              <Text style={styles.loadingText}>Huxley is thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action buttons */}
      {phase !== 'complete' && (
        <View style={styles.actionsContainer}>
          {phase === 'intro' && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  handlePhaseTransition('individual');
                  const msg = { id: Date.now(), text: "Let's start with things I do alone", isAI: false, timestamp: new Date() };
                  setMessages(prev => [...prev, msg]);
                  sendMessage();
                }}
              >
                <Text style={styles.actionButtonText}>Start with Individual Resources</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => {
                  handlePhaseTransition('interactive');
                  const msg = { id: Date.now(), text: "Let's start with people and connection", isAI: false, timestamp: new Date() };
                  setMessages(prev => [...prev, msg]);
                  sendMessage();
                }}
              >
                <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Start with Interactive Resources</Text>
              </TouchableOpacity>
            </>
          )}
          {(phase === 'individual' || phase === 'interactive') && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleComplete}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>Complete & Save Resources</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Input area */}
      {phase !== 'complete' && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Share your resources..."
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={loading || !inputText.trim()}
          >
            <MaterialIcons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 12
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827'
  },
  phaseIndicator: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8
  },
  phaseItem: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center'
  },
  phaseActive: {
    backgroundColor: '#ede9fe'
  },
  phaseText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500'
  },
  messagesContainer: {
    flex: 1
  },
  messagesContent: {
    padding: 16,
    gap: 12
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8
  },
  aiMessage: {
    justifyContent: 'flex-start'
  },
  userMessage: {
    justifyContent: 'flex-end',
    flexDirection: 'row-reverse'
  },
  huxleyAvatar: {
    width: 40,
    height: 40,
    marginRight: 8,
    marginTop: 4
  },
  loadingBubble: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16
  },
  aiBubble: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  userBubble: {
    backgroundColor: '#8b5cf6'
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20
  },
  aiText: {
    color: '#111827'
  },
  userText: {
    color: '#fff'
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic'
  },
  actionsContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8
  },
  actionButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center'
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#8b5cf6'
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600'
  },
  secondaryButtonText: {
    color: '#8b5cf6'
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#f9fafb'
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db'
  }
});

export default ConversationalRegulatingResources;
