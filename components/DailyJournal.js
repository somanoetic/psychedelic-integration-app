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
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2, ArrowLeft, BookOpenText, Lightbulb, MessageCircle, Pencil, History, Send, Camera, FileText } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import huxleyService from '../lib/huxleyService';
import { shareJournal } from '../lib/therapistShareService';
import { getWorksheet } from '../content/worksheets';
import { colors, gradients, spacing, borderRadius, shadows, typography } from '../theme/colors';

// Pull a short snippet out of a scan's transcription for the past-entries
// preview. Worksheet scans store fields as { fields: { id: text } }; free-form
// scans store { fullText }. Pick the first non-empty value and trim.
function scanSnippet(entry) {
  const t = entry?.transcription;
  if (!t) return '';
  if (typeof t.fullText === 'string' && t.fullText.trim()) {
    return t.fullText.trim().slice(0, 160);
  }
  if (t.fields && typeof t.fields === 'object') {
    for (const v of Object.values(t.fields)) {
      if (typeof v === 'string' && v.trim()) return v.trim().slice(0, 160);
    }
  }
  return '';
}

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

      // Load text journal entries and paper scans in parallel. They live in
      // different tables but render into one chronological list — paper
      // scans are first-class entries in this stream (FEAT-paper-scan).
      const [journalsRes, scansRes] = await Promise.all([
        supabase
          .from('daily_journals')
          .select('id, title, mood, created_at, raw_text, emotions, themes, insights')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('paper_scans')
          .select('id, created_at, worksheet_id, worksheet_version, transcription, thematic_notes, therapist_share_enabled, image_storage_path')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      if (journalsRes.error) throw journalsRes.error;
      // Don't hard-fail if scans query errors (e.g. bucket not ready) — just log.
      if (scansRes.error) {
        console.warn('[DailyJournal] Failed to load paper scans:', scansRes.error);
      }

      const textEntries = (journalsRes.data || []).map((e) => ({
        ...e,
        _kind: 'text',
      }));
      const scanEntries = (scansRes.data || []).map((e) => ({
        ...e,
        _kind: 'scan',
      }));

      const merged = [...textEntries, ...scanEntries].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );

      setPastEntries(merged);
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
          <CheckCircle2 size={20} color={colors.success} strokeWidth={2} />
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
          <CheckCircle2 size={20} color={colors.success} strokeWidth={2} />
          <Text style={styles.doneButtonText}>Finish discussion</Text>
        </TouchableOpacity>
      );
    }

    return null;
  };

  // Render helpers for the merged past-entries list. Pulled out for readability —
  // the list mixes two entry kinds (text journals + paper scans) that look
  // similar but route to different detail surfaces.

  const renderTextEntry = (entry) => (
    <TouchableOpacity
      key={`text-${entry.id}`}
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
  );

  const renderScanEntry = (entry, navigation) => {
    const worksheet = entry.worksheet_id ? getWorksheet(entry.worksheet_id) : null;
    const title = worksheet?.title || 'Free-form page';
    const snippet = scanSnippet(entry);
    return (
      <TouchableOpacity
        key={`scan-${entry.id}`}
        style={styles.entryCard}
        onPress={() => navigation?.navigate('ScanDetail', { scanId: entry.id })}
      >
        <View style={styles.entryCardHeader}>
          <View style={styles.scanPill}>
            <Camera size={11} color="#4a6fb8" strokeWidth={2.5} />
            <Text style={styles.scanPillText}>Paper scan</Text>
          </View>
          <Text style={styles.entryCardTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <Text style={styles.entryCardDate}>
          {new Date(entry.created_at).toLocaleDateString(undefined, {
            weekday: 'short', month: 'short', day: 'numeric'
          })}
        </Text>
        {snippet ? (
          <Text style={styles.scanSnippet} numberOfLines={2}>
            {snippet}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={gradients.standard}
      start={gradients.standardStart}
      end={gradients.standardEnd}
      style={styles.gradientFill}
    >
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
            onPress={() => {
              if (showPastEntries) {
                setShowPastEntries(false);
              } else if (phase !== 'choosing') {
                handleBack();
              } else {
                navigation?.goBack();
              }
            }}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={colors.primary} strokeWidth={2} />
          </TouchableOpacity>
          <BookOpenText size={24} color={colors.primary} strokeWidth={2} />
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
        /* Past Entries List — text journals + paper scans, merged chronologically */
        <ScrollView style={styles.messagesContainer} contentContainerStyle={{ padding: 16 }}>
          {pastEntries.length === 0 ? (
            <Text style={styles.emptyText}>No journal entries yet. Start writing!</Text>
          ) : (
            pastEntries.map((entry) =>
              entry._kind === 'scan'
                ? renderScanEntry(entry, navigation)
                : renderTextEntry(entry)
            )
          )}
        </ScrollView>
      ) : phase === 'choosing' ? (
        /* Mode Selection */
        <ScrollView
          style={styles.choosingScroll}
          contentContainerStyle={styles.choosingContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
            <Lightbulb size={28} color={colors.primary} strokeWidth={2} />
            <View style={styles.modeCardContent}>
              <Text style={styles.modeCardTitle}>Give me a prompt</Text>
              <Text style={styles.modeCardDescription}>Get a reflection question to write about</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => handleModeChoice('feedback')}
          >
            <MessageCircle size={28} color={colors.primary} strokeWidth={2} />
            <View style={styles.modeCardContent}>
              <Text style={styles.modeCardTitle}>I'd like feedback</Text>
              <Text style={styles.modeCardDescription}>Write freely and get reflections from Huxley</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => handleModeChoice('freewrite')}
          >
            <Pencil size={28} color={colors.primary} strokeWidth={2} />
            <View style={styles.modeCardContent}>
              <Text style={styles.modeCardTitle}>Just write</Text>
              <Text style={styles.modeCardDescription}>Open space to journal on your own</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => navigation?.navigate('ScanCapture')}
          >
            <Camera size={28} color={colors.primary} strokeWidth={2} />
            <View style={styles.modeCardContent}>
              <Text style={styles.modeCardTitle}>Scan a paper page</Text>
              <Text style={styles.modeCardDescription}>Photograph a handwritten worksheet or journal page</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => navigation?.navigate('WorksheetLibrary')}
          >
            <FileText size={28} color={colors.primary} strokeWidth={2} />
            <View style={styles.modeCardContent}>
              <Text style={styles.modeCardTitle}>Printable worksheets</Text>
              <Text style={styles.modeCardDescription}>Browse pages you can print and fill out by hand</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pastEntriesButton}
            onPress={loadPastEntries}
            disabled={loadingEntries}
          >
            {loadingEntries ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <History size={20} color={colors.primary} strokeWidth={2} />
            )}
            <Text style={styles.pastEntriesButtonText}>Past Entries</Text>
          </TouchableOpacity>
        </ScrollView>
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
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.aiMessageText}>Huxley is typing...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          {renderActionButtons()}

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.composerScanButton}
              onPress={() => navigation?.navigate('ScanCapture')}
              disabled={loading || saving}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Scan a paper page"
            >
              <Camera
                size={22}
                color={loading || saving ? '#d1d5db' : colors.primary}
                strokeWidth={2}
              />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your thoughts..."
              placeholderTextColor={colors.textLight}
              multiline
              maxLength={2000}
              editable={!loading && !saving && phase !== 'discussion_prompt' && phase !== 'suggestions_prompt'}
              spellCheck={true}
              autoCorrect={false}
              autoCapitalize="sentences"
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || loading || saving) && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!inputText.trim() || loading || saving}
            >
              <Send
                size={24}
                color={inputText.trim() && !loading && !saving ? '#fff' : '#d1d5db'}
                strokeWidth={2}
              />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Saving Indicator */}
      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.savingText}>Saving your journal...</Text>
        </View>
      )}
    </KeyboardAvoidingView>
    </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientFill: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
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
    fontFamily: typography.serif,
    color: colors.text,
    marginLeft: 12
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
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
    width: 60,
    height: 60,
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
    borderColor: colors.lightGray,
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
    color: colors.text
  },
  timestamp: {
    fontSize: 11,
    color: colors.textLight,
    alignSelf: 'flex-end'
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.lightGray
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  primaryButton: {
    backgroundColor: colors.primary
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
    color: colors.textSecondary,
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
    color: colors.success,
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
    borderTopColor: colors.lightGray,
    alignItems: 'flex-end'
  },
  input: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    maxHeight: 120,
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
  composerScanButton: {
    width: 44,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#f3f4f6'
  },
  choosingScroll: {
    flex: 1,
  },
  choosingContainer: {
    flexGrow: 1,
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
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 18,
    marginBottom: 12,
    ...shadows.soft,
  },
  modeCardContent: {
    marginLeft: 14,
    flex: 1
  },
  modeCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2
  },
  modeCardDescription: {
    fontSize: 13,
    color: colors.textSecondary
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
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 40,
  },
  entryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 10,
    ...shadows.soft,
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
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  entryCardMood: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  entryCardDate: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 6,
  },
  entryCardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  entryCardTag: {
    fontSize: 12,
    color: colors.primary,
    backgroundColor: 'rgba(93,134,214,0.10)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  scanPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(93,134,214,0.10)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginRight: 8,
  },
  scanPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4a6fb8',
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  scanSnippet: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 6,
    fontStyle: 'italic',
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
