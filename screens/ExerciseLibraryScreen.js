import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { getAllExercises, exerciseCategories } from '../content/exercises-comprehensive';
import { colors, gradients, spacing, borderRadius, shadows, typography } from '../theme/colors';

const ExerciseLibraryScreen = ({ navigation }) => {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get all exercises from the content file
  const allPractices = getAllExercises();

  const getCategoryInfo = (categoryId) => {
    return exerciseCategories.find(c => c.id === categoryId) || exerciseCategories[0];
  };

  const filteredPractices = useMemo(() => {
    let results = selectedCategory === 'all'
      ? allPractices
      : allPractices.filter(p => p.category === selectedCategory);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      results = results.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.instructions.toLowerCase().includes(query) ||
        (p.source && p.source.toLowerCase().includes(query))
      );
    }

    return results;
  }, [selectedCategory, searchQuery, allPractices]);

  const renderExerciseModal = () => {
    if (!selectedExercise) return null;

    const categoryInfo = getCategoryInfo(selectedExercise.category);

    return (
      <Modal
        visible={!!selectedExercise}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedExercise(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalHeader, { backgroundColor: categoryInfo.color }]}>
              <View style={styles.modalHeaderTop}>
                <Text style={styles.modalTitle}>{selectedExercise.title}</Text>
                <TouchableOpacity onPress={() => setSelectedExercise(null)}>
                  <MaterialIcons name="close" size={28} color={colors.textInverse} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalMetadata}>
                <View style={styles.metadataItem}>
                  <MaterialIcons name="schedule" size={16} color={colors.textInverse} />
                  <Text style={styles.metadataText}>{selectedExercise.duration} min</Text>
                </View>
                <View style={styles.metadataItem}>
                  <MaterialIcons name={categoryInfo.icon} size={16} color={colors.textInverse} />
                  <Text style={styles.metadataText}>{categoryInfo.name}</Text>
                </View>
              </View>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.instructionsSection}>
                <Text style={styles.sectionTitle}>💡 Purpose</Text>
                <Text style={styles.instructionsText}>{selectedExercise.instructions}</Text>
              </View>

              <View style={styles.stepsSection}>
                <Text style={styles.sectionTitle}>📋 Steps</Text>
                {selectedExercise.steps.map((step, index) => (
                  <View key={index} style={styles.stepItem}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.tipBox}>
                <MaterialIcons name="lightbulb" size={20} color={colors.warning} />
                <Text style={styles.tipText}>
                  Take your time with each step. There's no rush. This is your practice.
                </Text>
              </View>

              {selectedExercise.source && (
                <View style={styles.sourceBox}>
                  <MaterialIcons name="menu-book" size={16} color={colors.textSecondary} />
                  <Text style={styles.sourceText}>Source: {selectedExercise.source}</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.startButton, { backgroundColor: categoryInfo.color }]}
                onPress={() => setSelectedExercise(null)}
              >
                <MaterialIcons name="check" size={20} color={colors.textInverse} />
                <Text style={styles.startButtonText}>Got It</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={gradients.warm}
        start={{ x: 1.0, y: 0.0 }}
        end={{ x: 0.0, y: 1.0 }}
        style={styles.headerGradient}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.textInverse} />
        </TouchableOpacity>

        <Text style={styles.heroTitle}>Exercise Library</Text>
        <Text style={styles.heroSubtitle}>
          Therapeutic practices for integration & well-being
        </Text>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryScrollContent}
      >
        {exerciseCategories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && { backgroundColor: category.color }
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            {category.iconImage ? (
              <Image
                source={category.iconImage}
                style={[
                  styles.categoryChipIcon,
                  selectedCategory !== category.id && { opacity: 0.6 },
                ]}
              />
            ) : (
              <MaterialIcons
                name={category.icon}
                size={18}
                color={selectedCategory === category.id ? colors.textInverse : colors.textSecondary}
              />
            )}
            <Text style={[
              styles.categoryChipText,
              selectedCategory === category.id && styles.categoryChipTextActive
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.exercisesList} showsVerticalScrollIndicator={false}>
        <View style={styles.contentPadding}>
          <Text style={styles.resultsText}>
            {filteredPractices.length} {filteredPractices.length === 1 ? 'exercise' : 'exercises'}
          </Text>

          {filteredPractices.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons name="search-off" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>No exercises found</Text>
              <Text style={styles.emptyStateSubtext}>Try a different search or category</Text>
            </View>
          )}

          {filteredPractices.map((exercise, index) => {
            const categoryInfo = getCategoryInfo(exercise.category);
            return (
              <TouchableOpacity
                key={index}
                style={styles.exerciseCard}
                onPress={() => setSelectedExercise(exercise)}
              >
                <View style={[styles.exerciseIcon, { backgroundColor: categoryInfo.color }]}>
                  {categoryInfo.iconImage ? (
                    <Image source={categoryInfo.iconImage} style={styles.exerciseIconImage} />
                  ) : (
                    <MaterialIcons name={categoryInfo.icon} size={24} color={colors.textInverse} />
                  )}
                </View>

                <View style={styles.exerciseContent}>
                  <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                  <Text style={styles.exerciseInstructions} numberOfLines={2}>
                    {exercise.instructions}
                  </Text>
                  <View style={styles.exerciseMetadata}>
                    <View style={styles.metadataBadge}>
                      <MaterialIcons name="schedule" size={14} color={colors.textSecondary} />
                      <Text style={styles.metadataBadgeText}>{exercise.duration} min</Text>
                    </View>
                    <View style={styles.metadataBadge}>
                      <Text style={styles.metadataBadgeText}>{exercise.steps.length} steps</Text>
                    </View>
                  </View>
                </View>

                <MaterialIcons name="chevron-right" size={24} color={colors.textLight} />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {renderExerciseModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    paddingTop: 60,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    zIndex: 10,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: typography.serif,
    color: colors.textInverse,
    marginTop: 20,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 4,
  },
  categoryScroll: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    maxHeight: 84,
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    gap: 6,
    height: 48,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: colors.textInverse,
  },
  exercisesList: {
    flex: 1,
  },
  contentPadding: {
    padding: 16,
  },
  resultsText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  exerciseIcon: {
    width: 132,
    height: 132,
    borderRadius: 66,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseIconImage: {
    width: 108,
    height: 108,
    resizeMode: 'contain',
  },
  categoryChipIcon: {
    width: 66,
    height: 66,
    resizeMode: 'contain',
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  exerciseInstructions: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  exerciseMetadata: {
    flexDirection: 'row',
    gap: 8,
  },
  metadataBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  metadataBadgeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
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
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textInverse,
    flex: 1,
    marginRight: 16,
  },
  modalMetadata: {
    flexDirection: 'row',
    gap: 12,
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
    backgroundColor: colors.primary,
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
  tipBox: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  sourceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  sourceText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  modalFooter: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  startButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },
});

export default ExerciseLibraryScreen;
