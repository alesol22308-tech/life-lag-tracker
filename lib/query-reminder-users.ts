import { createServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * Day name to day number mapping (JavaScript Date.getDay() format)
 * Sunday = 0, Monday = 1, etc.
 */
const DAY_MAP: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

/**
 * User with push subscriptions for reminder
 */
export interface ReminderUser {
  id: string;
  preferred_checkin_day: string | null;
  preferred_checkin_time: string | null;
}

/**
 * Push subscription from database
 */
export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  platform: string;
}

/**
 * Result type for reminder users query
 */
export interface ReminderUserResult {
  user: ReminderUser;
  subscriptions: PushSubscription[];
}

/**
 * Query users who need push notification reminders
 * 
 * @param currentDay - Current day name (e.g., "Monday")
 * @param currentHour - Current UTC hour (0-23)
 * @returns Array of users with their push subscriptions who need reminders
 */
export async function queryReminderUsers(
  currentDay: string,
  currentHour: number
): Promise<ReminderUserResult[]> {
  const supabase = createServiceRoleClient();

  // Get current day number
  const currentDayNum = DAY_MAP[currentDay];
  if (currentDayNum === undefined) {
    console.warn(`[Query Reminder Users] Invalid day name: ${currentDay}`);
    return [];
  }

  // Query users with push subscriptions where:
  // 1. preferred_checkin_day matches current day (or is null)
  // 2. They have at least one push_subscription
  // Note: We query all users with subscriptions, then filter by day in code
  // This is because Supabase's .or() with null checks can be tricky
  const { data: usersWithSubs, error: queryError } = await supabase
    .from('users')
    .select(`
      id,
      preferred_checkin_day,
      preferred_checkin_time,
      push_subscriptions (
        id,
        user_id,
        endpoint,
        p256dh,
        auth,
        platform
      )
    `);

  if (queryError) {
    console.error('[Query Reminder Users] Error fetching users:', queryError);
    throw queryError;
  }

  if (!usersWithSubs || usersWithSubs.length === 0) {
    return [];
  }

  // Filter users based on time preference and check-in status
  const results: ReminderUserResult[] = [];

  for (const userData of usersWithSubs) {
    const user = {
      id: userData.id,
      preferred_checkin_day: userData.preferred_checkin_day,
      preferred_checkin_time: userData.preferred_checkin_time,
    };

    // Get subscriptions (handle both array and single object from Supabase)
    const subscriptions = Array.isArray(userData.push_subscriptions)
      ? userData.push_subscriptions
      : userData.push_subscriptions
      ? [userData.push_subscriptions]
      : [];

    // Skip if no subscriptions
    if (subscriptions.length === 0) {
      continue;
    }

    // Check if day matches
    if (user.preferred_checkin_day && user.preferred_checkin_day !== currentDay) {
      continue;
    }

    // Check if time matches (if user has preferred time)
    if (user.preferred_checkin_time) {
      // Extract hour from TIME format (HH:MM:SS or HH:MM)
      const timeParts = user.preferred_checkin_time.split(':');
      const preferredHour = parseInt(timeParts[0], 10);

      // If preferred hour doesn't match current hour, skip
      // (We're running hourly, so this ensures we only send at the right hour)
      if (preferredHour !== currentHour) {
        continue;
      }
    } else {
      // If no preferred time, send at default hour (9am UTC)
      if (currentHour !== 9) {
        continue;
      }
    }

    // Check if user has checked in this week (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentCheckin } = await supabase
      .from('checkins')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', sevenDaysAgo.toISOString())
      .limit(1)
      .maybeSingle();

    // If they have a recent check-in, skip them
    if (recentCheckin) {
      continue;
    }

    // User needs a reminder - add to results
    results.push({
      user,
      subscriptions: subscriptions as PushSubscription[],
    });
  }

  return results;
}
