<script lang="ts">
  import { createClient } from '$lib/supabase';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';

  export let data: PageData;

  let submitting = false;
  let showPassword = false;
  let showConfirmPassword = false;
  let errorMsg = '';
  let successMsg = '';

  const supabase = createClient();

  async function handlePasswordUpdate(e: Event) {
    e.preventDefault();
    
    const formData = new FormData(e.target as HTMLFormElement);
    const newPassword = (formData.get('new_password') as string)?.trim();
    const confirmPassword = (formData.get('confirm_password') as string)?.trim();

    errorMsg = '';
    successMsg = '';

    // Validation
    if (!newPassword || !confirmPassword) {
      errorMsg = 'All fields are required.';
      return;
    }

    if (newPassword.length < 8) {
      errorMsg = 'Password must be at least 8 characters.';
      return;
    }

    if (newPassword !== confirmPassword) {
      errorMsg = 'Passwords do not match.';
      return;
    }

    submitting = true;

    try {
      console.log('🔐 [update-password] Exchanging code for session');
      
      // Exchange the recovery code for a session (client-side - has PKCE verifier)
      const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(data.code);

      if (exchangeError) {
        console.error('❌ Exchange error:', exchangeError.message);
        errorMsg = 'Invalid or expired recovery link. Please request a new one.';
        submitting = false;
        return;
      }

      if (!sessionData.session) {
        console.error('❌ No session after code exchange');
        errorMsg = 'Failed to verify recovery link.';
        submitting = false;
        return;
      }

      console.log('✅ Session established, updating password');

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        console.error('❌ Update password error:', updateError.message);
        errorMsg = `Failed to update password: ${updateError.message}`;
        submitting = false;
        return;
      }

      console.log('✅ Password updated successfully');
      successMsg = 'Password updated! Redirecting to login...';

      // Sign out and redirect
      await supabase.auth.signOut();
      
      setTimeout(() => {
        goto('/login?success=password_updated');
      }, 1500);
    } catch (err: any) {
      console.error('❌ Unexpected error:', err);
      errorMsg = 'An unexpected error occurred. Please try again.';
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Reset Password — Rotaract Club of Lilongwe</title>
</svelte:head>

<div class="login-page">
  <div class="login-page__left">
    <div class="login-page__left-content">
      <a href="/" class="back-link" style="color:rgba(255,255,255,0.4)">← Back to home</a>
      <div class="login-brand">
        <span style="font-size:3rem;color:var(--gold)">🔐</span>
        <h2 style="color:var(--white);margin-top:var(--space-4)">Reset Password</h2>
        <p style="color:rgba(255,255,255,0.55);margin-top:var(--space-3);line-height:1.7">
          Create a new password for your Rotaract member account.
        </p>
      </div>
    </div>
  </div>

  <div class="login-page__right">
    <div class="login-card">
      <h3>Create New Password</h3>
      <p style="color:var(--text-muted);margin-top:var(--space-1);margin-bottom:var(--space-8)">
        Enter a new password below.
      </p>

      {#if errorMsg}
        <div class="alert alert--error" style="margin-bottom:var(--space-5)">
          {errorMsg}
        </div>
      {/if}

      {#if successMsg}
        <div class="alert alert--success" style="margin-bottom:var(--space-5)">
          ✓ {successMsg}
        </div>
      {/if}

      <form on:submit={handlePasswordUpdate}>
        <div class="form-group">
          <label class="form-label" for="new_password">New Password</label>
          <div style="position:relative">
            <input
              id="new_password"
              type={showPassword ? 'text' : 'password'}
              class="form-input"
              name="new_password"
              placeholder="Minimum 8 characters"
              minlength="8"
              required
              disabled={submitting}
              style="padding-right: 2.5rem"
            />
            <button
              type="button"
              on:click={() => showPassword = !showPassword}
              class="password-toggle"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={submitting}
              style="position:absolute;right:0.75rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;padding:0.5rem;color:var(--text-muted);font-size:1.2rem;display:flex;align-items:center;justify-content:center"
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        <div class="form-group" style="margin-top:var(--space-5)">
          <label class="form-label" for="confirm_password">Confirm Password</label>
          <div style="position:relative">
            <input
              id="confirm_password"
              type={showConfirmPassword ? 'text' : 'password'}
              class="form-input"
              name="confirm_password"
              placeholder="Re-enter your password"
              minlength="8"
              required
              disabled={submitting}
              style="padding-right: 2.5rem"
            />
            <button
              type="button"
              on:click={() => showConfirmPassword = !showConfirmPassword}
              class="password-toggle"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              disabled={submitting}
              style="position:absolute;right:0.75rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;padding:0.5rem;color:var(--text-muted);font-size:1.2rem;display:flex;align-items:center;justify-content:center"
            >
              {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          class="btn btn--primary"
          style="width:100%;margin-top:var(--space-8);justify-content:center;padding:var(--space-4)"
          disabled={submitting}
        >
          {submitting ? 'Updating…' : 'Update Password'}
        </button>
      </form>

      <hr class="divider" style="margin:var(--space-8) 0" />

      <p style="font-size:0.875rem;color:var(--text-muted);text-align:center">
        <a href="/login" style="color:var(--gold);font-weight:500">Back to Sign In</a>
      </p>
    </div>
  </div>
</div>

<style>
  :global(.login-page) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    min-height: 100vh;
  }
  :global(.login-page__left) {
    background: var(--near-black);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  :global(.login-page__left-content) {
    max-width: 320px;
  }
  :global(.login-page__right) {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
  }
  :global(.login-card) {
    width: 100%;
    max-width: 420px;
  }

  @media (max-width: 768px) {
    :global(.login-page) {
      grid-template-columns: 1fr;
    }
    :global(.login-page__left) {
      min-height: 200px;
      padding: var(--space-8) var(--space-4);
    }
  }
</style>
