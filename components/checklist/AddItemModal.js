import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Info,
  Plus,
  Dumbbell,
  Shield,
  Flower2,
  ListChecks,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, shadows } from '../../theme/colors';

// Map legacy MaterialIcons names stored in the categories array to Lucide.
const CATEGORY_ICON_MAP = {
  'fitness-center': Dumbbell,
  shield: Shield,
  spa: Flower2,
  checklist: ListChecks,
};

/**
 * AddItemModal - Modal form for adding custom checklist items
 *
 * Allows users to add custom items with title, description, and category.
 */
const AddItemModal = ({ visible, onClose, onAdd, loading }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('practical');
  const [errors, setErrors] = useState({});

  const categories = [
    { value: 'physical', label: 'Physical', icon: 'fitness-center' },
    { value: 'safety', label: 'Safety', icon: 'shield' },
    { value: 'mental', label: 'Mental', icon: 'spa' },
    { value: 'practical', label: 'Practical', icon: 'checklist' },
  ];

  const validate = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > 200) {
      newErrors.title = 'Title must be 200 characters or less';
    }

    if (description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;

    const success = await onAdd({
      title: title.trim(),
      description: description.trim(),
      category,
    });

    if (success) {
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('practical');
      setErrors({});
      onClose();
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setCategory('practical');
    setErrors({});
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add Custom Item</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={colors.text} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Title input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  if (errors.title) setErrors({ ...errors, title: null });
                }}
                placeholder="e.g., Prepare integration journal"
                placeholderTextColor={colors.textLight}
                maxLength={200}
                editable={!loading}
              />
              {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
              <Text style={styles.charCount}>{title.length}/200</Text>
            </View>

            {/* Description input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.textArea, errors.description && styles.inputError]}
                value={description}
                onChangeText={(text) => {
                  setDescription(text);
                  if (errors.description) setErrors({ ...errors, description: null });
                }}
                placeholder="Add more details about this preparation step..."
                placeholderTextColor={colors.textLight}
                multiline
                numberOfLines={4}
                maxLength={500}
                editable={!loading}
              />
              {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
              <Text style={styles.charCount}>{description.length}/500</Text>
            </View>

            {/* Category selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryGrid}>
                {categories.map((cat) => {
                  const CategoryIcon = CATEGORY_ICON_MAP[cat.icon] || ListChecks;
                  return (
                    <TouchableOpacity
                      key={cat.value}
                      style={[
                        styles.categoryButton,
                        category === cat.value && styles.categoryButtonActive,
                      ]}
                      onPress={() => setCategory(cat.value)}
                      disabled={loading}
                      activeOpacity={0.7}
                    >
                      <CategoryIcon
                        size={24}
                        color={category === cat.value ? colors.textInverse : colors.textSecondary}
                        strokeWidth={2}
                      />
                      <Text
                        style={[
                          styles.categoryButtonText,
                          category === cat.value && styles.categoryButtonTextActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Info box */}
            <View style={styles.infoBox}>
              <Info size={20} color={colors.sage} strokeWidth={2} />
              <Text style={styles.infoText}>
                Custom items can be edited or deleted at any time.
              </Text>
            </View>
          </ScrollView>

          {/* Footer buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.addButton, loading && styles.buttonDisabled]}
              onPress={handleAdd}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.addButtonText}>Adding...</Text>
              ) : (
                <>
                  <Plus size={20} color={colors.textInverse} strokeWidth={2} />
                  <Text style={styles.addButtonText}>Add Item</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: spacing.xs,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  inputGroup: {
    marginTop: spacing.lg,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  required: {
    color: colors.error,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + spacing.xs,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    marginTop: spacing.xs,
  },
  charCount: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  categoryButtonTextActive: {
    color: colors.textInverse,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    borderLeftWidth: 3,
    borderLeftColor: colors.sage,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    backgroundColor: colors.surface,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    ...shadows.medium,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default AddItemModal;
