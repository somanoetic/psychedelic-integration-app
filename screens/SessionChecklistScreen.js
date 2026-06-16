import React, { useState, useEffect } from 'react';
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
import {
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  Circle,
  Lightbulb,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, gradients, spacing, borderRadius, shadows, typography } from '../theme/colors';
import { useSessionChecklist } from '../useSessionChecklist';
import ChecklistHeader from '../components/checklist/ChecklistHeader';
import ChecklistItemsList from '../components/checklist/ChecklistItemsList';
import AddItemModal from '../components/checklist/AddItemModal';

// Local override flag — when the user explicitly taps "Mark Checklist Complete"
// we persist this so SessionPreparationScreen treats the section as done even
// if some items are unchecked or N/A markers are local-only.
const checklistDoneKey = (sessionId) => `checklist_user_complete_${sessionId}`;

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
  const [userMarkedComplete, setUserMarkedComplete] = useState(false);

  const {
    checklist,
    loading,
    error,
    syncing,
    offline,
    toggleItem,
    toggleItemNA,
    addItem,
    deleteItem,
    retry,
  } = useSessionChecklist(sessionId, context);

  // Hydrate the "user marked complete" flag from AsyncStorage on mount so
  // returning to this screen reflects the prior state.
  useEffect(() => {
    if (!sessionId) return;
    AsyncStorage.getItem(checklistDoneKey(sessionId))
      .then((val) => setUserMarkedComplete(val === 'true'))
      .catch((err) => console.error('Error loading checklist done flag:', err));
  }, [sessionId]);

  const handleToggleComplete = async () => {
    if (!sessionId) return;
    const next = !userMarkedComplete;
    setUserMarkedComplete(next);
    try {
      if (next) {
        await AsyncStorage.setItem(checklistDoneKey(sessionId), 'true');
      } else {
        await AsyncStorage.removeItem(checklistDoneKey(sessionId));
      }
    } catch (err) {
      console.error('Error saving checklist done flag:', err);
    }
    // After locking it in, return to the Session Preparation overview so
    // the user sees the section marked complete in context.
    if (next) {
      navigation.goBack();
    }
  };

  // Handle item toggle
  const handleToggleItem = (itemId) => {
    toggleItem(itemId);
  };

  const handleToggleItemNA = (itemId) => {
    toggleItemNA(itemId);
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

  // Plain back-arrow header, matching the Sessions hub (dark icon on the
  // soft gradient backdrop — no heavy gradient bar).
  const renderBackHeader = () => (
    <View style={styles.headerRow}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );

  // Loading state
  if (loading && !checklist) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient
          colors={gradients.standard}
          start={gradients.standardStart}
          end={gradients.standardEnd}
          style={styles.gradientFill}
        >
          {renderBackHeader()}
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading checklist...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !checklist) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient
          colors={gradients.standard}
          start={gradients.standardStart}
          end={gradients.standardEnd}
          style={styles.gradientFill}
        >
          {renderBackHeader()}
          <View style={styles.errorContainer}>
            <AlertCircle size={64} color={colors.error} strokeWidth={1.5} />
            <Text style={styles.errorTitle}>Failed to Load</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={retry}>
              <RefreshCw size={20} color={colors.textInverse} strokeWidth={2} />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { paddingBottom: insets.bottom }]}
      edges={['top']}
    >
      <LinearGradient
        colors={gradients.standard}
        start={gradients.standardStart}
        end={gradients.standardEnd}
        style={styles.gradientFill}
      >
      {renderBackHeader()}

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <AlertCircle size={20} color={colors.error} strokeWidth={2} />
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Hero title */}
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Session Checklist</Text>
            {sessionData?.title && (
              <Text style={styles.heroSubtitle}>{sessionData.title}</Text>
            )}
          </View>

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
              onToggleItemNA={handleToggleItemNA}
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
            <PlusCircle size={24} color={colors.primary} strokeWidth={2} />
            <Text style={styles.addButtonText}>Add Custom Item</Text>
          </TouchableOpacity>

          {/* Mark Complete button — locks in the checklist as done so the
              prep overview can advance even if some items are unchecked. */}
          <TouchableOpacity
            style={[
              styles.markCompleteButton,
              userMarkedComplete && styles.markCompleteButtonActive,
            ]}
            onPress={handleToggleComplete}
            activeOpacity={0.7}
          >
            {userMarkedComplete ? (
              <CheckCircle2 size={22} color={colors.textInverse} strokeWidth={2} />
            ) : (
              <Circle size={22} color={colors.textInverse} strokeWidth={2} />
            )}
            <Text style={styles.markCompleteText}>
              {userMarkedComplete ? 'Checklist Complete ✓' : 'Mark Checklist Complete'}
            </Text>
          </TouchableOpacity>

          {/* Tip box */}
          <View style={styles.tipBox}>
            <Lightbulb size={20} color={colors.golden} strokeWidth={2} />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Preparation Tips</Text>
              <Text style={styles.tipText}>
                • Customize this checklist for your unique needs{'\n'}
                • Essential items are marked with a badge{'\n'}
                • Tap "N/A" on items that don't apply (Safety items always require confirmation){'\n'}
                • Your progress syncs automatically{'\n'}
                • Come back to this checklist anytime
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      </LinearGradient>

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
  },
  gradientFill: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  backButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: typography.serif,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
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
  markCompleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  markCompleteButtonActive: {
    backgroundColor: colors.success,
  },
  markCompleteText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textInverse,
    letterSpacing: 0.3,
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
