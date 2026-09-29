<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  export let form: ActionData;

  let submitting = false;
  let showPassword = false;
  let showForgotPassword = false;
  let resetEmail = '';
</script>

<svelte:head>
  <title>Member Login — Rotaract Club of Lilongwe</title>
  <meta name="robots" content="noindex, nofollow" />
  <meta
    name="description"
    content="Sign in to the Rotaract Club of Lilongwe member portal using your assigned RAC number to access your member profile and club resources."
  />
</svelte:head>

<div class="login-page">
  <div class="login-page__left">
    <div class="hero-shade"></div>
    <div class="login-page__left-content">
      <a href="/" class="back-link">← Back to home</a>
      <div class="login-brand">
        <div class="section-pill dark">MEMBER PORTAL</div>
        <h1>WELCOME<br /><span>BACK</span></h1>
        <p>
          Sign in with your assigned RAC number.
          If you haven't received your credentials yet, your application may still be under review.
        </p>
      </div>
      <div class="login-info-box">
        <p>
          Your RAC number follows the format:<br/>
          <code class="rac-format">rac026000</code>
        </p>
      </div>
    </div>
  </div>

  <div class="login-page__right">
    <div class="login-card">
      {#if !showForgotPassword}
        <!-- LOGIN FORM -->
        <h3>Sign In</h3>
        <p style="color:var(--text-muted);margin-top:var(--space-1);margin-bottom:var(--space-8)">
          Access your Rotaract member account.
        </p>

        {#if form?.error}
          <div class="alert alert--error" style="margin-bottom:var(--space-5)">
            {form.error}
          </div>
        {/if}

        <form method="POST" action="?/login" use:enhance={() => {
          submitting = true;
          return async ({ update }) => {
            submitting = false;
            await update();
          };
        }}>
          <div class="form-group">
            <label class="form-label" for="email">RAC Number</label>
            <input
              id="email"
              type="text"
              class="form-input"
              name="email"
              placeholder="rac026001"
              autocomplete="username"
              autocapitalize="none"
              required
              disabled={submitting}
            />
          </div>

          <div class="form-group" style="margin-top:var(--space-5)">
            <label class="form-label" for="password">Password</label>
            <div style="position:relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                class="form-input"
                name="password"
                placeholder="••••••••"
                autocomplete="current-password"
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

          <button
            type="submit"
            class="btn btn--primary"
            style="width:100%;margin-top:var(--space-8);justify-content:center;padding:var(--space-4)"
            disabled={submitting}
          >
            {submitting ? 'Signing in…' : 'Sign In to Portal'}
          </button>
        </form>

        <hr class="divider" style="margin:var(--space-8) 0" />

        <div style="display:flex;gap:var(--space-4);justify-content:center;font-size:0.875rem;color:var(--text-muted)">
          <!-- <button type="button" on:click={() => showForgotPassword = true} style="background:none;border:none;color:var(--gold);font-weight:500;cursor:pointer;font-size:0.875rem;padding:0;font-family:inherit">Forgot Password?</button> -->
          <!-- <span>•</span> -->
          <a href="/join" style="color:var(--gold);font-weight:500">Apply to join</a>
        </div>
      {:else}
        <!-- FORGOT PASSWORD FORM -->
        <h3>Reset Password</h3>
        <p style="color:var(--text-muted);margin-top:var(--space-1);margin-bottom:var(--space-8)">
          Enter your RAC number and we'll send a reset link to your registered email.
        </p>

        {#if form?.success}
          <div class="alert alert--success" style="margin-bottom:var(--space-5)">
            ✓ {form.message}
          </div>
        {/if}

        {#if form?.error}
          <div class="alert alert--error" style="margin-bottom:var(--space-5)">
            {form.error}
          </div>
        {/if}

        <form method="POST" action="?/resetPassword" use:enhance={() => {
          submitting = true;
          return async ({ update }) => {
            submitting = false;
            await update();
          };
        }}>
          <div class="form-group">
            <label class="form-label" for="reset_rac">RAC Number</label>
            <input
              id="reset_rac"
              type="text"
              class="form-input"
              name="rac_number"
              placeholder="e.g. rac026001"
              autocapitalize="none"
              bind:value={resetEmail}
              required
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            class="btn btn--primary"
            style="width:100%;margin-top:var(--space-8);justify-content:center;padding:var(--space-4)"
            disabled={submitting}
          >
            {submitting ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>

        <hr class="divider" style="margin:var(--space-8) 0" />

        <p style="font-size:0.875rem;color:var(--text-muted);text-align:center">
          <a href="#back" on:click|preventDefault={() => showForgotPassword = false} style="color:var(--gold);font-weight:500;cursor:pointer">
            Back to Sign In
          </a>
        </p>
      {/if}
    </div>
  </div>
</div>

<style>
.login-page {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;
}
.login-page__left {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-12);
  position: relative;
  overflow: hidden;
  background: var(--near-black) ;
}
.login-page__left::before {
  display: none;
}
.hero-shade {
  display: none;
}
.login-page__left-content {
  max-width: 380px;
  position: relative;
  z-index: 1;
}
.login-brand { margin-top: var(--space-6); }
.login-brand h1 {
  font-family: 'Anton', sans-serif;
  color: white;
  font-size: clamp(40px, 6vw, 64px);
  line-height: .9;
  margin-bottom: 20px;
  text-transform: uppercase;
  letter-spacing: 0;
}
.login-brand h1 span {
  color: var(--primary);
}
.login-brand p {
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: rgba(255, 255, 255, .65);
  font-size: 15px;
  line-height: 1.75;
  margin-top: 0;
}
.section-pill {
  display: inline-flex;
  width: fit-content;
  background: rgba(232, 23, 93, .1);
  color: var(--primary);
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.5px;
  padding: 5px 14px;
  border-radius: 100px;
  margin-bottom: 18px;
  text-transform: uppercase;
}
.section-pill.dark {
  background: rgba(232, 23, 93, .18);
  border: 1px solid rgba(232, 23, 93, .42);
}
.login-info-box {
  margin-top: var(--space-8);
  padding: 16px 20px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 4px;
}
.login-info-box p {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.85rem;
  color: rgba(255,255,255,0.5);
  line-height: 1.6;
}
.rac-format {
  color: var(--primary);
  font-family: var(--font-mono);
  font-size: 0.9rem;
  font-weight: 600;
}
.back-link {
  display: inline-block;
  font-size: 0.85rem;
  text-decoration: none;
  color: rgba(255,255,255,0.4);
  font-family: 'Plus Jakarta Sans', sans-serif;
  transition: color .2s ease;
}
.back-link:hover { color: var(--primary) !important; }

.login-page__right {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-12);
  /* background: var(--cream); */
  /* background: ; */
  background-image: linear-gradient(var(--cream) 30%, var(--primary) 70%),url("https://kwwvmkszattobpgisslt.supabase.co/storage/v1/object/public/RAC/BACKGROUND/bg.jpg");
  background-position: center;
  background-repeat: no-repeat; 
  background-size: cover; 
  background-blend-mode: multiply;
}
.login-card {
  width: 100%;
  max-width: 420px;
  background: var(--white);
  border: 1px solid var(--border);
  padding: 20px;
  box-shadow: var(--shadow-lg);
}

@media (max-width: 768px) {
  .login-page { grid-template-columns: 1fr; }
  .login-page__left { display: none; }
  .login-page__right { padding: var(--space-6); min-height: 100vh; }
}
</style>
