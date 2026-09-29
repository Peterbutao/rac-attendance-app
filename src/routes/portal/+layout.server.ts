import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  console.log('📋 [/portal layout] Verifying authenticated user...');
  
  const user = await locals.getUser();
  if (!user) {
    console.log('❌ [/portal layout] User not authenticated - redirecting to /login');
    throw redirect(302, '/login');
  }
  
  console.log('✅ [/portal layout] User authenticated:', user.email);
  
  const member = await locals.getMember();
  
  if (!member) {
    console.warn('⚠️ [/portal layout] No member record found for this user');
    // Allow portal access but member data will be unavailable on some pages
    return { user, member: null };
  }
  
  console.log('✅ [/portal layout] Member found:', member.rac_number, '- Status:', member.status);
  
  if (member.status !== 'active') {
    console.warn('⚠️ [/portal layout] Member status is not active:', member.status);
    throw redirect(302, '/login');
  }
  
  console.log('✅ [/portal layout] Access granted');
  return { user, member };
};
