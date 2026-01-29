/**
 * Admin authentication and authorization utilities
 */

type UserRole = 'user' | 'admin';

interface AdminAuthResult {
  user: any;
  role: UserRole;
  error: string | null;
}

/**
 * Check if user is authenticated and has admin role
 * Returns user data with role if admin, error otherwise
 */
export async function requireAdmin(supabase: any): Promise<AdminAuthResult> {
  // First check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, role: 'user', error: 'Not authenticated' };
  }

  // Check user role from database
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userError) {
    console.error('Error fetching user role:', userError);
    return { user, role: 'user', error: 'Failed to verify admin status' };
  }

  const role = (userData?.role || 'user') as UserRole;

  if (role !== 'admin') {
    return { user, role, error: 'Admin access required' };
  }

  return { user, role, error: null };
}

/**
 * Check if a user has admin role (without throwing)
 */
export async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error checking admin status:', error);
    return false;
  }

  return data?.role === 'admin';
}

/**
 * Grant admin role to a user (admin only operation)
 */
export async function grantAdminRole(
  supabase: any,
  targetUserId: string,
  requestingUserId: string
): Promise<{ success: boolean; error: string | null }> {
  // Verify requesting user is admin
  const isRequestingUserAdmin = await isAdmin(supabase, requestingUserId);
  if (!isRequestingUserAdmin) {
    return { success: false, error: 'Only admins can grant admin role' };
  }

  const { error } = await supabase
    .from('users')
    .update({ role: 'admin' })
    .eq('id', targetUserId);

  if (error) {
    console.error('Error granting admin role:', error);
    return { success: false, error: 'Failed to grant admin role' };
  }

  return { success: true, error: null };
}

/**
 * Revoke admin role from a user (admin only operation)
 */
export async function revokeAdminRole(
  supabase: any,
  targetUserId: string,
  requestingUserId: string
): Promise<{ success: boolean; error: string | null }> {
  // Verify requesting user is admin
  const isRequestingUserAdmin = await isAdmin(supabase, requestingUserId);
  if (!isRequestingUserAdmin) {
    return { success: false, error: 'Only admins can revoke admin role' };
  }

  // Prevent self-demotion
  if (targetUserId === requestingUserId) {
    return { success: false, error: 'Cannot revoke your own admin role' };
  }

  const { error } = await supabase
    .from('users')
    .update({ role: 'user' })
    .eq('id', targetUserId);

  if (error) {
    console.error('Error revoking admin role:', error);
    return { success: false, error: 'Failed to revoke admin role' };
  }

  return { success: true, error: null };
}
