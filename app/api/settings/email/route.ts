import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/utils';
import { NextResponse } from 'next/server';

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
    const { newEmail } = body;

    // Validate email format
    if (!newEmail || typeof newEmail !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Check if email is already in use
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', newEmail)
      .neq('id', user.id)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    // Update email in Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      email: newEmail,
    });

    if (updateError) {
      console.error('Error updating email:', updateError);
      return NextResponse.json({ 
        error: updateError.message || 'Failed to update email' 
      }, { status: 400 });
    }

    // Update email in users table
    const { error: dbError } = await supabase
      .from('users')
      .update({ email: newEmail })
      .eq('id', user.id);

    if (dbError) {
      console.error('Error updating email in database:', dbError);
      // Don't fail the request if DB update fails, auth update succeeded
    }

    return NextResponse.json({ 
      success: true,
      message: 'Check your email to confirm the new address'
    });
  } catch (error: any) {
    console.error('Error updating email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
