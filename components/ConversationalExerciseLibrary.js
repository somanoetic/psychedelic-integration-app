import React, { useState, useEffect, useMemo } from 'react';
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
import { colors } from '../theme/colors';
import { exerciseCategories as realCategories, getExercisesByCategory, getAllExercises } from '../content/exercises-comprehensive';

const ConversationalExerciseLibrary = ({ navigation, route }) => {
  const [selectedAvatar, setSelectedAvatar] = useState('brain');
  const [conversationStep, setConversationStep] = useState('initial'); // initial, search, browse, selected, searchResults
  const [userInput, setUserInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
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

  // If navigated with a category param, auto-select that category
  useEffect(() => {
    const categoryParam = route?.params?.category;
    if (categoryParam) {
      const found = exerciseCategories.find(c => c.id === categoryParam);
      if (found) {
        setSelectedCategory(found);
        setConversationStep('selected');
      }
    }
  }, [route?.params?.category]);

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
    ...realCategories
      .filter(c => c.id !== 'all')
      .map(c => ({
        ...c,
        exercises: getExercisesByCategory(c.id),
      })),
    {
      id: 'games',
      name: 'Therapeutic Games',
      icon: 'sports-esports',
      color: '#06b6d4',
      description: 'Interactive games for integration and healing',
      exercises: [{ title: 'Glimmer Swiper', isGame: true }],
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

  const renderUserOption = (text, onPress, icon, color = colors.primary) => (
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
      return "It sounds like you might benefit from some grounding exercises. Try '5-4-3-2-1 Integration Grounding' or 'Box Breathing' to help calm your nervous system.";
    } else if (lowerInput.includes('part') || lowerInput.includes('conflict') || lowerInput.includes('inner')) {
      return "I sense you're working with different parts of yourself. Let's explore some IFS exercises like 'Parts Check-in for Integration' or 'Protector Appreciation'.";
    } else if (lowerInput.includes('body') || lowerInput.includes('tension') || lowerInput.includes('stuck')) {
      return "Your body might be holding something. Somatic practices like 'Integration Body Scan' or 'Progressive Muscle Relaxation' could help you move through what's stored.";
    } else if (lowerInput.includes('integrate') || lowerInput.includes('reflect') || lowerInput.includes('understand')) {
      return "Self-compassion work sounds right for where you are. Try 'Self-Compassion for Integration' or 'Loving-Kindness for Difficult Parts' to process your experience.";
    } else if (lowerInput.includes('safe') || lowerInput.includes('nervous') || lowerInput.includes('regulate')) {
      return "Let's work with your nervous system. Try 'Nervous System State Mapping' or 'Vagal Toning Exercise' to help you feel safer.";
    } else if (lowerInput.includes('breath') || lowerInput.includes('calm') || lowerInput.includes('relax')) {
      return "Breathing exercises can really help right now. Try 'Calming Breath for Integration' or 'Box Breathing' to settle your system.";
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
                if (exercise.isGame) {
                  navigation.navigate('GlimmerSwiper');
                } else {
                  navigation.navigate('GuidedExercise', {
                    exercise,
                    categoryColor: selectedCategory.color,
                  });
                }
              }}
            >
              <View style={[styles.exerciseIcon, { backgroundColor: `${selectedCategory.color}20` }]}>
                <MaterialIcons name="play-arrow" size={24} color={selectedCategory.color} />
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.title}</Text>
                {exercise.duration && (
                  <Text style={styles.exerciseMeta}>
                    {exercise.duration} min · {exercise.steps?.length || 0} steps
                  </Text>
                )}
                {exercise.instructions && (
                  <Text style={styles.exercisePreview} numberOfLines={2}>
                    {exercise.instructions}
                  </Text>
                )}
              </View>
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

  const allExercises = useMemo(() => getAllExercises(), []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return allExercises.filter(ex =>
      ex.title.toLowerCase().includes(query) ||
      ex.instructions.toLowerCase().includes(query) ||
      (ex.source && ex.source.toLowerCase().includes(query))
    );
  }, [searchQuery, allExercises]);

  const renderSearchResultsStep = () => (
    <>
      {renderHuxleyMessage(
        searchResults.length > 0
          ? `I found ${searchResults.length} exercise${searchResults.length === 1 ? '' : 's'} matching "${searchQuery}". Take a look:`
          : `I couldn't find any exercises matching "${searchQuery}". Try different words, or browse by category.`
      )}

      {searchResults.length > 0 && (
        <View style={styles.exercisesListContainer}>
          {searchResults.map((exercise, index) => {
            const catInfo = exerciseCategories.find(c => c.id === exercise.category);
            const catColor = catInfo?.color || '#6b7280';
            return (
              <TouchableOpacity
                key={exercise.id || index}
                style={[styles.exerciseCard, { borderLeftColor: catColor }]}
                onPress={() => {
                  navigation.navigate('GuidedExercise', {
                    exercise,
                    categoryColor: catColor,
                  });
                }}
              >
                <View style={[styles.exerciseIcon, { backgroundColor: `${catColor}20` }]}>
                  <MaterialIcons name="play-arrow" size={24} color={catColor} />
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.title}</Text>
                  <Text style={styles.exerciseMeta}>
                    {exercise.duration} min · {exercise.steps?.length || 0} steps · {catInfo?.name || exercise.category}
                  </Text>
                  {exercise.instructions && (
                    <Text style={styles.exercisePreview} numberOfLines={2}>
                      {exercise.instructions}
                    </Text>
                  )}
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={styles.optionsContainer}>
        <Text style={styles.optionsLabel}>You:</Text>
        {renderUserOption('Browse categories', () => setConversationStep('browse'), 'view-list', '#3b82f6')}
        {renderUserOption('Go back to start', () => { setSearchQuery(''); setConversationStep('initial'); }, 'home', '#6b7280')}
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.appName}>Exercise Library</Text>
        <TouchableOpacity onPress={() => {
          setSearchQuery('');
          setConversationStep(conversationStep === 'searchResults' ? 'initial' : 'searchResults');
        }}>
          <MaterialIcons name="search" size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>

      {conversationStep === 'searchResults' && (
        <View style={styles.searchBarContainer}>
          <MaterialIcons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchBarInput}
            placeholder="Search exercises..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      )}

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
          {conversationStep === 'searchResults' && renderSearchResultsStep()}
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
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchBarInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 4,
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
  exerciseInfo: {
    flex: 1,
    marginRight: 8,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  exerciseMeta: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  exercisePreview: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    lineHeight: 18,
  },
});

export default ConversationalExerciseLibrary;
