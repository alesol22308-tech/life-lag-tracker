/**
 * Types for push notification reminder system
 */

/**
 * Supported notification types
 */
export type NotificationType =
  | 'weekly_reminder'
  | 'milestone_achievement'
  | 'streak_reminder'
  | 'recovery_detected'
  | 'mid_week_check'
  | 'welcome'
  | 'checkin_complete';

export interface ReminderUser {
  id: string;
  preferred_checkin_day: string | null;
  preferred_checkin_time: string | null;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  platform: string;
}

export interface ReminderUserResult {
  user: ReminderUser;
  subscriptions: PushSubscription[];
}

export interface CronReminderMetrics {
  sent: number; // Total notifications sent
  delivered: number; // Successfully delivered
  failed: number; // Failed (non-expired errors)
  expired: number; // Expired subscriptions (deleted)
  usersProcessed: number;
  subscriptionsProcessed: number;
}

export interface CronReminderResponse {
  success: boolean;
  startTime: string;
  endTime: string;
  durationMs: number;
  metrics: CronReminderMetrics;
  errors?: Array<{
    user_id: string;
    subscription_id?: string;
    error: string;
  }>;
}
