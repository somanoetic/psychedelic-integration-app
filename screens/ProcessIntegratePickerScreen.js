/**
 * Process & Integrate — session picker
 *
 * The "Process & Integrate" tile lands here. You pick which session to process,
 * then go to the session-scoped Process & Integrate screen. You can also start
 * a NEW session here without preparation — for someone who comes to this after
 * their journey and didn't get to prepare. In that case we still surface a
 * gentle note that preparation matters, with links to prep / inner-work
 * resources to support the processing.
 *
 * In-progress sessions show by default (ready-to-process ones first); closed
 * sessions are tucked behind a toggle. Full archive lives in the History tab.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft,
  PlusCircle,
  Calendar,
  ChevronRight,
  CheckCircle2,
  History,
  Lightbulb,
  Sparkles,
  Compass,
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { colors, gradients, spacing, borderRadius, shadows, typography } from '../theme/colors';
import { icons } from '../lib/uiIcons';
import { getSessionStatus, isClosed, isReadyToProcess } from '../lib/sessionLifecycle';

const ProcessIntegratePickerScreen = ({ navigation }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('list'); // 'list' | 'create'
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [showClosed, setShowClosed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          setLoading(true);
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError || !user) {
            console.error('Auth error loading sessions:', userError);
            return;
          }
          const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);
          if (cancelled) return;
          if (error) {
            console.error('Error loading sessions:', error);
          } else {
            setSessions(data || []);
          }
        } catch (err) {
          console.error('Unexpected error loading sessions:', err);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => { cancelled = true; };
    }, [])
  );

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // Open sessions, with ready-to-process surfaced first (journey has happened
  // or prep underway) so the user lands on what's actually ready to process.
  const openSessions = sessions
    .filter((s) => !isClosed(s))
    .sort((a, b) => (isReadyToProcess(b) ? 1 : 0) - (isReadyToProcess(a) ? 1 : 0));
  const closedSessions = sessions.filter((s) => isClosed(s));
  const visibleSessions = showClosed ? [...openSessions, ...closedSessions] : openSessions;

  const createSession = async () => {
    if (isCreating) return;
    try {
      setIsCreating(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        showAlert('Authentication Error', 'Please log in again');
        return;
      }

      const userProvidedTitle = newTitle.trim().length > 0;
      const newSession = {
        user_id: user.id,
        title: userProvidedTitle
          ? newTitle.trim()
          : `Session ${new Date().toLocaleDateString()}`,
        journey_date: newDate,
        current_step: 1,
        session_data: {
          sessionType: 'full_session',
          // Created from the processing side, prep skipped.
          conversationMode: 'integration',
          createdWithoutPrep: true,
          titleIsDefault: !userProvidedTitle,
          sessionInfo: {},
          preparation: {},
          experienceProcessing: {},
          integration: {},
        },
      };

      const { data, error } = await supabase
        .from('sessions')
        .insert([newSession])
        .select()
        .single();

      if (error) {
        showAlert('Error', `Failed to create session: ${error.message}`);
        return;
      }
      setNewTitle('');
      setNewDate(new Date().toISOString().split('T')[0]);
      setMode('list');
      navigation.navigate('ProcessIntegrate', { session: data });
    } catch (err) {
      showAlert('Error', `Failed to create session: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const renderHeader = (onBack) => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );

  // Create flow — new session straight into processing, with a gentle nudge
  // that preparation supports integration and links to resources.
  const renderCreate = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {renderHeader(() => setMode('list'))}

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>New Session</Text>
        <Text style={styles.heroSubtitle}>
          For processing an experience you've already had. You can name it now or
          leave it blank.
        </Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.inputLabel}>Session Title (optional)</Text>
        <TextInput
          style={styles.textInput}
          value={newTitle}
          onChangeText={setNewTitle}
          placeholder="e.g., Autumn Journey"
          placeholderTextColor={colors.textLight}
          spellCheck={true}
          autoCorrect={true}
          autoCapitalize="sentences"
        />

        <Text style={styles.inputLabel}>Journey Date</Text>
        <TextInput
          style={styles.textInput}
          value={newDate}
          onChangeText={setNewDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textLight}
        />
      </View>

      {/* Gentle prep-importance note + resource links */}
      <View style={styles.noteBox}>
        <View style={styles.noteTitleRow}>
          <Lightbulb size={18} color={colors.primary} strokeWidth={2} />
          <Text style={styles.noteTitle}>A note on preparation</Text>
        </View>
        <Text style={styles.noteText}>
          It's completely okay to process a session you didn't formally prepare
          for. Preparation — setting intentions and grounding — tends to deepen
          integration, so these may help as you reflect:
        </Text>
        <TouchableOpacity
          style={styles.resourceLink}
          onPress={() => navigation.navigate('GeneralPreparation')}
          activeOpacity={0.7}
        >
          <Sparkles size={16} color={colors.primary} strokeWidth={2} />
          <Text style={styles.resourceLinkText}>Foundation preparation</Text>
          <ChevronRight size={16} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.resourceLink}
          onPress={() => navigation.navigate('InnerWork')}
          activeOpacity={0.7}
        >
          <Compass size={16} color={colors.primary} strokeWidth={2} />
          <Text style={styles.resourceLinkText}>Inner Work</Text>
          <ChevronRight size={16} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={createSession}
        disabled={isCreating}
        activeOpacity={0.85}
      >
        {isCreating ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <CheckCircle2 size={20} color={colors.white} strokeWidth={2} />
            <Text style={styles.primaryButtonText}>Create & start processing</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.textButton} onPress={() => setMode('list')}>
        <Text style={styles.textButtonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderList = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {renderHeader(() => navigation.goBack())}

      <View style={styles.hero}>
        <Image source={icons.singlePuzzlePiece} style={styles.heroIcon} />
        <Text style={styles.heroTitle}>Process & Integrate</Text>
        <Text style={styles.heroSubtitle}>
          Choose a session to process, or start a new one.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.newSessionButton}
        onPress={() => setMode('create')}
        activeOpacity={0.85}
      >
        <PlusCircle size={22} color={colors.white} strokeWidth={2} />
        <Text style={styles.newSessionButtonText}>Start a new session</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : visibleSessions.length > 0 ? (
        <>
          <Text style={styles.sectionLabel}>Select a session</Text>
          {visibleSessions.map((session) => {
            const status = getSessionStatus(session);
            return (
              <TouchableOpacity
                key={session.id}
                style={styles.sessionCard}
                onPress={() => navigation.navigate('ProcessIntegrate', { session })}
                activeOpacity={0.7}
              >
                <View style={styles.sessionCardMain}>
                  <Text style={styles.sessionCardTitle} numberOfLines={1}>
                    {session.title}
                  </Text>
                  <View style={styles.sessionCardMetaRow}>
                    <Calendar size={13} color={colors.textSecondary} strokeWidth={2} />
                    <Text style={styles.sessionCardDate}>
                      {formatDate(session.journey_date)}
                    </Text>
                    <Text style={styles.sessionCardDot}>·</Text>
                    {status.icon ? (
                      <Image source={status.icon} style={styles.statusIcon} />
                    ) : null}
                    <Text style={styles.sessionCardStatus}>{status.text}</Text>
                  </View>
                </View>
                <ChevronRight size={22} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            );
          })}
        </>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            {sessions.length === 0
              ? 'No sessions yet. Tap “Start a new session” to begin processing.'
              : 'No sessions in progress. Start a new one, or show closed sessions below.'}
          </Text>
        </View>
      )}

      {!loading && closedSessions.length > 0 && (
        <TouchableOpacity
          style={styles.toggleLink}
          onPress={() => setShowClosed((v) => !v)}
          activeOpacity={0.7}
        >
          <Text style={styles.toggleLinkText}>
            {showClosed ? 'Hide closed sessions' : `Show closed sessions (${closedSessions.length})`}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.archiveLink}
        onPress={() => navigation.navigate('History')}
        activeOpacity={0.7}
      >
        <History size={18} color={colors.primary} strokeWidth={2} />
        <Text style={styles.archiveLinkText}>See all sessions</Text>
        <ChevronRight size={18} color={colors.textSecondary} strokeWidth={2} />
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={gradients.standard}
        start={gradients.standardStart}
        end={gradients.standardEnd}
        style={styles.gradientFill}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {mode === 'create' ? renderCreate() : renderList()}
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientFill: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  heroIcon: {
    width: 160,
    height: 160,
    marginBottom: spacing.md,
    resizeMode: 'contain',
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: typography.serif,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  newSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  newSessionButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.3,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  sessionCardMain: {
    flex: 1,
  },
  sessionCardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  sessionCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sessionCardDate: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  sessionCardDot: {
    fontSize: 13,
    color: colors.textLight,
  },
  statusIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  sessionCardStatus: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  archiveLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.md,
  },
  archiveLinkText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  toggleLink: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  toggleLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptyBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  textInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: colors.sand,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  noteBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    marginBottom: spacing.lg,
  },
  noteTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  noteText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  resourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  resourceLinkText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    ...shadows.soft,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.3,
  },
  textButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  textButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

export default ProcessIntegratePickerScreen;
