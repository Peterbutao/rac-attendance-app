<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import type { Member } from '$lib/types';

  export let data: any;
  export let form: any;

  let editMember: Member | null = null;
  let editStatus = '';
  let editNotes = '';
  let saving = false;
  let search = '';

  function openEdit(m: Member) {
    editMember = m;
    editStatus = m.status;
    editNotes = m.notes ?? '';
  }
  function closeEdit() { editMember = null; }

  $: filtered = data.members.filter((m: Member) =>
    !search ||
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    m.rac_number.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );
</script>

<svelte:head>
  <title>Manage Members — RAC Admin</title>
</svelte:head>

<div class="portal-page">
  <div class="container" style="padding-top:var(--space-10);padding-bottom:var(--space-16)">

    <div class="portal-page-header">
      <div>
        <h2>Manage Members</h2>
        <p>View and update member statuses.</p>
      </div>
    </div>

    <div class="toolbar">
      <div class="status-tabs">
        {#each [['active', 'Active'], ['inactive', 'Inactive'], ['suspended', 'Suspended']] as [s, label]}
          <button
            class="status-tab"
            class:active={data.statusFilter === s}
            on:click={() => goto(`?status=${s}`)}
          >
            {label}
            <span class="status-tab__count">{data.counts[s]}</span>
          </button>
        {/each}
      </div>
      <input
        type="search"
        class="form-input"
        placeholder="Search members…"
        bind:value={search}
        style="max-width:260px"
      />
    </div>

    {#if form?.error}
      <div class="alert alert--error" style="margin-bottom:var(--space-5)">{form.error}</div>
    {/if}
    {#if form?.success}
      <div class="alert alert--success" style="margin-bottom:var(--space-5)">✓ Member updated.</div>
    {/if}

    {#if filtered.length === 0}
      <div class="empty-state"><p>No members found.</p></div>
    {:else}
      <div class="members-table-wrap">
        <table class="members-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>RAC #</th>
              <th>Email</th>
              <th>Occupation</th>
              <th>Since</th>
              <th>Status</th>
              <th>Role</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each filtered as m (m.id)}
              <tr>
                <td class="td-name">{m.full_name}</td>
                <td><span class="rac-number">{m.rac_number}</span></td>
                <td class="td-email">{m.gmail}</td>
                <td>{m.occupation ?? '—'}</td>
                <td style="font-family:var(--font-mono);font-size:0.8125rem">{m.joined_year ?? '—'}</td>
                <td><span class="badge badge--{m.status}">{m.status}</span></td>
                <td>
                  {#if m.is_admin}
                    <span class="badge badge--admin">Admin</span>
                  {:else}
                    Member
                  {/if}
                </td>
                <td>
                  <button class="btn btn--ghost btn--sm" on:click={() => openEdit(m)}>Edit</button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<!-- Edit modal -->
{#if editMember}
  <div class="modal-backdrop" on:click={closeEdit} role="presentation">
    <div
      class="modal"
      on:click|stopPropagation
      on:keydown|stopPropagation
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <div class="modal__header">
        <h4>Edit Member</h4>
        <button class="modal__close" on:click={closeEdit}>×</button>
      </div>
      <div class="modal__body">
        <p style="margin-bottom:var(--space-6)">
          <strong>{editMember.full_name}</strong>
          — <span class="rac-number">{editMember.rac_number}</span>
        </p>
        <form
          method="POST"
          action="?/updateMember"
          use:enhance={() => {
            saving = true;
            return async ({ update }) => {
              saving = false;
              closeEdit();
              await update();
            };
          }}
        >
          <input type="hidden" name="id" value={editMember.id} />
          <div class="form-group" style="margin-bottom:var(--space-5)">
            <label class="form-label" for="status">Status</label>
            <select id="status" name="status" class="form-select" bind:value={editStatus}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom:var(--space-6)">
            <label class="form-label" for="notes">Admin Notes</label>
            <textarea
              id="notes"
              name="notes"
              class="form-textarea"
              bind:value={editNotes}
              rows="3"
              placeholder="Internal notes (not visible to member)…"
            ></textarea>
          </div>
          <div class="modal__actions">
            <button type="button" class="btn btn--ghost" on:click={closeEdit}>Cancel</button>
            <button type="submit" class="btn btn--primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
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

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-8);
  gap: var(--space-4);
  flex-wrap: wrap;
}
.status-tabs {
  display: flex;
  gap: var(--space-2);
  border-bottom: 1px solid var(--border);
  padding-bottom: 0;
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
  background: var(--cream-mid);
  border-radius: var(--radius-full);
  padding: 1px 7px;
  font-size: 0.75rem;
  font-family: var(--font-mono);
}
.status-tab.active .status-tab__count { background: var(--near-black); color: var(--gold-light); }

.members-table-wrap {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  overflow-x: auto;
}
.members-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.members-table th {
  background: var(--cream);
  padding: var(--space-3) var(--space-4);
  text-align: left;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-light);
  font-weight: 600;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}
.members-table td {
  padding: var(--space-4);
  border-bottom: 1px solid var(--border);
  color: var(--text);
  vertical-align: middle;
}
.members-table tr:last-child td { border-bottom: none; }
.members-table tbody tr:hover { background: var(--cream); }
.td-name { font-weight: 500; white-space: nowrap; }
.td-email { font-family: var(--font-mono); font-size: 0.8125rem; color: var(--text-muted); }

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
  max-width: 440px;
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
  padding: 0 var(--space-1);
}
.modal__body { padding: var(--space-6); }
.modal__actions { display: flex; justify-content: flex-end; gap: var(--space-3); }
</style>
