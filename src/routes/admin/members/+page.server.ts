import { fail } from '@sveltejs/kit';
import { createSupabaseServiceClient } from '$lib/server/supabase';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const supabase = createSupabaseServiceClient();
  const statusFilter = url.searchParams.get('status') ?? 'active';

  const { data: members } = await supabase
    .from('members')
    .select('*')
    .eq('status', statusFilter)
    .order('rac_number');

  const { data: allStatuses } = await supabase.from('members').select('status');
  const counts = { active: 0, inactive: 0, suspended: 0 };
  (allStatuses ?? []).forEach((r: any) => { counts[r.status as keyof typeof counts]++; });

  return { members: members ?? [], statusFilter, counts };
};

export const actions: Actions = {
  updateMember: async ({ request, locals }) => {
    const me = await locals.getMember();
    if (!me?.is_admin) return fail(403, { error: 'Unauthorized' });

    const data   = await request.formData();
    const id     = parseInt(data.get('id') as string);
    const status = data.get('status') as string;
    const notes  = (data.get('notes') as string)?.trim() || null;

    if (!['active', 'inactive', 'suspended'].includes(status))
      return fail(400, { error: 'Invalid status' });

    const supabase = createSupabaseServiceClient();
    const { error } = await supabase
      .from('members')
      .update({ status, notes })
      .eq('id', id);

    if (error) return fail(500, { error: error.message });
    return { success: true };
  }
};
