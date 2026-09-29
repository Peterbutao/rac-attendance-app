import { createSupabaseServiceClient } from '$lib/server/supabase';
import type { PartnershipInquiry } from '$lib/types';

export async function load() {
  const supabase = createSupabaseServiceClient();
  
  const { data: inquiries, error } = await supabase
    .from('partnership_inquiries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch partnership inquiries:', error);
    return { inquiries: [] as PartnershipInquiry[] };
  }

  return { inquiries: (inquiries || []) as PartnershipInquiry[] };
}