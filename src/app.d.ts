import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Committee, Database, Member } from '$lib/types';
import type { Session } from '@supabase/supabase-js';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      getSession: () => Promise<Session | null>;
      getUser: () => Promise<User | null>;
      getMember: () => Promise<Member | null>;
    }
    interface PageData {
      session?: Session | null;
      user?: User | null;
      member: Member | null;
      committees?: Committee[];
      memberCommitteeIds?: number[];
    }
  }
}

export {};
