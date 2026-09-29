import { createSupabaseServerClient, createSupabaseServiceClient } from '$lib/server/supabase';
import { syncAllSheets } from '$lib/server/sheets-sync';
import { building } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createSupabaseServerClient(event.cookies);

  // Cache for member data to avoid repeated queries
  let memberCache: any = null;
  let memberCacheUserId: string | null = null;

  event.locals.getSession = async () => {
    try {
      const {
        data: { session }
      } = await event.locals.supabase.auth.getSession();
      return session;
    } catch (err) {
      console.error('[SESSION] Failed to get session:', err);
      return null;
    }
  };

  event.locals.getUser = async () => {
    try {
      const {
        data: { user },
        error
      } = await event.locals.supabase.auth.getUser();
      if (error) {
        console.error('[USER] Supabase auth failed:', error);
        return null;
      }
      return user;
    } catch (err) {
      console.error('[USER] getUser failed:', err);
      return null;
    }
  };

  event.locals.getMember = async () => {
    try {
      const user = await event.locals.getUser();
      if (!user) {
        console.log('[GET_MEMBER] No user found, returning null');
        return null;
      }

      // Return cached member if it's for the same user
      if (memberCache && memberCacheUserId === user.id) {
        console.log('[GET_MEMBER] Using cached member');
        return memberCache;
      }

      try {
        const serviceSupabase = createSupabaseServiceClient();
        let { data, error } = await serviceSupabase
          .from('members')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!data && user.email) {
          const result = await serviceSupabase
            .from('members')
            .select('*')
            .eq('email', user.email.toLowerCase())
            .maybeSingle();

          data = result.data;
          error = result.error;
        }

        if (error) {
          console.error('[GET_MEMBER] Supabase query failed for member:', error);
          return null;
        }

        if (!data) {
          console.warn('[GET_MEMBER] No data found for member:', user.id);
          return null;
        }

        // Cache the result
        memberCache = data;
        memberCacheUserId = user.id;

        // Trigger Google Sheets sync for admin users (non-blocking)
        if (data.is_admin) {
          syncAllSheets().catch(err => {
            console.error('[SYNC] Background sync failed:', err);
          });
        }

        console.log('[GET_MEMBER] Successfully retrieved member:', user.id);
        return data;
      } catch (err) {
        console.error('[GET_MEMBER] Supabase operation failed:', err);
        return null;
      }
    } catch (err) {
      console.error('[GET_MEMBER] Unexpected error in getMember:', err);
      return null;
    }
  };

  const publicRoute =
    event.url.pathname === '/login' ||
    event.url.pathname === '/join' ||
    event.url.pathname.startsWith('/auth/') ||
    event.url.pathname === '/logout';

  if (!building && !publicRoute && !event.url.pathname.startsWith('/api/')) {
    const session = await event.locals.getSession();
    if (!session) throw redirect(302, '/login');
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    }
  });
};
