import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const code = url.searchParams.get('code');

  if (!code) {
    console.warn('⚠️ [/auth/update-password] No recovery code provided');
    throw redirect(302, '/login?error=invalid_token');
  }

  console.log('✅ [/auth/update-password] Recovery token received');
  return { code };
};
