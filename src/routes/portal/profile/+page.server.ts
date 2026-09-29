import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals }) => {
  const { member } = await parent();

  if (!member) {
    return {
      member,
      committees: [],
      memberCommitteeIds: [],
    };
  }

  const [committeesResult, memberCommitteesResult] = await Promise.all([
    locals.supabase.from('committees').select('*').eq('is_active', true).order('sort_order'),
    locals.supabase.from('member_committees').select('committee_id').eq('member_id', member.id)
  ]);

  console.log('✅ [Profile Load] Member:', member.full_name);

  return {
    member,
    committees: committeesResult.data ?? [],
    memberCommitteeIds: (memberCommitteesResult.data ?? []).map((row) => row.committee_id)
  };
};

function getCommitteeIds(data: FormData) {
  return data
    .getAll('committee_ids')
    .map((value) => Number.parseInt(value.toString(), 10))
    .filter((value, index, ids) => Number.isInteger(value) && value > 0 && ids.indexOf(value) === index);
}

function verifySessionAndMember(locals: App.Locals) {
  return locals.getMember();
}

export const actions: Actions = {
  updateProfile: async ({ request, locals }) => {
    const member = await locals.getMember();
    if (!member) return fail(401, { error: 'Unauthorized' });

    const data = await request.formData();
    const phone      = (data.get('phone')      as string)?.trim() || null;
    const occupation = (data.get('occupation') as string)?.trim() || null;
    const skills     = (data.get('skills')     as string)?.trim() || null;

    const { error } = await locals.supabase
      .from('members')
      .update({ phone, occupation, skills })
      .eq('id', member.id);

    if (error) return fail(500, { error: 'Failed to update profile.' });
    return { success: true };
  },

  updateCommittees: async ({ request, locals }) => {
    const member = await locals.getMember();
    if (!member) return fail(401, { error: 'Unauthorized' });

    const data = await request.formData();
    const intent = data.get('intent')?.toString();

    if (intent === 'skip') {
      const { error } = await locals.supabase
        .from('members')
        .update({ committee_onboarding_skipped_at: new Date().toISOString() })
        .eq('id', member.id);

      if (error) return fail(500, { error: 'Failed to save committee preference.' });
      return { success: true };
    }

    const committeeIds = getCommitteeIds(data);
    if (committeeIds.length < 3) {
      return fail(400, { error: 'Please select at least 3 committees.' });
    }

    const { error: deleteError } = await locals.supabase.from('member_committees').delete().eq('member_id', member.id);
    if (deleteError) return fail(500, { error: 'Failed to update committees.' });

    const { error: insertError } = await locals.supabase.from('member_committees').insert(
      committeeIds.map((committeeId) => ({
        member_id: member.id,
        committee_id: committeeId
      }))
    );

    if (insertError) return fail(500, { error: 'Failed to save committees.' });

    const { error: memberError } = await locals.supabase
      .from('members')
      .update({
        committee_onboarding_completed: true,
        committee_onboarding_skipped_at: null
      })
      .eq('id', member.id);

    if (memberError) return fail(500, { error: 'Failed to complete committee setup.' });
    return { success: true };
  },

  changePassword: async ({ request, locals }) => {
    const member = await locals.getMember();
    if (!member) return fail(401, { error: 'Unauthorized' });

    const data = await request.formData();
    const currentPassword = data.get('current_password') as string;
    const newPassword = data.get('new_password') as string;
    const confirmPassword = data.get('confirm_password') as string;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return fail(400, { error: 'All password fields are required.' });
    }

    if (newPassword.length < 6) {
      return fail(400, { error: 'New password must be at least 6 characters.' });
    }

    if (newPassword !== confirmPassword) {
      return fail(400, { error: 'New passwords do not match.' });
    }

    if (currentPassword === newPassword) {
      return fail(400, { error: 'New password must be different from current password.' });
    }

    try {
      // First verify the current password by attempting to sign in
      const session = await locals.getSession();
      if (!session?.user?.email) {
        return fail(401, { error: 'Session expired. Please log in again.' });
      }

      const { error: signInError } = await locals.supabase.auth.signInWithPassword({
        email: session.user.email,
        password: currentPassword,
      });

      if (signInError) {
        return fail(400, { error: 'Current password is incorrect.' });
      }

      // Update to new password
      const { error: updateError } = await locals.supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        return fail(500, { error: 'Failed to update password: ' + updateError.message });
      }

      return { success: true, message: 'Password changed successfully.' };
    } catch (err: any) {
      return fail(500, { error: 'An error occurred. Please try again.' });
    }
  }
};
