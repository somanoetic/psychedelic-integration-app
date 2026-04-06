import { supabase } from './supabase';

/**
 * Insights Data Service
 * Aggregates check-in data from all tracking tables for the Insights dashboard
 */
class InsightsDataService {

  async getInsightsSummary(userId, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceISO = since.toISOString();

    const [nsCheckins, partsCheckins, triggerLogs, glimmerLogs, habits, habitCompletions, polyvagalPatterns] =
      await Promise.all([
        this._fetchNSCheckins(userId, sinceISO),
        this._fetchPartsCheckins(userId, sinceISO),
        this._fetchTriggerLogs(userId, sinceISO),
        this._fetchGlimmerLogs(userId, sinceISO),
        this._fetchHabits(userId),
        this._fetchHabitCompletions(userId, sinceISO),
        this._fetchPolyvagalPatterns(userId),
      ]);

    return {
      nsCheckins,
      partsCheckins,
      triggerLogs,
      glimmerLogs,
      habits,
      habitCompletions,
      polyvagalPatterns,
    };
  }

  // --- Fetchers ---

  async _fetchNSCheckins(userId, since) {
    try {
      const { data, error } = await supabase
        .from('nervous_system_checkins')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', since)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('InsightsDataService: NS checkins error', e);
      return [];
    }
  }

  async _fetchPartsCheckins(userId, since) {
    try {
      const { data, error } = await supabase
        .from('parts_checkins')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', since)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('InsightsDataService: Parts checkins error', e);
      return [];
    }
  }

  async _fetchTriggerLogs(userId, since) {
    try {
      const { data, error } = await supabase
        .from('trigger_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', since)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('InsightsDataService: Trigger logs error', e);
      return [];
    }
  }

  async _fetchGlimmerLogs(userId, since) {
    try {
      const { data, error } = await supabase
        .from('glimmer_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', since)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('InsightsDataService: Glimmer logs error', e);
      return [];
    }
  }

  async _fetchHabits(userId) {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('InsightsDataService: Habits error', e);
      return [];
    }
  }

  async _fetchHabitCompletions(userId, since) {
    try {
      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', userId)
        .gte('completion_date', since.split('T')[0])
        .order('completion_date', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('InsightsDataService: Habit completions error', e);
      return [];
    }
  }

  async _fetchPolyvagalPatterns(userId) {
    try {
      const { data, error } = await supabase
        .from('polyvagal_patterns')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (e) {
      console.error('InsightsDataService: Polyvagal patterns error', e);
      return null;
    }
  }

  // --- Aggregations ---

  getStateDistribution(nsCheckins) {
    if (!nsCheckins.length) return null;
    const counts = { ventral: 0, sympathetic: 0, dorsal: 0, mixed: 0 };
    nsCheckins.forEach(c => {
      if (counts.hasOwnProperty(c.ns_state)) counts[c.ns_state]++;
    });
    const total = nsCheckins.length;
    return {
      ventral: counts.ventral / total,
      sympathetic: counts.sympathetic / total,
      dorsal: counts.dorsal / total,
      mixed: counts.mixed / total,
      counts,
      total,
    };
  }

  getStateTimeline(nsCheckins, groupBy = 'week') {
    if (!nsCheckins.length) return [];

    const buckets = {};
    nsCheckins.forEach(c => {
      const d = new Date(c.created_at);
      let key;
      if (groupBy === 'day') {
        key = d.toISOString().split('T')[0];
      } else {
        // Group by week (Monday start)
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d);
        monday.setDate(diff);
        key = monday.toISOString().split('T')[0];
      }

      if (!buckets[key]) buckets[key] = { date: key, ventral: 0, sympathetic: 0, dorsal: 0, mixed: 0 };
      if (buckets[key].hasOwnProperty(c.ns_state)) buckets[key][c.ns_state]++;
    });

    return Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date));
  }

  getPartsActivity(partsCheckins) {
    if (!partsCheckins.length) return [];
    const map = {};
    partsCheckins.forEach(c => {
      const type = c.part_type;
      if (!map[type]) map[type] = { type, count: 0, totalIntensity: 0 };
      map[type].count++;
      map[type].totalIntensity += (c.intensity || 3);
    });
    return Object.values(map)
      .map(p => ({ ...p, avgIntensity: Math.round((p.totalIntensity / p.count) * 10) / 10 }))
      .sort((a, b) => b.count - a.count);
  }

  getTriggerGlimmerBalance(triggerLogs, glimmerLogs) {
    const triggers = triggerLogs.length;
    const glimmers = glimmerLogs.length;
    return {
      triggers,
      glimmers,
      ratio: triggers > 0 ? Math.round((glimmers / triggers) * 100) / 100 : glimmers > 0 ? Infinity : 0,
    };
  }

  getTopTriggers(triggerLogs, limit = 5) {
    // Group by trigger_type
    const map = {};
    triggerLogs.forEach(t => {
      const type = t.trigger_type || 'unknown';
      if (!map[type]) map[type] = { type, count: 0 };
      map[type].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, limit);
  }

  getTopGlimmers(glimmerLogs, limit = 5) {
    const map = {};
    glimmerLogs.forEach(g => {
      const type = g.glimmer_type || 'unknown';
      if (!map[type]) map[type] = { type, count: 0 };
      map[type].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, limit);
  }

  getHabitStreaks(habits, completions) {
    if (!habits.length) return [];

    return habits.map(habit => {
      const habitCompletions = completions
        .filter(c => c.habit_id === habit.id)
        .map(c => c.completion_date)
        .sort();

      const totalDays = habitCompletions.length;

      // Calculate current streak
      let currentStreak = 0;
      const today = new Date().toISOString().split('T')[0];
      let checkDate = new Date(today);
      for (let i = 0; i < 365; i++) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (habitCompletions.includes(dateStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      // Completion rate (over the period)
      const createdDate = new Date(habit.created_at);
      const daysSinceCreated = Math.max(1, Math.ceil((new Date() - createdDate) / (1000 * 60 * 60 * 24)));
      const completionRate = Math.min(1, totalDays / daysSinceCreated);

      return {
        id: habit.id,
        name: habit.name,
        currentStreak,
        totalDays,
        completionRate,
      };
    });
  }
}

export default new InsightsDataService();
