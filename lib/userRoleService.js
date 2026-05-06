import { supabase } from './supabase';

class UserRoleService {
  constructor() {
    this.currentUserRole = null;
    this.roleCache = new Map();
  }

  // Get current user's role and verification status
  async getCurrentUserRole() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { role: null, verified: false, error: 'Not authenticated' };
      }

      // Check cache first
      if (this.roleCache.has(user.id)) {
        return this.roleCache.get(user.id);
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role, verified, license_type, license_number')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        
        // If user doesn't exist in user_roles table, create default user role
        if (error.code === 'PGRST116') {
          console.log('Creating default user role for new user');
          
          try {
            const { data: newUserRole, error: insertError } = await supabase
              .from('user_roles')
              .insert({
                user_id: user.id,
                role: 'user',
                verified: true
              })
              .select()
              .single();
            
            if (!insertError && newUserRole) {
              this.roleCache.set(user.id, newUserRole);
              return newUserRole;
            }
          } catch (insertErr) {
            console.error('Error creating default user role:', insertErr);
          }
        }
        
        // Fallback to default role
        const defaultRole = { role: 'user', verified: true };
        this.roleCache.set(user.id, defaultRole);
        return defaultRole;
      }

      this.roleCache.set(user.id, data);
      this.currentUserRole = data;
      return data;
    } catch (error) {
      console.error('Error in getCurrentUserRole:', error);
      return { role: 'user', verified: false, error: error.message };
    }
  }

  // Check if user is verified therapist
  async isVerifiedTherapist() {
    const roleData = await this.getCurrentUserRole();
    return roleData.role === 'therapist' && roleData.verified === true;
  }

  // Check if user is admin
  async isAdmin() {
    const roleData = await this.getCurrentUserRole();
    return roleData.role === 'admin' && roleData.verified === true;
  }

  // Request therapist verification
  async requestTherapistVerification(verificationData) {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Clean the verification data to handle empty strings and dates properly
      const cleanedData = { ...verificationData };
      
      // Handle date fields - convert empty strings to null
      if (cleanedData.license_expiry === '' || !cleanedData.license_expiry) {
        delete cleanedData.license_expiry;
      }
      
      // Remove other empty string fields
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === '' || cleanedData[key] === null || cleanedData[key] === undefined) {
          delete cleanedData[key];
        }
      });

      console.log('Cleaned verification data:', cleanedData);

      // Insert verification request
      const { data, error } = await supabase
        .from('therapist_verification_requests')
        .insert({
          user_id: user.id,
          email: user.email,
          ...cleanedData
        })
        .select()
        .single();

      if (error) {
        console.error('Verification request error:', error);
        return { success: false, error: error.message };
      }

      // Update user role to therapist (unverified)
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: user.id,
          role: 'therapist',
          verified: false,
          license_number: verificationData.license_number,
          license_type: verificationData.license_type,
          license_state: verificationData.license_state
        });

      if (roleError) {
        console.error('Role update error:', roleError);
        // Don't fail the whole operation if role update fails
      }

      // Clear cache
      this.roleCache.delete(user.id);

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error in requestTherapistVerification:', error);
      return { success: false, error: error.message };
    }
  }

  // Get verification request status
  async getVerificationStatus() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { status: null, error: 'Not authenticated' };
      }

      const { data, error } = await supabase
        .from('therapist_verification_requests')
        .select('status, review_notes, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        return { status: null, error: error.message };
      }

      return { status: data?.status || 'none', data };
    } catch (error) {
      return { status: null, error: error.message };
    }
  }

  // Clear role cache (call when user logs out or role changes)
  clearCache() {
    this.roleCache.clear();
    this.currentUserRole = null;
  }

  // Get user role display info
  getRoleDisplayInfo(role, verified) {
    if (role === 'admin' && verified) {
      return {
        title: 'Administrator',
        badge: '👑 Admin',
        color: '#dc2626',
        canUploadScenarios: true
      };
    }

    // NOTE: role values 'therapist' / 'verified' are kept for now to avoid a
    // DB migration. Per ADR-009 these should rename to 'contributor' /
    // 'approved' when the user_roles schema is confirmed and migrated.
    if (role === 'therapist' && verified) {
      return {
        title: 'Approved Contributor',
        badge: '✅ Contributor',
        color: '#059669',
        canUploadScenarios: true
      };
    }

    if (role === 'therapist' && !verified) {
      return {
        title: 'Application Pending',
        badge: '⏳ Pending',
        color: '#d97706',
        canUploadScenarios: false
      };
    }

    return {
      title: 'User',
      badge: '👤 User',
      color: '#6b7280',
      canUploadScenarios: false
    };
  }
}

export default new UserRoleService(); // Export singleton instance