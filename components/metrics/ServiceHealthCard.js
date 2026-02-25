import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

const ServiceHealthCard = ({ service }) => {
  const isHealthy = service.success_rate > 95;
  const statusColor = isHealthy ? colors.success : colors.warning;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.serviceName}>{service.service_name}</Text>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Calls (7d)</Text>
          <Text style={styles.statValue}>{service.total_calls?.toLocaleString() || '0'}</Text>
        </View>

        <View style={styles.stat}>
          <Text style={styles.statLabel}>Success Rate</Text>
          <Text style={[styles.statValue, { color: statusColor }]}>
            {service.success_rate ? `${service.success_rate.toFixed(1)}%` : '0%'}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Avg Duration</Text>
          <Text style={styles.statValue}>
            {service.avg_duration_ms ? `${Math.round(service.avg_duration_ms)}ms` : '0ms'}
          </Text>
        </View>

        <View style={styles.stat}>
          <Text style={styles.statLabel}>Total Cost</Text>
          <Text style={styles.statValue}>
            ${service.total_cost ? service.total_cost.toFixed(2) : '0.00'}
          </Text>
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
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: 4,
  },
  statValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ServiceHealthCard;
