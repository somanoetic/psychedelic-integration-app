import React from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing } from '../../theme/colors';
import CategorySection from './CategorySection';

/**
 * ChecklistItemsList - Renders all checklist items grouped by category
 *
 * Organizes items into Physical, Safety, Mental, and Practical sections.
 */
const ChecklistItemsList = ({ items, onToggleItem, onDeleteItem, disabled }) => {
  // Group items by category
  const categorizedItems = items.reduce((acc, item) => {
    const category = item.category || 'practical';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  // Define display order
  const categoryOrder = ['physical', 'safety', 'mental', 'practical'];

  return (
    <View style={styles.container}>
      {categoryOrder.map(category => {
        const categoryItems = categorizedItems[category];
        if (!categoryItems || categoryItems.length === 0) return null;

        return (
          <CategorySection
            key={category}
            category={category}
            items={categoryItems}
            onToggleItem={onToggleItem}
            onDeleteItem={onDeleteItem}
            disabled={disabled}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.lg,
  },
});

export default ChecklistItemsList;
