import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/utils';
import { NextResponse } from 'next/server';
import { DimensionName } from '@/types';

// GET: Fetch user's micro-goals
export async function GET() {
  try {
    const supabase = createClient();
    
    const { user, error: authError } = await requireAuth(supabase);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: microGoals, error } = await supabase
      .from('micro_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching micro-goals:', error);
      return NextResponse.json({ error: 'Failed to fetch micro-goals' }, { status: 500 });
    }

    // Transform to MicroGoal type
    const goals = (microGoals || []).map((goal: any) => ({
      id: goal.id,
      dimension: goal.dimension as DimensionName,
      goalText: goal.goal_text,
      createdAt: goal.created_at,
      completedAt: goal.completed_at || undefined,
      isActive: goal.is_active,
    }));

    return NextResponse.json(goals);
  } catch (error: any) {
    console.error('Error in micro-goals GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create new micro-goal
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    const { user, error: authError } = await requireAuth(supabase);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { dimension, goalText } = body;

    // Validate inputs
    const validDimensions: DimensionName[] = ['energy', 'sleep', 'structure', 'initiation', 'engagement', 'sustainability'];
    if (!dimension || !validDimensions.includes(dimension)) {
      return NextResponse.json({ error: 'Invalid dimension' }, { status: 400 });
    }

    if (!goalText || typeof goalText !== 'string' || goalText.trim().length === 0) {
      return NextResponse.json({ error: 'Goal text is required' }, { status: 400 });
    }

    // Deactivate any existing active goal for this dimension
    await supabase
      .from('micro_goals')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('dimension', dimension)
      .eq('is_active', true);

    // Create new goal
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

    // Transform to MicroGoal type
    const goal = {
      id: newGoal.id,
      dimension: newGoal.dimension as DimensionName,
      goalText: newGoal.goal_text,
      createdAt: newGoal.created_at,
      completedAt: newGoal.completed_at || undefined,
      isActive: newGoal.is_active,
    };

    return NextResponse.json(goal);
  } catch (error: any) {
    console.error('Error in micro-goals POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update micro-goal (mark complete, deactivate, or update text)
export async function PATCH(request: Request) {
  try {
    const supabase = createClient();
    
    const { user, error: authError } = await requireAuth(supabase);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, goalText, completed, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    // Build update data
    const updateData: any = {};
    if (goalText !== undefined) {
      if (typeof goalText !== 'string' || goalText.trim().length === 0) {
        return NextResponse.json({ error: 'Goal text cannot be empty' }, { status: 400 });
      }
      updateData.goal_text = goalText.trim();
    }
    if (completed !== undefined) {
      if (completed === true) {
        updateData.completed_at = new Date().toISOString();
        updateData.is_active = false;
      } else {
        updateData.completed_at = null;
      }
    }
    if (isActive !== undefined) {
      updateData.is_active = isActive;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Update goal
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

    if (!updatedGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Transform to MicroGoal type
    const goal = {
      id: updatedGoal.id,
      dimension: updatedGoal.dimension as DimensionName,
      goalText: updatedGoal.goal_text,
      createdAt: updatedGoal.created_at,
      completedAt: updatedGoal.completed_at || undefined,
      isActive: updatedGoal.is_active,
    };

    return NextResponse.json(goal);
  } catch (error: any) {
    console.error('Error in micro-goals PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete micro-goal
export async function DELETE(request: Request) {
  try {
    const supabase = createClient();
    
    const { user, error: authError } = await requireAuth(supabase);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    const { error: deleteError } = await supabase
      .from('micro_goals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting micro-goal:', deleteError);
      return NextResponse.json({ error: 'Failed to delete micro-goal' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in micro-goals DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
