/**
 * Glimmer Tracker
 *
 * Quick logging screen for capturing glimmer moments - micro-moments of safety, joy, or regulation
 * Separate from the discovery exercise - this is for daily positive moment tracking
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  Sparkles,
  ChevronRight,
  Compass,
  Activity,
  MapPin,
  Heart,
  HelpCircle,
} from 'lucide-react-native';

const SECTION_ICON_MAP = {
  'auto-awesome': Sparkles,
  accessibility: Activity,
  place: MapPin,
  favorite: Heart,
};
import { supabase } from '../lib/supabase';
import { icons } from '../lib/uiIcons';
import { colors } from '../theme/colors';
import { showThemedAlert } from './ThemedAlert';

const GLIMMER_TYPES = [
  { id: 'sensory', label: 'Sensory', icon: icons.sensation, color: colors.primary, description: 'Sight, sound, smell, taste, touch' },
  { id: 'relational', label: 'Connection', icon: icons.community, color: '#ec4899', description: 'People, pets, memories' },
  { id: 'activity', label: 'Activity', icon: icons.movement, color: colors.success, description: 'Movement, hobbies, rituals' },
  { id: 'nature', label: 'Nature', icon: icons.nature, color: '#22c55e', description: 'Outdoors, weather, animals' },
  { id: 'general', label: 'Other', icon: icons.glimmerCaptured, color: colors.warning, description: 'Something else' },
];

const SHIFT_LEVELS = [
  { value: 1, label: 'Subtle', color: '#bfdbfe', description: 'Small shift' },
  { value: 2, label: 'Noticeable', color: '#93c5fd', description: 'Clear shift' },
  { value: 3, label: 'Significant', color: '#60a5fa', description: 'Big shift' },
  { value: 4, label: 'Powerful', color: colors.primary, description: 'Very strong' },
  { value: 5, label: 'Transformative', color: '#2563eb', description: 'Profound' },
];

const GlimmerTracker = ({ navigation }) => {
  const [glimmerType, setGlimmerType] = useState(null);
  const [feltShift, setFeltShift] = useState(3);

  // Glimmer details
  const [description, setDescription] = useState(''); // What was the glimmer
  const [bodySensation, setBodySensation] = useState(''); // How it felt in the body
  const [context, setContext] = useState(''); // Where/when it happened
  const [whatMadeItSpecial, setWhatMadeItSpecial] = useState(''); // Why it stood out

  const [saving, setSaving] = useState(false);
  const [recentGlimmers, setRecentGlimmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState('description');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadRecentGlimmers();
  }, []);

  const loadRecentGlimmers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('glimmer_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setRecentGlimmers(data);
      }
    } catch (error) {
      console.error('Error loading glimmers:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveGlimmer = async () => {
    if (!glimmerType) {
      Alert.alert('Select Type', 'Please select a glimmer type');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to save glimmers');
        return;
      }

      const { error } = await supabase
        .from('glimmer_logs')
        .insert({
          user_id: user.id,
          glimmer_type: glimmerType,
          description: description.trim() || null,
          body_sensation: bodySensation.trim() || null,
          context: context.trim() || null,
          what_made_it_special: whatMadeItSpecial.trim() || null,
          felt_shift: feltShift,
        });

      if (error) throw error;

      showThemedAlert(
        'Captured! ✨',
        'Your glimmer has been saved. Noticing these moments trains your nervous system to find more of them.',
        [{ text: 'Done', onPress: () => {
          // Reset form, then return home
          setGlimmerType(null);
          setFeltShift(3);
          setDescription('');
          setBodySensation('');
          setContext('');
          setWhatMadeItSpecial('');
          setExpandedSection('description');
          navigation.navigate('Home');
        }}],
        { variant: 'success' }
      );
    } catch (error) {
      console.error('Error saving glimmer:', error);
      Alert.alert('Error', 'Failed to save glimmer. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const renderCollapsibleSection = (id, title, icon, value, setValue, placeholder, isRequired = false) => {
    const isExpanded = expandedSection === id;
    const hasValue = value.trim().length > 0;

    return (
      <View style={styles.collapsibleSection}>
        <TouchableOpacity
          style={[styles.sectionHeader, hasValue && styles.sectionHeaderComplete]}
          onPress={() => setExpandedSection(isExpanded ? null : id)}
        >
          {(() => {
            const Icon = SECTION_ICON_MAP[icon] || HelpCircle;
            return <Icon size={20} color={hasValue ? colors.success : colors.textSecondary} strokeWidth={2} />;
          })()}
          <Text style={[styles.sectionHeaderText, hasValue && styles.sectionHeaderTextComplete]}>
            {title} {isRequired && <Text style={styles.required}>*</Text>}
          </Text>
          {hasValue && <CheckCircle2 size={18} color={colors.success} strokeWidth={2} />}
          {isExpanded ? (
            <ChevronUp size={24} color={colors.textSecondary} strokeWidth={2} />
          ) : (
            <ChevronDown size={24} color={colors.textSecondary} strokeWidth={2} />
          )}
        </TouchableOpacity>
        {isExpanded && (
          <TextInput
            style={styles.textInput}
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={colors.textLight}
            multiline
            maxLength={500}
            spellCheck={true}
            autoCorrect={true}
            autoCapitalize="sentences"
          />
        )}
        {!isExpanded && hasValue && (
          <Text style={styles.previewText} numberOfLines={1}>{value}</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Capture a Glimmer ✨</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Huxley intro */}
        <View style={styles.huxleySection}>
          <Image
            source={require('../assets/images/huxley-avatar.png')}
            style={styles.huxleyAvatar}
            resizeMode="contain"
          />
          <View style={styles.huxleyBubble}>
            <Text style={styles.huxleyText}>
              A glimmer is a micro-moment of safety, joy, or connection - however small. Capturing these trains your nervous system to notice more of them. What brought you a spark of goodness today?
            </Text>
          </View>
        </View>

        {/* Glimmer Type Selection */}
        <Text style={styles.sectionTitle}>What kind of glimmer? <Text style={styles.required}>*</Text></Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
          <View style={styles.typeContainer}>
            {GLIMMER_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  glimmerType === type.id && { borderColor: type.color, borderWidth: 2 }
                ]}
                onPress={() => setGlimmerType(type.id)}
              >
                <View style={[styles.typeIcon, { backgroundColor: `${type.color}20` }]}>
                  <Image source={type.icon} style={styles.typeIconImage} />
                </View>
                <Text style={styles.typeLabel}>{type.label}</Text>
                <Text style={styles.typeDescription}>{type.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Shift Level */}
        <Text style={styles.sectionTitle}>How much did it shift you? ({SHIFT_LEVELS[feltShift - 1].label})</Text>
        <View style={styles.shiftContainer}>
          {SHIFT_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.shiftButton,
                { backgroundColor: feltShift >= level.value ? level.color : colors.lightGray }
              ]}
              onPress={() => setFeltShift(level.value)}
            >
              <Text style={[
                styles.shiftText,
                feltShift >= level.value && styles.shiftTextActive
              ]}>
                {level.value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Detail Sections */}
        <Text style={styles.sectionTitle}>Tell me about this glimmer</Text>

        {renderCollapsibleSection(
          'description',
          'What was the glimmer?',
          'auto-awesome',
          description,
          setDescription,
          'The warmth of sunlight, my cat purring, a kind word from a stranger...'
        )}

        {renderCollapsibleSection(
          'body',
          'How did your body feel?',
          'accessibility',
          bodySensation,
          setBodySensation,
          'Warmth in chest, shoulders relaxed, deeper breath, softening...'
        )}

        {renderCollapsibleSection(
          'context',
          'Where/when did it happen?',
          'place',
          context,
          setContext,
          'Walking to work, in the morning, at the coffee shop...'
        )}

        {renderCollapsibleSection(
          'special',
          'What made it special?',
          'favorite',
          whatMadeItSpecial,
          setWhatMadeItSpecial,
          'It felt unexpected, it reminded me of safety, it broke a difficult moment...'
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, !glimmerType && styles.saveButtonDisabled]}
          onPress={saveGlimmer}
          disabled={!glimmerType || saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Sparkles size={20} color="#fff" strokeWidth={2} />
              <Text style={styles.saveButtonText}>Save Glimmer</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Recent Glimmers */}
        {recentGlimmers.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Recent Glimmers</Text>
            {recentGlimmers.map((glimmer) => {
              const type = GLIMMER_TYPES.find(t => t.id === glimmer.glimmer_type);
              return (
                <View key={glimmer.id} style={styles.recentCard}>
                  <View style={styles.recentHeader}>
                    {type?.icon ? (
                      <Image source={type.icon} style={{ width: 20, height: 20 }} />
                    ) : (
                      <Sparkles size={20} color={colors.warning} strokeWidth={2} />
                    )}
                    <Text style={styles.recentType}>{type?.label || 'Glimmer'}</Text>
                    <Text style={styles.recentTime}>{formatTime(glimmer.created_at)}</Text>
                  </View>
                  {glimmer.description && (
                    <Text style={styles.recentDescription} numberOfLines={2}>
                      {glimmer.description}
                    </Text>
                  )}
                  {glimmer.felt_shift && (
                    <View style={styles.recentShift}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <View
                          key={i}
                          style={[
                            styles.shiftDot,
                            { backgroundColor: i <= glimmer.felt_shift ? SHIFT_LEVELS[glimmer.felt_shift - 1].color : colors.lightGray }
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}

        {/* Link to Discovery Exercise */}
        <TouchableOpacity
          style={styles.discoveryLink}
          onPress={() => navigation.navigate('TriggersGlimmers')}
        >
          <Compass size={20} color="#8b5cf6" strokeWidth={2} />
          <Text style={styles.discoveryLinkText}>
            Want to explore your glimmers more deeply? Try the Triggers & Glimmers discovery exercise
          </Text>
          <ChevronRight size={20} color="#8b5cf6" strokeWidth={2} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#bae6fd',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  huxleySection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  huxleyAvatar: {
    width: 72,
    height: 72,
    marginRight: 12,
  },
  huxleyBubble: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  huxleyText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  required: {
    color: colors.primary,
  },
  typeScroll: {
    marginBottom: 20,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeCard: {
    width: 100,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  typeIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeIconImage: {
    width: 72,
    height: 72,
    resizeMode: 'contain',
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  typeDescription: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  shiftContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  shiftButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shiftText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  shiftTextActive: {
    color: '#1e3a8a',
  },
  collapsibleSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.lightGray,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  sectionHeaderComplete: {
    backgroundColor: '#f0fdf4',
  },
  sectionHeaderText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  sectionHeaderTextComplete: {
    color: '#166534',
  },
  textInput: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    fontSize: 15,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  previewText: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 16,
    gap: 8,
    marginTop: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  recentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  recentType: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  recentTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  recentDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  recentShift: {
    flexDirection: 'row',
    gap: 4,
  },
  shiftDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  discoveryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 10,
  },
  discoveryLinkText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default GlimmerTracker;
