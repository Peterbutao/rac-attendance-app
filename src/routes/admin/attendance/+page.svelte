<script lang="ts">
  import { enhance } from '$app/forms';

  export let data;
  export let form;

  let showAddForm = false;
  let showBulkForm = false;
  let selectedDate = new Date().toISOString().split('T')[0];

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-MW', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
</script>

<svelte:head>
  <title>Manage Attendance — RAC Admin</title>
</svelte:head>

<div class="portal-page">
  <div class="container" style="padding-top:var(--space-10);padding-bottom:var(--space-16)">

    <div class="portal-page-header">
      <div>
        <h2>Attendance approvals</h2>
        <p>Review member attendance submissions before they become official.</p>
      </div>
      <div style="display:flex;gap:var(--space-3)">
        <button class="btn btn--outline" on:click={() => showBulkForm = !showBulkForm}>
          {showBulkForm ? 'Cancel' : '📋 Bulk Entry'}
        </button>
        <button class="btn btn--primary" on:click={() => showAddForm = !showAddForm}>
          {showAddForm ? 'Cancel' : '+ Add Record'}
        </button>
      </div>
    </div>

    {#if form?.error}
      <div class="alert alert--error" style="margin-bottom:var(--space-5)">{form.error}</div>
    {/if}
    {#if form?.success}
      <div class="alert alert--success" style="margin-bottom:var(--space-5)">✓ Attendance updated successfully.</div>
    {/if}

    <section class="pending-section">
      <div class="section-heading">
        <div>
          <h3>Pending attendance submissions</h3>
          <p>Review member submissions before adding them to the official attendance records.</p>
        </div>
        <span class="pending-count">{data.pendingAttendance.length} pending</span>
      </div>

      {#if data.pendingAttendance.length === 0}
        <div class="empty-state pending-empty"><p>No attendance submissions are waiting for approval.</p></div>
      {:else}
        <div class="pending-list">
          {#each data.pendingAttendance as submission (submission.id)}
            <article class="pending-card">
              <div class="pending-details">
                <strong>{submission.member?.full_name ?? 'Unknown member'}</strong>
                <span class="rac-number">{submission.member?.rac_number ?? '—'}</span>
                <h4>{submission.event_name}</h4>
                <span>{submission.event_type} · {submission.event_date ?? 'Date not set'}</span>
                {#if submission.volunteer_hours}
                  <span>{submission.volunteer_hours} volunteer hours</span>
                {/if}
                {#if submission.guest_name}
                  <span>Guest: {submission.guest_name}{submission.guest_email ? ` (${submission.guest_email})` : ''}</span>
                {/if}
              </div>
              <div class="pending-actions">
                <form method="POST" action="?/approvePending">
                  <input type="hidden" name="id" value={submission.id} />
                  <button type="submit" class="btn btn--primary btn--sm">Approve</button>
                </form>
                <form method="POST" action="?/rejectPending" class="reject-form">
                  <input type="hidden" name="id" value={submission.id} />
                  <input name="rejection_reason" class="form-input" placeholder="Reason (optional)" aria-label="Rejection reason" />
                  <button type="submit" class="btn btn--danger btn--sm">Reject</button>
                </form>
              </div>
            </article>
          {/each}
        </div>
      {/if}
    </section>

    <!-- Bulk Attendance Form -->
    {#if showBulkForm}
      <div class="card" style="margin-bottom:var(--space-8)">
        <h4 style="margin-bottom:var(--space-6)">Bulk Attendance Entry</h4>
        <form
          method="POST"
          action="?/bulkAddAttendance"
          use:enhance={() => {
            showBulkForm = false;
            return async ({ update }) => await update();
          }}
        >
          <div class="form-group" style="margin-bottom:var(--space-4)">
            <label class="form-label" for="bulk_date">Meeting Date</label>
            <input id="bulk_date" name="meeting_date" type="date" class="form-input" bind:value={selectedDate} required />
          </div>
          <p style="margin-bottom:var(--space-4);color:var(--text-muted);font-size:0.875rem;">
            Select members who attended:
          </p>
          <div class="member-checklist">
            {#each data.members as member}
              <label class="member-checkbox">
                <input type="checkbox" name="attended_ids" value={member.id} />
                <span>{member.full_name}</span>
                <span class="rac-number">{member.rac_number}</span>
              </label>
            {/each}
          </div>
          <div style="margin-top:var(--space-4)">
            <button type="submit" class="btn btn--primary">Save Attendance</button>
          </div>
        </form>
      </div>
    {/if}

    <!-- Add Single Attendance Form -->
    {#if showAddForm}
      <div class="card" style="margin-bottom:var(--space-8)">
        <h4 style="margin-bottom:var(--space-6)">Add Attendance Record</h4>
        <form
          method="POST"
          action="?/addAttendance"
          use:enhance={() => {
            showAddForm = false;
            return async ({ update }) => await update();
          }}
        >
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-4)">
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
              <label class="form-label" for="meeting_date">Meeting Date</label>
              <input id="meeting_date" name="meeting_date" type="date" class="form-input" required />
            </div>
            <div class="form-group" style="display:flex;align-items:flex-end">
              <label class="checkbox-label">
                <input type="checkbox" name="attended" checked />
                <span>Attended</span>
              </label>
            </div>
          </div>
          <div style="margin-top:var(--space-4)">
            <button type="submit" class="btn btn--primary">Save Record</button>
          </div>
        </form>
      </div>
    {/if}

    <!-- Attendance Table -->
    {#if data.attendance.length === 0}
      <div class="empty-state"><p>No attendance records found.</p></div>
    {:else}
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>RAC #</th>
              <th>Meeting Date</th>
              <th>Attended</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each data.attendance as record (record.id)}
              <tr>
                <td>{record.member?.full_name ?? 'Unknown'}</td>
                <td><span class="rac-number">{record.member?.rac_number ?? '—'}</span></td>
                <td>{formatDate(record.meeting_date)}</td>
                <td>
                  <form method="POST" action="?/updateAttendance" style="display:inline">
                    <input type="hidden" name="id" value={record.id} />
                    <input type="hidden" name="attended" value={record.attended ? '' : 'on'} />
                    <button type="submit" class="status-toggle {record.attended ? 'attended' : 'absent'}">
                      {record.attended ? '✓ Present' : '✗ Absent'}
                    </button>
                  </form>
                </td>
                <td>
                  <form method="POST" action="?/deleteAttendance" style="display:inline">
                    <input type="hidden" name="id" value={record.id} />
                    <button type="submit" class="btn btn--danger btn--sm" on:click={() => confirm('Delete this record?')}>Delete</button>
                  </form>
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

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    cursor: pointer;
    padding: var(--space-2) 0;
  }

  .member-checklist {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: var(--space-2);
    max-height: 300px;
    overflow-y: auto;
    padding: var(--space-3);
    background: var(--cream);
    border-radius: var(--radius-md);
  }

  .member-checkbox {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2);
    background: var(--white);
    border-radius: var(--radius-sm);
    cursor: pointer;
  }

  .member-checkbox:hover {
    background: var(--gold-pale);
  }

  .member-checkbox .rac-number {
    margin-left: auto;
    color: var(--text-muted);
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
  .btn--outline { background: transparent; color: var(--text); border-color: var(--border); }
  .btn--outline:hover { background: var(--cream); }
  .btn--danger { background: transparent; color: #dc3545; border-color: #dc3545; }
  .btn--danger:hover { background: #dc3545; color: white; }
  .btn--sm { padding: var(--space-1) var(--space-2); font-size: 0.75rem; }

  .status-toggle {
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all var(--duration);
  }
  .status-toggle.attended {
    background: #d4edda;
    color: #155724;
  }
  .status-toggle.absent {
    background: #f8d7da;
    color: #721c24;
  }

  .alert {
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-sm);
    font-size: 0.875rem;
  }
  .alert--success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
  .alert--error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

  .rac-number { font-family: var(--font-mono); font-size: 0.8125rem; }
  .pending-section { margin-bottom: var(--space-10); }
  .section-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); margin-bottom: var(--space-4); }
  .section-heading h3 { margin: 0 0 var(--space-1); color: var(--near-black); }
  .section-heading p { margin: 0; color: var(--text-muted); font-size: .875rem; }
  .pending-count { padding: var(--space-1) var(--space-2); border-radius: var(--radius-full); background: var(--gold-pale); color: var(--near-black); font-size: .75rem; font-weight: 700; white-space: nowrap; }
  .pending-list { display: grid; gap: var(--space-3); }
  .pending-card { display: flex; justify-content: space-between; gap: var(--space-5); padding: var(--space-5); border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--white); }
  .pending-details { display: flex; flex-direction: column; gap: var(--space-1); }
  .pending-details h4 { margin: var(--space-2) 0 0; color: var(--near-black); }
  .pending-details > span:not(.rac-number) { color: var(--text-muted); font-size: .8125rem; }
  .pending-actions { display: flex; flex-direction: column; align-items: stretch; gap: var(--space-2); min-width: 230px; }
  .pending-actions form { display: flex; gap: var(--space-2); }
  .pending-actions .btn { white-space: nowrap; }
  .reject-form .form-input { min-width: 0; }
  .pending-empty { padding: var(--space-8) 0; }
  @media (max-width: 700px) { .pending-card { flex-direction: column; } .pending-actions { min-width: 0; } }
</style>
