import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import masterContextService from '../lib/masterContextService';
import { colors } from '../theme/colors';

/**
 * Post-Session Integration Journal
 * Comprehensive multi-sensory tracking based on Ketamine Integration Guide
 * Tracks 10+ categories of experience for deep integration
 */
const PostSessionIntegrationJournal = ({ sessionId, onComplete, onSkip }) => {
  const [currentCategory, setCurrentCategory] = useState(0);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');

  // Comprehensive tracking categories from the PDF
  const categories = [
    {
      id: 'session_info',
      title: 'Session Information',
      emoji: '📋',
      color: '#3b82f6',
      description: 'Basic information about your session',
      fields: [
        {
          key: 'session_date',
          label: 'Session Date',
          type: 'text',
          placeholder: 'e.g., October 28, 2025'
        },
        {
          key: 'substance_dose',
          label: 'Substance & Dose (optional)',
          type: 'text',
          placeholder: 'e.g., Ketamine 100mg, or N/A'
        },
        {
          key: 'setting',
          label: 'Setting',
          type: 'textarea',
          placeholder: 'Where were you? Who was present? What was the environment like?'
        },
        {
          key: 'overall_quality',
          label: 'Overall Quality of Experience',
          type: 'textarea',
          placeholder: 'How would you describe the overall quality and tone?'
        }
      ]
    },
    {
      id: 'visuals',
      title: 'Visuals',
      emoji: '👁️',
      color: '#8b5cf6',
      description: 'Colors, shapes, landscapes, beings, symbols',
      prompts: [
        'What did you see?',
        'Were there colors? Which ones stood out?',
        'Did you see shapes, patterns, or geometric forms?',
        'Any landscapes or environments?',
        'Did beings appear? What were they like?',
        'Were there symbols or imagery with meaning?'
      ],
      field: {
        key: 'visuals',
        type: 'textarea',
        placeholder: 'Describe what you saw in as much detail as you remember...'
      }
    },
    {
      id: 'movements',
      title: 'Movements & Impulses',
      emoji: '💫',
      color: '#06b6d4',
      description: 'Spontaneous movements, urges, changes in posture',
      prompts: [
        'Did your body want to move in any particular way?',
        'Were there spontaneous movements or gestures?',
        'Did you feel pulled to change positions?',
        'Any rocking, swaying, or flowing movements?',
        'Impulses to reach, stretch, or curl up?',
        'Changes in how you held your body?'
      ],
      field: {
        key: 'movements',
        type: 'textarea',
        placeholder: 'Describe any movements, impulses, or physical changes...'
      }
    },
    {
      id: 'somatic',
      title: 'Somatic Sensations',
      emoji: '🫀',
      color: '#dc2626',
      description: 'Temperature, pressure, textures, pain, pleasure, energy',
      prompts: [
        'What did you feel in your body?',
        'Temperature changes (hot, cold, warm)?',
        'Pressure or heaviness anywhere?',
        'Textures or surface sensations?',
        'Pain or discomfort?',
        'Pleasure or release?',
        'Energy moving or stuck?',
        'Tingling, buzzing, or vibrations?'
      ],
      field: {
        key: 'somatic',
        type: 'textarea',
        placeholder: 'Describe physical sensations and body experiences...'
      }
    },
    {
      id: 'emotions',
      title: 'Emotions',
      emoji: '❤️',
      color: '#f59e0b',
      description: 'Primary emotions, complex feelings, waves and shifts',
      prompts: [
        'What emotions were present?',
        'Did emotions shift or wave through?',
        'Were feelings simple or complex/layered?',
        'Did old emotions resurface?',
        'Were there emotions without a story?',
        'How intense were the feelings (1-10)?'
      ],
      field: {
        key: 'emotions',
        type: 'textarea',
        placeholder: 'Describe the emotional landscape of your experience...'
      }
    },
    {
      id: 'relationships',
      title: 'Relationships & Connection',
      emoji: '🤝',
      color: '#ec4899',
      description: 'Who appeared, how you related, connection quality',
      prompts: [
        'Did anyone appear in your experience?',
        'Living people or deceased loved ones?',
        'How did you relate to them?',
        'Did relationships shift or heal?',
        'Feelings about connection in general?',
        'Sense of being held or supported?',
        'Parts of yourself appearing as people?'
      ],
      field: {
        key: 'relationships',
        type: 'textarea',
        placeholder: 'Describe relationships and connections that appeared...'
      }
    },
    {
      id: 'nature_elements',
      title: 'Nature Elements',
      emoji: '🌿',
      color: '#10b981',
      description: 'Water, earth, fire, air, plants, animals',
      prompts: [
        'Did nature elements appear?',
        'Water (ocean, rivers, rain)?',
        'Earth (soil, rocks, mountains)?',
        'Fire (flames, heat, light)?',
        'Air (wind, breath, sky)?',
        'Plants or trees?',
        'Animals or creatures?',
        'What was their quality or message?'
      ],
      field: {
        key: 'nature_elements',
        type: 'textarea',
        placeholder: 'Describe any nature elements that appeared...'
      }
    },
    {
      id: 'textures',
      title: 'Textures',
      emoji: '🧶',
      color: '#a855f7',
      description: 'Surface qualities, density, movement qualities',
      prompts: [
        'What textures did you encounter?',
        'Smooth, rough, soft, sharp?',
        'Dense or light?',
        'Flowing or sticky?',
        'Crystalline, liquid, or solid?'
      ],
      field: {
        key: 'textures',
        type: 'textarea',
        placeholder: 'Describe textures and surface qualities...'
      }
    },
    {
      id: 'colors',
      title: 'Colors & Their Meaning',
      emoji: '🎨',
      color: '#f472b6',
      description: 'Colors carry emotional and energetic information',
      prompts: [
        'What colors were prominent?',
        'What did each color feel like?',
        'Did colors have emotional qualities?',
        'Were there color shifts?',
        'What energy did the colors carry?'
      ],
      field: {
        key: 'colors',
        type: 'textarea',
        placeholder: 'Describe colors and their felt sense...'
      }
    },
    {
      id: 'shapes_patterns',
      title: 'Shapes & Patterns',
      emoji: '⬡',
      color: '#6366f1',
      description: 'Geometric forms, organic patterns, repeating motifs',
      prompts: [
        'What shapes appeared?',
        'Geometric (circles, triangles, spirals)?',
        'Organic (flowing, curved, natural)?',
        'Were patterns repeating?',
        'Did shapes morph or transform?',
        'What did the patterns mean to you?'
      ],
      field: {
        key: 'shapes_patterns',
        type: 'textarea',
        placeholder: 'Describe shapes and patterns...'
      }
    },
    {
      id: 'darkness_void',
      title: 'Darkness / Void / Nothing',
      emoji: '🌑',
      color: '#1f2937',
      description: 'Experiences of emptiness, void, or "nothing happening"',
      prompts: [
        'Did you experience darkness or void?',
        'What was the quality of emptiness?',
        'Did it feel peaceful or scary?',
        'Were you alone or held in the dark?',
        'Did anything emerge from the nothing?',
        'Was there "nothing to report" - that IS something!'
      ],
      field: {
        key: 'darkness_void',
        type: 'textarea',
        placeholder: 'Describe experiences of darkness, void, or apparent "nothingness"...'
      }
    },
    {
      id: 'realizations',
      title: 'Realizations & Insights',
      emoji: '💡',
      color: '#eab308',
      description: 'Aha moments, understanding, downloads, knowing',
      prompts: [
        'Did you have any realizations?',
        'What did you understand or know?',
        'Were there "downloads" of information?',
        'Did anything click or become clear?',
        'Insights about yourself, life, relationships?',
        'Messages or guidance received?'
      ],
      field: {
        key: 'realizations',
        type: 'textarea',
        placeholder: 'Describe insights, realizations, and understanding that emerged...'
      }
    },
    {
      id: 'integration',
      title: 'Integration Notes',
      emoji: '🌈',
      color: '#a855f7',
      description: 'How are you integrating? What needs attention?',
      prompts: [
        'What stands out most from this session?',
        'What wants to be integrated into daily life?',
        'What needs more attention or exploration?',
        'How has this changed you?',
        'What action steps feel right?',
        'What support do you need?'
      ],
      field: {
        key: 'integration',
        type: 'textarea',
        placeholder: 'Reflect on integration and next steps...'
      }
    }
  ];

  const saveJournalEntry = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const journalData = {
        user_id: user.id,
        session_id: sessionId,
        session_title: sessionTitle || `Session on ${responses.session_date || new Date().toLocaleDateString()}`,
        responses: responses,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('post_session_journals')
        .insert(journalData);

      if (error) throw error;

      // Clear master context cache so AI has fresh integration data
      masterContextService.clearCache(user.id);
      console.log('[Integration Journal] Cleared context cache - AI will now see this journal');

      Alert.alert(
        'Journal Saved',
        'Your integration journal has been saved successfully.',
        [{ text: 'OK', onPress: () => onComplete && onComplete(journalData) }]
      );
    } catch (error) {
      console.error('Error saving journal:', error);
      Alert.alert('Error', 'Could not save journal entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateResponse = (categoryId, fieldKey, value) => {
    setResponses(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [fieldKey]: value
      }
    }));
  };

  const renderCategoryContent = () => {
    const category = categories[currentCategory];

    if (category.id === 'session_info') {
      return (
        <View style={styles.categoryContent}>
          <Text style={styles.categoryEmoji}>{category.emoji}</Text>
          <Text style={[styles.categoryTitle, { color: category.color }]}>
            {category.title}
          </Text>
          <Text style={styles.categoryDescription}>{category.description}</Text>

          {category.fields.map((field, index) => (
            <View key={index} style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <TextInput
                style={[
                  styles.textInput,
                  field.type === 'textarea' && styles.textareaInput
                ]}
                value={responses[category.id]?.[field.key] || ''}
                onChangeText={(value) => updateResponse(category.id, field.key, value)}
                placeholder={field.placeholder}
                placeholderTextColor="#9ca3af"
                multiline={field.type === 'textarea'}
                numberOfLines={field.type === 'textarea' ? 4 : 1}
                textAlignVertical={field.type === 'textarea' ? 'top' : 'center'}
              />
            </View>
          ))}
        </View>
      );
    }

    // Standard category with prompts
    return (
      <View style={styles.categoryContent}>
        <Text style={styles.categoryEmoji}>{category.emoji}</Text>
        <Text style={[styles.categoryTitle, { color: category.color }]}>
          {category.title}
        </Text>
        <Text style={styles.categoryDescription}>{category.description}</Text>

        <View style={styles.promptsBox}>
          <Text style={styles.promptsTitle}>Consider these questions:</Text>
          {category.prompts.map((prompt, index) => (
            <Text key={index} style={styles.promptText}>• {prompt}</Text>
          ))}
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Your Experience</Text>
          <TextInput
            style={[styles.textInput, styles.textareaInput]}
            value={responses[category.id]?.[category.field.key] || ''}
            onChangeText={(value) => updateResponse(category.id, category.field.key, value)}
            placeholder={category.field.placeholder}
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.hintBox}>
          <MaterialIcons name="lightbulb-outline" size={16} color="#f59e0b" />
          <Text style={styles.hintText}>
            Even if nothing happened in this category, that's worth noting. Absence of experience is also data.
          </Text>
        </View>
      </View>
    );
  };

  const handleNext = () => {
    if (currentCategory < categories.length - 1) {
      setCurrentCategory(currentCategory + 1);
    } else {
      saveJournalEntry();
    }
  };

  const handlePrevious = () => {
    if (currentCategory > 0) {
      setCurrentCategory(currentCategory - 1);
    }
  };

  const progress = ((currentCategory + 1) / categories.length) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onSkip} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color="#6b7280" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Integration Journal</Text>
          <Text style={styles.headerSubtitle}>
            {currentCategory + 1} of {categories.length} categories
          </Text>
        </View>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderCategoryContent()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.backButton,
            currentCategory === 0 && styles.navButtonDisabled
          ]}
          onPress={handlePrevious}
          disabled={currentCategory === 0}
        >
          <MaterialIcons
            name="arrow-back"
            size={20}
            color={currentCategory === 0 ? '#9ca3af' : '#6b7280'}
          />
          <Text
            style={[
              styles.navButtonText,
              currentCategory === 0 && styles.navButtonTextDisabled
            ]}
          >
            Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={handleNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {currentCategory === categories.length - 1 ? 'Save Journal' : 'Next'}
              </Text>
              <MaterialIcons
                name={currentCategory === categories.length - 1 ? 'check' : 'arrow-forward'}
                size={20}
                color="#ffffff"
              />
            </>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primaryLight,
    transition: 'width 0.3s ease',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  categoryContent: {
    gap: 20,
  },
  categoryEmoji: {
    fontSize: 48,
    textAlign: 'center',
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  promptsBox: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primaryLight,
  },
  promptsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  promptText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  fieldContainer: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  textareaInput: {
    minHeight: 120,
    paddingTop: 12,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  backButton: {
    backgroundColor: '#f3f4f6',
  },
  nextButton: {
    backgroundColor: colors.primaryLight,
  },
  navButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  navButtonTextDisabled: {
    color: '#9ca3af',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default PostSessionIntegrationJournal;
