import { redirect, error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  const session = await locals.getSession();
  if (!session) throw redirect(302, '/login');

  const member = await locals.getMember();
  if (!member || member.status !== 'active') throw redirect(302, '/login');
  if (!member.is_admin) throw error(403, 'Admin access required.');

  return { session, member };
};
