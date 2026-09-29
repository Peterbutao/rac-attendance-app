import { redirect } from '@sveltejs/kit';
import { building } from '$app/environment';
import { createSupabaseServiceClient } from '$lib/server/supabase';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  if (building) return { profileSummary: null, guestCount: 0 };

  const session = await locals.getSession();
  if (!session) throw redirect(302, '/login');

  const member = await locals.getMember();
  let profileSummary = null;
  let guestCount = 0;

  if (member) {
    const { data } = await locals.supabase
      .from('member_profile_summary')
      .select('*')
      .eq('member_id', member.id)
      .maybeSingle();

    profileSummary = data ?? null;

    const supabase = createSupabaseServiceClient();
    const { count } = await supabase
      .from('attendance_guests')
      .select('id', { count: 'exact', head: true })
      .eq('member_id', member.id);
    guestCount = count ?? 0;
  }

  return { profileSummary, guestCount };
}
