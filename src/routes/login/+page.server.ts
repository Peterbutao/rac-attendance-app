import { redirect, fail } from '@sveltejs/kit';
import { createSupabaseServiceClient } from '$lib/server/supabase';
import type { PageServerLoad, Actions } from './$types';

const MEMBER_EMAIL_DOMAIN = '@members.rotaractlilongwe.org';

export const load: PageServerLoad = async ({ locals }) => {
  console.log('🔐 [/login] Page load - checking for existing session...');
  const session = await locals.getSession();
  
  if (session) {
    console.log('✅ Active session found for user:', session.user?.email);
    const member = await locals.getMember();
    const redirectTo = member?.is_admin ? '/admin/applications' : '/portal';
    console.log('🔄 Redirecting to', redirectTo);
    throw redirect(302, redirectTo);
  }
  
  console.log('❌ No active session found - showing login form');
  return {};
};

export const actions: Actions = {
  login: async ({ request, locals }) => {
    const formData = await request.formData();
    const memberId = (formData.get('email') as string | null)?.trim().toLowerCase() ?? '';
    const password = formData.get('password') as string;

    if (!memberId || !password) {
      return fail(400, { error: 'RAC number and password are required.' });
    }

    const email = memberId.includes('@') ? memberId : `${memberId}${MEMBER_EMAIL_DOMAIN}`;

    console.log('🔐 [/login] Server-side login attempt for:', email);

    try {
      const { data, error } = await locals.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Login error:', error.message);
        return fail(401, {
          error: error.message === 'Invalid login credentials'
            ? 'Incorrect email or password. Please try again.'
            : error.message
        });
      }

      console.log('✅ Login successful for:', email);
      const supabase = createSupabaseServiceClient();
      let { data: member, error: memberError } = await supabase
        .from('members')
        .select('is_admin')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (!member && data.user.email) {
        const result = await supabase
          .from('members')
          .select('is_admin')
          .eq('email', data.user.email.toLowerCase())
          .maybeSingle();

        member = result.data;
        memberError = result.error;
      }

      if (memberError) {
        console.error('❌ Member lookup error after login:', memberError.message);
      }

      throw redirect(302, member?.is_admin ? '/admin/applications' : '/portal');
    } catch (err: any) {
      if (err.status === 302) throw err; // Re-throw redirects
      console.error('❌ Unexpected error during login:', err);
      return fail(500, { error: 'An unexpected error occurred. Please try again.' });
    }
  },

  resetPassword: async ({ request }) => {
    const formData = await request.formData();
    const racNumber = (formData.get('rac_number') as string | null)?.trim().toLowerCase() ?? '';

    if (!racNumber) {
      return fail(400, { error: 'RAC number is required.' });
    }

    console.log('🔐 [/login] Password reset requested for RAC:', racNumber);

    try {
      const supabase = createSupabaseServiceClient();

      // Look up the member by RAC number to find their gmail
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id, gmail, email, user_id, rac_number')
        .eq('rac_number', racNumber)
        .maybeSingle();

      if (memberError) {
        console.error('❌ Member lookup error:', memberError.message);
      }

      if (!member) {
        // Don't reveal if the RAC number exists (security best practice)
        console.log('🔐 No member found for RAC:', racNumber);
        return { 
          success: true, 
          message: 'If that RAC number exists, a reset link has been sent to the member\'s registered email address. Contact an admin if you don\'t receive it.' 
        };
      }

      // Determine which email to send the reset to
      // Auth users are registered under the synthetic email (rac@members.rotaractlilongwe.org),
      // so we need to send the reset to their real gmail for it to be deliverable.
      // We use the gmail from the database as the target for password reset.
      const resetTargetEmail = member.gmail || member.email;

      if (!resetTargetEmail) {
        console.log('🔐 No email on file for member:', member.rac_number);
        return { 
          success: true, 
          message: 'If that RAC number exists, a reset link has been sent to the member\'s registered email address. Contact an admin if you don\'t receive it.' 
        };
      }

      console.log('🔐 Sending password reset to gmail:', resetTargetEmail, 'for RAC:', racNumber);

      // Send the reset email to the member's actual gmail address
      const { error } = await supabase.auth.resetPasswordForEmail(resetTargetEmail, {
        redirectTo: `${process.env.ORIGIN || 'http://localhost:5173'}/auth/callback?type=recovery`
      });

      if (error) {
        console.error('❌ Password reset error:', error.message);
        // If the gmail is not the auth user's registered email, fall back to the synthetic email
        const syntheticEmail = `${racNumber}@members.rotaractlilongwe.org`;
        console.log('🔐 Retrying with synthetic email:', syntheticEmail);
        
        const { error: retryError } = await supabase.auth.resetPasswordForEmail(syntheticEmail, {
          redirectTo: `${process.env.ORIGIN || 'http://localhost:5173'}/auth/callback?type=recovery`
        });

        if (retryError) {
          console.error('❌ Password reset also failed for synthetic email:', retryError.message);
        }
      }

      return { 
        success: true, 
        message: 'If that RAC number exists, a reset link has been sent to the member\'s registered email address. Contact an admin if you don\'t receive it.' 
      };
    } catch (err: any) {
      console.error('❌ Unexpected error during password reset:', err);
      return fail(500, { error: 'An error occurred. Please try again.' });
    }
  }
};
