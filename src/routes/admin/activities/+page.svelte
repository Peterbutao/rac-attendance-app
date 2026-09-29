<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';

  export let data;
  export let form;

  let showAddForm = false;
  let showTagForm = false;
  let editingId: number | null = null;
  let editTitle = '';
  let editDescription = '';
  let editDate = '';
  let editTags: number[] = [];
  let attendanceActivityId: number | null = null;
  let activityAttendees: Record<number, any[]> = {};

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-MW', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function startEdit(activity: any) {
    editingId = activity.id;
    editTitle = activity.title;
    editDescription = activity.description || '';
    editDate = activity.activity_date;
    editTags = (activity.tags || []).map((t: any) => t.tag?.id).filter(Boolean);
  }

  function cancelEdit() {
    editingId = null;
  }

  async function loadAttendance(activity: any) {
    if (attendanceActivityId === activity.id) {
      attendanceActivityId = null;
      return;
    }
    
    attendanceActivityId = activity.id;
    
    // Load attendees on demand
    const formData = new FormData();
    formData.append('activity_id', String(activity.id));
    
    const res = await fetch('?/getActivityAttendance', {
      method: 'POST',
      body: formData
    });
    
    const result = await res.json();
    if (result.data?.attendees) {
      activityAttendees[activity.id] = result.data.attendees;
    }
  }

  function getAttendeeIds(activityId: number): number[] {
    const attendees = activityAttendees[activityId] || [];
    return attendees
      .filter((a: any) => a.attended)
      .map((a: any) => a.member_id);
  }

  function goToPage(page: number) {
    goto(`?page=${page}`);
  }
</script>

<svelte:head>
  <title>Manage Activities — RAC Admin</title>
</svelte:head>

<div class="portal-page">
  <div class="container" style="padding-top:var(--space-10);padding-bottom:var(--space-16)">

    <div class="portal-page-header">
      <div>
        <h2>Manage Activities</h2>
        <p>Create and manage club activities and events. Showing {data.activities.length} of {data.totalCount} activities.</p>
      </div>
      <div style="display:flex;gap:var(--space-3)">
        <button class="btn btn--outline" on:click={() => showTagForm = !showTagForm}>
          {showTagForm ? 'Cancel' : '🏷️ Tags'}
        </button>
        <button class="btn btn--primary" on:click={() => showAddForm = !showAddForm}>
          {showAddForm ? 'Cancel' : '+ Add Activity'}
        </button>
      </div>
    </div>

    {#if form?.error}
      <div class="alert alert--error" style="margin-bottom:var(--space-5)">{form.error}</div>
    {/if}
    {#if form?.success}
      <div class="alert alert--success" style="margin-bottom:var(--space-5)">✓ Activity updated successfully.</div>
    {/if}

    <!-- Tags Management -->
    {#if showTagForm}
      <div class="card" style="margin-bottom:var(--space-8)">
        <h4 style="margin-bottom:var(--space-6)">Manage Tags</h4>
        
        <div style="display:flex;flex-wrap:wrap;gap:var(--space-2);margin-bottom:var(--space-6)">
          {#each data.tags as tag}
            <span class="tag-badge" style="background:{tag.color}">
              {tag.name}
              <form method="POST" action="?/deleteTag" style="display:inline">
                <input type="hidden" name="id" value={tag.id} />
                <button type="submit" class="tag-remove" on:click={() => confirm('Delete this tag?')}>×</button>
              </form>
            </span>
          {/each}
        </div>

        <form
          method="POST"
          action="?/addTag"
          use:enhance={() => {
            return async ({ update }) => await update();
          }}
          style="display:flex;gap:var(--space-3);align-items:flex-end"
        >
          <div class="form-group">
            <label class="form-label" for="tag_name">Tag Name</label>
            <input id="tag_name" name="name" type="text" class="form-input" placeholder="e.g. Workshop" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="tag_color">Color</label>
            <input id="tag_color" name="color" type="color" class="form-input" value="#E8175D" style="width:60px" />
          </div>
          <button type="submit" class="btn btn--primary">Add Tag</button>
        </form>
      </div>
    {/if}

    <!-- Add Activity Form -->
    {#if showAddForm}
      <div class="card" style="margin-bottom:var(--space-8)">
        <h4 style="margin-bottom:var(--space-6)">Add New Activity</h4>
        <form
          method="POST"
          action="?/addActivity"
          use:enhance={() => {
            showAddForm = false;
            return async ({ update }) => await update();
          }}
        >
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--space-4)">
            <div class="form-group">
              <label class="form-label" for="title">Title</label>
              <input id="title" name="title" type="text" class="form-input" placeholder="e.g. Community Cleanup Drive" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="activity_date">Date</label>
              <input id="activity_date" name="activity_date" type="date" class="form-input" required />
            </div>
            <div class="form-group" style="grid-column:span 2">
              <label class="form-label" for="description">Description</label>
              <textarea id="description" name="description" class="form-textarea" rows="2" placeholder="Brief description of the activity..."></textarea>
            </div>
            <div class="form-group" style="grid-column:span 2">
              <label class="form-label">Tags</label>
              <div style="display:flex;flex-wrap:wrap;gap:var(--space-2)">
                {#each data.tags as tag}
                  <label class="tag-checkbox">
                    <input type="checkbox" name="tag_ids" value={tag.id} />
                    <span style="background:{tag.color}">{tag.name}</span>
                  </label>
                {/each}
              </div>
            </div>
          </div>
          <div style="margin-top:var(--space-4)">
            <button type="submit" class="btn btn--primary">Create Activity</button>
          </div>
        </form>
      </div>
    {/if}

    <!-- Activities List -->
    {#if data.activities.length === 0}
      <div class="empty-state"><p>No activities created yet.</p></div>
    {:else}
      <div class="activities-list">
        {#each data.activities as activity (activity.id)}
          <div class="activity-card">
            {#if editingId === activity.id}
              <form
                method="POST"
                action="?/updateActivity"
                use:enhance={() => {
                  editingId = null;
                  return async ({ update }) => await update();
                }}
              >
                <input type="hidden" name="id" value={activity.id} />
                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--space-4)">
                  <div class="form-group">
                    <label class="form-label">Title</label>
                    <input type="text" bind:value={editTitle} name="title" class="form-input" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Date</label>
                    <input type="date" bind:value={editDate} name="activity_date" class="form-input" required />
                  </div>
                  <div class="form-group" style="grid-column:span 2">
                    <label class="form-label">Description</label>
                    <textarea bind:value={editDescription} name="description" class="form-textarea" rows="2"></textarea>
                  </div>
                  <div class="form-group" style="grid-column:span 2">
                    <label class="form-label">Tags</label>
                    <div style="display:flex;flex-wrap:wrap;gap:var(--space-2)">
                      {#each data.tags as tag}
                        <label class="tag-checkbox">
                          <input type="checkbox" name="tag_ids" value={tag.id} checked={editTags.includes(tag.id)} />
                          <span style="background:{tag.color}">{tag.name}</span>
                        </label>
                      {/each}
                    </div>
                  </div>
                </div>
                <div style="margin-top:var(--space-4);display:flex;gap:var(--space-2)">
                  <button type="submit" class="btn btn--primary">Save</button>
                  <button type="button" class="btn btn--ghost" on:click={cancelEdit}>Cancel</button>
                </div>
              </form>
            {:else}
              <div class="activity-header">
                <div>
                  <h4>{activity.title}</h4>
                  <span class="activity-date">{formatDate(activity.activity_date)}</span>
                </div>
                <div class="activity-actions">
                  <button class="btn btn--ghost btn--sm" on:click={() => startEdit(activity)}>Edit</button>
                  <form method="POST" action="?/deleteActivity" style="display:inline">
                    <input type="hidden" name="id" value={activity.id} />
                    <button type="submit" class="btn btn--danger btn--sm" on:click={() => confirm('Delete this activity?')}>Delete</button>
                  </form>
                </div>
              </div>
              
              {#if activity.description}
                <p class="activity-description">{activity.description}</p>
              {/if}

              {#if activity.tags && activity.tags.length > 0}
                <div class="activity-tags">
                  {#each activity.tags as tagWrapper}
                    {#if tagWrapper.tag}
                      <span class="tag-badge" style="background:{tagWrapper.tag.color}">{tagWrapper.tag.name}</span>
                    {/if}
                  {/each}
                </div>
              {/if}

              <button class="btn btn--outline btn--sm" style="margin-top:var(--space-4)" on:click={() => loadAttendance(activity)}>
                {attendanceActivityId === activity.id ? 'Cancel' : '📋 Mark Attendance'}
              </button>

              {#if attendanceActivityId === activity.id}
                <form
                  method="POST"
                  action="?/markAttendance"
                  use:enhance={() => {
                    attendanceActivityId = null;
                    return async ({ update }) => await update();
                  }}
                  style="margin-top:var(--space-4)"
                >
                  <input type="hidden" name="activity_id" value={activity.id} />
                  <p style="margin-bottom:var(--space-3);font-size:0.875rem;color:var(--text-muted);">Select members who attended:</p>
                  <div class="member-checklist">
                    {#each data.members as member}
                      <label class="member-checkbox">
                        <input type="checkbox" name="attended_ids" value={member.id} checked={getAttendeeIds(activity.id).includes(member.id)} />
                        <span>{member.full_name}</span>
                        <span class="rac-number">{member.rac_number}</span>
                      </label>
                    {/each}
                  </div>
                  <button type="submit" class="btn btn--primary" style="margin-top:var(--space-4)">Save Attendance</button>
                </form>
              {/if}
            {/if}
          </div>
        {/each}
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

  .activities-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .activity-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
  }

  .activity-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-4);
  }

  .activity-header h4 {
    color: var(--near-black);
    margin: 0;
  }

  .activity-date {
    font-size: 0.875rem;
    color: var(--text-muted);
  }

  .activity-actions {
    display: flex;
    gap: var(--space-2);
  }

  .activity-description {
    margin-top: var(--space-4);
    color: var(--text);
    line-height: 1.6;
  }

  .activity-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: var(--space-4);
  }

  .tag-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    font-weight: 600;
    color: white;
  }

  .tag-remove {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    font-size: 1rem;
    padding: 0;
    margin-left: var(--space-1);
    opacity: 0.8;
  }

  .tag-remove:hover {
    opacity: 1;
  }

  .tag-checkbox {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
  }

  .tag-checkbox input {
    display: none;
  }

  .tag-checkbox span {
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    font-weight: 600;
    color: white;
    opacity: 0.5;
    transition: opacity var(--duration);
  }

  .tag-checkbox input:checked + span {
    opacity: 1;
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

  .empty-state { text-align: center; padding: var(--space-16) 0; color: var(--text-muted); }

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

  .form-group { display: flex; flex-direction: column; gap: var(--space-1); }
  .form-label { font-size: 0.8125rem; font-weight: 500; color: var(--text-light); }
  .form-input, .form-select, .form-textarea {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 0.875rem;
  }
  .form-textarea { resize: vertical; }

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
  .btn--ghost { background: transparent; color: var(--text); }
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