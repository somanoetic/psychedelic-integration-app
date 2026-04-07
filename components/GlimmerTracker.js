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
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const GLIMMER_TYPES = [
  { id: 'sensory', label: 'Sensory', icon: 'visibility', color: '#3b82f6', description: 'Sight, sound, smell, taste, touch' },
  { id: 'relational', label: 'Connection', icon: 'people', color: '#ec4899', description: 'People, pets, memories' },
  { id: 'activity', label: 'Activity', icon: 'directions-run', color: '#10b981', description: 'Movement, hobbies, rituals' },
  { id: 'nature', label: 'Nature', icon: 'park', color: '#22c55e', description: 'Outdoors, weather, animals' },
  { id: 'general', label: 'Other', icon: 'auto-awesome', color: '#f59e0b', description: 'Something else' },
];

const SHIFT_LEVELS = [
  { value: 1, label: 'Subtle', color: '#bfdbfe', description: 'Small shift' },
  { value: 2, label: 'Noticeable', color: '#93c5fd', description: 'Clear shift' },
  { value: 3, label: 'Significant', color: '#60a5fa', description: 'Big shift' },
  { value: 4, label: 'Powerful', color: '#3b82f6', description: 'Very strong' },
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
    if (!description.trim()) {
      Alert.alert('Add Description', 'Please describe your glimmer moment');
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
          description: description.trim(),
          body_sensation: bodySensation.trim() || null,
          context: context.trim() || null,
          what_made_it_special: whatMadeItSpecial.trim() || null,
          felt_shift: feltShift,
        });

      if (error) throw error;

      Alert.alert(
        'Captured! ✨',
        'Your glimmer has been saved. Noticing these moments trains your nervous system to find more of them.',
        [{ text: 'OK', onPress: () => {
          // Reset form
          setGlimmerType(null);
          setFeltShift(3);
          setDescription('');
          setBodySensation('');
          setContext('');
          setWhatMadeItSpecial('');
          setExpandedSection('description');
          loadRecentGlimmers();
        }}]
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
          <MaterialIcons name={icon} size={20} color={hasValue ? '#10b981' : '#6b7280'} />
          <Text style={[styles.sectionHeaderText, hasValue && styles.sectionHeaderTextComplete]}>
            {title} {isRequired && <Text style={styles.required}>*</Text>}
          </Text>
          {hasValue && <MaterialIcons name="check-circle" size={18} color="#10b981" />}
          <MaterialIcons
            name={isExpanded ? 'expand-less' : 'expand-more'}
            size={24}
            color="#6b7280"
          />
        </TouchableOpacity>
        {isExpanded && (
          <TextInput
            style={styles.textInput}
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={500}
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
          <MaterialIcons name="arrow-back" size={24} color="#1f2937" />
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
                  <MaterialIcons name={type.icon} size={24} color={type.color} />
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
                { backgroundColor: feltShift >= level.value ? level.color : '#e5e7eb' }
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
          'The warmth of sunlight, my cat purring, a kind word from a stranger...',
          true
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
          style={[styles.saveButton, (!glimmerType || !description.trim()) && styles.saveButtonDisabled]}
          onPress={saveGlimmer}
          disabled={!glimmerType || !description.trim() || saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="auto-awesome" size={20} color="#fff" />
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
                    <MaterialIcons
                      name={type?.icon || 'auto-awesome'}
                      size={20}
                      color={type?.color || '#f59e0b'}
                    />
                    <Text style={styles.recentType}>{type?.label || 'Glimmer'}</Text>
                    <Text style={styles.recentTime}>{formatTime(glimmer.created_at)}</Text>
                  </View>
                  <Text style={styles.recentDescription} numberOfLines={2}>
                    {glimmer.description}
                  </Text>
                  {glimmer.felt_shift && (
                    <View style={styles.recentShift}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <View
                          key={i}
                          style={[
                            styles.shiftDot,
                            { backgroundColor: i <= glimmer.felt_shift ? SHIFT_LEVELS[glimmer.felt_shift - 1].color : '#e5e7eb' }
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
          <MaterialIcons name="explore" size={20} color="#8b5cf6" />
          <Text style={styles.discoveryLinkText}>
            Want to explore your glimmers more deeply? Try the Triggers & Glimmers discovery exercise
          </Text>
          <MaterialIcons name="chevron-right" size={20} color="#8b5cf6" />
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
    color: '#1f2937',
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
    width: 48,
    height: 48,
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
    color: '#374151',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    marginTop: 8,
  },
  required: {
    color: '#3b82f6',
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
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  typeDescription: {
    fontSize: 10,
    color: '#6b7280',
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
    color: '#6b7280',
  },
  shiftTextActive: {
    color: '#1e3a8a',
  },
  collapsibleSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
    color: '#374151',
  },
  sectionHeaderTextComplete: {
    color: '#166534',
  },
  textInput: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    fontSize: 15,
    color: '#1f2937',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  previewText: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
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
    borderColor: '#e5e7eb',
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
    color: '#1f2937',
  },
  recentTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  recentDescription: {
    fontSize: 14,
    color: '#6b7280',
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
    color: '#6b7280',
    lineHeight: 20,
  },
});

export default GlimmerTracker;
