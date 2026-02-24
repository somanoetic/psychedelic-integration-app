/**
 * Integration Tests for Session Checklist API
 *
 * Tests end-to-end API flows including:
 * - Checklist creation and retrieval
 * - Item manipulation (add, update, delete, toggle)
 * - Counter synchronization
 * - Error handling and edge cases
 */

// Mock Supabase before importing
jest.mock('../../lib/supabase');

const sessionChecklistService = require('../../lib/sessionChecklistService').default;
const { supabase } = require('../../lib/supabase');

describe('Session Checklist API Integration', () => {
  const mockUserId = 'test-user-123';
  const mockSessionId = 'test-session-456';
  const mockChecklistId = 'test-checklist-789';

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();

    // Default auth mock
    supabase.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null
    });
  });

  describe('Complete Checklist Lifecycle', () => {
    it('should create, populate, complete, and delete a checklist', async () => {
      // Step 1: Create checklist
      const mockNewChecklist = {
        id: mockChecklistId,
        session_id: mockSessionId,
        user_id: mockUserId,
        template_version: 1,
        total_items: 18,
        completed_items: 0,
        created_at: '2026-02-10T10:00:00Z',
        updated_at: '2026-02-10T10:00:00Z',
        completed_at: null,
        session_checklist_items: []
      };

      let fromCallCount = 0;
      supabase.from = jest.fn(() => {
        fromCallCount++;
        if (fromCallCount === 1) {
          // First call: check for existing (returns null)
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
              })
            })
          };
        } else {
          // Second call: fetch newly created
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockNewChecklist, error: null })
              })
            })
          };
        }
      });

      supabase.rpc = jest.fn().mockResolvedValue({ data: mockChecklistId, error: null });

      const checklist = await sessionChecklistService.getOrCreateChecklist(mockSessionId);
      expect(checklist).toBeDefined();
      expect(checklist.id).toBe(mockChecklistId);
      expect(checklist.totalItems).toBe(18);
      expect(checklist.completedItems).toBe(0);

      // Step 2: Add custom item
      const customItemData = {
        title: 'Bring meditation cushion',
        description: 'For comfortable sitting',
        category: 'practical'
      };

      const mockNewItem = {
        id: 'item-custom-1',
        checklist_id: mockChecklistId,
        title: customItemData.title,
        description: customItemData.description,
        category: customItemData.category,
        sort_order: 500,
        is_custom: true,
        is_essential: false,
        is_checked: false,
        checked_at: null,
        created_at: '2026-02-10T11:00:00Z',
        template_item_id: null
      };

      fromCallCount = 0;
      supabase.from = jest.fn(() => {
        fromCallCount++;
        if (fromCallCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ count: 18, error: null })
            })
          };
        } else if (fromCallCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    maybeSingle: jest.fn().mockResolvedValue({
                      data: { sort_order: 490 },
                      error: null
                    })
                  })
                })
              })
            })
          };
        } else {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockNewItem, error: null })
              })
            })
          };
        }
      });

      const addedItem = await sessionChecklistService.addCustomItem(mockChecklistId, customItemData);
      expect(addedItem).toBeDefined();
      expect(addedItem.isCustom).toBe(true);

      // Step 3: Toggle items to complete
      const mockToggledItem = {
        id: 'item-1',
        checklist_id: mockChecklistId,
        is_checked: true,
        checked_at: '2026-02-10T12:00:00Z',
        title: 'Item 1',
        description: '',
        category: 'physical',
        sort_order: 10,
        is_essential: true,
        is_custom: false,
        created_at: '2026-02-10T10:00:00Z',
        template_item_id: 'template-1'
      };

      supabase.from = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockToggledItem, error: null })
            })
          })
        })
      });

      const toggledItem = await sessionChecklistService.toggleItemCompletion('item-1', true);
      expect(toggledItem).toBeDefined();
      expect(toggledItem.isChecked).toBe(true);

      // Step 4: Delete item
      supabase.from = jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      });

      const deleted = await sessionChecklistService.deleteItem('item-custom-1');
      expect(deleted).toBe(true);
    });
  });

  describe('Optimistic Updates Scenario', () => {
    it('should handle rapid toggles with optimistic UI updates', async () => {
      const itemId = 'item-fast-toggle';
      const baseItem = {
        id: itemId,
        checklist_id: mockChecklistId,
        title: 'Fast Toggle Item',
        description: '',
        category: 'practical',
        sort_order: 100,
        is_essential: false,
        is_custom: false,
        created_at: '2026-02-10T10:00:00Z',
        template_item_id: null
      };

      // Use mockResolvedValueOnce so each call returns a different response
      const mockSingle = jest.fn()
        .mockResolvedValueOnce({ data: { ...baseItem, is_checked: true, checked_at: '2026-02-10T12:00:00Z' }, error: null })
        .mockResolvedValueOnce({ data: { ...baseItem, is_checked: false, checked_at: null }, error: null })
        .mockResolvedValueOnce({ data: { ...baseItem, is_checked: true, checked_at: '2026-02-10T12:00:01Z' }, error: null });

      supabase.from = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: mockSingle
            })
          })
        })
      });

      const result1 = await sessionChecklistService.toggleItemCompletion(itemId, true);
      expect(result1.isChecked).toBe(true);

      const result2 = await sessionChecklistService.toggleItemCompletion(itemId, false);
      expect(result2.isChecked).toBe(false);

      const result3 = await sessionChecklistService.toggleItemCompletion(itemId, true);
      expect(result3.isChecked).toBe(true);
    });
  });

  describe('Batch Operations', () => {
    it('should handle adding multiple custom items in sequence', async () => {
      const customItems = [
        { title: 'Item 1', category: 'physical' },
        { title: 'Item 2', category: 'mental' },
        { title: 'Item 3', category: 'practical' }
      ];

      let itemCount = 0;
      const addedItems = [];

      for (const itemData of customItems) {
        const mockNewItem = {
          id: `item-${itemCount++}`,
          checklist_id: mockChecklistId,
          title: itemData.title,
          description: '',
          category: itemData.category,
          sort_order: 500 + (itemCount * 10),
          is_custom: true,
          is_essential: false,
          is_checked: false,
          checked_at: null,
          created_at: '2026-02-10T11:00:00Z',
          template_item_id: null
        };

        let fromCallCount = 0;
        supabase.from = jest.fn(() => {
          fromCallCount++;
          if (fromCallCount === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ count: 18 + itemCount, error: null })
              })
            };
          } else if (fromCallCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    limit: jest.fn().mockReturnValue({
                      maybeSingle: jest.fn().mockResolvedValue({
                        data: { sort_order: 490 + (itemCount * 10) },
                        error: null
                      })
                    })
                  })
                })
              })
            };
          } else {
            return {
              insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: mockNewItem, error: null })
                })
              })
            };
          }
        });

        const result = await sessionChecklistService.addCustomItem(mockChecklistId, itemData);
        addedItems.push(result);
      }

      expect(addedItems).toHaveLength(3);
      expect(addedItems[0].title).toBe('Item 1');
      expect(addedItems[1].title).toBe('Item 2');
      expect(addedItems[2].title).toBe('Item 3');
    });
  });

  describe('Error Recovery', () => {
    it('should handle network timeout gracefully', async () => {
      supabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockRejectedValue(new Error('Network timeout'))
          })
        })
      });

      const result = await sessionChecklistService.getOrCreateChecklist(mockSessionId);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Error in getOrCreateChecklist:',
        expect.any(Error)
      );
    });

    it('should handle RLS policy violation', async () => {
      supabase.from = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST301', message: 'permission denied for table session_checklist_items' }
              })
            })
          })
        })
      });

      const result = await sessionChecklistService.toggleItemCompletion('item-unauthorized', true);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle constraint violation on add', async () => {
      const itemData = {
        title: 'Invalid Item',
        category: 'invalid_category' // Will fail constraint
      };

      supabase.from = jest.fn(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 5, error: null })
        })
      }));

      let fromCallCount = 0;
      supabase.from = jest.fn(() => {
        fromCallCount++;
        if (fromCallCount <= 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue(
                fromCallCount === 1
                  ? { count: 5, error: null }
                  : {
                      data: { sort_order: 100 },
                      error: null,
                      order: jest.fn().mockReturnThis(),
                      limit: jest.fn().mockReturnThis(),
                      maybeSingle: jest.fn().mockResolvedValue({ data: { sort_order: 100 }, error: null })
                    }
              )
            })
          };
        } else {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: {
                    message: 'new row violates check constraint "checklist_item_valid_category"'
                  }
                })
              })
            })
          };
        }
      });

      fromCallCount = 0;
      supabase.from = jest.fn(() => {
        fromCallCount++;
        if (fromCallCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ count: 5, error: null })
            })
          };
        } else if (fromCallCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    maybeSingle: jest.fn().mockResolvedValue({
                      data: { sort_order: 100 },
                      error: null
                    })
                  })
                })
              })
            })
          };
        } else {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: {
                    message: 'new row violates check constraint "checklist_item_valid_category"'
                  }
                })
              })
            })
          };
        }
      });

      await expect(
        sessionChecklistService.addCustomItem(mockChecklistId, itemData)
      ).rejects.toThrow('Invalid category');
    });
  });

  describe('Concurrent User Scenarios', () => {
    it('should handle two users creating checklists for different sessions', async () => {
      const user1Id = 'user-1';
      const user2Id = 'user-2';
      const session1Id = 'session-1';
      const session2Id = 'session-2';

      // User 1 creates checklist
      supabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: { id: user1Id } },
        error: null
      });

      let fromCallCount = 0;
      supabase.from = jest.fn(() => {
        fromCallCount++;
        if (fromCallCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
              })
            })
          };
        } else {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'checklist-user1',
                    session_id: session1Id,
                    user_id: user1Id,
                    total_items: 18,
                    completed_items: 0,
                    template_version: 1,
                    created_at: '2026-02-10T10:00:00Z',
                    updated_at: '2026-02-10T10:00:00Z',
                    completed_at: null,
                    session_checklist_items: []
                  },
                  error: null
                })
              })
            })
          };
        }
      });

      supabase.rpc = jest.fn().mockResolvedValue({ data: 'checklist-user1', error: null });

      const checklist1 = await sessionChecklistService.getOrCreateChecklist(session1Id);
      expect(checklist1.userId).toBe(user1Id);

      // User 2 creates checklist
      supabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: { id: user2Id } },
        error: null
      });

      fromCallCount = 0;
      supabase.from = jest.fn(() => {
        fromCallCount++;
        if (fromCallCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
              })
            })
          };
        } else {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'checklist-user2',
                    session_id: session2Id,
                    user_id: user2Id,
                    total_items: 18,
                    completed_items: 0,
                    template_version: 1,
                    created_at: '2026-02-10T10:01:00Z',
                    updated_at: '2026-02-10T10:01:00Z',
                    completed_at: null,
                    session_checklist_items: []
                  },
                  error: null
                })
              })
            })
          };
        }
      });

      supabase.rpc = jest.fn().mockResolvedValue({ data: 'checklist-user2', error: null });

      const checklist2 = await sessionChecklistService.getOrCreateChecklist(session2Id);
      expect(checklist2.userId).toBe(user2Id);

      // Verify checklists are independent
      expect(checklist1.id).not.toBe(checklist2.id);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty checklist (all items deleted)', async () => {
      const mockEmptyChecklist = {
        id: mockChecklistId,
        session_id: mockSessionId,
        user_id: mockUserId,
        total_items: 0,
        completed_items: 0,
        completed_at: null,
        created_at: '2026-02-10T10:00:00Z',
        updated_at: '2026-02-10T12:00:00Z',
        template_version: 1,
        session_checklist_items: []
      };

      supabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockEmptyChecklist, error: null })
          })
        })
      });

      const result = await sessionChecklistService.getChecklistWithItems(mockChecklistId);

      expect(result).toBeDefined();
      expect(result.totalItems).toBe(0);
      expect(result.completionPercentage).toBe(0);
    });

    it('should handle checklist with maximum items (50)', async () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        id: `item-${i}`,
        title: `Item ${i}`,
        sort_order: i * 10,
        is_checked: false,
        checklist_id: mockChecklistId,
        description: '',
        category: 'practical',
        is_essential: false,
        is_custom: true,
        checked_at: null,
        created_at: '2026-02-10T10:00:00Z',
        template_item_id: null
      }));

      supabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 50, error: null })
        })
      });

      await expect(
        sessionChecklistService.addCustomItem(mockChecklistId, { title: 'Item 51' })
      ).rejects.toThrow('Maximum of 50 items per checklist reached.');
    });

    it('should handle very long but valid title and description', async () => {
      const itemData = {
        title: 'A'.repeat(200), // Exactly at limit
        description: 'B'.repeat(500) // Exactly at limit
      };

      const mockNewItem = {
        id: 'item-long',
        checklist_id: mockChecklistId,
        title: itemData.title,
        description: itemData.description,
        category: 'practical',
        sort_order: 100,
        is_custom: true,
        is_essential: false,
        is_checked: false,
        checked_at: null,
        created_at: '2026-02-10T11:00:00Z',
        template_item_id: null
      };

      let fromCallCount = 0;
      supabase.from = jest.fn(() => {
        fromCallCount++;
        if (fromCallCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ count: 18, error: null })
            })
          };
        } else if (fromCallCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    maybeSingle: jest.fn().mockResolvedValue({
                      data: { sort_order: 90 },
                      error: null
                    })
                  })
                })
              })
            })
          };
        } else {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockNewItem, error: null })
              })
            })
          };
        }
      });

      const result = await sessionChecklistService.addCustomItem(mockChecklistId, itemData);

      expect(result).toBeDefined();
      expect(result.title).toHaveLength(200);
      expect(result.description).toHaveLength(500);
    });
  });

  describe('Query Optimization', () => {
    it('should fetch checklist with items in single query', async () => {
      const mockChecklist = {
        id: mockChecklistId,
        session_id: mockSessionId,
        user_id: mockUserId,
        total_items: 3,
        completed_items: 1,
        session_checklist_items: [
          {
            id: 'item-1',
            title: 'Item 1',
            sort_order: 10,
            is_checked: true,
            category: 'physical',
            description: '',
            is_essential: false,
            is_custom: false,
            checked_at: '2026-02-10T10:00:00Z',
            created_at: '2026-02-10T09:00:00Z',
            template_item_id: 'template-1',
            checklist_id: mockChecklistId
          }
        ],
        template_version: 1,
        created_at: '2026-02-10T09:00:00Z',
        updated_at: '2026-02-10T10:00:00Z',
        completed_at: null
      };

      let selectCalled = false;
      supabase.from = jest.fn().mockReturnValue({
        select: jest.fn(() => {
          selectCalled = true;
          return {
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: mockChecklist, error: null })
            })
          };
        })
      });

      const result = await sessionChecklistService.getOrCreateChecklist(mockSessionId);

      expect(selectCalled).toBe(true);
      expect(result.items).toBeDefined();
      expect(supabase.from).toHaveBeenCalledTimes(1); // Single query with nested select
    });
  });
});
