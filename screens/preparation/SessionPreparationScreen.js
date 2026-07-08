import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const toTitleCase = (str) =>
  str.replace(/\b\w/g, (c) => c.toUpperCase());
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Lightbulb,
  Sparkles,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import sessionChecklistService from '../../lib/sessionChecklistService';
import { colors, gradients, spacing, borderRadius, shadows, typography } from '../../theme/colors';
import { icons } from '../../lib/uiIcons';

const SessionPreparationScreen = ({ navigation, route }) => {
  const { sessionId: passedSessionId, sessionData } = route.params || {};
  const [sessionId, setSessionId] = useState(passedSessionId || null);
  const [currentSession, setCurrentSession] = useState(sessionData || null);
  const [currentSection, setCurrentSection] = useState('overview');
  const [completedSections, setCompletedSections] = useState([]);
  // Gate the auto-save effect so it doesn't fire with empty state on the
  // initial render and overwrite previously-saved preparation data.
  const hasLoadedRef = useRef(false);

  // Session Info
  const [sessionTitle, setSessionTitle] = useState(sessionData?.title || '');
  const [journeyDate, setJourneyDate] = useState(
    sessionData?.journey_date || new Date().toISOString().split('T')[0]
  );
  const [medicine, setMedicine] = useState('');
  const [dosage, setDosage] = useState('');
  const [setting, setSetting] = useState('');
  const [facilitator, setFacilitator] = useState('');
  const [participants, setParticipants] = useState('');
  const [sessionContext, setSessionContext] = useState('');

  // Intention Setting
  const [selectedIntentionCategory, setSelectedIntentionCategory] = useState('');
  const [customIntention, setCustomIntention] = useState('');
  const [showIntentionModal, setShowIntentionModal] = useState(false);

  // Check-ins
  const [nervousSystemState, setNervousSystemState] = useState('');
  const [nervousSystemNotes, setNervousSystemNotes] = useState('');
  const [activeParts, setActiveParts] = useState([]);
  const [partsNotes, setPartsNotes] = useState('');

  // Ref to the intention step's ScrollView so we can scroll the custom-intention
  // TextInput (which sits low on the screen) above the keyboard on focus. With
  // windowSoftInputMode="adjustResize" the window shrinks but the ScrollView does
  // not auto-scroll the focused input, so without this the keyboard covers it.
  const intentionScrollRef = useRef(null);

  // When the keyboard opens on the intention step, scroll the low-sitting
  // custom-intention field (and Save button) into view. Mirrors DailyJournal's
  // device-verified pattern: listen for the keyboard show event (fires after the
  // window has resized) rather than guessing a timeout off onFocus.
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const showSub = Keyboard.addListener(showEvent, () => {
      if (currentSection !== 'intention_setting') return;
      setTimeout(() => {
        intentionScrollRef.current?.scrollToEnd({ animated: true });
      }, 150);
    });
    return () => showSub.remove();
  }, [currentSection]);

  // This screen is always reached from the Prepare for a Journey hub with a
  // concrete sessionId/sessionData, so it no longer silently creates a session
  // on mount (that previously produced an unnamed "ghost" session the user
  // never asked for). New sessions are created deliberately from the hub.
  // If somehow opened without a session, we just warn rather than fabricate one.
  useEffect(() => {
    if (!sessionId) {
      console.warn('SessionPreparation opened without a sessionId; expected to be reached from the Prepare hub.');
    }
  }, [sessionId]);

  // When this screen regains focus (e.g. after returning from the
  // SessionChecklistScreen), check whether the day-of checklist is complete
  // and auto-mark the section. Without this, completing the checklist would
  // not register here and the "Begin Session Preparation" button would loop
  // back to intention setting.
  useFocusEffect(
    useCallback(() => {
      if (!sessionId) return;
      let cancelled = false;
      (async () => {
        try {
          // Establish (or reuse) a "prep started at" timestamp for this session.
          // We use it to detect whether the user has just completed a check-in
          // in the standalone tracker screens.
          const startedKey = `prep_started_${sessionId}`;
          let startedAt = await AsyncStorage.getItem(startedKey);
          if (!startedAt) {
            startedAt = new Date().toISOString();
            await AsyncStorage.setItem(startedKey, startedAt);
          }

          const { data: { user } } = await supabase.auth.getUser();

          // ---- Session Day Checklist ----
          // Two ways it can count as done:
          //   1. User explicitly tapped "Mark Checklist Complete"
          //   2. Every DB-tracked item is checked
          const userFlag = await AsyncStorage.getItem(`checklist_user_complete_${sessionId}`);
          let checklistDone = userFlag === 'true';
          if (!checklistDone) {
            const cl = await sessionChecklistService.getOrCreateChecklist(sessionId);
            if (cl && cl.totalItems > 0 && cl.completedItems >= cl.totalItems) {
              checklistDone = true;
            }
          }

          // ---- Nervous System & Parts check-ins ----
          // Considered complete if the user logged a check-in in the
          // standalone tracker after this prep session was started.
          let nsDone = false;
          let partsDone = false;
          if (user) {
            const [{ data: nsRows }, { data: partsRows }] = await Promise.all([
              supabase
                .from('nervous_system_checkins')
                .select('id')
                .eq('user_id', user.id)
                .gte('created_at', startedAt)
                .limit(1),
              supabase
                .from('parts_checkins')
                .select('id')
                .eq('user_id', user.id)
                .gte('created_at', startedAt)
                .limit(1),
            ]);
            nsDone = !!(nsRows && nsRows.length > 0);
            partsDone = !!(partsRows && partsRows.length > 0);
          }

          if (cancelled) return;

          setCompletedSections(prev => {
            const set = new Set(prev);
            const apply = (id, done) => {
              if (done) set.add(id);
              else set.delete(id);
            };
            apply('session_day_prep', checklistDone);
            // Only add for NS/Parts — don't auto-remove, so a manual mark
            // earlier in the flow isn't undone by network hiccups.
            if (nsDone) set.add('nervous_system_checkin');
            if (partsDone) set.add('parts_checkin');
            const next = [...set];
            // Avoid spurious state updates when nothing changed
            if (next.length === prev.length && next.every(s => prev.includes(s))) {
              return prev;
            }
            return next;
          });
        } catch (err) {
          console.error('Error checking section completion:', err);
        }
      })();
      return () => { cancelled = true; };
    }, [sessionId])
  );

  // Persist preparation data whenever the completed-sections list changes
  // (covers both manual marks and the auto-mark above). Skipped until the
  // initial load has finished so we don't overwrite saved data with empties.
  useEffect(() => {
    if (!sessionId) return;
    if (!hasLoadedRef.current) return;
    savePreparationData();
    // savePreparationData reads other state via closure; we deliberately
    // depend on completedSections so writes happen on completion changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedSections, sessionId]);

  // Load existing session data if available
  useEffect(() => {
    if (sessionData) {
      const prep = sessionData.session_data?.preparation || sessionData.preparation || {};
      const info = sessionData.session_data?.sessionInfo || {};
      // Session info — fall back to sessionInfo so data saved via SessionInfoHeader
      // shows up here too.
      setSessionTitle(sessionData.title || '');
      setJourneyDate(sessionData.journey_date || new Date().toISOString().split('T')[0]);
      setMedicine(prep.medicine || info.medicine || '');
      setDosage(prep.dosage || info.dosage || '');
      setSetting(prep.setting || info.setting || '');
      setFacilitator(prep.facilitator || info.facilitator || '');
      setParticipants(prep.participants || info.participants || '');
      setSessionContext(prep.sessionContext || info.context || '');
      // Intention
      setCustomIntention(prep.intention || '');
      setSelectedIntentionCategory(prep.intentionCategory || '');
      // Check-ins
      setNervousSystemState(prep.nervousSystemState || '');
      setNervousSystemNotes(prep.nervousSystemNotes || '');
      setActiveParts(prep.activeParts || []);
      setPartsNotes(prep.partsNotes || '');
      setCompletedSections(prep.completedSections || []);
    }
    hasLoadedRef.current = true;
  }, [sessionData]);

  // Save preparation data to session
  const savePreparationData = async () => {
    if (!sessionId) return;

    try {
      const currentSessionData = currentSession?.session_data || sessionData?.session_data || {};

      const trimmedMedicine = medicine.trim();
      const previousMedicine =
        (currentSessionData?.sessionInfo?.medicine || currentSessionData?.preparation?.medicine || '').trim();
      const titleWasDefault = currentSessionData?.titleIsDefault === true;
      const userTouchedTitle = sessionTitle && sessionTitle.trim() && sessionTitle.trim() !== (currentSession?.title || '');
      const firstMedicineFill = !previousMedicine && !!trimmedMedicine;

      let nextTitle = sessionTitle?.trim() || currentSession?.title || '';
      let nextTitleIsDefault = currentSessionData?.titleIsDefault;

      // Auto-rename to "[Medicine] Session [N] - [Date]" the first time medicine
      // is set, unless the user has typed a custom title here.
      if (firstMedicineFill && titleWasDefault && !userTouchedTitle) {
        const { count, error: countError } = await supabase
          .from('sessions')
          .select('id', { count: 'exact', head: true })
          .ilike('session_data->sessionInfo->>medicine', trimmedMedicine)
          .neq('id', sessionId);

        if (!countError) {
          const sessionNumber = (count || 0) + 1;
          const dateLabel = new Date(journeyDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
          nextTitle = `${toTitleCase(trimmedMedicine)} Session ${sessionNumber} - ${dateLabel}`;
          nextTitleIsDefault = false;
        }
      } else if (userTouchedTitle) {
        nextTitleIsDefault = false;
      }

      const preparationData = {
        // Session info
        medicine,
        dosage,
        setting,
        facilitator,
        participants,
        sessionContext,
        // Intention
        intention: customIntention,
        intentionCategory: selectedIntentionCategory,
        // Check-ins
        nervousSystemState,
        nervousSystemNotes,
        activeParts,
        partsNotes,
        completedSections,
        completedAt: new Date().toISOString()
      };

      // Mirror to sessionInfo so the SessionInfoHeader edit modal sees the
      // same data and the auto-rename count works across both paths.
      const updatedSessionData = {
        ...currentSessionData,
        titleIsDefault: nextTitleIsDefault,
        preparation: preparationData,
        sessionInfo: {
          ...(currentSessionData.sessionInfo || {}),
          medicine,
          dosage,
          setting,
          facilitator,
          participants,
          context: sessionContext,
        },
      };

      const updates = { session_data: updatedSessionData };
      if (nextTitle && nextTitle !== currentSession?.title) {
        updates.title = nextTitle;
      }
      if (journeyDate) updates.journey_date = journeyDate;

      const { data: updatedRow, error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      if (updatedRow) {
        setCurrentSession(updatedRow);
        if (updatedRow.title !== sessionTitle) {
          setSessionTitle(updatedRow.title || '');
        }
      }

      console.log('Preparation data saved successfully');
    } catch (error) {
      console.error('Error saving preparation data:', error);
    }
  };

  // Session preparation sections
  const preparationSections = [
    {
      id: 'overview',
      title: 'Session Overview',
      emoji: '🧭',
      icon: icons.guidance,
      description: 'Prepare for this specific session',
      estimatedTime: '2 min'
    },
    {
      id: 'session_details',
      title: 'Session Details',
      emoji: '📝',
      icon: icons.journal,
      description: 'Medicine, dosage, date, setting, and context',
      estimatedTime: '3 min'
    },
    {
      id: 'intention_setting',
      title: 'Set Your Intention',
      emoji: '🎯',
      icon: icons.intention,
      description: 'Create your compass for this journey',
      estimatedTime: '10-15 min'
    },
    {
      id: 'nervous_system_checkin',
      title: 'Nervous System Check-in',
      emoji: '🧠',
      icon: icons.bodyScanAlt,
      description: 'Assess your current state',
      estimatedTime: '5 min'
    },
    {
      id: 'parts_checkin',
      title: 'Parts Check-in',
      emoji: '👥',
      icon: icons.roles,
      description: 'Notice what parts are active today',
      estimatedTime: '7 min'
    },
    {
      id: 'session_day_prep',
      title: 'Session Day Checklist',
      emoji: '📋',
      icon: icons.checklist,
      description: 'Items and final preparations',
      estimatedTime: '5 min'
    }
  ];

  // Intention categories
  const intentionCategories = [
    {
      id: 'past_experiences',
      title: 'Reflecting on Past Experiences',
      emoji: '🔍',
      description: 'Gently revisit moments from your past to uncover their significance and recognize valuable lessons',
      examples: [
        'Show me the deeper meaning behind my childhood experiences',
        'Help me understand how my past is influencing my present',
        'Teach me what I need to learn from my difficult experiences',
        'Show me the gifts hidden in my painful memories'
      ]
    },
    {
      id: 'unconscious_pain',
      title: 'Healing Unconscious Pain',
      emoji: '💚',
      description: 'Uncover and address hidden hurts you may carry within for healing and expression',
      examples: [
        'Show me the pain I\'ve been carrying that I don\'t recognize',
        'Help me heal the wounds I don\'t know I have',
        'Teach me how to love the parts of me that are hurting',
        'Show me what my body has been holding for me'
      ]
    },
    {
      id: 'self_perceptions',
      title: 'Changing Self-Perceptions',
      emoji: '🌅',
      description: 'Reshape how you view yourself and rewrite your life narrative with kindness',
      examples: [
        'Show me who I really am beneath my self-criticism',
        'Help me see myself with compassion and love',
        'Teach me to recognize my inherent worth and beauty',
        'Show me the story I want to tell about my life'
      ]
    },
    {
      id: 'connecting_deeply',
      title: 'Connecting Deeply',
      emoji: '✨',
      description: 'Dissolve barriers that prevent meaningful connections with yourself and others',
      examples: [
        'Show me how to open my heart safely',
        'Help me understand what blocks me from true connection',
        'Teach me how to be authentic in my relationships',
        'Show me how to connect with my deepest self'
      ]
    },
    {
      id: 'behavior_patterns',
      title: 'Exploring Behavior Patterns',
      emoji: '🔄',
      description: 'Understand the core reasons behind your behaviors and what influences your actions',
      examples: [
        'Show me why I keep repeating the same patterns',
        'Help me understand what drives my automatic reactions',
        'Teach me what my behaviors are trying to protect',
        'Show me how to respond instead of react'
      ]
    },
    {
      id: 'negative_habits',
      title: 'Breaking Negative Habits',
      emoji: '🌱',
      description: 'Overcome harmful habits with self-compassion and resilience in your journey toward change',
      examples: [
        'Show me what I\'m really seeking when I engage in this habit',
        'Help me find healthier ways to meet my needs',
        'Teach me to be gentle with myself as I change',
        'Show me the freedom that awaits on the other side'
      ]
    },
    {
      id: 'feeling_emotions',
      title: 'Feeling Emotions Fully',
      emoji: '🌊',
      description: 'Embrace your emotions authentically as a natural part of your human experience',
      examples: [
        'Show me how to feel my emotions without being overwhelmed',
        'Help me trust my emotional wisdom',
        'Teach me that all feelings are welcome and temporary',
        'Show me the gifts that my emotions bring'
      ]
    },
    {
      id: 'releasing_feelings',
      title: 'Releasing Held Feelings',
      emoji: '🕊️',
      description: 'Let go of emotions you\'ve carried too long to create space for healing and renewal',
      examples: [
        'Show me how to release what I\'ve been holding',
        'Help me let go with love and forgiveness',
        'Teach me that releasing doesn\'t mean forgetting',
        'Show me the lightness that comes with letting go'
      ]
    }
  ];

  const markSectionComplete = (sectionId) => {
    if (!completedSections.includes(sectionId)) {
      const updated = [...completedSections, sectionId];
      setCompletedSections(updated);
      savePreparationData();
    }
  };

  const renderOverview = () => (
    <View style={styles.gradientFill}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.navBackButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Image source={icons.mapRefined} style={styles.heroIcon} />
          <Text style={styles.heroTitle}>Session Preparation</Text>
          <Text style={styles.heroSubtitle}>
            Prepare your mind, body, and spirit for this healing journey.
          </Text>
        </View>

        {/* Session Info */}
        <View style={styles.sessionInfoBox}>
          <Text style={styles.sessionInfoTitle}>Today's Session</Text>
          <Text style={styles.sessionInfoText}>Title: {sessionTitle || 'New Session'}</Text>
          <Text style={styles.sessionInfoText}>Date: {journeyDate || 'Today'}</Text>
          {medicine ? <Text style={styles.sessionInfoText}>Medicine: {medicine}{dosage ? ` • ${dosage}` : ''}</Text> : null}
          {setting ? <Text style={styles.sessionInfoText}>Setting: {setting}</Text> : null}
        </View>

        {/* Preparation Steps */}
        <View style={styles.optionsContainer}>
          {preparationSections.slice(1).map((section) => (
            <TouchableOpacity
              key={section.id}
              style={styles.optionCard}
              onPress={() => {
                if (section.id === 'session_day_prep') {
                  navigation.navigate('SessionChecklist', {
                    sessionId,
                    sessionData,
                    context: { medicine, setting, facilitator }
                  });
                } else if (section.id === 'nervous_system_checkin') {
                  // Use the full tracker so the prep flow stays consistent
                  // with the standalone Nervous System Check-in.
                  navigation.navigate('NervousSystemCheckin', { returnTo: 'SessionPreparation' });
                } else if (section.id === 'parts_checkin') {
                  navigation.navigate('PartsCheckin', { returnTo: 'SessionPreparation' });
                } else {
                  setCurrentSection(section.id);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                {section.icon ? (
                  <Image source={section.icon} style={styles.optionIconImage} />
                ) : (
                  <Text style={styles.optionEmoji}>{section.emoji}</Text>
                )}
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>{section.title}</Text>
                  <Text style={styles.optionDescription}>{section.description}</Text>
                  <View style={styles.optionTimeRow}>
                    <Clock size={14} color={colors.textLight} strokeWidth={2} />
                    <Text style={styles.optionTime}>{section.estimatedTime}</Text>
                  </View>
                </View>
              </View>
              {completedSections.includes(section.id) ? (
                <CheckCircle2 size={24} color={colors.success} strokeWidth={2} />
              ) : (
                <ChevronRight size={24} color={colors.textSecondary} strokeWidth={2} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Progress */}
        <View style={styles.progressBox}>
          <Text style={styles.progressTitle}>
            Progress: {completedSections.length}/{preparationSections.length - 1} Complete
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(completedSections.length / (preparationSections.length - 1)) * 100}%` }
              ]}
            />
          </View>
        </View>

        {/* Start / Complete Buttons */}
        {(() => {
          const stepOrder = ['session_details', 'intention_setting', 'nervous_system_checkin', 'parts_checkin', 'session_day_prep'];
          const nextStep = stepOrder.find(s => !completedSections.includes(s));
          if (!nextStep) return null;
          const label = completedSections.length === 0
            ? 'Begin Session Preparation'
            : 'Continue Preparation';
          return (
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => {
                if (nextStep === 'session_day_prep') {
                  navigation.navigate('SessionChecklist', {
                    sessionId,
                    sessionData,
                    context: { medicine, setting, facilitator }
                  });
                } else if (nextStep === 'nervous_system_checkin') {
                  navigation.navigate('NervousSystemCheckin', { returnTo: 'SessionPreparation' });
                } else if (nextStep === 'parts_checkin') {
                  navigation.navigate('PartsCheckin', { returnTo: 'SessionPreparation' });
                } else {
                  setCurrentSection(nextStep);
                }
              }}
            >
              <Text style={styles.startButtonText}>{label}</Text>
            </TouchableOpacity>
          );
        })()}

        {completedSections.length === preparationSections.length - 1 && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => {
              savePreparationData();
              // Prep is finished (typically before the journey). Offer a jump
              // straight into Process & Integrate for those who prepped right
              // before processing, but default to returning to the Prepare hub.
              Alert.alert(
                'Preparation Complete!',
                'You\'re ready for your session. Remember: Trust. Let go. Be open.\n\nWhen you\'re ready to process afterward, you can come back via Process & Integrate.',
                [
                  { text: 'Done', style: 'cancel', onPress: () => navigation.goBack() },
                  {
                    text: 'Process & Integrate',
                    onPress: () =>
                      navigation.navigate('ProcessIntegrate', {
                        session: currentSession || sessionData,
                      })
                  }
                ]
              );
            }}
          >
            <Text style={styles.completeButtonText}>Ready for Session ✨</Text>
          </TouchableOpacity>
        )}

        {/* Tip */}
        <View style={styles.tipBox}>
          <View style={styles.tipTitleRow}>
            <Lightbulb size={18} color={colors.primary} strokeWidth={2} />
            <Text style={styles.tipTitle}>Preparation Tip</Text>
          </View>
          <Text style={styles.tipText}>
            Each session is a unique opportunity for healing and growth. Take your time with each step.
          </Text>
        </View>
      </ScrollView>
    </View>
  );

  const renderLearningModules = () => (
    <View style={styles.gradientFill}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.navBackButton} onPress={() => setCurrentSection('overview')}>
            <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <Image source={icons.educationProgress} style={styles.heroIcon} />
          <Text style={styles.heroTitle}>Quick Learning Refresher</Text>
          <Text style={styles.heroSubtitle}>
            Review foundational concepts before your session
          </Text>
        </View>

        <Text style={styles.bodyText}>
          These quick modules refresh your understanding of nervous system states,
          internal parts work, and grounding techniques. Take what you need!
        </Text>

        {[
          {
            title: 'Nervous System Basics',
            emoji: '🧠',
            description: 'Understanding your three states: Ventral (safe), Sympathetic (fight/flight), Dorsal (freeze/shutdown)',
            topics: ['Window of Tolerance', 'Polyvagal Theory', 'Regulation vs Dysregulation'],
            time: '5 min'
          },
          {
            title: 'Parts Work (IFS)',
            emoji: '👥',
            description: 'Your inner family: Exiles (wounded), Managers (controllers), Firefighters (emergency response)',
            topics: ['Self-Leadership', 'Unburdening', 'Internal Compassion'],
            time: '7 min'
          },
          {
            title: 'Grounding & Somatic Practices',
            emoji: '🌱',
            description: 'Body-based regulation techniques you can use during your session',
            topics: ['5-4-3-2-1 Technique', 'Breath Work', 'Body Scanning', 'Safe Touch'],
            time: '8 min'
          }
        ].map((module, index) => (
          <View key={index} style={styles.moduleCard}>
            <Text style={styles.moduleEmoji}>{module.emoji}</Text>
            <Text style={styles.moduleTitle}>{module.title}</Text>
            <Text style={styles.moduleDescription}>{module.description}</Text>

            <View style={styles.topicsContainer}>
              {module.topics.map((topic, i) => (
                <View key={i} style={styles.topicTag}>
                  <Text style={styles.topicText}>{topic}</Text>
                </View>
              ))}
            </View>

            <View style={styles.moduleMeta}>
              <View style={styles.moduleTimeRow}>
                <Clock size={14} color={colors.textLight} strokeWidth={2} />
                <Text style={styles.moduleTime}>{module.time}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.moduleButton}
              onPress={() => {
                navigation.navigate('GeneralPreparation');
              }}
            >
              <Text style={styles.moduleButtonText}>Review Module</Text>
              <ArrowRight size={16} color={colors.white} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.optionalBox}>
          <Text style={styles.optionalTitle}>✨ Optional Step</Text>
          <Text style={styles.optionalText}>
            These modules are optional if you've already completed foundation learning.
            Feel free to skip to belief assessments!
          </Text>
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => {
            markSectionComplete('learning_modules');
            setCurrentSection('belief_assessments');
          }}
        >
          <Text style={styles.continueButtonText}>Continue to Belief Assessments →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentSection('overview')}
        >
          <Text style={styles.backButtonText}>← Back to Overview</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderBeliefAssessments = () => (
    <View style={styles.gradientFill}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.navBackButton} onPress={() => setCurrentSection('overview')}>
            <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <Image source={icons.coreBeliefs} style={styles.heroIcon} />
          <Text style={styles.heroTitle}>Belief Assessments</Text>
          <Text style={styles.heroSubtitle}>
            Understand your beliefs before your journey
          </Text>
        </View>

        <Text style={styles.bodyText}>
          These assessments help establish a baseline understanding of your beliefs,
          attachment patterns, and self-perception. You'll retake them after your
          journey to track transformation.
        </Text>

        {[
          {
            title: 'Core Beliefs Inventory',
            description: 'McKay & Fanning\'s 100-item assessment of 10 core belief domains',
            domains: 'Value • Security • Performance • Control • Love • Autonomy • Justice • Belonging • Trust • Standards',
            time: '10 min',
            items: 100
          },
          {
            title: 'Young Schema Questionnaire (Brief)',
            description: 'Early maladaptive schemas from childhood experiences',
            domains: 'Abandonment • Mistrust • Defectiveness • Failure • Dependence • Entitlement',
            time: '5 min',
            items: 24
          },
          {
            title: 'Self-Compassion Scale (Short)',
            description: 'How you treat yourself in times of difficulty',
            domains: 'Self-Kindness • Common Humanity • Mindfulness',
            time: '3 min',
            items: 12
          },
          {
            title: 'Attachment Style (ECR-S)',
            description: 'Your patterns in close relationships',
            domains: 'Anxiety • Avoidance',
            time: '3 min',
            items: 12
          },
          {
            title: 'Unconditional Self-Acceptance',
            description: 'Ability to accept yourself regardless of performance',
            domains: 'Self-Worth • Flexibility • Compassion',
            time: '4 min',
            items: 20
          }
        ].map((assessment, index) => (
          <View key={index} style={styles.assessmentCard}>
            <Text style={styles.assessmentTitle}>{assessment.title}</Text>
            <Text style={styles.assessmentDescription}>{assessment.description}</Text>
            <Text style={styles.assessmentDomains}>{assessment.domains}</Text>
            <View style={styles.assessmentMeta}>
              <Text style={styles.assessmentMetaText}>📊 {assessment.items} items</Text>
              <View style={styles.assessmentTimeRow}>
                <Clock size={14} color={colors.textLight} strokeWidth={2} />
                <Text style={styles.assessmentMetaText}>~{assessment.time}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.assessmentButton}
              onPress={() => {
                Alert.alert(
                  'Assessment Coming Soon',
                  `The ${assessment.title} will be available in the next update.`
                );
              }}
            >
              <Text style={styles.assessmentButtonText}>Start Assessment</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => {
            markSectionComplete('belief_assessments');
            setCurrentSection('philosophical_explorations');
          }}
        >
          <Text style={styles.continueButtonText}>Continue to Philosophical Explorations →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentSection('overview')}
        >
          <Text style={styles.backButtonText}>← Back to Overview</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderPhilosophicalExplorations = () => (
    <View style={styles.gradientFill}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.navBackButton} onPress={() => setCurrentSection('belief_assessments')}>
            <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <Image source={icons.philosophical} style={styles.heroIcon} />
          <Text style={styles.heroTitle}>Philosophical Explorations</Text>
          <Text style={styles.heroSubtitle}>
            Contemplate the nature of self and identity
          </Text>
        </View>

        <Text style={[styles.bodyText, { fontWeight: '600', fontSize: 18 }]}>Preparing for Ego Dissolution</Text>
        <Text style={styles.bodyText}>
          Psychedelic experiences often challenge our fundamental sense of self. These
          thought experiments help prepare your mind for these profound shifts in identity
          and continuity.
        </Text>

        {/* Ship of Theseus */}
        <View style={styles.philosophyCard}>
          <Text style={styles.philosophyEmoji}>⛵</Text>
          <Text style={styles.philosophyTitle}>The Ship of Theseus</Text>
          <Text style={styles.philosophyText}>
            Imagine a ship where, over time, every single plank and part is replaced.
            Is it still the same ship?
          </Text>
          <Text style={styles.philosophyText}>
            Now consider: your body replaces nearly all its cells every 7-10 years.
            Your thoughts, beliefs, and memories constantly change. Are you still the
            same person you were 10 years ago? What makes you "you"?
          </Text>
          <View style={styles.reflectionBox}>
            <Text style={styles.reflectionTitle}>💭 Reflect:</Text>
            <Text style={styles.reflectionText}>
              • What aspects of you have remained constant?{'\n'}
              • What has changed completely?{'\n'}
              • Is there a "true you" beneath the changes?{'\n'}
              • Or are you more like a river—constantly flowing, never the same twice?
            </Text>
          </View>
        </View>

        {/* Buddhist Anatman */}
        <View style={styles.philosophyCard}>
          <Text style={styles.philosophyEmoji}>☸️</Text>
          <Text style={styles.philosophyTitle}>Anatman (No-Self)</Text>
          <Text style={styles.philosophyText}>
            Buddhist philosophy teaches "anatman"—the concept that there is no permanent,
            unchanging self. Instead, what we call "I" is a collection of constantly
            changing processes: thoughts, feelings, sensations, perceptions.
          </Text>
          <Text style={styles.philosophyText}>
            Like a flame that appears continuous but is actually a constant process of
            fuel being consumed, we too are a process, not a fixed thing.
          </Text>
          <View style={styles.reflectionBox}>
            <Text style={styles.reflectionTitle}>💭 Contemplate:</Text>
            <Text style={styles.reflectionText}>
              • Can you find a permanent "self" when you look inside?{'\n'}
              • Or do you find thoughts, feelings, sensations—all changing?{'\n'}
              • What happens if you don't cling to any particular identity?{'\n'}
              • How does it feel to see yourself as a verb, not a noun—as "ing" not "is"?
            </Text>
          </View>
        </View>

        {/* The Mask and the Mirror */}
        <View style={styles.philosophyCard}>
          <Text style={styles.philosophyEmoji}>🎭</Text>
          <Text style={styles.philosophyTitle}>The Mask and the Mirror</Text>
          <Text style={styles.philosophyText}>
            You wear different "masks" in different contexts: parent, child, professional,
            friend, lover. Each feels genuinely "you" when you're wearing it.
          </Text>
          <Text style={styles.philosophyText}>
            During your journey, these masks may fall away. You might experience yourself
            as pure awareness—the mirror that reflects all roles but is not any of them.
          </Text>
          <View style={styles.reflectionBox}>
            <Text style={styles.reflectionTitle}>💭 Explore:</Text>
            <Text style={styles.reflectionText}>
              • Which "you" is the real you?{'\n'}
              • What remains when all roles are removed?{'\n'}
              • Is the "you" that observes your thoughts the same as the thoughts themselves?{'\n'}
              • Can you experience the awareness that contains all your identities?
            </Text>
          </View>
        </View>

        <View style={styles.integrationBox}>
          <Text style={styles.integrationTitle}>🌟 Integration Insight</Text>
          <Text style={styles.integrationText}>
            These thought experiments aren't meant to confuse you—they're meant to create
            mental flexibility. During your journey, if you experience ego dissolution or
            identity shifts, you'll have a framework for understanding what's happening.
            You're not losing yourself; you're discovering what you are beyond the stories
            you tell about yourself.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => {
            markSectionComplete('philosophical_explorations');
            setCurrentSection('intention_setting');
          }}
        >
          <Text style={styles.continueButtonText}>Continue to Intention Setting →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentSection('belief_assessments')}
        >
          <Text style={styles.backButtonText}>← Back to Assessments</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderSessionDetails = () => (
    <View style={styles.gradientFill}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.navBackButton} onPress={() => setCurrentSection('overview')}>
            <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <Image source={icons.journal} style={styles.heroIcon} />
          <Text style={styles.heroTitle}>Session Details</Text>
          <Text style={styles.heroSubtitle}>
            Capture the practical details for this journey.
          </Text>
        </View>

        <Text style={styles.inputLabel}>Session Title</Text>
        <TextInput
          style={styles.textInput}
          value={sessionTitle}
          onChangeText={setSessionTitle}
          placeholder="e.g., Spring Integration Session"
          placeholderTextColor={colors.textLight}
          spellCheck={true}
          autoCorrect={true}
          autoCapitalize="sentences"
        />

        <Text style={styles.inputLabel}>Journey Date</Text>
        <TextInput
          style={styles.textInput}
          value={journeyDate}
          onChangeText={setJourneyDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textLight}
        />

        <Text style={styles.inputLabel}>Medicine / Substance</Text>
        <TextInput
          style={styles.textInput}
          value={medicine}
          onChangeText={setMedicine}
          placeholder="e.g., Ketamine, Psilocybin, MDMA"
          placeholderTextColor={colors.textLight}
        />

        <Text style={styles.inputLabel}>Dosage</Text>
        <TextInput
          style={styles.textInput}
          value={dosage}
          onChangeText={setDosage}
          placeholder="e.g., 100mg IM, 3.5g dried"
          placeholderTextColor={colors.textLight}
        />

        <Text style={styles.inputLabel}>Setting / Location</Text>
        <TextInput
          style={styles.textInput}
          value={setting}
          onChangeText={setSetting}
          placeholder="e.g., Home, Clinic, Retreat center"
          placeholderTextColor={colors.textLight}
        />

        <Text style={styles.inputLabel}>Facilitator / Guide</Text>
        <TextInput
          style={styles.textInput}
          value={facilitator}
          onChangeText={setFacilitator}
          placeholder="e.g., Dr. Smith, Solo journey"
          placeholderTextColor={colors.textLight}
        />

        <Text style={styles.inputLabel}>Other Participants</Text>
        <TextInput
          style={styles.textInput}
          value={participants}
          onChangeText={setParticipants}
          placeholder="e.g., Partner, Solo"
          placeholderTextColor={colors.textLight}
        />

        <Text style={styles.inputLabel}>Additional Context</Text>
        <TextInput
          style={[styles.textInput, styles.multilineInput]}
          value={sessionContext}
          onChangeText={setSessionContext}
          placeholder="What's happening in your life right now?"
          placeholderTextColor={colors.textLight}
          multiline
          numberOfLines={4}
          spellCheck={true}
          autoCorrect={true}
          autoCapitalize="sentences"
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            if (!completedSections.includes('session_details')) {
              setCompletedSections([...completedSections, 'session_details']);
            }
            savePreparationData();
            setCurrentSection('overview');
          }}
        >
          <Text style={styles.primaryButtonText}>Save Session Details</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // Render based on current section
  const renderIntentionSetting = () => (
    <View style={styles.gradientFill}>
      <ScrollView
        ref={intentionScrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.navBackButton} onPress={() => setCurrentSection('overview')}>
            <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <Image source={icons.intention} style={styles.heroIcon} />
          <Text style={styles.heroTitle}>Set Your Intention</Text>
          <Text style={styles.heroSubtitle}>What do you hope to explore or heal?</Text>
        </View>

        <Text style={styles.bodyText}>
          Your intention guides your journey. It doesn't need to be perfect - just honest and from your heart.
        </Text>

        {/* AI-guided intention setting */}
        <TouchableOpacity
          style={[styles.primaryButton, { marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 8 }]}
          onPress={() => navigation.navigate('SetIntention', { sessionId, sessionData })}
        >
          <Sparkles size={20} color={colors.white} strokeWidth={2} />
          <Text style={styles.primaryButtonText}>AI-Guided Intention ✨</Text>
        </TouchableOpacity>

        <Text style={[styles.bodyText, { textAlign: 'center', marginBottom: spacing.sm, fontSize: 13, opacity: 0.7 }]}>
          or write it yourself:
        </Text>

        <TextInput
          style={styles.textArea}
          value={customIntention}
          onChangeText={setCustomIntention}
          placeholder="Write your intention here..."
          placeholderTextColor={colors.textLight}
          multiline
          numberOfLines={6}
          spellCheck={true}
          autoCorrect={true}
          autoCapitalize="sentences"
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            if (!completedSections.includes('intention_setting')) {
              setCompletedSections([...completedSections, 'intention_setting']);
            }
            setCurrentSection('overview');
          }}
        >
          <Text style={styles.primaryButtonText}>Save Intention</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderNervousSystemCheckin = () => (
    <View style={styles.gradientFill}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.navBackButton} onPress={() => setCurrentSection('overview')}>
            <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <Image source={icons.nsMap} style={styles.heroIcon} />
          <Text style={styles.heroTitle}>Nervous System Check-in</Text>
          <Text style={styles.heroSubtitle}>How is your nervous system feeling right now?</Text>
        </View>

        <Text style={styles.bodyText}>
          Notice your current state without judgment. This awareness helps you prepare appropriately.
        </Text>

        <TextInput
          style={styles.textArea}
          value={nervousSystemNotes}
          onChangeText={setNervousSystemNotes}
          placeholder="Describe your current nervous system state..."
          placeholderTextColor={colors.textLight}
          multiline
          numberOfLines={6}
          spellCheck={true}
          autoCorrect={true}
          autoCapitalize="sentences"
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            if (!completedSections.includes('nervous_system_checkin')) {
              setCompletedSections([...completedSections, 'nervous_system_checkin']);
            }
            setCurrentSection('overview');
          }}
        >
          <Text style={styles.primaryButtonText}>Save Check-in</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderPartsCheckin = () => (
    <View style={styles.gradientFill}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.navBackButton} onPress={() => setCurrentSection('overview')}>
            <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <Image source={icons.roles} style={styles.heroIcon} />
          <Text style={styles.heroTitle}>Parts Check-in</Text>
          <Text style={styles.heroSubtitle}>Which parts of you are present today?</Text>
        </View>

        <Text style={styles.bodyText}>
          Notice any parts that feel activated - worried, excited, protective, or curious parts.
        </Text>

        <TextInput
          style={styles.textArea}
          value={partsNotes}
          onChangeText={setPartsNotes}
          placeholder="Which parts do you notice? What are they saying?"
          placeholderTextColor={colors.textLight}
          multiline
          numberOfLines={6}
          spellCheck={true}
          autoCorrect={true}
          autoCapitalize="sentences"
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            if (!completedSections.includes('parts_checkin')) {
              setCompletedSections([...completedSections, 'parts_checkin']);
            }
            setCurrentSection('overview');
          }}
        >
          <Text style={styles.primaryButtonText}>Save Check-in</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'overview':
        return renderOverview();
      case 'session_details':
        return renderSessionDetails();
      case 'intention_setting':
        return renderIntentionSetting();
      case 'nervous_system_checkin':
        return renderNervousSystemCheckin();
      case 'parts_checkin':
        return renderPartsCheckin();
      case 'session_day_prep':
        // Handled by SessionChecklistScreen navigation; fall through to overview
        return renderOverview();
      default:
        return renderOverview();
    }
  };

  return (
    // Gradient is the OUTERMOST wrapper (matching DailyJournal's order:
    // gradient → SafeAreaView → KeyboardAvoidingView). On Android, behavior="height"
    // shrinks the KAV's child when the keyboard opens; if the gradient sat INSIDE
    // the KAV, that shrink exposed the SafeAreaView's white background as a gap
    // above the keyboard. With the gradient outermost, any exposed strip shows
    // the gradient instead — no white gap. The section renderers used to each wrap
    // their OWN gradient, which stacked two slightly-misaligned gradients (a
    // visible seam); they are now plain Views so only this single gradient shows.
    <LinearGradient
      colors={gradients.standard}
      start={gradients.standardStart}
      end={gradients.standardEnd}
      style={styles.gradientFill}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Keyboard avoidance matches the app's device-verified pattern (see
            DailyJournal): KeyboardAvoidingView on both platforms, PLUS a
            keyboardDidShow listener that scrolls the focused input to the end so
            low-sitting fields (the custom-intention box) clear the keyboard. The
            KAV alone doesn't scroll; the scroll alone leaves the input covered. */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {renderCurrentSection()}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
  navBackButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  heroIcon: {
    width: 192,
    height: 192,
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
  bodyText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  sessionInfoBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    ...shadows.soft,
  },
  sessionInfoTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sessionInfoText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  optionsContainer: {
    marginBottom: spacing.lg,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionEmoji: {
    fontSize: 36,
    marginRight: spacing.md,
  },
  optionIconImage: {
    width: 112,
    height: 112,
    resizeMode: 'contain',
    marginRight: spacing.md,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  optionTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  optionTime: {
    fontSize: 13,
    color: colors.textLight,
  },
  progressBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.sand,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.3,
  },
  completeButton: {
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  completeButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.3,
  },
  tipBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    marginTop: spacing.md,
  },
  tipTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  tipText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  // Sub-section styles (learning modules, assessments, philosophy)
  sectionContainer: {
    flex: 1,
  },
  headerGradient: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingTop: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  assessmentCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  assessmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  assessmentDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  assessmentDomains: {
    fontSize: 13,
    color: colors.primary,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  assessmentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  assessmentTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assessmentMetaText: {
    fontSize: 13,
    color: colors.textLight,
  },
  assessmentButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  assessmentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  philosophyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    ...shadows.soft,
  },
  philosophyEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  philosophyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  philosophyText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  reflectionBox: {
    backgroundColor: 'rgba(123, 157, 111, 0.1)',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  reflectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  reflectionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  integrationBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  integrationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  integrationText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadows.soft,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  backButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  contentPadding: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.sand,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  infoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  moduleCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  moduleEmoji: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  moduleDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  topicTag: {
    backgroundColor: 'rgba(93, 134, 214, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  topicText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  moduleMeta: {
    marginBottom: spacing.sm,
  },
  moduleTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moduleTime: {
    fontSize: 13,
    color: colors.textLight,
  },
  moduleButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    marginRight: spacing.sm,
  },
  optionalBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  optionalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  optionalText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.sand,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.soft,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.3,
  },
});

export default SessionPreparationScreen;