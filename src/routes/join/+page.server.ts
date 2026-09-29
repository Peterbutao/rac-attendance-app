import { fail } from '@sveltejs/kit';
import { createSupabaseServiceClient } from '$lib/server/supabase';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ request }) => {
    console.log('🔍 [/join] Form submission received');
    const data = await request.formData();

    const full_name  = (data.get('full_name')  as string)?.trim();
    const email      = (data.get('email')      as string)?.trim().toLowerCase();
    const phone      = (data.get('phone')      as string)?.trim();
    const ageStr     = (data.get('age')        as string)?.trim();
    const occupation = (data.get('occupation') as string)?.trim();
    const motivation = (data.get('motivation') as string)?.trim();
    const skills     = (data.get('skills')     as string)?.trim() || null;

    console.log('📋 Form data:', { full_name, email, phone, age: ageStr, occupation, motivation, skills });

    const fieldErrors: Record<string, string> = {};
    const values = { full_name, email, phone, age: ageStr, occupation, motivation, skills };

    // Validate
    if (!full_name || full_name.length < 2)
      fieldErrors.full_name = 'Please enter your full name.';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      fieldErrors.email = 'Please enter a valid email address.';

    if (!phone || phone.length < 7)
      fieldErrors.phone = 'Please enter a valid phone number.';

    const age = parseInt(ageStr, 10);
    if (isNaN(age))
      fieldErrors.age = 'Please enter your age.';

    if (!occupation || occupation.length < 2)
      fieldErrors.occupation = 'Please enter your occupation.';

    if (!motivation)
      fieldErrors.motivation = 'Please tell us why you want to join.';

    if (Object.keys(fieldErrors).length > 0) {
      console.warn('❌ Validation failed:', fieldErrors);
      return fail(422, { fieldErrors, values });
    }

    console.log('✅ Validation passed');

    const supabase = createSupabaseServiceClient();
    console.log('🔗 Creating Supabase service client...');

    // Check for duplicate email
    console.log(`🔎 Checking for existing applications with email: ${email}`);
    const { data: existing, error: queryError } = await supabase
      .from('join_applications')
      .select('id, status')
      .eq('email', email)
      .in('status', ['pending', 'under_review', 'approved'])
      .maybeSingle();

    if (queryError) {
      console.error('❌ Query error when checking for duplicates:', queryError);
      return fail(500, { error: 'Error checking existing applications. Please try again.', values });
    }

    if (existing) {
      console.log('⚠️ Duplicate found:', existing);
      const statusMsg = existing.status === 'approved'
        ? 'You are already an approved member.'
        : 'You already have a pending application. Please wait for a response.';
      return fail(409, { error: statusMsg, values });
    }

    console.log('✅ No existing application found, proceeding with insert...');

    const insertPayload = { full_name, email, gmail: email, phone, age, occupation, motivation, skills };
    console.log('📝 Inserting application:', insertPayload);

    const { data: insertedData, error: insertError } = await supabase
      .from('join_applications')
      .insert(insertPayload)
      .select();

    if (insertError) {
      console.error('❌ Insert error:', insertError);
      console.error('Error code:', insertError.code);
      console.error('Error message:', insertError.message);
      console.error('Error details:', insertError.details);
      return fail(500, { error: 'Something went wrong. Please try again.', values });
    }

    console.log('✅ Application inserted successfully:', insertedData);
    console.log(`🎉 User ${email} submitted application successfully`);

    return { success: true, full_name, email };
  }
};
