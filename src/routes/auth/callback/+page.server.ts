import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
  const code = url.searchParams.get('code');
  const type = url.searchParams.get('type');

  console.log('🔐 [/auth/callback] Processing callback:', { code: code?.substring(0, 10) + '...', type });

  if (!code) {
    console.warn('⚠️ No code in callback');
    throw redirect(302, '/login?error=invalid_callback');
  }

  if (type === 'recovery') {
    // Password recovery - redirect to recovery page with code
    console.log('✅ Password recovery callback received');
    throw redirect(302, `/auth/update-password?code=${code}`);
  }

  // For other callback types, just redirect to login
  console.log('ℹ️ Callback type:', type);
  throw redirect(302, '/login');
};
