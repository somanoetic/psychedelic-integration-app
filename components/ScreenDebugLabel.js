/**
 * Screen Debug Label
 *
 * Shows the current screen name in development mode
 * Add to any screen for easy identification during development
 */

import { Text, StyleSheet } from 'react-native';

const ScreenDebugLabel = ({ name }) => {
  if (!__DEV__) return null;

  return (
    <Text style={styles.label}>{name}</Text>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 10,
    color: 'rgba(0,0,0,0.4)',
    fontFamily: 'monospace',
  },
});

export default ScreenDebugLabel;
