/**
 * Parts Check-in
 *
 * Quick logging screen for checking in with your inner parts (IFS)
 * Separate from the full IFS parts work session - this is for daily awareness tracking
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
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  MessageCircle,
  Tag,
  HeartPulse,
  Activity,
  Compass,
  HelpCircle,
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { icons } from '../lib/uiIcons';
import { colors } from '../theme/colors';
import { showThemedAlert } from './ThemedAlert';

const PART_TYPES = [
  { id: 'protector', label: 'Manager', icon: icons.manager, color: colors.primary, description: 'Managing, controlling, keeping safe' },
  { id: 'firefighter', label: 'Firefighter', icon: icons.firefighter, color: colors.error, description: 'Urgent, reactive, numbing, distracting' },
  { id: 'exile', label: 'Exile', icon: icons.exile, color: '#8b5cf6', description: 'Vulnerable, young, wounded, hidden' },
  { id: 'self', label: 'Self Energy', icon: icons.selfEnergy, color: colors.success, description: 'Calm, curious, compassionate, clear' },
];

const INTENSITY_LEVELS = [
  { value: 1, label: 'Background', color: '#c7d2fe' },
  { value: 2, label: 'Present', color: '#a5b4fc' },
  { value: 3, label: 'Active', color: '#818cf8' },
  { value: 4, label: 'Strong', color: '#6366f1' },
  { value: 5, label: 'Blended', color: '#4f46e5' },
];

const SECTION_ICON_MAP = {
  'chat-bubble': MessageCircle,
  label: Tag,
  healing: HeartPulse,
  accessibility: Activity,
};

const PartsCheckin = ({ navigation, route }) => {
  const returnTo = route?.params?.returnTo;
  const [partType, setPartType] = useState(null);
  const [intensity, setIntensity] = useState(3);

  const [partName, setPartName] = useState('');
  const [whatItsSaying, setWhatItsSaying] = useState('');
  const [whatItNeeds, setWhatItNeeds] = useState('');
  const [bodyLocation, setBodyLocation] = useState('');

  const [saving, setSaving] = useState(false);
  const [recentCheckins, setRecentCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState('saying');
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
        .from('parts_checkins')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setRecentCheckins(data);
      }
    } catch (error) {
      console.error('Error loading parts check-ins:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCheckin = async () => {
    if (!partType) {
      Alert.alert('Select Type', 'Please select what kind of part is present');
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
        .from('parts_checkins')
        .insert({
          user_id: user.id,
          part_type: partType,
          intensity,
          part_name: partName.trim() || null,
          what_its_saying: whatItsSaying.trim() || null,
          what_it_needs: whatItNeeds.trim() || null,
          body_location: bodyLocation.trim() || null,
        });

      if (error) throw error;

      showThemedAlert(
        'Checked In',
        'Your parts check-in has been saved. Noticing which parts are active builds Self-leadership and helps you respond with compassion.',
        [{ text: 'Done', onPress: () => {
          if (returnTo) {
            navigation.goBack();
            return;
          }
          // Reset form, then return home
          setPartType(null);
          setIntensity(3);
          setPartName('');
          setWhatItsSaying('');
          setWhatItNeeds('');
          setBodyLocation('');
          setExpandedSection('saying');
          navigation.navigate('Home');
        }}],
        { variant: 'success' }
      );
    } catch (error) {
      console.error('Error saving parts check-in:', error);
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
    const SectionIcon = SECTION_ICON_MAP[icon] || MessageCircle;
    const ToggleIcon = isExpanded ? ChevronUp : ChevronDown;

    return (
      <View style={styles.collapsibleSection}>
        <TouchableOpacity
          style={[styles.sectionHeader, hasValue && styles.sectionHeaderComplete]}
          onPress={() => setExpandedSection(isExpanded ? null : id)}
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
        <Text style={styles.headerTitle}>Parts Check-in</Text>
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
              Which parts of you are showing up right now? All parts are welcome - protectors, firefighters, and exiles all have important roles. Noticing them with curiosity is the first step toward Self-leadership.
            </Text>
          </View>
        </View>

        {/* Part Type Selection */}
        <Text style={styles.sectionTitle}>What kind of part is present? <Text style={styles.required}>*</Text></Text>
        <View style={styles.typeContainer}>
          {PART_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeCard,
                partType === type.id && { borderColor: type.color, borderWidth: 2 }
              ]}
              onPress={() => setPartType(type.id)}
            >
              <View style={[styles.typeIcon, { backgroundColor: `${type.color}20` }]}>
                <Image source={type.icon} style={styles.typeIconImage} />
              </View>
              <Text style={styles.typeLabel}>{type.label}</Text>
              <Text style={styles.typeDescription}>{type.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Intensity */}
        <Text style={styles.sectionTitle}>How present is this part? ({INTENSITY_LEVELS[intensity - 1].label})</Text>
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
        <Text style={styles.sectionTitle}>Get to know this part</Text>

        {renderCollapsibleSection(
          'saying',
          'What is this part saying?',
          'chat-bubble',
          whatItsSaying,
          setWhatItsSaying,
          '"You need to be careful", "I can\'t take this", "Don\'t let them see"...'
        )}

        {renderCollapsibleSection(
          'name',
          'Does this part have a name?',
          'label',
          partName,
          setPartName,
          'The Critic, Little Me, The Guard, The Fixer...'
        )}

        {renderCollapsibleSection(
          'needs',
          'What does this part need?',
          'healing',
          whatItNeeds,
          setWhatItNeeds,
          'Reassurance, to be heard, safety, rest, permission to let go...'
        )}

        {renderCollapsibleSection(
          'body',
          'Where do you feel it in your body?',
          'accessibility',
          bodyLocation,
          setBodyLocation,
          'Tightness in chest, knot in stomach, tension in jaw, heaviness in limbs...'
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, !partType && styles.saveButtonDisabled]}
          onPress={saveCheckin}
          disabled={!partType || saving}
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
              const type = PART_TYPES.find(t => t.id === checkin.part_type);
              return (
                <View key={checkin.id} style={styles.recentCard}>
                  <View style={styles.recentHeader}>
                    {type?.icon ? (
                      <Image source={type.icon} style={styles.recentIconImage} />
                    ) : (
                      <HelpCircle size={20} color={colors.textSecondary} strokeWidth={2} />
                    )}
                    <Text style={styles.recentType}>
                      {checkin.part_name || type?.label || 'Unknown'}
                    </Text>
                    <Text style={styles.recentTime}>{formatTime(checkin.created_at)}</Text>
                  </View>
                  {checkin.what_its_saying && (
                    <Text style={styles.recentDescription} numberOfLines={2}>
                      {checkin.what_its_saying}
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

        {/* Link to Full IFS */}
        <TouchableOpacity
          style={styles.deepDiveLink}
          onPress={() => navigation.navigate('IFSChat')}
        >
          <Compass size={20} color="#8b5cf6" strokeWidth={2} />
          <Text style={styles.deepDiveLinkText}>
            Want to do deeper parts work? Try the full IFS Parts Work session
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
    backgroundColor: '#f5f3ff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd6fe',
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
    color: '#8b5cf6',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  typeCard: {
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
    color: '#fff',
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
    backgroundColor: '#8b5cf6',
    padding: 16,
    borderRadius: 16,
    gap: 8,
    marginTop: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#c4b5fd',
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
    backgroundColor: '#f5f3ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 10,
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  deepDiveLinkText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default PartsCheckin;
