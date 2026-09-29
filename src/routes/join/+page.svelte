<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';
  import logo from '$lib/assets/logo.png';

  export let form: ActionData;

  let submitting = false;
  let step = 1;

  const totalSteps = 2;

  // Form fields
  let full_name = form?.values?.full_name ?? '';
  let email     = form?.values?.email ?? '';
  let phone     = form?.values?.phone ?? '';
  let age       = form?.values?.age ?? '';
  let occupation = form?.values?.occupation ?? '';
  let motivation = form?.values?.motivation ?? '';
  let skills    = form?.values?.skills ?? '';

  function nextStep() {
    if (step < totalSteps) step++;
  }
  function prevStep() {
    if (step > 1) step--;
  }
</script>

<svelte:head>
  <title>Apply to Join â€” Rotaract Club of Lilongwe</title>
  <meta name="description" content="Apply to become a member of the Rotaract Club of Lilongwe. Join us in serving, leading, and growing together." />
</svelte:head>

<main>
  <!-- â”€â”€â”€ HERO â”€â”€â”€ -->
  <section class="join-hero">
    <div class="hero-shade"></div>
    <div class="hero-inner">

      <section class="form-wrap-section" id="apply">
        <div class="form-wrap-inner">
          {#if form?.success}
            <div class="success-card">
              <div class="success-card__icon">âœ“</div>
              <h2>APPLICATION<br /><span>SUBMITTED</span></h2>
              <p>
                Thank you, <strong>{form.full_name}</strong>! Your application has been received.
                Our membership committee will review it and contact you at <strong>{form.email}</strong> within two weeks.
              </p>
              <p class="success-card__copy">
                Keep an eye on your inbox. We look forward to welcoming you to the Rotaract Club of Lilongwe.
              </p>
              <a href="/" class="btn-primary">Back to Home</a>
            </div>
          {:else}

            <div class="form-progress">
              {#each Array(totalSteps) as _, i}
                <div class="form-progress__step" class:active={step === i + 1} class:done={step > i + 1}>
                  <span class="form-progress__num">{step > i + 1 ? 'âœ“' : i + 1}</span>
                  <span class="form-progress__label">{i === 0 ? 'Your Details' : 'Motivation'}</span>
                </div>
                {#if i < totalSteps - 1}
                  <div class="form-progress__line" class:done={step > i + 1}></div>
                {/if}
              {/each}
            </div>

            {#if form?.error}
              <div class="alert alert--error form-alert">
                âš ï¸ {form.error}
              </div>
            {/if}

            <form
              method="POST"
              use:enhance={() => {
                submitting = true;
                return async ({ update }) => {
                  submitting = false;
                  await update();
                };
              }}
              class="form"
              novalidate
            >
              {#if step === 1}
                <!-- â”€â”€â”€ STEP 1 â”€â”€â”€ -->
                <div class="form-step">
                  <p class="form-step__sub">Tell us a bit about yourself.</p>

                  <div class="form-field">
                    <label class="form-label" for="full_name">Full Name *</label>
                    <input
                      id="full_name"
                      name="full_name"
                      type="text"
                      class="form-input"
                      class:error={form?.fieldErrors?.full_name}
                      bind:value={full_name}
                      placeholder="e.g. Chisomo Banda"
                      required
                    />
                    {#if form?.fieldErrors?.full_name}
                      <span class="form-error">{form.fieldErrors.full_name}</span>
                    {/if}
                  </div>

                  <div class="form-row-2col">
                    <div class="form-field">
                      <label class="form-label" for="email">Email Address *</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        class="form-input"
                        class:error={form?.fieldErrors?.email}
                        bind:value={email}
                        placeholder="chisomo@example.com"
                        required
                      />
                      {#if form?.fieldErrors?.email}
                        <span class="form-error">{form.fieldErrors.email}</span>
                      {/if}
                    </div>
                    <div class="form-field">
                      <label class="form-label" for="phone">Phone Number *</label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        class="form-input"
                        class:error={form?.fieldErrors?.phone}
                        bind:value={phone}
                        placeholder="+265 999 000 000"
                        required
                      />
                      {#if form?.fieldErrors?.phone}
                        <span class="form-error">{form.fieldErrors.phone}</span>
                      {/if}
                    </div>
                  </div>

                  <div class="form-row-2col">
                    <div class="form-field">
                      <label class="form-label" for="age">Age *</label>
                      <input
                        id="age"
                        name="age"
                        type="number"
                        class="form-input"
                        class:error={form?.fieldErrors?.age}
                        bind:value={age}
                        placeholder="e.g. 24"
                        required
                      />
                      {#if form?.fieldErrors?.age}
                        <span class="form-error">{form.fieldErrors.age}</span>
                      {/if}
                    </div>
                    <div class="form-field">
                      <label class="form-label" for="occupation">Occupation *</label>
                      <input
                        id="occupation"
                        name="occupation"
                        type="text"
                        class="form-input"
                        class:error={form?.fieldErrors?.occupation}
                        bind:value={occupation}
                        placeholder="e.g. Software Engineer"
                        required
                      />
                      {#if form?.fieldErrors?.occupation}
                        <span class="form-error">{form.fieldErrors.occupation}</span>
                      {/if}
                    </div>
                  </div>

                  <div class="form-nav">
                    <span></span>
                    <button type="button" class="btn-primary" on:click={nextStep}>
                      Continue
                    </button>
                  </div>
                </div>

              {:else if step === 2}
                <!-- â”€â”€â”€ STEP 2 â”€â”€â”€ -->
                <input type="hidden" name="full_name"   value={full_name} />
                <input type="hidden" name="email"       value={email} />
                <input type="hidden" name="phone"       value={phone} />
                <input type="hidden" name="age"         value={age} />
                <input type="hidden" name="occupation"  value={occupation} />

                <div class="form-step">
                  <p class="form-step__sub">Help us understand why you want to join and what you bring to the club.</p>

                  <div class="form-field">
                    <label class="form-label" for="motivation">Why do you want to join? *</label>
                    <textarea
                      id="motivation"
                      name="motivation"
                      class="form-textarea"
                      class:error={form?.fieldErrors?.motivation}
                      bind:value={motivation}
                      placeholder="Tell us about your passion for community service, what draws you to Rotaract, and what you hope to contribute and gain as a member..."
                      rows="6"
                      required
                    ></textarea>
                    {#if form?.fieldErrors?.motivation}
                      <span class="form-error">{form.fieldErrors.motivation}</span>
                    {/if}
                  </div>

                  <div class="form-field">
                    <label class="form-label" for="skills">Skills & Expertise <span class="optional-label">(optional)</span></label>
                    <textarea
                      id="skills"
                      name="skills"
                      class="form-textarea"
                      bind:value={skills}
                      placeholder="e.g. Web development, graphic design, public speaking, accounting..."
                      rows="3"
                    ></textarea>
                    <span class="form-hint">Skills that could benefit the club's projects and activities.</span>
                  </div>

                  <div class="form-nav">
                    <button type="button" class="btn-outline" on:click={prevStep}>Back</button>
                    <button type="submit" class="btn-primary" disabled={submitting}>
                      {submitting ? 'Submittingâ€¦' : 'Submit Application'}
                    </button>
                  </div>
                </div>
              {/if}
            </form>
          {/if}
        </div>
      </section>
    </div>
  </section>


  <!-- â”€â”€â”€ CTA SECTION â”€â”€â”€ -->
  <section class="cta-section">
    <div class="cta-inner">
      <div class="cta-note">

        <p>
          Not sure if Rotaract is right for you? Reach out to us and we'll
          be happy to tell you more about membership, meetings, and our community.
        </p>
      </div>
      <a href="/about" class="btn-white">Learn about the club</a>
    </div>
  </section>
</main>



<style>
  /* â”€â”€â”€ Hero â”€â”€â”€ */
  .join-hero {
    position: relative;
    min-height: 50vh;
    overflow: hidden;
    display: flex;
    align-items: center;
    padding: 100px 5vw 60px;
    background-image: linear-gradient(90deg, rgba(26, 26, 26, .94) 0%, rgba(26, 26, 26, .72) 52%, rgba(26, 26, 26, .35) 100%), linear-gradient(180deg, rgba(232, 23, 93, .15) 0%, transparent 100%), url("https://kwwvmkszattobpgisslt.supabase.co/storage/v1/object/public/RAC/BACKGROUND/bg.jpg");
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
  }

  .hero-shade { display: none; }

  .hero-inner {
    position: relative;
    z-index: 1;
    width: min(1200px, 100%);
    margin: 0 auto;
  }

  .hero-copy { max-width: 760px; }

  h1, h2 {
    font-family: 'Anton', sans-serif;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  h1 {
    color: white;
    font-size: clamp(48px, 7vw, 90px);
    line-height: .9;
    margin-bottom: 24px;
  }

  h1 span, h2 span { color: var(--primary); }

  .hero-copy p {
    max-width: 620px;
    color: rgba(255, 255, 255, .76);
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 16px;
    line-height: 1.75;
  }

  /* â”€â”€â”€ Form Wrap Section â”€â”€â”€ */
  .form-wrap-section {
    background: var(--cream);
    padding: 60px 5vw 80px;
  }

  .form-wrap-inner {
    width: min(680px, 100%);
    margin: 0 auto;
  }



  /* â”€â”€â”€ Progress â”€â”€â”€ */
  .form-progress {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 28px;
    padding: 16px 20px;
    background: white;
    border: 1px solid rgba(0,0,0,.06);
    border-radius: 8px;
  }

  .form-progress__step {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .form-progress__num {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--cream-mid);
    border: 2px solid var(--border-dark);
    display: grid;
    place-items: center;
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--text-muted);
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: all .2s ease;
  }

  .form-progress__step.active .form-progress__num {
    background: var(--primary);
    border-color: var(--primary);
    color: white;
  }

  .form-progress__step.done .form-progress__num {
    background: #2d7a4f;
    border-color: #2d7a4f;
    color: white;
  }

  .form-progress__label {
    font-size: 0.85rem;
    color: var(--text-muted);
    font-weight: 600;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .form-progress__step.active .form-progress__label {
    color: var(--near-black);
  }

  .form-progress__line {
    flex: 1;
    height: 2px;
    min-width: 20px;
    background: var(--border-dark);
    transition: background .2s;
  }

  .form-progress__line.done { background: #2d7a4f; }

  /* â”€â”€â”€ Form Card â”€â”€â”€ */
  .form {
    background: white;
    border: 1px solid rgba(0,0,0,.06);
    border-radius: 8px;
    padding: 32px;
    box-shadow: 0 2px 12px rgba(26,26,26,.06);
  }


  .form-step__sub {
    color: var(--text-muted);
    font-family: 'Plus Jakarta Sans', sans-serif;
    margin-bottom: 24px;
    font-size: 14px;
  }

  .form-field {
    margin-bottom: 20px;
  }

  .form-field:last-child { margin-bottom: 0; }

  .form-row-2col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
  }

  .form-row-2col:last-child { margin-bottom: 0; }

  .form-label {
    display: block;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--near-black);
    margin-bottom: 6px;
  }

  .optional-label {
    font-weight: 400;
    text-transform: none;
    letter-spacing: 0;
    color: var(--text-muted);
  }

  .form-input,
  .form-textarea {
    width: 100%;
    padding: 12px 14px;
    background: white;
    border: 1.5px solid var(--border-dark);
    border-radius: 6px;
    color: var(--near-black);
    font-size: 0.95rem;
    transition: border-color .2s ease, box-shadow .2s ease;
    outline: none;
  }

  .form-input::placeholder,
  .form-textarea::placeholder {
    color: var(--text-light);
    font-size: 0.9rem;
  }

  .form-input:focus,
  .form-textarea:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(232, 23, 93, 0.12);
    background: #fff;
  }

  .form-input.error,
  .form-textarea.error {
    border-color: #c0392b;
  }

  .form-textarea {
    min-height: 110px;
    resize: vertical;
  }

  .form-error {
    display: block;
    font-size: 0.8rem;
    color: #c0392b;
    margin-top: 4px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 500;
  }

  .form-hint {
    display: block;
    font-size: 0.8rem;
    color: var(--text-light);
    font-family: 'Plus Jakarta Sans', sans-serif;
    margin-top: 4px;
  }

  .form-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    margin-top: 28px;
    padding-top: 24px;
    border-top: 1px solid var(--border);
  }

  .form-nav button { min-width: 150px; }

  .form-alert { margin-bottom: 20px; }

  /* â”€â”€â”€ Success â”€â”€â”€ */
  .success-card {
    background: white;
    border: 1px solid rgba(0,0,0,.06);
    border-radius: 8px;
    padding: 48px 32px;
    text-align: center;
    max-width: 520px;
    margin: 0 auto;
    box-shadow: 0 2px 12px rgba(26,26,26,.06);
  }

  .success-card__icon {
    width: 56px;
    height: 56px;
    background: #2d7a4f;
    color: white;
    font-size: 1.6rem;
    border-radius: 50%;
    display: grid;
    place-items: center;
    margin: 0 auto 20px;
  }

  .success-card h2 { color: var(--near-black); margin-bottom: 16px; }

  .success-card p {
    max-width: 440px;
    margin: 0 auto;
    color: rgba(26,26,26,.72);
    font-family: 'Plus Jakarta Sans', sans-serif;
    line-height: 1.7;
    font-size: 14px;
  }

  .success-card p + p { margin-top: 10px; }

  .success-card :global(.btn-primary) { display: inline-flex; margin-top: 24px; }

  /* â”€â”€â”€ CTA â”€â”€â”€ */
  .cta-section {
    background: var(--primary);
    padding: 60px 5vw;
    color: white;
  }

  .cta-inner {
    width: min(1000px, 100%);
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 40px;
  }

  .cta-note { max-width: 640px; }

  .cta-note p {
    color: rgba(255,255,255,.78);
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px;
    line-height: 1.7;
    margin-bottom: 0;
    margin-top: 8px;
  }

  .btn-primary,
  .btn-outline,
  .btn-white {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 44px;
    padding: 11px 24px;
    border-radius: 100px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px;
    font-weight: 800;
    text-decoration: none;
    cursor: pointer;
    transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
  }

  .btn-primary {
    background: var(--primary);
    color: white;
    border: 1px solid transparent;
    box-shadow: 0 6px 24px rgba(232,23,93,.3);
  }

  .btn-primary:hover { transform: translateY(-2px); }

  .btn-primary:disabled {
    opacity: .55;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .btn-outline {
    background: transparent;
    border: 2px solid rgba(232,23,93,.42);
    color: var(--primary);
  }

  .btn-outline:hover {
    border-color: var(--primary);
    background: rgba(232,23,93,.08);
    transform: translateY(-2px);
  }

  .btn-white {
    background: white;
    color: var(--primary);
    box-shadow: 0 6px 24px rgba(0,0,0,.12);
  }

  .btn-white:hover { transform: translateY(-2px); }

  /* â”€â”€â”€ Footer â”€â”€â”€ */
  footer {
    background: var(--near-black);
    padding: 48px 5vw 28px;
  }

  .footer-inner { width: min(1000px, 100%); margin: 0 auto; }

  .footer-brand { max-width: 380px; margin-bottom: 32px; }

  .logo-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
  }

  .image-logo { display: inline-flex; width: 28px; }
  .image-logo img { width: 100%; }

  .logo-tagline {
    font-family: 'Anton', sans-serif;
    font-size: 12px;
    color: var(--primary);
    letter-spacing: 2px;
  }

  .logo-name {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 10px;
    color: rgba(255,255,255,.72);
    font-weight: 600;
  }

  .footer-about {
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: rgba(255,255,255,.5);
    font-size: 13px;
    line-height: 1.6;
  }

  .footer-bottom {
    border-top: 1px solid rgba(255,255,255,.08);
    padding-top: 20px;
    display: flex;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  .footer-copy {
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: rgba(255,255,255,.34);
    font-size: 11px;
  }

  .footer-tagline {
    font-family: 'Anton', sans-serif;
    color: var(--primary);
    letter-spacing: 2px;
    font-size: 12px;
  }

  @media (max-width: 768px) {
    .join-hero {
      min-height: auto;
      padding: 90px 5vw 48px;
    }

    .form-row-2col { grid-template-columns: 1fr; }

    .form { padding: 8px; }

    .form-wrap-section { padding: 8px; }

    .cta-inner {
      flex-direction: column;
      align-items: stretch;
      gap: 24px;
      text-align: center;
    }

    .btn-white, .btn-primary, .btn-outline { width: 100%; }

    .form-nav { flex-direction: column; }
    .form-nav button { width: 100%; }
    .form-nav span { display: none; }

    .form-progress { gap: 8px; padding: 12px 14px; }
    .form-progress__label { font-size: 0.78rem; }
    .form-progress__num { width: 26px; height: 26px; font-size: 0.75rem; }

    .success-card { padding: 32px 20px; }

    .form-wrap-inner { width: 100%; }
  }
</style>
