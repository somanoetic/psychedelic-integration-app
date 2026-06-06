import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Clock,
  Library,
  ExternalLink,
  Lightbulb,
} from 'lucide-react-native';
import { icons } from '../lib/uiIcons';

const USER_OPTION_ICON_MAP = {
  'arrow-back': ArrowLeft,
  'arrow-forward': ArrowRight,
};

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
  trauma_understanding: icons.repairedHeart,
  attachment_styles: icons.community,
  harm_reduction: icons.guidance,
  contemplative_practices: icons.meditate,
  psychedelic_preparation: icons.newBeginning,
  acceptance_commitment: icons.goals,
};
import { colors, gradients } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ConversationalEducation = ({ navigation, onSelectTopic, onViewAllTopics }) => {
  const [conversationStep, setConversationStep] = useState('greeting'); // greeting, categories, topic_selection

  const educationCategories = [
    {
      id: 'basics',
      title: 'Teach me the basics',
      icon: 'auto-stories',
      color: colors.primary,
      iconImg: icons.educationProgress,
      description: 'Foundation knowledge on integration, your nervous system, and how healing works',
      topics: ['nervous_system', 'integration_basics', 'ifs_basics', 'grounding_practices']
    },
    {
      id: 'about_myself',
      title: 'Teach me about myself',
      icon: 'psychology',
      color: '#8b5cf6',
      iconImg: icons.dna,
      description: 'Interactive tools to explore your inner world and patterns',
      topics: ['ifs_chat', 'polyvagal_mapping', 'triggers_glimmers', 'regulating_resources', 'core_beliefs']
    },
    {
      id: 'body_and_brain',
      title: 'Body, brain & healing',
      icon: 'healing',
      color: colors.error,
      iconImg: icons.lungs,
      description: 'How your body and brain process experiences and support healing',
      topics: ['somatic_awareness', 'brain_and_healing', 'trauma_understanding', 'attachment_styles']
    },
    {
      id: 'tools_and_practices',
      title: 'Tools & daily practices',
      icon: 'build',
      color: colors.warning,
      iconImg: icons.tools,
      description: 'Practical skills for building lasting change',
      topics: ['building_habits', 'cognitive_patterns', 'contemplative_practices', 'acceptance_commitment']
    },
    {
      id: 'therapies',
      title: 'Preparation & safety',
      icon: 'shield',
      color: colors.success,
      iconImg: icons.guidance,
      description: 'Set & setting, harm reduction, and the full integration arc',
      topics: ['psychedelic_preparation', 'harm_reduction']
    },
    {
      id: 'deep_dives',
      title: 'Deep dives & all topics',
      icon: 'school',
      color: '#6366f1',
      iconImg: icons.educationProgress,
      description: 'Browse the complete library of integration education',
      topics: ['all_topics']
    }
  ];

  const topicDetails = {
    // Basics category
    nervous_system: {
      title: 'Nervous System Basics',
      description: 'Understanding your three states of activation and safety',
      time: '5 minutes',
      color: colors.primary
    },
    ifs_basics: {
      title: 'Parts of You (IFS)',
      description: 'Meet your inner protectors and wounded parts',
      time: '7 minutes',
      color: colors.primary
    },
    grounding_practices: {
      title: 'Grounding & Somatic Practices',
      description: 'Learn self-regulation techniques for any moment',
      time: '8 minutes',
      color: colors.primary
    },
    // About Myself category
    ifs_chat: {
      title: 'IFS Parts Work Chat',
      description: 'Interactive guidance through the Six F\'s with your parts',
      time: '15-20 minutes',
      color: '#8b5cf6'
    },
    polyvagal_mapping: {
      title: 'Polyvagal Mapping',
      description: 'Identify what each nervous system state feels like for you',
      time: '10-15 minutes',
      color: '#8b5cf6'
    },
    core_beliefs: {
      title: 'Core Beliefs Inventory',
      description: 'Explore and challenge limiting beliefs with CBT techniques',
      time: '12-15 minutes',
      color: '#8b5cf6'
    },
    triggers_glimmers: {
      title: 'Triggers & Glimmers',
      description: 'What dysregulates you and what brings you safety',
      time: '10-12 minutes',
      color: '#8b5cf6'
    },
    regulating_resources: {
      title: 'Regulating Resources',
      description: 'What helps you regulate - alone and with others',
      time: '8-10 minutes',
      color: '#8b5cf6'
    },
    // New modules from knowledge base
    integration_basics: {
      title: 'Integration Basics',
      description: 'What integration is and why it matters',
      time: '7 minutes',
      color: colors.primary
    },
    somatic_awareness: {
      title: 'Somatic Awareness & the Body',
      description: 'Learn to read your body\'s signals and use body-based tools',
      time: '10 minutes',
      color: colors.error
    },
    brain_and_healing: {
      title: 'Your Brain on Healing',
      description: 'How neuroscience explains why integration works',
      time: '10 minutes',
      color: colors.error
    },
    building_habits: {
      title: 'Building Integration Habits',
      description: 'Use habit science to make your practices stick',
      time: '8 minutes',
      color: colors.warning
    },
    cognitive_patterns: {
      title: 'Cognitive Patterns & Distortions',
      description: 'Recognize thinking traps and learn to reframe them',
      time: '9 minutes',
      color: colors.warning
    },
    trauma_understanding: {
      title: 'Understanding Trauma',
      description: 'What trauma is and how integration supports healing',
      time: '10 minutes',
      color: colors.error
    },
    attachment_styles: {
      title: 'Attachment & Relationships',
      description: 'How your attachment patterns shape your inner world',
      time: '9 minutes',
      color: colors.error
    },
    harm_reduction: {
      title: 'Harm Reduction & Safety',
      description: 'Practical safety knowledge for responsible use',
      time: '8 minutes',
      color: colors.success
    },
    contemplative_practices: {
      title: 'Contemplative & Mindfulness',
      description: 'Meditation and mindfulness approaches to integration',
      time: '9 minutes',
      color: colors.warning
    },
    psychedelic_preparation: {
      title: 'Preparation & The Integration Arc',
      description: 'The full arc from preparation to long-term integration',
      time: '12 minutes',
      color: colors.success
    },
    acceptance_commitment: {
      title: 'Acceptance & Commitment (ACT)',
      description: 'Psychological flexibility through acceptance and values',
      time: '9 minutes',
      color: colors.warning
    }
  };

  const renderHuxleyMessage = (message) => {
    return (
      <View style={styles.messageContainer}>
        <View style={styles.huxleyMessageBubble}>
          <Image
            source={require('../assets/images/huxley-avatar.png')}
            style={styles.huxleyAvatar}
            resizeMode="contain"
          />
          <View style={styles.messageBubble}>
            <Text style={styles.huxleyName}>Huxley</Text>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderUserOption = (text, onPress, icon, color = colors.primary) => {
    const Icon = USER_OPTION_ICON_MAP[icon] || ArrowLeft;
    return (
      <TouchableOpacity
        style={[styles.userOption, { borderColor: color }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Icon size={24} color={color} strokeWidth={2} style={styles.optionIcon} />
        <Text style={[styles.userOptionText, { color }]}>{text}</Text>
        <ArrowRight size={20} color={color} strokeWidth={2} />
      </TouchableOpacity>
    );
  };

  const renderTopicCard = (topicId) => {
    const topic = topicDetails[topicId];
    if (!topic) return null;
    const topicIcon = TOPIC_ICONS[topicId];

    return (
      <TouchableOpacity
        key={topicId}
        style={[styles.topicCard, { borderLeftColor: topic.color }]}
        onPress={() => {
          if (onSelectTopic) {
            onSelectTopic(topicId);
          } else {
            console.log('Selected topic:', topicId);
          }
        }}
        activeOpacity={0.7}
      >
        {topicIcon ? (
          <Image source={topicIcon} style={styles.topicIconImage} />
        ) : null}
        <View style={styles.topicContent}>
          <Text style={styles.topicTitle}>{topic.title}</Text>
          <Text style={styles.topicDescription}>{topic.description}</Text>
          <View style={styles.topicTimeRow}>
            <Clock size={12} color={colors.textLight} strokeWidth={2} />
            <Text style={styles.topicTime}>{topic.time}</Text>
          </View>
        </View>
        <ChevronRight size={24} color={colors.textLight} strokeWidth={2} />
      </TouchableOpacity>
    );
  };

  const renderGreeting = () => (
    <>
      {renderHuxleyMessage(
        "Hi! I'm Huxley. I'm here to help you learn about psychedelic integration. Whether you're brand new or want to deepen your practice, I'll guide you through it. What would you like to explore?"
      )}
      <View style={styles.optionsContainer}>
        <Text style={styles.optionsLabel}>Choose your path:</Text>

        {educationCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.categoryCard, { borderLeftColor: category.color }]}
            onPress={() => setConversationStep(category.id)}
            activeOpacity={0.7}
          >
            <View style={styles.categoryIconContainer}>
              {category.iconImg ? (
                <Image source={category.iconImg} style={styles.categoryIconImage} />
              ) : null}
            </View>
            <View style={styles.categoryContent}>
              <Text style={[styles.categoryTitle, { color: category.color }]}>
                {category.title}
              </Text>
              <Text style={styles.categoryDescription}>{category.description}</Text>
            </View>
            <ArrowRight size={24} color={category.color} strokeWidth={2} />
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  const renderBasics = () => (
    <>
      {renderHuxleyMessage(
        "Perfect place to start! These are the foundational concepts that will support all your integration work. I recommend starting with Nervous System Basics - it helps you understand what you're experiencing during and after sessions."
      )}

      <View style={styles.topicsContainer}>
        <Text style={styles.topicsLabel}>Foundation Topics:</Text>
        {renderTopicCard('nervous_system')}
        {renderTopicCard('integration_basics')}
        {renderTopicCard('ifs_basics')}
        {renderTopicCard('grounding_practices')}
      </View>

    </>
  );

  const renderAboutMyself = () => (
    <>
      {renderHuxleyMessage(
        "Excellent! These are interactive tools where we explore your unique patterns, parts, and nervous system together. Each one helps you build self-awareness in different ways. Pick whichever feels right for where you are today."
      )}

      <View style={styles.topicsContainer}>
        <Text style={styles.topicsLabel}>Self-Discovery Tools:</Text>
        {renderTopicCard('ifs_chat')}
        {renderTopicCard('polyvagal_mapping')}
        {renderTopicCard('triggers_glimmers')}
        {renderTopicCard('regulating_resources')}
        {renderTopicCard('core_beliefs')}
      </View>

    </>
  );

  const renderBodyAndBrain = () => (
    <>
      {renderHuxleyMessage(
        "Understanding how your body and brain process experiences is powerful. These modules draw from neuroscience, somatic therapy, trauma research, and attachment theory to help you understand WHY integration works — not just how to do it."
      )}

      <View style={styles.topicsContainer}>
        <Text style={styles.topicsLabel}>Body, Brain & Healing:</Text>
        {renderTopicCard('somatic_awareness')}
        {renderTopicCard('brain_and_healing')}
        {renderTopicCard('trauma_understanding')}
        {renderTopicCard('attachment_styles')}
      </View>

    </>
  );

  const renderToolsAndPractices = () => (
    <>
      {renderHuxleyMessage(
        "These are practical tools you can use every day. From building lasting habits to working with your thinking patterns, these skills make the difference between a powerful experience and a transformed life."
      )}

      <View style={styles.topicsContainer}>
        <Text style={styles.topicsLabel}>Practical Tools:</Text>
        {renderTopicCard('building_habits')}
        {renderTopicCard('cognitive_patterns')}
        {renderTopicCard('contemplative_practices')}
        {renderTopicCard('acceptance_commitment')}
      </View>

    </>
  );

  const renderTherapies = () => (
    <>
      {renderHuxleyMessage(
        "Safety and preparation are essential. These modules cover the full arc of integration — from preparing well to practicing harm reduction — so you can approach every experience with confidence and care."
      )}

      <View style={styles.topicsContainer}>
        <Text style={styles.topicsLabel}>Preparation & Safety:</Text>
        {renderTopicCard('psychedelic_preparation')}
        {renderTopicCard('harm_reduction')}
      </View>

    </>
  );

  const renderDeepDives = () => (
    <>
      {renderHuxleyMessage(
        "Ready to explore everything? Browse the complete library of integration education — from foundational concepts to advanced therapeutic frameworks."
      )}

      <View style={styles.topicsContainer}>
        <Text style={styles.topicsLabel}>Complete Library:</Text>

        <TouchableOpacity
          style={styles.allTopicsButton}
          onPress={() => {
            if (onViewAllTopics) {
              onViewAllTopics();
            } else if (navigation) {
              navigation.navigate('EducationHub');
            }
          }}
          activeOpacity={0.7}
        >
          <Library size={32} color="#6366f1" strokeWidth={2} />
          <View style={styles.allTopicsContent}>
            <Text style={styles.allTopicsTitle}>Browse All 21 Topics</Text>
            <Text style={styles.allTopicsDescription}>
              View the complete education library with detailed theory and practice lessons
            </Text>
          </View>
          <ExternalLink size={24} color="#6366f1" strokeWidth={2} />
        </TouchableOpacity>

        <Text style={styles.popularLabel}>Recommended starting points:</Text>
        {renderTopicCard('nervous_system')}
        {renderTopicCard('integration_basics')}
      </View>

    </>
  );

  const renderProTip = () => (
    <View style={styles.proTipContainer}>
      <View style={styles.proTipHeader}>
        <Lightbulb size={20} color={colors.warning} strokeWidth={2} />
        <Text style={styles.proTipLabel}>Pro Tip</Text>
      </View>
      <Text style={styles.proTipText}>
        You can pause any practice and come back to it later. Your progress is saved automatically.
      </Text>
    </View>
  );

  const handleBack = () => {
    if (conversationStep !== 'greeting') {
      setConversationStep('greeting');
    } else {
      navigation?.goBack();
    }
  };

  return (
    <LinearGradient
      colors={gradients.standard}
      start={gradients.standardStart}
      end={gradients.standardEnd}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Learning Hub</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.messagesContainer}>
          {conversationStep === 'greeting' && renderGreeting()}
          {conversationStep === 'basics' && renderBasics()}
          {conversationStep === 'about_myself' && renderAboutMyself()}
          {conversationStep === 'body_and_brain' && renderBodyAndBrain()}
          {conversationStep === 'tools_and_practices' && renderToolsAndPractices()}
          {conversationStep === 'therapies' && renderTherapies()}
          {conversationStep === 'deep_dives' && renderDeepDives()}
        </View>

        {conversationStep === 'greeting' && renderProTip()}
      </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  messagesContainer: {
    gap: 16,
  },
  messageContainer: {
    marginBottom: 8,
  },
  huxleyMessageBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  huxleyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 8,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  messageBubble: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginLeft: 12,
    padding: 16,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  huxleyName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 12,
    marginTop: 16,
  },
  optionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryIconContainer: {
    marginRight: 12,
  },
  categoryIconImage: {
    width: 96,
    height: 96,
    resizeMode: 'contain',
  },
  categoryEmoji: {
    fontSize: 32,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  topicsContainer: {
    gap: 12,
    marginTop: 16,
  },
  topicsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  topicIconImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginRight: 12,
  },
  topicEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  topicContent: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  topicDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  topicTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topicTime: {
    fontSize: 11,
    color: colors.textLight,
  },
  userOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionIcon: {
    marginRight: 12,
  },
  userOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  allTopicsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  allTopicsContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  allTopicsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryDark,
    marginBottom: 4,
  },
  allTopicsDescription: {
    fontSize: 13,
    color: colors.primary,
    lineHeight: 18,
  },
  popularLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  proTipContainer: {
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fcd34d',
    marginTop: 24,
  },
  proTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  proTipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginLeft: 8,
  },
  proTipText: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 18,
  },
});

export default ConversationalEducation;
