import { fail } from '@sveltejs/kit';
import { createSupabaseServiceClient } from '$lib/server/supabase';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const me = await locals.getMember();
  if (!me?.is_admin) return { members: [], attendance: [], pendingAttendance: [] };

  const supabase = createSupabaseServiceClient();

  const { data: members } = await supabase
    .from('members')
    .select('*')
    .eq('status', 'active')
    .order('full_name');

  const { data: attendance } = await supabase
    .from('meeting_attendance')
    .select(`
      *,
      member:members(full_name, rac_number)
    `)
    .order('meeting_date', { ascending: false });

  const { data: pendingAttendance } = await supabase
    .from('pending_attendance')
    .select(`
      *,
      member:members(full_name, rac_number)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  return {
    members: members ?? [],
    attendance: attendance ?? [],
    pendingAttendance: pendingAttendance ?? []
  };
};

export const actions: Actions = {
  approvePending: async ({ request, locals }) => {
    const me = await locals.getMember();
    if (!me?.is_admin) return fail(403, { error: 'Unauthorized' });

    const formData = await request.formData();
    const id = Number(formData.get('id'));
    if (!id) return fail(400, { error: 'Attendance submission is required.' });

    const supabase = createSupabaseServiceClient();
    const { data: submission, error: submissionError } = await supabase
      .from('pending_attendance')
      .select('*')
      .eq('id', id)
      .eq('status', 'pending')
      .single();

    if (submissionError || !submission) return fail(404, { error: 'Pending attendance submission was not found.' });

    const officialDate = submission.event_date ?? new Date().toISOString().slice(0, 10);
    let officialError = null;

    if (submission.event_type === 'activity' || submission.event_type === 'project') {
      const result = await supabase.from('volunteer_hours').insert({
        member_id: submission.member_id,
        activity_name: submission.event_name,
        hours: submission.volunteer_hours,
        activity_date: officialDate
      });
      officialError = result.error;
    } else {
      const result = await supabase.from('meeting_attendance').upsert(
        {
          member_id: submission.member_id,
          meeting_date: officialDate,
          attended: true
        },
        { onConflict: 'member_id,meeting_date' }
      );
      officialError = result.error;
    }

    if (officialError) return fail(500, { error: officialError.message });

    if (submission.guest_name) {
      const { error: guestError } = await supabase.from('attendance_guests').upsert(
        {
          pending_attendance_id: submission.id,
          member_id: submission.member_id,
          event_name: submission.event_name,
          event_date: submission.event_date,
          guest_name: submission.guest_name,
          guest_email: submission.guest_email
        },
        { onConflict: 'pending_attendance_id' }
      );

      if (guestError) return fail(500, { error: guestError.message });
    }

    const { error } = await supabase
      .from('pending_attendance')
      .update({ status: 'approved', reviewed_by: me.id, reviewed_at: new Date().toISOString() })
      .eq('id', submission.id);

    if (error) return fail(500, { error: error.message });
    return { success: true };
  },

  rejectPending: async ({ request, locals }) => {
    const me = await locals.getMember();
    if (!me?.is_admin) return fail(403, { error: 'Unauthorized' });

    const formData = await request.formData();
    const id = Number(formData.get('id'));
    const rejection_reason = (String(formData.get('rejection_reason') ?? '').trim() || 'Attendance was not approved.').slice(0, 500);
    if (!id) return fail(400, { error: 'Attendance submission is required.' });

    const supabase = createSupabaseServiceClient();
    const { error } = await supabase
      .from('pending_attendance')
      .update({ status: 'rejected', rejection_reason, reviewed_by: me.id, reviewed_at: new Date().toISOString() })
      .eq('id', id)
      .eq('status', 'pending');

    if (error) return fail(500, { error: error.message });
    return { success: true };
  },

  addAttendance: async ({ request, locals }) => {
    const me = await locals.getMember();
    if (!me?.is_admin) return fail(403, { error: 'Unauthorized' });

    const data = await request.formData();
    const member_id = parseInt(data.get('member_id') as string);
    const meeting_date = data.get('meeting_date') as string;
    const attended = data.get('attended') === 'on';

    if (!member_id || !meeting_date) {
      return fail(400, { error: 'Member and meeting date are required' });
    }

    const supabase = createSupabaseServiceClient();
    const { error } = await supabase
      .from('meeting_attendance')
      .upsert(
        { member_id, meeting_date, attended },
        { onConflict: 'member_id,meeting_date' }
      );

    if (error) return fail(500, { error: error.message });
    return { success: true };
  },

  updateAttendance: async ({ request, locals }) => {
    const me = await locals.getMember();
    if (!me?.is_admin) return fail(403, { error: 'Unauthorized' });

    const data = await request.formData();
    const id = parseInt(data.get('id') as string);
    const attended = data.get('attended') === 'on';

    const supabase = createSupabaseServiceClient();
    const { error } = await supabase
      .from('meeting_attendance')
      .update({ attended })
      .eq('id', id);

    if (error) return fail(500, { error: error.message });
    return { success: true };
  },

  deleteAttendance: async ({ request, locals }) => {
    const me = await locals.getMember();
    if (!me?.is_admin) return fail(403, { error: 'Unauthorized' });

    const data = await request.formData();
    const id = parseInt(data.get('id') as string);

    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.from('meeting_attendance').delete().eq('id', id);

    if (error) return fail(500, { error: error.message });
    return { success: true };
  },

  bulkAddAttendance: async ({ request, locals }) => {
    const me = await locals.getMember();
    if (!me?.is_admin) return fail(403, { error: 'Unauthorized' });

    const data = await request.formData();
    const meeting_date = data.get('meeting_date') as string;
    const attended_ids = data.getAll('attended_ids').map(Number);

    if (!meeting_date) {
      return fail(400, { error: 'Meeting date is required' });
    }

    const supabase = createSupabaseServiceClient();

    // Get all active members
    const { data: members } = await supabase
      .from('members')
      .select('id')
      .eq('status', 'active');

    if (!members) return fail(500, { error: 'Failed to fetch members' });

    // Create attendance records for all members
    const records = members.map((m: any) => ({
      member_id: m.id,
      meeting_date,
      attended: attended_ids.includes(m.id)
    }));

    const { error } = await supabase
      .from('meeting_attendance')
      .upsert(records, { onConflict: 'member_id,meeting_date' });

    if (error) return fail(500, { error: error.message });
    return { success: true };
  }
};
