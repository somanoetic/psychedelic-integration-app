import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GroundingExercisesWidget from '../../components/GroundingExercisesWidget';
import IFSPartsEducationWidget from '../../components/IFSPartsEducationWidget';
import NervousSystemEducationWidget from '../../components/NervousSystemEducationWidget';
import { colors, gradients, spacing, borderRadius, shadows } from '../../theme/colors';

const GeneralPreparationScreen = ({ navigation }) => {
  const [currentSection, setCurrentSection] = useState('overview');
  const [completedSections, setCompletedSections] = useState([]);

  // Foundation learning sections
  const preparationSections = [
    {
      id: 'overview',
      title: 'Foundation Overview',
      emoji: '🌟',
      description: 'Learn the basics for all your sessions',
      estimatedTime: '2 min'
    },
    {
      id: 'nervous_system',
      title: 'Nervous System Basics',
      emoji: '🧠',
      description: 'Understanding your three states',
      estimatedTime: '5 min'
    },
    {
      id: 'parts_work',
      title: 'Parts of You (IFS)',
      emoji: '👥',
      description: 'Meet your inner protectors and wounded parts',
      estimatedTime: '7 min'
    },
    {
      id: 'grounding_prep',
      title: 'Grounding & Somatic Practices',
      emoji: '🌱',
      description: 'Learn regulation techniques',
      estimatedTime: '8 min'
    }
  ];

  const markSectionComplete = (sectionId) => {
    if (!completedSections.includes(sectionId)) {
      setCompletedSections([...completedSections, sectionId]);
    }
  };

  const renderOverview = () => (
    <ScrollView style={styles.sectionContainer}>
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
        <Text style={styles.heroTitle}>Foundational Preparation</Text>
        <Text style={styles.heroSubtitle}>
          Learn the core concepts that will support all your healing sessions
        </Text>
      </LinearGradient>

      <View style={styles.contentPadding}>
        <Text style={styles.sectionTitle}>🧠 Build Your Foundation</Text>
        <Text style={styles.bodyText}>
          These foundational concepts will help you understand your nervous system, 
          internal parts, and regulation techniques. You'll use these tools in every session, 
          so take your time to learn them well.
        </Text>

        <View style={styles.keyBenefitsBox}>
          <Text style={styles.keyBenefitsTitle}>Why Learn These Foundations?</Text>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitEmoji}>🧠</Text>
            <Text style={styles.benefitText}>Understand how your nervous system responds during sessions</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitEmoji}>👥</Text>
            <Text style={styles.benefitText}>Recognize different parts of yourself that may emerge</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitEmoji}>🌱</Text>
            <Text style={styles.benefitText}>Learn self-regulation techniques for any moment</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitEmoji}>✨</Text>
            <Text style={styles.benefitText}>Enhance your integration and healing capacity</Text>
          </View>
        </View>

        <View style={styles.preparationFlow}>
          <Text style={styles.flowTitle}>📚 Learning Modules</Text>
          {preparationSections.slice(1).map((section, index) => (
            <TouchableOpacity
              key={section.id}
              style={[
                styles.flowItem,
                completedSections.includes(section.id) && styles.completedFlowItem
              ]}
              onPress={() => setCurrentSection(section.id)}
            >
              <View style={styles.flowItemLeft}>
                <Text style={styles.flowEmoji}>{section.emoji}</Text>
                <View style={styles.flowItemText}>
                  <Text style={styles.flowItemTitle}>{section.title}</Text>
                  <Text style={styles.flowItemDescription}>{section.description}</Text>
                  <Text style={styles.flowItemTime}>{section.estimatedTime}</Text>
                </View>
              </View>
              <View style={styles.flowItemRight}>
                {completedSections.includes(section.id) ? (
                  <MaterialIcons name="check-circle" size={24} color="#10b981" />
                ) : (
                  <MaterialIcons name="arrow-forward-ios" size={16} color="#9ca3af" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.progressBox}>
          <Text style={styles.progressTitle}>
            Progress: {completedSections.length}/{preparationSections.length - 1} Complete
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(completedSections.length / (preparationSections.length - 1)) * 100}%` }
              ]} 
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.startButton}
          onPress={() => setCurrentSection('nervous_system')}
        >
          <Text style={styles.startButtonText}>Begin Foundation Learning</Text>
        </TouchableOpacity>

        {completedSections.length === preparationSections.length - 1 && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => {
              Alert.alert(
                'Foundation Complete!',
                'You\'ve learned the core concepts. Now you\'re ready to prepare for individual sessions.',
                [
                  { 
                    text: 'Return to Sessions', 
                    onPress: () => navigation.goBack()
                  }
                ]
              );
            }}
          >
            <Text style={styles.completeButtonText}>Foundation Complete ✨</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );

  const renderNervousSystemEducation = () => (
    <View style={styles.educationContainer}>
      <View style={styles.sectionHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setCurrentSection('overview')}
        >
          <MaterialIcons name="arrow-back" size={24} color="#6b7280" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>🧠 Nervous System Basics</Text>
      </View>
      <NervousSystemEducationWidget
        onComplete={() => {
          markSectionComplete('nervous_system');
          setCurrentSection('parts_work');
        }}
        onSkip={() => {
          markSectionComplete('nervous_system');
          setCurrentSection('parts_work');
        }}
      />
    </View>
  );

  const renderPartsWorkEducation = () => (
    <View style={styles.educationContainer}>
      <View style={styles.sectionHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setCurrentSection('overview')}
        >
          <MaterialIcons name="arrow-back" size={24} color="#6b7280" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>👥 Parts of You (IFS)</Text>
      </View>
      <IFSPartsEducationWidget
        onComplete={() => {
          markSectionComplete('parts_work');
          setCurrentSection('grounding_prep');
        }}
        onSkip={() => {
          markSectionComplete('parts_work');
          setCurrentSection('grounding_prep');
        }}
      />
    </View>
  );

  const renderGroundingPrep = () => (
    <View style={styles.educationContainer}>
      <View style={styles.sectionHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setCurrentSection('overview')}
        >
          <MaterialIcons name="arrow-back" size={24} color="#6b7280" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>🌱 Grounding & Somatic Practices</Text>
      </View>
      <GroundingExercisesWidget
        onComplete={() => {
          markSectionComplete('grounding_prep');
          setCurrentSection('overview');
        }}
        onSkip={() => {
          markSectionComplete('grounding_prep');
          setCurrentSection('overview');
        }}
      />
    </View>
  );

  // Render based on current section
  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'overview':
        return renderOverview();
      case 'nervous_system':
        return renderNervousSystemEducation();
      case 'parts_work':
        return renderPartsWorkEducation();
      case 'grounding_prep':
        return renderGroundingPrep();
      default:
        return renderOverview();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {renderCurrentSection()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sectionContainer: {
    flex: 1,
  },
  educationContainer: {
    flex: 1,
  },
  headerGradient: {
    paddingHorizontal: 24,
    paddingVertical: 48,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textInverse,
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#e0e7ff',
    textAlign: 'center',
    lineHeight: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  contentPadding: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  bodyText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
  },
  keyBenefitsBox: {
    backgroundColor: '#f0fdf4',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  keyBenefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  benefitEmoji: {
    fontSize: 18,
    marginRight: 12,
    marginTop: 2,
  },
  benefitText: {
    fontSize: 15,
    color: '#065f46',
    lineHeight: 22,
    flex: 1,
  },
  preparationFlow: {
    marginBottom: 24,
  },
  flowTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  flowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  completedFlowItem: {
    backgroundColor: '#f0f9ff',
    borderColor: '#10b981',
  },
  flowItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flowEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  flowItemText: {
    flex: 1,
  },
  flowItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  flowItemDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  flowItemTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  flowItemRight: {
    marginLeft: 12,
  },
  progressBox: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },
  completeButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },
});

export default GeneralPreparationScreen;