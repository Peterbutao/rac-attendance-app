import { createSupabaseServiceClient } from '$lib/server/supabase';
import type { DonationInterest } from '$lib/types';

export async function load() {
  const supabase = createSupabaseServiceClient();
  
  const { data: donations, error } = await supabase
    .from('donation_interests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch donation interests:', error);
    return { donations: [] as DonationInterest[] };
  }

  return { donations: (donations || []) as DonationInterest[] };
}