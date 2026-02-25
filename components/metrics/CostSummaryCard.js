import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

const CostSummaryCard = ({ costData }) => {
  const totalCost = costData?.totalCost || 0;
  const totalCalls = costData?.totalCalls || 0;
  const costPerThousand = totalCalls > 0 ? (totalCost / totalCalls) * 1000 : 0;
  const topServices = costData?.services?.slice(0, 3) || [];

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Cost Summary (30d)</Text>

      <View style={styles.totalCostContainer}>
        <Text style={styles.totalCostValue}>${totalCost.toFixed(2)}</Text>
        <Text style={styles.totalCostLabel}>Total Spend</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Total Calls</Text>
          <Text style={styles.statValue}>{totalCalls.toLocaleString()}</Text>
        </View>

        <View style={styles.stat}>
          <Text style={styles.statLabel}>Cost per 1K</Text>
          <Text style={styles.statValue}>${costPerThousand.toFixed(3)}</Text>
        </View>
      </View>

      {topServices.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Top Services</Text>
          {topServices.map((service, index) => (
            <View key={index} style={styles.serviceRow}>
              <Text style={styles.serviceName}>{service.service}</Text>
              <Text style={styles.serviceCost}>${service.cost.toFixed(2)}</Text>
            </View>
          ))}
        </>
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
  totalCostContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  totalCostValue: {
    color: colors.primary,
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  totalCostLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  statsRow: {
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
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  serviceName: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  serviceCost: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
});

export default CostSummaryCard;
