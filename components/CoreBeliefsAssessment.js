import React, { useState, useRef } from 'react';
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
  TextInput,
  Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { supabase } from '../lib/supabase';
import coreBeliefsAIService from '../lib/coreBeliefsAIService';
import { coreBeliefsDomains, coreBeliefQuestions } from '../data/coreBeliefQuestions';

/**
 * Core Beliefs Assessment Component
 * Two-phase: 1) 100-question inventory, 2) AI discussion of results
 */
const CoreBeliefsAssessment = ({ user, onComplete }) => {
  const [phase, setPhase] = useState('intro'); // 'intro', 'questionnaire', 'results', 'discussion', 'complete'
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState({});
  const [domainScores, setDomainScores] = useState({});
  const [saving, setSaving] = useState(false);
  const [assessmentId, setAssessmentId] = useState(null);

  // Discussion phase state
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const scrollViewRef = useRef(null);

  const startQuestionnaire = () => {
    setPhase('questionnaire');
  };

  const handleResponse = (value) => {
    const question = coreBeliefQuestions[currentQuestion];

    // Store response (0-10)
    const newResponses = {
      ...responses,
      [question.id]: value
    };
    setResponses(newResponses);

    // Move to next question or finish
    if (currentQuestion < coreBeliefQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      // Calculate scores and save
      calculateScoresAndSave(newResponses);
    }
  };

  const goToPrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const calculateScoresAndSave = async (allResponses) => {
    setSaving(true);

    try {
      // Calculate domain scores
      const scores = {};

      coreBeliefsDomains.forEach(domain => {
        const domainQuestions = coreBeliefQuestions.filter(q => q.domain === domain.id);
        let totalScore = 0;

        domainQuestions.forEach(q => {
          const response = allResponses[q.id] || 5;
          // Reverse score for negative questions
          const score = q.positive ? response : (10 - response);
          totalScore += score;
        });

        // Average score for domain (0-10)
        scores[domain.id] = Math.round(totalScore / domainQuestions.length);
      });

      setDomainScores(scores);

      // Save to database
      const { data, error } = await supabase
        .from('core_beliefs_assessments')
        .insert({
          user_id: user.id,
          assessment_type: 'periodic',
          value_worthiness: scores.value_worthiness,
          security_safety: scores.security_safety,
          performance_competence: scores.performance_competence,
          control_power: scores.control_power,
          love_nurturance: scores.love_nurturance,
          autonomy_independence: scores.autonomy_independence,
          justice_fairness: scores.justice_fairness,
          belonging_connection: scores.belonging_connection,
          others_trust: scores.others_trust,
          standards_compassion: scores.standards_compassion,
          completed: true,
          completion_duration_minutes: Math.round((currentQuestion + 1) * 0.5) // Estimate
        })
        .select()
        .single();

      if (error) {
        console.error('Save error:', error);
        Alert.alert('Save Error', 'Could not save assessment. Please try again.');
        return;
      }

      console.log('[CoreBeliefs] Assessment saved:', data.id);
      setAssessmentId(data.id);

      // Show results
      setPhase('results');
    } catch (error) {
      console.error('Error calculating scores:', error);
      Alert.alert('Error', 'Failed to process assessment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const startDiscussion = async () => {
    setPhase('discussion');

    // Initialize AI service with results
    await coreBeliefsAIService.initialize(domainScores);

    // Prepare results summary
    const resultsSummary = await coreBeliefsAIService.initialize(domainScores);

    const openingMessage = {
      id: Date.now(),
      text: `I've reviewed your assessment results. Your average score across all domains is ${resultsSummary.averageScore.toFixed(1)}/10.\n\nI notice your areas of strength are: ${resultsSummary.highestDomains.map(d => d.domain).join(', ')}.\n\nAnd areas that might benefit from exploration: ${resultsSummary.lowestDomains.map(d => d.domain).join(', ')}.\n\nWould you like to explore what these scores mean and how they might be impacting your life?`,
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
      const response = await coreBeliefsAIService.sendMessage(inputText.trim());

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
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const completeDiscussion = async () => {
    setSaving(true);

    try {
      const conversationHistory = coreBeliefsAIService.getConversationHistory();

      // Update assessment with discussion
      const { error } = await supabase
        .from('core_beliefs_assessments')
        .update({
          discussion_transcript: conversationHistory,
          discussion_date: new Date().toISOString()
        })
        .eq('id', assessmentId);

      if (error) {
        console.error('Update error:', error);
        Alert.alert('Save Error', 'Could not save discussion. Please try again.');
        return;
      }

      console.log('[CoreBeliefs] Discussion saved');

      setPhase('complete');

      if (onComplete) {
        setTimeout(() => onComplete({ assessmentId, domainScores }), 2000);
      }
    } catch (error) {
      console.error('Error saving discussion:', error);
      Alert.alert('Error', 'Failed to save discussion. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderIntro = () => (
    <View style={styles.content}>
      <MaterialIcons name="psychology" size={64} color="#8b5cf6" style={styles.introIcon} />
      <Text style={styles.title}>Core Beliefs Inventory</Text>
      <Text style={styles.description}>
        This assessment measures 10 core belief domains that shape how you see yourself, others, and the world.
      </Text>
      <Text style={styles.description}>
        You'll respond to 100 statements on a scale from 0 (Strongly Disagree) to 10 (Strongly Agree).
      </Text>
      <Text style={styles.description}>
        After completing the questionnaire, you can explore your results with Huxley to understand where beliefs might be limiting you and how to shift them.
      </Text>
      <Text style={styles.timeEstimate}>Estimated time: 15-20 minutes</Text>

      <TouchableOpacity style={styles.primaryButton} onPress={startQuestionnaire}>
        <Text style={styles.primaryButtonText}>Begin Assessment</Text>
      </TouchableOpacity>
    </View>
  );

  const renderQuestionnaire = () => {
    const question = coreBeliefQuestions[currentQuestion];
    const domain = coreBeliefsDomains.find(d => d.id === question.domain);
    const progress = ((currentQuestion + 1) / coreBeliefQuestions.length) * 100;
    const currentResponse = responses[question.id] || 5;

    return (
      <View style={styles.container}>
        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Question {currentQuestion + 1} of {coreBeliefQuestions.length}
        </Text>

        <ScrollView ref={scrollViewRef} style={styles.questionContainer} contentContainerStyle={styles.questionContent}>
          {/* Domain badge */}
          <View style={styles.domainBadge}>
            <Text style={styles.domainBadgeText}>{domain.name}</Text>
          </View>

          {/* Question */}
          <Text style={styles.questionText}>{question.text}</Text>

          {/* Slider */}
          <View style={styles.sliderContainer}>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>Strongly{'\n'}Disagree</Text>
              <Text style={styles.sliderLabel}>Neutral</Text>
              <Text style={styles.sliderLabel}>Strongly{'\n'}Agree</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={10}
              step={1}
              value={currentResponse}
              onValueChange={(value) => setResponses({ ...responses, [question.id]: value })}
              minimumTrackTintColor="#8b5cf6"
              maximumTrackTintColor="#d1d5db"
              thumbTintColor="#8b5cf6"
            />
            <Text style={styles.sliderValue}>{currentResponse}/10</Text>
          </View>

          {/* Navigation buttons */}
          <View style={styles.navigationButtons}>
            <TouchableOpacity
              style={[styles.navButton, currentQuestion === 0 && styles.navButtonDisabled]}
              onPress={goToPrevious}
              disabled={currentQuestion === 0}
            >
              <MaterialIcons name="arrow-back" size={24} color={currentQuestion === 0 ? '#9ca3af' : '#8b5cf6'} />
              <Text style={[styles.navButtonText, currentQuestion === 0 && styles.navButtonTextDisabled]}>Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navButton}
              onPress={() => handleResponse(currentResponse)}
            >
              <Text style={styles.navButtonText}>
                {currentQuestion === coreBeliefQuestions.length - 1 ? 'Finish' : 'Next'}
              </Text>
              <MaterialIcons name="arrow-forward" size={24} color="#8b5cf6" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderResults = () => {
    const sortedDomains = coreBeliefsDomains
      .map(domain => ({
        ...domain,
        score: domainScores[domain.id]
      }))
      .sort((a, b) => a.score - b.score);

    const getScoreColor = (score) => {
      if (score <= 3) return '#ef4444'; // Red - severely limiting
      if (score <= 6) return '#f59e0b'; // Orange - moderately limiting
      if (score <= 8) return '#10b981'; // Green - healthy
      return '#8b5cf6'; // Purple - very healthy
    };

    const getScoreLabel = (score) => {
      if (score <= 3) return 'Limiting';
      if (score <= 6) return 'Room for Growth';
      if (score <= 8) return 'Healthy';
      return 'Strong';
    };

    return (
      <ScrollView style={styles.resultsContainer} contentContainerStyle={styles.resultsContent}>
        <Text style={styles.title}>Your Results</Text>
        <Text style={styles.subtitle}>Core Belief Domain Scores</Text>

        {sortedDomains.map((domain, index) => (
          <View key={domain.id} style={styles.domainResult}>
            <View style={styles.domainResultHeader}>
              <Text style={styles.domainResultName}>{domain.name}</Text>
              <View style={[styles.scoreChip, { backgroundColor: getScoreColor(domain.score) }]}>
                <Text style={styles.scoreChipText}>{domain.score}/10</Text>
              </View>
            </View>
            <Text style={styles.domainResultStatement}>{domain.coreStatement}</Text>
            <View style={styles.domainResultBar}>
              <View
                style={[
                  styles.domainResultBarFill,
                  { width: `${(domain.score / 10) * 100}%`, backgroundColor: getScoreColor(domain.score) }
                ]}
              />
            </View>
            <Text style={styles.domainResultLabel}>{getScoreLabel(domain.score)}</Text>
          </View>
        ))}

        <View style={styles.resultsActions}>
          <TouchableOpacity style={styles.primaryButton} onPress={startDiscussion}>
            <Text style={styles.primaryButtonText}>Discuss Results with Huxley</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={onComplete}>
            <Text style={styles.secondaryButtonText}>Complete (Skip Discussion)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderDiscussion = () => {
    const renderMessage = (message) => (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          message.isAI ? styles.aiMessage : styles.userMessage
        ]}
      >
        {message.isAI && (
          <Image
            source={require('../assets/images/huxley therapist.png')}
            style={styles.huxleyAvatar}
            resizeMode="contain"
          />
        )}
        <View style={[styles.messageBubble, message.isAI ? styles.aiBubble : styles.userBubble]}>
          <Text style={[styles.messageText, message.isAI ? styles.aiText : styles.userText]}>
            {message.text}
          </Text>
        </View>
      </View>
    );

    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <View style={styles.discussionHeader}>
          <MaterialIcons name="chat" size={24} color="#8b5cf6" />
          <Text style={styles.discussionHeaderTitle}>Results Discussion</Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map(renderMessage)}
          {loading && (
            <View style={styles.loadingContainer}>
              <Image
                source={require('../assets/images/huxley therapist.png')}
                style={styles.huxleyAvatar}
                resizeMode="contain"
              />
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color="#8b5cf6" />
                <Text style={styles.loadingText}>Huxley is thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.discussionActions}>
          <TouchableOpacity
            style={styles.completeDiscussionButton}
            onPress={completeDiscussion}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.completeDiscussionButtonText}>Complete Discussion</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Share your thoughts..."
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={loading || !inputText.trim()}
          >
            <MaterialIcons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  };

  const renderComplete = () => (
    <View style={styles.completeContainer}>
      <MaterialIcons name="check-circle" size={64} color="#10b981" />
      <Text style={styles.completeTitle}>Assessment Complete!</Text>
      <Text style={styles.completeText}>
        Your core beliefs assessment has been saved. You can revisit these results anytime and track how your beliefs evolve over time.
      </Text>
    </View>
  );

  if (saving && phase === 'questionnaire') {
    return (
      <View style={styles.savingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.savingText}>Calculating your results...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {phase === 'intro' && renderIntro()}
      {phase === 'questionnaire' && renderQuestionnaire()}
      {phase === 'results' && renderResults()}
      {phase === 'discussion' && renderDiscussion()}
      {phase === 'complete' && renderComplete()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb'
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center'
  },
  introIcon: {
    alignSelf: 'center',
    marginBottom: 24
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 16
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24
  },
  timeEstimate: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: 32
  },
  primaryButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#8b5cf6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12
  },
  secondaryButtonText: {
    color: '#8b5cf6',
    fontSize: 16,
    fontWeight: '600'
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#e5e7eb',
    marginBottom: 8
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#8b5cf6'
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  questionContainer: {
    flex: 1
  },
  questionContent: {
    padding: 24
  },
  domainBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ede9fe',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 16
  },
  domainBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8b5cf6'
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 32,
    lineHeight: 28
  },
  sliderContainer: {
    marginBottom: 32
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  sliderLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    maxWidth: 80
  },
  slider: {
    width: '100%',
    height: 40
  },
  sliderValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8b5cf6',
    textAlign: 'center',
    marginTop: 8
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#8b5cf6',
    gap: 8
  },
  navButtonDisabled: {
    borderColor: '#e5e7eb'
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8b5cf6'
  },
  navButtonTextDisabled: {
    color: '#9ca3af'
  },
  resultsContainer: {
    flex: 1
  },
  resultsContent: {
    padding: 24
  },
  domainResult: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  domainResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  domainResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1
  },
  scoreChip: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12
  },
  scoreChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff'
  },
  domainResultStatement: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 8
  },
  domainResultBar: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    marginBottom: 4
  },
  domainResultBarFill: {
    height: '100%',
    borderRadius: 4
  },
  domainResultLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right'
  },
  resultsActions: {
    marginTop: 24
  },
  discussionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 12
  },
  discussionHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827'
  },
  messagesContainer: {
    flex: 1
  },
  messagesContent: {
    padding: 16,
    gap: 12
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8
  },
  aiMessage: {
    justifyContent: 'flex-start'
  },
  userMessage: {
    justifyContent: 'flex-end',
    flexDirection: 'row-reverse'
  },
  huxleyAvatar: {
    width: 40,
    height: 40,
    marginRight: 8,
    marginTop: 4
  },
  loadingBubble: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16
  },
  aiBubble: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  userBubble: {
    backgroundColor: '#8b5cf6'
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20
  },
  aiText: {
    color: '#111827'
  },
  userText: {
    color: '#fff'
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic'
  },
  discussionActions: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  completeDiscussionButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center'
  },
  completeDiscussionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600'
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#f9fafb'
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db'
  },
  savingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb'
  },
  savingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280'
  },
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f9fafb'
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 12
  },
  completeText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24
  }
});

export default CoreBeliefsAssessment;
