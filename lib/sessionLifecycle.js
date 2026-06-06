/**
 * Session lifecycle helpers — single source of truth for a session's
 * working state (in-progress vs closed) and its phase progress label.
 *
 * A session is considered CLOSED when either:
 *   1. The user explicitly closed it (session_data.status === 'closed'), or
 *   2. Integration has been completed (session_data.integration.completed).
 * Otherwise it is IN-PROGRESS.
 *
 * Keep this logic here so the Prepare hub, the Process & Integrate picker,
 * the History archive, and the per-session screens all agree.
 */

import { icons } from './uiIcons';
import { colors } from '../theme/colors';

export function isClosed(session) {
  const data = session?.session_data || {};
  return data.status === 'closed' || data.integration?.completed === true;
}

export function isInProgress(session) {
  return !isClosed(session);
}

// Phase-based status used for cards/badges. 'category' groups into the two
// list buckets (inProgress | closed) the pickers filter on.
export function getSessionStatus(session) {
  const data = session?.session_data || {};
  const prep = data.preparation;
  const experience = data.experienceProcessing;
  const integration = data.integration;

  if (isClosed(session)) {
    return { text: 'Closed', icon: icons.integration, color: colors.success, category: 'closed' };
  }
  if (experience?.completed) {
    return { text: 'Processed', icon: icons.journal, color: colors.primary, category: 'inProgress' };
  }
  if (prep?.completedSections?.length > 0) {
    return { text: 'In Progress', icon: icons.trailProgress, color: colors.warning, category: 'inProgress' };
  }
  return { text: 'New', icon: icons.newBeginning, color: colors.textSecondary, category: 'inProgress' };
}

// "Ready to process" = the journey has happened or prep is done, so the
// session is a sensible candidate for the Process & Integrate picker to
// surface first. Past-or-today journey date OR any prep progress.
export function isReadyToProcess(session) {
  const data = session?.session_data || {};
  if (data.preparation?.completedSections?.length > 0) return true;
  if (data.experienceProcessing?.completed) return true;
  const journey = session?.journey_date;
  if (journey) {
    // Compare date-only (journey_date is stored YYYY-MM-DD).
    const today = new Date().toISOString().split('T')[0];
    return journey <= today;
  }
  return false;
}

// Build the patch to mark a session closed without clobbering other
// session_data. Callers spread this into their Supabase update.
export function closeSessionPatch(session) {
  const data = session?.session_data || {};
  return {
    session_data: {
      ...data,
      status: 'closed',
      closedAt: new Date().toISOString(),
    },
  };
}

// Reopen (clear the manual close flag). Note: if integration.completed is
// true the session will still read as closed — that's intended.
export function reopenSessionPatch(session) {
  const data = session?.session_data || {};
  const next = { ...data };
  delete next.status;
  delete next.closedAt;
  return { session_data: next };
}
