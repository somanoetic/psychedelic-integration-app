import React, { useState, useMemo, useEffect } from 'react';
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
import {
  X,
  Clock,
  Lightbulb,
  BookOpen,
  Check,
  ArrowLeft,
  Search,
  SearchX,
  ChevronRight,
  User,
  Grid3x3,
  Wind,
  Mountain,
  Activity,
  Heart,
  Users,
  Sparkles,
  Flower2,
  Brain,
  Repeat,
  Dumbbell,
  GraduationCap,
  HeartPulse,
} from 'lucide-react-native';
import { getAllExercises, exerciseCategories } from '../content/exercises-comprehensive';
import { colors, gradients, spacing, borderRadius, shadows, typography } from '../theme/colors';
import contributedExerciseService from '../lib/contributedExerciseService';
import ContributedContentDisclaimer from '../components/ContributedContentDisclaimer';

// Map the legacy MaterialIcons names stored in exerciseCategories data
// to Lucide components. Used only when an iconImage isn't available.
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
};

const ExerciseLibraryScreen = ({ navigation }) => {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [contributedExercises, setContributedExercises] = useState([]);

  // Bundled curated exercises always render synchronously; approved
  // contributor submissions are async-merged once loaded. The library
  // remains usable offline at the bundled set.
  const bundledPractices = getAllExercises();
  const allPractices = useMemo(
    () => [...bundledPractices, ...contributedExercises],
    [bundledPractices, contributedExercises],
  );

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
    const CategoryIcon = CATEGORY_LUCIDE[categoryInfo.icon] || Sparkles;

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
                  <X size={28} color={colors.textInverse} strokeWidth={2} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalMetadata}>
                <View style={styles.metadataItem}>
                  <Clock size={16} color={colors.textInverse} strokeWidth={2} />
                  <Text style={styles.metadataText}>{selectedExercise.duration} min</Text>
                </View>
                <View style={styles.metadataItem}>
                  <CategoryIcon size={16} color={colors.textInverse} strokeWidth={2} />
                  <Text style={styles.metadataText}>{categoryInfo.name}</Text>
                </View>
              </View>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.instructionsSection}>
                <View style={styles.sectionTitleRow}>
                  <Lightbulb size={18} color={colors.primary} strokeWidth={2} />
                  <Text style={styles.sectionTitle}>Purpose</Text>
                </View>
                <Text style={styles.instructionsText}>{selectedExercise.instructions}</Text>
              </View>

              <View style={styles.stepsSection}>
                <View style={styles.sectionTitleRow}>
                  <Check size={18} color={colors.primary} strokeWidth={2} />
                  <Text style={styles.sectionTitle}>Steps</Text>
                </View>
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
                <Lightbulb size={20} color={colors.warning} strokeWidth={2} />
                <Text style={styles.tipText}>
                  Take your time with each step. There's no rush. This is your practice.
                </Text>
              </View>

              {selectedExercise.isContributed ? (
                <ContributedContentDisclaimer
                  attributionName={selectedExercise.attributionName}
                  style={styles.disclaimerBox}
                />
              ) : selectedExercise.source ? (
                <View style={styles.sourceBox}>
                  <BookOpen size={16} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={styles.sourceText}>Source: {selectedExercise.source}</Text>
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.startButton, { backgroundColor: categoryInfo.color }]}
                onPress={() => setSelectedExercise(null)}
              >
                <Check size={20} color={colors.textInverse} strokeWidth={2} />
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
          <ArrowLeft size={24} color={colors.textInverse} strokeWidth={2} />
        </TouchableOpacity>

        <Text style={styles.heroTitle}>Exercise Library</Text>
        <Text style={styles.heroSubtitle}>
          Therapeutic practices for integration & well-being
        </Text>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <Search size={20} color={colors.textSecondary} strokeWidth={2} />
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
            <X size={20} color={colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryScrollContent}
      >
        {exerciseCategories.map(category => {
          const FallbackIcon = CATEGORY_LUCIDE[category.icon] || Sparkles;
          return (
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
                <FallbackIcon
                  size={18}
                  color={selectedCategory === category.id ? colors.textInverse : colors.textSecondary}
                  strokeWidth={2}
                />
              )}
              <Text style={[
                styles.categoryChipText,
                selectedCategory === category.id && styles.categoryChipTextActive
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView style={styles.exercisesList} showsVerticalScrollIndicator={false}>
        <View style={styles.contentPadding}>
          <Text style={styles.resultsText}>
            {filteredPractices.length} {filteredPractices.length === 1 ? 'exercise' : 'exercises'}
          </Text>

          {filteredPractices.length === 0 && (
            <View style={styles.emptyState}>
              <SearchX size={48} color={colors.textSecondary} strokeWidth={1.5} />
              <Text style={styles.emptyStateText}>No exercises found</Text>
              <Text style={styles.emptyStateSubtext}>Try a different search or category</Text>
            </View>
          )}

          {filteredPractices.map((exercise, index) => {
            const categoryInfo = getCategoryInfo(exercise.category);
            const CardFallbackIcon = CATEGORY_LUCIDE[categoryInfo.icon] || Sparkles;
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
                    <CardFallbackIcon size={24} color={colors.textInverse} strokeWidth={2} />
                  )}
                </View>

                <View style={styles.exerciseContent}>
                  <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                  <Text style={styles.exerciseInstructions} numberOfLines={2}>
                    {exercise.instructions}
                  </Text>
                  <View style={styles.exerciseMetadata}>
                    <View style={styles.metadataBadge}>
                      <Clock size={14} color={colors.textSecondary} strokeWidth={2} />
                      <Text style={styles.metadataBadgeText}>{exercise.duration} min</Text>
                    </View>
                    <View style={styles.metadataBadge}>
                      <Text style={styles.metadataBadgeText}>{exercise.steps.length} steps</Text>
                    </View>
                    {exercise.isContributed && (
                      <View style={styles.contributedBadge}>
                        <User size={12} color={colors.primary} strokeWidth={2} />
                        <Text style={styles.contributedBadgeText} numberOfLines={1}>
                          By {exercise.attributionName}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <ChevronRight size={24} color={colors.textLight} strokeWidth={2} />
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
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
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
  disclaimerBox: {
    marginTop: 16,
  },
  contributedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: `${colors.primary}15`,
    borderRadius: 12,
    maxWidth: 220,
  },
  contributedBadgeText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
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
