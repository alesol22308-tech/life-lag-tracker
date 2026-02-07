import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client with service role key
 * This bypasses Row Level Security (RLS) and should only be used server-side
 * for administrative operations like cron jobs.
 * 
 * ⚠️ NEVER expose this client to the client-side or use it in user-facing routes
 */
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
