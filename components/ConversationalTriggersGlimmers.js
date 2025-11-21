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
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import triggersGlimmersAIService from '../lib/triggersGlimmersAIService';

/**
 * Conversational Triggers & Glimmers Exploration
 * AI-guided discovery of what dysregulates and regulates the nervous system
 */
const ConversationalTriggersGlimmers = ({ onComplete }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState('intro');
  const [saving, setSaving] = useState(false);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    initializeExploration();
  }, []);

  const initializeExploration = () => {
    triggersGlimmersAIService.reset();

    const openingMessage = {
      id: Date.now(),
      text: "Hi! Let's explore what impacts your nervous system. We'll look at triggers - things that dysregulate you - and glimmers - small moments that bring you back to safety and connection. What would you like to start with?",
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
      const response = await triggersGlimmersAIService.sendMessage(inputText.trim(), phase);

      const aiMessage = {
        id: Date.now() + 1,
        text: response.message,
        isAI: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setPhase(response.phase);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to send message.');
    } finally {
      setLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleComplete = async () => {
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const extractedData = await triggersGlimmersAIService.extractData();
      const conversation = triggersGlimmersAIService.getConversationHistory();

      const { error } = await supabase
        .from('triggers_glimmers_mapping')
        .insert({
          user_id: user.id,
          conversation,
          sympathetic_triggers: extractedData.triggers?.sympathetic || [],
          dorsal_triggers: extractedData.triggers?.dorsal || [],
          general_triggers: extractedData.triggers?.general || [],
          sensory_glimmers: extractedData.glimmers?.sensory || [],
          relational_glimmers: extractedData.glimmers?.relational || [],
          activity_glimmers: extractedData.glimmers?.activities || [],
          nature_glimmers: extractedData.glimmers?.nature || []
        });

      if (error) throw error;

      Alert.alert(
        'Saved!',
        'Your triggers and glimmers have been mapped. You can use this awareness to navigate your nervous system more skillfully.',
        [{ text: 'Done', onPress: () => onComplete?.() }]
      );

      triggersGlimmersAIService.reset();
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save mapping.');
    } finally {
      setSaving(false);
    }
  };

  const renderMessage = (message) => (
    <View
      key={message.id}
      style={[styles.messageBubble, message.isAI ? styles.aiMessage : styles.userMessage]}
    >
      <Text style={[styles.messageText, message.isAI ? styles.aiMessageText : styles.userMessageText]}>
        {message.text}
      </Text>
      <Text style={styles.timestamp}>
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={100}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialIcons name="waves" size={24} color="#ec4899" />
          <Text style={styles.headerTitle}>Triggers & Glimmers</Text>
        </View>
        <Text style={styles.headerSubtitle}>Mapping what impacts your nervous system</Text>
      </View>

      <ScrollView ref={scrollViewRef} style={styles.messagesContainer} contentContainerStyle={styles.messagesContent}>
        {messages.map(renderMessage)}
        {loading && (
          <View style={[styles.messageBubble, styles.aiMessage]}>
            <ActivityIndicator size="small" color="#ec4899" />
            <Text style={styles.aiMessageText}>Huxley is typing...</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.doneButton} onPress={handleComplete}>
        <MaterialIcons name="check-circle" size={20} color="#10b981" />
        <Text style={styles.doneButtonText}>Save My Mapping</Text>
      </TouchableOpacity>

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
          <MaterialIcons name="send" size={24} color={inputText.trim() && !loading && !saving ? '#fff' : '#d1d5db'} />
        </TouchableOpacity>
      </View>

      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" color="#ec4899" />
          <Text style={styles.savingText}>Saving your mapping...</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F1E8' },
  header: { backgroundColor: '#fff', padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginLeft: 12 },
  headerSubtitle: { fontSize: 14, color: '#6b7280', marginLeft: 36 },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 80 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 12 },
  userMessage: { alignSelf: 'flex-end', backgroundColor: '#ec4899', borderBottomRightRadius: 4 },
  aiMessage: { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e5e7eb' },
  messageText: { fontSize: 16, lineHeight: 22, marginBottom: 4 },
  userMessageText: { color: '#fff' },
  aiMessageText: { color: '#1f2937' },
  timestamp: { fontSize: 11, color: '#9ca3af', alignSelf: 'flex-end' },
  doneButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, marginHorizontal: 16, marginBottom: 8, backgroundColor: '#f0fdf4', borderRadius: 12, borderWidth: 1, borderColor: '#86efac' },
  doneButtonText: { color: '#10b981', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  inputContainer: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb', alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#1f2937', maxHeight: 120, marginRight: 12 },
  sendButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#ec4899', alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { backgroundColor: '#f3f4f6' },
  savingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  savingText: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 16 }
});

export default ConversationalTriggersGlimmers;
