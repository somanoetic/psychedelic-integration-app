import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../theme/colors';

/**
 * ChecklistItem - Individual checklist item with checkbox
 *
 * Features:
 * - Checkbox toggle
 * - Expandable description
 * - Delete for custom items
 * - Visual feedback for completion
 */
const ChecklistItem = ({ item, onToggle, onToggleNA, onDelete, disabled }) => {
  const [expanded, setExpanded] = useState(false);

  const handleToggle = () => {
    if (!disabled && !item.isNa) {
      onToggle(item.id);
    }
  };

  const handleToggleNA = () => {
    if (!disabled && onToggleNA) {
      onToggleNA(item.id);
    }
  };

  const handleDelete = () => {
    if (!disabled && item.isCustom && onDelete) {
      onDelete(item.id);
    }
  };

  const hasDescription = item.description && item.description.trim().length > 0;
  // Safety items must always be confirmed; they can't be marked N/A.
  const canMarkNA = item.category !== 'safety' && onToggleNA;

  return (
    <View style={[
      styles.container,
      item.isChecked && styles.containerChecked,
      item.isNa && styles.containerNa
    ]}>
      {/* Main row */}
      <View style={styles.mainRow}>
        {/* Checkbox (replaced by N/A glyph when N/A is active) */}
        <TouchableOpacity
          onPress={handleToggle}
          disabled={disabled || item.isNa}
          style={styles.checkboxButton}
          activeOpacity={0.7}
        >
          <View style={[
            styles.checkbox,
            item.isChecked && styles.checkboxChecked,
            item.isNa && styles.checkboxNa
          ]}>
            {item.isNa ? (
              <Text style={styles.checkboxNaLabel}>N/A</Text>
            ) : item.isChecked ? (
              <MaterialIcons name="check" size={18} color={colors.textInverse} />
            ) : null}
          </View>
        </TouchableOpacity>

        {/* Title and expand button */}
        <View style={styles.textContainer}>
          <TouchableOpacity
            onPress={() => hasDescription && setExpanded(!expanded)}
            disabled={!hasDescription}
            activeOpacity={0.7}
            style={styles.titleButton}
          >
            <Text style={[
              styles.title,
              item.isChecked && styles.titleChecked,
              item.isNa && styles.titleNa
            ]}>
              {item.title}
            </Text>
            {item.isEssential && (
              <View style={styles.essentialBadge}>
                <Text style={styles.essentialText}>Essential</Text>
              </View>
            )}
            {hasDescription && (
              <MaterialIcons
                name={expanded ? 'expand-less' : 'expand-more'}
                size={20}
                color={colors.textSecondary}
                style={styles.expandIcon}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* N/A toggle pill for non-safety items */}
        {canMarkNA && (
          <TouchableOpacity
            onPress={handleToggleNA}
            disabled={disabled}
            style={[styles.naPill, item.isNa && styles.naPillActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.naPillText, item.isNa && styles.naPillTextActive]}>
              N/A
            </Text>
          </TouchableOpacity>
        )}

        {/* Delete button for custom items */}
        {item.isCustom && onDelete && (
          <TouchableOpacity
            onPress={handleDelete}
            disabled={disabled}
            style={styles.deleteButton}
            activeOpacity={0.7}
          >
            <MaterialIcons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Expanded description */}
      {expanded && hasDescription && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.lightGray,
    ...shadows.soft,
  },
  containerChecked: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.success,
    opacity: 0.8,
  },
  containerNa: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.textLight,
    opacity: 0.65,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  checkboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkboxNa: {
    backgroundColor: colors.textLight,
    borderColor: colors.textLight,
  },
  checkboxNaLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textInverse,
    letterSpacing: 0.3,
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  titleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
    flexShrink: 1,
  },
  titleChecked: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  titleNa: {
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  naPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.textLight,
    marginLeft: spacing.xs,
    marginRight: spacing.xs,
  },
  naPillActive: {
    backgroundColor: colors.textLight,
    borderColor: colors.textLight,
  },
  naPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  naPillTextActive: {
    color: colors.textInverse,
  },
  essentialBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  essentialText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textInverse,
    textTransform: 'uppercase',
  },
  expandIcon: {
    marginLeft: spacing.xs,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  descriptionContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    paddingLeft: 32 + spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default ChecklistItem;
