import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import sessionChecklistService from './lib/sessionChecklistService';
import { generateContextItems } from './lib/contextChecklistItems';

/**
 * Custom hook for managing session checklist state with optimistic updates.
 *
 * Features:
 * - Loads checklist from database with AsyncStorage cache
 * - Optimistic UI updates with automatic rollback on error
 * - Offline support via cached data
 * - Real-time sync status tracking
 *
 * @param {string} sessionId - UUID of the session
 * @param {Object} [context] - Session context for generating extra items
 * @param {string} [context.medicine] - Medicine/substance name
 * @param {string} [context.setting] - Location
 * @param {string} [context.facilitator] - Facilitator type
 * @returns {Object} Checklist state and actions
 */
export const useSessionChecklist = (sessionId, context) => {
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [offline, setOffline] = useState(false);

  const checklistRef = useRef(null);
  const cacheKey = `checklist_${sessionId}`;

  // Load from cache first, then fetch from database
  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    loadChecklist();
  }, [sessionId]);

  const loadChecklist = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to load from cache first for instant display
      const cached = await loadFromCache();
      if (cached) {
        setChecklist(cached);
        setLoading(false);
      }

      // Then fetch fresh data from database
      const fresh = await sessionChecklistService.getOrCreateChecklist(sessionId);

      if (fresh) {
        setChecklist(fresh);
        checklistRef.current = fresh;
        await saveToCache(fresh);
        setOffline(false);

        // Inject context-aware items if context provided and not already injected
        await injectContextItems(fresh);
      } else if (!cached) {
        throw new Error('Failed to load checklist');
      } else {
        // We have cached data but network failed
        setOffline(true);
      }
    } catch (err) {
      console.error('Error loading checklist:', err);
      setError(err.message || 'Failed to load checklist');
      setOffline(true);
    } finally {
      setLoading(false);
    }
  };

  const loadFromCache = async () => {
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (err) {
      console.error('Error loading from cache:', err);
      return null;
    }
  };

  const saveToCache = async (data) => {
    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (err) {
      console.error('Error saving to cache:', err);
    }
  };

  /**
   * Inject context-aware items (medicine/setting/facilitator-specific).
   * Runs once per session to avoid duplicates.
   */
  const injectContextItems = async (currentChecklist) => {
    if (!context || (!context.medicine && !context.setting && !context.facilitator)) return;
    if (!currentChecklist?.id) return;

    // Check if we already injected context items for this checklist
    const injectedKey = `context_injected_${currentChecklist.id}`;
    const alreadyInjected = await AsyncStorage.getItem(injectedKey);
    if (alreadyInjected) return;

    const contextItems = generateContextItems(context);
    if (contextItems.length === 0) return;

    // Filter out items that already exist (by title match) to prevent duplicates
    const existingTitles = new Set(
      (currentChecklist.items || []).map(i => i.title.toLowerCase())
    );
    const newItems = contextItems.filter(
      item => !existingTitles.has(item.title.toLowerCase())
    );

    if (newItems.length === 0) {
      await AsyncStorage.setItem(injectedKey, 'true');
      return;
    }

    // Add each context item to the DB
    for (const item of newItems) {
      try {
        await sessionChecklistService.addCustomItem(currentChecklist.id, {
          title: item.title,
          description: item.description,
          category: item.category,
        });
      } catch (err) {
        console.error('Error injecting context item:', err);
      }
    }

    // Mark as injected so we don't repeat
    await AsyncStorage.setItem(injectedKey, 'true');

    // Refresh checklist from DB to get accurate counters
    const refreshed = await sessionChecklistService.getOrCreateChecklist(sessionId);
    if (refreshed) {
      setChecklist(refreshed);
      checklistRef.current = refreshed;
      await saveToCache(refreshed);
    }
  };

  /**
   * Toggle item completion with optimistic update and rollback.
   */
  const toggleItem = useCallback(async (itemId) => {
    if (!checklist) return;

    // Find the item
    const item = checklist.items.find(i => i.id === itemId);
    if (!item) return;

    const newCheckedState = !item.isChecked;

    // Optimistic update
    const previousChecklist = { ...checklist };
    const updatedItems = checklist.items.map(i =>
      i.id === itemId
        ? { ...i, isChecked: newCheckedState, checkedAt: newCheckedState ? new Date().toISOString() : null }
        : i
    );

    const newCompletedCount = updatedItems.filter(i => i.isChecked).length;
    const optimisticChecklist = {
      ...checklist,
      items: updatedItems,
      completedItems: newCompletedCount,
      completionPercentage: Math.round((newCompletedCount / checklist.totalItems) * 100),
      isComplete: newCompletedCount === checklist.totalItems
    };

    setChecklist(optimisticChecklist);
    checklistRef.current = optimisticChecklist;
    await saveToCache(optimisticChecklist);

    // Sync to database
    try {
      setSyncing(true);
      const updated = await sessionChecklistService.toggleItemCompletion(itemId, newCheckedState);

      if (!updated) {
        throw new Error('Failed to update item');
      }

      // Refresh full checklist to get updated counters
      const refreshed = await sessionChecklistService.getOrCreateChecklist(sessionId);
      if (refreshed) {
        setChecklist(refreshed);
        checklistRef.current = refreshed;
        await saveToCache(refreshed);
      }
    } catch (err) {
      console.error('Error toggling item:', err);

      // Rollback optimistic update
      setChecklist(previousChecklist);
      checklistRef.current = previousChecklist;
      await saveToCache(previousChecklist);

      setError('Failed to update item. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSyncing(false);
    }
  }, [checklist, sessionId]);

  /**
   * Add a custom item with optimistic update.
   */
  const addItem = useCallback(async (itemData) => {
    if (!checklist) return false;

    const tempId = `temp_${Date.now()}`;
    const optimisticItem = {
      id: tempId,
      checklistId: checklist.id,
      title: itemData.title,
      description: itemData.description || '',
      category: itemData.category || 'practical',
      sortOrder: checklist.items.length * 10 + 10,
      isCustom: true,
      isEssential: false,
      isChecked: false,
      checkedAt: null,
      createdAt: new Date().toISOString()
    };

    const previousChecklist = { ...checklist };
    const optimisticChecklist = {
      ...checklist,
      items: [...checklist.items, optimisticItem],
      totalItems: checklist.totalItems + 1,
      completionPercentage: Math.round((checklist.completedItems / (checklist.totalItems + 1)) * 100)
    };

    setChecklist(optimisticChecklist);
    checklistRef.current = optimisticChecklist;
    await saveToCache(optimisticChecklist);

    try {
      setSyncing(true);
      const newItem = await sessionChecklistService.addCustomItem(checklist.id, itemData);

      if (!newItem) {
        throw new Error('Failed to create item');
      }

      // Replace temp item with real item
      const updatedItems = optimisticChecklist.items.map(i =>
        i.id === tempId ? newItem : i
      );

      const finalChecklist = {
        ...optimisticChecklist,
        items: updatedItems
      };

      setChecklist(finalChecklist);
      checklistRef.current = finalChecklist;
      await saveToCache(finalChecklist);

      return true;
    } catch (err) {
      console.error('Error adding item:', err);

      // Rollback
      setChecklist(previousChecklist);
      checklistRef.current = previousChecklist;
      await saveToCache(previousChecklist);

      setError(err.message || 'Failed to add item');
      setTimeout(() => setError(null), 3000);

      return false;
    } finally {
      setSyncing(false);
    }
  }, [checklist]);

  /**
   * Update item title/description with optimistic update.
   */
  const updateItem = useCallback(async (itemId, updates) => {
    if (!checklist) return false;

    const previousChecklist = { ...checklist };
    const updatedItems = checklist.items.map(i =>
      i.id === itemId ? { ...i, ...updates } : i
    );

    const optimisticChecklist = {
      ...checklist,
      items: updatedItems
    };

    setChecklist(optimisticChecklist);
    checklistRef.current = optimisticChecklist;
    await saveToCache(optimisticChecklist);

    try {
      setSyncing(true);
      const updated = await sessionChecklistService.updateItem(itemId, updates);

      if (!updated) {
        throw new Error('Failed to update item');
      }

      return true;
    } catch (err) {
      console.error('Error updating item:', err);

      // Rollback
      setChecklist(previousChecklist);
      checklistRef.current = previousChecklist;
      await saveToCache(previousChecklist);

      setError(err.message || 'Failed to update item');
      setTimeout(() => setError(null), 3000);

      return false;
    } finally {
      setSyncing(false);
    }
  }, [checklist]);

  /**
   * Delete item with optimistic update.
   */
  const deleteItem = useCallback(async (itemId) => {
    if (!checklist) return false;

    const previousChecklist = { ...checklist };
    const itemToDelete = checklist.items.find(i => i.id === itemId);
    const updatedItems = checklist.items.filter(i => i.id !== itemId);

    const wasChecked = itemToDelete?.isChecked || false;
    const newCompletedCount = wasChecked ? checklist.completedItems - 1 : checklist.completedItems;

    const optimisticChecklist = {
      ...checklist,
      items: updatedItems,
      totalItems: checklist.totalItems - 1,
      completedItems: newCompletedCount,
      completionPercentage: updatedItems.length > 0
        ? Math.round((newCompletedCount / (checklist.totalItems - 1)) * 100)
        : 0
    };

    setChecklist(optimisticChecklist);
    checklistRef.current = optimisticChecklist;
    await saveToCache(optimisticChecklist);

    try {
      setSyncing(true);
      const success = await sessionChecklistService.deleteItem(itemId);

      if (!success) {
        throw new Error('Failed to delete item');
      }

      return true;
    } catch (err) {
      console.error('Error deleting item:', err);

      // Rollback
      setChecklist(previousChecklist);
      checklistRef.current = previousChecklist;
      await saveToCache(previousChecklist);

      setError('Failed to delete item');
      setTimeout(() => setError(null), 3000);

      return false;
    } finally {
      setSyncing(false);
    }
  }, [checklist]);

  /**
   * Retry loading after error.
   */
  const retry = useCallback(() => {
    loadChecklist();
  }, [sessionId]);

  return {
    checklist,
    loading,
    error,
    syncing,
    offline,
    toggleItem,
    addItem,
    updateItem,
    deleteItem,
    retry
  };
};

export default useSessionChecklist;
