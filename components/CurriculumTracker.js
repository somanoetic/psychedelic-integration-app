import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { exercises, exerciseCategories, getAllExercises } from '../content/exercises-comprehensive';
import { colors, gradients } from '../theme/colors';

const PROGRESS_STORAGE_KEY = 'exercise_progress_data';

const CurriculumTracker = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [progressData, setProgressData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [progressAnim] = useState(new Animated.Value(0));

  const allExercises = getAllExercises();

  useEffect(() => {
    loadProgress();
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, []);

  const loadProgress = async () => {
    try {
      // Use local storage for now (database table not yet created)
      const stored = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
      if (stored) {
        setProgressData(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async (newProgressData) => {
    try {
      await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(newProgressData));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const markExerciseComplete = async (exercise) => {
    try {
      const exerciseId = `${exercise.category}_${exercise.title.toLowerCase().replace(/\s+/g, '_')}`;
      const existing = progressData[exerciseId];

      const newProgressData = { ...progressData };

      if (existing) {
        // Update existing record
        newProgressData[exerciseId] = {
          ...existing,
          times_completed: existing.times_completed + 1,
          last_completed_at: new Date().toISOString(),
        };
      } else {
        // Create new record
        newProgressData[exerciseId] = {
          exercise_id: exerciseId,
          exercise_title: exercise.title,
          exercise_category: exercise.category,
          times_completed: 1,
          first_completed_at: new Date().toISOString(),
          last_completed_at: new Date().toISOString(),
          is_favorite: false,
        };
      }

      setProgressData(newProgressData);
      await saveProgress(newProgressData);
    } catch (error) {
      console.error('Error marking exercise complete:', error);
    }
  };

  const toggleFavorite = async (exercise) => {
    try {
      const exerciseId = `${exercise.category}_${exercise.title.toLowerCase().replace(/\s+/g, '_')}`;
      const existing = progressData[exerciseId];

      const newProgressData = { ...progressData };

      if (existing) {
        newProgressData[exerciseId] = {
          ...existing,
          is_favorite: !existing.is_favorite,
        };
      } else {
        // Create new record with favorite
        newProgressData[exerciseId] = {
          exercise_id: exerciseId,
          exercise_title: exercise.title,
          exercise_category: exercise.category,
          times_completed: 0,
          first_completed_at: null,
          last_completed_at: null,
          is_favorite: true,
        };
      }

      setProgressData(newProgressData);
      await saveProgress(newProgressData);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const getCategoryProgress = (categoryId) => {
    const categoryExercises = allExercises.filter(e => e.category === categoryId);
    const completedCount = categoryExercises.filter(e => {
      const exerciseId = `${e.category}_${e.title.toLowerCase().replace(/\s+/g, '_')}`;
      return progressData[exerciseId]?.times_completed > 0;
    }).length;

    return {
      completed: completedCount,
      total: categoryExercises.length,
      percentage: categoryExercises.length > 0 ? (completedCount / categoryExercises.length) * 100 : 0,
    };
  };

  const getOverallProgress = () => {
    const completedCount = allExercises.filter(e => {
      const exerciseId = `${e.category}_${e.title.toLowerCase().replace(/\s+/g, '_')}`;
      return progressData[exerciseId]?.times_completed > 0;
    }).length;

    return {
      completed: completedCount,
      total: allExercises.length,
      percentage: allExercises.length > 0 ? (completedCount / allExercises.length) * 100 : 0,
    };
  };

  const getFavorites = () => {
    return allExercises.filter(e => {
      const exerciseId = `${e.category}_${e.title.toLowerCase().replace(/\s+/g, '_')}`;
      return progressData[exerciseId]?.is_favorite;
    });
  };

  const getRecentlyCompleted = () => {
    const completedExercises = allExercises.filter(e => {
      const exerciseId = `${e.category}_${e.title.toLowerCase().replace(/\s+/g, '_')}`;
      return progressData[exerciseId]?.times_completed > 0;
    }).map(e => {
      const exerciseId = `${e.category}_${e.title.toLowerCase().replace(/\s+/g, '_')}`;
      return {
        ...e,
        progress: progressData[exerciseId],
      };
    });

    return completedExercises.sort((a, b) =>
      new Date(b.progress.last_completed_at) - new Date(a.progress.last_completed_at)
    ).slice(0, 5);
  };

  const getCategoryInfo = (categoryId) => {
    return exerciseCategories.find(c => c.id === categoryId) || exerciseCategories[0];
  };

  const overall = getOverallProgress();
  const favorites = getFavorites();
  const recentlyCompleted = getRecentlyCompleted();

  const renderProgressRing = (percentage, size = 120, strokeWidth = 10, color = colors.primary) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <View style={[styles.progressRingBackground, { width: size, height: size, borderRadius: size / 2, borderWidth: strokeWidth }]} />
        <Animated.View
          style={[
            styles.progressRingFill,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: color,
              transform: [{ rotate: '-90deg' }],
              borderTopColor: 'transparent',
              borderRightColor: percentage >= 25 ? color : 'transparent',
              borderBottomColor: percentage >= 50 ? color : 'transparent',
              borderLeftColor: percentage >= 75 ? color : 'transparent',
            }
          ]}
        />
        <View style={styles.progressRingCenter}>
          <Text style={styles.progressRingPercentage}>{Math.round(percentage)}%</Text>
          <Text style={styles.progressRingLabel}>Complete</Text>
        </View>
      </View>
    );
  };

  const renderCategoryCard = (category) => {
    if (category.id === 'all') return null;

    const progress = getCategoryProgress(category.id);
    const progressWidth = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', `${progress.percentage}%`],
    });

    return (
      <TouchableOpacity
        key={category.id}
        style={styles.categoryCard}
        onPress={() => {
          setSelectedCategory(category);
          setShowCategoryModal(true);
        }}
      >
        <View style={[styles.categoryIcon, { backgroundColor: `${category.color}20` }]}>
          <MaterialIcons name={category.icon} size={28} color={category.color} />
        </View>
        <View style={styles.categoryContent}>
          <Text style={styles.categoryName}>{category.name}</Text>
          <Text style={styles.categoryStats}>{progress.completed}/{progress.total} exercises</Text>
          <View style={styles.progressBar}>
            <Animated.View
              style={[styles.progressFill, { width: progressWidth, backgroundColor: category.color }]}
            />
          </View>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={colors.textLight} />
      </TouchableOpacity>
    );
  };

  const renderExerciseModal = () => {
    if (!selectedExercise) return null;

    const categoryInfo = getCategoryInfo(selectedExercise.category);
    const exerciseId = `${selectedExercise.category}_${selectedExercise.title.toLowerCase().replace(/\s+/g, '_')}`;
    const progress = progressData[exerciseId];

    return (
      <Modal
        visible={!!selectedExercise}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedExercise(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
            <View style={[styles.modalHeader, { backgroundColor: categoryInfo.color }]}>
              <View style={styles.modalHeaderTop}>
                <Text style={styles.modalTitle}>{selectedExercise.title}</Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    onPress={() => toggleFavorite(selectedExercise)}
                    style={styles.favoriteButton}
                  >
                    <MaterialIcons
                      name={progress?.is_favorite ? 'favorite' : 'favorite-border'}
                      size={24}
                      color={colors.textInverse}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setSelectedExercise(null)}>
                    <MaterialIcons name="close" size={28} color={colors.textInverse} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.modalMetadata}>
                <View style={styles.metadataItem}>
                  <MaterialIcons name="schedule" size={16} color={colors.textInverse} />
                  <Text style={styles.metadataText}>{selectedExercise.duration} min</Text>
                </View>
                {progress?.times_completed > 0 && (
                  <View style={styles.metadataItem}>
                    <MaterialIcons name="check-circle" size={16} color={colors.textInverse} />
                    <Text style={styles.metadataText}>Done {progress.times_completed}x</Text>
                  </View>
                )}
              </View>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.instructionsSection}>
                <Text style={styles.sectionTitle}>Purpose</Text>
                <Text style={styles.instructionsText}>{selectedExercise.instructions}</Text>
              </View>

              <View style={styles.stepsSection}>
                <Text style={styles.sectionTitle}>Steps</Text>
                {selectedExercise.steps.map((step, index) => (
                  <View key={index} style={styles.stepItem}>
                    <View style={[styles.stepNumber, { backgroundColor: categoryInfo.color }]}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 16 }]}>
              <TouchableOpacity
                style={[styles.completeButton, { backgroundColor: categoryInfo.color }]}
                onPress={() => {
                  markExerciseComplete(selectedExercise);
                  setSelectedExercise(null);
                }}
              >
                <MaterialIcons name="check" size={20} color={colors.textInverse} />
                <Text style={styles.completeButtonText}>
                  {progress?.times_completed > 0 ? 'Complete Again' : 'Mark Complete'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderCategoryModal = () => {
    if (!selectedCategory) return null;

    const categoryExercises = allExercises.filter(e => e.category === selectedCategory.id);
    const progress = getCategoryProgress(selectedCategory.id);

    return (
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
            <View style={[styles.modalHeader, { backgroundColor: selectedCategory.color }]}>
              <View style={styles.modalHeaderTop}>
                <Text style={styles.modalTitle}>{selectedCategory.name}</Text>
                <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                  <MaterialIcons name="close" size={28} color={colors.textInverse} />
                </TouchableOpacity>
              </View>
              <Text style={styles.categoryDescription}>{selectedCategory.description}</Text>
              <View style={styles.modalMetadata}>
                <View style={styles.metadataItem}>
                  <MaterialIcons name="check-circle" size={16} color={colors.textInverse} />
                  <Text style={styles.metadataText}>{progress.completed}/{progress.total} complete</Text>
                </View>
              </View>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {categoryExercises.map((exercise, index) => {
                const exerciseId = `${exercise.category}_${exercise.title.toLowerCase().replace(/\s+/g, '_')}`;
                const exerciseProgress = progressData[exerciseId];
                const isComplete = exerciseProgress?.times_completed > 0;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.exerciseItem, isComplete && styles.exerciseItemComplete]}
                    onPress={() => {
                      setShowCategoryModal(false);
                      setSelectedExercise(exercise);
                    }}
                  >
                    <View style={[styles.exerciseStatus, { backgroundColor: isComplete ? selectedCategory.color : colors.lightGray }]}>
                      {isComplete ? (
                        <MaterialIcons name="check" size={16} color={colors.textInverse} />
                      ) : (
                        <Text style={styles.exerciseNumber}>{index + 1}</Text>
                      )}
                    </View>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                      <Text style={styles.exerciseDuration}>{exercise.duration} min</Text>
                    </View>
                    {exerciseProgress?.is_favorite && (
                      <MaterialIcons name="favorite" size={18} color="#ec4899" style={{ marginRight: 8 }} />
                    )}
                    {isComplete && exerciseProgress?.times_completed > 1 && (
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedBadgeText}>{exerciseProgress.times_completed}x</Text>
                      </View>
                    )}
                    <MaterialIcons name="chevron-right" size={20} color={colors.textLight} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={gradients.warm}
        style={styles.headerGradient}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.textInverse} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.heroTitle}>Your Progress</Text>
            <Text style={styles.heroSubtitle}>
              Track your therapeutic journey
            </Text>
          </View>
          <Image
            source={require('../assets/images/huxley-avatar.png')}
            style={styles.huxleyAvatar}
            resizeMode="contain"
          />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overall Progress */}
        <View style={styles.overallSection}>
          <View style={styles.overallCard}>
            {renderProgressRing(overall.percentage)}
            <View style={styles.overallStats}>
              <Text style={styles.overallTitle}>Overall Progress</Text>
              <Text style={styles.overallCount}>{overall.completed} of {overall.total}</Text>
              <Text style={styles.overallLabel}>exercises completed</Text>
            </View>
          </View>
        </View>

        {/* Favorites */}
        {favorites.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Your Favorites</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.favoritesScroll}>
              {favorites.map((exercise, index) => {
                const categoryInfo = getCategoryInfo(exercise.category);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.favoriteCard, { borderLeftColor: categoryInfo.color }]}
                    onPress={() => setSelectedExercise(exercise)}
                  >
                    <MaterialIcons name="favorite" size={16} color="#ec4899" />
                    <Text style={styles.favoriteTitle} numberOfLines={1}>{exercise.title}</Text>
                    <Text style={styles.favoriteDuration}>{exercise.duration} min</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Recently Completed */}
        {recentlyCompleted.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Recently Practiced</Text>
            {recentlyCompleted.map((exercise, index) => {
              const categoryInfo = getCategoryInfo(exercise.category);
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.recentItem}
                  onPress={() => setSelectedExercise(exercise)}
                >
                  <View style={[styles.recentIcon, { backgroundColor: `${categoryInfo.color}20` }]}>
                    <MaterialIcons name={categoryInfo.icon} size={20} color={categoryInfo.color} />
                  </View>
                  <View style={styles.recentContent}>
                    <Text style={styles.recentTitle}>{exercise.title}</Text>
                    <Text style={styles.recentDate}>
                      {new Date(exercise.progress.last_completed_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={colors.textLight} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Exercise Categories</Text>
          {exerciseCategories.filter(c => c.id !== 'all').map(renderCategoryCard)}
        </View>

        {/* Link to Exercise Library */}
        <TouchableOpacity
          style={styles.libraryLink}
          onPress={() => navigation.navigate('ExerciseLibrary')}
        >
          <MaterialIcons name="library-books" size={24} color={colors.primary} />
          <Text style={styles.libraryLinkText}>Browse Full Exercise Library</Text>
          <MaterialIcons name="arrow-forward" size={20} color={colors.primary} />
        </TouchableOpacity>

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>

      {renderExerciseModal()}
      {renderCategoryModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  headerGradient: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingTop: 50,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 24,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  headerText: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textInverse,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  huxleyAvatar: {
    width: 90,
    height: 90,
  },
  content: {
    flex: 1,
  },
  overallSection: {
    padding: 20,
    paddingBottom: 0,
  },
  overallCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  overallStats: {
    marginLeft: 24,
    flex: 1,
  },
  overallTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  overallCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  overallLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  progressRingBackground: {
    position: 'absolute',
    borderColor: colors.lightGray,
  },
  progressRingFill: {
    position: 'absolute',
  },
  progressRingCenter: {
    alignItems: 'center',
  },
  progressRingPercentage: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  progressRingLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  favoritesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  favoriteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 140,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  favoriteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  favoriteDuration: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentContent: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  recentDate: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  categoryStats: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  libraryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  libraryLinkText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginHorizontal: 12,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textInverse,
    flex: 1,
    marginRight: 16,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  favoriteButton: {
    padding: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
  },
  modalMetadata: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 14,
    color: colors.textInverse,
    fontWeight: '500',
  },
  modalBody: {
    padding: 24,
  },
  instructionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
  },
  stepsSection: {
    marginBottom: 24,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textInverse,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  modalFooter: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  completeButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  exerciseItemComplete: {
    backgroundColor: '#f0fdf4',
  },
  exerciseStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  exerciseDuration: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  completedBadge: {
    backgroundColor: colors.bubbleSomatic,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
});

export default CurriculumTracker;
