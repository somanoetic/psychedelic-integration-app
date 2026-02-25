# Navigation Integration Guide
# How to Add Metrics Dashboard Link

**Date:** 2026-02-09

---

## Quick Start

The AdminMetricsDashboard is now available in the navigation stack. You just need to add a link to it from an appropriate location.

---

## Option 1: Add to Settings Screen (Recommended)

### File to Edit
`screens/SettingsScreen.js` (or wherever settings are located)

### Code to Add
```javascript
import { useState, useEffect } from 'react';
import userRoleService from '../lib/userRoleService';

// In your component:
const [isAdmin, setIsAdmin] = useState(false);

useEffect(() => {
  checkAdminStatus();
}, []);

const checkAdminStatus = async () => {
  const admin = await userRoleService.isAdmin();
  setIsAdmin(admin);
};

// In your render/return:
{isAdmin && (
  <TouchableOpacity
    style={styles.settingItem}
    onPress={() => navigation.navigate('AdminMetricsDashboard')}
  >
    <MaterialIcons name="dashboard" size={24} color="#9d84b7" />
    <Text style={styles.settingText}>Metrics Dashboard</Text>
    <MaterialIcons name="chevron-right" size={24} color="#a0a0a0" />
  </TouchableOpacity>
)}
```

---

## Option 2: Add to Admin Menu

If you have a dedicated admin section:

```javascript
<View style={styles.adminSection}>
  <Text style={styles.sectionTitle}>Admin Tools</Text>

  <TouchableOpacity
    style={styles.menuItem}
    onPress={() => navigation.navigate('AdminMetricsDashboard')}
  >
    <View style={styles.iconContainer}>
      <MaterialIcons name="analytics" size={28} color="#9d84b7" />
    </View>
    <View style={styles.textContainer}>
      <Text style={styles.menuTitle}>Metrics Dashboard</Text>
      <Text style={styles.menuDescription}>
        Monitor AI system performance and costs
      </Text>
    </View>
  </TouchableOpacity>
</View>
```

---

## Option 3: Add to Home Screen (Grid or Conversational)

### For GridHomeScreen
Edit `components/GridHomeScreen.js`:

```javascript
// Add this to your admin check
const [isAdmin, setIsAdmin] = useState(false);

useEffect(() => {
  userRoleService.isAdmin().then(setIsAdmin);
}, []);

// Add this tile to your grid (only if admin)
{isAdmin && {
  id: 'metrics-dashboard',
  title: 'Metrics Dashboard',
  subtitle: 'System monitoring',
  icon: 'dashboard',
  category: 'admin',
  color: '#9d84b7',
  screen: 'AdminMetricsDashboard'
}}
```

---

## Option 4: Add Floating Action Button (FAB)

For quick access from anywhere:

```javascript
import { useEffect, useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import userRoleService from '../lib/userRoleService';

const AdminFAB = ({ navigation }) => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    userRoleService.isAdmin().then(setIsAdmin);
  }, []);

  if (!isAdmin) return null;

  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={() => navigation.navigate('AdminMetricsDashboard')}
    >
      <MaterialIcons name="analytics" size={24} color="#f4f1de" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#9d84b7',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
```

---

## Testing the Navigation

### 1. Test as Admin
```javascript
// In your test setup:
// 1. Make your user an admin via AdminSetupScreen
// 2. Navigate to wherever you added the link
// 3. Tap the metrics dashboard button
// 4. Should navigate to dashboard successfully
```

### 2. Test as Non-Admin
```javascript
// 1. Sign in as regular user
// 2. Navigate to wherever you added the link
// 3. Link should NOT be visible (hidden by isAdmin check)
```

### 3. Test Direct Navigation
```javascript
// From any screen:
navigation.navigate('AdminMetricsDashboard');
// Should show alert and redirect if not admin
```

---

## Icon Options

Choose an appropriate icon for the dashboard link:

```javascript
// Analytics/Metrics icons
<MaterialIcons name="analytics" size={24} color="#9d84b7" />
<MaterialIcons name="dashboard" size={24} color="#9d84b7" />
<MaterialIcons name="bar-chart" size={24} color="#9d84b7" />
<MaterialIcons name="insert-chart" size={24} color="#9d84b7" />

// System/Monitor icons
<MaterialIcons name="monitor" size={24} color="#9d84b7" />
<MaterialIcons name="settings-applications" size={24} color="#9d84b7" />
<MaterialIcons name="assessment" size={24} color="#9d84b7" />
```

---

## Styling Recommendations

### Noesis Color Scheme
```javascript
const styles = StyleSheet.create({
  menuItem: {
    backgroundColor: '#252542',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#353555',
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(157, 132, 183, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  menuTitle: {
    color: '#f4f1de',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuDescription: {
    color: '#a0a0a0',
    fontSize: 13,
  },
});
```

---

## Example: Complete Settings Integration

Here's a complete example of adding it to a settings screen:

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import userRoleService from '../lib/userRoleService';

const SettingsScreen = ({ navigation }) => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const admin = await userRoleService.isAdmin();
    setIsAdmin(admin);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Regular Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.settingItem}>
            <MaterialIcons name="person" size={24} color="#9d84b7" />
            <Text style={styles.settingText}>Profile</Text>
            <MaterialIcons name="chevron-right" size={24} color="#a0a0a0" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <MaterialIcons name="notifications" size={24} color="#9d84b7" />
            <Text style={styles.settingText}>Notifications</Text>
            <MaterialIcons name="chevron-right" size={24} color="#a0a0a0" />
          </TouchableOpacity>
        </View>

        {/* Admin Section (Only Visible to Admins) */}
        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Tools</Text>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate('AdminMetricsDashboard')}
            >
              <MaterialIcons name="dashboard" size={24} color="#9d84b7" />
              <Text style={styles.settingText}>Metrics Dashboard</Text>
              <MaterialIcons name="chevron-right" size={24} color="#a0a0a0" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#353555',
  },
  headerTitle: {
    color: '#f4f1de',
    fontSize: 28,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: '#a0a0a0',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252542',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#353555',
  },
  settingText: {
    color: '#f4f1de',
    fontSize: 16,
    marginLeft: 16,
    flex: 1,
  },
});

export default SettingsScreen;
```

---

## Quick Test Commands

### Test Admin Access
```javascript
// In React Native Debugger console:
import userRoleService from './lib/userRoleService';
await userRoleService.isAdmin(); // Should return true for admin users
```

### Test Navigation
```javascript
// In any screen with navigation prop:
navigation.navigate('AdminMetricsDashboard');
// Should navigate to dashboard if admin
// Should show alert and redirect if not admin
```

---

## Troubleshooting

### Link Not Visible
- Check if user is actually admin: `userRoleService.isAdmin()`
- Check console for role check errors
- Verify `user_roles` table has correct role for user

### Navigation Error
- Verify screen is registered in `App.js`
- Check import statement in `App.js`
- Restart Metro bundler

### Dashboard Shows "Access Denied"
- User role is not 'admin' in database
- Check `verified` field is `true`
- Use AdminSetupScreen to grant admin role

---

## Recommended Placement

**Best Option:** Settings Screen > Admin Tools section
- Clear separation from user settings
- Easy to find for admins
- Doesn't clutter main navigation

**Alternative:** Floating Action Button on Home Screen
- Quick access from anywhere
- Only visible to admins
- Doesn't disrupt existing UI

---

## Next Steps

1. Choose integration point (Settings recommended)
2. Add the navigation code
3. Test with admin user
4. Test with non-admin user
5. Verify dashboard loads correctly
6. Check auto-refresh works
7. Deploy!

---

**That's it!** The dashboard is fully functional and ready to use. Just add a link from wherever makes sense in your app.
