import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, gradients } from '../theme/colors';
import metricsService from '../lib/metricsService';
import userRoleService from '../lib/userRoleService';

// Import card components
import SystemOverviewCard from '../components/metrics/SystemOverviewCard';
import ServiceHealthCard from '../components/metrics/ServiceHealthCard';
import CostSummaryCard from '../components/metrics/CostSummaryCard';
import ErrorSummaryCard from '../components/metrics/ErrorSummaryCard';
import RoutingEffectivenessCard from '../components/metrics/RoutingEffectivenessCard';


const REFRESH_INTERVAL = 30000; // 30 seconds

const AdminMetricsDashboard = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Data state
  const [serviceHealth, setServiceHealth] = useState([]);
  const [costSummary, setCostSummary] = useState(null);
  const [topErrors, setTopErrors] = useState([]);
  const [routingQuality, setRoutingQuality] = useState(null);

  // Check admin access
  useEffect(() => {
    checkAdminAccess();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!loading && !error) {
      const interval = setInterval(() => {
        loadData();
      }, REFRESH_INTERVAL);

      return () => clearInterval(interval);
    }
  }, [loading, error]);

  const checkAdminAccess = async () => {
    try {
      const isAdmin = await userRoleService.isAdmin();

      if (!isAdmin) {
        Alert.alert(
          'Access Denied',
          'You must be an admin to access this dashboard.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ],
          { cancelable: false }
        );
        return;
      }

      // User is admin, load data
      await loadData();
    } catch (err) {
      console.error('[AdminMetricsDashboard] Error checking admin access:', err);
      setError('Failed to verify admin access');
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setError(null);

      // Fetch all data in parallel
      const [healthData, costData, errorsData, routingData] = await Promise.all([
        metricsService.getServiceHealth(),
        metricsService.getCostSummary('30d'),
        metricsService.getTopErrors(),
        metricsService.getRoutingQuality(),
      ]);

      setServiceHealth(healthData);
      setCostSummary(costData);
      setTopErrors(errorsData);
      setRoutingQuality(routingData);
      setLastUpdated(new Date());
      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      console.error('[AdminMetricsDashboard] Error loading data:', err);
      setError(err.message || 'Failed to load metrics');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const handleBack = () => {
    navigation.goBack();
  };

  // Calculate system overview from service health data
  const calculateSystemOverview = () => {
    if (!serviceHealth || serviceHealth.length === 0) {
      return { totalCalls: 0, successRate: 0, avgResponseTime: 0 };
    }

    const last24h = serviceHealth.filter(s => s.total_calls > 0);
    const totalCalls = last24h.reduce((sum, s) => sum + (s.total_calls || 0), 0);
    const totalSuccesses = last24h.reduce((sum, s) => sum + ((s.total_calls || 0) * (s.success_rate || 0) / 100), 0);
    const successRate = totalCalls > 0 ? (totalSuccesses / totalCalls) * 100 : 0;
    const avgResponseTime = last24h.length > 0
      ? last24h.reduce((sum, s) => sum + (s.avg_duration_ms || 0), 0) / last24h.length
      : 0;

    return { totalCalls, successRate, avgResponseTime };
  };

  // Add total calls to cost summary
  const costSummaryWithCalls = costSummary ? {
    ...costSummary,
    totalCalls: serviceHealth.reduce((sum, s) => sum + (s.total_calls || 0), 0)
  } : null;

  if (loading) {
    return (
      <LinearGradient
        colors={gradients.standard}
        start={{ x: 1.0, y: 0.0 }}
        end={{ x: 0.0, y: 1.0 }}
        style={{ flex: 1 }}
      >
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading metrics...</Text>
        </View>
      </SafeAreaView>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient
        colors={gradients.standard}
        start={{ x: 1.0, y: 0.0 }}
        end={{ x: 0.0, y: 1.0 }}
        style={{ flex: 1 }}
      >
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      </LinearGradient>
    );
  }

  const systemOverview = calculateSystemOverview();

  return (
    <LinearGradient
      colors={gradients.standard}
      start={{ x: 1.0, y: 0.0 }}
      end={{ x: 0.0, y: 1.0 }}
      style={{ flex: 1 }}
    >
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Metrics Dashboard</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Last Updated */}
      {lastUpdated && (
        <View style={styles.lastUpdatedContainer}>
          <Text style={styles.lastUpdatedText}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* System Overview */}
        <SystemOverviewCard
          totalCalls={systemOverview.totalCalls}
          successRate={systemOverview.successRate}
          avgResponseTime={systemOverview.avgResponseTime}
        />

        {/* Cost Summary */}
        <CostSummaryCard costData={costSummaryWithCalls} />

        {/* Error Summary */}
        <ErrorSummaryCard errors={topErrors} />

        {/* Routing Effectiveness */}
        <RoutingEffectivenessCard routingData={routingQuality} />

        {/* Service Health Cards */}
        <Text style={styles.sectionTitle}>Service Health (7d)</Text>
        {serviceHealth.length > 0 ? (
          serviceHealth.map((service, index) => (
            <ServiceHealthCard key={index} service={service} />
          ))
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No service health data available</Text>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#353555',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  lastUpdatedContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  lastUpdatedText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  noDataContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  noDataText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default AdminMetricsDashboard;
