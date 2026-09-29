import { fail } from '@sveltejs/kit';
import { createSupabaseServiceClient } from '$lib/server/supabase';
import type { Actions, PageServerLoad } from './$types';

const PAGE_SIZE = 25;

export const load: PageServerLoad = async ({ locals, url }) => {
  const me = await locals.getMember();
  if (!me?.is_admin) return { members: [], dues: [], totalCount: 0 };

  const supabase = createSupabaseServiceClient();
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const [membersResult, duesResult, countResult] = await Promise.all([
    supabase
      .from('members')
      .select('*')
      .eq('status', 'active')
      .order('full_name'),
    supabase
      .from('member_dues')
      .select(`
        *,
        member:members(full_name, rac_number)
      `, { count: 'exact' })
      .order('period', { ascending: false })
      .range(from, to),
    supabase
      .from('member_dues')
      .select('*', { count: 'exact', head: true })
  ]);

  return {
    members: membersResult.data ?? [],
    dues: duesResult.data ?? [],
    totalCount: countResult.count ?? 0,
    currentPage: page,
    totalPages: Math.ceil((countResult.count ?? 0) / PAGE_SIZE)
  };
};

export const actions: Actions = {
  addDues: async ({ request, locals }) => {
    const me = await locals.getMember();
    if (!me?.is_admin) return fail(403, { error: 'Unauthorized' });

    const data = await request.formData();
    const member_id = parseInt(data.get('member_id') as string);
    const period = (data.get('period') as string)?.trim();
    const dues_required = parseFloat(data.get('dues_required') as string) || 0;
    const dues_paid = parseFloat(data.get('dues_paid') as string) || 0;

    if (!member_id || !period) {
      return fail(400, { error: 'Member and period are required' });
    }

    const supabase = createSupabaseServiceClient();
    const { error } = await supabase
      .from('member_dues')
      .upsert(
        { member_id, period, dues_required, dues_paid, updated_at: new Date().toISOString() },
        { onConflict: 'member_id,period' }
      );

    if (error) return fail(500, { error: error.message });
    return { success: true };
  },

  updateDues: async ({ request, locals }) => {
    const me = await locals.getMember();
    if (!me?.is_admin) return fail(403, { error: 'Unauthorized' });

    const data = await request.formData();
    const id = parseInt(data.get('id') as string);
    const dues_required = parseFloat(data.get('dues_required') as string) || 0;
    const dues_paid = parseFloat(data.get('dues_paid') as string) || 0;

    const supabase = createSupabaseServiceClient();
    const { error } = await supabase
      .from('member_dues')
      .update({ dues_required, dues_paid, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return fail(500, { error: error.message });
    return { success: true };
  },

  deleteDues: async ({ request, locals }) => {
    const me = await locals.getMember();
    if (!me?.is_admin) return fail(403, { error: 'Unauthorized' });

    const data = await request.formData();
    const id = parseInt(data.get('id') as string);

    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.from('member_dues').delete().eq('id', id);

    if (error) return fail(500, { error: error.message });
    return { success: true };
  }
};