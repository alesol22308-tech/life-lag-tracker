import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/utils';
import { NextResponse } from 'next/server';
import { sendAccountDeletionEmail, sendScheduledDeletionEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // Authenticate user
    const { user, error: authError } = await requireAuth(supabase);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get grace period option from request body
    const body = await request.json();
    const gracePeriod: boolean = body.gracePeriod ?? true;

    if (gracePeriod) {
      // Schedule deletion for 30 days from now
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 30);

      // Update user record with scheduled deletion date
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          deletion_scheduled_for: scheduledDate.toISOString() 
        })
        .eq('id', user.id);

      if (updateError) {
        // If column doesn't exist (migration not run), return error
        if (updateError.message?.includes('column') || updateError.code === '42703') {
          return NextResponse.json({ 
            error: 'Account deletion feature not available. Please contact support.',
            details: process.env.NODE_ENV === 'development' ? 'deletion_scheduled_for column not found' : undefined
          }, { status: 500 });
        }

        console.error('Error scheduling account deletion:', updateError);
        return NextResponse.json({ 
          error: 'Failed to schedule account deletion',
          details: process.env.NODE_ENV === 'development' ? updateError.message : undefined
        }, { status: 500 });
      }

      // Send scheduled deletion email
      try {
        await sendScheduledDeletionEmail(user.email!, scheduledDate);
      } catch (emailError) {
        console.error('Error sending scheduled deletion email:', emailError);
        // Don't fail the request if email fails
      }

      return NextResponse.json({ 
        success: true,
        message: 'Account deletion scheduled for 30 days from now. You will receive a confirmation email.',
        scheduledDate: scheduledDate.toISOString(),
      });
    } else {
      // Immediate deletion
      // Note: Deleting the auth user will cascade delete all related data
      // due to ON DELETE CASCADE constraints in the database

      // Store email for confirmation email before deleting
      const userEmail = user.email!;

      // Delete the user from Supabase Auth (cascades to all tables)
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

      if (deleteError) {
        console.error('Error deleting user account:', deleteError);
        return NextResponse.json({ 
          error: 'Failed to delete account',
          details: process.env.NODE_ENV === 'development' ? deleteError.message : undefined
        }, { status: 500 });
      }

      // Send deletion confirmation email
      try {
        await sendAccountDeletionEmail(userEmail);
      } catch (emailError) {
        console.error('Error sending deletion confirmation email:', emailError);
        // Don't fail the request if email fails - account is already deleted
      }

      return NextResponse.json({ 
        success: true,
        message: 'Account deleted successfully. You will receive a confirmation email.',
      });
    }
  } catch (error: any) {
    console.error('Error in account deletion API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}
