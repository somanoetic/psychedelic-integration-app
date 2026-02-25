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
  Image,
  Keyboard
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import dailyJournalAIService from '../lib/dailyJournalAIService';

/**
 * Daily Journal - Conversational AI-Guided Journaling
 * Allows free-form journaling with optional AI discussion and insights
 */
const DailyJournal = ({ onComplete }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState('journaling'); // 'journaling', 'discussion', 'suggestions', 'complete'
  const [saving, setSaving] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollViewRef = useRef(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Start the conversation
    initializeJournal();
  }, []);

  // Track keyboard visibility to adjust bottom padding
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const initializeJournal = async () => {
    // Reset service
    dailyJournalAIService.reset();

    // Add Huxley's opening message
    const openingMessage = {
      id: Date.now(),
      text: "Hi there! I'm here to listen. What's on your mind today?",
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
      const response = await dailyJournalAIService.sendMessage(inputText.trim(), phase);

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
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleJournalingDone = async () => {
    setLoading(true);

    const aiMessage = {
      id: Date.now(),
      text: "Thank you for sharing with me today. Would you like to discuss any of this further?",
      isAI: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiMessage]);
    setPhase('discussion_prompt');
    setLoading(false);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleDiscussionResponse = async (wantsDiscussion) => {
    if (wantsDiscussion) {
      setPhase('discussion');
      setLoading(true);

      const aiMessage = {
        id: Date.now(),
        text: "I'd be happy to explore this with you. What stands out most to you from what you shared?",
        isAI: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setLoading(false);
    } else {
      // Skip to suggestions
      handleDiscussionDone();
    }

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleDiscussionDone = async () => {
    setLoading(true);

    const aiMessage = {
      id: Date.now(),
      text: "Would you like some suggestions or practices that might help?",
      isAI: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiMessage]);
    setPhase('suggestions_prompt');
    setLoading(false);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSuggestionsResponse = async (wantsSuggestions) => {
    if (wantsSuggestions) {
      setPhase('suggestions');
      setLoading(true);

      try {
        const response = await dailyJournalAIService.sendMessage(
          "Yes, I'd like some suggestions.",
          'suggestions'
        );

        const aiMessage = {
          id: Date.now(),
          text: response.message,
          isAI: true,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error('Error getting suggestions:', error);
      } finally {
        setLoading(false);
        setTimeout(() => handleComplete(), 2000);
      }
    } else {
      handleComplete();
    }

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleComplete = async () => {
    setSaving(true);

    try {
      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      // Extract structured data
      const structuredData = await dailyJournalAIService.extractStructuredData();

      // Generate title
      const title = await dailyJournalAIService.generateTitle();

      // Get conversation history
      const conversation = dailyJournalAIService.getConversationHistory();

      // Count words
      const rawText = messages
        .filter(m => !m.isAI)
        .map(m => m.text)
        .join(' ');
      const wordCount = rawText.split(/\s+/).length;

      // Save to database
      const { error } = await supabase
        .from('daily_journals')
        .insert({
          user_id: user.id,
          title,
          conversation,
          raw_text: rawText,
          mood: structuredData.mood || '',
          emotions: structuredData.emotions || [],
          themes: structuredData.themes || [],
          people_mentioned: structuredData.people_mentioned || [],
          activities: structuredData.activities || [],
          insights: structuredData.insights || '',
          gratitude: structuredData.gratitude || [],
          challenges: structuredData.challenges || [],
          goals: structuredData.goals || [],
          discussion_requested: phase !== 'journaling',
          word_count: wordCount,
          sentiment_score: structuredData.sentiment_score || 0
        });

      if (error) throw error;

      // Show completion message
      Alert.alert(
        'Journal Saved',
        'Your journal entry has been saved. Take care of yourself!',
        [{ text: 'OK', onPress: () => onComplete?.() }]
      );

      // Reset for next time
      dailyJournalAIService.reset();
    } catch (error) {
      console.error('Error saving journal:', error);
      Alert.alert('Error', 'Failed to save journal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderMessage = (message) => {
    if (message.isAI) {
      return (
        <View key={message.id} style={styles.aiMessageRow}>
          <Image
            source={require('../assets/images/huxley therapist.png')}
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

  const renderActionButtons = () => {
    if (phase === 'discussion_prompt') {
      return (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => handleDiscussionResponse(true)}
          >
            <Text style={styles.primaryButtonText}>Yes, let's discuss</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => handleDiscussionResponse(false)}
          >
            <Text style={styles.secondaryButtonText}>No, that's okay</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (phase === 'suggestions_prompt') {
      return (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => handleSuggestionsResponse(true)}
          >
            <Text style={styles.primaryButtonText}>Yes, please</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => handleSuggestionsResponse(false)}
          >
            <Text style={styles.secondaryButtonText}>No, I'm good</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (phase === 'journaling') {
      return (
        <TouchableOpacity
          style={styles.doneButton}
          onPress={handleJournalingDone}
        >
          <MaterialIcons name="check-circle" size={20} color="#10b981" />
          <Text style={styles.doneButtonText}>I'm done journaling</Text>
        </TouchableOpacity>
      );
    }

    if (phase === 'discussion') {
      return (
        <TouchableOpacity
          style={styles.doneButton}
          onPress={handleDiscussionDone}
        >
          <MaterialIcons name="check-circle" size={20} color="#10b981" />
          <Text style={styles.doneButtonText}>Finish discussion</Text>
        </TouchableOpacity>
      );
    }

    return null;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialIcons name="auto-stories" size={24} color="#6366f1" />
          <Text style={styles.headerTitle}>Daily Journal</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {phase === 'journaling' && "Share what's on your mind..."}
          {phase === 'discussion' && 'Exploring together...'}
          {phase === 'suggestions' && 'Finding helpful practices...'}
          {(phase === 'discussion_prompt' || phase === 'suggestions_prompt') && 'What would you like to do?'}
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
              source={require('../assets/images/huxley therapist.png')}
              style={styles.huxleyAvatar}
              resizeMode="contain"
            />
            <View style={[styles.messageBubble, styles.aiMessage]}>
              <ActivityIndicator size="small" color="#6366f1" />
              <Text style={styles.aiMessageText}>Huxley is typing...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {renderActionButtons()}

      {/* Input Area */}
      <View style={[styles.inputContainer, { paddingBottom: keyboardVisible ? 12 : Math.max(insets.bottom, 12) + 12 }]}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your thoughts..."
          placeholderTextColor="#9ca3af"
          multiline
          maxLength={2000}
          editable={!loading && !saving && phase !== 'discussion_prompt' && phase !== 'suggestions_prompt'}
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
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.savingText}>Saving your journal...</Text>
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
    paddingBottom: 80
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
    backgroundColor: '#6366f1',
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
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  primaryButton: {
    backgroundColor: '#6366f1'
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db'
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  secondaryButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600'
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86efac'
  },
  doneButtonText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8
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
    backgroundColor: '#6366f1',
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

export default DailyJournal;
