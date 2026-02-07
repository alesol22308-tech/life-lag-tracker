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
      // Handle URL-encoded user_id (e.g., %3Cuuid%3E becomes <uuid>)
      userId = decodeURIComponent(targetUserId);
      
      // Validate UUID format (basic check)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        return NextResponse.json({ 
          error: 'Invalid user_id format. Expected UUID.',
          received: userId
        }, { status: 400 });
      }
      
      let serviceRoleSupabase;
      try {
        serviceRoleSupabase = createServiceRoleClient();
      } catch (clientError: any) {
        console.error('[Test Reminder] Service role client error:', clientError);
        return NextResponse.json({ 
          error: 'Failed to create service role client',
          details: clientError.message
        }, { status: 500 });
      }

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
    // Return more detailed error in development, generic in production
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message || 'Internal server error'
      : 'Internal server error';
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
