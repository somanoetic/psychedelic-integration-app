import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

const SystemOverviewCard = ({ totalCalls, successRate, avgResponseTime }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>System Overview (24h)</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalCalls?.toLocaleString() || '0'}</Text>
          <Text style={styles.statLabel}>Total Calls</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {successRate ? `${successRate.toFixed(1)}%` : '0%'}
          </Text>
          <Text style={styles.statLabel}>Success Rate</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {avgResponseTime ? `${Math.round(avgResponseTime)}ms` : '0ms'}
          </Text>
          <Text style={styles.statLabel}>Avg Response</Text>
        </View>
      </View>
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
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
});

export default SystemOverviewCard;
