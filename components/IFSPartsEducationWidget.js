import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  Ear,
  Flame,
  HandHeart,
  Heart,
  Sparkles,
  Target,
  X,
} from 'lucide-react-native';
import { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
} from 'react-native';
import educationProgressService from '../lib/educationProgressService';
import { icons } from '../lib/uiIcons';
import { colors } from '../theme/colors';

const SlideEmoji = ({ slide, style, imageStyle }) =>
  slide.icon ? (
    <Image source={slide.icon} style={imageStyle} />
  ) : (
    <Text style={style}>{slide.emoji}</Text>
  );

const IFSPartsEducationWidget = ({ onComplete, onSkip }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [userResponses, setUserResponses] = useState({});
  const [identifiedParts, setIdentifiedParts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load saved progress on mount
  useEffect(() => {
    loadProgress();
  }, []);

  // Auto-save progress whenever state changes
  useEffect(() => {
    if (!loading) {
      saveProgress();
    }
  }, [currentSlide, userResponses, identifiedParts]);

  const loadProgress = async () => {
    try {
      const progress = await educationProgressService.getProgress('ifs_parts');
      if (progress && !progress.completed) {
        setCurrentSlide(progress.current_step || 0);
        if (progress.progress_data) {
          setUserResponses(progress.progress_data.userResponses || {});
          setIdentifiedParts(progress.progress_data.identifiedParts || []);
        }
      }
    } catch (error) {
      console.error('Error loading IFS education progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async () => {
    try {
      await educationProgressService.autoSave(
        'ifs_parts',
        currentSlide,
        educationSlides.length,
        {
          userResponses,
          identifiedParts
        }
      );
    } catch (error) {
      console.error('Error saving IFS education progress:', error);
    }
  };

  const educationSlides = [
    {
      id: 'intro',
      title: 'Parts of You (IFS)',
      emoji: '👥',
      icon: icons.group,
      content: `Internal Family Systems (IFS) recognizes that we all have different "parts" of ourselves. These parts developed to protect us and help us navigate life. Understanding them brings self-compassion and healing.`,
      type: 'info'
    },
    {
      id: 'self_concept',
      title: 'Your Core Self',
      icon: icons.selfEnergy,
      content: `At your center is your Self - the wise, compassionate, curious part of you. When you're in Self, you feel calm, clear, connected, and courageous. This is who you truly are beneath all the protection.`,
      characteristics: [
        'Naturally curious and open',
        'Feels compassionate toward yourself and others',
        'Able to see the bigger picture',
        'Responds rather than reacts',
        'Feels grounded and authentic'
      ],
      type: 'self_info'
    },
    {
      id: 'manager_parts',
      title: 'Manager Parts',
      emoji: '👔',
      icon: icons.manager,
      color: colors.primary,
      content: `Manager parts work hard to keep you safe by controlling your environment and preventing bad things from happening. They're proactive protectors who try to make sure you're accepted and successful.`,
      characteristics: [
        'The Achiever: Drives you to succeed and be perfect',
        'The People Pleaser: Makes sure everyone likes you',
        'The Controller: Tries to manage outcomes and other people',
        'The Caretaker: Focuses on others\' needs over your own',
        'The Analyzer: Thinks through every possibility to stay safe'
      ],
      positiveIntent: 'Managers want to prevent rejection, failure, and hurt',
      type: 'parts_info'
    },
    {
      id: 'firefighter_parts',
      title: 'Firefighter Parts',
      emoji: '🚒',
      icon: icons.firefighter,
      color: '#dc2626',
      content: `Firefighter parts react when you're already hurt or triggered. They jump into action to distract from pain, numb difficult feelings, or get immediate relief - even if it creates other problems.`,
      characteristics: [
        'The Rebel: Acts out against rules and authority',
        'The Escaper: Uses substances, work, or relationships to avoid pain',
        'The Rager: Expresses anger when boundaries are crossed',
        'The Seeker: Looks for intense experiences to feel alive',
        'The Indulger: Seeks immediate pleasure or comfort'
      ],
      positiveIntent: 'Firefighters want to soothe pain and help you survive crisis',
      type: 'parts_info'
    },
    {
      id: 'exile_parts',
      title: 'Exile Parts',
      icon: icons.exile,
      color: '#a855f7',
      content: `Exile parts carry our deepest wounds, unmet needs, and authentic feelings. Other parts try to protect them by keeping them hidden, but they hold our creativity, spontaneity, and capacity for joy.`,
      characteristics: [
        'The Wounded Child: Carries early hurts and unmet needs',
        'The Creative Spirit: Holds your authentic expression and joy',
        'The Sensitive One: Feels deeply and needs gentle care',
        'The Dreamer: Carries your hopes and authentic desires',
        'The Vulnerable Heart: Longs for true connection and love'
      ],
      positiveIntent: 'Exiles want to be seen, heard, and loved for who they truly are',
      type: 'parts_info'
    },
    {
      id: 'parts_interaction',
      title: 'How Parts Interact',
      emoji: '🔄',
      icon: icons.integrationCycle,
      content: `Your parts are constantly working together, sometimes in harmony and sometimes in conflict. Understanding their relationships helps you navigate internal struggles with compassion.`,
      examples: [
        {
          scenario: 'Before a social event',
          manager: 'The People Pleaser plans what to wear and say',
          exile: 'The Wounded Child fears being rejected',
          firefighter: 'The Escaper might want to cancel or drink too much'
        },
        {
          scenario: 'When someone criticizes you',
          manager: 'The Controller tries to defend and explain',
          exile: 'The Sensitive One feels deeply hurt',
          firefighter: 'The Rager might lash out or shut down completely'
        }
      ],
      type: 'interaction'
    },
    {
      id: 'parts_check',
      title: 'Meet Your Parts',
      emoji: '🪞',
      icon: icons.selfReflect,
      content: `Let's identify some of your parts. Think about which ones show up most often in your life. Remember, all parts are welcome and have good intentions.`,
      type: 'parts_identification',
      prompts: [
        {
          question: 'Which Manager part works hardest in your life?',
          examples: ['Achiever', 'People Pleaser', 'Controller', 'Caretaker', 'Analyzer', 'Other']
        },
        {
          question: 'Which Firefighter part shows up when you\'re stressed?',
          examples: ['Rebel', 'Escaper', 'Rager', 'Seeker', 'Indulger', 'Other']
        },
        {
          question: 'Which Exile part most needs your attention?',
          examples: ['Wounded Child', 'Creative Spirit', 'Sensitive One', 'Dreamer', 'Vulnerable Heart', 'Other']
        }
      ]
    },
    {
      id: 'self_leadership',
      title: 'Self-Leadership',
      emoji: '🧭',
      icon: icons.guidance,
      content: `When you're in Self, you can lead your parts with curiosity and compassion. Instead of being taken over by parts, you can listen to them, understand their concerns, and make choices from a centered place.`,
      practices: [
        {
          name: 'Get Curious',
          description: 'Ask your parts: "What are you trying to protect me from?"',
          example: 'Instead of judging your anxiety, ask what it\'s worried about'
        },
        {
          name: 'Thank Your Parts',
          description: 'Acknowledge the hard work your parts do to keep you safe',
          example: '"Thank you, Achiever, for trying to make me successful"'
        },
        {
          name: 'Set Gentle Boundaries',
          description: 'Let overactive parts know you\'re listening but you\'ve got this',
          example: '"I hear you, Controller. I\'ll consider your input, but I\'m going to try trusting here"'
        }
      ],
      type: 'practices'
    },
    {
      id: 'session_guidance',
      title: 'Parts Work During Sessions',
      emoji: '🌈',
      icon: icons.wholenessInfinity,
      content: `During your psychedelic experience, different parts may become more visible or vocal. This is an opportunity for healing and integration.`,
      guidance: [
        {
          Icon: Ear,
          iconColor: colors.primary,
          title: 'Listen with curiosity',
          description: 'If a part gets loud or scared, ask what it needs'
        },
        {
          Icon: Heart,
          iconColor: colors.success,
          iconFill: colors.success,
          title: 'Offer reassurance',
          description: 'Let protective parts know you\'re safe and supported'
        },
        {
          Icon: HandHeart,
          iconColor: '#a855f7',
          title: 'Welcome exiled parts',
          description: 'If vulnerable parts emerge, offer them love and attention'
        },
        {
          Icon: Sparkles,
          iconColor: colors.warning,
          title: 'Stay in Self',
          description: 'Return to your center when parts become overwhelming'
        }
      ],
      type: 'guidance'
    },
    {
      id: 'completion',
      title: 'Understanding Your Inner Family',
      icon: icons.repairedHeart,
      content: `You now have tools to understand and work with your parts. Remember: all parts are welcome, all parts have good intentions, and your Self can lead with compassion.`,
      type: 'completion'
    }
  ];

  const nextSlide = async () => {
    if (currentSlide < educationSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // Mark as completed
      try {
        await educationProgressService.markComplete('ifs_parts', {
          userResponses,
          identifiedParts
        });
      } catch (error) {
        console.error('Error marking IFS education complete:', error);
      }
      onComplete();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handlePartsIdentification = (partType, partName) => {
    const newPart = { type: partType, name: partName, timestamp: Date.now() };
    setIdentifiedParts([...identifiedParts, newPart]);

    setUserResponses({
      ...userResponses,
      [educationSlides[currentSlide].id]: [...(userResponses[educationSlides[currentSlide].id] || []), newPart]
    });
  };

  const handleRemovePart = (index) => {
    const updatedParts = identifiedParts.filter((_, i) => i !== index);
    setIdentifiedParts(updatedParts);

    // Update user responses as well
    setUserResponses({
      ...userResponses,
      [educationSlides[currentSlide].id]: updatedParts
    });
  };

  const renderSlide = () => {
    const slide = educationSlides[currentSlide];

    switch (slide.type) {
      case 'info':
        return (
          <View style={styles.slideContent}>
            <SlideEmoji slide={slide} style={styles.slideEmoji} imageStyle={styles.slideIconImage} />
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideText}>{slide.content}</Text>
          </View>
        );

      case 'self_info':
        return (
          <View style={styles.slideContent}>
            <SlideEmoji slide={slide} style={styles.slideEmoji} imageStyle={styles.slideIconImage} />
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideText}>{slide.content}</Text>
            
            <View style={styles.characteristicsSection}>
              <Text style={styles.subsectionTitle}>When you're in Self, you feel:</Text>
              {slide.characteristics.map((char, index) => (
                <View key={index} style={styles.characteristicItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.characteristicText}>{char}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      case 'parts_info':
        return (
          <View style={styles.slideContent}>
            <SlideEmoji slide={slide} style={styles.slideEmoji} imageStyle={styles.slideIconImage} />
            <Text style={[styles.slideTitle, { color: slide.color }]}>{slide.title}</Text>
            <Text style={styles.slideText}>{slide.content}</Text>
            
            <View style={styles.partsSection}>
              <Text style={styles.subsectionTitle}>Common {slide.title}:</Text>
              {slide.characteristics.map((char, index) => (
                <View key={index} style={styles.partItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.partText}>{char}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.intentBox, { borderLeftColor: slide.color }]}>
              <View style={styles.intentTitleRow}>
                <Heart size={16} color={slide.color} fill={slide.color} strokeWidth={2} />
                <Text style={styles.intentTitle}>Positive Intent:</Text>
              </View>
              <Text style={styles.intentText}>{slide.positiveIntent}</Text>
            </View>
          </View>
        );

      case 'interaction':
        return (
          <View style={styles.slideContent}>
            <SlideEmoji slide={slide} style={styles.slideEmoji} imageStyle={styles.slideIconImage} />
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideText}>{slide.content}</Text>
            
            <View style={styles.examplesContainer}>
              {slide.examples.map((example, index) => (
                <View key={index} style={styles.exampleCard}>
                  <Text style={styles.exampleScenario}>{example.scenario}</Text>
                  <View style={styles.examplePart}>
                    <View style={styles.partLabelRow}>
                      <Briefcase size={14} color={colors.primary} strokeWidth={2} />
                      <Text style={styles.partLabel}>Manager:</Text>
                    </View>
                    <Text style={styles.partExample}>{example.manager}</Text>
                  </View>
                  <View style={styles.examplePart}>
                    <View style={styles.partLabelRow}>
                      <Heart size={14} color="#a855f7" strokeWidth={2} />
                      <Text style={styles.partLabel}>Exile:</Text>
                    </View>
                    <Text style={styles.partExample}>{example.exile}</Text>
                  </View>
                  <View style={styles.examplePart}>
                    <View style={styles.partLabelRow}>
                      <Flame size={14} color="#dc2626" strokeWidth={2} />
                      <Text style={styles.partLabel}>Firefighter:</Text>
                    </View>
                    <Text style={styles.partExample}>{example.firefighter}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        );

      case 'parts_identification':
        return (
          <View style={styles.slideContent}>
            <SlideEmoji slide={slide} style={styles.slideEmoji} imageStyle={styles.slideIconImage} />
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideText}>{slide.content}</Text>
            
            <View style={styles.identificationContainer}>
              {slide.prompts.map((prompt, index) => (
                <View key={index} style={styles.promptCard}>
                  <Text style={styles.promptQuestion}>{prompt.question}</Text>
                  <View style={styles.examplesRow}>
                    {prompt.examples.map((example, exampleIndex) => {
                      const isSelected = identifiedParts.some(part => part.name === example);
                      return (
                        <TouchableOpacity
                          key={exampleIndex}
                          style={[
                            styles.exampleButton,
                            isSelected && styles.exampleButtonSelected
                          ]}
                          onPress={() => handlePartsIdentification(prompt.question, example)}
                          activeOpacity={0.6}
                        >
                          <Text style={[
                            styles.exampleButtonText,
                            isSelected && styles.exampleButtonTextSelected
                          ]}>
                            {example}
                          </Text>
                          {isSelected && (
                            <CheckCircle2 size={16} color={colors.success} strokeWidth={2} style={styles.checkIcon} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>

            {identifiedParts.length > 0 && (
              <View style={styles.identifiedPartsContainer}>
                <Text style={styles.identifiedTitle}>Your Identified Parts:</Text>
                <View style={styles.identifiedPartsGrid}>
                  {identifiedParts.map((part, index) => (
                    <View key={index} style={styles.identifiedPart}>
                      <Text style={styles.identifiedPartText}>{part.name}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemovePart(index)}
                        style={styles.removePartButton}
                      >
                        <X size={16} color="#1e40af" strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                <Text style={styles.tapToRemoveHint}>Tap the X to remove a selection</Text>
              </View>
            )}
          </View>
        );

      case 'practices':
        return (
          <View style={styles.slideContent}>
            <SlideEmoji slide={slide} style={styles.slideEmoji} imageStyle={styles.slideIconImage} />
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideText}>{slide.content}</Text>
            
            <View style={styles.practicesContainer}>
              {slide.practices.map((practice, index) => (
                <View key={index} style={styles.practiceCard}>
                  <Text style={styles.practiceName}>{practice.name}</Text>
                  <Text style={styles.practiceDescription}>{practice.description}</Text>
                  <View style={styles.exampleBox}>
                    <Text style={styles.exampleLabel}>Example:</Text>
                    <Text style={styles.exampleText}>{practice.example}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        );

      case 'guidance':
        return (
          <View style={styles.slideContent}>
            <SlideEmoji slide={slide} style={styles.slideEmoji} imageStyle={styles.slideIconImage} />
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideText}>{slide.content}</Text>
            
            <View style={styles.guidanceContainer}>
              {slide.guidance.map((item, index) => {
                const ItemIcon = item.Icon;
                return (
                  <View key={index} style={styles.guidanceCard}>
                    <View style={styles.guidanceIconWrap}>
                      <ItemIcon
                        size={24}
                        color={item.iconColor || colors.primary}
                        fill={item.iconFill || 'none'}
                        strokeWidth={2}
                      />
                    </View>
                    <View style={styles.guidanceContent}>
                      <Text style={styles.guidanceTitle}>{item.title}</Text>
                      <Text style={styles.guidanceDescription}>{item.description}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        );

      case 'completion':
        return (
          <View style={styles.slideContent}>
            <SlideEmoji slide={slide} style={styles.slideEmoji} imageStyle={styles.slideIconImage} />
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideText}>{slide.content}</Text>
            
            <View style={styles.completionBox}>
              <View style={styles.completionTitleRow}>
                <Target size={18} color={colors.primary} strokeWidth={2} />
                <Text style={styles.completionTitle}>Key Takeaways:</Text>
              </View>
              <Text style={styles.completionItem}>• You have different parts that protect and help you</Text>
              <Text style={styles.completionItem}>• All parts have positive intentions</Text>
              <Text style={styles.completionItem}>• Your Self can lead with curiosity and compassion</Text>
              <Text style={styles.completionItem}>• Parts work during sessions can bring healing</Text>
            </View>

            {identifiedParts.length > 0 && (
              <View style={styles.yourPartsBox}>
                <Text style={styles.yourPartsTitle}>Your Parts Family:</Text>
                {identifiedParts.map((part, index) => (
                  <Text key={index} style={styles.yourPartItem}>• {part.name}</Text>
                ))}
                <Text style={styles.yourPartsNote}>
                  Remember to approach these parts with curiosity and appreciation during your journey.
                </Text>
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#a855f7" />
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {currentSlide + 1} of {educationSlides.length}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentSlide + 1) / educationSlides.length) * 100}%` }
              ]} 
            />
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderSlide()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navButton, currentSlide === 0 && styles.disabledButton]}
          onPress={prevSlide}
          disabled={currentSlide === 0}
        >
          <ArrowLeft size={20} color={currentSlide === 0 ? colors.textLight : colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.navButtonText, currentSlide === 0 && styles.disabledText]}>
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={nextSlide}
        >
          <Text style={styles.nextButtonText}>
            {currentSlide === educationSlides.length - 1 ? 'Complete' : 'Next'}
          </Text>
          {currentSlide === educationSlides.length - 1 ? (
            <Check size={20} color="#ffffff" strokeWidth={2} />
          ) : (
            <ArrowRight size={20} color="#ffffff" strokeWidth={2} />
          )}
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
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  progressContainer: {
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  progressBar: {
    width: 100,
    height: 4,
    backgroundColor: colors.lightGray,
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
  slideContent: {
    padding: 24,
    alignItems: 'center',
  },
  slideEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  slideIconImage: {
    width: 160,
    height: 160,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  slideText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  characteristicsSection: {
    width: '100%',
    marginBottom: 24,
  },
  partsSection: {
    width: '100%',
    marginBottom: 24,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  characteristicItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  partItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    color: colors.textLight,
    marginRight: 8,
    marginTop: 2,
  },
  characteristicText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    flex: 1,
  },
  partText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    flex: 1,
  },
  intentBox: {
    backgroundColor: '#fef7ff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    width: '100%',
  },
  intentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  intentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7c2d12',
  },
  intentText: {
    fontSize: 14,
    color: '#7c2d12',
    lineHeight: 20,
  },
  examplesContainer: {
    width: '100%',
    gap: 16,
  },
  exampleCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  exampleScenario: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  examplePart: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  partLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 8,
    minWidth: 110,
  },
  partLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginRight: 0,
    minWidth: 0,
  },
  partExample: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    flex: 1,
  },
  identificationContainer: {
    width: '100%',
    gap: 20,
  },
  promptCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  promptQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  examplesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  exampleButtonSelected: {
    backgroundColor: '#d1fae5',
    borderColor: colors.success,
    borderWidth: 2,
  },
  exampleButtonText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  exampleButtonTextSelected: {
    color: '#065f46',
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 4,
  },
  identifiedPartsContainer: {
    width: '100%',
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  identifiedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 12,
  },
  identifiedPartsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  identifiedPart: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  identifiedPartText: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500',
    marginRight: 6,
  },
  removePartButton: {
    padding: 2,
  },
  tapToRemoveHint: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 12,
    fontStyle: 'italic',
  },
  practicesContainer: {
    width: '100%',
    gap: 16,
  },
  practiceCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  practiceName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  practiceDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  exampleBox: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#a855f7',
  },
  exampleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7c2d12',
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 14,
    color: colors.text,
    fontStyle: 'italic',
  },
  guidanceContainer: {
    width: '100%',
    gap: 12,
  },
  guidanceCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef7ff',
    padding: 16,
    borderRadius: 12,
  },
  guidanceIconWrap: {
    marginRight: 12,
    marginTop: 2,
  },
  guidanceContent: {
    flex: 1,
  },
  guidanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7c2d12',
    marginBottom: 4,
  },
  guidanceDescription: {
    fontSize: 14,
    color: '#7c2d12',
    lineHeight: 20,
  },
  completionBox: {
    backgroundColor: '#f0fdf4',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    marginTop: 16,
  },
  completionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  completionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065f46',
  },
  completionItem: {
    fontSize: 14,
    color: '#065f46',
    marginBottom: 6,
    lineHeight: 20,
  },
  yourPartsBox: {
    backgroundColor: '#fef7ff',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    marginTop: 16,
  },
  yourPartsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7c2d12',
    marginBottom: 12,
  },
  yourPartItem: {
    fontSize: 14,
    color: '#7c2d12',
    marginBottom: 4,
  },
  yourPartsNote: {
    fontSize: 12,
    color: '#a855f7',
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    backgroundColor: '#ffffff',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  disabledText: {
    color: colors.textLight,
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

export default IFSPartsEducationWidget;