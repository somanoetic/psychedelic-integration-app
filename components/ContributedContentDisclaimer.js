// ADR-009 Phase B2: disclaimer shown on user-facing views of any
// contributor-submitted content. Text matches the ADR copy verbatim so
// reviewers don't have to chase wording differences.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme/colors';

const ContributedContentDisclaimer = ({ attributionName, style }) => {
  const safeName = (attributionName || 'a community contributor').trim() || 'a community contributor';
  return (
    <View style={[styles.container, style]}>
      <MaterialIcons
        name="info-outline"
        size={18}
        color={colors.textSecondary}
        style={styles.icon}
      />
      <Text style={styles.text}>
        This content was contributed by {safeName} and reviewed for safety. It
        reflects the contributor&rsquo;s perspective, not medical advice or the
        views of Alleviation Therapeutics.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${colors.primary}0D`,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  icon: {
    marginTop: 2,
  },
  text: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
});

export default ContributedContentDisclaimer;
