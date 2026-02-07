import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { requireAuth } from '@/lib/utils';
import { sendPushNotification } from '@/lib/send-push';
import { NextResponse } from 'next/server';

// Mark as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

/**
 * Test endpoint for push notification reminders
 * 
 * GET /api/push/test-reminder?user_id=<uuid> - Send reminder to specific user (admin/testing)
 * GET /api/push/test-reminder - Send reminder to authenticated user
 * 
 * Returns detailed results including FCM response for each subscription
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('user_id');

    const supabase = createClient();

    // If user_id is provided, use service role to access any user (for testing)
    // Otherwise, require authentication and use authenticated user
    let userId: string;

    if (targetUserId) {
      // Admin/testing mode - use service role client
      userId = targetUserId;
      const serviceRoleSupabase = createServiceRoleClient();

      // Verify user exists
      const { data: user, error: userError } = await serviceRoleSupabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Get user's push subscriptions
      const { data: subscriptions, error: subsError } = await serviceRoleSupabase
        .from('push_subscriptions')
        .select('id, user_id, endpoint, p256dh, auth, platform')
        .eq('user_id', userId);

      if (subsError) {
        return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
      }

      if (!subscriptions || subscriptions.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'User has no push subscriptions',
          userId,
        });
      }

      // Send notifications to all subscriptions
      const results = [];
      for (const subscription of subscriptions) {
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

        results.push({
          subscription_id: subscription.id,
          endpoint: subscription.endpoint,
          platform: subscription.platform,
          success: result.success,
          error: result.error,
        });
      }

      return NextResponse.json({
        success: true,
        userId,
        subscriptionsProcessed: subscriptions.length,
        results,
      });
    } else {
      // Authenticated user mode
      const { user, error: authError } = await requireAuth(supabase);
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = user.id;

      // Get user's push subscriptions
      const { data: subscriptions, error: subsError } = await supabase
        .from('push_subscriptions')
        .select('id, user_id, endpoint, p256dh, auth, platform')
        .eq('user_id', userId);

      if (subsError) {
        return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
      }

      if (!subscriptions || subscriptions.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'You have no push subscriptions',
          userId,
        });
      }

      // Send notifications to all subscriptions
      const results = [];
      for (const subscription of subscriptions) {
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

        results.push({
          subscription_id: subscription.id,
          endpoint: subscription.endpoint,
          platform: subscription.platform,
          success: result.success,
          error: result.error,
        });
      }

      return NextResponse.json({
        success: true,
        userId,
        subscriptionsProcessed: subscriptions.length,
        results,
      });
    }
  } catch (error: any) {
    console.error('[Test Reminder] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
