import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/utils';
import { sendTypedPushNotification } from '@/lib/push-notifications';
import { NextResponse } from 'next/server';

// Mark as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

/**
 * Web Push subscription object shape
 */
interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * POST: Subscribe to web push notifications
 * 
 * Stores the push subscription for the authenticated user.
 * The subscription is stored in the push_subscriptions table
 * with individual columns for endpoint, p256dh, and auth.
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    const { user, error: authError } = await requireAuth(supabase);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint, keys } = body as PushSubscriptionData;

    // Validate subscription object
    if (!endpoint || typeof endpoint !== 'string') {
      return NextResponse.json({ error: 'Subscription endpoint is required' }, { status: 400 });
    }

    if (!keys || !keys.p256dh || !keys.auth) {
      return NextResponse.json({ error: 'Subscription keys (p256dh and auth) are required' }, { status: 400 });
    }

    // Store subscription in push_subscriptions table using upsert
    const { error: upsertError } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint: endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        platform: 'web',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,endpoint',
      });

    if (upsertError) {
      console.error('Error saving push subscription:', upsertError);
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }

    // Event-based: welcome
    try {
      const subscription = { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } };
      const userName = user.email?.split('@')[0];
      await sendTypedPushNotification(subscription, 'welcome', userName ? { userName } : undefined);
    } catch (err: any) {
      console.error('[Push Subscribe] Event-based welcome push failed:', err?.message);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in push subscribe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE: Unsubscribe from web push notifications
 * 
 * Removes the push subscription for the authenticated user.
 * Can optionally specify an endpoint to remove a specific subscription.
 */
export async function DELETE(request: Request) {
  try {
    const supabase = createClient();
    
    const { user, error: authError } = await requireAuth(supabase);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to get endpoint from body or query params
    let endpoint: string | null = null;
    
    try {
      const body = await request.json();
      endpoint = body.endpoint;
    } catch {
      // No body provided, check query params
      const { searchParams } = new URL(request.url);
      endpoint = searchParams.get('endpoint');
    }

    if (endpoint) {
      // Remove specific subscription by endpoint
      const { error: deleteError } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('endpoint', endpoint);

      if (deleteError) {
        console.error('Error deleting push subscription:', deleteError);
        return NextResponse.json({ error: 'Failed to remove subscription' }, { status: 500 });
      }
    } else {
      // Remove all web push subscriptions for user
      const { error: deleteError } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('platform', 'web');

      if (deleteError) {
        console.error('Error deleting push subscriptions:', deleteError);
        return NextResponse.json({ error: 'Failed to remove subscriptions' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in push unsubscribe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
