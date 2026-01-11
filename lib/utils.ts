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
