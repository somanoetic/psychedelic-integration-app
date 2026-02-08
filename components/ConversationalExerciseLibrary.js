import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AVATAR_OPTIONS } from './AvatarSelector';

const ConversationalExerciseLibrary = ({ navigation }) => {
  const [selectedAvatar, setSelectedAvatar] = useState('brain');
  const [conversationStep, setConversationStep] = useState('initial'); // initial, search, browse, selected
  const [userInput, setUserInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadPreferences();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadPreferences = async () => {
    try {
      const avatar = await AsyncStorage.getItem('huxley_avatar');
      if (avatar) setSelectedAvatar(avatar);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const getAvatar = () => {
    return AVATAR_OPTIONS.find(a => a.id === selectedAvatar) || AVATAR_OPTIONS[0];
  };

  const avatar = getAvatar();

  const exerciseCategories = [
    {
      id: 'grounding',
      name: 'Grounding & Regulation',
      icon: 'nature-people',
      color: '#10b981',
      description: 'Connect with your body and the present moment',
      exercises: ['54321 Grounding', 'Body Scan', 'Breath Work', 'Progressive Muscle Relaxation']
    },
    {
      id: 'ifs',
      name: 'IFS Parts Work',
      icon: 'psychology',
      color: '#8b5cf6',
      description: 'Connect with different parts of yourself',
      exercises: ['Meet Your Parts', 'Parts Mapping', 'Self-Led Dialogue', 'Unburdening']
    },
    {
      id: 'somatic',
      name: 'Somatic Practices',
      icon: 'self-improvement',
      color: '#f59e0b',
      description: 'Movement and body-based exercises',
      exercises: ['Shaking Practice', 'Orienting', 'Body Awareness', 'Tension Release']
    },
    {
      id: 'integration',
      name: 'Integration',
      icon: 'auto-awesome',
      color: '#3b82f6',
      description: 'Reflect and integrate your experiences',
      exercises: ['Journaling Prompts', 'Meaning-Making', 'Action Planning', 'Gratitude Practice']
    },
    {
      id: 'nervous_system',
      name: 'Nervous System',
      icon: 'favorite',
      color: '#ec4899',
      description: 'Understand and work with your nervous system',
      exercises: ['Window of Tolerance', 'Polyvagal Education', 'Co-Regulation', 'Safe/Social Engagement']
    },
    {
      id: 'games',
      name: 'Therapeutic Games',
      icon: 'sports-esports',
      color: '#06b6d4',
      description: 'Interactive games for integration and healing',
      exercises: ['Glimmer Swiper'],
      isInteractive: true
    }
  ];

  const renderHuxleyMessage = (message) => (
    <View style={styles.huxleyBubble}>
      <View style={styles.huxleyHeader}>
        <Image
          source={require('../assets/images/huxley therapist.png')}
          style={styles.huxleyAvatar}
          resizeMode="contain"
        />
        <Text style={styles.huxleyName}>Huxley</Text>
      </View>
      <Text style={styles.huxleyText}>{message}</Text>
    </View>
  );

  const renderUserOption = (text, onPress, icon, color = '#8b5cf6') => (
    <TouchableOpacity
      style={[styles.responseBubble, { backgroundColor: color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <MaterialIcons name={icon} size={20} color="#ffffff" style={styles.responseIcon} />
      <Text style={styles.responseText}>{text}</Text>
      <MaterialIcons name="arrow-forward" size={16} color="rgba(255,255,255,0.8)" />
    </TouchableOpacity>
  );

  const renderInitialStep = () => (
    <>
      {renderHuxleyMessage(
        "I can help you find the perfect exercise for what you need right now. Would you like me to suggest something based on how you're feeling, or would you prefer to browse all exercises?"
      )}
      <View style={styles.optionsContainer}>
        <Text style={styles.optionsLabel}>You:</Text>
        {renderUserOption('Help me find something', () => setConversationStep('search'), 'search', '#10b981')}
        {renderUserOption('Show me all exercises', () => setConversationStep('browse'), 'view-list', '#3b82f6')}
        {renderUserOption('Go back', () => navigation.goBack(), 'arrow-back', '#6b7280')}
      </View>
    </>
  );

  const renderSearchStep = () => (
    <>
      {renderHuxleyMessage(
        "Tell me how you're feeling or what you need support with right now. For example: 'I'm feeling anxious', 'I need to ground myself', or 'I want to connect with my parts'."
      )}

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>What's going on for you?</Text>
        <TextInput
          style={styles.textInput}
          value={userInput}
          onChangeText={setUserInput}
          placeholder="I'm feeling..."
          placeholderTextColor="#9ca3af"
          multiline
        />
      </View>

      {userInput.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {renderHuxleyMessage(
            getSuggestionBasedOnInput(userInput)
          )}
        </View>
      )}

      <View style={styles.optionsContainer}>
        <Text style={styles.optionsLabel}>You:</Text>
        {renderUserOption('Browse instead', () => setConversationStep('browse'), 'view-list', '#3b82f6')}
        {renderUserOption('Go back', () => setConversationStep('initial'), 'arrow-back', '#6b7280')}
      </View>
    </>
  );

  const getSuggestionBasedOnInput = (input) => {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('anxious') || lowerInput.includes('overwhelm') || lowerInput.includes('stressed')) {
      return "It sounds like you might benefit from some grounding exercises. Try the 54321 technique or some breath work to help calm your nervous system.";
    } else if (lowerInput.includes('part') || lowerInput.includes('conflict') || lowerInput.includes('inner')) {
      return "I sense you're working with different parts of yourself. Let's explore some IFS parts work exercises like 'Meet Your Parts' or 'Parts Mapping'.";
    } else if (lowerInput.includes('body') || lowerInput.includes('tension') || lowerInput.includes('stuck')) {
      return "Your body might be holding something. Somatic practices like shaking, orienting, or tension release could help you move through what's stored.";
    } else if (lowerInput.includes('integrate') || lowerInput.includes('reflect') || lowerInput.includes('understand')) {
      return "Integration work sounds right for where you are. Try some journaling prompts or meaning-making exercises to process your experience.";
    } else if (lowerInput.includes('safe') || lowerInput.includes('nervous') || lowerInput.includes('regulate')) {
      return "Let's work with your nervous system. Understanding your window of tolerance and polyvagal responses can help you feel safer.";
    }

    return "Based on what you've shared, I'd recommend starting with some grounding exercises. Would you like to explore the categories below to find what resonates?";
  };

  const renderBrowseStep = () => (
    <>
      {renderHuxleyMessage(
        "Here are all our exercise categories. Each one offers different tools for your journey. What calls to you?"
      )}

      <View style={styles.categoriesContainer}>
        {exerciseCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.categoryCard, { borderLeftColor: category.color }]}
            onPress={() => {
              setSelectedCategory(category);
              setConversationStep('selected');
            }}
          >
            <View style={[styles.categoryIcon, { backgroundColor: `${category.color}20` }]}>
              <MaterialIcons name={category.icon} size={32} color={category.color} />
            </View>
            <View style={styles.categoryContent}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryDescription}>{category.description}</Text>
              <Text style={styles.categoryCount}>{category.exercises.length} exercises</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.optionsContainer}>
        <Text style={styles.optionsLabel}>You:</Text>
        {renderUserOption('Help me choose', () => setConversationStep('search'), 'search', '#10b981')}
        {renderUserOption('Go back', () => setConversationStep('initial'), 'arrow-back', '#6b7280')}
      </View>
    </>
  );

  const renderSelectedStep = () => {
    if (!selectedCategory) return null;

    return (
      <>
        {renderHuxleyMessage(
          `Great choice! ${selectedCategory.name} exercises can really help with ${selectedCategory.description.toLowerCase()}. Here are the exercises in this category:`
        )}

        <View style={styles.exercisesListContainer}>
          {selectedCategory.exercises.map((exercise, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.exerciseCard, { borderLeftColor: selectedCategory.color }]}
              onPress={() => {
                // Navigate to Glimmer Swiper for interactive games
                if (exercise === 'Glimmer Swiper') {
                  navigation.navigate('GlimmerSwiper');
                } else {
                  // TODO: Navigate to other exercises
                  console.log('Navigate to exercise:', exercise);
                }
              }}
            >
              <View style={[styles.exerciseIcon, { backgroundColor: `${selectedCategory.color}20` }]}>
                <MaterialIcons name="play-arrow" size={24} color={selectedCategory.color} />
              </View>
              <Text style={styles.exerciseName}>{exercise}</Text>
              <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.optionsContainer}>
          <Text style={styles.optionsLabel}>You:</Text>
          {renderUserOption('Browse other categories', () => setConversationStep('browse'), 'view-list', '#3b82f6')}
          {renderUserOption('Go back to start', () => setConversationStep('initial'), 'home', '#6b7280')}
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.appName}>Exercise Library</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {conversationStep === 'initial' && renderInitialStep()}
          {conversationStep === 'search' && renderSearchStep()}
          {conversationStep === 'browse' && renderBrowseStep()}
          {conversationStep === 'selected' && renderSelectedStep()}
        </Animated.View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  huxleyBubble: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderTopLeftRadius: 4,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  huxleyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  huxleyAvatar: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  huxleyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  huxleyText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
    marginLeft: 4,
  },
  responseBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderTopRightRadius: 4,
    marginBottom: 12,
    alignSelf: 'flex-end',
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  responseIcon: {
    marginRight: 12,
  },
  responseText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1f2937',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  suggestionsContainer: {
    marginTop: -12,
    marginBottom: 12,
  },
  categoriesContainer: {
    marginBottom: 24,
  },
  categoryCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  categoryContent: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
    lineHeight: 18,
  },
  categoryCount: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  exercisesListContainer: {
    marginBottom: 24,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  exerciseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
});

export default ConversationalExerciseLibrary;
