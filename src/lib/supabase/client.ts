import { createBrowserClient } from '@supabase/ssr';

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_anon_key_here'
);

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rposcxtwctvcegwryvua.supabase.co';
  // Use a fallback dummy token to prevent @supabase/ssr initialization crash when key is unset
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Export a singleton instance for direct browser consumption
export const supabase = createClient();
