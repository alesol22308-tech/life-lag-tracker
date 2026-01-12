/**
 * Helper to check if user is authenticated and redirect if not
 */
export async function requireAuth(supabase: any) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error: 'Not authenticated' };
  }

  return { user, error: null };
}

/**
 * Ensure user profile exists in users table
 */
export async function ensureUserProfile(supabase: any, userId: string, email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

  if (error && error.code === 'PGRST116') {
    // User doesn't exist, create them
    const { error: insertError } = await supabase
      .from('users')
      .insert({ id: userId, email });

    if (insertError) {
      console.error('Error creating user profile:', insertError);
      return { error: insertError };
    }
  } else if (error) {
    console.error('Error checking user profile:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Check if user is a first-time user (no check-ins)
 */
export async function isFirstTimeUser(supabase: any, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('checkins')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error checking first-time user:', error);
    return true; // Default to first-time if error
  }

  return !data;
}

/**
 * Get user's check-in count
 */
export async function getUserCheckinCount(supabase: any, userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('users')
    .select('checkin_count')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return 0;
  }

  return data.checkin_count || 0;
}

/**
 * Determine if user should see results (has recent check-in within 7 days)
 */
export async function shouldShowResults(supabase: any, userId: string): Promise<boolean> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data, error } = await supabase
    .from('checkins')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgo.toISOString())
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error checking recent check-in:', error);
    return false;
  }

  return !!data;
}
