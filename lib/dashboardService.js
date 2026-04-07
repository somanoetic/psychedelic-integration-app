import { supabase } from './supabase';

/**
 * Fetch dashboard widget data in parallel.
 * Returns { nsCheckin, habitProgress, glimmerCount } with nulls on failure.
 */
export async function fetchDashboardData() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { nsCheckin: null, habitProgress: null, glimmerCount: null };

  const userId = user.id;

  const [nsCheckin, habitProgress, glimmerCount] = await Promise.all([
    fetchLastNSCheckin(userId),
    fetchTodayHabits(userId),
    fetchWeeklyGlimmers(userId),
  ]);

  return { nsCheckin, habitProgress, glimmerCount };
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
