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
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialize = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        await huxleyService.initialize(user.id);
      }
      huxleyService.setMode('adult_attachment_interview', { clearHistory: true });
    } catch (error) {
      console.error('[AttachmentReflection] Init error:', error);
      huxleyService.setMode('adult_attachment_interview', { clearHistory: true });
    } finally {
      setMessages([
        { id: Date.now(), text: OPENING_MESSAGE, isAI: true, timestamp: new Date() },
      ]);
      setInitializing(false);
    }
  };

  const sendMessage = async (overrideText) => {
    const text = (overrideText ?? inputText).trim();
    if (!text || loading) return;

    const userMessage = { id: Date.now(), text, isAI: false, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await huxleyService.chat(text);
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
      const summary = huxleyService.getSessionSummary() || {};
      const durationMin = Math.round((Date.now() - startTimeRef.current) / 1000 / 60);

      const { error } = await supabase.from('attachment_reflection_sessions').insert({
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
        session_duration_minutes: durationMin,
        session_notes: {
          phaseHistory: summary.phaseHistory || [],
          contextNotes: summary.stateDocument?.contextNotes || [],
        },
      });

      if (error) {
        console.error('[AttachmentReflection] Save error:', error);
        if (!silent) Alert.alert('Save failed', 'We could not save your reflection. Please try again.');
        return;
      }

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
