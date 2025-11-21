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
 * Intention Setting Component
 * Helps users distinguish between goals and intentions for psychedelic sessions
 * Based on Ketamine Integration Guide
 */
const IntentionSetting = ({ sessionId, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({
    goals: [],
    intentions: [],
    openness: '',
    surrender: ''
  });
  const [currentInput, setCurrentInput] = useState('');
  const [loading, setLoading] = useState(false);

  const steps = [
    {
      type: 'intro',
      title: 'Setting Your Intention',
      emoji: '🎯',
      content: 'Before your session, let\'s clarify what you\'re bringing to this experience. We\'ll explore the difference between goals (what you want to achieve) and intentions (how you want to be).'
    },
    {
      type: 'education',
      title: 'Goals vs Intentions',
      emoji: '🤔',
      content: 'Understanding the difference helps you approach your session with the right mindset.',
      comparison: [
        {
          concept: 'Goals',
          icon: '🎯',
          color: '#3b82f6',
          description: 'Outcome-focused, specific results you want',
          examples: [
            '"I want to resolve my trauma"',
            '"I want to stop feeling anxious"',
            '"I want to fix my relationship"',
            '"I want to have a mystical experience"'
          ],
          note: 'Goals can create pressure and resistance. The medicine works in its own way.'
        },
        {
          concept: 'Intentions',
          icon: '🌊',
          color: '#10b981',
          description: 'Process-focused, qualities of being and relating',
          examples: [
            '"I intend to be open to whatever arises"',
            '"I intend to meet myself with compassion"',
            '"I intend to trust the process"',
            '"I intend to stay curious and willing"'
          ],
          note: 'Intentions create spaciousness. They\'re how you want to be, not what you want to get.'
        }
      ]
    },
    {
      type: 'goals_check',
      title: 'What Are Your Goals?',
      emoji: '📝',
      prompt: 'It\'s okay to have goals! Let\'s name them first so we can work with them wisely.',
      placeholder: 'What are you hoping will happen or change?'
    },
    {
      type: 'goals_to_intentions',
      title: 'From Goals to Intentions',
      emoji: '🔄',
      content: 'Now let\'s transform those goals into intentions - shifting from outcomes to qualities of being.',
      guidance: [
        'Instead of "I want to feel less anxious" → "I intend to be curious about my anxiety"',
        'Instead of "I want to heal my trauma" → "I intend to meet my wounded parts with compassion"',
        'Instead of "I want answers" → "I intend to stay open to what wants to be revealed"',
        'Instead of "I want it to work" → "I intend to trust the wisdom of the process"'
      ]
    },
    {
      type: 'intentions_input',
      title: 'Your Intentions',
      emoji: '✨',
      prompt: 'How do you want to BE during this session? What qualities do you want to bring?',
      placeholder: 'e.g., Open, curious, compassionate, trusting, willing, brave...'
    },
    {
      type: 'openness',
      title: 'Openness to Experience',
      emoji: '🌸',
      prompt: 'Are you willing to experience whatever arises - even if it\'s not what you expected?',
      subtext: 'Sometimes the medicine gives us what we need rather than what we want.',
      field: {
        key: 'openness',
        placeholder: 'Reflect on your willingness to meet the unexpected...'
      }
    },
    {
      type: 'surrender',
      title: 'Surrender & Trust',
      emoji: '🙏',
      prompt: 'Can you practice letting go of control and trusting the process?',
      subtext: 'The most profound healing often happens when we stop trying to make it happen.',
      field: {
        key: 'surrender',
        placeholder: 'What would it mean to surrender to this experience?'
      }
    },
    {
      type: 'summary',
      title: 'Your Intention',
      emoji: '🌟',
      content: 'You\'ve set a clear intention for your session. Return to these whenever you feel lost or resistant during your journey.'
    }
  ];

  const saveIntention = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const intentionData = {
        user_id: user.id,
        session_id: sessionId,
        goals: responses.goals,
        intentions: responses.intentions,
        openness: responses.openness,
        surrender: responses.surrender,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('session_intentions')
        .insert(intentionData);

      if (error) throw error;

      Alert.alert(
        'Intention Set',
        'Your intention has been saved. May your session unfold with grace.',
        [{ text: 'OK', onPress: () => onComplete && onComplete(intentionData) }]
      );
    } catch (error) {
      console.error('Error saving intention:', error);
      Alert.alert('Error', 'Could not save intention. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToList = (listKey) => {
    if (!currentInput.trim()) return;

    setResponses(prev => ({
      ...prev,
      [listKey]: [...(prev[listKey] || []), currentInput.trim()]
    }));
    setCurrentInput('');
  };

  const handleRemoveFromList = (listKey, index) => {
    setResponses(prev => ({
      ...prev,
      [listKey]: prev[listKey].filter((_, i) => i !== index)
    }));
  };

  const updateField = (key, value) => {
    setResponses(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const renderIntro = () => {
    const step = steps[currentStep];
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepEmoji}>{step.emoji}</Text>
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepText}>{step.content}</Text>

        <View style={styles.quoteBox}>
          <Text style={styles.quoteText}>
            "Set an intention, then let it go. The medicine will take you where you need to go."
          </Text>
          <Text style={styles.quoteAuthor}>— Ancient Wisdom</Text>
        </View>
      </View>
    );
  };

  const renderEducation = () => {
    const step = steps[currentStep];
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepEmoji}>{step.emoji}</Text>
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepText}>{step.content}</Text>

        {step.comparison.map((item, index) => (
          <View
            key={index}
            style={[styles.comparisonCard, { borderLeftColor: item.color }]}
          >
            <View style={styles.comparisonHeader}>
              <Text style={styles.comparisonIcon}>{item.icon}</Text>
              <Text style={[styles.comparisonTitle, { color: item.color }]}>
                {item.concept}
              </Text>
            </View>
            <Text style={styles.comparisonDescription}>{item.description}</Text>

            <Text style={styles.examplesTitle}>Examples:</Text>
            {item.examples.map((example, exIndex) => (
              <Text key={exIndex} style={styles.exampleText}>• {example}</Text>
            ))}

            <View style={styles.comparisonNote}>
              <Text style={styles.comparisonNoteText}>{item.note}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderGoalsCheck = () => {
    const step = steps[currentStep];
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepEmoji}>{step.emoji}</Text>
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepText}>{step.prompt}</Text>

        <View style={styles.inputSection}>
          <TextInput
            style={styles.textInput}
            value={currentInput}
            onChangeText={setCurrentInput}
            placeholder={step.placeholder}
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            onSubmitEditing={() => handleAddToList('goals')}
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleAddToList('goals')}
            disabled={!currentInput.trim()}
          >
            <MaterialIcons name="add-circle" size={24} color="#3b82f6" />
            <Text style={styles.addButtonText}>Add Goal</Text>
          </TouchableOpacity>
        </View>

        {responses.goals.length > 0 && (
          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>Your Goals:</Text>
            {responses.goals.map((goal, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listItemText}>{goal}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveFromList('goals', index)}
                  style={styles.removeButton}
                >
                  <MaterialIcons name="close" size={20} color="#dc2626" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderGoalsToIntentions = () => {
    const step = steps[currentStep];
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepEmoji}>{step.emoji}</Text>
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepText}>{step.content}</Text>

        <View style={styles.guidanceBox}>
          {step.guidance.map((guide, index) => (
            <Text key={index} style={styles.guidanceText}>{guide}</Text>
          ))}
        </View>

        {responses.goals.length > 0 && (
          <View style={styles.transformBox}>
            <Text style={styles.transformTitle}>Transform Your Goals:</Text>
            {responses.goals.map((goal, index) => (
              <View key={index} style={styles.transformItem}>
                <Text style={styles.transformGoal}>🎯 {goal}</Text>
                <MaterialIcons name="arrow-downward" size={16} color="#6b7280" />
                <Text style={styles.transformPrompt}>How can you be with this? →</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderIntentionsInput = () => {
    const step = steps[currentStep];
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepEmoji}>{step.emoji}</Text>
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepText}>{step.prompt}</Text>

        <View style={styles.inputSection}>
          <TextInput
            style={styles.textInput}
            value={currentInput}
            onChangeText={setCurrentInput}
            placeholder={step.placeholder}
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: '#d1fae5' }]}
            onPress={() => handleAddToList('intentions')}
            disabled={!currentInput.trim()}
          >
            <MaterialIcons name="add-circle" size={24} color="#10b981" />
            <Text style={[styles.addButtonText, { color: '#10b981' }]}>Add Intention</Text>
          </TouchableOpacity>
        </View>

        {responses.intentions.length > 0 && (
          <View style={[styles.listContainer, { backgroundColor: '#f0fdf4' }]}>
            <Text style={[styles.listTitle, { color: '#065f46' }]}>Your Intentions:</Text>
            {responses.intentions.map((intention, index) => (
              <View key={index} style={[styles.listItem, { borderLeftColor: '#10b981' }]}>
                <Text style={styles.listItemText}>✨ {intention}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveFromList('intentions', index)}
                  style={styles.removeButton}
                >
                  <MaterialIcons name="close" size={20} color="#dc2626" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderFieldInput = () => {
    const step = steps[currentStep];
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepEmoji}>{step.emoji}</Text>
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepText}>{step.prompt}</Text>
        {step.subtext && (
          <Text style={styles.subtextStyle}>{step.subtext}</Text>
        )}

        <View style={styles.inputSection}>
          <TextInput
            style={[styles.textInput, styles.textareaInput]}
            value={responses[step.field.key] || ''}
            onChangeText={(value) => updateField(step.field.key, value)}
            placeholder={step.field.placeholder}
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>
      </View>
    );
  };

  const renderSummary = () => {
    const step = steps[currentStep];
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepEmoji}>{step.emoji}</Text>
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepText}>{step.content}</Text>

        {responses.intentions.length > 0 && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Your Intentions:</Text>
            {responses.intentions.map((intention, index) => (
              <Text key={index} style={styles.summaryItem}>✨ {intention}</Text>
            ))}
          </View>
        )}

        {responses.openness && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Openness:</Text>
            <Text style={styles.summaryText}>{responses.openness}</Text>
          </View>
        )}

        {responses.surrender && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Surrender & Trust:</Text>
            <Text style={styles.summaryText}>{responses.surrender}</Text>
          </View>
        )}

        <View style={styles.blessingBox}>
          <MaterialIcons name="favorite" size={24} color="#dc2626" />
          <Text style={styles.blessingText}>
            May you meet whatever arises with grace, curiosity, and compassion. Trust the wisdom of the journey.
          </Text>
        </View>
      </View>
    );
  };

  const renderStep = () => {
    const step = steps[currentStep];

    switch (step.type) {
      case 'intro':
        return renderIntro();
      case 'education':
        return renderEducation();
      case 'goals_check':
        return renderGoalsCheck();
      case 'goals_to_intentions':
        return renderGoalsToIntentions();
      case 'intentions_input':
        return renderIntentionsInput();
      case 'openness':
      case 'surrender':
        return renderFieldInput();
      case 'summary':
        return renderSummary();
      default:
        return null;
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onSkip} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color="#6b7280" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Intention Setting</Text>
          <Text style={styles.headerSubtitle}>
            {currentStep + 1} of {steps.length}
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
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.backButton,
            currentStep === 0 && styles.navButtonDisabled
          ]}
          onPress={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          <MaterialIcons
            name="arrow-back"
            size={20}
            color={currentStep === 0 ? '#9ca3af' : '#6b7280'}
          />
          <Text
            style={[
              styles.navButtonText,
              currentStep === 0 && styles.navButtonTextDisabled
            ]}
          >
            Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={() => {
            if (currentStep < steps.length - 1) {
              setCurrentStep(currentStep + 1);
            } else {
              saveIntention();
            }
          }}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
              </Text>
              <MaterialIcons
                name={currentStep === steps.length - 1 ? 'check' : 'arrow-forward'}
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
    backgroundColor: '#a855f7',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  stepContent: {
    gap: 20,
  },
  stepEmoji: {
    fontSize: 48,
    textAlign: 'center',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1f2937',
  },
  stepText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  subtextStyle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: -12,
  },
  quoteBox: {
    backgroundColor: '#fef7ff',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#a855f7',
  },
  quoteText: {
    fontSize: 16,
    color: '#7c2d12',
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: 8,
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#a855f7',
    textAlign: 'right',
  },
  comparisonCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  comparisonIcon: {
    fontSize: 24,
  },
  comparisonTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  comparisonDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
    lineHeight: 18,
  },
  comparisonNote: {
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  comparisonNoteText: {
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
  },
  inputSection: {
    gap: 12,
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
    minHeight: 80,
  },
  textareaInput: {
    minHeight: 120,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  listContainer: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  removeButton: {
    padding: 4,
  },
  guidanceBox: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  guidanceText: {
    fontSize: 14,
    color: '#065f46',
    lineHeight: 20,
  },
  transformBox: {
    backgroundColor: '#fef7ff',
    padding: 16,
    borderRadius: 12,
  },
  transformTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7c2d12',
    marginBottom: 12,
  },
  transformItem: {
    marginBottom: 12,
    gap: 4,
  },
  transformGoal: {
    fontSize: 14,
    color: '#374151',
  },
  transformPrompt: {
    fontSize: 13,
    color: '#a855f7',
    fontStyle: 'italic',
  },
  summaryBox: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  summaryItem: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 22,
  },
  summaryText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
  },
  blessingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 20,
    borderRadius: 12,
    gap: 12,
  },
  blessingText: {
    flex: 1,
    fontSize: 15,
    color: '#991b1b',
    lineHeight: 22,
    fontStyle: 'italic',
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
    backgroundColor: '#a855f7',
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

export default IntentionSetting;
