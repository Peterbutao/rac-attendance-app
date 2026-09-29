import type { LayoutServerLoad } from './$types';
import type { Committee } from '$lib/types';

export const load: LayoutServerLoad = async ({ locals }) => {
  const session = await locals.getSession();
  const member = session ? await locals.getMember() : null;
  let committees: Committee[] = [];
  let memberCommitteeIds: number[] = [];

  if (member) {
    const [committeesResult, memberCommitteesResult] = await Promise.all([
      locals.supabase.from('committees').select('*').eq('is_active', true).order('sort_order'),
      locals.supabase.from('member_committees').select('committee_id').eq('member_id', member.id)
    ]);

    committees = committeesResult.data ?? [];
    memberCommitteeIds = (memberCommitteesResult.data ?? []).map((row) => row.committee_id);
  }

  return {
    session,
    user: session?.user ?? null,
    member,
    committees,
    memberCommitteeIds
  };
};
