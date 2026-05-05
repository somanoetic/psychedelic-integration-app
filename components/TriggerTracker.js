/**
 * Trigger Tracker
 *
 * Comprehensive logging screen for tracking triggers as they happen
 * Captures: cause, body response, emotional response, behavior, coping, and current state
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
import { icons } from '../lib/uiIcons';
import { colors } from '../theme/colors';

const TRIGGER_TYPES = [
  { id: 'sympathetic', label: 'Fight/Flight', icon: icons.steam, color: colors.error, description: 'Racing heart, anxiety, anger, panic' },
  { id: 'dorsal', label: 'Shutdown', icon: icons.iceberg, color: colors.textSecondary, description: 'Numbness, fatigue, disconnection, collapse' },
  { id: 'general', label: 'Other', icon: icons.uncertainState, color: colors.warning, description: 'Not sure which category' },
];

const INTENSITY_LEVELS = [
  { value: 1, label: 'Mild', color: '#86efac' },
  { value: 2, label: 'Moderate', color: '#fde047' },
  { value: 3, label: 'Strong', color: '#fb923c' },
  { value: 4, label: 'Intense', color: '#f87171' },
  { value: 5, label: 'Overwhelming', color: '#dc2626' },
];

const TriggerTracker = ({ navigation }) => {
  const [triggerType, setTriggerType] = useState(null);
  const [intensity, setIntensity] = useState(3);

  // Comprehensive trigger tracking
  const [cause, setCause] = useState(''); // What caused/triggered it
  const [bodyResponse, setBodyResponse] = useState(''); // Physical sensations
  const [emotionalResponse, setEmotionalResponse] = useState(''); // Emotions experienced
  const [behaviorResponse, setBehaviorResponse] = useState(''); // What did you do?
  const [copingUsed, setCopingUsed] = useState(''); // What helped?
  const [currentState, setCurrentState] = useState(''); // How do you feel now?

  const [saving, setSaving] = useState(false);
  const [recentTriggers, setRecentTriggers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState('cause'); // Track which section is expanded
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadRecentTriggers();
  }, []);

  const loadRecentTriggers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('trigger_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setRecentTriggers(data);
      }
    } catch (error) {
      console.error('Error loading triggers:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTrigger = async () => {
    if (!triggerType) {
      Alert.alert('Select Type', 'Please select a trigger type');
      return;
    }
    if (!cause.trim()) {
      Alert.alert('Add Cause', 'Please describe what triggered you');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to save triggers');
        return;
      }

      const { error } = await supabase
        .from('trigger_logs')
        .insert({
          user_id: user.id,
          trigger_type: triggerType,
          intensity,
          cause: cause.trim(),
          body_response: bodyResponse.trim() || null,
          emotional_response: emotionalResponse.trim() || null,
          behavior_response: behaviorResponse.trim() || null,
          coping_used: copingUsed.trim() || null,
          current_state: currentState.trim() || null,
        });

      if (error) throw error;

      Alert.alert(
        'Logged',
        'Your trigger has been recorded. Tracking patterns helps build awareness and identify what helps you regulate.',
        [{ text: 'OK', onPress: () => {
          // Reset form
          setTriggerType(null);
          setIntensity(3);
          setCause('');
          setBodyResponse('');
          setEmotionalResponse('');
          setBehaviorResponse('');
          setCopingUsed('');
          setCurrentState('');
          setExpandedSection('cause');
          loadRecentTriggers();
        }}]
      );
    } catch (error) {
      console.error('Error saving trigger:', error);
      Alert.alert('Error', 'Failed to save trigger. Please try again.');
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
          <MaterialIcons name={icon} size={20} color={hasValue ? colors.success : colors.textSecondary} />
          <Text style={[styles.sectionHeaderText, hasValue && styles.sectionHeaderTextComplete]}>
            {title} {isRequired && <Text style={styles.required}>*</Text>}
          </Text>
          {hasValue && <MaterialIcons name="check-circle" size={18} color={colors.success} />}
          <MaterialIcons
            name={isExpanded ? 'expand-less' : 'expand-more'}
            size={24}
            color={colors.textSecondary}
          />
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
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log a Trigger</Text>
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
              Something activated your nervous system? Let's capture the full picture - what caused it, how your body and emotions responded, and what helped. This builds powerful self-awareness.
            </Text>
          </View>
        </View>

        {/* SOS - immediate support if still activated */}
        <TouchableOpacity
          style={styles.sosBanner}
          onPress={() => navigation.navigate('TriggeredSupport')}
          activeOpacity={0.85}
        >
          <View style={styles.sosIconWrap}>
            <MaterialIcons name="sos" size={22} color="#fff" />
          </View>
          <View style={styles.sosTextWrap}>
            <Text style={styles.sosTitle}>Still activated? Get support now</Text>
            <Text style={styles.sosSubtitle}>Grounding exercises and crisis resources</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={colors.error} />
        </TouchableOpacity>

        {/* Trigger Type Selection */}
        <Text style={styles.sectionTitle}>What type of activation? <Text style={styles.required}>*</Text></Text>
        <View style={styles.typeContainer}>
          {TRIGGER_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeCard,
                triggerType === type.id && { borderColor: type.color, borderWidth: 2 }
              ]}
              onPress={() => setTriggerType(type.id)}
            >
              <View style={[styles.typeIcon, { backgroundColor: `${type.color}20` }]}>
                <Image source={type.icon} style={styles.typeIconImage} />
              </View>
              <Text style={styles.typeLabel}>{type.label}</Text>
              <Text style={styles.typeDescription}>{type.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Intensity Slider */}
        <Text style={styles.sectionTitle}>How intense? ({INTENSITY_LEVELS[intensity - 1].label})</Text>
        <View style={styles.intensityContainer}>
          {INTENSITY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.intensityButton,
                { backgroundColor: intensity >= level.value ? level.color : colors.lightGray }
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

        {/* Collapsible Detail Sections */}
        <Text style={styles.sectionTitle}>Tell me more about this trigger</Text>

        {renderCollapsibleSection(
          'cause',
          'What caused it?',
          'warning',
          cause,
          setCause,
          'A situation, thought, person, memory, sound, smell...',
          true
        )}

        {renderCollapsibleSection(
          'body',
          'Body response',
          'accessibility',
          bodyResponse,
          setBodyResponse,
          'Racing heart, tight chest, heaviness, numbness, shallow breathing...'
        )}

        {renderCollapsibleSection(
          'emotion',
          'Emotional response',
          'sentiment-very-dissatisfied',
          emotionalResponse,
          setEmotionalResponse,
          'Fear, anger, shame, sadness, overwhelm, panic...'
        )}

        {renderCollapsibleSection(
          'behavior',
          'What did you do?',
          'directions-run',
          behaviorResponse,
          setBehaviorResponse,
          'Froze, left the room, yelled, shut down, cried, isolated...'
        )}

        {renderCollapsibleSection(
          'coping',
          'What helped?',
          'healing',
          copingUsed,
          setCopingUsed,
          'Deep breathing, talking to someone, grounding, movement, time...'
        )}

        {renderCollapsibleSection(
          'current',
          'How do you feel now?',
          'mood',
          currentState,
          setCurrentState,
          'Still activated, calmer, exhausted, back to baseline...'
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, (!triggerType || !cause.trim()) && styles.saveButtonDisabled]}
          onPress={saveTrigger}
          disabled={!triggerType || !cause.trim() || saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="save" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Log Trigger</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Recent Triggers */}
        {recentTriggers.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Recent Triggers</Text>
            {recentTriggers.map((trigger) => {
              const type = TRIGGER_TYPES.find(t => t.id === trigger.trigger_type);
              return (
                <View key={trigger.id} style={styles.recentCard}>
                  <View style={styles.recentHeader}>
                    <MaterialIcons
                      name={type?.icon || 'help'}
                      size={20}
                      color={type?.color || colors.textSecondary}
                    />
                    <Text style={styles.recentType}>{type?.label || 'Unknown'}</Text>
                    <Text style={styles.recentTime}>{formatTime(trigger.created_at)}</Text>
                  </View>
                  {trigger.cause && (
                    <Text style={styles.recentDescription} numberOfLines={2}>
                      {trigger.cause}
                    </Text>
                  )}
                  <View style={styles.recentIntensity}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <View
                        key={i}
                        style={[
                          styles.intensityDot,
                          { backgroundColor: i <= trigger.intensity ? INTENSITY_LEVELS[trigger.intensity - 1].color : colors.lightGray }
                        ]}
                      />
                    ))}
                  </View>
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
            Want to explore your triggers more deeply? Try the Triggers & Glimmers discovery exercise
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
    backgroundColor: '#fef2f2',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
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
    color: colors.error,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  typeCard: {
    flex: 1,
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
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeIconImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 11,
    color: colors.textSecondary,
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
    color: colors.textSecondary,
  },
  intensityTextActive: {
    color: colors.text,
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
    backgroundColor: colors.error,
    padding: 16,
    borderRadius: 16,
    gap: 8,
    marginTop: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#fca5a5',
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
  recentIntensity: {
    flexDirection: 'row',
    gap: 4,
  },
  intensityDot: {
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
  sosBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 12,
  },
  sosIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosTextWrap: {
    flex: 1,
  },
  sosTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#991b1b',
  },
  sosSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  discoveryLinkText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default TriggerTracker;
