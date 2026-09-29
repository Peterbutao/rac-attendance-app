<script lang="ts">
  import { enhance } from '$app/forms';
  export let data;
  export let form: any;

  let editing = false;
  let showChangePassword = false;
  let saving = false;
  let savingPassword = false;
  let savingCommittees = false;
  let selectedCommitteeIds: string[] = [];
  let selectedCommitteeMemberId: number | null = null;

  $: m = data.member;
  $: if (m?.id !== selectedCommitteeMemberId) {
    selectedCommitteeMemberId = m?.id ?? null;
    selectedCommitteeIds = (data.memberCommitteeIds ?? []).map((id: number) => String(id));
  }

</script>

<svelte:head>
  <title>My Profile — Rotaract Portal</title>
  <meta name="robots" content="noindex, nofollow" />
  <meta name="description" content="View and manage your Rotaract Club of Lilongwe member profile, dues, committees, and account settings." />
</svelte:head>

<div class="portal-page">
  <div class="container" style="padding-top:var(--space-10);padding-bottom:var(--space-16)">

    <div class="screen-intro">
      <span class="screen-intro__eyebrow">Account</span>
      <h1>My profile</h1>
      <p>Manage your member details, committees, and account security.</p>
    </div>

    {#if form?.success}
      <div class="alert alert--success" style="margin-bottom:var(--space-6)">
        ✓ Changes saved successfully.
      </div>
    {/if}
    {#if form?.error}
      <div class="alert alert--error" style="margin-bottom:var(--space-6)">
        {form.error}
      </div>
    {/if}



    {#if !m}
      <div class="alert alert--warning" style="margin-bottom:var(--space-6)">
        ⚠️ Member profile data is not available. Please contact admin support.
      </div>
      <div class="card" style="padding:var(--space-8);text-align:center;color:var(--text-muted)">
        <p>Your member record could not be loaded. This may be a temporary issue.</p>
        <p style="margin-top:var(--space-3)">Please try refreshing the page or contact the admin team.</p>
      </div>
    {:else}
    <div class="profile-grid">
      <!-- Identity card -->
      <div class="identity-card">
        <div class="identity-card__avatar">
          {m.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
        </div>
        <div class="identity-card__name">{m.full_name}</div>
        <span class="rac-number" style="font-size:1rem">{m.rac_number}</span>
        <div class="identity-card__badges">
          <span class="badge badge--{m.status}">{m.status}</span>
          {#if m.is_admin}<span class="badge badge--admin">Admin</span>{/if}
        </div>
        <div class="identity-card__email">{m.gmail}</div>
        <div class="identity-card__since">
          Member since {m.joined_year ?? new Date(m.created_at).getFullYear()}
        </div>
      </div>

      <div class="card committees-card">
        <div class="section-heading">
          <div>
            <h4>Committees</h4>
            <p>You are a member of {selectedCommitteeIds.length} committee{selectedCommitteeIds.length !== 1 ? 's' : ''}.</p>
          </div>
          {#if selectedCommitteeIds.length > 0}
            {#if !editing}
              <button class="btn btn--outline btn--sm" on:click={() => editing = true} style="flex-shrink:0">
                Manage
              </button>
            {/if}
          {/if}
        </div>

        {#if !editing}
          <!-- Display selected committees -->
          {#if selectedCommitteeIds.length > 0}
            <div class="committees-list">
              {#each data.committees?.filter((c: any) => selectedCommitteeIds.includes(String(c.id))) ?? [] as committee}
                <div class="committee-badge">
                  <strong>{committee.name}</strong>
                  {#if committee.description}
                    <small>{committee.description}</small>
                  {/if}
                </div>
              {/each}
            </div>
          {:else}
            <p class="empty-copy">You haven't selected any committees yet. Select at least 3 to get started.</p>
          {/if}
        {/if}

        {#if editing || selectedCommitteeIds.length === 0}
          <form
            method="POST"
            action="?/updateCommittees"
            use:enhance={() => {
              savingCommittees = true;
              return async ({ update }) => {
                savingCommittees = false;
                editing = false;
                await update();
              };
            }}
          >
            {#if editing || selectedCommitteeIds.length === 0}
              <h4 style="margin-bottom:var(--space-6);margin-top:var(--space-6)">Select Your Committees</h4>
            {/if}
            <div class="committee-grid">
              {#each data.committees ?? [] as committee}
                <label class="committee-choice">
                  <input
                    type="checkbox"
                    name="committee_ids"
                    value={String(committee.id)}
                    bind:group={selectedCommitteeIds}
                  />
                  <span>
                    <strong>{committee.name}</strong>
                    {#if committee.description}
                      <small>{committee.description}</small>
                    {/if}
                  </span>
                </label>
              {/each}
            </div>

            {#if (data.committees?.length ?? 0) === 0}
              <p class="empty-copy">No committees are available yet. Run the member profile database setup first.</p>
            {/if}

            <div class="committee-actions">
              <span class="form-hint">A minimum of 3 committees is required.</span>
              <div style="display:flex;gap:var(--space-3)">
                {#if editing}
                  <button type="button" class="btn btn--ghost" on:click={() => editing = false}>Cancel</button>
                {/if}
                <button
                  type="submit"
                  name="intent"
                  value="save"
                  class="btn btn--primary"
                  disabled={savingCommittees || selectedCommitteeIds.length < 3}
                >
                  {savingCommittees ? 'Saving...' : 'Save Committees'}
                </button>
              </div>
            </div>
          </form>
        {/if}
      </div>

      <!-- Details card -->
      <div class="card details-card">
        {#if editing}
          <form
            method="POST"
            action="?/updateProfile"
            use:enhance={() => {
              saving = true;
              return async ({ update }) => {
                saving = false;
                editing = false;
                await update();
              };
            }}
          >
            <h4 style="margin-bottom:var(--space-6)">Edit Details</h4>
            <div class="form-group" style="margin-bottom:var(--space-5)">
              <label class="form-label" for="phone">Phone</label>
              <input id="phone" name="phone" type="tel" class="form-input" value={m.phone ?? ''} placeholder="+265 999 000 000" />
            </div>
            <div class="form-group" style="margin-bottom:var(--space-5)">
              <label class="form-label" for="occupation">Occupation</label>
              <input id="occupation" name="occupation" type="text" class="form-input" value={m.occupation ?? ''} placeholder="e.g. Software Engineer" />
            </div>
            <div class="form-group" style="margin-bottom:var(--space-6)">
              <label class="form-label" for="skills">Skills</label>
              <textarea id="skills" name="skills" class="form-textarea" rows="3" placeholder="e.g. Web development, design, accounting...">{m.skills ?? ''}</textarea>
            </div>
            <div style="display:flex;gap:var(--space-3)">
              <button type="submit" class="btn btn--primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button type="button" class="btn btn--ghost" on:click={() => editing = false}>Cancel</button>
            </div>
          </form>
        {:else}
          <h4 style="margin-bottom:var(--space-6)">Member Details</h4>
          <div class="detail-row">
            <span class="detail-label">Full Name</span>
            <span class="detail-value">{m.full_name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">RAC Number</span>
            <span class="rac-number">{m.rac_number}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Gmail</span>
            <span class="detail-value">{m.gmail || '—'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Phone</span>
            <span class="detail-value">{m.phone ?? '—'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Occupation</span>
            <span class="detail-value">{m.occupation ?? '—'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Skills</span>
            <span class="detail-value">{m.skills ?? '—'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="badge badge--{m.status}">{m.status}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Member since</span>
            <span class="detail-value">{m.joined_year ?? new Date(m.created_at).getFullYear()}</span>
          </div>
        {/if}
        {#if !editing}
          <button class="btn btn--outline" on:click={() => editing = true} style="margin-top:var(--space-4)">Edit Profile</button>
          <button class="btn btn--outline" on:click={() => showChangePassword = true} style="margin-top:var(--space-3)">
            Change Password
          </button>
        {/if}
      </div>

      <!-- Change Password Card -->
      {#if showChangePassword}
        <div class="card details-card">
          <form
            method="POST"
            action="?/changePassword"
            use:enhance={() => {
              savingPassword = true;
              return async ({ update }) => {
                savingPassword = false;
                showChangePassword = false;
                await update();
              };
            }}
          >
            <h4 style="margin-bottom:var(--space-6)">Change Password</h4>

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

            <div class="form-group" style="margin-bottom:var(--space-5)">
              <label class="form-label" for="current_password">Current Password</label>
              <input id="current_password" name="current_password" type="password" class="form-input" placeholder="Enter current password" required disabled={savingPassword} />
            </div>
            <div class="form-group" style="margin-bottom:var(--space-5)">
              <label class="form-label" for="new_password">New Password</label>
              <input id="new_password" name="new_password" type="password" class="form-input" placeholder="At least 6 characters" required disabled={savingPassword} minlength={6} />
            </div>
            <div class="form-group" style="margin-bottom:var(--space-6)">
              <label class="form-label" for="confirm_password">Confirm New Password</label>
              <input id="confirm_password" name="confirm_password" type="password" class="form-input" placeholder="Re-enter new password" required disabled={savingPassword} />
            </div>
            <div style="display:flex;gap:var(--space-3)">
              <button type="submit" class="btn btn--primary" disabled={savingPassword}>
                {savingPassword ? 'Updating…' : 'Update Password'}
              </button>
              <button type="button" class="btn btn--ghost" on:click={() => showChangePassword = false}>Cancel</button>
            </div>
          </form>
        </div>
      {/if}
    </div>

    <div class="profile-signout">
      <form method="POST" action="/logout">
        <button class="btn btn--outline profile-signout__button" type="submit">Sign out</button>
      </form>
    </div>
    {/if}
  </div>
</div>

<style>
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}
.profile-signout {
  display: flex;
  justify-content: center;
  margin-top: var(--space-8);
  padding-top: var(--space-6);
  border-top: 1px solid var(--border);
}

.profile-signout__button {
  color: var(--primary);
  border-color: rgba(232, 23, 93, 0.35);
}

.profile-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--space-6);
  align-items: start;
}

.identity-card {
  background: var(--near-black);
  border-radius: var(--radius-xl);
  padding: var(--space-8) var(--space-6);
  text-align: center;
  position: sticky;
  top: calc(64px + var(--space-6));
}
.identity-card__avatar {
  width: 80px; height: 80px;
  background: rgba(232,23,93,0.18);
  border: 2px solid rgba(232,23,93,0.42);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--gold-light);
  margin: 0 auto var(--space-4);
  letter-spacing: 0.05em;
}
.identity-card__name {
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--white);
  margin-bottom: var(--space-3);
}
.identity-card__badges {
  display: flex;
  gap: var(--space-2);
  justify-content: center;
  margin: var(--space-3) 0;
}
.identity-card__email {
  font-size: 0.8125rem;
  color: rgba(255,255,255,0.4);
  font-family: var(--font-mono);
  margin-top: var(--space-4);
  word-break: break-all;
}
.identity-card__since {
  font-size: 0.8125rem;
  color: rgba(255,255,255,0.3);
  margin-top: var(--space-2);
}

.details-card,
.committees-card {
  border-radius: var(--radius-xl);
  grid-column: 2;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.section-heading p {
  margin-top: var(--space-1);
  font-size: 0.9rem;
}

.committee-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.committee-choice {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-3);
  align-items: start;
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--cream);
  cursor: pointer;
}

.committee-choice:has(input:checked) {
  border-color: var(--gold);
  background: var(--gold-pale);
}

.committee-choice input {
  margin-top: 4px;
}

.committee-choice strong {
  display: block;
  color: var(--near-black);
  line-height: 1.35;
}

.committee-choice small {
  display: block;
  margin-top: var(--space-1);
  color: var(--text-muted);
  line-height: 1.45;
}

.committee-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
  margin-top: var(--space-6);
}

.empty-copy {
  margin-top: var(--space-4);
  font-size: 0.9rem;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-4) 0;
  border-bottom: 1px solid var(--border);
}
.detail-row:last-child { border-bottom: none; }
.detail-label {
  flex-shrink: 0;
  width: 130px;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-light);
}
.detail-value { color: var(--text); font-size: 0.9375rem; }

.committees-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.committee-badge {
  padding: var(--space-4);
  border: 2px solid var(--gold);
  border-radius: var(--radius-md);
  background: var(--gold-pale);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.committee-badge strong {
  color: var(--near-black);
  display: block;
}

.committee-badge small {
  color: var(--text-muted);
  font-size: 0.8125rem;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .container {
    padding: 0 var(--space-4);
    overflow-x: hidden;
  }
  .portal-page {
    overflow-x: hidden;
  }
  .profile-grid { grid-template-columns: 1fr; }
  .identity-card { 
    position: static;
    padding: var(--space-6) var(--space-4);
  }
  .identity-card__avatar {
    width: 64px; height: 64px;
    font-size: 1.4rem;
  }
  .identity-card__name {
    font-size: 1.1rem;
  }
  .details-card,
  .committees-card {
    grid-column: auto;
  }
  .section-heading,
  .committee-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .committee-grid,
  .committees-list {
    grid-template-columns: 1fr;
  }
  .detail-row {
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-3) 0;
  }
  .detail-label {
    width: auto;
  }
  .committee-choice {
    padding: var(--space-3);
  }
  .committee-badge {
    padding: var(--space-3);
  }

}

  .screen-intro { margin-bottom: 22px; }
  .screen-intro__eyebrow { color: var(--primary); font-size: .66rem; font-weight: 850; letter-spacing: .13em; text-transform: uppercase; }
  .screen-intro h1 { margin: 7px 0 6px; color: #101828; font-size: clamp(1.45rem, 3vw, 2rem); letter-spacing: -.045em; }
  .screen-intro p { color: #667085; font-size: .84rem; }
  .identity-card { top: 104px; border-radius: 18px; background: #101828; box-shadow: var(--shadow-md); }
  .identity-card__avatar { border: 0; background: rgba(216,63,106,.22); color: #ff86a8; }
  .card { border-color: #e5eaf1; border-radius: 16px; box-shadow: var(--shadow-sm); }
  .committees-card, .details-card { padding: 22px; }
  .section-heading h4, .details-card h4 { color: #101828; }
  .section-heading p, .empty-copy { color: #667085; }
  .detail-row { border-bottom-color: #edf0f4; }
  .profile-signout { justify-content: flex-start; margin-top: 24px; padding-top: 20px; border-top-color: #e5eaf1; }
</style>
