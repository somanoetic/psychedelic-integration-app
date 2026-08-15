/**
 * Habit Tracker
 *
 * Daily habit tracking screen - styled to match the Parts and Nervous System
 * check-in screens for visual consistency across daily practice tools.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Plus,
  CheckCircle2,
  PlusCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Target,
  Check,
  Sun,
  Moon,
  Clock,
  CalendarDays,
  Sparkles,
  Mountain,
  Wind,
  Activity,
  Brain,
  Users,
  Trees,
  HelpCircle,
} from 'lucide-react-native';

const HABIT_ICON_MAP = {
  'wb-sunny': Sun,
  'nightlight-round': Moon,
  schedule: Clock,
  'date-range': CalendarDays,
  'self-improvement': Sparkles,
  'auto-awesome': Sparkles,
  landscape: Mountain,
  air: Wind,
  accessibility: Activity,
  psychology: Brain,
  groups: Users,
  park: Trees,
  'check-circle': CheckCircle2,
};
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';

const HABIT_CATEGORIES = [
  { id: 'morning', label: 'Morning', icon: 'wb-sunny', color: colors.warning },
  { id: 'evening', label: 'Evening', icon: 'nightlight-round', color: '#6366f1' },
  { id: 'anytime', label: 'Anytime', icon: 'schedule', color: colors.success },
  { id: 'weekly', label: 'Weekly', icon: 'date-range', color: '#ec4899' },
];

const PRESET_HABITS = [
  { name: 'Morning Meditation', category: 'morning', icon: 'self-improvement', color: '#8b5cf6' },
  { name: 'Gratitude Journal', category: 'morning', icon: 'auto-awesome', color: colors.warning },
  { name: 'Grounding Exercise', category: 'anytime', icon: 'landscape', color: colors.success },
  { name: 'Breathing Practice', category: 'anytime', icon: 'air', color: colors.primary },
  { name: 'Body Scan', category: 'evening', icon: 'accessibility', color: '#ec4899' },
  { name: 'Evening Reflection', category: 'evening', icon: 'psychology', color: '#6366f1' },
  { name: 'Parts Check-in', category: 'anytime', icon: 'groups', color: '#8b5cf6' },
  { name: 'Nature Walk', category: 'weekly', icon: 'park', color: '#22c55e' },
];

const HabitTracker = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('anytime');
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadHabits();
  }, []);

  useEffect(() => {
    if (habits.length > 0) {
      loadCompletionsForDate(selectedDate);
    }
  }, [habits, selectedDate]);

  const loadHabits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setHabits(data || []);
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompletionsForDate = async (date) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dateStr = date.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('completion_date', dateStr);

      if (error) throw error;

      const completionMap = {};
      (data || []).forEach(item => {
        completionMap[item.habit_id] = item;
      });
      setCompletions(completionMap);
    } catch (error) {
      console.error('Error loading completions:', error);
    }
  };

  const toggleHabitCompletion = async (habit) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dateStr = selectedDate.toISOString().split('T')[0];
      const existing = completions[habit.id];

      if (existing) {
        const { error } = await supabase
          .from('habit_completions')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('habit_completions')
          .insert({
            user_id: user.id,
            habit_id: habit.id,
            completion_date: dateStr,
          });

        if (error) throw error;
      }

      loadCompletionsForDate(selectedDate);
    } catch (error) {
      console.error('Error toggling habit:', error);
    }
  };

  const addHabit = async () => {
    if (!newHabitName.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          habit_name: newHabitName.trim(),
          habit_category: newHabitCategory,
          icon: 'check-circle',
          color: HABIT_CATEGORIES.find(c => c.id === newHabitCategory)?.color || '#5d86d6',
        });

      if (error) throw error;

      setNewHabitName('');
      setShowAddModal(false);
      loadHabits();
    } catch (error) {
      console.error('Error adding habit:', error);
      Alert.alert('Error', 'Could not add habit. Please try again.');
    }
  };

  const addPresetHabit = async (preset) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const existingHabit = habits.find(h => h.habit_name === preset.name);
      if (existingHabit) {
        Alert.alert('Already Added', 'This habit is already in your tracker.');
        return;
      }

      const { error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          habit_name: preset.name,
          habit_category: preset.category,
          icon: preset.icon,
          color: preset.color,
        });

      if (error) throw error;

      setShowAddModal(false);
      loadHabits();
    } catch (error) {
      console.error('Error adding preset habit:', error);
    }
  };

  const deleteHabit = async (habit) => {
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${habit.habit_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('habits')
                .update({ is_active: false })
                .eq('id', habit.id);

              if (error) throw error;
              loadHabits();
            } catch (error) {
              console.error('Error deleting habit:', error);
            }
          },
        },
      ]
    );
  };

  const getCompletionRate = () => {
    if (habits.length === 0) return 0;
    const completedCount = Object.keys(completions).length;
    return Math.round((completedCount / habits.length) * 100);
  };

  const formatDate = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    if (newDate <= new Date()) {
      setSelectedDate(newDate);
    }
  };

  const groupedHabits = HABIT_CATEGORIES.map(category => ({
    ...category,
    habits: habits.filter(h => h.habit_category === category.id),
  })).filter(group => group.habits.length > 0);

  const renderAddModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAddModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Habit</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <X size={28} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.customHabitSection}>
              <Text style={styles.modalSectionTitle}>Create Custom Habit</Text>
              <TextInput
                style={styles.habitInput}
                value={newHabitName}
                onChangeText={setNewHabitName}
                placeholder="Enter habit name..."
                placeholderTextColor={colors.textLight}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {HABIT_CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      newHabitCategory === cat.id && { backgroundColor: cat.color },
                    ]}
                    onPress={() => setNewHabitCategory(cat.id)}
                  >
                    {(() => {
                      const Icon = HABIT_ICON_MAP[cat.icon] || HelpCircle;
                      return (
                        <Icon
                          size={16}
                          color={newHabitCategory === cat.id ? '#fff' : colors.textSecondary}
                          strokeWidth={2}
                        />
                      );
                    })()}
                    <Text style={[
                      styles.categoryChipText,
                      newHabitCategory === cat.id && { color: '#fff' },
                    ]}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={[styles.addButton, !newHabitName.trim() && styles.addButtonDisabled]}
                onPress={addHabit}
                disabled={!newHabitName.trim()}
              >
                <Plus size={20} color="#fff" strokeWidth={2} />
                <Text style={styles.addButtonText}>Add Custom Habit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.presetSection}>
              <Text style={styles.modalSectionTitle}>Quick Add Presets</Text>
              {PRESET_HABITS.map((preset, index) => {
                const isAdded = habits.some(h => h.habit_name === preset.name);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.presetItem, isAdded && styles.presetItemAdded]}
                    onPress={() => !isAdded && addPresetHabit(preset)}
                    disabled={isAdded}
                  >
                    <View style={[styles.presetIcon, { backgroundColor: `${preset.color}20` }]}>
                      {(() => {
                        const Icon = HABIT_ICON_MAP[preset.icon] || HelpCircle;
                        return <Icon size={24} color={preset.color} strokeWidth={2} />;
                      })()}
                    </View>
                    <View style={styles.presetContent}>
                      <Text style={styles.presetName}>{preset.name}</Text>
                      <Text style={styles.presetCategory}>
                        {HABIT_CATEGORIES.find(c => c.id === preset.category)?.label}
                      </Text>
                    </View>
                    {isAdded ? (
                      <CheckCircle2 size={24} color={colors.success} strokeWidth={2} />
                    ) : (
                      <PlusCircle size={24} color={colors.textLight} strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Habit Tracker</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
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
              Small daily practices build the foundation of integration. Tracking habits helps you notice what's nourishing you - and where you might need extra care.
            </Text>
          </View>
        </View>

        {/* Date Navigator */}
        <View style={styles.dateNavigator}>
          <TouchableOpacity onPress={() => navigateDate(-1)} style={styles.dateArrow}>
            <ChevronLeft size={28} color={colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          <TouchableOpacity
            onPress={() => navigateDate(1)}
            style={styles.dateArrow}
            disabled={isToday}
          >
            <ChevronRight
              size={28}
              color={isToday ? colors.lightGray : colors.textSecondary}
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>

        {/* Progress Summary */}
        {habits.length > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressCircle}>
              <Text style={styles.progressPercentage}>{getCompletionRate()}%</Text>
            </View>
            <View style={styles.progressText}>
              <Text style={styles.progressCount}>
                {Object.keys(completions).length} of {habits.length} completed
              </Text>
              <Text style={styles.progressLabel}>Keep up the good work</Text>
            </View>
          </View>
        )}

        {/* Habits */}
        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <Target size={64} color="#d1d5db" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptyText}>
              Add habits to start building your daily practice
            </Text>
            <TouchableOpacity
              style={styles.emptyAddButton}
              onPress={() => setShowAddModal(true)}
            >
              <Plus size={20} color="#fff" strokeWidth={2} />
              <Text style={styles.emptyAddButtonText}>Add Your First Habit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {groupedHabits.map(group => (
              <View key={group.id} style={styles.habitGroup}>
                <View style={styles.groupHeader}>
                  {(() => {
                    const Icon = HABIT_ICON_MAP[group.icon] || HelpCircle;
                    return <Icon size={20} color={group.color} strokeWidth={2} />;
                  })()}
                  <Text style={[styles.groupTitle, { color: group.color }]}>{group.label}</Text>
                </View>
                {group.habits.map(habit => {
                  const isCompleted = !!completions[habit.id];
                  return (
                    <TouchableOpacity
                      key={habit.id}
                      style={[styles.habitItem, isCompleted && styles.habitItemCompleted]}
                      onPress={() => toggleHabitCompletion(habit)}
                      onLongPress={() => deleteHabit(habit)}
                    >
                      <View style={[styles.checkbox, isCompleted && { backgroundColor: habit.color, borderColor: habit.color }]}>
                        {isCompleted && <Check size={16} color="#fff" strokeWidth={2} />}
                      </View>
                      <Text style={[styles.habitName, isCompleted && styles.habitNameCompleted]}>
                        {habit.habit_name}
                      </Text>
                      {(() => {
                        const Icon = HABIT_ICON_MAP[habit.icon || 'check-circle'] || CheckCircle2;
                        return (
                          <Icon
                            size={20}
                            color={isCompleted ? habit.color : '#d1d5db'}
                            strokeWidth={2}
                          />
                        );
                      })()}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            <TouchableOpacity
              style={styles.addHabitButton}
              onPress={() => setShowAddModal(true)}
            >
              <Plus size={24} color="#5d86d6" strokeWidth={2} />
              <Text style={styles.addHabitButtonText}>Add New Habit</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {renderAddModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f7ff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#dbeafe',
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
    marginBottom: 20,
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
  dateNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  dateArrow: {
    padding: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginHorizontal: 16,
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#5d86d6',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5d86d6',
  },
  progressText: {
    marginLeft: 16,
    flex: 1,
  },
  progressCount: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  progressLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginHorizontal: 32,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5d86d6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  emptyAddButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  habitGroup: {
    marginBottom: 20,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingLeft: 4,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  habitItemCompleted: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitName: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  habitNameCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textLight,
  },
  addHabitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#5d86d6',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addHabitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5d86d6',
    marginLeft: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalBody: {
    padding: 20,
  },
  customHabitSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  habitInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginLeft: 6,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5d86d6',
    padding: 14,
    borderRadius: 12,
  },
  addButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  presetSection: {
    marginBottom: 20,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 8,
  },
  presetItemAdded: {
    opacity: 0.6,
  },
  presetIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  presetContent: {
    flex: 1,
  },
  presetName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  presetCategory: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default HabitTracker;
