import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme/colors';

/**
 * SessionTypeSelector - Choose session type
 *
 * Options:
 * - Healing
 * - Exploration
 * - Creativity
 * - Spiritual
 * - General
 * - None (if allowNull)
 */
const SessionTypeSelector = ({ selectedType, onSelectType, allowNull = false }) => {
  const [showScrollHint, setShowScrollHint] = useState(true);

  const sessionTypes = [
    { key: 'healing', label: 'Healing', icon: 'favorite', color: colors.success },
    { key: 'exploration', label: 'Exploration', icon: 'explore', color: colors.info },
    { key: 'creativity', label: 'Creativity', icon: 'palette', color: colors.golden },
    { key: 'spiritual', label: 'Spiritual', icon: 'spa', color: colors.primary },
    { key: 'general', label: 'General', icon: 'circle', color: colors.textSecondary },
  ];

  if (allowNull) {
    sessionTypes.unshift({ key: null, label: 'All', icon: 'all-inclusive', color: colors.textSecondary });
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
          {sessionTypes.map((type) => {
            const isSelected = selectedType === type.key;
            return (
              <TouchableOpacity
                key={type.key || 'null'}
                style={[
                  styles.option,
                  isSelected && styles.optionSelected,
                  isSelected && { borderColor: type.color }
                ]}
                onPress={() => onSelectType(type.key)}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={type.icon}
                  size={20}
                  color={isSelected ? type.color : colors.textSecondary}
                />
                <Text style={[
                  styles.label,
                  isSelected && styles.labelSelected,
                  isSelected && { color: type.color }
                ]}>
                  {type.label}
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 2,
    borderColor: colors.lightGray,
    gap: spacing.xs,
  },
  optionSelected: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  labelSelected: {
    fontWeight: '600',
  },
});

export default SessionTypeSelector;
