import { fail } from '@sveltejs/kit';
import { createSupabaseServiceClient } from '$lib/server/supabase';
import type { Actions, PageServerLoad } from './$types';

const RAC_PREFIX = 'rac026';
const RAC_NUMBER_PATTERN = /^rac026\d{3,}$/;
const MAX_ASSIGNMENT_ATTEMPTS = 25;

type SupabaseServiceClient = ReturnType<typeof createSupabaseServiceClient>;
type RacRow = { rac_number: string | null };

function normalizeRacNumber(value: FormDataEntryValue | null): string | null {
  const racNumber = value?.toString().trim().toLowerCase();
  return racNumber || null;
}

function getRacSequence(racNumber: string | null): number | null {
  if (!racNumber) return null;

  const match = racNumber.toLowerCase().match(/^rac026(\d{3,})$/);
  if (!match) return null;

  return Number.parseInt(match[1], 10);
}

function formatRacNumber(sequence: number): string {
  return `${RAC_PREFIX}${String(sequence).padStart(3, '0')}`;
}

function isDuplicateError(error: { code?: string; message?: string } | null | undefined) {
  return error?.code === '23505' || error?.message?.toLowerCase().includes('duplicate');
}

function isAuthEmailConflict(error: { message?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? '';
  return message.includes('already') || message.includes('duplicate') || message.includes('exists');
}

async function getAssignedRacNumbers(supabase: SupabaseServiceClient): Promise<Set<string>> {
  const [membersResult, applicationsResult] = await Promise.all([
    supabase.from('members').select('rac_number').not('rac_number', 'is', null),
    supabase.from('join_applications').select('rac_number').not('rac_number', 'is', null)
  ]);

  if (membersResult.error) throw membersResult.error;
  if (applicationsResult.error) throw applicationsResult.error;

  const assigned = new Set<string>();

  [...((membersResult.data ?? []) as RacRow[]), ...((applicationsResult.data ?? []) as RacRow[])]
    .map((row) => row.rac_number?.toLowerCase())
    .filter((racNumber): racNumber is string => Boolean(racNumber))
    .forEach((racNumber) => assigned.add(racNumber));

  return assigned;
}

async function getNextAvailableRacNumber(supabase: SupabaseServiceClient, blocked = new Set<string>()): Promise<string> {
  const assigned = await getAssignedRacNumbers(supabase);
  const highestSequence = Math.max(
    0,
    ...[...assigned].map(getRacSequence).filter((sequence): sequence is number => sequence !== null)
  );
  let nextSequence = highestSequence + 1;

  while (nextSequence <= highestSequence + MAX_ASSIGNMENT_ATTEMPTS) {
    const candidateNumber = formatRacNumber(nextSequence);

    if (!assigned.has(candidateNumber) && !blocked.has(candidateNumber)) {
      return candidateNumber;
    }

    nextSequence++;
  }

  throw new Error('Could not generate next RAC number');
}

async function isRacNumberAssigned(supabase: SupabaseServiceClient, racNumber: string) {
  const assigned = await getAssignedRacNumbers(supabase);
  return assigned.has(racNumber);
}

async function getAssignedRacNumberList(supabase: SupabaseServiceClient) {
  const assigned = await getAssignedRacNumbers(supabase);

  return [...assigned].sort((a, b) => (getRacSequence(a) ?? 0) - (getRacSequence(b) ?? 0));
}

async function approveApplication({
  id,
  password,
  requestedRacNumber,
  reviewedBy
}: {
  id: number;
  password: string;
  requestedRacNumber: string;
  reviewedBy: string;
}) {
  const supabase = createSupabaseServiceClient();

  const { data: app, error: appError } = await supabase
    .from('join_applications')
    .select('id, status, rac_number, full_name, email, gmail, phone, occupation, skills')
    .eq('id', id)
    .single();

  if (appError) return fail(500, { error: appError.message });
  if (!app) return fail(404, { error: 'Application not found.' });
  if (app.status === 'approved' || app.rac_number) {
    return fail(409, { error: `This application has already been assigned ${app.rac_number ?? 'a RAC number'}.` });
  }

  let createdAuthUserId: string | null = null;
  let assignedRacNumber: string | null = null;
  const blockedRacNumbers = new Set<string>();

  for (let attempt = 0; attempt < MAX_ASSIGNMENT_ATTEMPTS; attempt++) {
    const candidateRacNumber =
      attempt === 0 ? requestedRacNumber : await getNextAvailableRacNumber(supabase, blockedRacNumbers);

    if (await isRacNumberAssigned(supabase, candidateRacNumber)) {
      blockedRacNumbers.add(candidateRacNumber);
      continue;
    }

    const racEmail = `${candidateRacNumber}@members.rotaractlilongwe.org`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: racEmail,
      password,
      email_confirm: true
    });

    if (authError) {
      if (isAuthEmailConflict(authError)) {
        blockedRacNumbers.add(candidateRacNumber);
        continue;
      }

      return fail(500, { error: `Failed to create user account: ${authError.message}` });
    }

    if (!authData?.user?.id) {
      return fail(500, { error: 'Failed to create user account' });
    }

    createdAuthUserId = authData.user.id;

    const memberPayload = {
      user_id: createdAuthUserId,
      rac_number: candidateRacNumber,
      email: racEmail,
      gmail: app.gmail,
      full_name: app.full_name,
      phone: app.phone,
      occupation: app.occupation,
      skills: app.skills,
      is_admin: false,
      status: 'active'
    };

    const { error: memberError } = await supabase.from('members').insert(memberPayload);

    if (memberError) {
      await supabase.auth.admin.deleteUser(createdAuthUserId);
      createdAuthUserId = null;

      if (isDuplicateError(memberError)) {
        blockedRacNumbers.add(candidateRacNumber);
        continue;
      }

      return fail(500, { error: `Failed to create member record: ${memberError.message}` });
    }

    assignedRacNumber = candidateRacNumber;
    break;
  }

  if (!assignedRacNumber || !createdAuthUserId) {
    return fail(409, { error: 'Could not reserve a unique RAC number. Please try again.' });
  }

  const { data: updatedApplication, error: updateError } = await supabase
    .from('join_applications')
    .update({
      status: 'approved',
      reviewed_by: reviewedBy,
      rac_number: assignedRacNumber,
      rac_assigned_at: new Date().toISOString()
    })
    .eq('id', id)
    .in('status', ['pending', 'under_review'])
    .is('rac_number', null)
    .select('id')
    .maybeSingle();

  if (updateError || !updatedApplication) {
    await supabase.from('members').delete().eq('user_id', createdAuthUserId);
    await supabase.auth.admin.deleteUser(createdAuthUserId);

    return fail(409, {
      error: updateError?.message ?? 'This application was changed while approval was running. Please refresh and try again.'
    });
  }

  return { success: true, assignedRacNumber };
}

export const load: PageServerLoad = async ({ url }) => {
  const status = url.searchParams.get('status') ?? 'pending';

  const supabase = createSupabaseServiceClient();
  const { data: applications } = await supabase
    .from('join_applications')
    .select('*')
    .eq('status', status)
    .order('submitted_at', { ascending: status === 'pending' });

  const { data: counts } = await supabase
    .from('join_applications')
    .select('status')
    .in('status', ['pending', 'under_review', 'approved', 'rejected']);

  const statusCounts = { pending: 0, under_review: 0, approved: 0, rejected: 0 };
  (counts ?? []).forEach((r) => {
    statusCounts[r.status as keyof typeof statusCounts]++;
  });

  return { applications: applications ?? [], status, statusCounts };
};

export const actions: Actions = {
  updateStatus: async ({ request, locals }) => {
    const me = await locals.getMember();
    if (!me?.is_admin) return fail(403, { error: 'Unauthorized' });

    const data = await request.formData();
    const id = Number.parseInt(data.get('id') as string, 10);
    const newStatus = data.get('status') as string;
    const racNumber = normalizeRacNumber(data.get('rac_number'));
    const password = (data.get('password') as string)?.trim() || null;
    const rejectionReason = (data.get('rejection_reason') as string)?.trim() || null;

    if (!Number.isInteger(id)) return fail(400, { error: 'Invalid application.' });
    if (!['under_review', 'approved', 'rejected', 'pending'].includes(newStatus)) {
      return fail(400, { error: 'Invalid status.' });
    }

    if (newStatus === 'approved') {
      if (!racNumber) return fail(400, { error: 'A RAC number is required when approving.' });
      if (!RAC_NUMBER_PATTERN.test(racNumber)) return fail(400, { error: 'RAC number must use the rac026001 format.' });
      if (!password || password.length < 8) return fail(400, { error: 'Password must be at least 8 characters.' });

      return approveApplication({
        id,
        password,
        requestedRacNumber: racNumber,
        reviewedBy: me.rac_number
      });
    }

    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      reviewed_by: me.rac_number
    };

    if (newStatus === 'rejected' && rejectionReason) {
      updatePayload.rejection_reason = rejectionReason;
    }

    const supabase = createSupabaseServiceClient();
    const { error: updateError } = await supabase.from('join_applications').update(updatePayload).eq('id', id);

    if (updateError) return fail(500, { error: updateError.message });

    return { success: true };
  },

  getNextRacNumber: async ({ locals }) => {
    const me = await locals.getMember();
    if (!me?.is_admin) return fail(403, { error: 'Unauthorized' });

    try {
      const supabase = createSupabaseServiceClient();
      const nextRacNumber = await getNextAvailableRacNumber(supabase);
      const assignedRacNumbers = await getAssignedRacNumberList(supabase);
      return { nextRacNumber, assignedRacNumbers };
    } catch (err) {
      console.error('Error generating RAC number:', err);
      return fail(500, { error: 'Failed to generate RAC number' });
    }
  }
};
