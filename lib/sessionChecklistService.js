import { supabase } from './supabase';

/**
 * Session Checklist Service
 *
 * Provides a clean API for managing session preparation checklists.
 * Abstracts Supabase client calls, handles error transformation,
 * and provides data transformation between DB schema and frontend models.
 *
 * Related tables:
 * - session_checklists: Checklist header (one per session)
 * - session_checklist_items: Individual items (template + custom)
 * - checklist_template_items: Default template (read-only)
 */
class SessionChecklistService {
  /**
   * Get or create a checklist for a session.
   *
   * This method is idempotent - it will return an existing checklist if one exists,
   * or create a new one by cloning template items via the database RPC function.
   *
   * @param {string} sessionId - UUID of the session
   * @returns {Promise<Object>} Checklist with nested items, or null if error
   *
   * @example
   * const checklist = await getOrCreateChecklist('session-uuid');
   * // Returns: { id, session_id, total_items, completed_items, items: [...] }
   */
  async getOrCreateChecklist(sessionId) {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error('Not authenticated:', authError);
        return null;
      }

      // Step 1: Try to fetch existing checklist
      const { data: existing, error: fetchError } = await supabase
        .from('session_checklists')
        .select(`
          *,
          session_checklist_items (
            id,
            title,
            description,
            category,
            sort_order,
            is_essential,
            is_custom,
            is_checked,
            checked_at,
            created_at
          )
        `)
        .eq('session_id', sessionId)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existing) {
        // Sort items by sort_order for consistent display
        existing.items = this._sortItems(existing.session_checklist_items || []);
        delete existing.session_checklist_items;
        return this._transformChecklistFromDB(existing);
      }

      // Step 2: Create new checklist via RPC function (atomic creation)
      const { data: checklistId, error: createError } = await supabase
        .rpc('create_session_checklist', {
          p_session_id: sessionId,
          p_user_id: user.id
        });

      if (createError) {
        // Transform common errors into user-friendly messages
        if (createError.message?.includes('does not belong to user')) {
          throw new Error('You do not have permission to create a checklist for this session.');
        }
        throw createError;
      }

      // Step 3: Fetch the newly created checklist with items
      const { data: newChecklist, error: refetchError } = await supabase
        .from('session_checklists')
        .select(`
          *,
          session_checklist_items (
            id,
            title,
            description,
            category,
            sort_order,
            is_essential,
            is_custom,
            is_checked,
            checked_at,
            created_at
          )
        `)
        .eq('id', checklistId)
        .single();

      if (refetchError) {
        throw refetchError;
      }

      newChecklist.items = this._sortItems(newChecklist.session_checklist_items || []);
      delete newChecklist.session_checklist_items;
      return this._transformChecklistFromDB(newChecklist);

    } catch (error) {
      console.error('Error in getOrCreateChecklist:', error);
      return null;
    }
  }

  /**
   * Get checklist by checklist ID with all items.
   *
   * Use this when you already have the checklist ID.
   * If you only have the session ID, use getOrCreateChecklist instead.
   *
   * @param {string} checklistId - UUID of the checklist
   * @returns {Promise<Object|null>} Checklist with items, or null if not found/error
   */
  async getChecklistWithItems(checklistId) {
    try {
      const { data, error } = await supabase
        .from('session_checklists')
        .select(`
          *,
          session_checklist_items (
            id,
            title,
            description,
            category,
            sort_order,
            is_essential,
            is_custom,
            is_checked,
            checked_at,
            created_at
          )
        `)
        .eq('id', checklistId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw error;
      }

      data.items = this._sortItems(data.session_checklist_items || []);
      delete data.session_checklist_items;
      return this._transformChecklistFromDB(data);

    } catch (error) {
      console.error('Error in getChecklistWithItems:', error);
      return null;
    }
  }

  /**
   * Toggle an item's completion status.
   *
   * The database trigger automatically updates parent checklist counters
   * (total_items, completed_items, completed_at).
   *
   * @param {string} itemId - UUID of the checklist item
   * @param {boolean} isCompleted - New completion state
   * @returns {Promise<Object|null>} Updated item, or null if error
   */
  async toggleItemCompletion(itemId, isCompleted) {
    try {
      const { data, error } = await supabase
        .from('session_checklist_items')
        .update({
          is_checked: isCompleted,
          checked_at: isCompleted ? new Date().toISOString() : null
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        // Transform RLS errors into user-friendly messages
        if (error.code === 'PGRST301' || error.message?.includes('permission denied')) {
          throw new Error('You do not have permission to update this item.');
        }
        throw error;
      }

      return this._transformItemFromDB(data);

    } catch (error) {
      console.error('Error in toggleItemCompletion:', error);
      return null;
    }
  }

  /**
   * Add a custom checklist item.
   *
   * Custom items are appended to the end of the checklist with is_custom=true.
   * The database trigger automatically increments the parent total_items counter.
   *
   * @param {string} checklistId - UUID of the parent checklist
   * @param {Object} itemData - { title, description?, category? }
   * @param {string} itemData.title - Item title (required, max 200 chars)
   * @param {string} [itemData.description=''] - Item description (max 500 chars)
   * @param {string} [itemData.category='practical'] - Category: physical, safety, mental, or practical
   * @returns {Promise<Object|null>} Newly created item, or null if error
   */
  async addCustomItem(checklistId, itemData) {
    try {
      // Validate required fields
      if (!itemData.title || itemData.title.trim().length === 0) {
        throw new Error('Item title is required.');
      }

      if (itemData.title.length > 200) {
        throw new Error('Item title must be 200 characters or less.');
      }

      if (itemData.description && itemData.description.length > 500) {
        throw new Error('Item description must be 500 characters or less.');
      }

      // Enforce 50-item limit at application layer
      const { count, error: countError } = await supabase
        .from('session_checklist_items')
        .select('*', { count: 'exact', head: true })
        .eq('checklist_id', checklistId);

      if (countError) {
        throw countError;
      }

      if (count >= 50) {
        throw new Error('Maximum of 50 items per checklist reached.');
      }

      // Get max sort_order to position at end
      const { data: maxOrderData, error: maxOrderError } = await supabase
        .from('session_checklist_items')
        .select('sort_order')
        .eq('checklist_id', checklistId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (maxOrderError && maxOrderError.code !== 'PGRST116') {
        throw maxOrderError;
      }

      const nextOrder = (maxOrderData?.sort_order ?? 0) + 10;

      // Insert the custom item
      const { data, error } = await supabase
        .from('session_checklist_items')
        .insert({
          checklist_id: checklistId,
          title: itemData.title.trim(),
          description: itemData.description?.trim() || '',
          category: itemData.category || 'practical',
          sort_order: nextOrder,
          is_custom: true,
          is_essential: false,
          is_checked: false
        })
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST301' || error.message?.includes('permission denied')) {
          throw new Error('You do not have permission to add items to this checklist.');
        }
        if (error.message?.includes('checklist_item_valid_category')) {
          throw new Error('Invalid category. Must be: physical, safety, mental, or practical.');
        }
        throw error;
      }

      return this._transformItemFromDB(data);

    } catch (error) {
      console.error('Error in addCustomItem:', error);
      throw error; // Throw so caller can display validation errors to user
    }
  }

  /**
   * Update an item's title and/or description.
   *
   * Only title and description can be updated. Completion status should
   * be updated via toggleItemCompletion instead.
   *
   * @param {string} itemId - UUID of the item
   * @param {Object} updates - { title?, description? }
   * @param {string} [updates.title] - New title (max 200 chars)
   * @param {string} [updates.description] - New description (max 500 chars)
   * @returns {Promise<Object|null>} Updated item, or null if error
   */
  async updateItem(itemId, updates) {
    try {
      const updateData = {};

      if (updates.title !== undefined) {
        if (updates.title.trim().length === 0) {
          throw new Error('Item title cannot be empty.');
        }
        if (updates.title.length > 200) {
          throw new Error('Item title must be 200 characters or less.');
        }
        updateData.title = updates.title.trim();
      }

      if (updates.description !== undefined) {
        if (updates.description.length > 500) {
          throw new Error('Item description must be 500 characters or less.');
        }
        updateData.description = updates.description.trim();
      }

      if (Object.keys(updateData).length === 0) {
        throw new Error('No updates provided.');
      }

      const { data, error } = await supabase
        .from('session_checklist_items')
        .update(updateData)
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST301' || error.message?.includes('permission denied')) {
          throw new Error('You do not have permission to update this item.');
        }
        throw error;
      }

      return this._transformItemFromDB(data);

    } catch (error) {
      console.error('Error in updateItem:', error);
      throw error;
    }
  }

  /**
   * Delete a checklist item.
   *
   * Only custom items should be deleted via the UI. Template-cloned items
   * can be deleted but this may confuse users (consider hiding instead in UI).
   * The database trigger automatically updates parent counters.
   *
   * @param {string} itemId - UUID of the item to delete
   * @returns {Promise<boolean>} True if deleted successfully, false otherwise
   */
  async deleteItem(itemId) {
    try {
      const { error } = await supabase
        .from('session_checklist_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        if (error.code === 'PGRST301' || error.message?.includes('permission denied')) {
          throw new Error('You do not have permission to delete this item.');
        }
        throw error;
      }

      return true;

    } catch (error) {
      console.error('Error in deleteItem:', error);
      return false;
    }
  }

  /**
   * Get all checklists for the current user.
   *
   * Returns checklists ordered by most recently updated.
   * Useful for a "my checklists" overview screen.
   *
   * @returns {Promise<Array>} Array of checklist headers (without items)
   */
  async getUserChecklists() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return [];
      }

      const { data, error } = await supabase
        .from('session_checklists')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []).map(checklist => this._transformChecklistFromDB(checklist));

    } catch (error) {
      console.error('Error in getUserChecklists:', error);
      return [];
    }
  }

  /**
   * Get incomplete checklists for the current user.
   *
   * Returns checklists where completed_at IS NULL.
   * Useful for reminders or "finish your preparation" nudges.
   *
   * @returns {Promise<Array>} Array of incomplete checklist headers
   */
  async getIncompleteChecklists() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return [];
      }

      const { data, error } = await supabase
        .from('session_checklists')
        .select('*')
        .eq('user_id', user.id)
        .is('completed_at', null)
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []).map(checklist => this._transformChecklistFromDB(checklist));

    } catch (error) {
      console.error('Error in getIncompleteChecklists:', error);
      return [];
    }
  }

  /**
   * Get the default template items (read-only reference).
   *
   * Fetches the current active template items from the database.
   * Useful for previewing the default checklist before session creation.
   *
   * @returns {Promise<Array>} Array of template items
   */
  async getTemplateItems() {
    try {
      const { data, error } = await supabase
        .from('checklist_template_items')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        throw error;
      }

      return (data || []).map(item => this._transformItemFromDB(item));

    } catch (error) {
      console.error('Error in getTemplateItems:', error);
      return [];
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Transform checklist from database schema to frontend model.
   *
   * Converts snake_case to camelCase and formats dates.
   *
   * @private
   * @param {Object} dbChecklist - Raw checklist from database
   * @returns {Object} Transformed checklist for frontend
   */
  _transformChecklistFromDB(dbChecklist) {
    if (!dbChecklist) return null;

    return {
      id: dbChecklist.id,
      sessionId: dbChecklist.session_id,
      userId: dbChecklist.user_id,
      templateVersion: dbChecklist.template_version,
      totalItems: dbChecklist.total_items,
      completedItems: dbChecklist.completed_items,
      createdAt: dbChecklist.created_at,
      updatedAt: dbChecklist.updated_at,
      completedAt: dbChecklist.completed_at,
      items: (dbChecklist.items || []).map(item => this._transformItemFromDB(item)),
      // Computed properties for convenience
      isComplete: dbChecklist.completed_at !== null,
      completionPercentage: dbChecklist.total_items > 0
        ? Math.round((dbChecklist.completed_items / dbChecklist.total_items) * 100)
        : 0
    };
  }

  /**
   * Transform checklist item from database schema to frontend model.
   *
   * @private
   * @param {Object} dbItem - Raw item from database
   * @returns {Object} Transformed item for frontend
   */
  _transformItemFromDB(dbItem) {
    if (!dbItem) return null;

    return {
      id: dbItem.id,
      checklistId: dbItem.checklist_id,
      templateItemId: dbItem.template_item_id,
      title: dbItem.title,
      description: dbItem.description,
      category: dbItem.category,
      sortOrder: dbItem.sort_order,
      isEssential: dbItem.is_essential,
      isCustom: dbItem.is_custom,
      isChecked: dbItem.is_checked,
      checkedAt: dbItem.checked_at,
      createdAt: dbItem.created_at
    };
  }

  /**
   * Sort items by sort_order.
   *
   * @private
   * @param {Array} items - Array of items to sort
   * @returns {Array} Sorted items
   */
  _sortItems(items) {
    return [...items].sort((a, b) => a.sort_order - b.sort_order);
  }
}

// Export singleton instance
export default new SessionChecklistService();
