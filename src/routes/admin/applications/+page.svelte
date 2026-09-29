<script lang="ts">
  import { deserialize, enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { ActionData, PageData } from './$types';
  import type { JoinApplication } from '$lib/types';

  export let data: PageData;
  export let form: ActionData;

  let activeApp: JoinApplication | null = null;
  let actionType: 'approve' | 'reject' | 'review' | null = null;
  let racNumberInput = '';
  let assignedRacNumbers: string[] = [];
  let showAssignedRacNumbers = false;
  let loadingRacNumber = false;
  let passwordInput = '';
  let showPassword = false;
  let rejectionReason = '';
  let submitting = false;

  async function openModal(app: JoinApplication, action: typeof actionType) {
    activeApp = app;
    actionType = action;
    racNumberInput = '';
    assignedRacNumbers = [];
    showAssignedRacNumbers = false;
    loadingRacNumber = false;
    passwordInput = '';
    showPassword = false;
    rejectionReason = '';

    // Auto-fetch next RAC number when opening approve modal
    if (action === 'approve') {
      loadingRacNumber = true;
      try {
        const formData = new FormData();
        const res = await fetch('?/getNextRacNumber', {
          method: 'POST',
          body: formData
        });

        const result = deserialize(await res.text());

        if (result.data?.nextRacNumber) {
          racNumberInput = result.data.nextRacNumber;
          assignedRacNumbers = result.data.assignedRacNumbers ?? [];
          console.log('✅ Auto-generated RAC number:', racNumberInput);
        }
      } catch (err) {
        console.error('Error fetching next RAC number:', err);
      } finally {
        loadingRacNumber = false;
      }
    }
  }
  function closeModal() { activeApp = null; actionType = null; }

  function setStatus(s: string) {
    goto(`?status=${s}`);
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    under_review: 'Under Review',
    approved: 'Approved',
    rejected: 'Rejected'
  };
</script>

<svelte:head>
  <title>Applications — RAC Admin</title>
</svelte:head>

<div class="portal-page">
  <div class="container" style="padding-top:var(--space-10);padding-bottom:var(--space-16)">

    <div class="portal-page-header">
      <div>
        <h2>Membership Applications</h2>
        <p>Review and process all incoming applications.</p>
      </div>
    </div>
    <!-- Status tabs -->
    <div class="status-tabs">
      {#each ['pending', 'under_review', 'approved', 'rejected'] as s}
        <button
          class="status-tab"
          class:active={data.status === s}
          on:click={() => setStatus(s)}
        >
          {statusLabels[s]}
          <span class="status-tab__count">{data.statusCounts[s as keyof typeof data.statusCounts]}</span>
        </button>
      {/each}
    </div>

    {#if form?.error}
      <div class="alert alert--error" style="margin-bottom:var(--space-5)">{form.error}</div>
    {/if}
    {#if form?.success}
      <div class="alert alert--success" style="margin-bottom:var(--space-5)">✓ Application updated successfully.</div>
    {/if}

    {#if data.applications.length === 0}
      <div class="empty-state">
        <p>No {statusLabels[data.status].toLowerCase()} applications.</p>
      </div>
    {:else}
      <div class="applications-list">
        {#each data.applications as app (app.id)}
          <div class="app-card">
            <div class="app-card__header">
              <div>
                <div class="app-card__name">{app.full_name}</div>
                <div class="app-card__meta">
                  {app.age} yrs · {app.occupation} ·
                  <span style="font-family:var(--font-mono);font-size:0.8125rem">{app.email}</span>
                </div>
              </div>
              <div class="app-card__header-right">
                <span class="badge badge--{app.status}">{statusLabels[app.status] ?? app.status}</span>
                <span class="app-card__date">
                  {new Date(app.submitted_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                </span>
              </div>
            </div>

            <div class="app-card__body">
              <div class="app-card__section">
                <div class="app-card__section-label">Motivation</div>
                <p class="app-card__text">{app.motivation}</p>
              </div>
              {#if app.skills}
                <div class="app-card__section">
                  <div class="app-card__section-label">Skills</div>
                  <p class="app-card__text">{app.skills}</p>
                </div>
              {/if}
              {#if app.rejection_reason}
                <div class="app-card__section">
                  <div class="app-card__section-label" style="color:var(--error)">Rejection Reason</div>
                  <p class="app-card__text">{app.rejection_reason}</p>
                </div>
              {/if}
              {#if app.rac_number}
                <div class="app-card__section">
                  <div class="app-card__section-label">RAC Number Assigned</div>
                  <span class="rac-number">{app.rac_number}</span>
                </div>
              {/if}
            </div>

            {#if data.status === 'pending'}
              <div class="app-card__actions">
                <button class="btn btn--ghost btn--sm" on:click={() => openModal(app, 'review')}>
                  Mark Under Review
                </button>
                <button class="btn btn--outline btn--sm" style="border-color:var(--error);color:var(--error)" on:click={() => openModal(app, 'reject')}>
                  Reject
                </button>
                <button class="btn btn--gold btn--sm" on:click={() => openModal(app, 'approve')}>
                  Approve & Assign RAC #
                </button>
              </div>
            {:else if data.status === 'under_review'}
              <div class="app-card__actions">
                <button class="btn btn--outline btn--sm" style="border-color:var(--error);color:var(--error)" on:click={() => openModal(app, 'reject')}>
                  Reject
                </button>
                <button class="btn btn--gold btn--sm" on:click={() => openModal(app, 'approve')}>
                  Approve & Assign RAC #
                </button>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- ─── Modal ─── -->
{#if activeApp && actionType}
  <div class="modal-backdrop" on:click={closeModal} role="presentation">
    <div
      class="modal"
      on:click|stopPropagation
      on:keydown|stopPropagation
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <div class="modal__header">
        <h4>
          {actionType === 'approve' ? '✓ Approve Application' :
           actionType === 'reject'  ? '✕ Reject Application' :
           '⟳ Mark Under Review'}
        </h4>
        <button class="modal__close" on:click={closeModal}>×</button>
      </div>

      <div class="modal__body">
        <p style="color:var(--text-muted);margin-bottom:var(--space-6)">
          Applicant: <strong>{activeApp.full_name}</strong>
        </p>

        <form
          method="POST"
          action="?/updateStatus"
          autocomplete="off"
          use:enhance={() => {
            submitting = true;
            return async ({ update }) => {
              submitting = false;
              closeModal();
              await update();
            };
          }}
        >
          <input type="hidden" name="id" value={activeApp.id} />
          <input type="hidden" name="status"
            value={actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'under_review'}
          />

          {#if actionType === 'approve'}
            <div class="form-group" style="margin-bottom:var(--space-6)">
              <label class="form-label" for="rac_number">Assign RAC Number *</label>
              <input
                id="rac_number"
                name="rac_number"
                type="text"
                class="form-input"
                bind:value={racNumberInput}
                placeholder={loadingRacNumber ? 'Generating RAC number...' : 'Auto-generated: e.g. rac026001'}
                pattern={'rac026\\d{3,}'}
                autocomplete="off"
                disabled={loadingRacNumber}
                required
              />
              {#if assignedRacNumbers.length > 0}
                <div class="assigned-rac-panel">
                  <button
                    type="button"
                    class="assigned-rac-toggle"
                    aria-expanded={showAssignedRacNumbers}
                    aria-controls="assigned-rac-list"
                    on:click={() => (showAssignedRacNumbers = !showAssignedRacNumbers)}
                  >
                    <span>Assigned RAC numbers ({assignedRacNumbers.length})</span>
                    <span aria-hidden="true">{showAssignedRacNumbers ? 'Hide' : 'Show'}</span>
                  </button>

                  {#if showAssignedRacNumbers}
                    <div id="assigned-rac-list" class="assigned-rac-list" aria-label="Assigned RAC numbers">
                      {#each assignedRacNumbers as assignedRacNumber}
                        <code>{assignedRacNumber}</code>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/if}
              <span class="form-hint">Format: rac026XXX (lowercase) · Editable if needed</span>
            </div>

            <div class="form-group" style="margin-bottom:var(--space-6)">
              <label class="form-label" for="password">Set Initial Password *</label>
              <div style="position:relative;display:flex;align-items:center">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  class="form-input"
                  bind:value={passwordInput}
                  placeholder="Minimum 8 characters"
                  minlength="8"
                  autocomplete="new-password"
                  required
                />
                <button
                  type="button"
                  class="btn btn--ghost btn--sm"
                  on:click={() => (showPassword = !showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  style="position:absolute;right:var(--space-2);padding:var(--space-1)"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <span class="form-hint">The member will use this to log in initially. They can change it later.</span>
            </div>
          {/if}

          {#if actionType === 'reject'}
            <div class="form-group" style="margin-bottom:var(--space-6)">
              <label class="form-label" for="rejection_reason">Reason for Rejection (optional)</label>
              <textarea
                id="rejection_reason"
                name="rejection_reason"
                class="form-textarea"
                bind:value={rejectionReason}
                rows="3"
                placeholder="Provide a brief reason to include in the rejection notification…"
              ></textarea>
            </div>
          {/if}

          <div class="modal__actions">
            <button type="button" class="btn btn--ghost" on:click={closeModal}>Cancel</button>
            <button
              type="submit"
              class="btn {actionType === 'approve' ? 'btn--gold' : actionType === 'reject' ? 'btn--primary' : 'btn--outline'}"
              disabled={submitting || loadingRacNumber || (actionType === 'approve' && !racNumberInput)}
            >
              {submitting ? 'Saving…' :
               actionType === 'approve' ? 'Approve & Create Member' :
               actionType === 'reject'  ? 'Confirm Rejection' :
               'Mark as Under Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<style>
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}
.portal-page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-8);
}
.portal-page-header h2 { color: var(--near-black); }
.portal-page-header p { color: var(--text-muted); margin-top: var(--space-1); }

.status-tabs {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-8);
  border-bottom: 1px solid var(--border);
  padding-bottom: 0;
  flex-wrap: wrap;
}
.status-tab {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  margin-bottom: -1px;
  transition: all var(--duration);
}
.status-tab:hover { color: var(--near-black); }
.status-tab.active { color: var(--near-black); border-bottom-color: var(--gold); }
.status-tab__count {
  background: var(--cream);
  border-radius: var(--radius-full);
  padding: 1px 7px;
  font-size: 0.75rem;
  font-family: var(--font-mono);
}
.status-tab.active .status-tab__count { background: var(--near-black); color: var(--gold-light); }

.applications-list { display: flex; flex-direction: column; gap: var(--space-4); }

.app-card {
  background: #f9ebed;
  border: var(--primary) solid 1px;
  /* border: 1px solid var(--border); */
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: box-shadow var(--duration);
}
.app-card:hover { box-shadow: var(--shadow-md); }
.app-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--border);
  gap: var(--space-4);
  flex-wrap: wrap;
}
.app-card__name { font-weight: 600; color: var(--near-black); font-size: 1rem; margin-bottom: 2px; }
.app-card__meta { font-size: 0.875rem; color: var(--text-muted); }
.app-card__header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-2);
  flex-shrink: 0;
}
.app-card__date { font-size: 0.8125rem; color: var(--text-light); font-family: var(--font-mono); }

.app-card__body { padding: var(--space-5) var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); }
.app-card__section-label {
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-light);
  font-weight: 600;
  margin-bottom: var(--space-2);
}
.app-card__text { font-size: 0.9375rem; color: var(--text); line-height: 1.65; }
.app-card__actions {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
}

.empty-state { text-align: center; padding: var(--space-16) 0; color: var(--text-muted); }

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(26,26,26,0.64);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  backdrop-filter: blur(4px);
}
.modal {
  background: var(--white);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 480px;
  box-shadow: var(--shadow-lg);
  animation: modalIn 0.2s var(--ease-out) both;
}
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(-10px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--border);
}
.modal__close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-muted);
  cursor: pointer;
  line-height: 1;
  padding: 0 var(--space-1);
}
.modal__body { padding: var(--space-6); }
.modal__actions { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-4); }

.assigned-rac-panel {
  margin-top: var(--space-3);
}
.assigned-rac-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--cream);
  color: var(--near-black);
  cursor: pointer;
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  text-align: left;
}
.assigned-rac-toggle:hover {
  border-color: var(--gold);
}
.assigned-rac-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  margin-top: var(--space-2);
  max-height: 7.5rem;
  overflow: auto;
  color: var(--text-muted);
  font-size: 0.8125rem;
}
.assigned-rac-list code {
  padding: 2px 6px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--cream);
  color: var(--near-black);
  font-family: var(--font-mono);
  font-size: 0.75rem;
}
</style>
