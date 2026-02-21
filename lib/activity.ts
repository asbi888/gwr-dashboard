import { supabase } from './supabase';

/**
 * Log user activity directly to Supabase (RLS allows users to INSERT own rows).
 * Fire-and-forget — never blocks or throws.
 */
export function logActivity(
  userId: string,
  action: 'login' | 'page_view' | 'logout',
  page?: string,
) {
  supabase.auth.getUser().then(({ data }) => {
    const email = data.user?.email || '';
    supabase
      .from('user_activity')
      .insert({
        user_id: userId,
        email,
        action,
        page: page ?? null,
      })
      .then(({ error }) => {
        if (error) console.warn('Activity log:', error.message);
      });
  });
}
