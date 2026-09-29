import { fail } from '@sveltejs/kit';
import { createSupabaseServiceClient } from '$lib/server/supabase';
import type { Actions, PageServerLoad } from './$types';

const PAGE_SIZE = 20;

export const load: PageServerLoad = async ({ locals, url }) => {
  const me = await locals.getMember();
  if (!me?.is_admin) return { activities: [], tags: [], members: [], totalCount: 0 };

  const supabase = createSupabaseServiceClient();
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const [activitiesResult, tagsResult, membersResult, countResult] = await Promise.all([
    supabase
      .from('activities')
      .select(`
        *,
        tags:activity_tags(
          tag:tags(*)
        )
      `, { count: 'exact' })
      .order('activity_date', { ascending: false })
      .range(from, to),
    supabase.from('tags').select('*').order('name'),
    supabase.from('members').select('*').eq('status', 'active').order('full_name'),
    supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
  ]);

  return {
    activities: activitiesResult.data ?? [],
    tags: tagsResult.data ?? [],
    members: membersResult.data ?? [],
    totalCount: countResult.count ?? 0,
    currentPage: page,
    totalPages: Math.ceil((countResult.count ?? 0) / PAGE_SIZE)
  };
};

// Load attendees for a specific activity (called on demand)
export const actions: Actions = {
  getActivityAttendance: async ({ request, locals }) => {
    const me = await locals.getMember();
    if (!me?.is_admin) return fail(403, { error: 'Unauthorized' });

    const data = await request.formData();
    const activity_id = parseInt(data.get('activity_id') as string);

    const supabase = createSupabaseServiceClient();
    const { data: attendees } = await supabase
      .from('member_activities')
      .select(`
        member_id,
        attended,
        member:members(full_name, rac_number)
      `)
      .eq('activity_id', activity_id);

    return { attendees: attendees ?? [] };
  },

  addActivity: async ({ request, locals }) => {
    const me = await locals.getMember();
    if (!me?.is_admin) return fail(403, { error: 'Unauthorized' });

    const data = await request.formData();
    const title = (data.get('title') as string)?.trim();
    const description = (data.get('description') as string)?.trim() || null;
    const activity_date = data.get('activity_date') as string;
    const tag_ids = data.getAll('tag_ids').map(Number);

    if (!title || !activity_date) {
      return fail(400, { error: 'Title and date are required' });
    }

    const supabase = createSupabaseServiceClient();

    const { data: activity, error } = await supabase
      .from('activities')
      .insert({ title, description, activity_date })
      .select()
      .single();

    if (error) return fail(500, { error: error.message });

    if (tag_ids.length > 0 && activity) {
      const tagRecords = tag_ids.map((tag_id) => ({
        activity_id: activity.id,
        tag_id
      }));
      const { error: tagError } = await supabase.from('activity_tags').insert(tagRecords);
      if (tagError) return fail(500, { error: 'Failed to add tags' });
    }

    return { success: true };
  },

  updateActivity: async ({ request, locals }) => {
    const me = await locals.getMember();
    if (!me?.is_admin) return fail(403, { error: 'Unauthorized' });

    const data = await request.formData();
    const id = parseInt(data.get('id') as string);
    const title = (data.get('title') as string)?.trim();
    const description = (data.get('description') as string)?.trim() || null;
    const activity_date = data.get('activity_date') as string;
    const tag_ids = data.getAll('tag_ids').map(Number);

    const supabase = createSupabaseServiceClient();

    const { error } = await supabase
      .from('activities')
      .update({ title, description, activity_date })
      .eq('id', id);

    if (error) return fail(500, { error: error.message });

    await supabase.from('activity_tags').delete().eq('activity_id', id);

    if (tag_ids.length > 0) {
      const tagRecords = tag_ids.map((tag_id) => ({
        activity_id: id,
        tag_id
      }));
      const { error: tagError } = await supabase.from('activity_tags').insert(tagRecords);
      if (tagError) return fail(500, { error: 'Failed to update tags' });
    }

    return { success: true };
  },

  deleteActivity: async ({ request, locals }) => {
    const me = await locals.getMember();
    if (!me?.is_admin) return fail(403, { error: 'Unauthorized' });

    const data = await request.formData();
    const id = parseInt(data.get('id') as string);

    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.from('activities').delete().eq('id', id);

    if (error) return fail(500, { error: error.message });
    return { success: true };
  },

  addTag: async ({ request, locals }) => {
    const me = await locals.getMember();
    if (!me?.is_admin) return fail(403, { error: 'Unauthorized' });

    const data = await request.formData();
    const name = (data.get('name') as string)?.trim();
    const color = (data.get('color') as string)?.trim() || '#E8175D';

    if (!name) {
      return fail(400, { error: 'Tag name is required' });
    }

    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.from('tags').insert({ name, color });

    if (error) return fail(500, { error: error.message });
    return { success: true };
  },

  deleteTag: async ({ request, locals }) => {
    const me = await locals.getMember();
    if (!me?.is_admin) return fail(403, { error: 'Unauthorized' });

    const data = await request.formData();
    const id = parseInt(data.get('id') as string);

    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.from('tags').delete().eq('id', id);

    if (error) return fail(500, { error: error.message });
    return { success: true };
  },

  markAttendance: async ({ request, locals }) => {
    const me = await locals.getMember();
    if (!me?.is_admin) return fail(403, { error: 'Unauthorized' });

    const data = await request.formData();
    const activity_id = parseInt(data.get('activity_id') as string);
    const attended_ids = data.getAll('attended_ids').map(Number);

    const supabase = createSupabaseServiceClient();

    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id')
      .eq('status', 'active');

    if (membersError || !members) return fail(500, { error: 'Failed to fetch members' });

    // Safety limit
    if (members.length > 500) {
      return fail(400, { error: 'Too many members to process' });
    }

    // Delete existing attendance for this activity
    await supabase.from('member_activities').delete().eq('activity_id', activity_id);

    // Create attendance records
    const records = members.map((m: { id: number }) => ({
      member_id: m.id,
      activity_id,
      attended: attended_ids.includes(m.id)
    }));

    const { error } = await supabase.from('member_activities').insert(records);

    if (error) return fail(500, { error: error.message });
    return { success: true };
  }
};