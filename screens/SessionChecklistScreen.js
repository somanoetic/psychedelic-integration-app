import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme/colors';
import { useSessionChecklist } from '../useSessionChecklist';
import ChecklistHeader from '../components/checklist/ChecklistHeader';
import ChecklistItemsList from '../components/checklist/ChecklistItemsList';
import AddItemModal from '../components/checklist/AddItemModal';

/**
 * SessionChecklistScreen - Main screen for session preparation checklist
 *
 * Displays checklist with items grouped by category, progress tracking,
 * and ability to add custom items.
 */
const SessionChecklistScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const sessionId = route.params?.sessionId;
  const sessionData = route.params?.sessionData;
  const context = route.params?.context;

  const [addModalVisible, setAddModalVisible] = useState(false);

  const {
    checklist,
    loading,
    error,
    syncing,
    offline,
    toggleItem,
    addItem,
    deleteItem,
    retry,
  } = useSessionChecklist(sessionId, context);

  // Handle item toggle
  const handleToggleItem = (itemId) => {
    toggleItem(itemId);
  };

  // Handle delete item with confirmation
  const handleDeleteItem = (itemId) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this custom item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteItem(itemId),
        },
      ]
    );
  };

  // Handle add item
  const handleAddItem = async (itemData) => {
    const success = await addItem(itemData);
    return success;
  };

  // Loading state
  if (loading && !checklist) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient colors={gradients.warm} start={{ x: 1.0, y: 0.0 }} end={{ x: 0.0, y: 1.0 }} style={styles.headerGradient}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.textInverse} />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>Session Checklist</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading checklist...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !checklist) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient colors={gradients.warm} start={{ x: 1.0, y: 0.0 }} end={{ x: 0.0, y: 1.0 }} style={styles.headerGradient}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.textInverse} />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>Session Checklist</Text>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={colors.error} />
          <Text style={styles.errorTitle}>Failed to Load</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={retry}>
            <MaterialIcons name="refresh" size={20} color={colors.textInverse} />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { paddingBottom: insets.bottom }]}
      edges={['top']}
    >
      {/* Header */}
      <LinearGradient colors={gradients.warm} style={styles.headerGradient}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.heroTitle}>Session Checklist</Text>
        {sessionData?.title && (
          <Text style={styles.heroSubtitle}>{sessionData.title}</Text>
        )}
      </LinearGradient>

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <MaterialIcons name="error-outline" size={20} color={colors.error} />
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Progress header */}
          <ChecklistHeader
            checklist={checklist}
            syncing={syncing}
            offline={offline}
          />

          {/* Info text */}
          <Text style={styles.infoText}>
            Use this checklist to prepare for your session. Check off items as you
            complete them. You can also add your own custom preparation steps.
          </Text>

          {/* Items list */}
          {checklist?.items && checklist.items.length > 0 && (
            <ChecklistItemsList
              items={checklist.items}
              onToggleItem={handleToggleItem}
              onDeleteItem={handleDeleteItem}
              disabled={syncing}
            />
          )}

          {/* Add custom item button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setAddModalVisible(true)}
            disabled={syncing}
            activeOpacity={0.7}
          >
            <MaterialIcons name="add-circle" size={24} color={colors.primary} />
            <Text style={styles.addButtonText}>Add Custom Item</Text>
          </TouchableOpacity>

          {/* Tip box */}
          <View style={styles.tipBox}>
            <MaterialIcons name="lightbulb" size={20} color={colors.golden} />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Preparation Tips</Text>
              <Text style={styles.tipText}>
                • Customize this checklist for your unique needs{'\n'}
                • Essential items are marked with a badge{'\n'}
                • Your progress syncs automatically{'\n'}
                • Come back to this checklist anytime
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Add item modal */}
      <AddItemModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdd={handleAddItem}
        loading={syncing}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    paddingTop: 60,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: spacing.lg,
    zIndex: 10,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textInverse,
    textAlign: 'center',
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.textInverse,
    opacity: 0.9,
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  infoText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.medium,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    color: colors.textInverse,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.golden,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tipText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default SessionChecklistScreen;
