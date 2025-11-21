import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme/colors';
import ConversationalEducation from '../components/ConversationalEducation';
import PolyvagalEducationWidget from '../enhanced-components/PolyvagalEducationWidget';
import PolyvagalMappingWidgetAI from '../enhanced-components/PolyvagalMappingWidgetAI';
import TriggersAndGlimmersWidgetAI from '../enhanced-components/TriggersAndGlimmersWidgetAI';
import RegulatingResourcesWidgetAI from '../enhanced-components/RegulatingResourcesWidgetAI';
import IFSPartsWorkChatWithContext from '../enhanced-components/IFSPartsWorkChatWithContext';
import IFSPartsEducationWidget from '../components/IFSPartsEducationWidget';
import GroundingExercisesWidget from '../components/GroundingExercisesWidget';
import userRoleService from '../lib/userRoleService';
import { educationTopics, getTopicById } from '../content/education';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const EducationScreen = ({ navigation }) => {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [showConversational, setShowConversational] = useState(true);
  const [userRole, setUserRole] = useState({ role: 'user', verified: false });
  const [canAccessTraining, setCanAccessTraining] = useState(false);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const roleData = await userRoleService.getCurrentUserRole();
      const canAccess = await userRoleService.canAccessTrainingScenarios();
      setUserRole(roleData);
      setCanAccessTraining(canAccess);
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const handleTopicPress = (topicId) => {
    setSelectedTopic(topicId);
  };

  const handleEducationComplete = () => {
    setSelectedTopic(null);
  };

  const renderEducationHub = () => {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Integration Education</Text>
              <Text style={styles.headerSubtitle}>
                Learn the foundations of psychedelic integration
              </Text>
            </View>
            <TouchableOpacity
              style={styles.conversationalToggle}
              onPress={() => setShowConversational(true)}
            >
              <MaterialIcons name="chat" size={24} color="#8b5cf6" />
              <Text style={styles.conversationalToggleText}>Guided</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Start */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚀 Quick Start</Text>
          <TouchableOpacity
            style={styles.quickStartCard}
            onPress={() => handleTopicPress('nervous_system')}
          >
            <View style={styles.quickStartContent}>
              <Text style={styles.quickStartEmoji}>🧠💚⚡🛡️</Text>
              <Text style={styles.quickStartTitle}>Start Here: Nervous System Basics</Text>
              <Text style={styles.quickStartDescription}>
                Essential knowledge for understanding your states during integration
              </Text>
              <Text style={styles.quickStartTime}>5 minutes</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* IFS Parts Work Session */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💬 Interactive Practices</Text>
          <Text style={styles.sectionSubtitle}>
            Guided sessions for deep inner work
          </Text>

          <TouchableOpacity
            style={styles.ifsCard}
            onPress={() => handleTopicPress('ifs_chat')}
          >
            <View style={styles.ifsContent}>
              <Text style={styles.ifsEmoji}>💬</Text>
              <View style={styles.ifsTextContainer}>
                <Text style={styles.ifsTitle}>IFS Parts Work Session</Text>
                <Text style={styles.ifsDescription}>
                  Chat-based guidance through the Six F's to get to know one of your parts
                </Text>
                <Text style={styles.ifsTime}>⏱️ 15-20 minutes • Interactive</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Interactive Mapping Exercises */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗺️ Nervous System Mapping</Text>
          <Text style={styles.sectionSubtitle}>
            Build self-awareness through guided exercises
          </Text>

          <TouchableOpacity
            style={styles.mappingCard}
            onPress={() => handleTopicPress('polyvagal_mapping')}
          >
            <View style={styles.mappingContent}>
              <Text style={styles.mappingEmoji}>🗺️</Text>
              <View style={styles.mappingTextContainer}>
                <Text style={styles.mappingTitle}>Map Your Nervous System</Text>
                <Text style={styles.mappingDescription}>
                  Identify what each state looks and feels like for you
                </Text>
                <Text style={styles.mappingTime}>⏱️ 10-15 minutes</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.triggersCard}
            onPress={() => handleTopicPress('triggers_glimmers')}
          >
            <View style={styles.mappingContent}>
              <Text style={styles.mappingEmoji}>⚡✨</Text>
              <View style={styles.mappingTextContainer}>
                <Text style={styles.mappingTitle}>Triggers & Glimmers</Text>
                <Text style={styles.mappingDescription}>
                  Map what dysregulates you and what brings safety
                </Text>
                <Text style={styles.mappingTime}>⏱️ 10-12 minutes</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resourcesCard}
            onPress={() => handleTopicPress('regulating_resources')}
          >
            <View style={styles.mappingContent}>
              <Text style={styles.mappingEmoji}>🛠️</Text>
              <View style={styles.mappingTextContainer}>
                <Text style={styles.mappingTitle}>Regulating Resources</Text>
                <Text style={styles.mappingDescription}>
                  Identify what helps you regulate - alone and with others
                </Text>
                <Text style={styles.mappingTime}>⏱️ 8-10 minutes</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Training Scenarios Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎓 Advanced Training</Text>
          
          {canAccessTraining ? (
            <TouchableOpacity 
              style={styles.trainingCard}
              onPress={() => navigation.navigate('ScenarioUpload')}
            >
              <View style={styles.trainingContent}>
                <Text style={styles.trainingEmoji}>📚</Text>
                <Text style={styles.trainingTitle}>Upload Training Scenarios</Text>
                <Text style={styles.trainingDescription}>
                  Train Claude with your own therapeutic examples to improve responses
                </Text>
                <Text style={styles.trainingNote}>✅ Verified Therapist Access</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.restrictedCard}
              onPress={() => navigation.navigate('TherapistVerification')}
            >
              <View style={styles.trainingContent}>
                <Text style={styles.trainingEmoji}>🔒</Text>
                <Text style={styles.trainingTitle}>Professional Training Access</Text>
                <Text style={styles.trainingDescription}>
                  Upload training scenarios to improve Claude's therapeutic responses
                </Text>
                <Text style={styles.restrictedNote}>🩺 Requires therapist verification</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* All Topics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 All Topics</Text>
          <View style={styles.topicsGrid}>
            {educationTopics.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                style={styles.topicCard}
                onPress={() => handleTopicPress(topic.id)}
              >
                <Text style={styles.topicEmoji}>{topic.emoji}</Text>
                <Text style={styles.topicTitle}>{topic.title}</Text>
                <Text style={styles.topicDescription}>{topic.description}</Text>
                <Text style={styles.topicTime}>{topic.estimatedTime}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Getting Started Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Getting Started Tips</Text>
          <View style={styles.tipsContainer}>
            <View style={styles.tip}>
              <Text style={styles.tipEmoji}>🎯</Text>
              <Text style={styles.tipText}>
                Start with nervous system basics - it's the foundation for everything else
              </Text>
            </View>
            <View style={styles.tip}>
              <Text style={styles.tipEmoji}>⏰</Text>
              <Text style={styles.tipText}>
                Take your time - you can pause and resume any topic
              </Text>
            </View>
            <View style={styles.tip}>
              <Text style={styles.tipEmoji}>🧘</Text>
              <Text style={styles.tipText}>
                Practice the exercises - they'll help during actual integration sessions
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      </SafeAreaView>
    );
  };

  const renderSelectedTopic = () => {
    // Special case: Use existing widget for nervous system
    if (selectedTopic === 'nervous_system') {
      return (
        <PolyvagalEducationWidget
          onComplete={handleEducationComplete}
          onSkip={handleEducationComplete}
        />
      );
    }

    // Special case: IFS basics (Parts Work education)
    if (selectedTopic === 'ifs_basics') {
      return (
        <IFSPartsEducationWidget
          onComplete={handleEducationComplete}
          onSkip={handleEducationComplete}
        />
      );
    }

    // Special case: Grounding practices
    if (selectedTopic === 'grounding_practices') {
      return (
        <GroundingExercisesWidget
          onComplete={handleEducationComplete}
          onSkip={handleEducationComplete}
        />
      );
    }

    // Special case: Use AI-powered interactive widget for polyvagal mapping
    if (selectedTopic === 'polyvagal_mapping') {
      return (
        <PolyvagalMappingWidgetAI
          onComplete={handleEducationComplete}
          onSkip={handleEducationComplete}
        />
      );
    }

    // Special case: Use AI-enhanced interactive widget for triggers & glimmers
    if (selectedTopic === 'triggers_glimmers') {
      return (
        <TriggersAndGlimmersWidgetAI
          onComplete={handleEducationComplete}
          onSkip={handleEducationComplete}
        />
      );
    }

    // Special case: Use AI-enhanced interactive widget for regulating resources
    if (selectedTopic === 'regulating_resources') {
      return (
        <RegulatingResourcesWidgetAI
          onComplete={handleEducationComplete}
          onSkip={handleEducationComplete}
        />
      );
    }

    // Special case: Use AI-powered IFS chat with context system
    if (selectedTopic === 'ifs_chat') {
      return (
        <IFSPartsWorkChatWithContext
          onComplete={handleEducationComplete}
          onSkip={handleEducationComplete}
        />
      );
    }

    // Get full topic content from education.js
    const topic = getTopicById(selectedTopic);

    if (!topic) {
      return null;
    }

    return (
      <SafeAreaView style={styles.topicContainer} edges={['top', 'bottom']}>
        <View style={styles.topicHeader}>
          <TouchableOpacity onPress={() => setSelectedTopic(null)}>
            <Text style={styles.backButton}>← Back to Education</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.topicContent}>
          <Text style={styles.topicLargeEmoji}>{topic.emoji}</Text>
          <Text style={styles.topicLargeTitle}>{topic.title}</Text>
          <Text style={styles.topicEstimatedTime}>⏱️ {topic.estimatedTime}</Text>

          {/* Content Sections */}
          {topic.content && topic.content.map((section, index) => (
            <View key={index} style={styles.contentSection}>
              <Text style={styles.contentSectionTitle}>{section.title}</Text>
              <Text style={styles.contentSectionText}>{section.text}</Text>
            </View>
          ))}

          {/* Key Takeaways */}
          {topic.keyTakeaways && topic.keyTakeaways.length > 0 && (
            <View style={styles.takeawaysContainer}>
              <Text style={styles.takeawaysTitle}>🎯 Key Takeaways</Text>
              {topic.keyTakeaways.map((takeaway, index) => (
                <View key={index} style={styles.takeawayItem}>
                  <Text style={styles.takeawayBullet}>•</Text>
                  <Text style={styles.takeawayText}>{takeaway}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Completion Button */}
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleEducationComplete}
          >
            <Text style={styles.completeButtonText}>✓ Got It!</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  };

  if (selectedTopic) {
    return renderSelectedTopic();
  }

  if (showConversational) {
    return (
      <ConversationalEducation
        navigation={navigation}
        onSelectTopic={(topicId) => {
          handleTopicPress(topicId);
        }}
        onViewAllTopics={() => {
          setShowConversational(false);
        }}
      />
    );
  }

  return renderEducationHub();
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    padding: 24,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  conversationalToggle: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#faf5ff',
    borderWidth: 2,
    borderColor: '#8b5cf6',
    minWidth: 60,
  },
  conversationalToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8b5cf6',
    marginTop: 2,
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  quickStartCard: {
    backgroundColor: '#dbeafe',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    marginTop: -8,
  },
  ifsCard: {
    backgroundColor: '#faf5ff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  ifsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ifsEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  ifsTextContainer: {
    flex: 1,
  },
  ifsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 6,
  },
  ifsDescription: {
    fontSize: 14,
    color: colors.primary,
    lineHeight: 20,
    marginBottom: 6,
  },
  ifsTime: {
    fontSize: 12,
    color: '#a855f7',
    fontWeight: '500',
  },
  mappingCard: {
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#10b981',
    marginBottom: 12,
  },
  triggersCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    marginBottom: 12,
  },
  resourcesCard: {
    backgroundColor: '#f3e8ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#8b5cf6',
  },
  mappingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mappingEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  mappingTextContainer: {
    flex: 1,
  },
  mappingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  mappingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  mappingTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  quickStartContent: {
    alignItems: 'center',
  },
  quickStartEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  quickStartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
    textAlign: 'center',
  },
  quickStartDescription: {
    fontSize: 14,
    color: '#1e40af',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  quickStartTime: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  trainingCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#0ea5e9',
  },
  trainingContent: {
    alignItems: 'center',
  },
  trainingEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  trainingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 8,
    textAlign: 'center',
  },
  trainingDescription: {
    fontSize: 14,
    color: '#0c4a6e',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  trainingNote: {
    fontSize: 12,
    color: '#0284c7',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  restrictedCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  restrictedNote: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  topicsGrid: {
    gap: 16,
  },
  topicCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  topicEmoji: {
    fontSize: 24,
    marginBottom: 12,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  topicDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  topicTime: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  tipsContainer: {
    gap: 12,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  tipEmoji: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    flex: 1,
  },
  // Selected topic styles
  topicContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  topicHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  topicContent: {
    flex: 1,
    padding: 24,
  },
  topicLargeEmoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  topicLargeTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 32,
  },
  comingSoonContainer: {
    alignItems: 'center',
    padding: 32,
  },
  comingSoonEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  comingSoonText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  alternativeActions: {
    gap: 12,
    width: '100%',
  },
  alternativeButton: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  alternativeButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  // New styles for content display
  topicEstimatedTime: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  contentSection: {
    marginBottom: 24,
  },
  contentSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  contentSectionText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
  takeawaysContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 20,
    marginTop: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  takeawaysTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 16,
  },
  takeawayItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  takeawayBullet: {
    fontSize: 16,
    color: '#166534',
    marginRight: 8,
    fontWeight: 'bold',
  },
  takeawayText: {
    fontSize: 15,
    color: '#166534',
    lineHeight: 22,
    flex: 1,
  },
  completeButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textInverse,
  },
};

export default EducationScreen;