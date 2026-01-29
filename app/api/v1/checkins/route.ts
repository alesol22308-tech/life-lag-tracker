import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { validateApiKey, extractApiKey, hasScope } from '@/lib/api-auth';
import { applyRateLimit, createRateLimitHeaders } from '@/lib/rate-limit';
import { calculateLagScore, getDriftCategory, getWeakestDimension } from '@/lib/calculations';
import { getTip } from '@/lib/tips';
import { Answers, DimensionName, DriftCategory } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/checkins
 * List user's check-ins (paginated)
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

    // Check scope
    if (!hasScope(validation.user.scopes, 'read:checkins')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Required scope: read:checkins' },
        { status: 403 }
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

    // Parse query parameters
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const order = url.searchParams.get('order') === 'asc' ? 'asc' : 'desc';

    // Fetch check-ins
    const { data: checkins, error, count } = await supabase
      .from('checkins')
      .select('id, answers, lag_score, drift_category, weakest_dimension, created_at, score_delta', { count: 'exact' })
      .eq('user_id', validation.user.userId)
      .order('created_at', { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching checkins:', error);
      return NextResponse.json(
        { error: 'Failed to fetch check-ins' },
        { status: 500, headers: rateLimit.headers }
      );
    }

    // Transform response
    const response = {
      data: (checkins || []).map((c) => ({
        id: c.id,
        lagScore: c.lag_score,
        driftCategory: c.drift_category,
        weakestDimension: c.weakest_dimension,
        scoreDelta: c.score_delta,
        answers: c.answers,
        createdAt: c.created_at,
      })),
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    };

    return NextResponse.json(response, { headers: rateLimit.headers });
  } catch (error: any) {
    console.error('Error in GET /api/v1/checkins:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/checkins
 * Create a new check-in
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

    // Check scope
    if (!hasScope(validation.user.scopes, 'write:checkins')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Required scope: write:checkins' },
        { status: 403 }
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
    const answers: Answers = body.answers;

    // Validate answers
    const requiredKeys: (keyof Answers)[] = ['energy', 'sleep', 'structure', 'initiation', 'engagement', 'sustainability'];
    for (const key of requiredKeys) {
      if (typeof answers[key] !== 'number' || answers[key] < 1 || answers[key] > 5) {
        return NextResponse.json(
          { error: `Invalid answer for ${key}. Must be a number between 1 and 5.` },
          { status: 400, headers: rateLimit.headers }
        );
      }
    }

    // Calculate results
    const lagScore = calculateLagScore(answers);
    const driftCategory = getDriftCategory(lagScore);
    const weakestDimension = getWeakestDimension(answers);
    const tip = getTip(weakestDimension, driftCategory);

    // Get previous check-in for score delta
    const { data: previousCheckin } = await supabase
      .from('checkins')
      .select('lag_score')
      .eq('user_id', validation.user.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const previousScore = previousCheckin?.lag_score || null;
    const scoreDelta = previousScore !== null ? lagScore - previousScore : null;

    // Insert check-in
    const { data: newCheckin, error: insertError } = await supabase
      .from('checkins')
      .insert({
        user_id: validation.user.userId,
        answers,
        lag_score: lagScore,
        drift_category: driftCategory,
        weakest_dimension: weakestDimension,
        previous_score: previousScore,
        score_delta: scoreDelta,
      })
      .select('id, created_at')
      .single();

    if (insertError) {
      console.error('Error inserting checkin:', insertError);
      return NextResponse.json(
        { error: 'Failed to create check-in' },
        { status: 500, headers: rateLimit.headers }
      );
    }

    // Trigger webhooks asynchronously
    triggerWebhooks(supabase, validation.user.userId, 'checkin.completed', {
      checkinId: newCheckin.id,
      lagScore,
      driftCategory,
      weakestDimension,
      createdAt: newCheckin.created_at,
    });

    // Return result
    const response = {
      id: newCheckin.id,
      lagScore,
      driftCategory,
      weakestDimension,
      scoreDelta,
      tip: {
        focus: tip.focus,
        constraint: tip.constraint,
        choice: tip.choice,
      },
      createdAt: newCheckin.created_at,
    };

    return NextResponse.json(response, { status: 201, headers: rateLimit.headers });
  } catch (error: any) {
    console.error('Error in POST /api/v1/checkins:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Trigger webhooks for an event (async, non-blocking)
 */
async function triggerWebhooks(
  supabase: any,
  userId: string,
  eventType: string,
  payload: any
) {
  try {
    // Get active webhooks for user that are subscribed to this event
    const { data: webhooks, error } = await supabase
      .from('webhook_subscriptions')
      .select('id, url, signing_secret, events')
      .eq('user_id', userId)
      .eq('is_active', true)
      .lt('consecutive_failures', 10);

    if (error || !webhooks || webhooks.length === 0) {
      return;
    }

    // Filter webhooks subscribed to this event
    const relevantWebhooks = webhooks.filter((w: any) =>
      w.events.includes(eventType) || w.events.includes('*')
    );

    // Deliver to each webhook
    for (const webhook of relevantWebhooks) {
      deliverWebhook(supabase, webhook, eventType, payload);
    }
  } catch (error) {
    console.error('Error triggering webhooks:', error);
  }
}

/**
 * Deliver a webhook payload (async, non-blocking)
 */
async function deliverWebhook(
  supabase: any,
  webhook: any,
  eventType: string,
  payload: any
) {
  const startTime = Date.now();
  const webhookPayload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    data: payload,
  };

  try {
    const payloadString = JSON.stringify(webhookPayload);
    const { signWebhookPayload } = await import('@/lib/api-auth');
    const signature = signWebhookPayload(payloadString, webhook.signing_secret);

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': eventType,
      },
      body: payloadString,
    });

    const duration = Date.now() - startTime;
    const success = response.ok;

    // Log delivery
    await supabase.from('webhook_deliveries').insert({
      webhook_id: webhook.id,
      event_type: eventType,
      payload: webhookPayload,
      response_status: response.status,
      delivery_duration_ms: duration,
      success,
    });

    // Update webhook status
    if (success) {
      await supabase
        .from('webhook_subscriptions')
        .update({
          last_delivery_at: new Date().toISOString(),
          last_delivery_status: 'success',
          consecutive_failures: 0,
        })
        .eq('id', webhook.id);
    } else {
      await supabase
        .from('webhook_subscriptions')
        .update({
          last_delivery_at: new Date().toISOString(),
          last_delivery_status: 'failed',
          consecutive_failures: (webhook.consecutive_failures || 0) + 1,
        })
        .eq('id', webhook.id);
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;

    // Log failed delivery
    await supabase.from('webhook_deliveries').insert({
      webhook_id: webhook.id,
      event_type: eventType,
      payload: webhookPayload,
      response_body: error.message,
      delivery_duration_ms: duration,
      success: false,
    });

    // Update webhook status
    await supabase
      .from('webhook_subscriptions')
      .update({
        last_delivery_at: new Date().toISOString(),
        last_delivery_status: 'failed',
        consecutive_failures: (webhook.consecutive_failures || 0) + 1,
      })
      .eq('id', webhook.id);
  }
}
