/**
 * Nervous System Check-in
 *
 * Quick logging screen for checking in with your current nervous system state
 * Separate from the full mapping exercise - this is for daily state tracking
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

const NS_STATES = [
  { id: 'ventral', label: 'Safe & Social', icon: 'favorite', color: '#10b981', description: 'Calm, connected, present, open' },
  { id: 'sympathetic', label: 'Fight / Flight', icon: 'flash-on', color: '#ef4444', description: 'Activated, anxious, restless, on edge' },
  { id: 'dorsal', label: 'Shutdown', icon: 'remove-circle', color: '#6b7280', description: 'Numb, heavy, withdrawn, collapsed' },
  { id: 'mixed', label: 'Mixed / Blended', icon: 'swap-vert', color: '#f59e0b', description: 'Between states or shifting' },
];

const INTENSITY_LEVELS = [
  { value: 1, label: 'Subtle', color: '#bbf7d0' },
  { value: 2, label: 'Mild', color: '#86efac' },
  { value: 3, label: 'Moderate', color: '#fde047' },
  { value: 4, label: 'Strong', color: '#fb923c' },
  { value: 5, label: 'Intense', color: '#f87171' },
];

const NervousSystemCheckin = ({ navigation }) => {
  const [nsState, setNsState] = useState(null);
  const [intensity, setIntensity] = useState(3);

  const [bodyFeeling, setBodyFeeling] = useState('');
  const [thoughts, setThoughts] = useState('');
  const [context, setContext] = useState('');
  const [whatMightHelp, setWhatMightHelp] = useState('');

  const [saving, setSaving] = useState(false);
  const [recentCheckins, setRecentCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState('body');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadRecentCheckins();
  }, []);

  const loadRecentCheckins = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('nervous_system_checkins')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setRecentCheckins(data);
      }
    } catch (error) {
      console.error('Error loading NS check-ins:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCheckin = async () => {
    if (!nsState) {
      Alert.alert('Select State', 'Please select your current nervous system state');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to save check-ins');
        return;
      }

      const { error } = await supabase
        .from('nervous_system_checkins')
        .insert({
          user_id: user.id,
          ns_state: nsState,
          intensity,
          body_feeling: bodyFeeling.trim() || null,
          thoughts: thoughts.trim() || null,
          context: context.trim() || null,
          what_might_help: whatMightHelp.trim() || null,
        });

      if (error) throw error;

      Alert.alert(
        'Checked In',
        'Your nervous system state has been logged. Tracking your states builds self-awareness and helps you notice patterns over time.',
        [{ text: 'OK', onPress: () => {
          setNsState(null);
          setIntensity(3);
          setBodyFeeling('');
          setThoughts('');
          setContext('');
          setWhatMightHelp('');
          setExpandedSection('body');
          loadRecentCheckins();
        }}]
      );
    } catch (error) {
      console.error('Error saving NS check-in:', error);
      Alert.alert('Error', 'Failed to save check-in. Please try again.');
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

  const renderCollapsibleSection = (id, title, icon, value, setValue, placeholder) => {
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
            {title}
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
        <Text style={styles.headerTitle}>Nervous System Check-in</Text>
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
            source={require('../assets/images/huxley therapist.png')}
            style={styles.huxleyAvatar}
            resizeMode="contain"
          />
          <View style={styles.huxleyBubble}>
            <Text style={styles.huxleyText}>
              Take a moment to notice where your nervous system is right now. There's no right or wrong state - just awareness. This builds your capacity to recognize and respond to what your body needs.
            </Text>
          </View>
        </View>

        {/* State Selection */}
        <Text style={styles.sectionTitle}>Where are you right now? <Text style={styles.required}>*</Text></Text>
        <View style={styles.stateContainer}>
          {NS_STATES.map((state) => (
            <TouchableOpacity
              key={state.id}
              style={[
                styles.stateCard,
                nsState === state.id && { borderColor: state.color, borderWidth: 2 }
              ]}
              onPress={() => setNsState(state.id)}
            >
              <View style={[styles.stateIcon, { backgroundColor: `${state.color}20` }]}>
                <MaterialIcons name={state.icon} size={28} color={state.color} />
              </View>
              <Text style={styles.stateLabel}>{state.label}</Text>
              <Text style={styles.stateDescription}>{state.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Intensity */}
        <Text style={styles.sectionTitle}>How strongly do you feel it? ({INTENSITY_LEVELS[intensity - 1].label})</Text>
        <View style={styles.intensityContainer}>
          {INTENSITY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.intensityButton,
                { backgroundColor: intensity >= level.value ? level.color : '#e5e7eb' }
              ]}
              onPress={() => setIntensity(level.value)}
            >
              <Text style={[
                styles.intensityText,
                intensity >= level.value && styles.intensityTextActive
              ]}>
                {level.value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Detail Sections */}
        <Text style={styles.sectionTitle}>What are you noticing?</Text>

        {renderCollapsibleSection(
          'body',
          'What does your body feel like?',
          'accessibility',
          bodyFeeling,
          setBodyFeeling,
          'Tight shoulders, racing heart, heavy limbs, relaxed jaw, warm chest...'
        )}

        {renderCollapsibleSection(
          'thoughts',
          'What thoughts are present?',
          'psychology',
          thoughts,
          setThoughts,
          'Racing thoughts, fog, calm clarity, worry loops, present and open...'
        )}

        {renderCollapsibleSection(
          'context',
          'What\'s happening right now?',
          'place',
          context,
          setContext,
          'After a conversation, morning routine, stressed about work, feeling good...'
        )}

        {renderCollapsibleSection(
          'help',
          'What might help right now?',
          'healing',
          whatMightHelp,
          setWhatMightHelp,
          'Deep breaths, a walk, connection with someone, rest, grounding...'
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, !nsState && styles.saveButtonDisabled]}
          onPress={saveCheckin}
          disabled={!nsState || saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="check-circle" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save Check-in</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Recent Check-ins */}
        {recentCheckins.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Recent Check-ins</Text>
            {recentCheckins.map((checkin) => {
              const state = NS_STATES.find(s => s.id === checkin.ns_state);
              return (
                <View key={checkin.id} style={styles.recentCard}>
                  <View style={styles.recentHeader}>
                    <MaterialIcons
                      name={state?.icon || 'help'}
                      size={20}
                      color={state?.color || '#6b7280'}
                    />
                    <Text style={styles.recentType}>{state?.label || 'Unknown'}</Text>
                    <Text style={styles.recentTime}>{formatTime(checkin.created_at)}</Text>
                  </View>
                  {checkin.body_feeling && (
                    <Text style={styles.recentDescription} numberOfLines={2}>
                      {checkin.body_feeling}
                    </Text>
                  )}
                  <View style={styles.recentIntensity}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <View
                        key={i}
                        style={[
                          styles.intensityDot,
                          { backgroundColor: i <= checkin.intensity ? INTENSITY_LEVELS[checkin.intensity - 1].color : '#e5e7eb' }
                        ]}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* Link to Full Mapping */}
        <TouchableOpacity
          style={styles.deepDiveLink}
          onPress={() => navigation.navigate('NervousSystemMapping')}
        >
          <MaterialIcons name="explore" size={20} color="#10b981" />
          <Text style={styles.deepDiveLinkText}>
            Want to explore your nervous system more deeply? Try the full Nervous System Mapping
          </Text>
          <MaterialIcons name="chevron-right" size={20} color="#10b981" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ecfdf5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#a7f3d0',
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
    color: '#10b981',
  },
  stateContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  stateCard: {
    width: '47%',
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
  stateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  stateDescription: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  intensityContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  intensityButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  intensityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  intensityTextActive: {
    color: '#1f2937',
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
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 16,
    gap: 8,
    marginTop: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#6ee7b7',
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
  recentIntensity: {
    flexDirection: 'row',
    gap: 4,
  },
  intensityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deepDiveLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 10,
  },
  deepDiveLinkText: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});

export default NervousSystemCheckin;
