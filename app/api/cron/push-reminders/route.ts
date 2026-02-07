import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { queryReminderUsers } from '@/lib/query-reminder-users';
import { sendPushNotification } from '@/lib/send-push';
import { NextResponse } from 'next/server';
import type { CronReminderResponse, CronReminderMetrics } from '@/types/push';

// Mark as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

/**
 * Cron job to send push notification reminders for weekly check-ins
 * 
 * Runs hourly to catch all timezones and preferred times
 * 
 * Query logic:
 * - Gets users where today matches their preferred_checkin_day
 * - Filters to users who haven't checked in this week (last 7 days)
 * - Only includes users with active push_subscriptions
 * - Respects preferred_checkin_time (sends at appropriate hour)
 */
export async function POST(request: Request) {
  const startTime = new Date();
  const metrics: CronReminderMetrics = {
    sent: 0,
    delivered: 0,
    failed: 0,
    expired: 0,
    usersProcessed: 0,
    subscriptionsProcessed: 0,
  };
  const errors: Array<{ user_id: string; subscription_id?: string; error: string }> = [];

  try {
    // Verify this is coming from a trusted source (Vercel Cron)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current day and hour
    const now = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayNames[now.getUTCDay()];
    const currentHour = now.getUTCHours();

    console.log(`[Push Reminders Cron] Starting at ${now.toISOString()} (${currentDay}, hour ${currentHour})`);

    // Query users who need reminders
    const reminderUsers = await queryReminderUsers(currentDay, currentHour);

    if (reminderUsers.length === 0) {
      console.log('[Push Reminders Cron] No users need reminders at this time');
      const endTime = new Date();
      return NextResponse.json({
        success: true,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationMs: endTime.getTime() - startTime.getTime(),
        metrics,
      } as CronReminderResponse);
    }

    console.log(`[Push Reminders Cron] Found ${reminderUsers.length} users needing reminders`);

    // Process users in batches of 50
    const BATCH_SIZE = 50;
    const supabase = createServiceRoleClient();

    for (let i = 0; i < reminderUsers.length; i += BATCH_SIZE) {
      const batch = reminderUsers.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(reminderUsers.length / BATCH_SIZE);

      console.log(`[Push Reminders Cron] Processing batch ${batchNum}/${totalBatches} (${batch.length} users)`);

      // Process each user in the batch
      for (const { user, subscriptions } of batch) {
        metrics.usersProcessed++;

        // Send notification to each subscription (user might have multiple devices)
        for (const subscription of subscriptions) {
          metrics.subscriptionsProcessed++;
          metrics.sent++;

          try {
            const result = await sendPushNotification(
              {
                endpoint: subscription.endpoint,
                keys: {
                  p256dh: subscription.p256dh,
                  auth: subscription.auth,
                },
              },
              'Weekly Check-In Time',
              "How's your week going? Take 2 minutes to check in with yourself.",
              {
                icon: '/icon-192.png',
                badge: '/badge-72.png',
                data: {
                  url: '/dashboard',
                  type: 'weekly_reminder',
                },
                tag: 'weekly-reminder',
              }
            );

            if (result.success) {
              metrics.delivered++;
            } else {
              // Handle different error types
              if (result.statusCode === 410 || result.statusCode === 404) {
                // Subscription expired or not found - delete from database
                metrics.expired++;
                metrics.sent--; // Don't count expired as "sent"

                // Delete expired subscription from database
                try {
                  await supabase
                    .from('push_subscriptions')
                    .delete()
                    .eq('id', subscription.id);

                  console.log(`[Push Reminders Cron] Deleted expired subscription ${subscription.id} (${result.statusCode}) for user ${user.id}`);
                } catch (deleteError: any) {
                  console.error(
                    `[Push Reminders Cron] Error deleting expired subscription ${subscription.id}:`,
                    deleteError
                  );
                }
              } else if (result.statusCode === 401) {
                // VAPID key issue - log but don't retry
                metrics.failed++;
                errors.push({
                  user_id: user.id,
                  subscription_id: subscription.id,
                  error: `VAPID auth error: ${result.error}`,
                });
                console.error(
                  `[Push Reminders Cron] VAPID auth error for user ${user.id}, subscription ${subscription.id}:`,
                  result.error
                );
              } else {
                // Other errors (network, rate limit, etc.)
                metrics.failed++;
                errors.push({
                  user_id: user.id,
                  subscription_id: subscription.id,
                  error: result.error || 'Unknown error',
                });
                console.error(
                  `[Push Reminders Cron] Error sending to user ${user.id}, subscription ${subscription.id}:`,
                  result.error
                );
              }
            }
          } catch (error: any) {
            // Unexpected error during send
            metrics.failed++;
            errors.push({
              user_id: user.id,
              subscription_id: subscription.id,
              error: error.message || 'Unexpected error',
            });
            console.error(
              `[Push Reminders Cron] Unexpected error for user ${user.id}, subscription ${subscription.id}:`,
              error
            );
          }
        }
      }

      // Add delay between batches (except for the last batch)
      if (i + BATCH_SIZE < reminderUsers.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();

    console.log(`[Push Reminders Cron] Completed in ${durationMs}ms`);
    console.log(`[Push Reminders Cron] Metrics:`, metrics);

    const response: CronReminderResponse = {
      success: true,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      durationMs,
      metrics,
      ...(errors.length > 0 && { errors }),
    };

    return NextResponse.json(response);
  } catch (error: any) {
    const endTime = new Date();
    console.error('[Push Reminders Cron] Fatal error:', error);

    return NextResponse.json(
      {
        success: false,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationMs: endTime.getTime() - startTime.getTime(),
        metrics,
        errors: [
          ...errors,
          {
            user_id: 'system',
            error: error.message || 'Fatal error in cron job',
          },
        ],
      } as CronReminderResponse,
      { status: 500 }
    );
  }
}
