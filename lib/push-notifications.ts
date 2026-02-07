import { sendPushNotification } from '@/lib/send-push';
import type { PushSubscriptionData } from '@/lib/send-push';

/**
 * Notification types supported by the push notification system
 */
export type NotificationType =
  | 'weekly_reminder'
  | 'milestone_achievement'
  | 'streak_reminder'
  | 'recovery_detected'
  | 'mid_week_check'
  | 'welcome'
  | 'checkin_complete'
  | 'streak_warning'; // Example: New notification type

/**
 * Notification configuration for different types
 */
interface NotificationConfig {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag: string;
  url: string;
  data: Record<string, string>;
}

/**
 * Get notification configuration for a specific type
 */
function getNotificationConfig(
  type: NotificationType,
  options?: {
    milestoneType?: 'checkin_count' | 'streak' | 'recovery';
    milestoneValue?: number;
    streakCount?: number;
    userName?: string;
  }
): NotificationConfig {
  const baseConfig = {
    icon: '/icon-192.png',
    badge: '/badge-72.png',
  };

  switch (type) {
    case 'weekly_reminder':
      return {
        ...baseConfig,
        title: 'Weekly Check-In Time',
        body: "How's your week going? Take 2 minutes to check in with yourself.",
        tag: 'weekly-reminder',
        url: '/dashboard',
        data: { url: '/dashboard', type: 'weekly_reminder' },
      };

    case 'milestone_achievement':
      const milestoneMessages: Record<string, string> = {
        checkin_count: `🎉 You've completed ${options?.milestoneValue || 0} check-ins!`,
        streak: `🔥 ${options?.streakCount || 0}-week streak! You're on fire!`,
        recovery: `✨ Great recovery! You're back on track.`,
      };
      const milestoneType = options?.milestoneType || 'checkin_count';
      return {
        ...baseConfig,
        title: 'Milestone Achieved! 🎉',
        body: milestoneMessages[milestoneType] || 'You reached a new milestone!',
        tag: 'milestone',
        url: '/dashboard',
        data: {
          url: '/dashboard',
          type: 'milestone_achievement',
          milestoneType,
          milestoneValue: String(options?.milestoneValue || 0),
        },
      };

    case 'streak_reminder':
      return {
        ...baseConfig,
        title: 'Keep Your Streak Going!',
        body: `You're on a ${options?.streakCount || 0}-week streak. Don't break it now!`,
        tag: 'streak-reminder',
        url: '/checkin',
        data: { url: '/checkin', type: 'streak_reminder' },
      };

    case 'recovery_detected':
      return {
        ...baseConfig,
        title: 'Great Recovery! ✨',
        body: "Your scores are improving! Keep up the momentum.",
        tag: 'recovery',
        url: '/dashboard',
        data: { url: '/dashboard', type: 'recovery_detected' },
      };

    case 'mid_week_check':
      return {
        ...baseConfig,
        title: 'Mid-Week Check',
        body: "How's your week feeling? Take a quick check-in.",
        tag: 'mid-week',
        url: '/checkin',
        data: { url: '/checkin', type: 'mid_week_check' },
      };

    case 'welcome':
      return {
        ...baseConfig,
        title: 'Welcome to Life-Lag! 👋',
        body: `Hi ${options?.userName || 'there'}! Ready for your first check-in?`,
        tag: 'welcome',
        url: '/checkin',
        data: { url: '/checkin', type: 'welcome' },
      };

    case 'checkin_complete':
      return {
        ...baseConfig,
        title: 'Check-In Complete ✅',
        body: 'Thanks for checking in! See your results.',
        tag: 'checkin-complete',
        url: '/results',
        data: { url: '/results', type: 'checkin_complete' },
      };

    case 'streak_warning':
      return {
        ...baseConfig,
        title: 'Streak at Risk! ⚠️',
        body: `Your ${options?.streakCount || 0}-week streak is about to end. Check in now!`,
        tag: 'streak-warning',
        url: '/checkin',
        data: { url: '/checkin', type: 'streak_warning' },
      };

    default:
      return {
        ...baseConfig,
        title: 'Notification',
        body: 'You have a new notification.',
        tag: 'default',
        url: '/dashboard',
        data: { url: '/dashboard', type: 'notification' },
      };
  }
}

/**
 * Send a typed push notification
 * 
 * @param subscription - Push subscription to send to
 * @param type - Type of notification to send
 * @param options - Optional data for the notification
 * @returns Promise with success status and error message
 */
export async function sendTypedPushNotification(
  subscription: PushSubscriptionData,
  type: NotificationType,
  options?: {
    milestoneType?: 'checkin_count' | 'streak' | 'recovery';
    milestoneValue?: number;
    streakCount?: number;
    userName?: string;
  }
): Promise<{ success: boolean; error?: string; statusCode?: number }> {
  const config = getNotificationConfig(type, options);

  return sendPushNotification(
    subscription,
    config.title,
    config.body,
    {
      icon: config.icon,
      badge: config.badge,
      tag: config.tag,
      url: config.url,
      data: config.data,
    }
  );
}

/**
 * Send push notification to multiple subscriptions
 * 
 * @param subscriptions - Array of push subscriptions
 * @param type - Type of notification to send
 * @param options - Optional data for the notification
 * @returns Promise with array of results
 */
export async function sendTypedPushToMultiple(
  subscriptions: PushSubscriptionData[],
  type: NotificationType,
  options?: {
    milestoneType?: 'checkin_count' | 'streak' | 'recovery';
    milestoneValue?: number;
    streakCount?: number;
    userName?: string;
  }
): Promise<Array<{ success: boolean; error?: string; statusCode?: number }>> {
  const results = await Promise.all(
    subscriptions.map((sub) => sendTypedPushNotification(sub, type, options))
  );
  return results;
}
