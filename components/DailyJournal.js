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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import huxleyService from '../lib/huxleyService';
import { shareJournal } from '../lib/therapistShareService';

/**
 * Daily Journal - Conversational AI-Guided Journaling
 * Allows free-form journaling with optional AI discussion and insights
 */
const DailyJournal = ({ onComplete, navigation }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState('choosing'); // 'choosing', 'journaling', 'discussion', 'suggestions', 'complete'
  const [journalMode, setJournalMode] = useState(null); // 'prompt', 'feedback', 'freewrite'
  const [saving, setSaving] = useState(false);
  const [pastEntries, setPastEntries] = useState([]);
  const [showPastEntries, setShowPastEntries] = useState(false);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollViewRef = useRef(null);
  const insets = useSafeAreaInsets();

  // Track keyboard visibility and scroll to bottom when keyboard opens
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

  const initializeJournal = async (mode) => {
    // Reset service
    huxleyService.setMode('journal', { clearHistory: true });

    let openingText;
    if (mode === 'prompt') {
      openingText = "Let me give you something to reflect on...\n\nWhat's one thing you noticed about yourself today — a thought, feeling, or reaction — that surprised you?";
    } else if (mode === 'feedback') {
      openingText = "I'd love to hear what's been on your mind. Share whatever feels right, and I'll offer some reflections when you're ready.";
    } else {
      openingText = "This space is yours. Write freely — I'm here if you need me.";
    }

    const openingMessage = {
      id: Date.now(),
      text: openingText,
      isAI: true,
      timestamp: new Date()
    };

    setMessages([openingMessage]);
    setJournalMode(mode);
    setPhase('journaling');
  };

  const handleModeChoice = (mode) => {
    initializeJournal(mode);
  };

  const handleBack = () => {
    setMessages([]);
    setInputText('');
    setPhase('choosing');
    setJournalMode(null);
    huxleyService.setMode('journal', { clearHistory: true });
  };

  const loadPastEntries = async () => {
    setLoadingEntries(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('daily_journals')
        .select('id, title, mood, created_at, raw_text, emotions, themes, insights')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPastEntries(data || []);
      setShowPastEntries(true);
    } catch (error) {
      console.error('Error loading entries:', error);
      Alert.alert('Error', 'Could not load past entries.');
    } finally {
      setLoadingEntries(false);
    }
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

    // In freewrite mode, just add the message — no AI response
    if (journalMode === 'freewrite') {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return;
    }

    setLoading(true);

    try {
      const response = await huxleyService.chat(inputText.trim(), { phase });

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
        const response = await huxleyService.chat(
          "Yes, I'd like some suggestions.",
          { phase: 'suggestions' }
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
      const structuredData = await huxleyService.extractData(`Extract journal data in JSON format:
{
  "mood": "overall mood (1-2 words)",
  "emotions": ["array of emotions"],
  "themes": ["key themes"],
  "people_mentioned": ["names"],
  "activities": ["activities"],
  "insights": "key insight",
  "gratitude": ["grateful for"],
  "challenges": ["challenges"],
  "goals": ["intentions or goals"],
  "sentiment_score": 0.5
}
Only include fields with clear evidence.`);

      // Generate title
      const title = await huxleyService.generateTitle();

      // Get conversation history
      const conversation = huxleyService.getConversationHistory();

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

      // Show completion message with share option
      const savedEntry = {
        title,
        raw_text: rawText,
        mood: structuredData.mood || '',
        emotions: structuredData.emotions || [],
        themes: structuredData.themes || [],
        insights: structuredData.insights || '',
        gratitude: structuredData.gratitude || [],
        challenges: structuredData.challenges || [],
        goals: structuredData.goals || [],
        created_at: new Date().toISOString(),
      };

      const resetJournal = () => {
        setMessages([]);
        setPhase('choosing');
        setJournalMode(null);
        setInputText('');
        huxleyService.setMode('journal', { clearHistory: true });
      };

      Alert.alert(
        'Journal Saved',
        'Your journal entry has been saved. Take care of yourself!',
        [
          {
            text: 'Share with Therapist',
            onPress: () => shareJournal(savedEntry).catch(() => {}).finally(() => {
              onComplete ? onComplete() : resetJournal();
            }),
          },
          { text: 'Done', onPress: () => onComplete ? onComplete() : resetJournal() },
        ]
      );
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
    <SafeAreaView style={styles.container} edges={['top']}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {(phase !== 'choosing' || showPastEntries) && (
            <TouchableOpacity onPress={() => { showPastEntries ? setShowPastEntries(false) : handleBack(); }} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color="#6366f1" />
            </TouchableOpacity>
          )}
          <MaterialIcons name="auto-stories" size={24} color="#6366f1" />
          <Text style={styles.headerTitle}>Daily Journal</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {phase === 'choosing' && !showPastEntries && 'How would you like to journal today?'}
          {showPastEntries && 'Your journal entries'}
          {phase === 'journaling' && "Share what's on your mind..."}
          {phase === 'discussion' && 'Exploring together...'}
          {phase === 'suggestions' && 'Finding helpful practices...'}
          {(phase === 'discussion_prompt' || phase === 'suggestions_prompt') && 'What would you like to do?'}
        </Text>
      </View>

      {showPastEntries ? (
        /* Past Entries List */
        <ScrollView style={styles.messagesContainer} contentContainerStyle={{ padding: 16 }}>
          {pastEntries.length === 0 ? (
            <Text style={styles.emptyText}>No journal entries yet. Start writing!</Text>
          ) : (
            pastEntries.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={styles.entryCard}
                onPress={() => {
                  Alert.alert(
                    entry.title || 'Journal Entry',
                    (entry.raw_text || '').slice(0, 500) + (entry.raw_text?.length > 500 ? '...' : ''),
                    [{ text: 'Close' }]
                  );
                }}
              >
                <View style={styles.entryCardHeader}>
                  <Text style={styles.entryCardTitle} numberOfLines={1}>
                    {entry.title || 'Untitled'}
                  </Text>
                  {entry.mood ? (
                    <Text style={styles.entryCardMood}>{entry.mood}</Text>
                  ) : null}
                </View>
                <Text style={styles.entryCardDate}>
                  {new Date(entry.created_at).toLocaleDateString(undefined, {
                    weekday: 'short', month: 'short', day: 'numeric'
                  })}
                </Text>
                {entry.themes?.length > 0 && (
                  <View style={styles.entryCardTags}>
                    {entry.themes.slice(0, 3).map((theme, i) => (
                      <Text key={i} style={styles.entryCardTag}>{theme}</Text>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      ) : phase === 'choosing' ? (
        /* Mode Selection */
        <View style={styles.choosingContainer}>
          <Image
            source={require('../assets/images/huxley-avatar.png')}
            style={styles.choosingAvatar}
            resizeMode="contain"
          />
          <Text style={styles.choosingGreeting}>Hi! How would you like to journal today?</Text>

          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => handleModeChoice('prompt')}
          >
            <MaterialIcons name="lightbulb-outline" size={28} color="#6366f1" />
            <View style={styles.modeCardContent}>
              <Text style={styles.modeCardTitle}>Give me a prompt</Text>
              <Text style={styles.modeCardDescription}>Get a reflection question to write about</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => handleModeChoice('feedback')}
          >
            <MaterialIcons name="forum" size={28} color="#6366f1" />
            <View style={styles.modeCardContent}>
              <Text style={styles.modeCardTitle}>I'd like feedback</Text>
              <Text style={styles.modeCardDescription}>Write freely and get reflections from Huxley</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => handleModeChoice('freewrite')}
          >
            <MaterialIcons name="edit" size={28} color="#6366f1" />
            <View style={styles.modeCardContent}>
              <Text style={styles.modeCardTitle}>Just write</Text>
              <Text style={styles.modeCardDescription}>Open space to journal on your own</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pastEntriesButton}
            onPress={loadPastEntries}
            disabled={loadingEntries}
          >
            {loadingEntries ? (
              <ActivityIndicator size="small" color="#6366f1" />
            ) : (
              <MaterialIcons name="history" size={20} color="#6366f1" />
            )}
            <Text style={styles.pastEntriesButtonText}>Past Entries</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
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
                  <ActivityIndicator size="small" color="#6366f1" />
                  <Text style={styles.aiMessageText}>Huxley is typing...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          {renderActionButtons()}

          {/* Input Area */}
          <View style={styles.inputContainer}>
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
        </>
      )}

      {/* Saving Indicator */}
      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.savingText}>Saving your journal...</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  backButton: {
    marginRight: 8,
    padding: 4,
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
    paddingBottom: 8
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
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
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
  choosingContainer: {
    flex: 1,
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  choosingAvatar: {
    width: 80,
    height: 80,
    marginBottom: 16
  },
  choosingGreeting: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 24
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  modeCardContent: {
    marginLeft: 14,
    flex: 1
  },
  modeCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2
  },
  modeCardDescription: {
    fontSize: 13,
    color: '#6b7280'
  },
  pastEntriesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 12,
  },
  pastEntriesButtonText: {
    fontSize: 15,
    color: '#6366f1',
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    marginTop: 40,
  },
  entryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  entryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  entryCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  entryCardMood: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: '500',
  },
  entryCardDate: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 6,
  },
  entryCardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  entryCardTag: {
    fontSize: 12,
    color: '#6366f1',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
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
