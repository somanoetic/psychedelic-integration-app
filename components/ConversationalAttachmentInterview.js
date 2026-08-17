import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import huxleyService from '../lib/huxleyService';
import { colors, gradients } from '../theme/colors';
import { ChatConversation } from './chat';

/**
 * Conversational Attachment Reflection
 *
 * A warm, guided walk through a reflective adaptation of the Adult Attachment
 * Interview (AAI). The user experiences a self-exploratory reflection — never a
 * diagnosis or attachment-style label. The mode handler quietly tracks a
 * tentative back-end pattern for practitioner orientation; that is saved with
 * the session but never surfaced in the UI.
 *
 * Architecture mirrors ConversationalNervousSystemMapping: drives huxleyService
 * in 'adult_attachment_interview' mode and renders via ChatConversation.
 */

const OPENING_MESSAGE =
  "I'd like to walk through some reflective questions about your early relationships and how they may have shaped the person you are today.\n\n" +
  "A few things first: there are no right answers, this is reflection and not assessment, and we can slow down, pause, or skip anything at any time. Some of these questions can stir up old feelings — if that happens, just let me know and we'll take care of you.\n\n" +
  "To begin gently: who raised you growing up? Who was around when you were small?";

const toChatMessages = (messages) =>
  messages.map((m) => ({
    id: m.id,
    role: m.isAI ? 'assistant' : 'user',
    content: m.text,
  }));

const ConversationalAttachmentInterview = ({ onComplete, navigation }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [sessionProgress, setSessionProgress] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [resumed, setResumed] = useState(false);
  const startTimeRef = useRef(Date.now());
  // Row we're writing to. Set on first save (or on resume) so every later
  // save updates that row instead of inserting a new one per turn.
  const sessionIdRef = useRef(null);
  // Minutes already banked from earlier sittings, so duration doesn't reset.
  const priorMinutesRef = useRef(0);
  // Mirror of `messages` for the checkpoint path — setState is async, so
  // reading state directly after an update can miss the latest turn.
  const messagesRef = useRef([]);
  // Set by loadInProgressSession to the text of an unanswered user message
  // when the restored transcript ends on one, so initialize() knows to
  // trigger a reply. Null when there's nothing pending.
  const pendingReplyRef = useRef(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialize = async () => {
    let restored = false;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        await huxleyService.initialize(user.id);
      }
      huxleyService.setMode('adult_attachment_interview', { clearHistory: true });
      if (user) restored = await loadInProgressSession(user.id);
    } catch (error) {
      console.error('[AttachmentReflection] Init error:', error);
      huxleyService.setMode('adult_attachment_interview', { clearHistory: true });
    } finally {
      if (!restored) {
        setMessages([
          { id: Date.now(), text: OPENING_MESSAGE, isAI: true, timestamp: new Date() },
        ]);
      }
      setInitializing(false);
    }

    // If we resumed onto a transcript that ends with the user's own message,
    // it was never answered (the interruption happened before the reply came
    // back). Have Huxley respond to it now instead of leaving it hanging —
    // the user shouldn't have to re-type or repeat themselves to continue.
    if (restored && pendingReplyRef.current) {
      const pendingText = pendingReplyRef.current;
      pendingReplyRef.current = null;
      sendMessage(pendingText, { skipEcho: true, resuming: true });
    }
  };

  /**
   * Look for the user's most recent UNFINISHED reflection and pick it up.
   * Returns true if a session was restored (so we skip the opening message).
   */
  const loadInProgressSession = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('attachment_reflection_sessions')
        .select('id, messages, handler_state, session_duration_minutes')
        .eq('user_id', userId)
        .eq('completed', false)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      const saved = data?.messages;
      // A row with no transcript can't be resumed meaningfully — start fresh.
      if (!data || !Array.isArray(saved) || saved.length === 0) return false;

      sessionIdRef.current = data.id;
      priorMinutesRef.current = data.session_duration_minutes || 0;

      // Rehydrate timestamps — they come back from JSONB as strings.
      setMessages(
        saved.map((m) => ({ ...m, timestamp: m.timestamp ? new Date(m.timestamp) : new Date() })),
      );

      const handler = huxleyService.getModeHandler();
      if (handler?.initializeWithContext && data.handler_state) {
        handler.initializeWithContext(data.handler_state);
        setSessionProgress(handler.getSessionProgress?.() || null);
      }

      // If the last saved turn was the user's, the interruption happened
      // before Huxley replied — that message was never processed. Hold it
      // out of the replayed history and back out of the handler_state that
      // was restored above; sendMessage() will push it through the normal
      // turn path in initialize() below, so it gets answered and captured
      // exactly like a live turn instead of being replayed as already-done.
      const lastSaved = saved[saved.length - 1];
      const hasPending = !!lastSaved && lastSaved.isAI === false;
      const historyToReplay = hasPending ? saved.slice(0, -1) : saved;
      pendingReplyRef.current = hasPending ? lastSaved.text : null;

      // Replay the transcript into conversation history so the AI remembers
      // what was already said, not just where the handler thinks we are.
      if (huxleyService.restoreHistory) {
        huxleyService.restoreHistory(
          historyToReplay.map((m) => ({ role: m.isAI ? 'assistant' : 'user', content: m.text })),
        );
      }

      setResumed(true);
      return true;
    } catch (error) {
      console.error('[AttachmentReflection] Resume load error:', error);
      return false;
    }
  };

  const sendMessage = async (overrideText, { skipEcho = false, resuming = false } = {}) => {
    const text = (overrideText ?? inputText).trim();
    if (!text || loading) return;

    // skipEcho: the pending-entry-on-resume path re-sends a message that's
    // already visible in `messages` from the loaded transcript — don't add
    // a second bubble for it.
    if (!skipEcho) {
      const userMessage = { id: Date.now(), text, isAI: false, timestamp: new Date() };
      setMessages((prev) => [...prev, userMessage]);
      setInputText('');
    }
    setLoading(true);

    try {
      const chatOptions = resuming
        ? {
            modeContext: {
              resuming: true,
              resumingGuidance:
                'The user just returned after stepping away mid-reflection. Their message ' +
                'below was never answered. Open with a brief, warm welcome back (a sentence, ' +
                'not a paragraph), then respond naturally to what they said.',
            },
          }
        : undefined;
      const response = await huxleyService.chat(text, chatOptions);
      const aiMessage = {
        id: Date.now() + 1,
        text: response.message,
        isAI: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      if (response.sessionProgress) {
        setSessionProgress(response.sessionProgress);
        if (response.sessionProgress.isComplete && !saved) {
          // Auto-save when the reflection arc completes.
          saveSession({ silent: true });
        }
      }

      // Checkpoint after every exchange so an interrupted reflection can be
      // picked up later. Fire-and-forget: a failed checkpoint must never
      // block or interrupt the conversation.
      persistProgress([...messagesRef.current]).catch((e) =>
        console.error('[AttachmentReflection] Checkpoint error:', e),
      );
    } catch (error) {
      console.error('[AttachmentReflection] Send error:', error);
      Alert.alert(
        'Connection trouble',
        "I'm having trouble responding right now. Please try again in a moment.",
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Write the current state to this session's row — inserting it the first
   * time, updating it thereafter. Used both for per-turn checkpoints and for
   * the final save, so there is exactly one row per reflection.
   *
   * Throws on failure; callers decide whether that's silent or surfaced.
   */
  const persistProgress = async (transcript) => {
    if (!currentUser) return;

    const summary = huxleyService.getSessionSummary() || {};
    const elapsedMin = Math.round((Date.now() - startTimeRef.current) / 1000 / 60);

    const row = {
      user_id: currentUser.id,
      phase: summary.phase || null,
      completed: !!summary.completed,
      caregivers: summary.caregivers || [],
      experiences: summary.experiences || {},
      caregiver_motivations: summary.caregiverMotivations || null,
      loss_disclosed: summary.lossDisclosed ?? null,
      loss_notes: summary.lossNotes || null,
      adult_effects: summary.adultEffects || null,
      integration_takeaway: summary.integrationTakeaway || null,
      // Practitioner-only hunch — stored, never rendered to the user.
      backend_pattern: summary.backendPattern || {},
      exchange_count: summary.exchangeCount || 0,
      session_duration_minutes: priorMinutesRef.current + elapsedMin,
      messages: (transcript || []).map((m) => ({
        id: m.id,
        text: m.text,
        isAI: m.isAI,
        timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
      })),
      // Cursors/counters so a resume lands mid-phase rather than replaying it.
      handler_state: summary,
      session_notes: {
        phaseHistory: summary.phaseHistory || [],
        contextNotes: summary.stateDocument?.contextNotes || [],
      },
    };

    if (sessionIdRef.current) {
      const { error } = await supabase
        .from('attachment_reflection_sessions')
        .update(row)
        .eq('id', sessionIdRef.current);
      if (error) throw error;
      return;
    }

    const { data, error } = await supabase
      .from('attachment_reflection_sessions')
      .insert(row)
      .select('id')
      .single();
    if (error) throw error;
    if (data?.id) sessionIdRef.current = data.id;
  };

  const saveSession = async ({ silent = false } = {}) => {
    if (saved) {
      if (!silent) onComplete?.();
      return;
    }
    if (!currentUser) {
      if (!silent) {
        Alert.alert('Not signed in', 'We could not save this reflection because you are not signed in.');
      }
      return;
    }

    setSaving(true);
    try {
      await persistProgress(messagesRef.current);
      setSaved(true);
      if (!silent) {
        Alert.alert('Reflection saved', 'Your attachment reflection has been saved.', [
          { text: 'Done', onPress: () => onComplete?.() },
        ]);
      }
    } catch (error) {
      console.error('[AttachmentReflection] Save error:', error);
      if (!silent) Alert.alert('Save failed', 'We could not save your reflection. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => (onComplete ? onComplete() : navigation?.goBack())}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Attachment Reflection</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {sessionProgress?.phaseLabel || 'A guided reflection on your early relationships'}
        </Text>
      </View>

      {resumed && (
        <View style={styles.resumedBanner}>
          <Text style={styles.resumedText}>
            Picking up where you left off. Take a moment to read back if you'd like.
          </Text>
        </View>
      )}

      {initializing && (
        <View style={styles.initializingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.initializingText}>Preparing the space...</Text>
        </View>
      )}
    </View>
  );

  const renderBelowMessages = () => {
    if (!sessionProgress || sessionProgress.phase === 'orientation') return null;

    if (sessionProgress.isComplete) {
      return (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.successButton]}
            onPress={() => saveSession()}
            disabled={saving}
          >
            <CheckCircle2 size={20} color="#fff" strokeWidth={2} />
            <Text style={styles.primaryButtonText}>{saved ? 'Done' : 'Finish & Save'}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.progressBar}>
        <Text style={styles.progressText}>{sessionProgress.phaseLabel}</Text>
      </View>
    );
  };

  const renderSavingOverlay = () => {
    if (!saving) return null;
    return (
      <View style={styles.savingOverlay} pointerEvents="auto">
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.savingText}>Saving your reflection...</Text>
      </View>
    );
  };

  const inputBlocked = loading || saving;

  return (
    <LinearGradient
      colors={gradients.standard}
      start={gradients.standardStart}
      end={gradients.standardEnd}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ChatConversation
          messages={toChatMessages(messages)}
          isTyping={loading}
          onSend={(text) => sendMessage(text)}
          inputText={inputText}
          onInputTextChange={setInputText}
          inputPlaceholder="Take your time..."
          inputDisabled={inputBlocked}
          header={renderHeader()}
          belowMessages={renderBelowMessages()}
          overlay={renderSavingOverlay()}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  backButton: { padding: 4, marginRight: 8 },
  headerContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: colors.text, marginLeft: 8 },
  headerSubtitle: { fontSize: 14, color: colors.text, opacity: 0.75, marginLeft: 40 },
  initializingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  initializingText: { fontSize: 14, color: colors.text, fontStyle: 'italic' },
  resumedBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  resumedText: {
    fontSize: 13,
    color: colors.text,
    opacity: 0.8,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  progressBar: { paddingHorizontal: 16, paddingVertical: 10 },
  progressText: {
    fontSize: 13,
    color: colors.text,
    opacity: 0.75,
    fontWeight: '500',
    textAlign: 'center',
  },
  actionButtons: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  successButton: { backgroundColor: colors.success },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingText: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 16 },
});

export default ConversationalAttachmentInterview;
