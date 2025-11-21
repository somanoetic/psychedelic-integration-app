import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

/**
 * Pre-Treatment Baseline Log
 * Tracks baseline state across multiple life domains before psychedelic sessions
 * Based on Ketamine Integration Guide
 */
const PreTreatmentBaselineLog = ({ onComplete, onSkip }) => {
  const [currentDomain, setCurrentDomain] = useState(0);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadLatestBaseline();
  }, []);

  const loadLatestBaseline = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingData(false);
        return;
      }

      const { data, error } = await supabase
        .from('baseline_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setResponses(data.responses || {});
      }
    } catch (error) {
      console.error('Error loading baseline:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const domains = [
    {
      id: 'intro',
      type: 'info',
      title: 'Pre-Treatment Baseline',
      emoji: '📊',
      content: 'Before your session, let\'s establish a baseline. This helps you see changes and track progress over time. Answer honestly - this is just for you.',
      tip: 'Complete this 1-2 days before your session for best results.'
    },
    {
      id: 'sleep',
      title: 'Sleep',
      emoji: '😴',
      color: '#6366f1',
      questions: [
        {
          key: 'sleep_quality',
          label: 'How would you rate your sleep quality lately?',
          type: 'scale',
          scale: { min: 1, max: 10, minLabel: 'Very Poor', maxLabel: 'Excellent' }
        },
        {
          key: 'sleep_hours',
          label: 'Average hours per night',
          type: 'text',
          placeholder: 'e.g., 6-7 hours'
        },
        {
          key: 'sleep_notes',
          label: 'Sleep patterns or issues',
          type: 'textarea',
          placeholder: 'Trouble falling asleep? Waking up? Dreams? Restlessness?'
        }
      ]
    },
    {
      id: 'energy',
      title: 'Energy & Vitality',
      emoji: '⚡',
      color: '#f59e0b',
      questions: [
        {
          key: 'energy_level',
          label: 'Overall energy level',
          type: 'scale',
          scale: { min: 1, max: 10, minLabel: 'Depleted', maxLabel: 'Vibrant' }
        },
        {
          key: 'fatigue',
          label: 'Fatigue or exhaustion',
          type: 'textarea',
          placeholder: 'When do you feel most tired? What drains you?'
        },
        {
          key: 'vitality',
          label: 'What gives you energy?',
          type: 'textarea',
          placeholder: 'Activities, people, or situations that boost your vitality...'
        }
      ]
    },
    {
      id: 'mood',
      title: 'Mood & Emotions',
      emoji: '🎭',
      color: '#ec4899',
      questions: [
        {
          key: 'overall_mood',
          label: 'Overall mood baseline',
          type: 'scale',
          scale: { min: 1, max: 10, minLabel: 'Very Low', maxLabel: 'Very High' }
        },
        {
          key: 'predominant_emotions',
          label: 'What emotions are most present?',
          type: 'textarea',
          placeholder: 'e.g., Anxiety, sadness, contentment, frustration, joy...'
        },
        {
          key: 'emotional_reactivity',
          label: 'How reactive are you emotionally?',
          type: 'textarea',
          placeholder: 'Are you easily triggered? Numb? Quick to anger or tears?'
        }
      ]
    },
    {
      id: 'relationships',
      title: 'Relationships',
      emoji: '❤️',
      color: '#dc2626',
      questions: [
        {
          key: 'relationship_quality',
          label: 'Overall relationship satisfaction',
          type: 'scale',
          scale: { min: 1, max: 10, minLabel: 'Very Difficult', maxLabel: 'Very Fulfilling' }
        },
        {
          key: 'connection_quality',
          label: 'Quality of connection with others',
          type: 'textarea',
          placeholder: 'How connected do you feel? Isolated? Supported?'
        },
        {
          key: 'relationship_challenges',
          label: 'Current relationship challenges',
          type: 'textarea',
          placeholder: 'Conflicts, distance, patterns, communication issues...'
        }
      ]
    },
    {
      id: 'work',
      title: 'Work & Purpose',
      emoji: '💼',
      color: '#3b82f6',
      questions: [
        {
          key: 'work_satisfaction',
          label: 'Work/purpose satisfaction',
          type: 'scale',
          scale: { min: 1, max: 10, minLabel: 'Unfulfilling', maxLabel: 'Deeply Fulfilling' }
        },
        {
          key: 'sense_of_purpose',
          label: 'Sense of meaning and purpose',
          type: 'textarea',
          placeholder: 'Do you feel on track? Lost? Searching? Clear about your path?'
        },
        {
          key: 'work_stress',
          label: 'Work-related stress',
          type: 'textarea',
          placeholder: 'Burnout, pressure, frustration, boredom, overwhelm?'
        }
      ]
    },
    {
      id: 'self_care',
      title: 'Self-Care & Health',
      emoji: '🌸',
      color: '#10b981',
      questions: [
        {
          key: 'self_care_rating',
          label: 'How well are you caring for yourself?',
          type: 'scale',
          scale: { min: 1, max: 10, minLabel: 'Neglecting Self', maxLabel: 'Excellent Care' }
        },
        {
          key: 'self_care_practices',
          label: 'Current self-care practices',
          type: 'textarea',
          placeholder: 'Exercise, nutrition, hobbies, rest, pleasure, creativity...'
        },
        {
          key: 'physical_health',
          label: 'Physical health concerns',
          type: 'textarea',
          placeholder: 'Pain, illness, chronic conditions, concerns...'
        }
      ]
    },
    {
      id: 'symptoms',
      title: 'Symptom Tracking',
      emoji: '📋',
      color: '#8b5cf6',
      questions: [
        {
          key: 'anxiety_level',
          label: 'Anxiety level',
          type: 'scale',
          scale: { min: 1, max: 10, minLabel: 'None', maxLabel: 'Severe' }
        },
        {
          key: 'depression_level',
          label: 'Depression level',
          type: 'scale',
          scale: { min: 1, max: 10, minLabel: 'None', maxLabel: 'Severe' }
        },
        {
          key: 'other_symptoms',
          label: 'Other symptoms to track',
          type: 'textarea',
          placeholder: 'PTSD, chronic pain, dissociation, substance use, etc.'
        }
      ]
    },
    {
      id: 'summary',
      type: 'summary',
      title: 'Baseline Complete',
      emoji: '✅',
      content: 'You\'ve established your baseline across all life domains. This will help you notice shifts and track progress after your session.'
    }
  ];

  const updateResponse = (domainId, questionKey, value) => {
    setResponses(prev => ({
      ...prev,
      [domainId]: {
        ...prev[domainId],
        [questionKey]: value
      }
    }));
  };

  const saveBaseline = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const baselineData = {
        user_id: user.id,
        responses: responses,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('baseline_logs')
        .insert(baselineData);

      if (error) throw error;

      Alert.alert(
        'Baseline Saved',
        'Your pre-treatment baseline has been recorded.',
        [{ text: 'OK', onPress: () => onComplete && onComplete(baselineData) }]
      );
    } catch (error) {
      console.error('Error saving baseline:', error);
      Alert.alert('Error', 'Could not save baseline. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderScale = (question, domainId) => {
    const value = responses[domainId]?.[question.key] || 5;
    const { min, max, minLabel, maxLabel } = question.scale;

    return (
      <View style={styles.scaleContainer}>
        <View style={styles.scaleLabels}>
          <Text style={styles.scaleLabel}>{minLabel}</Text>
          <Text style={styles.scaleValue}>{value}</Text>
          <Text style={styles.scaleLabel}>{maxLabel}</Text>
        </View>
        <View style={styles.scaleTrack}>
          {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((num) => (
            <TouchableOpacity
              key={num}
              style={[
                styles.scalePoint,
                value === num && styles.scalePointActive
              ]}
              onPress={() => updateResponse(domainId, question.key, num)}
            >
              <View style={[
                styles.scalePointInner,
                value === num && styles.scalePointInnerActive
              ]} />
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.scaleNumbers}>
          {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((num) => (
            <Text
              key={num}
              style={[
                styles.scaleNumber,
                value === num && styles.scaleNumberActive
              ]}
            >
              {num}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  const renderDomain = () => {
    const domain = domains[currentDomain];

    if (domain.type === 'info') {
      return (
        <View style={styles.domainContent}>
          <Text style={styles.domainEmoji}>{domain.emoji}</Text>
          <Text style={styles.domainTitle}>{domain.title}</Text>
          <Text style={styles.infoContent}>{domain.content}</Text>
          <View style={styles.tipBox}>
            <MaterialIcons name="tips-and-updates" size={20} color="#f59e0b" />
            <Text style={styles.tipText}>{domain.tip}</Text>
          </View>
        </View>
      );
    }

    if (domain.type === 'summary') {
      return (
        <View style={styles.domainContent}>
          <Text style={styles.domainEmoji}>{domain.emoji}</Text>
          <Text style={styles.domainTitle}>{domain.title}</Text>
          <Text style={styles.summaryContent}>{domain.content}</Text>
          <View style={styles.completionBox}>
            <MaterialIcons name="check-circle" size={32} color="#10b981" />
            <Text style={styles.completionText}>
              Your baseline is ready. Use this as a reference point to notice changes after your session.
            </Text>
          </View>
        </View>
      );
    }

    // Regular domain with questions
    return (
      <View style={styles.domainContent}>
        <Text style={styles.domainEmoji}>{domain.emoji}</Text>
        <Text style={[styles.domainTitle, { color: domain.color }]}>
          {domain.title}
        </Text>

        <View style={styles.questionsContainer}>
          {domain.questions.map((question, index) => (
            <View key={index} style={styles.questionBox}>
              <Text style={styles.questionLabel}>{question.label}</Text>

              {question.type === 'scale' && renderScale(question, domain.id)}

              {question.type === 'text' && (
                <TextInput
                  style={styles.textInput}
                  value={responses[domain.id]?.[question.key] || ''}
                  onChangeText={(value) => updateResponse(domain.id, question.key, value)}
                  placeholder={question.placeholder}
                  placeholderTextColor="#9ca3af"
                />
              )}

              {question.type === 'textarea' && (
                <TextInput
                  style={[styles.textInput, styles.textareaInput]}
                  value={responses[domain.id]?.[question.key] || ''}
                  onChangeText={(value) => updateResponse(domain.id, question.key, value)}
                  placeholder={question.placeholder}
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loadingData) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading baseline...</Text>
      </View>
    );
  }

  const progress = ((currentDomain + 1) / domains.length) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onSkip} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color="#6b7280" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Pre-Treatment Baseline</Text>
          <Text style={styles.headerSubtitle}>
            {currentDomain + 1} of {domains.length}
          </Text>
        </View>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderDomain()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.backButton,
            currentDomain === 0 && styles.navButtonDisabled
          ]}
          onPress={() => setCurrentDomain(Math.max(0, currentDomain - 1))}
          disabled={currentDomain === 0}
        >
          <MaterialIcons
            name="arrow-back"
            size={20}
            color={currentDomain === 0 ? '#9ca3af' : '#6b7280'}
          />
          <Text
            style={[
              styles.navButtonText,
              currentDomain === 0 && styles.navButtonTextDisabled
            ]}
          >
            Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={() => {
            if (currentDomain < domains.length - 1) {
              setCurrentDomain(currentDomain + 1);
            } else {
              saveBaseline();
            }
          }}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {currentDomain === domains.length - 1 ? 'Save Baseline' : 'Next'}
              </Text>
              <MaterialIcons
                name={currentDomain === domains.length - 1 ? 'check' : 'arrow-forward'}
                size={20}
                color="#ffffff"
              />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  domainContent: {
    gap: 20,
  },
  domainEmoji: {
    fontSize: 48,
    textAlign: 'center',
  },
  domainTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1f2937',
  },
  infoContent: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  summaryContent: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  completionBox: {
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 24,
    borderRadius: 12,
    gap: 16,
  },
  completionText: {
    fontSize: 15,
    color: '#065f46',
    textAlign: 'center',
    lineHeight: 22,
  },
  questionsContainer: {
    gap: 24,
  },
  questionBox: {
    gap: 12,
  },
  questionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  scaleContainer: {
    gap: 12,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scaleLabel: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  scaleValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#3b82f6',
    textAlign: 'center',
    minWidth: 40,
  },
  scaleTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  scalePoint: {
    padding: 8,
  },
  scalePointInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  scalePointActive: {},
  scalePointInnerActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  scaleNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleNumber: {
    fontSize: 12,
    color: '#9ca3af',
    width: 32,
    textAlign: 'center',
  },
  scaleNumberActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  textareaInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  backButton: {
    backgroundColor: '#f3f4f6',
  },
  nextButton: {
    backgroundColor: '#3b82f6',
  },
  navButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  navButtonTextDisabled: {
    color: '#9ca3af',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default PreTreatmentBaselineLog;
