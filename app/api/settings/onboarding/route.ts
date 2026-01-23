import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/utils';
import { NextResponse } from 'next/server';

// Mark as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // Authenticate user
    const { user, error: authError } = await requireAuth(supabase);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { completed } = body;

    // Validate input
    if (typeof completed !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request: completed must be a boolean' }, { status: 400 });
    }

    // Prepare update data
    const updateData: {
      onboarding_completed: boolean;
      onboarding_completed_at: string | null;
    } = {
      onboarding_completed: completed,
      onboarding_completed_at: completed ? new Date().toISOString() : null,
    };

    // Update user onboarding status
    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating onboarding status:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update onboarding status',
        details: updateError.message || String(updateError),
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: completed ? 'Onboarding marked as complete' : 'Onboarding status reset',
    });
  } catch (error: any) {
    console.error('Error updating onboarding status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = createClient();
    
    // Authenticate user
    const { user, error: authError } = await requireAuth(supabase);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user onboarding status
    const { data, error } = await supabase
      .from('users')
      .select('onboarding_completed, onboarding_completed_at')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching onboarding status:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch onboarding status',
      }, { status: 500 });
    }

    return NextResponse.json({ 
      onboardingCompleted: data?.onboarding_completed ?? false,
      onboardingCompletedAt: data?.onboarding_completed_at ?? null,
    });
  } catch (error: any) {
    console.error('Error fetching onboarding status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
