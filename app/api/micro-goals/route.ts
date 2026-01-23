import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/utils';
import { NextResponse } from 'next/server';
import { getWeakestDimension } from '@/lib/calculations';
import { getCurrentWeekStart } from '@/lib/micro-goals';

// Mark as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    
    // Authenticate user
    const { user, error: authError } = await requireAuth(supabase);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get active micro-goal for current week
    const currentWeekStart = getCurrentWeekStart();
    const { data: activeGoal, error } = await supabase
      .from('micro_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .gte('created_at', currentWeekStart.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching micro-goal:', error);
      return NextResponse.json({ error: 'Failed to fetch micro-goal' }, { status: 500 });
    }

    return NextResponse.json({ goal: activeGoal || null });
  } catch (error: any) {
    console.error('Error in GET /api/micro-goals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // Authenticate user
    const { user, error: authError } = await requireAuth(supabase);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { dimension, goalText } = body;

    // Validate inputs
    const validDimensions = ['energy', 'sleep', 'structure', 'initiation', 'engagement', 'sustainability'];
    if (!dimension || !validDimensions.includes(dimension)) {
      return NextResponse.json({ error: 'Invalid dimension' }, { status: 400 });
    }

    if (!goalText || typeof goalText !== 'string' || goalText.trim().length === 0) {
      return NextResponse.json({ error: 'Goal text is required' }, { status: 400 });
    }

    if (goalText.length > 500) {
      return NextResponse.json({ error: 'Goal text must be 500 characters or less' }, { status: 400 });
    }

    // Deactivate any existing active micro-goals for this user from previous weeks
    const currentWeekStart = getCurrentWeekStart();
    await supabase
      .from('micro_goals')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true)
      .lt('created_at', currentWeekStart.toISOString());

    // Create new micro-goal
    const { data: newGoal, error: insertError } = await supabase
      .from('micro_goals')
      .insert({
        user_id: user.id,
        dimension,
        goal_text: goalText.trim(),
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating micro-goal:', insertError);
      return NextResponse.json({ error: 'Failed to create micro-goal' }, { status: 500 });
    }

    return NextResponse.json({ goal: newGoal });
  } catch (error: any) {
    console.error('Error in POST /api/micro-goals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createClient();
    
    // Authenticate user
    const { user, error: authError } = await requireAuth(supabase);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, goalText, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    const updateData: any = {};

    if (goalText !== undefined) {
      if (typeof goalText !== 'string' || goalText.trim().length === 0) {
        return NextResponse.json({ error: 'Goal text cannot be empty' }, { status: 400 });
      }
      if (goalText.length > 500) {
        return NextResponse.json({ error: 'Goal text must be 500 characters or less' }, { status: 400 });
      }
      updateData.goal_text = goalText.trim();
    }

    if (isActive !== undefined) {
      updateData.is_active = isActive;
      // If activating, deactivate other active goals
      if (isActive) {
        await supabase
          .from('micro_goals')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .eq('is_active', true)
          .neq('id', id);
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data: updatedGoal, error: updateError } = await supabase
      .from('micro_goals')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating micro-goal:', updateError);
      return NextResponse.json({ error: 'Failed to update micro-goal' }, { status: 500 });
    }

    return NextResponse.json({ goal: updatedGoal });
  } catch (error: any) {
    console.error('Error in PUT /api/micro-goals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createClient();
    
    // Authenticate user
    const { user, error: authError } = await requireAuth(supabase);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    // Mark as inactive (soft delete) instead of hard delete
    const { error: updateError } = await supabase
      .from('micro_goals')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error deleting micro-goal:', updateError);
      return NextResponse.json({ error: 'Failed to delete micro-goal' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/micro-goals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
