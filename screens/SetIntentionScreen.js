import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme/colors';
import { supabase } from '../lib/supabase';
import huxleyService from '../lib/huxleyService';
import intentionGuidanceService from '../lib/intentionGuidanceService';
import IntentionConversation from '../components/intention/IntentionConversation';
import IntentionTemplates from '../components/intention/IntentionTemplates';
import IntentionDraftEditor from '../components/intention/IntentionDraftEditor';
import IntentionPrivacyControls from '../components/intention/IntentionPrivacyControls';
import FrameworkSelector from '../components/intention/FrameworkSelector';
import SessionTypeSelector from '../components/intention/SessionTypeSelector';

/**
 * SetIntentionScreen - Main screen for AI-guided intention setting
 *
 * Features:
 * - Multi-stage conversational flow (welcome, exploration, formulation, refinement, review)
 * - AI-powered guidance based on framework and session type
 * - Template library for inspiration
 * - Draft editor with AI feedback
 * - Privacy-first storage (opt-in)
 * - Offline capability with AsyncStorage
 */
/**
 * Extract core intention from AI's confirm-stage message.
 * Strips framing ("Your intention is...") and closing advice
 * ("Hold it lightly...", "Let the medicine...").
 */
const extractCoreIntention = (aiMessage) => {
  if (!aiMessage) return '';

  // Split into sentences
  const sentences = aiMessage
    .replace(/\n/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);

  if (sentences.length === 0) return aiMessage;

  // Take the first sentence (the named intention) and clean it
  let intention = sentences[0];

  // Strip common AI framing prefixes
  const prefixes = [
    /^your\s+(intention|direction)\s+(is|seems?\s+to\s+be)[:\s]*/i,
    /^it\s+sounds?\s+like\s+(your\s+)?(intention|direction)\s+(is|would\s+be)[:\s]*/i,
    /^so\s+(your\s+)?(intention|direction)\s+(is|seems?)[:\s]*/i,
    /^what\s+i('m|\s+am)\s+hearing\s+is[:\s]*/i,
  ];
  for (const prefix of prefixes) {
    intention = intention.replace(prefix, '');
  }

  // Clean up: remove trailing period, trim
  intention = intention.replace(/\.$/, '').trim();

  // Capitalize first letter
  if (intention.length > 0) {
    intention = intention.charAt(0).toUpperCase() + intention.slice(1);
  }

  return intention;
};

// Module-level state persistence (survives navigation)
let persistedState = {
  mode: null,
  conversationId: null,
  conversationHistory: [],
  conversationStage: 'welcome',
  sessionType: 'general',
  framework: null,
  draftIntention: '',
};

const SetIntentionScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);

  // Route params
  const sessionId = route.params?.sessionId;
  const sessionData = route.params?.sessionData;

  // Restore from persisted state if available
  const hasPersistedConversation = persistedState.conversationHistory.length > 0;

  // Screen mode: 'welcome', 'conversation', 'templates', 'draft', 'review'
  const [mode, setMode] = useState(hasPersistedConversation ? (persistedState.mode || 'conversation') : 'welcome');

  // Authenticated user ID (resolved from Supabase auth in initializeScreen)
  const [userId, setUserId] = useState(null);

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState(null);

  // Conversation state
  const [conversationId, setConversationId] = useState(persistedState.conversationId);
  const [conversationHistory, setConversationHistory] = useState(persistedState.conversationHistory);
  const [conversationStage, setConversationStage] = useState(persistedState.conversationStage);

  // User selections
  const [sessionType, setSessionType] = useState(persistedState.sessionType);
  const [framework, setFramework] = useState(persistedState.framework);
  const [nervousSystemState, setNervousSystemState] = useState('ventral');

  // Templates
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Draft intention
  const [draftIntention, setDraftIntention] = useState(persistedState.draftIntention);
  const [extractedIntention, setExtractedIntention] = useState(null);
  const [draftFeedback, setDraftFeedback] = useState(null);
  const [analyzingDraft, setAnalyzingDraft] = useState(false);

  // User preferences
  const [userPreferences, setUserPreferences] = useState(null);
  const [saveToDatabase, setSaveToDatabase] = useState(false);

  // Offline support
  const [offline, setOffline] = useState(false);

  // Track pending AI request so follow-up messages can cancel + re-request
  const pendingRequestRef = useRef(null);

  // Persist state to module-level variable on changes
  useEffect(() => {
    persistedState = {
      mode,
      conversationId,
      conversationHistory,
      conversationStage,
      sessionType,
      framework,
      draftIntention,
    };
  }, [mode, conversationId, conversationHistory, conversationStage, sessionType, framework, draftIntention]);

  // Initialize on mount
  useEffect(() => {
    initializeScreen();
  }, []);

  // Load cached data
  useEffect(() => {
    loadCachedData();
  }, [sessionId, userId]);

  // Save conversation to cache periodically
  useEffect(() => {
    if (conversationHistory.length > 0) {
      saveCachedConversation();
    }
  }, [conversationHistory]);

  /**
   * Initialize the screen - load user preferences and templates
   */
  const initializeScreen = async () => {
    try {
      setInitializing(true);
      setError(null);

      // SEC-002: Always resolve user identity from Supabase auth, not route params
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Not authenticated. Please log in.');
      }
      const authenticatedUserId = user.id;
      setUserId(authenticatedUserId);

      // Load user preferences
      const prefs = await intentionGuidanceService.getUserPreferences(authenticatedUserId);
      setUserPreferences(prefs);
      setSaveToDatabase(prefs?.save_by_default || false);

      // Set default framework from preferences
      if (prefs?.favorite_frameworks && prefs.favorite_frameworks.length > 0) {
        setFramework(prefs.favorite_frameworks[0]);
      }

      setInitializing(false);
    } catch (err) {
      if (__DEV__) console.error('Error initializing screen:', err);
      setError(err.message || 'Failed to load preferences');
      setInitializing(false);
      setOffline(true); // Allow offline usage
    }
  };

  /**
   * Load cached conversation data from AsyncStorage
   */
  const loadCachedData = async () => {
    try {
      const cacheKey = `intention_draft_${userId}_${sessionId || 'general'}`;
      const cached = await AsyncStorage.getItem(cacheKey);

      if (cached) {
        const data = JSON.parse(cached);
        if (data.draftIntention) setDraftIntention(data.draftIntention);
        if (data.sessionType) setSessionType(data.sessionType);
        if (data.framework) setFramework(data.framework);
        if (data.conversationHistory) setConversationHistory(data.conversationHistory);
        if (data.conversationId) setConversationId(data.conversationId);
      }
    } catch (err) {
      console.error('Error loading cached data:', err);
    }
  };

  /**
   * Save conversation to AsyncStorage cache
   */
  const saveCachedConversation = async () => {
    try {
      const cacheKey = `intention_draft_${userId}_${sessionId || 'general'}`;
      const data = {
        draftIntention,
        sessionType,
        framework,
        conversationHistory,
        conversationId,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (err) {
      console.error('Error saving cached data:', err);
    }
  };

  /**
   * Clear cached conversation
   */
  const clearCachedConversation = async () => {
    try {
      const cacheKey = `intention_draft_${userId}_${sessionId || 'general'}`;
      await AsyncStorage.removeItem(cacheKey);
      // Also clear module-level persisted state
      persistedState = {
        mode: null,
        conversationId: null,
        conversationHistory: [],
        conversationStage: 'welcome',
        sessionType: 'general',
        framework: null,
        draftIntention: '',
      };
    } catch (err) {
      console.error('Error clearing cached data:', err);
    }
  };

  /**
   * Start the intention conversation
   */
  const handleStartConversation = async () => {
    try {
      setLoading(true);
      setError(null);

      huxleyService.setMode('intention', { clearHistory: true });
      const response = await huxleyService.chat('', {
        phase: 'welcome',
        modeContext: {
          userId,
          sessionId,
          sessionType,
          framework,
          nervousSystemState,
          stateConfidence: 0.7,
        },
      });

      setConversationId(Date.now().toString());
      setConversationHistory([
        {
          role: 'assistant',
          content: response.message,
          timestamp: Date.now(),
        }
      ]);
      setConversationStage(response.phase || 'welcome');
      setTemplates([]);
      setMode('conversation');
      setLoading(false);
    } catch (err) {
      console.error('Error starting conversation:', err);
      setError(err.message || 'Failed to start conversation');
      setLoading(false);
      setOffline(true);

      // Fallback to offline mode
      Alert.alert(
        'Offline Mode',
        'AI guidance is not available. You can still browse templates or write your intention manually.',
        [
          { text: 'Browse Templates', onPress: () => setMode('templates') },
          { text: 'Write Manually', onPress: () => setMode('draft') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  /**
   * Send a message in the conversation
   */
  const handleSendMessage = async (message) => {
    try {
      // Add user message to history
      const userMessage = {
        role: 'user',
        content: message,
        timestamp: Date.now(),
      };

      // If there's already a pending request, cancel it — user is adding a follow-up
      if (pendingRequestRef.current) {
        pendingRequestRef.current.cancelled = true;
      }

      setConversationHistory(prev => [...prev, userMessage]);
      setLoading(true);

      // Create a request token so we can detect if this request was superseded
      const requestToken = { cancelled: false };
      pendingRequestRef.current = requestToken;

      // Brief delay — if user is typing quickly, give them a moment to send more
      await new Promise(resolve => setTimeout(resolve, 800));

      // If user sent another message while we waited, abandon this request
      if (requestToken.cancelled) return;

      const response = await huxleyService.chat(message, {
        phase: conversationStage,
      });

      // If this request was superseded by a newer one, don't add the response
      if (requestToken.cancelled) return;

      pendingRequestRef.current = null;

      // Add AI response to history
      const aiMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: Date.now(),
        suggestedActions: response.therapeuticData?.suggestedActions || [],
      };
      setConversationHistory(prev => [...prev, aiMessage]);
      setConversationStage(response.phase || conversationStage);

      setLoading(false);
    } catch (err) {
      // If cancelled, don't show error
      if (pendingRequestRef.current?.cancelled) return;

      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
      setLoading(false);
      pendingRequestRef.current = null;

      // Add error message
      const errorMessage = {
        role: 'assistant',
        content: "I'm having trouble connecting right now. You can continue writing your intention in the draft editor, or browse templates for inspiration.",
        timestamp: Date.now(),
        isError: true,
      };
      setConversationHistory(prev => [...prev, errorMessage]);
    }
  };

  /**
   * Load templates from database
   */
  const handleLoadTemplates = async (filterFramework, filterSessionType) => {
    try {
      setLoading(true);
      const loadedTemplates = await intentionGuidanceService.getTemplates(
        filterFramework || framework,
        filterSessionType || sessionType,
        20
      );
      setTemplates(loadedTemplates);
      setLoading(false);
    } catch (err) {
      console.error('Error loading templates:', err);
      setError('Failed to load templates');
      setLoading(false);
    }
  };

  /**
   * Use a template as starting point
   */
  const handleUseTemplate = (template) => {
    setSelectedTemplate(template);
    setDraftIntention(template.intention_text);
    setMode('draft');
  };

  /**
   * Analyze draft intention
   */
  const handleAnalyzeDraft = async () => {
    if (!draftIntention || draftIntention.trim().length === 0) {
      Alert.alert('No Intention', 'Please write your intention first.');
      return;
    }

    try {
      setAnalyzingDraft(true);
      const response = await huxleyService.chat(
        `Please analyze this draft intention and provide feedback: "${draftIntention}"`,
        { phase: 'refinement' }
      );
      setDraftFeedback({ message: response.message, ...response.therapeuticData });
      setAnalyzingDraft(false);
    } catch (err) {
      console.error('Error analyzing draft:', err);
      Alert.alert('Analysis Failed', 'Could not analyze your intention. Please try again.');
      setAnalyzingDraft(false);
    }
  };

  /**
   * Save intention to database (opt-in)
   */
  const handleSaveIntention = async () => {
    if (!draftIntention || draftIntention.trim().length === 0) {
      Alert.alert('No Intention', 'Please write your intention first.');
      return;
    }

    if (!saveToDatabase) {
      // Just confirm and go back
      Alert.alert(
        'Intention Set',
        'Your intention is ready. It will be saved locally on your device.',
        [
          {
            text: 'OK',
            onPress: () => {
              clearCachedConversation();
              navigation.goBack();
            }
          }
        ]
      );
      return;
    }

    try {
      setLoading(true);

      await intentionGuidanceService.saveIntention({
        user_id: userId,
        session_id: sessionId,
        intention_text: draftIntention,
        framework,
        session_type: sessionType,
        ai_conversation_context: {
          prompt_count: conversationHistory.filter(m => m.role === 'user').length,
          frameworks_explored: [framework],
          session_duration_seconds: Math.floor((Date.now() - conversationHistory[0]?.timestamp) / 1000),
        },
        inspired_by_template_id: selectedTemplate?.id || null,
      });

      setLoading(false);

      Alert.alert(
        'Intention Saved',
        'Your intention has been saved securely.',
        [
          {
            text: 'OK',
            onPress: () => {
              clearCachedConversation();
              navigation.goBack();
            }
          }
        ]
      );
    } catch (err) {
      console.error('Error saving intention:', err);
      setLoading(false);
      Alert.alert('Save Failed', err.message || 'Could not save your intention. Please try again.');
    }
  };

  /**
   * Render Welcome Mode
   */
  const renderWelcome = () => (
    <View style={styles.welcomeContainer}>
      <View style={styles.welcomeHeader}>
        <MaterialIcons name="spa" size={64} color={colors.primary} />
        <Text style={styles.welcomeTitle}>Set Your Intention</Text>
        <Text style={styles.welcomeSubtitle}>
          Let me guide you in crafting a meaningful intention for your session.
          This intention will help you stay focused and aligned.
        </Text>
      </View>

      {/* Session Type Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>What type of session is this?</Text>
        <SessionTypeSelector
          selectedType={sessionType}
          onSelectType={setSessionType}
        />
      </View>

      {/* Framework Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Choose a framework (optional)</Text>
        <FrameworkSelector
          selectedFramework={framework}
          onSelectFramework={setFramework}
        />
      </View>

      {/* Privacy Controls */}
      <View style={styles.section}>
        <IntentionPrivacyControls
          saveToDatabase={saveToDatabase}
          onToggle={setSaveToDatabase}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.welcomeActions}>
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleStartConversation}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <>
              <MaterialIcons name="chat" size={20} color={colors.textInverse} />
              <Text style={styles.primaryButtonText}>Start Conversation</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => {
            handleLoadTemplates(framework, sessionType);
            setMode('templates');
          }}
          disabled={loading}
          activeOpacity={0.8}
        >
          <MaterialIcons name="library-books" size={20} color={colors.primary} />
          <Text style={styles.secondaryButtonText}>Browse Templates</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.textButton}
          onPress={() => setMode('draft')}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.textButtonText}>Write It Myself</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  /**
   * Render mode-specific content
   */
  const renderContent = () => {
    if (mode === 'welcome') {
      return renderWelcome();
    }

    if (mode === 'conversation') {
      return (
        <IntentionConversation
          conversationHistory={conversationHistory}
          onSendMessage={handleSendMessage}
          loading={loading}
          conversationStage={conversationStage}
          nervousSystemState={nervousSystemState}
          onViewTemplates={() => setMode('templates')}
          onEditDraft={() => setMode('draft')}
          onActionPress={(action) => {
            if (action.type === 'save_intention' || action.type === 'review_intention' || action.type === 'edit_draft') {
              // Extract core intention from the AI's confirm-stage message
              const aiMessages = conversationHistory
                .filter(m => m.role === 'assistant' && !m.isError);
              if (aiMessages.length > 0) {
                const raw = aiMessages[aiMessages.length - 1].content;
                const extracted = extractCoreIntention(raw);
                setExtractedIntention(extracted);
              }
              // Clear draft so user writes in their own words
              if (!draftIntention || draftIntention.trim().length === 0) {
                setDraftIntention('');
              }
              setMode('draft');
            } else if (action.type === 'explore_template' || action.type === 'browse_templates') {
              setMode('templates');
            } else if (action.message) {
              handleSendMessage(action.message);
            }
          }}
          disabled={loading}
        />
      );
    }

    if (mode === 'templates') {
      return (
        <IntentionTemplates
          templates={templates}
          framework={framework}
          sessionType={sessionType}
          onSelectTemplate={handleUseTemplate}
          onFilterChange={(newFramework, newSessionType) => {
            handleLoadTemplates(newFramework, newSessionType);
          }}
          loading={loading}
        />
      );
    }

    if (mode === 'draft') {
      return (
        <IntentionDraftEditor
          draftIntention={draftIntention}
          onChangeDraft={setDraftIntention}
          feedback={draftFeedback}
          onAnalyze={handleAnalyzeDraft}
          analyzingDraft={analyzingDraft}
          onSave={handleSaveIntention}
          onExploreDeeper={(intentionText) => {
            setMode('conversation');
            handleSendMessage(`I'd like to explore this intention more deeply: "${intentionText}"`);
          }}
          fromConversation={conversationHistory.length > 1}
          extractedIntention={extractedIntention}
          saveToDatabase={saveToDatabase}
          loading={loading}
        />
      );
    }

    return null;
  };

  /**
   * Render tab navigation at bottom
   */
  const renderTabBar = () => {
    if (mode === 'welcome') return null;

    const tabs = [
      { key: 'conversation', label: 'Conversation', icon: 'chat' },
      { key: 'templates', label: 'Templates', icon: 'library-books' },
      { key: 'draft', label: 'Draft', icon: 'edit' },
    ];

    return (
      <View style={styles.tabBar}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, mode === tab.key && styles.tabActive]}
            onPress={() => setMode(tab.key)}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={tab.icon}
              size={24}
              color={mode === tab.key ? colors.primary : colors.textSecondary}
            />
            <Text style={[
              styles.tabLabel,
              mode === tab.key && styles.tabLabelActive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Loading state
  if (initializing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient colors={gradients.warm} start={{ x: 1.0, y: 0.0 }} end={{ x: 0.0, y: 1.0 }} style={styles.headerGradient}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back" size={24} color={colors.textInverse} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Set Your Intention</Text>
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Preparing...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { paddingBottom: insets.bottom }]}
      edges={['top']}
    >
      {/* Header */}
      <LinearGradient colors={gradients.warm} start={{ x: 1.0, y: 0.0 }} end={{ x: 0.0, y: 1.0 }} style={styles.headerGradient}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (draftIntention && draftIntention.trim().length > 0) {
                Alert.alert(
                  'Save Draft?',
                  'You have an unsaved intention. Do you want to save it?',
                  [
                    { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
                    { text: 'Save', onPress: handleSaveIntention },
                    { text: 'Cancel', style: 'cancel' }
                  ]
                );
              } else {
                navigation.goBack();
              }
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.textInverse} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Set Your Intention</Text>
        </View>
        {sessionData?.title && (
          <Text style={styles.headerSubtitle}>{sessionData.title}</Text>
        )}
      </LinearGradient>

      {/* Error banner */}
      {error && mode !== 'welcome' && (
        <View style={styles.errorBanner}>
          <MaterialIcons name="cloud-off" size={20} color={colors.warning} />
          <Text style={styles.errorBannerText}>
            {offline ? 'Working offline' : error}
          </Text>
        </View>
      )}

      {/* Main Content - conversation mode gets its own layout (no outer ScrollView) */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {mode === 'conversation' || mode === 'templates' ? (
          <View style={styles.conversationContainer}>
            {renderContent()}
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {renderContent()}
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {/* Tab Bar Navigation */}
      {renderTabBar()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textInverse,
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textInverse,
    opacity: 0.9,
    marginLeft: 44,
    marginTop: 2,
  },
  keyboardAvoid: {
    flex: 1,
  },
  conversationContainer: {
    flex: 1,
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    color: colors.textInverse,
  },

  // Welcome Mode
  welcomeContainer: {
    flex: 1,
  },
  welcomeHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  welcomeActions: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    ...shadows.soft,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  textButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  textButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingVertical: spacing.sm,
    ...shadows.soft,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  tabActive: {
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  tabLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default SetIntentionScreen;
