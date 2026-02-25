/**
 * Session Checklist Service - Usage Examples
 *
 * This file demonstrates how to use sessionChecklistService in your React Native components.
 * DO NOT import this file - it's for documentation purposes only.
 */

import sessionChecklistService from './sessionChecklistService';

// ============================================================================
// Example 1: Get or Create Checklist for a Session
// ============================================================================

async function exampleGetOrCreate() {
  const sessionId = 'your-session-uuid';

  // This is idempotent - safe to call multiple times
  const checklist = await sessionChecklistService.getOrCreateChecklist(sessionId);

  if (checklist) {
    console.log('Checklist loaded:', checklist.id);
    console.log(`Progress: ${checklist.completedItems}/${checklist.totalItems} items`);
    console.log(`Completion: ${checklist.completionPercentage}%`);
    console.log('Items:', checklist.items);
  }
}

// ============================================================================
// Example 2: Toggle Item Completion
// ============================================================================

async function exampleToggleItem(itemId, isChecked) {
  const updatedItem = await sessionChecklistService.toggleItemCompletion(itemId, isChecked);

  if (updatedItem) {
    console.log('Item updated:', updatedItem.title);
    console.log('Checked:', updatedItem.isChecked);
    console.log('Checked at:', updatedItem.checkedAt);
  } else {
    console.error('Failed to toggle item');
  }
}

// ============================================================================
// Example 3: Add Custom Item
// ============================================================================

async function exampleAddCustomItem(checklistId) {
  try {
    const newItem = await sessionChecklistService.addCustomItem(checklistId, {
      title: 'Prepare sacred space with incense',
      description: 'Light palo santo and sage to cleanse the space',
      category: 'practical'
    });

    console.log('Custom item added:', newItem.id);
    console.log('Is custom:', newItem.isCustom); // true
  } catch (error) {
    // Validation errors are thrown, so catch them here
    alert(error.message); // e.g., "Maximum of 50 items per checklist reached."
  }
}

// ============================================================================
// Example 4: Update Item Text
// ============================================================================

async function exampleUpdateItem(itemId) {
  try {
    const updatedItem = await sessionChecklistService.updateItem(itemId, {
      title: 'Updated title',
      description: 'Updated description'
    });

    console.log('Item updated:', updatedItem);
  } catch (error) {
    alert(error.message); // e.g., "Item title cannot be empty."
  }
}

// ============================================================================
// Example 5: Delete Custom Item
// ============================================================================

async function exampleDeleteItem(itemId) {
  const success = await sessionChecklistService.deleteItem(itemId);

  if (success) {
    console.log('Item deleted successfully');
  } else {
    console.error('Failed to delete item');
  }
}

// ============================================================================
// Example 6: Get User's Incomplete Checklists
// ============================================================================

async function exampleGetIncomplete() {
  const incomplete = await sessionChecklistService.getIncompleteChecklists();

  console.log(`You have ${incomplete.length} incomplete checklists:`);
  incomplete.forEach(checklist => {
    console.log(`- Session ${checklist.sessionId}: ${checklist.completionPercentage}% complete`);
  });
}

// ============================================================================
// Example 7: React Component Integration
// ============================================================================

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';

function ChecklistScreen({ sessionId }) {
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChecklist();
  }, [sessionId]);

  async function loadChecklist() {
    setLoading(true);
    const data = await sessionChecklistService.getOrCreateChecklist(sessionId);
    setChecklist(data);
    setLoading(false);
  }

  async function handleToggle(item) {
    // Optimistic update
    setChecklist(prev => ({
      ...prev,
      items: prev.items.map(i =>
        i.id === item.id ? { ...i, isChecked: !i.isChecked } : i
      )
    }));

    // Update in database
    const updated = await sessionChecklistService.toggleItemCompletion(
      item.id,
      !item.isChecked
    );

    if (!updated) {
      // Revert on error
      loadChecklist();
      alert('Failed to update item. Please try again.');
    } else {
      // Reload to get updated counters from parent
      loadChecklist();
    }
  }

  if (loading) {
    return <Text>Loading checklist...</Text>;
  }

  if (!checklist) {
    return <Text>Failed to load checklist</Text>;
  }

  return (
    <View>
      <Text>Progress: {checklist.completedItems}/{checklist.totalItems}</Text>
      <Text>{checklist.completionPercentage}% Complete</Text>

      <FlatList
        data={checklist.items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleToggle(item)}>
            <View style={{ flexDirection: 'row', padding: 10 }}>
              <Text>{item.isChecked ? '☑' : '☐'}</Text>
              <View style={{ marginLeft: 10 }}>
                <Text style={{ fontWeight: item.isEssential ? 'bold' : 'normal' }}>
                  {item.title}
                </Text>
                {item.description ? (
                  <Text style={{ fontSize: 12, color: '#666' }}>
                    {item.description}
                  </Text>
                ) : null}
                {item.isCustom && (
                  <Text style={{ fontSize: 10, color: '#999' }}>
                    (Custom)
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// ============================================================================
// Example 8: Error Handling Patterns
// ============================================================================

async function exampleErrorHandling() {
  try {
    // Methods that throw errors (validation failures)
    const item = await sessionChecklistService.addCustomItem(checklistId, {
      title: '', // Invalid - empty title
    });
  } catch (error) {
    console.error('Validation error:', error.message);
    // Display to user: "Item title is required."
  }

  // Methods that return null on error (read operations)
  const checklist = await sessionChecklistService.getOrCreateChecklist(sessionId);
  if (!checklist) {
    console.error('Failed to load checklist');
    // Display error state in UI
  }

  // Methods that return false on error (delete operations)
  const deleted = await sessionChecklistService.deleteItem(itemId);
  if (!deleted) {
    console.error('Failed to delete item');
    // Display error message to user
  }
}

// ============================================================================
// Example 9: Checking if Checklist is Complete
// ============================================================================

async function exampleCheckCompletion(sessionId) {
  const checklist = await sessionChecklistService.getOrCreateChecklist(sessionId);

  if (checklist) {
    if (checklist.isComplete) {
      console.log('Checklist is complete! Completed at:', checklist.completedAt);
      // Show completion badge, celebration animation, etc.
    } else {
      console.log(`${checklist.totalItems - checklist.completedItems} items remaining`);
      // Show progress indicator
    }
  }
}

// ============================================================================
// Example 10: Categories and Essential Items
// ============================================================================

async function exampleCategories(sessionId) {
  const checklist = await sessionChecklistService.getOrCreateChecklist(sessionId);

  if (checklist) {
    // Group items by category
    const byCategory = checklist.items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    console.log('Physical items:', byCategory.physical?.length || 0);
    console.log('Safety items:', byCategory.safety?.length || 0);
    console.log('Mental items:', byCategory.mental?.length || 0);
    console.log('Practical items:', byCategory.practical?.length || 0);

    // Filter essential items
    const essential = checklist.items.filter(item => item.isEssential);
    console.log(`${essential.length} essential items`);

    // Check if all essential items are complete
    const essentialComplete = essential.every(item => item.isChecked);
    if (essentialComplete) {
      console.log('All essential items are complete!');
    }
  }
}
