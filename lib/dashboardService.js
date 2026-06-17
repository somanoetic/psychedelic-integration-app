import { supabase } from './supabase';

/**
 * Fetch dashboard widget data in parallel.
 * Returns { nsCheckin, habitProgress, glimmerCount, lastTrigger, lastParts }
 * with nulls on failure. These five map to the five Track indicators on the
 * home screen.
 */
export async function fetchDashboardData() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      nsCheckin: null,
      habitProgress: null,
      glimmerCount: null,
      lastTrigger: null,
      lastParts: null,
    };
  }

  const userId = user.id;

  const [nsCheckin, habitProgress, glimmerCount, lastTrigger, lastParts] = await Promise.all([
    fetchLastNSCheckin(userId),
    fetchTodayHabits(userId),
    fetchWeeklyGlimmers(userId),
    fetchLastTrigger(userId),
    fetchLastParts(userId),
  ]);

  return { nsCheckin, habitProgress, glimmerCount, lastTrigger, lastParts };
}

async function fetchLastNSCheckin(userId) {
  try {
    const { data } = await supabase
      .from('nervous_system_checkins')
      .select('ns_state, intensity, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);
    return data?.[0] || null;
  } catch {
    return null;
  }
}

async function fetchTodayHabits(userId) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [habitsRes, completionsRes] = await Promise.all([
      supabase
        .from('habits')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', true),
      supabase
        .from('habit_completions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('completion_date', today),
    ]);

    return {
      total: habitsRes.count || 0,
      completed: completionsRes.count || 0,
    };
  } catch {
    return null;
  }
}

async function fetchWeeklyGlimmers(userId) {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { count } = await supabase
      .from('glimmer_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', weekAgo.toISOString());

    return { count: count || 0 };
  } catch {
    return null;
  }
}

async function fetchLastTrigger(userId) {
  try {
    const { data } = await supabase
      .from('trigger_logs')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);
    return data?.[0] || null;
  } catch {
    return null;
  }
}

async function fetchLastParts(userId) {
  try {
    const { data } = await supabase
      .from('parts_checkins')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);
    return data?.[0] || null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Track history — a unified, reverse-chronological feed across the four
// "log a moment" trackers (NS check-ins, glimmers, triggers, parts). Habits
// are a daily count rather than discrete reflective entries, so they're shown
// as a summary card on the Track hub, not interleaved here.
// ---------------------------------------------------------------------------

/**
 * Fetch recent entries from each tracker and merge into one list sorted by
 * created_at desc. Each item is normalised to:
 *   { id, kind, createdAt, title, subtitle, intensity? }
 * `kind` is one of 'nervous' | 'glimmer' | 'trigger' | 'parts'.
 */
export async function fetchTrackHistory(limitPerSource = 25) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const userId = user.id;

  const [ns, glimmers, triggers, parts] = await Promise.all([
    fetchNSEntries(userId, limitPerSource),
    fetchGlimmerEntries(userId, limitPerSource),
    fetchTriggerEntries(userId, limitPerSource),
    fetchPartsEntries(userId, limitPerSource),
  ]);

  return [...ns, ...glimmers, ...triggers, ...parts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

const NS_STATE_LABELS = {
  ventral: 'Safe & Social',
  sympathetic: 'Fight / Flight',
  dorsal: 'Shutdown',
  mixed: 'Mixed / Blended',
};

async function fetchNSEntries(userId, limit) {
  try {
    const { data } = await supabase
      .from('nervous_system_checkins')
      .select('id, ns_state, intensity, body_feeling, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return (data || []).map((row) => ({
      id: `ns_${row.id}`,
      kind: 'nervous',
      createdAt: row.created_at,
      title: NS_STATE_LABELS[row.ns_state] || 'Nervous system',
      subtitle: row.body_feeling || null,
      intensity: row.intensity ?? null,
    }));
  } catch {
    return [];
  }
}

async function fetchGlimmerEntries(userId, limit) {
  try {
    const { data } = await supabase
      .from('glimmer_logs')
      .select('id, glimmer_type, description, felt_shift, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return (data || []).map((row) => ({
      id: `glimmer_${row.id}`,
      kind: 'glimmer',
      createdAt: row.created_at,
      title: row.description || 'A glimmer',
      subtitle: row.glimmer_type ? capitalize(row.glimmer_type) : null,
      intensity: row.felt_shift ?? null,
    }));
  } catch {
    return [];
  }
}

async function fetchTriggerEntries(userId, limit) {
  try {
    const { data } = await supabase
      .from('trigger_logs')
      .select('id, trigger_type, cause, intensity, current_state, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return (data || []).map((row) => ({
      id: `trigger_${row.id}`,
      kind: 'trigger',
      createdAt: row.created_at,
      title: row.cause || 'A trigger',
      subtitle: row.current_state || null,
      intensity: row.intensity ?? null,
    }));
  } catch {
    return [];
  }
}

async function fetchPartsEntries(userId, limit) {
  try {
    const { data } = await supabase
      .from('parts_checkins')
      .select('id, part_type, part_name, what_its_saying, intensity, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return (data || []).map((row) => ({
      id: `parts_${row.id}`,
      kind: 'parts',
      createdAt: row.created_at,
      title: row.part_name || capitalize(row.part_type) || 'A part',
      subtitle: row.what_its_saying || null,
      intensity: row.intensity ?? null,
    }));
  } catch {
    return [];
  }
}

function capitalize(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
