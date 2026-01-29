import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { validateApiKey, extractApiKey, hasScope, generateSigningSecret } from '@/lib/api-auth';
import { applyRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// Valid webhook events
const VALID_EVENTS = ['checkin.completed', '*'];

/**
 * GET /api/v1/webhooks
 * List user's webhook subscriptions
 */
export async function GET(request: Request) {
  try {
    const supabase = createClient();

    // Extract and validate API key
    const apiKey = extractApiKey(request);
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key. Use Authorization: Bearer <key> or X-API-Key header.' },
        { status: 401 }
      );
    }

    const validation = await validateApiKey(supabase, apiKey);
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: validation.error || 'Invalid API key' },
        { status: 401 }
      );
    }

    // Apply rate limiting
    const rateLimit = applyRateLimit(validation.user.keyId, validation.user.tier);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: rateLimit.error?.message },
        { status: 429, headers: rateLimit.headers }
      );
    }

    // Fetch webhooks
    const { data: webhooks, error } = await supabase
      .from('webhook_subscriptions')
      .select('id, url, events, is_active, created_at, last_delivery_at, last_delivery_status, consecutive_failures')
      .eq('user_id', validation.user.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching webhooks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch webhooks' },
        { status: 500, headers: rateLimit.headers }
      );
    }

    const response = {
      data: (webhooks || []).map((w) => ({
        id: w.id,
        url: w.url,
        events: w.events,
        isActive: w.is_active,
        createdAt: w.created_at,
        lastDeliveryAt: w.last_delivery_at,
        lastDeliveryStatus: w.last_delivery_status,
        consecutiveFailures: w.consecutive_failures,
      })),
    };

    return NextResponse.json(response, { headers: rateLimit.headers });
  } catch (error: any) {
    console.error('Error in GET /api/v1/webhooks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/webhooks
 * Register a new webhook subscription
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient();

    // Extract and validate API key
    const apiKey = extractApiKey(request);
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key. Use Authorization: Bearer <key> or X-API-Key header.' },
        { status: 401 }
      );
    }

    const validation = await validateApiKey(supabase, apiKey);
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: validation.error || 'Invalid API key' },
        { status: 401 }
      );
    }

    // Apply rate limiting
    const rateLimit = applyRateLimit(validation.user.keyId, validation.user.tier);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: rateLimit.error?.message },
        { status: 429, headers: rateLimit.headers }
      );
    }

    // Parse request body
    const body = await request.json();
    const { url, events } = body;

    // Validate URL
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400, headers: rateLimit.headers }
      );
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400, headers: rateLimit.headers }
      );
    }

    // Validate events
    const eventList = events || ['checkin.completed'];
    if (!Array.isArray(eventList)) {
      return NextResponse.json(
        { error: 'Events must be an array' },
        { status: 400, headers: rateLimit.headers }
      );
    }

    for (const event of eventList) {
      if (!VALID_EVENTS.includes(event)) {
        return NextResponse.json(
          { error: `Invalid event: ${event}. Valid events: ${VALID_EVENTS.join(', ')}` },
          { status: 400, headers: rateLimit.headers }
        );
      }
    }

    // Check webhook limit (max 5 per user)
    const { count } = await supabase
      .from('webhook_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', validation.user.userId);

    if ((count || 0) >= 5) {
      return NextResponse.json(
        { error: 'Maximum of 5 webhooks per user. Delete an existing webhook to create a new one.' },
        { status: 400, headers: rateLimit.headers }
      );
    }

    // Generate signing secret
    const signingSecret = generateSigningSecret();

    // Create webhook
    const { data: webhook, error } = await supabase
      .from('webhook_subscriptions')
      .insert({
        user_id: validation.user.userId,
        url,
        events: eventList,
        signing_secret: signingSecret,
        is_active: true,
      })
      .select('id, created_at')
      .single();

    if (error) {
      console.error('Error creating webhook:', error);
      return NextResponse.json(
        { error: 'Failed to create webhook' },
        { status: 500, headers: rateLimit.headers }
      );
    }

    const response = {
      id: webhook.id,
      url,
      events: eventList,
      signingSecret, // Only returned once at creation
      isActive: true,
      createdAt: webhook.created_at,
    };

    return NextResponse.json(response, { status: 201, headers: rateLimit.headers });
  } catch (error: any) {
    console.error('Error in POST /api/v1/webhooks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/webhooks
 * Delete a webhook subscription
 */
export async function DELETE(request: Request) {
  try {
    const supabase = createClient();

    // Extract and validate API key
    const apiKey = extractApiKey(request);
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key. Use Authorization: Bearer <key> or X-API-Key header.' },
        { status: 401 }
      );
    }

    const validation = await validateApiKey(supabase, apiKey);
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: validation.error || 'Invalid API key' },
        { status: 401 }
      );
    }

    // Apply rate limiting
    const rateLimit = applyRateLimit(validation.user.keyId, validation.user.tier);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: rateLimit.error?.message },
        { status: 429, headers: rateLimit.headers }
      );
    }

    // Get webhook ID from query params
    const url = new URL(request.url);
    const webhookId = url.searchParams.get('id');

    if (!webhookId) {
      return NextResponse.json(
        { error: 'Webhook ID is required (use ?id=<webhook_id>)' },
        { status: 400, headers: rateLimit.headers }
      );
    }

    // Delete webhook (only if owned by user)
    const { error } = await supabase
      .from('webhook_subscriptions')
      .delete()
      .eq('id', webhookId)
      .eq('user_id', validation.user.userId);

    if (error) {
      console.error('Error deleting webhook:', error);
      return NextResponse.json(
        { error: 'Failed to delete webhook' },
        { status: 500, headers: rateLimit.headers }
      );
    }

    return NextResponse.json(
      { message: 'Webhook deleted successfully' },
      { headers: rateLimit.headers }
    );
  } catch (error: any) {
    console.error('Error in DELETE /api/v1/webhooks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
