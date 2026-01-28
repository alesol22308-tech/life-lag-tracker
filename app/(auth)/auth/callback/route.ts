import { createClient } from '@/lib/supabase/server';
import { ensureUserProfile } from '@/lib/utils';
import { NextResponse } from 'next/server';

// Mark as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const type = searchParams.get('type'); // 'signup' or 'signin'
  const setup = searchParams.get('setup'); // 'true' if password setup needed

  // Handle OAuth errors
  if (error) {
    console.error('Auth callback error:', error, errorDescription);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription || error)}`);
  }

  if (!code) {
    console.error('No code parameter in callback');
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('No authentication code provided')}`);
  }

  try {
    const supabase = createClient();
    const { error: exchangeError, data } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`);
    }

    if (!data?.user) {
      console.error('No user data after code exchange');
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Could not authenticate user')}`);
    }

    // Verify session was created by checking for session
    if (!data.session) {
      console.error('No session created after code exchange');
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Session creation failed')}`);
    }

    // Ensure user profile exists in database
    await ensureUserProfile(supabase, data.user.id, data.user.email!);

    // Determine redirect URL based on type and setup parameters
    let redirectUrl = next ? `${origin}${next}` : `${origin}/home`;
    
    // For sign-up flow with magic link, check if password setup is needed
    if (type === 'signup' && setup === 'true') {
      try {
        // Check if user already has a password
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('has_password')
          .eq('id', data.user.id)
          .single();
        
        // If column doesn't exist yet (migration not run), skip password setup
        if (userError && userError.message?.includes('column')) {
          console.log('has_password column not found, skipping password setup prompt');
          redirectUrl = `${origin}/home`;
        } else if (!userError && !userData?.has_password) {
          // User signed up with magic link and doesn't have a password
          // Redirect to password setup page
          redirectUrl = `${origin}/setup-password`;
        } else {
          // User already has a password, go to home
          redirectUrl = `${origin}/home`;
        }
      } catch (err) {
        console.error('Error checking password status:', err);
        // Continue with normal redirect if there's an error
        redirectUrl = `${origin}/home`;
      }
    } else {
      // For sign-in flow (type === 'signin' or no type), always go to home
      redirectUrl = next ? `${origin}${next}` : `${origin}/home`;
    }

    // Create redirect response with proper headers for Safari
    const response = NextResponse.redirect(redirectUrl);
    
    // Ensure cookies are properly set for Safari
    // The Supabase client should have already set cookies, but we ensure they're included
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    return response;
  } catch (error: any) {
    console.error('Unexpected error in auth callback:', error);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('An unexpected error occurred')}`);
  }
}
