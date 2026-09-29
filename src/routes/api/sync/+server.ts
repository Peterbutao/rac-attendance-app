import { json } from '@sveltejs/kit';
import { syncAllSheets, getLastSyncStatus } from '$lib/server/sheets-sync';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
  const member = await locals.getMember();
  
  if (!member?.is_admin) {
    return json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const result = await syncAllSheets();
    return json(result);
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : 'Sync failed' },
      { status: 500 }
    );
  }
};

export const GET: RequestHandler = async ({ locals }) => {
  const member = await locals.getMember();
  
  if (!member?.is_admin) {
    return json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const status = await getLastSyncStatus();
    return json(status);
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : 'Failed to get sync status' },
      { status: 500 }
    );
  }
};