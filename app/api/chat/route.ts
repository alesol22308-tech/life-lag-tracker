import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/utils';
import { getChatContext, formatChatContextForPrompt } from '@/lib/chat-context';
import { applyRateLimit } from '@/lib/rate-limit';
import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const APP_DESCRIPTION = `You are a helpful assistant for the Life-Lag app. Life-Lag helps users track their "life lag" — the gap between how they want to feel and how they actually feel across six dimensions: energy, sleep, structure, initiation, engagement, and sustainability. Users rate each dimension 1-5 in weekly check-ins. The app computes a lag score and drift category (aligned, mild, moderate, heavy, critical). Users can set one active "micro-goal" per week tied to a dimension. Your role is to give personalized tips and answer questions using the user's progress data below. Be concise, supportive, and specific to their data (e.g. streak, weakest dimension, recent check-ins). Do not make up data; only use what is provided.`;

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { user, error: authError } = await requireAuth(supabase);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = applyRateLimit(user.id, 'unlimited');
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: rateLimit.error?.message ?? 'Too many requests' },
        { status: 429, headers: rateLimit.headers }
      );
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
    if (!apiKey) {
      console.error('GOOGLE_GENERATIVE_AI_API_KEY is not set');
      return NextResponse.json(
        { error: 'Chat is not configured' },
        { status: 503 }
      );
    }

    let body: { messages?: Array<{ role: string; content: string }> };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const messages = body.messages ?? [];
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    const ctx = await getChatContext(supabase, user.id);
    const contextBlock = formatChatContextForPrompt(ctx);
    const languageInstruction = ctx.languagePreference
      ? `\n\nRespond in the user's preferred language: ${ctx.languagePreference}.`
      : '';
    const systemPrompt = `${APP_DESCRIPTION}\n\n${contextBlock}${languageInstruction}`;

    const google = createGoogleGenerativeAI({ apiKey });
    const result = await streamText({
      model: google('gemini-1.5-flash') as Parameters<typeof streamText>[0]['model'],
      system: systemPrompt,
      messages: messages as Parameters<typeof streamText>[0]['messages'],
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    if (error instanceof Error) console.error('Chat API error message:', error.message);
    const err = error as {
      statusCode?: number;
      message?: string;
      cause?: unknown;
      lastError?: { message?: string; statusCode?: number };
      errors?: Array<{ message?: string; statusCode?: number }>;
    };
    const cause = err.cause as { statusCode?: number; message?: string; cause?: unknown } | undefined;
    const lastErr = err.lastError ?? (Array.isArray(err.errors) ? err.errors[err.errors.length - 1] : undefined);
    const deepCause = cause?.cause as { message?: string; statusCode?: number } | undefined;
    const statusCode = err.statusCode ?? cause?.statusCode ?? lastErr?.statusCode ?? deepCause?.statusCode;
    const message =
      typeof err.message === 'string'
        ? err.message
        : typeof cause?.message === 'string'
          ? cause.message
          : typeof deepCause?.message === 'string'
            ? deepCause.message
            : typeof lastErr?.message === 'string'
              ? lastErr.message
              : error instanceof Error
                ? error.message
                : String(error);
    if (!message && cause) console.error('Chat API cause:', cause);
    const isQuotaError =
      statusCode === 429 ||
      (message.includes('quota') ||
        message.includes('RESOURCE_EXHAUSTED') ||
        message.includes('rate limit') ||
        message.includes('exceeded'));
    if (isQuotaError) {
      return NextResponse.json(
        {
          error:
            'AI quota exceeded. Try again in a few minutes or check your API key and usage at Google AI Studio (https://aistudio.google.com/apikey).',
        },
        { status: 503 }
      );
    }
    const isAuthError =
      statusCode === 401 ||
      statusCode === 403 ||
      message.includes('API key') ||
      message.includes('invalid') ||
      message.includes('permission');
    if (isAuthError) {
      return NextResponse.json(
        {
          error:
            'Invalid or missing API key. Check GOOGLE_GENERATIVE_AI_API_KEY in your environment (e.g. .env.local or host dashboard).',
        },
        { status: 503 }
      );
    }
    // Include first line of error in response so user can see cause (e.g. quota, API key)
    const safeHint =
      message && message.length > 0
        ? message.split('\n')[0].slice(0, 200)
        : '';
    const responseError =
      safeHint && !safeHint.includes(' at ')
        ? `Internal server error: ${safeHint}`
        : 'Internal server error';
    return NextResponse.json(
      { error: responseError },
      { status: 500 }
    );
  }
}
