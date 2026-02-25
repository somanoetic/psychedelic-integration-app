import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { colors } from '../../theme/colors';

const ErrorSummaryCard = ({ errors }) => {
  const totalErrors = errors?.reduce((sum, err) => sum + (err.error_count || 0), 0) || 0;
  const topErrors = errors?.slice(0, 3) || [];

  const handleViewSentry = () => {
    const SENTRY_URL = process.env.SENTRY_URL || 'https://sentry.io';
    Linking.canOpenURL(SENTRY_URL).then(supported => {
      if (supported) {
        Linking.openURL(SENTRY_URL);
      } else {
        Alert.alert('Error', 'Cannot open Sentry URL');
      }
    });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Errors (24h)</Text>

      <View style={styles.totalErrorsContainer}>
        <Text style={[styles.totalErrorsValue, totalErrors === 0 && styles.successText]}>
          {totalErrors}
        </Text>
        <Text style={styles.totalErrorsLabel}>Total Errors</Text>
      </View>

      {topErrors.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Top Error Types</Text>
          {topErrors.map((error, index) => (
            <View key={index} style={styles.errorRow}>
              <Text style={styles.errorType} numberOfLines={1}>
                {error.error_type || 'Unknown'}
              </Text>
              <Text style={styles.errorCount}>{error.error_count}</Text>
            </View>
          ))}
        </>
      ) : (
        <Text style={styles.noErrorsText}>No errors in the last 24 hours</Text>
      )}

      <TouchableOpacity style={styles.sentryButton} onPress={handleViewSentry}>
        <Text style={styles.sentryButtonText}>View in Sentry</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  totalErrorsContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  totalErrorsValue: {
    color: colors.error,
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  successText: {
    color: colors.success,
  },
  totalErrorsLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    alignItems: 'center',
  },
  errorType: {
    color: colors.textSecondary,
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  errorCount: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '600',
  },
  noErrorsText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  sentryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  sentryButtonText: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ErrorSummaryCard;
