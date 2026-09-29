import { fail } from '@sveltejs/kit';
import { createSupabaseServiceClient } from '$lib/server/supabase';
import { fetchAttendanceOptions } from '$lib/server/activity-events';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const member = await locals.getMember();
  if (!member) return { events: [], pendingAttendance: [], guestCount: 0 };

  const supabase = createSupabaseServiceClient();
  const [events, pendingResult, guestResult] = await Promise.all([
    fetchAttendanceOptions(),
    supabase
      .from('pending_attendance')
      .select('id, event_name, event_type, event_date, volunteer_hours, guest_name, status, created_at, rejection_reason')
      .eq('member_id', member.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('attendance_guests')
      .select('id', { count: 'exact', head: true })
      .eq('member_id', member.id)
  ]);

  return {
    events,
    pendingAttendance: pendingResult.data ?? [],
    guestCount: guestResult.count ?? 0
  };
};

export const actions: Actions = {
  submitAttendance: async ({ request, locals }) => {
    const member = await locals.getMember();
    if (!member || member.status !== 'active') return fail(403, { error: 'Active member access is required.' });

    const formData = await request.formData();
    const attendanceCategory = String(formData.get('attendance_category') ?? '').trim();
    const eventKey = String(formData.get('event_key') ?? '').trim();
    const selectedEvent = (await fetchAttendanceOptions()).find((event) => event.event_key === eventKey);

    if (!selectedEvent) return fail(400, { error: 'Please select a valid event.' });
    if (!['event', 'project'].includes(attendanceCategory)) {
      return fail(400, { error: 'Please select whether this is an event or project.' });
    }
    if ((attendanceCategory === 'project') !== (selectedEvent.event_type === 'project')) {
      return fail(400, { error: 'The selected item does not match the attendance type.' });
    }

    const requiresHours = selectedEvent.event_type === 'activity' || selectedEvent.event_type === 'project';
    const volunteerHours = requiresHours
      ? Number(formData.get('volunteer_hours'))
      : null;
    if (requiresHours && (!Number.isFinite(volunteerHours) || volunteerHours <= 0)) {
      return fail(400, { error: 'Volunteer hours are required for an activity or project.' });
    }

    const hasGuest = formData.get('guest_invited') === 'on';
    const guestName = hasGuest ? String(formData.get('guest_name') ?? '').trim() : null;
    const guestEmail = hasGuest ? String(formData.get('guest_email') ?? '').trim() || null : null;
    if (hasGuest && !guestName) return fail(400, { error: 'Enter the guest name.' });

    const supabase = createSupabaseServiceClient();
    const { data: existing } = await supabase
      .from('pending_attendance')
      .select('id')
      .eq('member_id', member.id)
      .eq('event_key', selectedEvent.event_key)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) return fail(400, { error: 'You already have a pending submission for this event.' });

    const { error } = await supabase.from('pending_attendance').insert({
      member_id: member.id,
      event_key: selectedEvent.event_key,
      event_name: selectedEvent.title ?? 'Untitled event',
      event_type: selectedEvent.event_type,
      event_date: selectedEvent.event_date,
      volunteer_hours: volunteerHours,
      guest_name: guestName,
      guest_email: guestEmail
    });

    if (error) return fail(500, { error: error.message });
    return { success: true };
  }
};
