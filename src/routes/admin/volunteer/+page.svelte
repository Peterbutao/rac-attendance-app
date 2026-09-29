<script lang="ts">
  import { enhance } from '$app/forms';

  export let data;
  export let form;

  let showAddForm = false;
  let editingId: number | null = null;
  let editActivity = '';
  let editHours = 0;
  let editDate = '';

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-MW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function startEdit(record: any) {
    editingId = record.id;
    editActivity = record.activity_name;
    editHours = record.hours;
    editDate = record.activity_date;
  }

  function cancelEdit() {
    editingId = null;
  }
</script>

<svelte:head>
  <title>Manage Volunteer Hours — RAC Admin</title>
</svelte:head>

<div class="portal-page">
  <div class="container" style="padding-top:var(--space-10);padding-bottom:var(--space-16)">

    <div class="portal-page-header">
      <div>
        <h2>Manage Volunteer Hours</h2>
        <p>Track member volunteer contributions.</p>
      </div>
      <button class="btn btn--primary" on:click={() => showAddForm = !showAddForm}>
        {showAddForm ? 'Cancel' : '+ Add Hours'}
      </button>
    </div>

    {#if form?.error}
      <div class="alert alert--error" style="margin-bottom:var(--space-5)">{form.error}</div>
    {/if}
    {#if form?.success}
      <div class="alert alert--success" style="margin-bottom:var(--space-5)">✓ Volunteer hours updated successfully.</div>
    {/if}

    <!-- Add Hours Form -->
    {#if showAddForm}
      <div class="card" style="margin-bottom:var(--space-8)">
        <h4 style="margin-bottom:var(--space-6)">Add Volunteer Hours</h4>
        <form
          method="POST"
          action="?/addHours"
          use:enhance={() => {
            showAddForm = false;
            return async ({ update }) => await update();
          }}
        >
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--space-4)">
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
              <label class="form-label" for="activity_name">Activity Name</label>
              <input id="activity_name" name="activity_name" type="text" class="form-input" placeholder="e.g. Community Cleanup" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="hours">Hours</label>
              <input id="hours" name="hours" type="number" class="form-input" min="0.5" step="0.5" value="1" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="activity_date">Date</label>
              <input id="activity_date" name="activity_date" type="date" class="form-input" required />
            </div>
          </div>
          <div style="margin-top:var(--space-4)">
            <button type="submit" class="btn btn--primary">Save Hours</button>
          </div>
        </form>
      </div>
    {/if}

    <!-- Hours Table -->
    {#if data.volunteerHours.length === 0}
      <div class="empty-state"><p>No volunteer hours recorded.</p></div>
    {:else}
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>RAC #</th>
              <th>Activity</th>
              <th>Hours</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each data.volunteerHours as record (record.id)}
              <tr>
                <td>{record.member?.full_name ?? 'Unknown'}</td>
                <td><span class="rac-number">{record.member?.rac_number ?? '—'}</span></td>
                {#if editingId === record.id}
                  <td colspan="3">
                    <div style="display:flex;gap:var(--space-2)">
                      <input type="text" bind:value={editActivity} class="form-input" placeholder="Activity name" />
                      <input type="number" bind:value={editHours} class="form-input" style="width:80px" min="0.5" step="0.5" />
                      <input type="date" bind:value={editDate} class="form-input" />
                    </div>
                  </td>
                {:else}
                  <td>{record.activity_name}</td>
                  <td>{record.hours}h</td>
                  <td>{formatDate(record.activity_date)}</td>
                {/if}
                <td>
                  {#if editingId === record.id}
                    <form method="POST" action="?/updateHours" style="display:inline">
                      <input type="hidden" name="id" value={record.id} />
                      <input type="hidden" name="activity_name" value={editActivity} />
                      <input type="hidden" name="hours" value={editHours} />
                      <input type="hidden" name="activity_date" value={editDate} />
                      <button type="submit" class="btn btn--primary btn--sm">Save</button>
                    </form>
                    <button class="btn btn--ghost btn--sm" on:click={cancelEdit}>Cancel</button>
                  {:else}
                    <button class="btn btn--ghost btn--sm" on:click={() => startEdit(record)}>Edit</button>
                    <form method="POST" action="?/deleteHours" style="display:inline">
                      <input type="hidden" name="id" value={record.id} />
                      <button type="submit" class="btn btn--danger btn--sm" on:click={() => confirm('Delete this record?')}>Delete</button>
                    </form>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
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
  .btn--primary { background: var(--near-black); color: var(--gold-light); }
  .btn--primary:hover { background: var(--black); }
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
</style>