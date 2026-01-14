import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/utils';
import { NextResponse } from 'next/server';

/**
 * POST: Register push notification token
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    const { user, error: authError } = await requireAuth(supabase);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { deviceToken, platform } = body;

    // Validate inputs
    if (!deviceToken || typeof deviceToken !== 'string') {
      return NextResponse.json({ error: 'Device token is required' }, { status: 400 });
    }

    const validPlatforms = ['ios', 'android', 'web'];
    const devicePlatform = platform && validPlatforms.includes(platform) ? platform : 'web';

    // Store device token in push_notification_devices table (for multi-device support)
    // Also store in users.push_notification_token for backward compatibility
    const { error: deviceError } = await supabase
      .from('push_notification_devices')
      .upsert({
        user_id: user.id,
        device_token: deviceToken,
        platform: devicePlatform,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,device_token',
      });

    if (deviceError) {
      console.error('Error saving device token:', deviceError);
      return NextResponse.json({ error: 'Failed to register device token' }, { status: 500 });
    }

    // Also update users table for backward compatibility
    const { error: userError } = await supabase
      .from('users')
      .update({ push_notification_token: deviceToken })
      .eq('id', user.id);

    if (userError) {
      console.error('Error updating user token:', userError);
      // Don't fail if this update fails - device token is already saved
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in push notification register:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE: Unregister push notification token
 */
export async function DELETE(request: Request) {
  try {
    const supabase = createClient();
    
    const { user, error: authError } = await requireAuth(supabase);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const deviceToken = searchParams.get('token');

    if (deviceToken) {
      // Remove specific device token
      const { error: deleteError } = await supabase
        .from('push_notification_devices')
        .delete()
        .eq('user_id', user.id)
        .eq('device_token', deviceToken);

      if (deleteError) {
        console.error('Error deleting device token:', deleteError);
        return NextResponse.json({ error: 'Failed to unregister device token' }, { status: 500 });
      }
    } else {
      // Remove all device tokens for user
      const { error: deleteError } = await supabase
        .from('push_notification_devices')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error deleting device tokens:', deleteError);
        return NextResponse.json({ error: 'Failed to unregister device tokens' }, { status: 500 });
      }
    }

    // Also clear token in users table
    const { error: userError } = await supabase
      .from('users')
      .update({ push_notification_token: null })
      .eq('id', user.id);

    if (userError) {
      console.error('Error clearing user token:', userError);
      // Don't fail if this update fails
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in push notification unregister:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
