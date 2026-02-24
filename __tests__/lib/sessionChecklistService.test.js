/**
 * Unit Tests for sessionChecklistService
 *
 * Tests all service methods with:
 * - Happy path scenarios
 * - Edge cases
 * - Error handling
 * - Input validation
 * - Permission boundaries
 */

// Mock the Supabase client before importing
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    auth: {
      getUser: jest.fn()
    }
  }
}));

const sessionChecklistService = require('../../lib/sessionChecklistService').default;
const { supabase: mockSupabase } = require('../../lib/supabase');

describe('SessionChecklistService', () => {
  // Setup and teardown
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console mocks
    console.error = jest.fn();
    console.log = jest.fn();
  });

  describe('getOrCreateChecklist', () => {
    const mockSessionId = 'session-123';
    const mockUserId = 'user-456';
    const mockChecklistId = 'checklist-789';

    beforeEach(() => {
      // Mock auth.getUser
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null
      });
    });

    it('should return existing checklist if found', async () => {
      const mockExistingChecklist = {
        id: mockChecklistId,
        session_id: mockSessionId,
        user_id: mockUserId,
        template_version: 1,
        total_items: 5,
        completed_items: 2,
        created_at: '2026-02-10T10:00:00Z',
        updated_at: '2026-02-10T11:00:00Z',
        completed_at: null,
        session_checklist_items: [
          {
            id: 'item-1',
            title: 'Item 1',
            description: 'Description 1',
            category: 'physical',
            sort_order: 10,
            is_essential: true,
            is_custom: false,
            is_checked: true,
            checked_at: '2026-02-10T10:30:00Z',
            created_at: '2026-02-10T10:00:00Z'
          },
          {
            id: 'item-2',
            title: 'Item 2',
            description: 'Description 2',
            category: 'mental',
            sort_order: 20,
            is_essential: false,
            is_custom: false,
            is_checked: false,
            checked_at: null,
            created_at: '2026-02-10T10:00:00Z'
          }
        ]
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: mockExistingChecklist,
        error: null
      });

      mockSupabase.from = jest.fn().mockReturnValue({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            maybeSingle: mockMaybeSingle
          })
        })
      });

      const result = await sessionChecklistService.getOrCreateChecklist(mockSessionId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockChecklistId);
      expect(result.sessionId).toBe(mockSessionId);
      expect(result.totalItems).toBe(5);
      expect(result.completedItems).toBe(2);
      expect(result.items).toHaveLength(2);
      expect(result.isComplete).toBe(false);
      expect(result.completionPercentage).toBe(40); // 2/5 = 40%

      expect(mockSupabase.from).toHaveBeenCalledWith('session_checklists');
      expect(mockSelect).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('session_id', mockSessionId);
    });

    it('should return null if user is not authenticated', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      });

      const result = await sessionChecklistService.getOrCreateChecklist(mockSessionId);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Not authenticated:', expect.any(Object));
    });

    it('should handle permission denied error when creating checklist', async () => {
      // No existing checklist
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      });

      // RPC throws permission error
      mockSupabase.rpc = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Session does not belong to user' }
      });

      const result = await sessionChecklistService.getOrCreateChecklist(mockSessionId);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('toggleItemCompletion', () => {
    const mockItemId = 'item-123';

    it('should mark item as checked', async () => {
      const mockUpdatedItem = {
        id: mockItemId,
        checklist_id: 'checklist-789',
        title: 'Test Item',
        description: 'Test Description',
        category: 'physical',
        sort_order: 10,
        is_essential: true,
        is_custom: false,
        is_checked: true,
        checked_at: '2026-02-10T12:00:00Z',
        created_at: '2026-02-10T10:00:00Z'
      };

      mockSupabase.from = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockUpdatedItem,
                error: null
              })
            })
          })
        })
      });

      const result = await sessionChecklistService.toggleItemCompletion(mockItemId, true);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockItemId);
      expect(result.isChecked).toBe(true);
      expect(result.checkedAt).toBe('2026-02-10T12:00:00Z');
    });

    it('should handle permission denied error', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST301', message: 'permission denied' }
              })
            })
          })
        })
      });

      const result = await sessionChecklistService.toggleItemCompletion(mockItemId, true);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('addCustomItem', () => {
    const mockChecklistId = 'checklist-789';

    it('should throw error if title is empty', async () => {
      const itemData = {
        title: '',
        description: 'No title'
      };

      await expect(
        sessionChecklistService.addCustomItem(mockChecklistId, itemData)
      ).rejects.toThrow('Item title is required.');
    });

    it('should throw error if title exceeds 200 characters', async () => {
      const itemData = {
        title: 'x'.repeat(201),
        description: 'Too long'
      };

      await expect(
        sessionChecklistService.addCustomItem(mockChecklistId, itemData)
      ).rejects.toThrow('Item title must be 200 characters or less.');
    });

    it('should throw error if description exceeds 500 characters', async () => {
      const itemData = {
        title: 'Valid Title',
        description: 'x'.repeat(501)
      };

      await expect(
        sessionChecklistService.addCustomItem(mockChecklistId, itemData)
      ).rejects.toThrow('Item description must be 500 characters or less.');
    });

    it('should throw error if 50-item limit reached', async () => {
      const itemData = {
        title: 'One Too Many',
        description: 'Limit reached'
      };

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(
            Promise.resolve({ count: 50, error: null })
          )
        })
      });

      await expect(
        sessionChecklistService.addCustomItem(mockChecklistId, itemData)
      ).rejects.toThrow('Maximum of 50 items per checklist reached.');
    });
  });

  describe('updateItem', () => {
    const mockItemId = 'item-123';

    it('should throw error if title is empty', async () => {
      const updates = { title: '   ' };

      await expect(
        sessionChecklistService.updateItem(mockItemId, updates)
      ).rejects.toThrow('Item title cannot be empty.');
    });

    it('should throw error if title exceeds 200 characters', async () => {
      const updates = { title: 'x'.repeat(201) };

      await expect(
        sessionChecklistService.updateItem(mockItemId, updates)
      ).rejects.toThrow('Item title must be 200 characters or less.');
    });

    it('should throw error if description exceeds 500 characters', async () => {
      const updates = { description: 'x'.repeat(501) };

      await expect(
        sessionChecklistService.updateItem(mockItemId, updates)
      ).rejects.toThrow('Item description must be 500 characters or less.');
    });

    it('should throw error if no updates provided', async () => {
      const updates = {};

      await expect(
        sessionChecklistService.updateItem(mockItemId, updates)
      ).rejects.toThrow('No updates provided.');
    });
  });

  describe('deleteItem', () => {
    const mockItemId = 'item-123';

    it('should delete item successfully', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null
          })
        })
      });

      const result = await sessionChecklistService.deleteItem(mockItemId);

      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('session_checklist_items');
    });

    it('should return false on permission denied', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { code: 'PGRST301', message: 'permission denied' }
          })
        })
      });

      const result = await sessionChecklistService.deleteItem(mockItemId);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getTemplateItems', () => {
    it('should return active template items', async () => {
      const mockTemplateItems = [
        {
          id: 'template-1',
          title: 'Template Item 1',
          description: 'Description 1',
          category: 'physical',
          sort_order: 10,
          is_essential: true,
          template_version: 1,
          is_active: true,
          created_at: '2026-02-01T00:00:00Z'
        },
        {
          id: 'template-2',
          title: 'Template Item 2',
          description: 'Description 2',
          category: 'mental',
          sort_order: 20,
          is_essential: false,
          template_version: 1,
          is_active: true,
          created_at: '2026-02-01T00:00:00Z'
        }
      ];

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockTemplateItems,
              error: null
            })
          })
        })
      });

      const result = await sessionChecklistService.getTemplateItems();

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Template Item 1');
      expect(result[0].isEssential).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('checklist_template_items');
    });

    it('should return empty array on error', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      });

      const result = await sessionChecklistService.getTemplateItems();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });
});
