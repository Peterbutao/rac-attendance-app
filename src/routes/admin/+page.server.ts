import { getLastSyncStatus } from '$lib/server/sheets-sync';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const member = await locals.getMember();
  
  // Get sync status for admin users
  let syncStatus = null;
  if (member?.is_admin) {
    try {
      syncStatus = await getLastSyncStatus();
    } catch {
      // Ignore sync status errors
    }
  }
  
  return { member, syncStatus };
};