/**
 * Nervous System Check-in
 *
 * Quick logging screen for checking in with your current nervous system state
 * Separate from the full mapping exercise - this is for daily state tracking
 */

import React, { useState, useEffect, useRef } from 'react';
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
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Activity,
  Brain,
  MapPin,
  HeartPulse,
  Compass,
  HelpCircle,
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import polyvagalContextService from '../lib/polyvagalContextService';
import { icons } from '../lib/uiIcons';
import { colors } from '../theme/colors';
import { showThemedAlert } from './ThemedAlert';

const NS_STATES = [
  { id: 'ventral', label: 'Safe & Social', icon: icons.droplet, color: colors.success, description: 'Calm, connected, present, open' },
  { id: 'sympathetic', label: 'Fight / Flight', icon: icons.steam, color: colors.error, description: 'Activated, anxious, restless, on edge' },
  { id: 'dorsal', label: 'Shutdown', icon: icons.iceberg, color: colors.textSecondary, description: 'Numb, heavy, withdrawn, collapsed' },
  { id: 'mixed', label: 'Mixed / Blended', icon: icons.blended, color: colors.warning, description: 'Between states or shifting' },
];

const INTENSITY_LEVELS = [
  { value: 1, label: 'Subtle', color: '#bbf7d0' },
  { value: 2, label: 'Mild', color: '#86efac' },
  { value: 3, label: 'Moderate', color: '#fde047' },
  { value: 4, label: 'Strong', color: '#fb923c' },
  { value: 5, label: 'Intense', color: '#f87171' },
];

const SECTION_ICON_MAP = {
  accessibility: Activity,
  psychology: Brain,
  place: MapPin,
  healing: HeartPulse,
};

const NervousSystemCheckin = ({ navigation, route }) => {
  const returnTo = route?.params?.returnTo;
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

  // Each collapsible's TextInput is only mounted while that section is expanded,
  // so iOS never sees an existing input take focus and never scrolls it into
  // view. We track each section's y-offset in the scroll content and scroll it
  // up ourselves when it opens or its input takes focus.
  const scrollRef = useRef(null);
  const sectionOffsets = useRef({});

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

      // Feed check-in data into long-term polyvagal patterns (fire-and-forget)
      polyvagalContextService.updatePatternsFromCheckin(user.id, {
        state: nsState,
        bodyFeeling: bodyFeeling.trim(),
        thoughts: thoughts.trim(),
        context: context.trim(),
      }).catch(err => console.warn('Pattern update failed:', err));

      showThemedAlert(
        'Checked In',
        'Your nervous system state has been logged. Tracking your states builds self-awareness and helps you notice patterns over time.',
        [{ text: 'Done', onPress: () => {
          if (returnTo) {
            navigation.goBack();
            return;
          }
          // Reset form, then return home
          setNsState(null);
          setIntensity(3);
          setBodyFeeling('');
          setThoughts('');
          setContext('');
          setWhatMightHelp('');
          setExpandedSection('body');
          navigation.navigate('Home');
        }}],
        { variant: 'success' }
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

  // Bring a just-expanded (or just-focused) section near the top of the visible
  // area, so its TextInput sits well clear of the keyboard once it opens.
  const scrollSectionIntoView = (id) => {
    setTimeout(() => {
      const y = sectionOffsets.current[id];
      if (y == null || !scrollRef.current) return;
      scrollRef.current.scrollTo({ y: Math.max(0, y - 12), animated: true });
    }, 120);
  };

  const renderCollapsibleSection = (id, title, icon, value, setValue, placeholder) => {
    const isExpanded = expandedSection === id;
    const hasValue = value.trim().length > 0;
    const SectionIcon = SECTION_ICON_MAP[icon] || Activity;
    const ToggleIcon = isExpanded ? ChevronUp : ChevronDown;

    return (
      <View
        style={styles.collapsibleSection}
        onLayout={(e) => { sectionOffsets.current[id] = e.nativeEvent.layout.y; }}
      >
        <TouchableOpacity
          style={[styles.sectionHeader, hasValue && styles.sectionHeaderComplete]}
          onPress={() => {
            const next = isExpanded ? null : id;
            setExpandedSection(next);
            if (next) scrollSectionIntoView(next);
          }}
        >
          <SectionIcon size={20} color={hasValue ? colors.success : colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.sectionHeaderText, hasValue && styles.sectionHeaderTextComplete]}>
            {title}
          </Text>
          {hasValue && <CheckCircle2 size={18} color={colors.success} strokeWidth={2} />}
          <ToggleIcon size={24} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
        {isExpanded && (
          <TextInput
            style={styles.textInput}
            value={value}
            onChangeText={setValue}
            onFocus={() => scrollSectionIntoView(id)}
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
        <Text style={styles.headerTitle}>Nervous System Check-in</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 320 }]}
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
              <Image source={state.icon} style={styles.stateIconImage} />
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
              <CheckCircle2 size={20} color="#fff" strokeWidth={2} />
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
                    {state?.icon ? (
                      <Image source={state.icon} style={styles.recentIconImage} />
                    ) : (
                      <HelpCircle size={20} color={colors.textSecondary} strokeWidth={2} />
                    )}
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
                          { backgroundColor: i <= checkin.intensity ? INTENSITY_LEVELS[checkin.intensity - 1].color : colors.lightGray }
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
          <Compass size={20} color={colors.success} strokeWidth={2} />
          <Text style={styles.deepDiveLinkText}>
            Want to explore your nervous system more deeply? Try the full Nervous System Mapping
          </Text>
          <ChevronRight size={20} color={colors.success} strokeWidth={2} />
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
    color: colors.success,
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
    borderColor: colors.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  stateIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stateIconImage: {
    width: 96,
    height: 96,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  stateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  stateDescription: {
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
    backgroundColor: colors.success,
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
    borderColor: colors.lightGray,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  recentIconImage: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
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
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default NervousSystemCheckin;
