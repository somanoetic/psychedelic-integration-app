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

  // Check if user is an approved contributor (ADR-009 Phase B3: legacy
  // role string 'therapist' renamed to 'contributor').
  async isApprovedContributor() {
    const roleData = await this.getCurrentUserRole();
    return roleData.role === 'contributor' && roleData.verified === true;
  }

  // Check if user is admin
  async isAdmin() {
    const roleData = await this.getCurrentUserRole();
    return roleData.role === 'admin' && roleData.verified === true;
  }

  // Submit a contributor application. Underlying row still lives in
  // therapist_verification_requests for backwards compatibility — only the
  // role string was renamed in B3.
  async submitContributorApplication(applicationData) {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: 'Not authenticated' };
      }

      const cleanedData = { ...applicationData };
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === '' || cleanedData[key] === null || cleanedData[key] === undefined) {
          delete cleanedData[key];
        }
      });

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
        console.error('Contributor application insert error:', error);
        return { success: false, error: error.message };
      }

      // No user_roles write here. user_roles is admin-writable only by
      // design (see migration 20260209000001 + 20260512000001) — a user
      // cannot grant themselves a role. The application's pending/approved
      // state is the single source of truth and lives in
      // therapist_verification_requests.status. user_roles is updated
      // authoritatively in approveApplication() at the admin's decision.
      this.roleCache.delete(user.id);

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error in submitContributorApplication:', error);
      return { success: false, error: error.message };
    }
  }

  // Resubmit an application that the admin sent back with needs_more_info.
  // Updates the existing row in place, resets status to 'pending', and clears
  // the prior review audit so the admin sees a fresh entry in their queue.
  // RLS policy "Users can resubmit needs_more_info applications" enforces
  // that this can only be done by the applicant on their own needs_more_info
  // row, and only to flip status back to pending.
  async resubmitVerificationRequest(applicationId, applicationData) {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Not authenticated' };
      }

      const cleaned = { ...applicationData };
      Object.keys(cleaned).forEach((key) => {
        if (cleaned[key] === '' || cleaned[key] === null || cleaned[key] === undefined) {
          delete cleaned[key];
        }
      });

      const { error } = await supabase
        .from('therapist_verification_requests')
        .update({
          ...cleaned,
          status: 'pending',
          review_notes: null,
          reviewed_by: null,
          reviewed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId)
        .eq('user_id', user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
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
        .select('id, status, review_notes, created_at, updated_at, full_name, professional_background, years_experience, specializations, contribution_focus, additional_info')
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

  // ----- Admin review of contributor applications (ADR-009 B1) -----

  // List contributor applications, optionally filtered by status.
  // Admin-only at the RLS layer; this method also short-circuits non-admins.
  async listApplications(statusFilter = 'pending') {
    try {
      const isAdmin = await this.isAdmin();
      if (!isAdmin) {
        return { success: false, error: 'Admin access required', data: [] };
      }

      let query = supabase
        .from('therapist_verification_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message, data: [] };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  // Approve a contributor application:
  //   - sets therapist_verification_requests.status='approved'
  //   - flips user_roles.verified=true for the applicant
  async approveApplication(applicationId, applicantUserId, notes = null) {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Not authenticated' };
      }

      const reviewedAt = new Date().toISOString();

      const { error: appError } = await supabase
        .from('therapist_verification_requests')
        .update({
          status: 'approved',
          review_notes: notes,
          reviewed_by: user.id,
          reviewed_at: reviewedAt,
        })
        .eq('id', applicationId);

      if (appError) {
        return { success: false, error: appError.message };
      }

      // Authoritative role grant. Sets BOTH role and verified so approval
      // works correctly regardless of the prior user_roles state. The
      // apply-time flip in submitContributorApplication() can't write to
      // user_roles under RLS (no user-self UPDATE policy by design), so
      // approval is the only point at which the contributor role is
      // actually granted.
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: 'contributor', verified: true })
        .eq('user_id', applicantUserId);

      if (roleError) {
        return { success: false, error: `Application marked approved, but role flip failed: ${roleError.message}` };
      }

      this.roleCache.delete(applicantUserId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Reject a contributor application. Notes are required so the applicant
  // sees a reason in their status screen.
  async rejectApplication(applicationId, notes) {
    return this._setApplicationStatus(applicationId, 'rejected', notes);
  }

  // Request more info — applicant sees the notes and can resubmit.
  async requestMoreInfo(applicationId, notes) {
    return this._setApplicationStatus(applicationId, 'needs_more_info', notes);
  }

  async _setApplicationStatus(applicationId, status, notes) {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Not authenticated' };
      }

      if (!notes || !notes.trim()) {
        return { success: false, error: 'Review notes are required for this action' };
      }

      // Rejection also reverts the applicant's user_roles row to baseline.
      // Without this the applicant keeps role='therapist'/verified=false
      // and getRoleDisplayInfo() reports them as "Application Pending"
      // even though the application is closed. Grab the user_id up front
      // so we can revert in the same pass.
      let applicantUserId = null;
      if (status === 'rejected') {
        const { data: appRow, error: fetchError } = await supabase
          .from('therapist_verification_requests')
          .select('user_id')
          .eq('id', applicationId)
          .single();
        if (fetchError) {
          return { success: false, error: fetchError.message };
        }
        applicantUserId = appRow?.user_id;
      }

      const { error } = await supabase
        .from('therapist_verification_requests')
        .update({
          status,
          review_notes: notes.trim(),
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (error) {
        return { success: false, error: error.message };
      }

      if (status === 'rejected' && applicantUserId) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: 'user', verified: false })
          .eq('user_id', applicantUserId);
        if (roleError) {
          // The request row is correctly marked rejected; the role mismatch
          // is recoverable, so don't fail the whole operation.
          console.error('Failed to revert user_roles on rejection:', roleError);
        }
        this.roleCache.delete(applicantUserId);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
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

    if (role === 'contributor' && verified) {
      return {
        title: 'Approved Contributor',
        badge: '✅ Contributor',
        color: '#059669',
        canUploadScenarios: true
      };
    }

    if (role === 'contributor' && !verified) {
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