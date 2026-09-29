import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Check if user is admin
  const member = await locals.getMember();
  
  if (!member?.is_admin) {
    console.log('⛔ [/admin/directory] Non-admin user attempted access - redirecting to profile');
    throw redirect(302, '/portal/profile');
  }

  console.log('✅ [/admin/directory] Admin access granted');
  
  const { data: members } = await locals.supabase
    .from('active_members_view')
    .select('*')
    .order('rac_number');

  return { members: members ?? [] };
};
