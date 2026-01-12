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

      // Always redirect to home after successful auth
      // Home page will show appropriate state (check-in CTA or current status)
      return NextResponse.redirect(`${origin}/home`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`);
}
