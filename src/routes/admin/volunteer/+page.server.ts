import { fail } from '@sveltejs/kit';
import { createSupabaseServiceClient } from '$lib/server/supabase';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const me = await locals.getMember();
  if (!me?.is_admin) return { members: [], volunteerHours: [] };

  const supabase = createSupabaseServiceClient();

  const { data: members } = await supabase
    .from('members')
    .select('*')
    .eq('status', 'active')
    .order('full_name');

  const { data: volunteerHours } = await supabase
    .from('volunteer_hours')
    .select(`
      *,
      member:members(full_name, rac_number)
    `)
    .order('activity_date', { ascending: false });

  return { members: members ?? [], volunteerHours: volunteerHours ?? [] };
};

export const actions: Actions = {
  addHours: async ({ request, locals }) => {
    const me = await locals.getMember();
    if (!me?.is_admin) return fail(403, { error: 'Unauthorized' });

    const data = await request.formData();
    const member_id = parseInt(data.get('member_id') as string);
    const activity_name = (data.get('activity_name') as string)?.trim();
    const hours = parseFloat(data.get('hours') as string) || 0;
    const activity_date = data.get('activity_date') as string;

    if (!member_id || !activity_name || !activity_date) {
      return fail(400, { error: 'Member, activity name, and date are required' });
    }

    const supabase = createSupabaseServiceClient();
    const { error } = await supabase
      .from('volunteer_hours')
      .insert({ member_id, activity_name, hours, activity_date });

    if (error) return fail(500, { error: error.message });
    return { success: true };
  },

  updateHours: async ({ request, locals }) => {
    const me = await locals.getMember();
    if (!me?.is_admin) return fail(403, { error: 'Unauthorized' });

    const data = await request.formData();
    const id = parseInt(data.get('id') as string);
    const activity_name = (data.get('activity_name') as string)?.trim();
    const hours = parseFloat(data.get('hours') as string) || 0;
    const activity_date = data.get('activity_date') as string;

    const supabase = createSupabaseServiceClient();
    const { error } = await supabase
      .from('volunteer_hours')
      .update({ activity_name, hours, activity_date })
      .eq('id', id);

    if (error) return fail(500, { error: error.message });
    return { success: true };
  },

  deleteHours: async ({ request, locals }) => {
    const me = await locals.getMember();
    if (!me?.is_admin) return fail(403, { error: 'Unauthorized' });

    const data = await request.formData();
    const id = parseInt(data.get('id') as string);

    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.from('volunteer_hours').delete().eq('id', id);

    if (error) return fail(500, { error: error.message });
    return { success: true };
  }
};