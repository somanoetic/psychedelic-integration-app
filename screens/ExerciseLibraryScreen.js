import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { getAllExercises, exerciseCategories } from '../content/exercises';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme/colors';

const ExerciseLibraryScreen = ({ navigation }) => {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Get all exercises from the content file
  const allPractices = getAllExercises();

  const getCategoryInfo = (categoryId) => {
    return exerciseCategories.find(c => c.id === categoryId) || exerciseCategories[0];
  };

  const filteredPractices = selectedCategory === 'all'
    ? allPractices
    : allPractices.filter(p => p.category === selectedCategory);

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
                <MaterialIcons name="lightbulb" size={20} color="#f59e0b" />
                <Text style={styles.tipText}>
                  Take your time with each step. There's no rush. This is your practice.
                </Text>
              </View>
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
            <MaterialIcons
              name={category.icon}
              size={18}
              color={selectedCategory === category.id ? colors.textInverse : colors.textSecondary}
            />
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

          {filteredPractices.map((exercise, index) => {
            const categoryInfo = getCategoryInfo(exercise.category);
            return (
              <TouchableOpacity
                key={index}
                style={styles.exerciseCard}
                onPress={() => setSelectedExercise(exercise)}
              >
                <View style={[styles.exerciseIcon, { backgroundColor: categoryInfo.color }]}>
                  <MaterialIcons name={categoryInfo.icon} size={24} color={colors.textInverse} />
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

                <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
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
    fontWeight: 'bold',
    color: colors.textInverse,
    marginTop: 20,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
  },
  categoryScroll: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    maxHeight: 56,
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    gap: 6,
    height: 32,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
    color: '#374151',
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
  modalFooter: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
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
