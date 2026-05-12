// ADR-009 Phase B2: public library contribution pipeline.
//
// Contributor side: submitExercise, listMySubmissions, reviseSubmission,
//   deleteSubmission.
// Admin side: listForReview, approveSubmission, rejectSubmission,
//   requestRevision.
// User-facing: listPublished — merged into the exercise library UI.
//
// Visibility is enforced at the DB by RLS (see migration
// 20260511000003_contributed_exercises.sql). The role gates here are
// belt-and-suspenders + nicer error messages.

import { supabase } from './supabase';
import userRoleService from './userRoleService';

const VALID_CATEGORIES = new Set([
  'breathing', 'grounding', 'somatic', 'polyvagal', 'partsWork',
  'selfCompassion', 'meditation', 'jungian', 'cbt', 'habits',
  'psychedelicIntegration', 'yoga', 'stoic', 'trauma',
]);

class ContributedExerciseService {
  // -------- Contributor side --------

  // Submit a new exercise. Returns the inserted row on success.
  // Required fields on payload: title, category, instructions, steps (array),
  //   duration (number), attribution_name.
  async submitExercise(payload) {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Not authenticated' };
      }

      const role = await userRoleService.getCurrentUserRole();
      const isApprovedContributor = role?.role === 'contributor' && role?.verified === true;
      const isAdmin = role?.role === 'admin' && role?.verified === true;
      if (!isApprovedContributor && !isAdmin) {
        return { success: false, error: 'Only approved contributors can submit exercises.' };
      }

      const validation = validateSubmission(payload);
      if (!validation.ok) {
        return { success: false, error: validation.error };
      }

      const row = {
        contributor_id: user.id,
        attribution_name: payload.attribution_name.trim(),
        title: payload.title.trim(),
        category: payload.category,
        instructions: payload.instructions.trim(),
        steps: payload.steps.map((s) => String(s).trim()).filter(Boolean),
        duration: Number(payload.duration),
      };

      const { data, error } = await supabase
        .from('contributed_exercises')
        .insert(row)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // List the current user's own submissions, newest first.
  async listMySubmissions() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Not authenticated', data: [] };
      }

      const { data, error } = await supabase
        .from('contributed_exercises')
        .select('*')
        .eq('contributor_id', user.id)
        .order('submitted_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message, data: [] };
      }
      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  // Revise an existing submission (only allowed while pending or needs_revision).
  // RLS enforces ownership; this method also re-validates the payload.
  async reviseSubmission(submissionId, payload) {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Not authenticated' };
      }

      const validation = validateSubmission(payload);
      if (!validation.ok) {
        return { success: false, error: validation.error };
      }

      const { error } = await supabase
        .from('contributed_exercises')
        .update({
          attribution_name: payload.attribution_name.trim(),
          title: payload.title.trim(),
          category: payload.category,
          instructions: payload.instructions.trim(),
          steps: payload.steps.map((s) => String(s).trim()).filter(Boolean),
          duration: Number(payload.duration),
          // Returning a needs_revision row to pending is what the contributor
          // wants when they resubmit. The RLS WITH CHECK requires this flip.
          review_status: 'pending',
          review_notes: null,
          reviewed_by: null,
          reviewed_at: null,
        })
        .eq('id', submissionId)
        .eq('contributor_id', user.id);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteSubmission(submissionId) {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { error } = await supabase
        .from('contributed_exercises')
        .delete()
        .eq('id', submissionId)
        .eq('contributor_id', user.id);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // -------- Admin side --------

  // List submissions for the review queue, filtered by status.
  async listForReview(statusFilter = 'pending') {
    try {
      const isAdmin = await userRoleService.isAdmin();
      if (!isAdmin) {
        return { success: false, error: 'Admin access required', data: [] };
      }

      let query = supabase
        .from('contributed_exercises')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('review_status', statusFilter);
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

  // Approve and publish in one action. Sets review_status='approved' and
  // published_at=now() so the entry becomes visible in the user library.
  async approveSubmission(submissionId, notes = null) {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Not authenticated' };
      }

      const now = new Date().toISOString();
      const { error } = await supabase
        .from('contributed_exercises')
        .update({
          review_status: 'approved',
          review_notes: notes,
          reviewed_by: user.id,
          reviewed_at: now,
          published_at: now,
        })
        .eq('id', submissionId);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Reject (terminal). Contributor sees notes; cannot revise.
  async rejectSubmission(submissionId, notes) {
    return this._setReviewStatus(submissionId, 'rejected', notes);
  }

  // Request revision (contributor sees notes and can edit + resubmit).
  async requestRevision(submissionId, notes) {
    return this._setReviewStatus(submissionId, 'needs_revision', notes);
  }

  async _setReviewStatus(submissionId, status, notes) {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Not authenticated' };
      }

      if (!notes || !notes.trim()) {
        return { success: false, error: 'Review notes are required for this action' };
      }

      const { error } = await supabase
        .from('contributed_exercises')
        .update({
          review_status: status,
          review_notes: notes.trim(),
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          // Clear publication if the row was previously approved+published
          // and the admin is now demoting it.
          published_at: null,
        })
        .eq('id', submissionId);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // -------- User-facing --------

  // List approved + published entries, normalized to match the shape used
  // by content/exercises-comprehensive.js so the library UI can merge.
  // Adds `isContributed: true` and `attributionName` so the UI can flag them.
  async listPublished() {
    try {
      const { data, error } = await supabase
        .from('contributed_exercises')
        .select('id, attribution_name, title, category, instructions, steps, duration, published_at')
        .eq('review_status', 'approved')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message, data: [] };
      }

      const normalized = (data || []).map((row) => ({
        id: `C-${row.id.slice(0, 8)}`,            // visual ID, not used as a key
        dbId: row.id,
        title: row.title,
        steps: row.steps || [],
        duration: row.duration,
        instructions: row.instructions,
        source: `Contributed by ${row.attribution_name}`,
        category: row.category,
        isContributed: true,
        attributionName: row.attribution_name,
        publishedAt: row.published_at,
      }));

      return { success: true, data: normalized };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }
}

function validateSubmission(payload) {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'Submission payload missing' };
  }
  const title = (payload.title || '').trim();
  if (title.length < 3 || title.length > 200) {
    return { ok: false, error: 'Title must be 3–200 characters.' };
  }
  const attribution = (payload.attribution_name || '').trim();
  if (attribution.length < 1 || attribution.length > 120) {
    return { ok: false, error: 'Attribution name is required (1–120 characters).' };
  }
  if (!VALID_CATEGORIES.has(payload.category)) {
    return { ok: false, error: 'Pick a category from the list.' };
  }
  const instructions = (payload.instructions || '').trim();
  if (instructions.length < 10 || instructions.length > 2000) {
    return { ok: false, error: 'Purpose/instructions must be 10–2000 characters.' };
  }
  const steps = Array.isArray(payload.steps)
    ? payload.steps.map((s) => String(s).trim()).filter(Boolean)
    : [];
  if (steps.length < 1) {
    return { ok: false, error: 'Add at least one step.' };
  }
  const duration = Number(payload.duration);
  if (!Number.isFinite(duration) || duration < 1 || duration > 240) {
    return { ok: false, error: 'Duration must be between 1 and 240 minutes.' };
  }
  return { ok: true };
}

export default new ContributedExerciseService();
