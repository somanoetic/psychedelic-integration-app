import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import userRoleService from '../lib/userRoleService';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme/colors';

const AdminSetupScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  };

  const makeUserAdmin = async () => {
    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'Not authenticated');
        return;
      }

      console.log('Attempting to make user admin:', user.id);

      // Try multiple approaches to handle RLS issues
      let success = false;
      let error = null;

      // Approach 1: Try upsert
      try {
        const { data, error: upsertError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: user.id,
            role: 'admin',
            verified: true
          }, {
            onConflict: 'user_id',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (!upsertError) {
          success = true;
        } else {
          error = upsertError;
        }
      } catch (e) {
        error = e;
      }

      // Approach 2: If upsert failed, try update only
      if (!success && error?.code === '42501') {
        try {
          const { data, error: updateError } = await supabase
            .from('user_roles')
            .update({
              role: 'admin',
              verified: true
            })
            .eq('user_id', user.id)
            .select()
            .single();

          if (!updateError) {
            success = true;
          } else {
            error = updateError;
          }
        } catch (e) {
          error = e;
        }
      }

      // Approach 3: If still failed, try insert only
      if (!success && error?.code === '42501') {
        try {
          const { data, error: insertError } = await supabase
            .from('user_roles')
            .insert({
              user_id: user.id,
              role: 'admin',
              verified: true
            })
            .select()
            .single();

          if (!insertError) {
            success = true;
          } else {
            error = insertError;
          }
        } catch (e) {
          error = e;
        }
      }

      if (success) {
        Alert.alert('Success!', 'You are now an admin user.');
        // Clear cache so new role is loaded
        userRoleService.clearCache();
        checkCurrentRole();
      } else {
        console.error('All approaches failed:', error);
        Alert.alert(
          'RLS Policy Error', 
          `The database security policies prevent self-promotion to admin. Please:\n\n1. Go to your Supabase SQL Editor\n2. Run the fix_rls_policies.sql script\n3. Try again\n\nError: ${error?.message || 'Unknown error'}`
        );
      }

    } catch (error) {
      console.error('Error making user admin:', error);
      Alert.alert('Error', 'Failed to make user admin: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const makeUserTherapist = async () => {
    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'Not authenticated');
        return;
      }

      // Use upsert to handle both insert and update cases
      const { data, error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: user.id,
          role: 'therapist',
          verified: true,
          license_type: 'TESTING',
          license_number: 'TEST123',
          license_state: 'CA'
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        throw error;
      }
      
      Alert.alert('Success!', 'You are now a verified therapist.');

      // Clear cache so new role is loaded
      userRoleService.clearCache();
      checkCurrentRole();

    } catch (error) {
      console.error('Error making user therapist:', error);
      Alert.alert('Error', 'Failed to make user therapist: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const checkCurrentRole = async () => {
    setIsLoading(true);
    try {
      const roleData = await userRoleService.getCurrentUserRole();
      setCurrentRole(roleData);
    } catch (error) {
      console.error('Error checking role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    checkCurrentRole();
  }, []);

  return (
    <LinearGradient
      colors={gradients.standard}
      start={{ x: 1.0, y: 0.0 }}
      end={{ x: 0.0, y: 1.0 }}
      style={{ flex: 1 }}
    >
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
    <ScrollView style={styles.scroll}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Admin Setup</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Role Status</Text>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <View style={styles.roleInfo}>
            <Text style={styles.roleText}>
              Role: {currentRole?.role || 'Unknown'}
            </Text>
            <Text style={styles.roleText}>
              Verified: {currentRole?.verified ? 'Yes' : 'No'}
            </Text>
            {currentRole?.license_type && (
              <Text style={styles.roleText}>
                License: {currentRole.license_type} - {currentRole.license_number}
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Setup</Text>
        <Text style={styles.sectionSubtitle}>
          Choose your access level for testing the app:
        </Text>

        <TouchableOpacity
          style={[styles.button, styles.adminButton]}
          onPress={makeUserAdmin}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            👑 Make Me Admin
          </Text>
          <Text style={styles.buttonSubtext}>
            Full access to all features and user management
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.therapistButton]}
          onPress={makeUserTherapist}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            🩺 Make Me Verified Therapist
          </Text>
          <Text style={styles.buttonSubtext}>
            Access to training scenarios and professional features
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.refreshButton]}
          onPress={checkCurrentRole}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            🔄 Refresh Role Status
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.manualSection}>
        <Text style={styles.sectionTitle}>Manual Database Setup</Text>
        <Text style={styles.sectionSubtitle}>
          If the buttons above don't work due to security policies:
        </Text>
        
        <View style={styles.codeBlock}>
          <Text style={styles.codeTitle}>1. Go to Supabase SQL Editor</Text>
          <Text style={styles.codeTitle}>2. Run this query to see your user ID:</Text>
          <Text style={styles.codeText}>
            SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;
          </Text>
          
          <Text style={styles.codeTitle}>3. Copy your user ID and run:</Text>
          <Text style={styles.codeText}>
            INSERT INTO user_roles (user_id, role, verified){"\n"}
            VALUES ('your-user-id-here', 'admin', TRUE){"\n"}
            ON CONFLICT (user_id){"\n"}
            DO UPDATE SET role = 'admin', verified = TRUE;
          </Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>ℹ️ Development Setup</Text>
        <Text style={styles.infoText}>
          This screen is for development/testing purposes. In production, admin roles would be assigned manually and therapist verification would go through a proper review process.
        </Text>
      </View>
    </ScrollView>
    </SafeAreaView>
    </LinearGradient>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    fontSize: 16,
    color: colors.primary,
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  roleInfo: {
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  roleText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  adminButton: {
    backgroundColor: '#dc2626',
  },
  therapistButton: {
    backgroundColor: '#059669',
  },
  refreshButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
    marginBottom: 4,
  },
  buttonSubtext: {
    fontSize: 12,
    color: colors.textInverse,
    opacity: 0.9,
    textAlign: 'center',
  },
  infoSection: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.bubbleArchetypal,
    borderRadius: 8,
  },
  manualSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  codeBlock: {
    backgroundColor: colors.text,
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  codeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    marginTop: 8,
  },
  codeText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.success,
    backgroundColor: colors.text,
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
};

export default AdminSetupScreen;