/**
 * Craving / Urge Tracker
 *
 * A neutral, non-judgmental log of an urge or craving as it arises — substance,
 * behavior, food, digital, anything. Captures what was urged, peak intensity,
 * the context, and whether the user rode it out ("urge surfing").
 *
 * By design this tracker invites nervous-system and parts (IFS) exploration:
 * urges so often ride on a dysregulated state or a protector part. The NS-state
 * chips and the parts note connect each log into the app's polyvagal + IFS spine.
 *
 * Non-clinical wellness framing (ADR-009): "urge" language, never addiction/SUD
 * diagnosis. Nothing here labels the user.
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
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  Save,
  HelpCircle,
  Waves,
  Activity,
  MapPin,
  Heart,
  Wine,
  Repeat,
  Cookie,
  Smartphone,
  HelpCircle as HelpCircleAlt,
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { icons } from '../lib/uiIcons';
import { colors } from '../theme/colors';
import { showThemedAlert } from './ThemedAlert';

const SECTION_ICON_MAP = {
  accessibility: Activity,
  place: MapPin,
  parts: Heart,
  healing: Heart,
  mood: Activity,
};

const URGE_CATEGORIES = [
  { id: 'substance', label: 'Substance', Icon: Wine, color: colors.error, description: 'Alcohol, nicotine, etc.' },
  { id: 'behavior', label: 'Behavior', Icon: Repeat, color: colors.warning, description: 'A habit or compulsion' },
  { id: 'food', label: 'Food', Icon: Cookie, color: colors.golden, description: 'Eating, sugar, etc.' },
  { id: 'digital', label: 'Digital', Icon: Smartphone, color: colors.primary, description: 'Scrolling, screens' },
  { id: 'other', label: 'Other', Icon: HelpCircleAlt, color: colors.textSecondary, description: 'Something else' },
];

const INTENSITY_LEVELS = [
  { value: 1, label: 'Faint', color: '#86efac' },
  { value: 2, label: 'Mild', color: '#fde047' },
  { value: 3, label: 'Strong', color: '#fb923c' },
  { value: 4, label: 'Intense', color: '#f87171' },
  { value: 5, label: 'Overwhelming', color: '#dc2626' },
];

// NS states mirror nervous_system_checkins.ns_state. Optional — invites the
// user to connect the urge to their polyvagal state without forcing it.
const NS_STATES = [
  { id: 'ventral', label: 'Safe & Social', icon: icons.droplet },
  { id: 'sympathetic', label: 'Fight / Flight', icon: icons.steam },
  { id: 'dorsal', label: 'Shutdown', icon: icons.iceberg },
  { id: 'mixed', label: 'Mixed', icon: icons.blended },
];

const NS_STATE_LABELS = NS_STATES.reduce((acc, s) => {
  acc[s.id] = s.label;
  return acc;
}, {});

const CravingTracker = ({ navigation }) => {
  const [urgeFor, setUrgeFor] = useState('');
  const [urgeCategory, setUrgeCategory] = useState(null);
  const [intensity, setIntensity] = useState(3);
  const [nsState, setNsState] = useState(null);
  const [rodeTheWave, setRodeTheWave] = useState(null); // true | false | null

  const [triggerContext, setTriggerContext] = useState('');
  const [bodySensation, setBodySensation] = useState('');
  const [partNote, setPartNote] = useState('');
  const [whatHelped, setWhatHelped] = useState('');
  const [outcome, setOutcome] = useState('');

  const [saving, setSaving] = useState(false);
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState('context');
  const insets = useSafeAreaInsets();

  // Each collapsible's TextInput is only mounted while that section is expanded,
  // so iOS never sees an existing input take focus and never scrolls it into
  // view. We track each section's y-offset in the scroll content and scroll it
  // up ourselves when it opens.
  const scrollRef = useRef(null);
  const sectionOffsets = useRef({});

  useEffect(() => {
    loadRecentEntries();
  }, []);

  const loadRecentEntries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('craving_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setRecentEntries(data);
      }
    } catch (error) {
      console.error('Error loading craving logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveEntry = async () => {
    if (!urgeFor.trim()) {
      Alert.alert('Name the urge', 'Please describe what the urge was toward.');
      return;
    }
    if (!urgeCategory) {
      Alert.alert('Pick a category', 'Choose the kind of urge this was.');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to save.');
        return;
      }

      const { error } = await supabase
        .from('craving_logs')
        .insert({
          user_id: user.id,
          urge_for: urgeFor.trim(),
          urge_category: urgeCategory,
          intensity,
          ns_state: nsState,
          rode_the_wave: rodeTheWave,
          trigger_context: triggerContext.trim() || null,
          body_sensation: bodySensation.trim() || null,
          part_note: partNote.trim() || null,
          what_helped: whatHelped.trim() || null,
          outcome: outcome.trim() || null,
        });

      if (error) throw error;

      showThemedAlert(
        'Logged',
        'Urges rise and fall like waves — noticing one without acting on it builds real capacity. Tracking what state or part it rode in on is where the pattern becomes workable.',
        [{ text: 'Done', onPress: () => {
          setUrgeFor('');
          setUrgeCategory(null);
          setIntensity(3);
          setNsState(null);
          setRodeTheWave(null);
          setTriggerContext('');
          setBodySensation('');
          setPartNote('');
          setWhatHelped('');
          setOutcome('');
          setExpandedSection('context');
          navigation.navigate('Home');
        }}],
        { variant: 'success' }
      );
    } catch (error) {
      console.error('Error saving craving log:', error);
      Alert.alert('Error', 'Failed to save. Please try again.');
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

  // Bring a just-expanded section near the top of the visible area, so its
  // TextInput sits well clear of the keyboard once it opens. Runs after the
  // input has mounted; the section header ends just below the screen header.
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
          {(() => {
            const Icon = SECTION_ICON_MAP[icon] || HelpCircle;
            return <Icon size={20} color={hasValue ? colors.success : colors.textSecondary} strokeWidth={2} />;
          })()}
          <Text style={[styles.sectionHeaderText, hasValue && styles.sectionHeaderTextComplete]}>
            {title}
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
        <Text style={styles.headerTitle}>Log an Urge</Text>
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
              Noticing an urge — without judgment — is itself the practice. Let's capture what it's for, how strong it is, and what state or part it might be riding on. You don't have to have acted on it (or not) to log it.
            </Text>
          </View>
        </View>

        {/* What the urge is for */}
        <Text style={styles.sectionTitle}>What's the urge for? <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.primaryInput}
          value={urgeFor}
          onChangeText={setUrgeFor}
          placeholder="A drink, a cigarette, scrolling, sugar, checking..."
          placeholderTextColor={colors.textLight}
          maxLength={200}
          spellCheck={true}
          autoCorrect={true}
          autoCapitalize="sentences"
        />

        {/* Category */}
        <Text style={styles.sectionTitle}>What kind? <Text style={styles.required}>*</Text></Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
          <View style={styles.typeContainer}>
            {URGE_CATEGORIES.map((cat) => {
              const selected = urgeCategory === cat.id;
              const Icon = cat.Icon;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.typeCard, selected && { borderColor: cat.color, borderWidth: 2 }]}
                  onPress={() => setUrgeCategory(cat.id)}
                >
                  <View style={[styles.typeIcon, { backgroundColor: `${cat.color}20` }]}>
                    <Icon size={28} color={cat.color} strokeWidth={2} />
                  </View>
                  <Text style={styles.typeLabel}>{cat.label}</Text>
                  <Text style={styles.typeDescription}>{cat.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Intensity */}
        <Text style={styles.sectionTitle}>How strong at its peak? ({INTENSITY_LEVELS[intensity - 1].label})</Text>
        <View style={styles.intensityContainer}>
          {INTENSITY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.intensityButton,
                { backgroundColor: intensity >= level.value ? level.color : colors.lightGray },
              ]}
              onPress={() => setIntensity(level.value)}
            >
              <Text style={[styles.intensityText, intensity >= level.value && styles.intensityTextActive]}>
                {level.value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Urge surfing */}
        <Text style={styles.sectionTitle}>Did you ride the wave?</Text>
        <Text style={styles.helperText}>No pressure either way — just noticing.</Text>
        <View style={styles.waveRow}>
          <TouchableOpacity
            style={[styles.waveButton, rodeTheWave === true && styles.waveButtonYes]}
            onPress={() => setRodeTheWave(rodeTheWave === true ? null : true)}
          >
            <Waves size={18} color={rodeTheWave === true ? '#fff' : colors.primary} strokeWidth={2} />
            <Text style={[styles.waveButtonText, rodeTheWave === true && styles.waveButtonTextActive]}>
              Rode it out
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.waveButton, rodeTheWave === false && styles.waveButtonNo]}
            onPress={() => setRodeTheWave(rodeTheWave === false ? null : false)}
          >
            <Text style={[styles.waveButtonText, rodeTheWave === false && styles.waveButtonTextActive]}>
              Acted on it
            </Text>
          </TouchableOpacity>
        </View>

        {/* NS state (optional) */}
        <Text style={styles.sectionTitle}>What state were you in? (optional)</Text>
        <Text style={styles.helperText}>Urges often ride on a nervous-system state.</Text>
        <View style={styles.nsRow}>
          {NS_STATES.map((s) => {
            const selected = nsState === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.nsChip, selected && styles.nsChipSelected]}
                onPress={() => setNsState(selected ? null : s.id)}
              >
                <Image source={s.icon} style={styles.nsIcon} />
                <Text style={[styles.nsLabel, selected && styles.nsLabelSelected]} numberOfLines={1}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Detail sections */}
        <Text style={styles.sectionTitle}>Tell me more (optional)</Text>

        {renderCollapsibleSection(
          'context',
          'What set it off?',
          'place',
          triggerContext,
          setTriggerContext,
          'A situation, feeling, time of day, person, place...'
        )}

        {renderCollapsibleSection(
          'body',
          'Body sensations',
          'accessibility',
          bodySensation,
          setBodySensation,
          'Restlessness, tightness, emptiness, buzzing, heat...'
        )}

        {renderCollapsibleSection(
          'part',
          'Which part of you wanted it?',
          'parts',
          partNote,
          setPartNote,
          'In IFS terms — a protector soothing something? An exile reaching for relief? What might it be trying to do for you?'
        )}

        {renderCollapsibleSection(
          'helped',
          'What helped?',
          'healing',
          whatHelped,
          setWhatHelped,
          'Breathing, waiting it out, calling someone, moving, distraction...'
        )}

        {renderCollapsibleSection(
          'outcome',
          'How do you feel now?',
          'mood',
          outcome,
          setOutcome,
          'Relieved, proud, depleted, neutral, back to baseline...'
        )}

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveButton, (!urgeFor.trim() || !urgeCategory) && styles.saveButtonDisabled]}
          onPress={saveEntry}
          disabled={!urgeFor.trim() || !urgeCategory || saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Save size={20} color="#fff" strokeWidth={2} />
              <Text style={styles.saveButtonText}>Log Urge</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Recent entries */}
        {recentEntries.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Recent Urges</Text>
            {recentEntries.map((entry) => {
              const cat = URGE_CATEGORIES.find((c) => c.id === entry.urge_category);
              const CatIcon = cat?.Icon || HelpCircle;
              return (
                <View key={entry.id} style={styles.recentCard}>
                  <View style={styles.recentHeader}>
                    <CatIcon size={18} color={cat?.color || colors.textSecondary} strokeWidth={2} />
                    <Text style={styles.recentType} numberOfLines={1}>{entry.urge_for}</Text>
                    <Text style={styles.recentTime}>{formatTime(entry.created_at)}</Text>
                  </View>
                  <View style={styles.recentMetaRow}>
                    <View style={styles.recentIntensity}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <View
                          key={i}
                          style={[
                            styles.intensityDot,
                            { backgroundColor: i <= entry.intensity ? INTENSITY_LEVELS[entry.intensity - 1].color : colors.lightGray },
                          ]}
                        />
                      ))}
                    </View>
                    {entry.ns_state && (
                      <Text style={styles.recentTag}>{NS_STATE_LABELS[entry.ns_state] || entry.ns_state}</Text>
                    )}
                    {entry.rode_the_wave === true && (
                      <View style={styles.recentWaveBadge}>
                        <Waves size={11} color={colors.success} strokeWidth={2} />
                        <Text style={styles.recentWaveText}>Rode it out</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f1fb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd6f3',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  content: { flex: 1 },
  contentContainer: { padding: 20 },
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
  helperText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: -6,
    marginBottom: 12,
  },
  required: {
    color: colors.error,
  },
  primaryInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    marginBottom: 20,
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
  },
  typeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
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
  waveRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  waveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  waveButtonYes: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  waveButtonNo: {
    backgroundColor: colors.slate,
    borderColor: colors.slate,
  },
  waveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  waveButtonTextActive: {
    color: '#fff',
  },
  nsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  nsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  nsChipSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: '#f5f8fe',
  },
  nsIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  nsLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  nsLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
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
    backgroundColor: '#a9c0ec',
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
    marginBottom: 8,
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
  recentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
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
  recentTag: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    backgroundColor: colors.offWhite,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  recentWaveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  recentWaveText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
  },
});

export default CravingTracker;
