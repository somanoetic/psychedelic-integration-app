import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  ArrowRight,
  Search,
  List,
  Play,
  User,
  ChevronRight,
  Home,
  X,
  Grid3x3,
  Wind,
  Mountain,
  Activity,
  Heart,
  Users,
  Sparkles,
  Flower2,
  Brain,
  Lightbulb,
  Repeat,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  Gamepad2,
} from 'lucide-react-native';
import { colors, gradients } from '../theme/colors';
import { icons } from '../lib/uiIcons';
import { exerciseCategories as realCategories, getExercisesByCategory, getAllExercises } from '../content/exercises-comprehensive';
import contributedExerciseService from '../lib/contributedExerciseService';

const CATEGORY_LUCIDE = {
  apps: Grid3x3,
  air: Wind,
  landscape: Mountain,
  accessibility: Activity,
  favorite: Heart,
  groups: Users,
  'self-improvement': Sparkles,
  spa: Flower2,
  psychology: Brain,
  lightbulb: Lightbulb,
  repeat: Repeat,
  'auto-awesome': Sparkles,
  'fitness-center': Dumbbell,
  school: GraduationCap,
  healing: HeartPulse,
  'sports-esports': Gamepad2,
};

const OPTION_ICON_MAP = {
  search: Search,
  'view-list': List,
  'arrow-back': ArrowLeft,
  home: Home,
};

const ConversationalExerciseLibrary = ({ navigation, route }) => {
  const [conversationStep, setConversationStep] = useState('initial'); // initial, search, browse, selected, searchResults
  const [userInput, setUserInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [contributedExercises, setContributedExercises] = useState([]);
  const scrollRef = useRef(null);

  // A single ScrollView is reused across every conversation step, so its
  // scroll offset would otherwise carry over — e.g. scrolling down to a
  // category in `browse` and then opening it would land the exercise list
  // mid-scroll. Reset to the top whenever the step changes.
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [conversationStep]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Load approved contributor submissions; bundled exercises still render
  // synchronously so the library is usable while this resolves.
  useEffect(() => {
    let cancelled = false;
    contributedExerciseService.listPublished().then((result) => {
      if (cancelled) return;
      if (result.success) {
        setContributedExercises(result.data);
      }
    });
    return () => { cancelled = true; };
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

  const exerciseCategories = useMemo(() => [
    ...realCategories
      .filter(c => c.id !== 'all')
      .map(c => ({
        ...c,
        exercises: [
          ...getExercisesByCategory(c.id),
          ...contributedExercises.filter(ex => ex.category === c.id),
        ],
      })),
    {
      id: 'games',
      name: 'Therapeutic Games',
      icon: 'sports-esports',
      iconImage: icons.play,
      color: '#06b6d4',
      description: 'Interactive games for integration and healing',
      exercises: [{ title: 'Glimmer Swiper', isGame: true }],
      isInteractive: true
    }
  ], [contributedExercises]);

  const renderHuxleyMessage = (message) => (
    <View style={styles.huxleyBubble}>
      <View style={styles.huxleyHeader}>
        <Image
          source={require('../assets/images/huxley-avatar.png')}
          style={styles.huxleyAvatar}
          resizeMode="contain"
        />
        <Text style={styles.huxleyName}>Huxley</Text>
      </View>
      <Text style={styles.huxleyText}>{message}</Text>
    </View>
  );

  const renderUserOption = (text, onPress, icon, color = colors.primary) => {
    const Icon = OPTION_ICON_MAP[icon] || List;
    return (
      <TouchableOpacity
        style={[styles.responseBubble, { backgroundColor: color }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Icon size={20} color="#ffffff" strokeWidth={2} style={styles.responseIcon} />
        <Text style={styles.responseText}>{text}</Text>
        <ArrowRight size={16} color="rgba(255,255,255,0.8)" strokeWidth={2} />
      </TouchableOpacity>
    );
  };

  const renderInitialStep = () => (
    <>
      {renderHuxleyMessage(
        "I can help you find the perfect exercise for what you need right now. Would you like me to suggest something based on how you're feeling, or would you prefer to browse all exercises?"
      )}
      <View style={styles.optionsContainer}>
        <Text style={styles.optionsLabel}>You:</Text>
        {renderUserOption('Help me find something', () => setConversationStep('search'), 'search', colors.success)}
        {renderUserOption('Show me all exercises', () => setConversationStep('browse'), 'view-list', colors.primary)}
        {renderUserOption('Go back', () => navigation.goBack(), 'arrow-back', colors.textSecondary)}
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
          placeholderTextColor={colors.textLight}
          multiline
          spellCheck={true}
          autoCorrect={true}
          autoCapitalize="sentences"
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
        {renderUserOption('Browse instead', () => setConversationStep('browse'), 'view-list', colors.primary)}
        {renderUserOption('Go back', () => setConversationStep('initial'), 'arrow-back', colors.textSecondary)}
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
              {category.iconImage ? (
                <Image source={category.iconImage} style={styles.categoryIconImage} />
              ) : (() => {
                const Icon = CATEGORY_LUCIDE[category.icon] || Grid3x3;
                return <Icon size={32} color={category.color} strokeWidth={2} />;
              })()}
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
        {renderUserOption('Help me choose', () => setConversationStep('search'), 'search', colors.success)}
        {renderUserOption('Go back', () => setConversationStep('initial'), 'arrow-back', colors.textSecondary)}
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
                <Play size={24} color={selectedCategory.color} strokeWidth={2} />
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
                {exercise.isContributed && (
                  <View style={styles.contributedChip}>
                    <User size={11} color={colors.primary} strokeWidth={2} />
                    <Text style={styles.contributedChipText} numberOfLines={1}>
                      By {exercise.attributionName}
                    </Text>
                  </View>
                )}
              </View>
              <ChevronRight size={20} color={colors.textLight} strokeWidth={2} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.optionsContainer}>
          <Text style={styles.optionsLabel}>You:</Text>
          {renderUserOption('Browse other categories', () => setConversationStep('browse'), 'view-list', colors.primary)}
          {renderUserOption('Go back to start', () => setConversationStep('initial'), 'home', colors.textSecondary)}
        </View>
      </>
    );
  };

  const allExercises = useMemo(
    () => [...getAllExercises(), ...contributedExercises],
    [contributedExercises],
  );

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return allExercises.filter(ex =>
      ex.title.toLowerCase().includes(query) ||
      ex.instructions.toLowerCase().includes(query) ||
      (ex.source && ex.source.toLowerCase().includes(query))
    );
  }, [searchQuery, allExercises]);

  // The header back arrow should retreat one step through the conversation
  // before exiting the screen, mirroring the in-content "Go back" options.
  // Otherwise tapping it from a category dumps the user all the way out to
  // the practice screen.
  const handleHeaderBack = () => {
    switch (conversationStep) {
      case 'selected':
        setSelectedCategory(null);
        setConversationStep('browse');
        break;
      case 'browse':
      case 'search':
        setConversationStep('initial');
        break;
      case 'searchResults':
        setSearchQuery('');
        setConversationStep('initial');
        break;
      case 'initial':
      default:
        navigation.goBack();
        break;
    }
  };

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
            const catColor = catInfo?.color || colors.textSecondary;
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
                  <Play size={24} color={catColor} strokeWidth={2} />
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
                  {exercise.isContributed && (
                    <View style={styles.contributedChip}>
                      <User size={11} color={colors.primary} strokeWidth={2} />
                      <Text style={styles.contributedChipText} numberOfLines={1}>
                        By {exercise.attributionName}
                      </Text>
                    </View>
                  )}
                </View>
                <ChevronRight size={20} color={colors.textLight} strokeWidth={2} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={styles.optionsContainer}>
        <Text style={styles.optionsLabel}>You:</Text>
        {renderUserOption('Browse categories', () => setConversationStep('browse'), 'view-list', colors.primary)}
        {renderUserOption('Go back to start', () => { setSearchQuery(''); setConversationStep('initial'); }, 'home', colors.textSecondary)}
      </View>
    </>
  );

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
        <TouchableOpacity onPress={handleHeaderBack}>
          <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.appName}>Exercise Library</Text>
        <TouchableOpacity onPress={() => {
          setSearchQuery('');
          setConversationStep(conversationStep === 'searchResults' ? 'initial' : 'searchResults');
        }}>
          <Search size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {conversationStep === 'searchResults' && (
        <View style={styles.searchBarContainer}>
          <Search size={20} color={colors.textSecondary} strokeWidth={2} />
          <TextInput
            style={styles.searchBarInput}
            placeholder="Search exercises..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView
        ref={scrollRef}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
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
    width: 60,
    height: 60,
    marginRight: 10,
  },
  huxleyName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  huxleyText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
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
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
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
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  categoryIconImage: {
    width: 72,
    height: 72,
    resizeMode: 'contain',
  },
  categoryContent: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  categoryCount: {
    fontSize: 12,
    color: colors.textLight,
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
    color: colors.text,
  },
  exerciseMeta: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  exercisePreview: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  contributedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
    backgroundColor: `${colors.primary}15`,
    borderRadius: 10,
    maxWidth: 220,
  },
  contributedChipText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
  },
});

export default ConversationalExerciseLibrary;
