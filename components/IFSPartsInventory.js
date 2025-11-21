import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

/**
 * IFS Parts Inventory - Enhanced Parts Identification
 * Based on the IFS Integration PDF with detailed parts categories
 */
const IFSPartsInventory = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedParts, setSelectedParts] = useState({
    managers: [],
    firefighters: [],
    exiles: []
  });
  const [customNotes, setCustomNotes] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedInventory();
  }, []);

  const loadSavedInventory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('ifs_parts_inventory')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setSelectedParts(data.parts || { managers: [], firefighters: [], exiles: [] });
        setCustomNotes(data.custom_notes || {});
      }
    } catch (error) {
      console.error('Error loading IFS inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveInventory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('ifs_parts_inventory')
        .upsert({
          user_id: user.id,
          parts: selectedParts,
          custom_notes: customNotes,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving IFS inventory:', error);
    }
  };

  // Parts definitions from the IFS Integration PDF
  const partsData = {
    managers: {
      title: 'Manager Parts',
      emoji: '👔',
      color: '#3b82f6',
      description: 'Proactive protectors that try to control your environment and prevent bad things from happening.',
      parts: [
        {
          name: 'Achiever',
          description: 'Drives you to succeed, be perfect, and meet high standards',
          questions: ['Do you push yourself to achieve and perform?', 'Is rest difficult because there\'s always more to do?']
        },
        {
          name: 'People Pleaser',
          description: 'Works to make sure everyone likes you and no one is upset',
          questions: ['Do you often put others\' needs before your own?', 'Is it hard to say no or set boundaries?']
        },
        {
          name: 'Controller',
          description: 'Tries to manage outcomes, plans, and other people',
          questions: ['Do you need to have things "just right"?', 'Does unpredictability stress you out?']
        },
        {
          name: 'Caretaker',
          description: 'Focuses on taking care of others, sometimes at your expense',
          questions: ['Are you the one others turn to in crisis?', 'Do you feel responsible for others\' feelings?']
        },
        {
          name: 'Strong One',
          description: 'Never shows weakness or vulnerability to stay safe',
          questions: ['Do you have to "hold it together" for everyone?', 'Is asking for help difficult?']
        },
        {
          name: 'Critic',
          description: 'Harsh inner voice trying to prevent failure through criticism',
          questions: ['Do you have a harsh inner critic?', 'Do you criticize yourself before others can?']
        },
        {
          name: 'Vigilant One',
          description: 'Always scanning for danger, staying alert to threats',
          questions: ['Are you always on guard for what might go wrong?', 'Do you notice threats others miss?']
        }
      ]
    },
    firefighters: {
      title: 'Firefighter Parts',
      emoji: '🚒',
      color: '#dc2626',
      description: 'Reactive protectors that distract from pain or numb difficult feelings when you\'re already hurt.',
      parts: [
        {
          name: 'Rager',
          description: 'Uses anger to push away threats or express unheard needs',
          questions: ['Do you sometimes explode with anger?', 'Does rage come up when boundaries are crossed?']
        },
        {
          name: 'Escape Artist',
          description: 'Uses substances, work, or dissociation to avoid pain',
          questions: ['Do you use substances, work, or screens to escape?', 'Do you "check out" when overwhelmed?']
        },
        {
          name: 'Rebel',
          description: 'Acts out against rules or authority when feeling controlled',
          questions: ['Do you resist rules or authority?', 'Do you do the opposite when told what to do?']
        },
        {
          name: 'Chaos Creator',
          description: 'Creates drama or crisis to distract from deeper pain',
          questions: ['Does drama seem to follow you?', 'Do you create intensity to feel alive?']
        },
        {
          name: 'Indulger',
          description: 'Seeks immediate pleasure or comfort to soothe pain',
          questions: ['Do you indulge in excess (food, shopping, etc.)?', 'Do you seek immediate gratification?']
        }
      ]
    },
    exiles: {
      title: 'Exile Parts',
      emoji: '🧸',
      color: '#a855f7',
      description: 'Vulnerable parts carrying wounds, but also creativity, spontaneity, and capacity for joy.',
      parts: [
        {
          name: 'Hurt Child',
          description: 'Carries early wounds, unmet needs, and pain from the past',
          questions: ['Do you carry pain from childhood?', 'Do old hurts still feel fresh?']
        },
        {
          name: 'Scared One',
          description: 'Holds deep fears and anxiety about safety',
          questions: ['Is fear a constant companion?', 'Do you worry about bad things happening?']
        },
        {
          name: 'Angry One',
          description: 'Holds justified rage at injustice or violation',
          questions: ['Is there old anger that needs to be heard?', 'Were you treated unfairly?']
        },
        {
          name: 'Sad One',
          description: 'Carries grief, loss, and deep sadness',
          questions: ['Is there unprocessed grief?', 'Do you feel deep sadness?']
        },
        {
          name: 'Lonely One',
          description: 'Longs for connection and feels profoundly alone',
          questions: ['Do you feel deeply lonely?', 'Do you long for true connection?']
        },
        {
          name: 'Joyful One',
          description: 'Your spontaneous, playful, carefree self',
          questions: ['Can you access joy and playfulness?', 'Were you punished for being "too much"?']
        },
        {
          name: 'Creative One',
          description: 'Holds your authentic expression and creativity',
          questions: ['Do you long to express yourself creatively?', 'Was your creativity shut down?']
        },
        {
          name: 'Wild One',
          description: 'Your uninhibited, free, sensual self',
          questions: ['Do you long to feel free and wild?', 'Were you shamed for being uninhibited?']
        },
        {
          name: 'Wise One',
          description: 'Your innate wisdom and intuition',
          questions: ['Do you have a wise inner voice?', 'Were you told not to trust yourself?']
        }
      ]
    }
  };

  const steps = [
    {
      type: 'intro',
      title: 'IFS Parts Inventory',
      emoji: '👥',
      content: 'Let\'s identify your protective and vulnerable parts. This deeper understanding helps you work with your parts during psychedelic sessions and integration.'
    },
    { type: 'parts', category: 'managers' },
    { type: 'parts', category: 'firefighters' },
    { type: 'parts', category: 'exiles' },
    {
      type: 'self',
      title: 'Your Core Self',
      emoji: '🌟',
      content: 'At your center is Self - the wise, compassionate observer. Self can lead your parts with the 8 C\'s: Curious, Compassionate, Calm, Connected, Courageous, Creative, Clarity, Confidence.'
    },
    {
      type: 'summary',
      title: 'Your Parts Family',
      emoji: '✨',
      content: 'Here are the parts you\'ve identified:'
    }
  ];

  const togglePart = (category, partName) => {
    setSelectedParts(prev => {
      const categoryParts = prev[category] || [];
      const isSelected = categoryParts.includes(partName);

      return {
        ...prev,
        [category]: isSelected
          ? categoryParts.filter(p => p !== partName)
          : [...categoryParts, partName]
      };
    });
  };

  const updateCustomNote = (category, partName, note) => {
    setCustomNotes(prev => ({
      ...prev,
      [`${category}_${partName}`]: note
    }));
  };

  const renderIntro = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepEmoji}>{steps[currentStep].emoji}</Text>
      <Text style={styles.stepTitle}>{steps[currentStep].title}</Text>
      <Text style={styles.stepText}>{steps[currentStep].content}</Text>

      <View style={styles.infoBox}>
        <MaterialIcons name="info" size={20} color="#3b82f6" />
        <Text style={styles.infoText}>
          All parts are welcome. All parts have good intentions. Your job is simply to notice them with curiosity.
        </Text>
      </View>
    </View>
  );

  const renderPartsCategory = () => {
    const step = steps[currentStep];
    const category = partsData[step.category];

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepEmoji}>{category.emoji}</Text>
        <Text style={[styles.stepTitle, { color: category.color }]}>{category.title}</Text>
        <Text style={styles.stepText}>{category.description}</Text>

        <View style={styles.partsContainer}>
          {category.parts.map((part, index) => {
            const isSelected = selectedParts[step.category]?.includes(part.name);
            const noteKey = `${step.category}_${part.name}`;

            return (
              <View key={index} style={[
                styles.partCard,
                isSelected && styles.partCardSelected
              ]}>
                <TouchableOpacity
                  style={[
                    styles.partHeader,
                    isSelected && { backgroundColor: `${category.color}15` }
                  ]}
                  onPress={() => togglePart(step.category, part.name)}
                  activeOpacity={0.7}
                >
                  <View style={styles.partHeaderLeft}>
                    <View style={[
                      styles.checkbox,
                      isSelected && { backgroundColor: category.color, borderColor: category.color }
                    ]}>
                      {isSelected && (
                        <MaterialIcons name="check" size={16} color="#ffffff" />
                      )}
                    </View>
                    <Text style={[styles.partName, isSelected && { color: category.color, fontWeight: '600' }]}>
                      {part.name}
                    </Text>
                    {isSelected && (
                      <View style={[styles.selectedBadge, { backgroundColor: category.color }]}>
                        <Text style={styles.selectedBadgeText}>SELECTED</Text>
                      </View>
                    )}
                  </View>
                  {isSelected && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => togglePart(step.category, part.name)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <MaterialIcons name="close" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>

                <Text style={styles.partDescription}>{part.description}</Text>

                <View style={styles.questionsBox}>
                  {part.questions.map((question, qIndex) => (
                    <Text key={qIndex} style={styles.questionText}>• {question}</Text>
                  ))}
                </View>

                {isSelected && (
                  <TextInput
                    style={styles.noteInput}
                    placeholder="Add notes about this part (optional)..."
                    placeholderTextColor="#9ca3af"
                    value={customNotes[noteKey] || ''}
                    onChangeText={(text) => updateCustomNote(step.category, part.name, text)}
                    multiline
                  />
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderSelf = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepEmoji}>{steps[currentStep].emoji}</Text>
      <Text style={styles.stepTitle}>{steps[currentStep].title}</Text>
      <Text style={styles.stepText}>{steps[currentStep].content}</Text>

      <View style={styles.selfQualities}>
        {['Curious', 'Compassionate', 'Calm', 'Connected', 'Courageous', 'Creative', 'Clarity', 'Confidence'].map((quality, index) => (
          <View key={index} style={styles.qualityChip}>
            <Text style={styles.qualityText}>{quality}</Text>
          </View>
        ))}
      </View>

      <View style={styles.practiceBox}>
        <Text style={styles.practiceTitle}>💫 Accessing Self</Text>
        <Text style={styles.practiceText}>
          During your session, when parts become activated, you can return to Self by asking: "Can this part step back so I can be curious about it?" Notice the shift in your awareness.
        </Text>
      </View>
    </View>
  );

  const renderSummary = () => {
    const totalParts = Object.values(selectedParts).flat().length;

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepEmoji}>{steps[currentStep].emoji}</Text>
        <Text style={styles.stepTitle}>{steps[currentStep].title}</Text>
        <Text style={styles.summaryCount}>You've identified {totalParts} parts</Text>

        {Object.entries(partsData).map(([category, data]) => {
          const categoryParts = selectedParts[category] || [];
          if (categoryParts.length === 0) return null;

          return (
            <View key={category} style={[styles.summaryCategory, { borderLeftColor: data.color }]}>
              <Text style={styles.summaryCategoryTitle}>
                {data.emoji} {data.title}
              </Text>
              {categoryParts.map((partName, index) => (
                <Text key={index} style={styles.summaryPartName}>• {partName}</Text>
              ))}
            </View>
          );
        })}

        <View style={styles.completionBox}>
          <Text style={styles.completionText}>
            Remember: All these parts are working hard to protect you. During your psychedelic journey, you may meet them more directly. Approach them with curiosity and compassion.
          </Text>
        </View>
      </View>
    );
  };

  const renderStep = () => {
    const step = steps[currentStep];

    switch (step.type) {
      case 'intro':
        return renderIntro();
      case 'parts':
        return renderPartsCategory();
      case 'self':
        return renderSelf();
      case 'summary':
        return renderSummary();
      default:
        return null;
    }
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      await saveInventory();
    } else {
      await saveInventory();
      if (onComplete) onComplete(selectedParts);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#a855f7" />
        <Text style={styles.loadingText}>Loading your parts inventory...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
          <MaterialIcons name="close" size={24} color="#6b7280" />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {currentStep + 1} / {steps.length}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentStep + 1) / steps.length) * 100}%` }
              ]}
            />
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navButton, currentStep === 0 && styles.navButtonDisabled]}
          onPress={handlePrevious}
          disabled={currentStep === 0}
        >
          <MaterialIcons
            name="arrow-back"
            size={20}
            color={currentStep === 0 ? '#9ca3af' : '#6b7280'}
          />
          <Text style={[styles.navButtonText, currentStep === 0 && styles.navButtonDisabledText]}>
            Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
          </Text>
          <MaterialIcons
            name={currentStep === steps.length - 1 ? 'check' : 'arrow-forward'}
            size={20}
            color="#ffffff"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  skipButton: {
    padding: 8,
  },
  progressContainer: {
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  progressBar: {
    width: 100,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#a855f7',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 24,
  },
  stepEmoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  stepText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  partsContainer: {
    gap: 16,
  },
  partCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  partCardSelected: {
    borderColor: '#a855f7',
    borderWidth: 2,
    backgroundColor: '#faf5ff',
  },
  partHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  partHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1f2937',
    flex: 1,
  },
  selectedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  selectedBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  },
  partDescription: {
    fontSize: 14,
    color: '#6b7280',
    paddingHorizontal: 16,
    paddingBottom: 12,
    lineHeight: 20,
  },
  questionsBox: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  questionText: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 6,
    lineHeight: 18,
  },
  noteInput: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 16,
    fontSize: 14,
    color: '#1f2937',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selfQualities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  qualityChip: {
    backgroundColor: '#fef7ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  qualityText: {
    fontSize: 14,
    color: '#7c2d12',
    fontWeight: '500',
  },
  practiceBox: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
  },
  practiceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 8,
  },
  practiceText: {
    fontSize: 14,
    color: '#065f46',
    lineHeight: 20,
  },
  summaryCount: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  summaryCategory: {
    borderLeftWidth: 4,
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryCategoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  summaryPartName: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 6,
  },
  completionBox: {
    backgroundColor: '#fef7ff',
    padding: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  completionText: {
    fontSize: 15,
    color: '#7c2d12',
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 4,
  },
  navButtonDisabledText: {
    color: '#9ca3af',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#a855f7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 4,
  },
});

export default IFSPartsInventory;
