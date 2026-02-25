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
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { colors, gradients } from '../theme/colors';

const HABIT_CATEGORIES = [
  { id: 'morning', label: 'Morning', icon: 'wb-sunny', color: '#f59e0b' },
  { id: 'evening', label: 'Evening', icon: 'nightlight-round', color: '#6366f1' },
  { id: 'anytime', label: 'Anytime', icon: 'schedule', color: '#10b981' },
  { id: 'weekly', label: 'Weekly', icon: 'date-range', color: '#ec4899' },
];

const PRESET_HABITS = [
  { name: 'Morning Meditation', category: 'morning', icon: 'self-improvement', color: '#8b5cf6' },
  { name: 'Gratitude Journal', category: 'morning', icon: 'auto-awesome', color: '#f59e0b' },
  { name: 'Grounding Exercise', category: 'anytime', icon: 'landscape', color: '#10b981' },
  { name: 'Breathing Practice', category: 'anytime', icon: 'air', color: '#3b82f6' },
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

      // Create a map of habit_id -> completion
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
        // Remove completion
        const { error } = await supabase
          .from('habit_completions')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Add completion
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
          color: HABIT_CATEGORIES.find(c => c.id === newHabitCategory)?.color || '#8b5cf6',
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

      // Check if already exists
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
    // Don't allow future dates
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
              <MaterialIcons name="close" size={28} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Custom habit input */}
            <View style={styles.customHabitSection}>
              <Text style={styles.sectionTitle}>Create Custom Habit</Text>
              <TextInput
                style={styles.habitInput}
                value={newHabitName}
                onChangeText={setNewHabitName}
                placeholder="Enter habit name..."
                placeholderTextColor="#9ca3af"
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
                    <MaterialIcons
                      name={cat.icon}
                      size={16}
                      color={newHabitCategory === cat.id ? '#fff' : '#6b7280'}
                    />
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
                <MaterialIcons name="add" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add Custom Habit</Text>
              </TouchableOpacity>
            </View>

            {/* Preset habits */}
            <View style={styles.presetSection}>
              <Text style={styles.sectionTitle}>Quick Add Presets</Text>
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
                      <MaterialIcons name={preset.icon} size={24} color={preset.color} />
                    </View>
                    <View style={styles.presetContent}>
                      <Text style={styles.presetName}>{preset.name}</Text>
                      <Text style={styles.presetCategory}>
                        {HABIT_CATEGORIES.find(c => c.id === preset.category)?.label}
                      </Text>
                    </View>
                    {isAdded ? (
                      <MaterialIcons name="check-circle" size={24} color="#10b981" />
                    ) : (
                      <MaterialIcons name="add-circle-outline" size={24} color="#9ca3af" />
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={gradients.warm}
        start={{ x: 1.0, y: 0.0 }}
        end={{ x: 0.0, y: 1.0 }}
        style={styles.headerGradient}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.textInverse} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.heroTitle}>Habit Tracker</Text>
            <Text style={styles.heroSubtitle}>
              Build your daily practice
            </Text>
          </View>
          <Image
            source={require('../assets/images/huxley therapist.png')}
            style={styles.huxleyAvatar}
            resizeMode="contain"
          />
        </View>
      </LinearGradient>

      {/* Date Navigator */}
      <View style={styles.dateNavigator}>
        <TouchableOpacity onPress={() => navigateDate(-1)} style={styles.dateArrow}>
          <MaterialIcons name="chevron-left" size={28} color="#6b7280" />
        </TouchableOpacity>
        <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        <TouchableOpacity
          onPress={() => navigateDate(1)}
          style={styles.dateArrow}
          disabled={selectedDate.toDateString() === new Date().toDateString()}
        >
          <MaterialIcons
            name="chevron-right"
            size={28}
            color={selectedDate.toDateString() === new Date().toDateString() ? '#e5e7eb' : '#6b7280'}
          />
        </TouchableOpacity>
      </View>

      {/* Progress Summary */}
      <View style={styles.progressSummary}>
        <View style={styles.progressCircle}>
          <Text style={styles.progressPercentage}>{getCompletionRate()}%</Text>
        </View>
        <View style={styles.progressText}>
          <Text style={styles.progressCount}>
            {Object.keys(completions).length} of {habits.length} completed
          </Text>
          <Text style={styles.progressLabel}>Keep up the good work!</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="track-changes" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptyText}>
              Add habits to start building your daily practice
            </Text>
            <TouchableOpacity
              style={styles.emptyAddButton}
              onPress={() => setShowAddModal(true)}
            >
              <MaterialIcons name="add" size={20} color="#fff" />
              <Text style={styles.emptyAddButtonText}>Add Your First Habit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {groupedHabits.map(group => (
              <View key={group.id} style={styles.habitGroup}>
                <View style={styles.groupHeader}>
                  <MaterialIcons name={group.icon} size={20} color={group.color} />
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
                        {isCompleted && <MaterialIcons name="check" size={16} color="#fff" />}
                      </View>
                      <Text style={[styles.habitName, isCompleted && styles.habitNameCompleted]}>
                        {habit.habit_name}
                      </Text>
                      <MaterialIcons
                        name={habit.icon || 'check-circle'}
                        size={20}
                        color={isCompleted ? habit.color : '#d1d5db'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </>
        )}

        {/* Add habit button */}
        {habits.length > 0 && (
          <TouchableOpacity
            style={styles.addHabitButton}
            onPress={() => setShowAddModal(true)}
          >
            <MaterialIcons name="add" size={24} color={colors.primary} />
            <Text style={styles.addHabitButtonText}>Add New Habit</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>

      {renderAddModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  headerGradient: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingTop: 50,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 24,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  headerText: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textInverse,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  huxleyAvatar: {
    width: 60,
    height: 60,
  },
  dateNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dateArrow: {
    padding: 8,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginHorizontal: 16,
  },
  progressSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  progressCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#22c55e',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  progressText: {
    marginLeft: 16,
    flex: 1,
  },
  progressCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  progressLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    marginHorizontal: 32,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
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
    marginBottom: 24,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 4,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  habitItemCompleted: {
    backgroundColor: '#f0fdf4',
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
    fontSize: 16,
    color: '#1f2937',
  },
  habitNameCompleted: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  addHabitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addHabitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
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
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalBody: {
    padding: 20,
  },
  customHabitSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  habitInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
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
    color: '#6b7280',
    marginLeft: 6,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
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
    color: '#1f2937',
  },
  presetCategory: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
});

export default HabitTracker;
