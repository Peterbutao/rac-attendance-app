import { redirect } from '@sveltejs/kit';
import { fetchAttendanceOptions } from '$lib/server/activity-events';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const member = await locals.getMember();

  if (!member?.is_admin) {
    throw redirect(302, '/portal/profile');
  }

  return {
    options: await fetchAttendanceOptions()
  };
};
