<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';

  export let data;
  export let form;

  let showAddForm = false;
  let editingId: number | null = null;
  let editRequired = 0;
  let editPaid = 0;

  function money(value: number | null | undefined) {
    return `MWK ${Number(value ?? 0).toLocaleString('en-MW', { maximumFractionDigits: 0 })}`;
  }

  function startEdit(due: any) {
    editingId = due.id;
    editRequired = due.dues_required;
    editPaid = due.dues_paid;
  }

  function cancelEdit() {
    editingId = null;
  }

  function goToPage(page: number) {
    goto(`?page=${page}`);
  }
</script>

<svelte:head>
  <title>Manage Dues — RAC Admin</title>
</svelte:head>

<div class="portal-page">
  <div class="container" style="padding-top:var(--space-10);padding-bottom:var(--space-16)">

    <div class="portal-page-header">
      <div>
        <h2>Manage Member Dues</h2>
        <p>Add and update member dues payments. Showing {data.dues.length} of {data.totalCount} records.</p>
      </div>
      <button class="btn btn--primary" on:click={() => showAddForm = !showAddForm}>
        {showAddForm ? 'Cancel' : '+ Add Dues'}
      </button>
    </div>

    {#if form?.error}
      <div class="alert alert--error" style="margin-bottom:var(--space-5)">{form.error}</div>
    {/if}
    {#if form?.success}
      <div class="alert alert--success" style="margin-bottom:var(--space-5)">✓ Dues updated successfully.</div>
    {/if}

    <!-- Add Dues Form -->
    {#if showAddForm}
      <div class="card" style="margin-bottom:var(--space-8)">
        <h4 style="margin-bottom:var(--space-6)">Add Member Dues</h4>
        <form
          method="POST"
          action="?/addDues"
          use:enhance={() => {
            showAddForm = false;
            return async ({ update }) => await update();
          }}
        >
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-4)">
            <div class="form-group">
              <label class="form-label" for="member_id">Member</label>
              <select id="member_id" name="member_id" class="form-select" required>
                <option value="">Select member...</option>
                {#each data.members as member}
                  <option value={member.id}>{member.full_name} ({member.rac_number})</option>
                {/each}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="period">Period</label>
              <input id="period" name="period" type="text" class="form-input" placeholder="e.g. 2024-Q1" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="dues_required">Dues Required (MWK)</label>
              <input id="dues_required" name="dues_required" type="number" class="form-input" min="0" step="100" value="0" />
            </div>
            <div class="form-group">
              <label class="form-label" for="dues_paid">Dues Paid (MWK)</label>
              <input id="dues_paid" name="dues_paid" type="number" class="form-input" min="0" step="100" value="0" />
            </div>
          </div>
          <div style="margin-top:var(--space-4)">
            <button type="submit" class="btn btn--primary">Save Dues</button>
          </div>
        </form>
      </div>
    {/if}

    <!-- Dues Table -->
    {#if data.dues.length === 0}
      <div class="empty-state"><p>No dues records found.</p></div>
    {:else}
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>RAC #</th>
              <th>Period</th>
              <th>Required</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each data.dues as due (due.id)}
              <tr>
                <td>{due.member?.full_name ?? 'Unknown'}</td>
                <td><span class="rac-number">{due.member?.rac_number ?? '—'}</span></td>
                <td>{due.period}</td>
                {#if editingId === due.id}
                  <td colspan="3">
                    <div style="display:flex;gap:var(--space-2);align-items:center">
                      <input type="number" bind:value={editRequired} class="form-input" style="width:100px" min="0" step="100" />
                      <span>/</span>
                      <input type="number" bind:value={editPaid} class="form-input" style="width:100px" min="0" step="100" />
                    </div>
                  </td>
                {:else}
                  <td>{money(due.dues_required)}</td>
                  <td>{money(due.dues_paid)}</td>
                  <td>{money(due.dues_required - due.dues_paid)}</td>
                {/if}
                <td>
                  {#if editingId === due.id}
                    <form method="POST" action="?/updateDues" style="display:inline">
                      <input type="hidden" name="id" value={due.id} />
                      <input type="hidden" name="dues_required" value={editRequired} />
                      <input type="hidden" name="dues_paid" value={editPaid} />
                      <button type="submit" class="btn btn--primary btn--sm">Save</button>
                    </form>
                    <button class="btn btn--ghost btn--sm" on:click={cancelEdit}>Cancel</button>
                  {:else}
                    <button class="btn btn--ghost btn--sm" on:click={() => startEdit(due)}>Edit</button>
                    <form method="POST" action="?/deleteDues" style="display:inline">
                      <input type="hidden" name="id" value={due.id} />
                      <button type="submit" class="btn btn--danger btn--sm" on:click={() => confirm('Delete this dues record?')}>Delete</button>
                    </form>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      {#if data.totalPages > 1}
        <div class="pagination">
          <button 
            class="btn btn--outline btn--sm" 
            disabled={data.currentPage <= 1}
            on:click={() => goToPage(data.currentPage - 1)}
          >
            ← Previous
          </button>
          
          <span class="pagination-info">
            Page {data.currentPage} of {data.totalPages}
          </span>
          
          <button 
            class="btn btn--outline btn--sm" 
            disabled={data.currentPage >= data.totalPages}
            on:click={() => goToPage(data.currentPage + 1)}
          >
            Next →
          </button>
        </div>
      {/if}
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
  .portal-page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--space-8);
  }
  .portal-page-header h2 { color: var(--near-black); }
  .portal-page-header p { color: var(--text-muted); margin-top: var(--space-1); }

  .card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
  }

  .table-wrap {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    overflow-x: auto;
  }
  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }
  .data-table th {
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
  .data-table td {
    padding: var(--space-4);
    border-bottom: 1px solid var(--border);
    color: var(--text);
    vertical-align: middle;
  }
  .data-table tr:last-child td { border-bottom: none; }
  .data-table tbody tr:hover { background: var(--cream); }

  .empty-state { text-align: center; padding: var(--space-16) 0; color: var(--text-muted); }

  .form-group { display: flex; flex-direction: column; gap: var(--space-1); }
  .form-label { font-size: 0.8125rem; font-weight: 500; color: var(--text-light); }
  .form-input, .form-select {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 0.875rem;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-sm);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all var(--duration);
  }
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .btn--primary { background: var(--near-black); color: var(--gold-light); }
  .btn--primary:hover:not(:disabled) { background: var(--black); }
  .btn--outline { background: transparent; color: var(--text); border-color: var(--border); }
  .btn--outline:hover:not(:disabled) { background: var(--cream); }
  .btn--ghost { background: transparent; color: var(--text); border-color: var(--border); }
  .btn--ghost:hover { background: var(--cream); }
  .btn--danger { background: transparent; color: #dc3545; border-color: #dc3545; }
  .btn--danger:hover { background: #dc3545; color: white; }
  .btn--sm { padding: var(--space-1) var(--space-2); font-size: 0.75rem; }

  .alert {
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-sm);
    font-size: 0.875rem;
  }
  .alert--success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
  .alert--error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

  .rac-number { font-family: var(--font-mono); font-size: 0.8125rem; }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--space-4);
    margin-top: var(--space-8);
    padding: var(--space-4);
  }

  .pagination-info {
    font-size: 0.875rem;
    color: var(--text-muted);
  }
</style>