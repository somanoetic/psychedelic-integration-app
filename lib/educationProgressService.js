import { supabase } from './supabase';

class EducationProgressService {
  /**
   * Get progress for a specific education module
   */
  async getProgress(moduleType) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('education_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('module_type', moduleType)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting education progress:', error);
      return null;
    }
  }

  /**
   * Save or update progress for a module
   */
  async saveProgress(moduleType, currentStep, totalSteps, progressData = {}, completed = false) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const updateData = {
        user_id: user.id,
        module_type: moduleType,
        current_step: currentStep,
        total_steps: totalSteps,
        completed,
        progress_data: progressData,
        last_accessed_at: new Date().toISOString(),
        ...(completed && { completed_at: new Date().toISOString() })
      };

      const { data, error } = await supabase
        .from('education_progress')
        .upsert(updateData, {
          onConflict: 'user_id,module_type'
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error saving education progress:', error);
      throw error;
    }
  }

  /**
   * Mark a module as completed
   */
  async markComplete(moduleType, progressData = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('education_progress')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
          progress_data: progressData,
          last_accessed_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('module_type', moduleType)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error marking education complete:', error);
      throw error;
    }
  }

  /**
   * Get all progress for current user
   */
  async getAllProgress() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('education_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('last_accessed_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting all education progress:', error);
      return [];
    }
  }

  /**
   * Get completion status for a module
   */
  async isModuleCompleted(moduleType) {
    try {
      const progress = await this.getProgress(moduleType);
      return progress ? progress.completed : false;
    } catch (error) {
      console.error('Error checking module completion:', error);
      return false;
    }
  }

  /**
   * Auto-save progress (debounced to avoid too many writes)
   */
  autoSaveTimeout = null;

  async autoSave(moduleType, currentStep, totalSteps, progressData = {}) {
    // Clear existing timeout
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    // Set new timeout to save after 2 seconds of inactivity
    this.autoSaveTimeout = setTimeout(async () => {
      try {
        await this.saveProgress(moduleType, currentStep, totalSteps, progressData, false);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 2000);
  }
}

export default new EducationProgressService();
