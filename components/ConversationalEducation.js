import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AVATAR_OPTIONS } from './AvatarSelector';
import { colors } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ConversationalEducation = ({ navigation, onSelectTopic, onViewAllTopics }) => {
  const [selectedAvatar, setSelectedAvatar] = useState('brain');
  const [conversationStep, setConversationStep] = useState('greeting'); // greeting, categories, topic_selection

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const avatar = await AsyncStorage.getItem('huxley_avatar');
      if (avatar) setSelectedAvatar(avatar);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const educationCategories = [
    {
      id: 'basics',
      title: 'Teach me the basics',
      icon: 'auto-stories',
      color: '#3b82f6',
      emoji: '📖',
      description: 'Foundation knowledge on IFS, Polyvagal Theory, and integration',
      topics: ['nervous_system', 'ifs_basics', 'grounding_practices']
    },
    {
      id: 'about_myself',
      title: 'Teach me about myself',
      icon: 'psychology',
      color: '#8b5cf6',
      emoji: '🧠',
      description: 'Interactive tools to explore your inner world and patterns',
      topics: ['ifs_chat', 'polyvagal_mapping', 'triggers_glimmers', 'regulating_resources']
    },
    {
      id: 'therapies',
      title: 'Teach me about the therapies',
      icon: 'school',
      color: '#10b981',
      emoji: '🎓',
      description: 'Deep dives into IFS, Polyvagal Theory, Buddhist ideas, and more',
      topics: ['all_topics']
    }
  ];

  const topicDetails = {
    // Basics category
    nervous_system: {
      title: 'Nervous System Basics',
      emoji: '🧠',
      description: 'Understanding your three states of activation and safety',
      time: '5 minutes',
      color: '#3b82f6'
    },
    ifs_basics: {
      title: 'Parts of You (IFS)',
      emoji: '👥',
      description: 'Meet your inner protectors and wounded parts',
      time: '7 minutes',
      color: '#3b82f6'
    },
    grounding_practices: {
      title: 'Grounding & Somatic Practices',
      emoji: '🌱',
      description: 'Learn self-regulation techniques for any moment',
      time: '8 minutes',
      color: '#3b82f6'
    },
    // About Myself category
    ifs_chat: {
      title: 'IFS Parts Work Chat',
      emoji: '💬',
      description: 'Interactive guidance through the Six F\'s with your parts',
      time: '15-20 minutes',
      color: '#8b5cf6'
    },
    polyvagal_mapping: {
      title: 'Polyvagal Mapping',
      emoji: '🗺️',
      description: 'Identify what each nervous system state feels like for you',
      time: '10-15 minutes',
      color: '#8b5cf6'
    },
    core_beliefs: {
      title: 'Core Beliefs Inventory',
      emoji: '💭',
      description: 'Explore and challenge limiting beliefs with CBT techniques',
      time: '12-15 minutes',
      color: '#8b5cf6'
    },
    triggers_glimmers: {
      title: 'Triggers & Glimmers',
      emoji: '⚡✨',
      description: 'What dysregulates you and what brings you safety',
      time: '10-12 minutes',
      color: '#8b5cf6'
    },
    regulating_resources: {
      title: 'Regulating Resources',
      emoji: '🛠️',
      description: 'What helps you regulate - alone and with others',
      time: '8-10 minutes',
      color: '#8b5cf6'
    }
  };

  const renderHuxleyMessage = (message) => {
    // AVATAR_OPTIONS is an array, need to find by id
    const avatarConfig = AVATAR_OPTIONS.find(a => a.id === selectedAvatar) || AVATAR_OPTIONS[0];

    return (
      <View style={styles.messageContainer}>
        <View style={styles.huxleyMessageBubble}>
          <View style={[styles.avatarContainer, { backgroundColor: avatarConfig.color + '20' }]}>
            <MaterialIcons name={avatarConfig.icon} size={32} color={avatarConfig.color} />
          </View>
          <View style={styles.messageBubble}>
            <Text style={styles.huxleyName}>{avatarConfig.name}</Text>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderUserOption = (text, onPress, icon, color = colors.primary) => (
    <TouchableOpacity
      style={[styles.userOption, { borderColor: color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <MaterialIcons name={icon} size={24} color={color} style={styles.optionIcon} />
      <Text style={[styles.userOptionText, { color }]}>{text}</Text>
      <MaterialIcons name="arrow-forward" size={20} color={color} />
    </TouchableOpacity>
  );

  const renderTopicCard = (topicId) => {
    const topic = topicDetails[topicId];
    if (!topic) return null;

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
        <Text style={styles.topicEmoji}>{topic.emoji}</Text>
        <View style={styles.topicContent}>
          <Text style={styles.topicTitle}>{topic.title}</Text>
          <Text style={styles.topicDescription}>{topic.description}</Text>
          <Text style={styles.topicTime}>⏱️ {topic.time}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
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
              <Text style={styles.categoryEmoji}>{category.emoji}</Text>
            </View>
            <View style={styles.categoryContent}>
              <Text style={[styles.categoryTitle, { color: category.color }]}>
                {category.title}
              </Text>
              <Text style={styles.categoryDescription}>{category.description}</Text>
            </View>
            <MaterialIcons name="arrow-forward" size={24} color={category.color} />
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
        {renderTopicCard('ifs_basics')}
        {renderTopicCard('grounding_practices')}
      </View>

      <View style={styles.optionsContainer}>
        {renderUserOption(
          'Back to main menu',
          () => setConversationStep('greeting'),
          'arrow-back',
          '#6b7280'
        )}
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
      </View>

      <View style={styles.optionsContainer}>
        {renderUserOption(
          'Back to main menu',
          () => setConversationStep('greeting'),
          'arrow-back',
          '#6b7280'
        )}
      </View>
    </>
  );

  const renderTherapies = () => (
    <>
      {renderHuxleyMessage(
        "Great! Ready for the deep dives. These topics cover the theory and methods behind psychedelic integration - IFS, Polyvagal Theory, Buddhist psychology, and more. Browse the full library to explore everything available."
      )}

      <View style={styles.topicsContainer}>
        <Text style={styles.topicsLabel}>Deep Theory & Methods:</Text>

        <TouchableOpacity
          style={styles.allTopicsButton}
          onPress={() => {
            // Switch to full education hub
            if (onViewAllTopics) {
              onViewAllTopics();
            } else if (navigation) {
              navigation.navigate('EducationHub');
            }
          }}
          activeOpacity={0.7}
        >
          <MaterialIcons name="library-books" size={32} color="#10b981" />
          <View style={styles.allTopicsContent}>
            <Text style={styles.allTopicsTitle}>Browse All Topics</Text>
            <Text style={styles.allTopicsDescription}>
              View the complete education library with detailed theory and practice lessons
            </Text>
          </View>
          <MaterialIcons name="open-in-new" size={24} color="#10b981" />
        </TouchableOpacity>

        <Text style={styles.popularLabel}>Recommended starting points:</Text>
        {renderTopicCard('nervous_system')}
        {renderTopicCard('ifs_basics')}
      </View>

      <View style={styles.optionsContainer}>
        {renderUserOption(
          'Back to main menu',
          () => setConversationStep('greeting'),
          'arrow-back',
          '#6b7280'
        )}
      </View>
    </>
  );

  const renderProTip = () => (
    <View style={styles.proTipContainer}>
      <View style={styles.proTipHeader}>
        <MaterialIcons name="lightbulb" size={20} color="#f59e0b" />
        <Text style={styles.proTipLabel}>Pro Tip</Text>
      </View>
      <Text style={styles.proTipText}>
        You can pause any practice and come back to it later. Your progress is saved automatically.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#6b7280" />
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
          {conversationStep === 'therapies' && renderTherapies()}
        </View>

        {conversationStep === 'greeting' && renderProTip()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
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
    color: '#6b7280',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#1f2937',
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 12,
    marginTop: 16,
  },
  optionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
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
    color: '#6b7280',
    lineHeight: 18,
  },
  topicsContainer: {
    gap: 12,
    marginTop: 16,
  },
  topicsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
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
    color: '#1f2937',
    marginBottom: 4,
  },
  topicDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 4,
  },
  topicTime: {
    fontSize: 11,
    color: '#9ca3af',
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
    color: '#6b7280',
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
