import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/utils';
import { sendPushNotification, PushSubscriptionData } from '@/lib/send-push';
import { NextResponse } from 'next/server';

// Mark as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

/**
 * GET: Returns information about the test endpoint
 */
export async function GET() {
  return NextResponse.json({
    message: 'This endpoint requires a POST request to send test push notifications.',
    usage: 'Send a POST request to /api/push/test while authenticated',
    example: 'Use fetch("/api/push/test", { method: "POST" }) from the browser console',
  });
}

/**
 * POST: Send test push notification
 * 
 * Sends a test push notification to all of the authenticated user's push subscriptions.
 * This is useful for testing that push notifications are working correctly.
 */
export async function POST() {
  try {
    const supabase = createClient();
    
    // Authenticate user
    const { user, error: authError } = await requireAuth(supabase);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all push subscriptions for the user
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', user.id)
      .eq('platform', 'web');

    if (fetchError) {
      console.error('Error fetching push subscriptions:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: false,
        sent: 0,
        failed: 0,
        error: 'No push subscriptions found for this user',
      });
    }

    // Send test notification to each subscription
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const subscriptionData: PushSubscriptionData = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        return sendPushNotification(
          subscriptionData,
          'Life-Lag Test',
          'Push notifications are working!',
          {
            data: {
              type: 'test',
            },
            // URL is sent at top level for service worker compatibility
            url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/home`,
          }
        );
      })
    );

    // Count successes and failures
    let sent = 0;
    let failed = 0;
    const errors: Array<{ endpoint: string; error: string }> = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          sent++;
        } else {
          failed++;
          errors.push({
            endpoint: subscriptions[index].endpoint,
            error: result.value.error || 'Unknown error',
          });
        }
      } else {
        failed++;
        errors.push({
          endpoint: subscriptions[index].endpoint,
          error: result.reason?.message || 'Promise rejected',
        });
      }
    });

    return NextResponse.json({
      success: sent > 0,
      sent,
      failed,
      total: subscriptions.length,
      ...(errors.length > 0 && { errors }),
    });
  } catch (error: any) {
    console.error('Error in push test endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
