import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  Dumbbell,
  Shield,
  Flower2,
  ListChecks,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, shadows } from '../../theme/colors';
import ChecklistItem from './ChecklistItem';

// Map legacy MaterialIcons names from categoryInfo to Lucide components.
const CATEGORY_ICON_MAP = {
  'fitness-center': Dumbbell,
  shield: Shield,
  spa: Flower2,
  checklist: ListChecks,
};

/**
 * CategorySection - Collapsible group of checklist items by category
 *
 * Groups items by category (Physical, Safety, Mental, Practical) with collapse/expand.
 */
const CategorySection = ({ category, items, onToggleItem, onToggleItemNA, onDeleteItem, disabled }) => {
  const [collapsed, setCollapsed] = useState(false);

  const categoryInfo = {
    physical: {
      title: 'Physical Preparation',
      icon: 'fitness-center',
      color: colors.primary,
    },
    safety: {
      title: 'Safety & Support',
      icon: 'shield',
      color: colors.warning,
    },
    mental: {
      title: 'Mental/Emotional',
      icon: 'spa',
      color: colors.sage,
    },
    practical: {
      title: 'Practical Logistics',
      icon: 'checklist',
      color: colors.slate,
    },
  };

  const info = categoryInfo[category] || categoryInfo.practical;
  const CategoryIcon = CATEGORY_ICON_MAP[info.icon] || ListChecks;
  // N/A items count toward "done" so the section header reflects items
  // the user has resolved one way or another.
  const completedCount = items.filter(item => item.isChecked || item.isNa).length;
  const totalCount = items.length;

  return (
    <View style={styles.container}>
      {/* Category header */}
      <TouchableOpacity
        onPress={() => setCollapsed(!collapsed)}
        style={styles.header}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <CategoryIcon size={24} color={info.color} strokeWidth={2} />
          <Text style={styles.categoryTitle}>{info.title}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {completedCount}/{totalCount}
            </Text>
          </View>
          {collapsed ? (
            <ChevronDown size={24} color={colors.textSecondary} strokeWidth={2} />
          ) : (
            <ChevronUp size={24} color={colors.textSecondary} strokeWidth={2} />
          )}
        </View>
      </TouchableOpacity>

      {/* Items list */}
      {!collapsed && (
        <View style={styles.itemsContainer}>
          {items.map(item => (
            <ChecklistItem
              key={item.id}
              item={item}
              onToggle={onToggleItem}
              onToggleNA={onToggleItemNA}
              onDelete={onDeleteItem}
              disabled={disabled}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    ...shadows.soft,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  countBadge: {
    backgroundColor: colors.sage,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textInverse,
  },
  itemsContainer: {
    paddingHorizontal: spacing.xs,
  },
});

export default CategorySection;
