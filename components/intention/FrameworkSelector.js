import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme/colors';

/**
 * FrameworkSelector - Choose therapeutic framework
 *
 * Options:
 * - IFS (Internal Family Systems)
 * - Somatic
 * - Existential
 * - Healing
 * - Integration
 * - None (if allowNull)
 */
const FrameworkSelector = ({ selectedFramework, onSelectFramework, allowNull = false }) => {
  const [showScrollHint, setShowScrollHint] = useState(true);

  const frameworks = [
    { key: 'ifs', label: 'IFS', icon: 'groups', description: 'Parts work & self-compassion' },
    { key: 'somatic', label: 'Somatic', icon: 'accessibility', description: 'Body awareness' },
    { key: 'existential', label: 'Existential', icon: 'explore', description: 'Meaning & purpose' },
    { key: 'healing', label: 'Healing', icon: 'healing', description: 'Trauma & recovery' },
    { key: 'integration', label: 'Integration', icon: 'integration-instructions', description: 'Daily life integration' },
  ];

  if (allowNull) {
    frameworks.unshift({ key: null, label: 'All', icon: 'all-inclusive', description: 'No filter' });
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.container}
        onScroll={() => showScrollHint && setShowScrollHint(false)}
        scrollEventThrottle={16}
      >
        <View style={styles.optionsContainer}>
          {frameworks.map((fw) => {
            const isSelected = selectedFramework === fw.key;
            return (
              <TouchableOpacity
                key={fw.key || 'null'}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => onSelectFramework(fw.key)}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={fw.icon}
                  size={24}
                  color={isSelected ? colors.textInverse : colors.primary}
                />
                <Text style={[styles.label, isSelected && styles.labelSelected]}>
                  {fw.label}
                </Text>
                <Text style={[styles.description, isSelected && styles.descriptionSelected]}>
                  {fw.description}
                </Text>
              </TouchableOpacity>
            );
          })}
          <View style={styles.endPadding} />
        </View>
      </ScrollView>
      {showScrollHint && (
        <View style={styles.scrollHint}>
          <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  container: {
    marginBottom: spacing.sm,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  endPadding: {
    width: 32,
  },
  scrollHint: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: spacing.sm,
    width: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 241, 232, 0.8)',
  },
  option: {
    width: 120,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.lightGray,
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.xs,
  },
  labelSelected: {
    color: colors.textInverse,
  },
  description: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  descriptionSelected: {
    color: colors.textInverse,
    opacity: 0.9,
  },
});

export default FrameworkSelector;
