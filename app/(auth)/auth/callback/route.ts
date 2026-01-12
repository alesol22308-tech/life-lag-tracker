import { createClient } from '@/lib/supabase/server';
import { isFirstTimeUser, shouldShowResults } from '@/lib/utils';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  if (code) {
    const supabase = createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // Smart redirect logic
      if (next) {
        // Explicit redirect path provided
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Check if first-time user
      const isFirstTime = await isFirstTimeUser(supabase, data.user.id);
      
      if (isFirstTime) {
        // First-time user → go to check-in
        return NextResponse.redirect(`${origin}/checkin`);
      }

      // Returning user → check if they have recent results
      const hasRecentResults = await shouldShowResults(supabase, data.user.id);
      
      if (hasRecentResults) {
        // They have a recent check-in, but we don't have a results page that shows last result
        // For now, redirect to check-in (they can start a new one)
        // TODO: Could create a "view last results" page in the future
        return NextResponse.redirect(`${origin}/checkin`);
      } else {
        // No recent check-in → go to check-in
        return NextResponse.redirect(`${origin}/checkin`);
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`);
}
