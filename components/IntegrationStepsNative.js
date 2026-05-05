// components/IntegrationStepsNative.js - React Native version
import { useEffect, useState } from 'react';
import { colors } from '../theme/colors';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const IntegrationStepsNative = ({ 
  currentStep = 1, 
  onStepChange, 
  entities = [], 
  sessionData = {},
  onStepComplete 
}) => {
  const [completedSteps, setCompletedSteps] = useState([]);
  const [stepProgress, setStepProgress] = useState({
    1: 0, 2: 0, 3: 0, 4: 0
  });

  const steps = [
    {
      id: 1,
      title: "Associations",
      subtitle: "What comes to mind?",
      color: colors.primary,
      description: "Explore personal associations with symbols and experiences from your journey",
      questions: [
        "What does this symbol remind you of from your own life?",
        "When have you encountered similar imagery before?",
        "What feelings arise when you focus on this element?",
        "What personal memories does this connect to?"
      ],
      entities: entities.filter(e => e.category === 'symbolic' || e.category === 'archetypal')
    },
    {
      id: 2,
      title: "Inner Dynamics",
      subtitle: "How does this relate to my inner world?",
      color: colors.error,
      description: "Map how journey elements connect to your internal parts, patterns, and current life situations",
      questions: [
        "What part of me does this represent?",
        "How does this pattern show up in my daily life?",
        "What internal conflicts does this highlight?",
        "Which aspect of my personality does this reflect?"
      ],
      entities: entities.filter(e => e.category === 'parts' || e.category === 'emotional')
    },
    {
      id: 3,
      title: "Integration & Values",
      subtitle: "What does this mean for how I want to live?",
      color: colors.warning,
      description: "Synthesize insights and align them with your core values and ethical framework",
      questions: [
        "How does this insight align with my values?",
        "What would it mean to live this wisdom?",
        "How can I honor this teaching ethically?",
        "What changes feel authentic and sustainable?"
      ],
      entities: entities.filter(e => e.category === 'spiritual' || e.emotional_intensity === 'high')
    },
    {
      id: 4,
      title: "Ritual & Embodiment",
      subtitle: "How do I bring this into my life?",
      color: "#8B5CF6",
      description: "Create concrete practices and rituals to embody your insights in daily life",
      questions: [
        "What daily practice would honor this insight?",
        "How can I embody this wisdom physically?",
        "What ritual would help me remember this teaching?",
        "How can I express this creatively?"
      ],
      entities: entities.filter(e => e.category === 'somatic' || e.category === 'environmental')
    }
  ];

  const calculateStepProgress = (step) => {
    const relevantEntities = step.entities.length;
    const totalPossibleEntities = Math.max(entities.length * 0.25, 1);
    return Math.min(100, (relevantEntities / totalPossibleEntities) * 100);
  };

  useEffect(() => {
    const newProgress = {};
    steps.forEach(step => {
      newProgress[step.id] = calculateStepProgress(step);
    });
    setStepProgress(newProgress);
  }, [entities]);

  const handleStepClick = (stepId) => {
    onStepChange?.(stepId);
  };

  const handleStepComplete = (stepId) => {
    if (!completedSteps.includes(stepId)) {
      const newCompleted = [...completedSteps, stepId];
      setCompletedSteps(newCompleted);
      onStepComplete?.(stepId, newCompleted);
    }
  };

  const currentStepData = steps.find(s => s.id === currentStep);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Johnson's Integration Framework</Text>
        <Text style={styles.subtitle}>
          {completedSteps.length} of 4 steps completed
        </Text>
      </View>

      {/* Step Navigation */}
      <View style={styles.stepsContainer}>
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = completedSteps.includes(step.id);
          const progress = stepProgress[step.id];

          return (
            <TouchableOpacity
              key={step.id}
              style={[
                styles.stepCard,
                isActive && styles.activeStep,
                isCompleted && styles.completedStep
              ]}
              onPress={() => handleStepClick(step.id)}
            >
              {/* Step Number/Check */}
              <View style={[
                styles.stepNumber,
                { backgroundColor: step.color },
                isCompleted && styles.completedStepNumber
              ]}>
                <Text style={styles.stepNumberText}>
                  {isCompleted ? '✓' : step.id}
                </Text>
              </View>

              {/* Step Content */}
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, isActive && styles.activeStepTitle]}>
                  {step.title}
                </Text>
                <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
                
                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBackground}>
                    <View 
                      style={[
                        styles.progressFill,
                        { width: `${progress}%`, backgroundColor: step.color }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>{Math.round(progress)}%</Text>
                </View>

                {/* Entity Count */}
                <Text style={styles.entityCount}>
                  {step.entities.length} relevant entities
                </Text>
              </View>

              {/* Arrow for active step */}
              {isActive && (
                <View style={[styles.activeIndicator, { backgroundColor: step.color }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Current Step Detail */}
      {currentStepData && (
        <View style={styles.detailSection}>
          <Text style={styles.detailTitle}>
            Step {currentStepData.id}: {currentStepData.title}
          </Text>
          <Text style={styles.detailDescription}>
            {currentStepData.description}
          </Text>

          {/* Questions */}
          <View style={styles.questionsSection}>
            <Text style={styles.sectionTitle}>Guiding Questions</Text>
            {currentStepData.questions.map((question, index) => (
              <View key={index} style={styles.questionItem}>
                <Text style={styles.questionBullet}>•</Text>
                <Text style={styles.questionText}>{question}</Text>
              </View>
            ))}
          </View>

          {/* Relevant Entities */}
          {currentStepData.entities.length > 0 && (
            <View style={styles.entitiesSection}>
              <Text style={styles.sectionTitle}>Relevant Entities</Text>
              <View style={styles.entityChips}>
                {currentStepData.entities.slice(0, 6).map((entity, index) => (
                  <View key={index} style={[
                    styles.entityChip,
                    { borderColor: currentStepData.color }
                  ]}>
                    <Text style={[styles.entityChipText, { color: currentStepData.color }]}>
                      {entity.name}
                    </Text>
                  </View>
                ))}
                {currentStepData.entities.length > 6 && (
                  <View style={styles.entityChip}>
                    <Text style={styles.entityChipText}>
                      +{currentStepData.entities.length - 6} more
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {currentStep > 1 && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => handleStepClick(currentStep - 1)}
              >
                <Text style={styles.secondaryButtonText}>Previous Step</Text>
              </TouchableOpacity>
            )}
            
            {!completedSteps.includes(currentStep) && stepProgress[currentStep] > 50 && (
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: currentStepData.color }]}
                onPress={() => handleStepComplete(currentStep)}
              >
                <Text style={styles.primaryButtonText}>Complete Step</Text>
              </TouchableOpacity>
            )}
            
            {currentStep < 4 && (
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: currentStepData.color }]}
                onPress={() => handleStepClick(currentStep + 1)}
              >
                <Text style={styles.primaryButtonText}>Next Step</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Overall Progress */}
      <View style={styles.overallProgress}>
        <Text style={styles.progressTitle}>Overall Integration Progress</Text>
        <View style={styles.progressBackground}>
          <View 
            style={[
              styles.progressFill,
              { 
                width: `${(completedSteps.length / 4) * 100}%`,
                backgroundColor: '#8B5CF6'
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round((completedSteps.length / 4) * 100)}% Complete
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB'
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary
  },
  stepsContainer: {
    padding: 16
  },
  stepCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.lightGray,
    position: 'relative'
  },
  activeStep: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F8FAFC'
  },
  completedStep: {
    borderColor: colors.success,
    backgroundColor: '#F0FDF4'
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  completedStepNumber: {
    backgroundColor: colors.success
  },
  stepNumberText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  stepContent: {
    flex: 1
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4
  },
  activeStepTitle: {
    color: '#8B5CF6'
  },
  stepSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  progressBackground: {
    flex: 1,
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    marginRight: 8
  },
  progressFill: {
    height: 8,
    borderRadius: 4
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    minWidth: 40
  },
  entityCount: {
    fontSize: 12,
    color: colors.textLight
  },
  activeIndicator: {
    position: 'absolute',
    right: 0,
    top: '50%',
    width: 4,
    height: 30,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    transform: [{ translateY: -15 }]
  },
  detailSection: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 20
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8
  },
  detailDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 20
  },
  questionsSection: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12
  },
  questionItem: {
    flexDirection: 'row',
    marginBottom: 8
  },
  questionBullet: {
    fontSize: 16,
    color: '#8B5CF6',
    marginRight: 8,
    marginTop: 2
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20
  },
  entitiesSection: {
    marginBottom: 20
  },
  entityChips: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  entityChip: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8
  },
  entityChipText: {
    fontSize: 12,
    fontWeight: '500'
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
  },
  primaryButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center'
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center'
  },
  overallProgress: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center'
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12
  }
});

export default IntegrationStepsNative;