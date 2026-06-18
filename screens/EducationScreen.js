import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  Lightbulb,
  MessageCircle,
  Play,
  Sparkles,
  Target,
} from 'lucide-react-native';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import ConversationalEducation from '../components/ConversationalEducation';
import PolyvagalEducationWidget from '../enhanced-components/PolyvagalEducationWidget';
import ConversationalNervousSystemMapping from '../components/ConversationalNervousSystemMapping';
import ConversationalTriggersGlimmers from '../components/ConversationalTriggersGlimmers';
import ConversationalRegulatingResources from '../components/ConversationalRegulatingResources';
import IFSPartsWorkChatWithContext from '../enhanced-components/IFSPartsWorkChatWithContext';
import IFSPartsEducationWidget from '../components/IFSPartsEducationWidget';
import GroundingExercisesWidget from '../components/GroundingExercisesWidget';
import { educationTopics, getTopicById } from '../content/education';
import { getExerciseById } from '../content/exercises-comprehensive';
import FormattedText from '../components/FormattedText';
import { icons } from '../lib/uiIcons';

// Mirror ConversationalEducation.js — semantic topic ID -> illustrated PNG icon
const TOPIC_ICONS = {
  nervous_system: icons.dna,
  ifs_basics: icons.group,
  grounding_practices: icons.sprout,
  ifs_chat: icons.chat,
  polyvagal_mapping: icons.foldedMap,
  core_beliefs: icons.thoughtCloud,
  triggers_glimmers: icons.trigger,
  regulating_resources: icons.tools,
  integration_basics: icons.integration,
  somatic_awareness: icons.lungs,
  brain_and_healing: icons.dna,
  building_habits: icons.integration,
  cognitive_patterns: icons.thoughtCloud,
  nervous_system_safety: icons.nsMap,
  trauma_understanding: icons.repairedHeart,
  mind_body_pain: icons.sensation,
  attachment_styles: icons.community,
  emotional_learning_change: icons.integrationCycle,
  mind_brain_relationships: icons.interconnectedness,
  harm_reduction: icons.guidance,
  contemplative_practices: icons.meditate,
  psychedelic_preparation: icons.newBeginning,
  acceptance_commitment: icons.goals,
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const EducationScreen = ({ navigation, route }) => {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [showConversational, setShowConversational] = useState(true);
  // If the user was deep-linked into a topic from another screen (e.g.
  // the trail), remember where to send them back when the topic closes.
  const [returnTo, setReturnTo] = useState(null);

  // Honor a `selectedTopicId` route param so deep-links (e.g. from the
  // trail's education markers) open directly to the requested topic.
  // If `returnTo` is also provided, stash it so handleEducationComplete
  // can navigate back instead of leaving the user on the Learn hub.
  useEffect(() => {
    const id = route?.params?.selectedTopicId;
    const back = route?.params?.returnTo;
    if (id) {
      setSelectedTopic(id);
      if (back) setReturnTo(back);
      navigation.setParams?.({ selectedTopicId: undefined, returnTo: undefined });
    }
  }, [route?.params?.selectedTopicId]);

  const handleTopicPress = (topicId) => {
    setSelectedTopic(topicId);
  };

  const handleEducationComplete = () => {
    setSelectedTopic(null);
    if (returnTo) {
      const dest = returnTo;
      setReturnTo(null);
      navigation.navigate(dest);
    }
  };

  const renderEducationHub = () => {
    return (
      <LinearGradient colors={gradients.standard} start={{ x: 1.0, y: 0.0 }} end={{ x: 0.0, y: 1.0 }} style={{ flex: 1 }}>
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
              <MessageCircle size={24} color={colors.primary} strokeWidth={2} />
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
                <View style={styles.ifsTimeRow}>
                  <Clock size={14} color={colors.primary} strokeWidth={2} />
                  <Text style={styles.ifsTime}>15-20 minutes • Interactive</Text>
                </View>
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
                <View style={styles.mappingTimeRow}>
                  <Clock size={14} color={colors.textLight} strokeWidth={2} />
                  <Text style={styles.mappingTime}>10-15 minutes</Text>
                </View>
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
                <View style={styles.mappingTimeRow}>
                  <Clock size={14} color={colors.textLight} strokeWidth={2} />
                  <Text style={styles.mappingTime}>10-12 minutes</Text>
                </View>
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
                <View style={styles.mappingTimeRow}>
                  <Clock size={14} color={colors.textLight} strokeWidth={2} />
                  <Text style={styles.mappingTime}>8-10 minutes</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
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
                {TOPIC_ICONS[topic.id] ? (
                  <Image source={TOPIC_ICONS[topic.id]} style={styles.topicCardIcon} />
                ) : (
                  <BookOpen size={28} color={colors.primary} strokeWidth={1.5} />
                )}
                <Text style={styles.topicTitle}>{topic.title}</Text>
                <Text style={styles.topicDescription}>{topic.description}</Text>
                <Text style={styles.topicTime}>{topic.estimatedTime}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Getting Started Tips */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Lightbulb size={20} color={colors.primary} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Getting Started Tips</Text>
          </View>
          <View style={styles.tipsContainer}>
            <View style={styles.tip}>
              <Text style={styles.tipEmoji}>🎯</Text>
              <Text style={styles.tipText}>
                Start with nervous system basics - it's the foundation for everything else
              </Text>
            </View>
            <View style={styles.tip}>
              <View style={styles.tipIconWrap}>
                <Clock size={20} color={colors.success} strokeWidth={2} />
              </View>
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
      </LinearGradient>
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

    // Special case: Use conversational nervous system mapping (via huxleyService mode handler)
    if (selectedTopic === 'polyvagal_mapping') {
      return (
        <ConversationalNervousSystemMapping
          onComplete={handleEducationComplete}
          navigation={navigation}
        />
      );
    }

    // Special case: Use conversational triggers & glimmers (via huxleyService mode handler)
    if (selectedTopic === 'triggers_glimmers') {
      return (
        <ConversationalTriggersGlimmers
          onComplete={handleEducationComplete}
          navigation={navigation}
        />
      );
    }

    // Special case: Use conversational regulating resources (via huxleyService mode handler)
    if (selectedTopic === 'regulating_resources') {
      return (
        <ConversationalRegulatingResources
          onComplete={handleEducationComplete}
          navigation={navigation}
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
          <TouchableOpacity onPress={handleEducationComplete}>
            <Text style={styles.backButton}>
              {returnTo === 'CurriculumTracker' ? '← Back to Trails' : '← Back to Education'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.topicContent}>
          <View style={styles.topicHeroIconWrap}>
            {TOPIC_ICONS[selectedTopic] ? (
              <Image source={TOPIC_ICONS[selectedTopic]} style={styles.topicHeroIcon} />
            ) : (
              <BookOpen size={64} color={colors.primary} strokeWidth={1.5} />
            )}
          </View>
          <Text style={styles.topicLargeTitle}>{topic.title}</Text>
          <View style={styles.topicEstimatedTimeRow}>
            <Clock size={14} color={colors.textSecondary} strokeWidth={2} />
            <Text style={styles.topicEstimatedTime}>{topic.estimatedTime}</Text>
          </View>

          {/* Content Sections */}
          {topic.content && topic.content.map((section, index) => (
            <View key={index} style={styles.contentSection}>
              <Text style={styles.contentSectionTitle}>{section.title}</Text>
              <FormattedText style={styles.contentSectionText}>{section.text}</FormattedText>
            </View>
          ))}

          {/* Key Takeaways */}
          {topic.keyTakeaways && topic.keyTakeaways.length > 0 && (
            <View style={styles.takeawaysContainer}>
              <View style={styles.takeawaysTitleRow}>
                <Target size={20} color="#166534" strokeWidth={2} />
                <Text style={styles.takeawaysTitle}>Key Takeaways</Text>
              </View>
              {topic.keyTakeaways.map((takeaway, index) => (
                <View key={index} style={styles.takeawayItem}>
                  <Text style={styles.takeawayBullet}>•</Text>
                  <Text style={styles.takeawayText}>{takeaway}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Try This — inline bespoke practice for this article */}
          {topic.tryThis && (
            <View style={styles.tryThisContainer}>
              <View style={styles.tryThisTitleRow}>
                <Sparkles size={20} color={colors.primary} strokeWidth={2} />
                <Text style={styles.tryThisTitle}>Try this</Text>
              </View>
              <Text style={styles.tryThisName}>
                {topic.tryThis.title}
                {topic.tryThis.duration ? `  ·  ${topic.tryThis.duration}` : ''}
              </Text>
              {topic.tryThis.intro ? (
                <Text style={styles.tryThisIntro}>{topic.tryThis.intro}</Text>
              ) : null}
              {topic.tryThis.steps && topic.tryThis.steps.map((step, index) => (
                <View key={index} style={styles.tryThisStep}>
                  <Text style={styles.tryThisStepNum}>{index + 1}</Text>
                  <Text style={styles.tryThisStepText}>{step}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Practice these — tappable links to related interactive exercises */}
          {topic.relatedExercises && topic.relatedExercises.length > 0 && (() => {
            const related = topic.relatedExercises
              .map((id) => getExerciseById(id))
              .filter(Boolean);
            if (related.length === 0) return null;
            return (
              <View style={styles.relatedExContainer}>
                <Text style={styles.relatedExTitle}>Practice these</Text>
                {related.map((ex) => (
                  <TouchableOpacity
                    key={ex.id}
                    style={styles.relatedExChip}
                    onPress={() =>
                      navigation.navigate('GuidedExercise', {
                        exercise: ex,
                        returnTo: 'Learn',
                      })
                    }
                  >
                    <View style={styles.relatedExIconWrap}>
                      <Play size={16} color={colors.primary} strokeWidth={2} fill={colors.primary} />
                    </View>
                    <View style={styles.relatedExTextWrap}>
                      <Text style={styles.relatedExName}>{ex.title}</Text>
                      {(ex.duration || ex.steps?.length) ? (
                        <Text style={styles.relatedExMeta}>
                          {ex.duration ? `${ex.duration} min` : ''}
                          {ex.duration && ex.steps?.length ? ' · ' : ''}
                          {ex.steps?.length ? `${ex.steps.length} steps` : ''}
                        </Text>
                      ) : null}
                    </View>
                    <ArrowRight size={16} color={colors.textSecondary} strokeWidth={2} />
                  </TouchableOpacity>
                ))}
              </View>
            );
          })()}

          {/* See Also — tappable cross-links to related topics */}
          {topic.seeAlso && topic.seeAlso.length > 0 && (() => {
            const related = topic.seeAlso
              .map((id) => getTopicById(id))
              .filter(Boolean);
            if (related.length === 0) return null;
            return (
              <View style={styles.seeAlsoContainer}>
                <Text style={styles.seeAlsoTitle}>See also</Text>
                {related.map((rel) => (
                  <TouchableOpacity
                    key={rel.id}
                    style={styles.seeAlsoChip}
                    onPress={() => handleTopicPress(rel.id)}
                  >
                    {rel.emoji ? (
                      <Text style={styles.seeAlsoEmoji}>{rel.emoji}</Text>
                    ) : null}
                    <Text style={styles.seeAlsoChipText}>{rel.title}</Text>
                    <ArrowRight size={16} color={colors.primary} strokeWidth={2} />
                  </TouchableOpacity>
                ))}
              </View>
            );
          })()}

          {/* Sources footer */}
          {topic.sources && topic.sources.length > 0 && (
            <View style={styles.sourcesContainer}>
              <View style={styles.sourcesTitleRow}>
                <BookOpen size={16} color={colors.textSecondary} strokeWidth={2} />
                <Text style={styles.sourcesTitle}>Sources</Text>
              </View>
              {topic.sources.map((source, index) => (
                <Text key={index} style={styles.sourcesText}>{source}</Text>
              ))}
            </View>
          )}

          {/* Completion Button */}
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleEducationComplete}
          >
            <Check size={20} color={colors.textInverse} strokeWidth={2} />
            <Text style={styles.completeButtonText}>Got It!</Text>
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
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    padding: 24,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 2,
    borderColor: colors.primary,
    minWidth: 60,
  },
  conversationalToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
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
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
    color: colors.primary,
    fontWeight: '500',
  },
  ifsTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mappingCard: {
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.success,
    marginBottom: 12,
  },
  triggersCard: {
    backgroundColor: colors.bubbleArchetypal,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.warning,
    marginBottom: 12,
  },
  resourcesCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.primary,
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
    color: colors.textLight,
  },
  mappingTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    backgroundColor: colors.bubbleArchetypal,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.warning,
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
    borderColor: colors.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  topicCardIcon: {
    width: 56,
    height: 56,
    resizeMode: 'contain',
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
    color: colors.textLight,
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
    borderLeftColor: colors.success,
  },
  tipEmoji: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  tipIconWrap: {
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    fontSize: 14,
    color: colors.text,
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
    borderBottomColor: colors.lightGray,
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
  topicHeroIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  topicHeroIcon: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
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
    color: colors.text,
    fontWeight: '500',
  },
  // New styles for content display
  topicEstimatedTime: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  topicEstimatedTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
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
    color: colors.text,
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
  takeawaysTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  takeawaysTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#166534',
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
  tryThisContainer: {
    backgroundColor: '#eef2fb',
    borderRadius: 12,
    padding: 20,
    marginTop: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#c7d4f0',
  },
  tryThisTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tryThisTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  tryThisName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  tryThisIntro: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 14,
  },
  tryThisStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  tryThisStepNum: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    width: 20,
    lineHeight: 21,
  },
  tryThisStepText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    lineHeight: 21,
  },
  relatedExContainer: {
    marginTop: 4,
    marginBottom: 16,
  },
  relatedExTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  relatedExChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.sand,
  },
  relatedExIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eef2fb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatedExTextWrap: {
    flex: 1,
  },
  relatedExName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  relatedExMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  seeAlsoContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  seeAlsoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  seeAlsoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.sand,
  },
  seeAlsoEmoji: {
    fontSize: 20,
  },
  seeAlsoChipText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  sourcesContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  sourcesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  sourcesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sourcesText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.success,
    padding: 16,
    borderRadius: 12,
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