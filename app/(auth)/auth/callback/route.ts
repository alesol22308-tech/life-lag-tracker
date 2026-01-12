import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

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

    // Create redirect response with proper headers for Safari
    const redirectUrl = next ? `${origin}${next}` : `${origin}/home`;
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
