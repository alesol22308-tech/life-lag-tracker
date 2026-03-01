import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/utils';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Get recent check-in scores for rebound detection
 * GET /api/checkins/recent-scores?limit=3
 * Returns array of { id, lag_score, created_at } ordered by created_at DESC
 */
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    
    const { user, error: authError } = await requireAuth(supabase);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '3', 10);

    // Fetch recent check-ins with scores
    const { data: checkins, error: checkinsError } = await supabase
      .from('checkins')
      .select('id, lag_score, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (checkinsError) {
      console.error('Error fetching recent scores:', checkinsError);
      return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 });
    }

    return NextResponse.json({ 
      checkins: (checkins || []).map(c => ({
        id: c.id,
        lagScore: c.lag_score,
        createdAt: c.created_at,
      }))
    });
  } catch (error: any) {
    console.error('Error in recent-scores API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}
