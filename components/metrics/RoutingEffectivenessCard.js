import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

const RoutingEffectivenessCard = ({ routingData }) => {
  const avgConfidence = routingData?.avgConfidence || 0;
  const totalDecisions = routingData?.totalDecisions || 0;
  const mostCommonRoute = routingData?.mostCommonRoute || 'N/A';
  const lowConfidenceCount = routingData?.lowConfidenceCount || 0;

  const hasLowConfidence = lowConfidenceCount > 0;
  const confidenceColor = avgConfidence >= 70 ? colors.success : colors.warning;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Routing Effectiveness (7d)</Text>

      <View style={styles.confidenceContainer}>
        <Text style={[styles.confidenceValue, { color: confidenceColor }]}>
          {avgConfidence}%
        </Text>
        <Text style={styles.confidenceLabel}>Avg Confidence</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Total Decisions</Text>
          <Text style={styles.statValue}>{totalDecisions.toLocaleString()}</Text>
        </View>

        <View style={styles.stat}>
          <Text style={styles.statLabel}>Low Confidence</Text>
          <Text style={[styles.statValue, hasLowConfidence && { color: colors.warning }]}>
            {lowConfidenceCount}
          </Text>
        </View>
      </View>

      <View style={styles.routeContainer}>
        <Text style={styles.routeLabel}>Most Common Route</Text>
        <Text style={styles.routeValue} numberOfLines={2}>
          {mostCommonRoute}
        </Text>
      </View>

      {hasLowConfidence && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            {lowConfidenceCount} decisions with low confidence (&lt;70%)
          </Text>
        </View>
      )}
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
  confidenceContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  confidenceValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  confidenceLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  routeContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  routeLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  routeValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  warningBanner: {
    backgroundColor: 'rgba(212, 165, 92, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    padding: 12,
    marginTop: 12,
    borderRadius: 6,
  },
  warningText: {
    color: colors.warning,
    fontSize: 13,
  },
});

export default RoutingEffectivenessCard;
