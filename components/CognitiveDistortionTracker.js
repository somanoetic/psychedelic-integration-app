/**
 * Cognitive Distortion Tracker
 *
 * A CBT-style thought record. The user captures an upsetting/automatic thought,
 * identifies which cognitive distortion(s) it reflects (Burns' classic 10 + an
 * "other"), weighs the evidence, and writes a more balanced reframe — rating
 * belief strength in the original thought before and after, so the restructuring
 * shift is visible.
 *
 * Non-clinical wellness framing (ADR-009): a self-reflection tool, not a
 * diagnosis. Distortion labels are the user's own noticing.
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
  Save,
  HelpCircle,
  MapPin,
  Cloud,
  Scale,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';
import { showThemedAlert } from './ThemedAlert';

const SECTION_ICON_MAP = {
  place: MapPin,
  cloud: Cloud,
  scale: Scale,
  reframe: ShieldCheck,
};

// Burns' classic 10 cognitive distortions + an "other / not sure" fallback,
// mirroring the 'general'/'Other' escape hatch the other trackers offer.
const DISTORTIONS = [
  { id: 'all_or_nothing', label: 'All-or-nothing', description: 'Black-and-white thinking; no middle ground.' },
  { id: 'overgeneralization', label: 'Overgeneralization', description: 'One event becomes a never-ending pattern ("always", "never").' },
  { id: 'mental_filter', label: 'Mental filter', description: 'Dwelling on a single negative; filtering out the rest.' },
  { id: 'discounting_positives', label: 'Discounting positives', description: 'The good "doesn’t count".' },
  { id: 'jumping_to_conclusions', label: 'Jumping to conclusions', description: 'Mind-reading or fortune-telling without evidence.' },
  { id: 'magnification', label: 'Magnification', description: 'Blowing things up (catastrophizing) or shrinking them.' },
  { id: 'emotional_reasoning', label: 'Emotional reasoning', description: '"I feel it, so it must be true."' },
  { id: 'should_statements', label: 'Should statements', description: '"Should", "must", "ought" — pressure and guilt.' },
  { id: 'labeling', label: 'Labeling', description: 'A global label for yourself or others ("I’m a failure").' },
  { id: 'personalization', label: 'Personalization', description: 'Taking blame for things outside your control.' },
  { id: 'other', label: 'Other / not sure', description: 'Something else, or hard to name.' },
];

// Belief-strength steps for the 0–100% sliders (compact 5-point scale).
const BELIEF_STEPS = [
  { value: 0, label: '0%' },
  { value: 25, label: '25%' },
  { value: 50, label: '50%' },
  { value: 75, label: '75%' },
  { value: 100, label: '100%' },
];

const DISTORTION_LABELS = DISTORTIONS.reduce((acc, d) => {
  acc[d.id] = d.label;
  return acc;
}, {});

const CognitiveDistortionTracker = ({ navigation }) => {
  const [situation, setSituation] = useState('');
  const [automaticThought, setAutomaticThought] = useState('');
  const [selectedDistortions, setSelectedDistortions] = useState([]);
  const [distortionOther, setDistortionOther] = useState('');
  const [evidenceFor, setEvidenceFor] = useState('');
  const [evidenceAgainst, setEvidenceAgainst] = useState('');
  const [balancedThought, setBalancedThought] = useState('');
  const [emotion, setEmotion] = useState('');
  const [beliefBefore, setBeliefBefore] = useState(75);
  const [beliefAfter, setBeliefAfter] = useState(50);

  const [saving, setSaving] = useState(false);
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState('situation');
  const insets = useSafeAreaInsets();

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
        .from('cognitive_distortions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setRecentEntries(data);
      }
    } catch (error) {
      console.error('Error loading cognitive distortions:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDistortion = (id) => {
    setSelectedDistortions((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const saveEntry = async () => {
    if (!automaticThought.trim()) {
      Alert.alert('Add the thought', 'Please write down the thought you noticed.');
      return;
    }
    if (selectedDistortions.length === 0) {
      Alert.alert('Pick a distortion', 'Select at least one distortion this thought reflects (or "Other / not sure").');
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
        .from('cognitive_distortions')
        .insert({
          user_id: user.id,
          situation: situation.trim() || null,
          automatic_thought: automaticThought.trim(),
          distortion_types: selectedDistortions,
          distortion_other:
            selectedDistortions.includes('other') ? distortionOther.trim() || null : null,
          evidence_for: evidenceFor.trim() || null,
          evidence_against: evidenceAgainst.trim() || null,
          balanced_thought: balancedThought.trim() || null,
          belief_before: beliefBefore,
          belief_after: beliefAfter,
          emotion: emotion.trim() || null,
        });

      if (error) throw error;

      showThemedAlert(
        'Saved',
        'Naming the distortion and weighing the evidence is how thoughts loosen their grip. Noticing the pattern over time is where the real shift happens.',
        [{ text: 'Done', onPress: () => {
          setSituation('');
          setAutomaticThought('');
          setSelectedDistortions([]);
          setDistortionOther('');
          setEvidenceFor('');
          setEvidenceAgainst('');
          setBalancedThought('');
          setEmotion('');
          setBeliefBefore(75);
          setBeliefAfter(50);
          setExpandedSection('situation');
          navigation.navigate('Home');
        }}],
        { variant: 'success' }
      );
    } catch (error) {
      console.error('Error saving cognitive distortion:', error);
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
            maxLength={1000}
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

  const renderBeliefScale = (value, setValue) => (
    <View style={styles.beliefContainer}>
      {BELIEF_STEPS.map((step) => (
        <TouchableOpacity
          key={step.value}
          style={[
            styles.beliefButton,
            value === step.value && styles.beliefButtonActive,
          ]}
          onPress={() => setValue(step.value)}
        >
          <Text style={[styles.beliefText, value === step.value && styles.beliefTextActive]}>
            {step.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thought Record</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
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
              A sticky, painful thought? Let's slow it down. We'll name the distortion it might be carrying, weigh the evidence on both sides, and find a more balanced way to hold it.
            </Text>
          </View>
        </View>

        {/* Situation */}
        {renderCollapsibleSection(
          'situation',
          'What was happening?',
          'place',
          situation,
          setSituation,
          'The situation, trigger, or moment that set off the thought...'
        )}

        {/* Automatic thought */}
        {renderCollapsibleSection(
          'thought',
          'The thought',
          'cloud',
          automaticThought,
          setAutomaticThought,
          'The automatic, upsetting thought — in your own words...',
          true
        )}

        {/* Belief before */}
        <Text style={styles.sectionTitle}>How strongly do you believe it? (now)</Text>
        {renderBeliefScale(beliefBefore, setBeliefBefore)}

        {/* Distortion multi-select */}
        <Text style={styles.sectionTitle}>
          Which distortion(s) does it reflect? <Text style={styles.required}>*</Text>
        </Text>
        <Text style={styles.helperText}>Pick all that fit — thoughts often carry more than one.</Text>
        <View style={styles.distortionList}>
          {DISTORTIONS.map((d) => {
            const selected = selectedDistortions.includes(d.id);
            return (
              <TouchableOpacity
                key={d.id}
                style={[styles.distortionChip, selected && styles.distortionChipSelected]}
                onPress={() => toggleDistortion(d.id)}
                activeOpacity={0.85}
              >
                <View style={styles.distortionChipHeader}>
                  {selected ? (
                    <CheckCircle2 size={18} color={colors.primary} strokeWidth={2} />
                  ) : (
                    <View style={styles.distortionDot} />
                  )}
                  <Text style={[styles.distortionLabel, selected && styles.distortionLabelSelected]}>
                    {d.label}
                  </Text>
                </View>
                <Text style={styles.distortionDescription}>{d.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quiet way back to the article that teaches these — the reverse of
            the Learn article's "Practice these" link into this screen. */}
        <TouchableOpacity
          style={styles.learnMoreLink}
          onPress={() => navigation.navigate('Learn', { selectedTopicId: 'cognitive_patterns' })}
          activeOpacity={0.7}
        >
          <HelpCircle size={15} color={colors.textSecondary} strokeWidth={2} />
          <Text style={styles.learnMoreText}>What are distortions?</Text>
        </TouchableOpacity>

        {/* Other free-text (only when 'other' selected) */}
        {selectedDistortions.includes('other') && (
          <TextInput
            style={styles.otherInput}
            value={distortionOther}
            onChangeText={setDistortionOther}
            placeholder="Name it in your own words (optional)..."
            placeholderTextColor={colors.textLight}
            maxLength={200}
            spellCheck={true}
            autoCorrect={true}
            autoCapitalize="sentences"
          />
        )}

        {/* Evidence weighing */}
        <Text style={styles.sectionTitle}>Weigh the evidence</Text>
        {renderCollapsibleSection(
          'for',
          'Evidence for the thought',
          'scale',
          evidenceFor,
          setEvidenceFor,
          'What genuinely supports this thought?'
        )}
        {renderCollapsibleSection(
          'against',
          'Evidence against it',
          'scale',
          evidenceAgainst,
          setEvidenceAgainst,
          'What doesn’t fit? What would you tell a friend?'
        )}

        {/* Balanced reframe */}
        {renderCollapsibleSection(
          'balanced',
          'A more balanced thought',
          'reframe',
          balancedThought,
          setBalancedThought,
          'Holding both sides — what’s a fairer, kinder, truer way to see this?'
        )}

        {/* Belief after */}
        <Text style={styles.sectionTitle}>How strongly do you believe the original now?</Text>
        {renderBeliefScale(beliefAfter, setBeliefAfter)}

        {/* Optional emotion */}
        {renderCollapsibleSection(
          'emotion',
          'How did it feel? (optional)',
          'cloud',
          emotion,
          setEmotion,
          'Anxious, ashamed, hopeless, angry, small...'
        )}

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveButton, (!automaticThought.trim() || selectedDistortions.length === 0) && styles.saveButtonDisabled]}
          onPress={saveEntry}
          disabled={!automaticThought.trim() || selectedDistortions.length === 0 || saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Save size={20} color="#fff" strokeWidth={2} />
              <Text style={styles.saveButtonText}>Save Thought Record</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Recent entries */}
        {recentEntries.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Recent Thought Records</Text>
            {recentEntries.map((entry) => {
              const shift =
                entry.belief_before != null && entry.belief_after != null
                  ? entry.belief_before - entry.belief_after
                  : null;
              return (
                <View key={entry.id} style={styles.recentCard}>
                  <View style={styles.recentHeader}>
                    <Cloud size={18} color={colors.primary} strokeWidth={2} />
                    <Text style={styles.recentType} numberOfLines={1}>
                      {(entry.distortion_types || []).map((t) => DISTORTION_LABELS[t] || t).join(', ') || 'Thought record'}
                    </Text>
                    <Text style={styles.recentTime}>{formatTime(entry.created_at)}</Text>
                  </View>
                  {entry.automatic_thought && (
                    <Text style={styles.recentDescription} numberOfLines={2}>
                      {entry.automatic_thought}
                    </Text>
                  )}
                  {shift != null && shift > 0 && (
                    <View style={styles.shiftBadge}>
                      <Sparkles size={12} color={colors.success} strokeWidth={2} />
                      <Text style={styles.shiftBadgeText}>
                        Belief eased {entry.belief_before}% → {entry.belief_after}%
                      </Text>
                    </View>
                  )}
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
    backgroundColor: '#eef3fb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#d6e0f3',
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
  learnMoreLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 8,
    marginTop: -2,
    marginBottom: 10,
  },
  learnMoreText: {
    fontSize: 13,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
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
  beliefContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  beliefButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
  },
  beliefButtonActive: {
    backgroundColor: colors.primary,
  },
  beliefText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  beliefTextActive: {
    color: '#fff',
  },
  distortionList: {
    gap: 8,
    marginBottom: 12,
  },
  distortionChip: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  distortionChipSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: '#f5f8fe',
  },
  distortionChipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distortionDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.lightGray,
  },
  distortionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  distortionLabelSelected: {
    color: colors.primary,
  },
  distortionDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginLeft: 26,
  },
  otherInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    marginBottom: 12,
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
    marginBottom: 6,
  },
  recentType: {
    flex: 1,
    fontSize: 13,
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
  shiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  shiftBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
});

export default CognitiveDistortionTracker;
