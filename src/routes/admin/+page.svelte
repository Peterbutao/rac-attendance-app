<script lang="ts">
import { 
    FileText, 
    Users, 
    DollarSign, 
    ClipboardList, 
    Clock, 
    Target,
    RefreshCw,
    Database,
    UserCheck
  } from 'lucide-svelte';

  export let data;

  function formatDate(dateStr: string | null) {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString('en-MW', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }

  let syncing = false;
  let memberSyncing = false;

  async function triggerSync() {
    syncing = true;

    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const result = await res.json();
      
      if (result.error) {
        alert('Sync failed: ' + result.error);
      } else {
        alert(`Sync completed! Processed ${result.totalProcessed} records.`);
        window.location.reload();
      }
    } catch (err) {
      alert('Sync failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      syncing = false;
    }
  }

  async function triggerMemberSync() {
    memberSyncing = true;

    try {
      const res = await fetch('/api/sync-members', { method: 'POST' });
      const result = await res.json();
      
      if (result.error) {
        alert('Member sync failed: ' + result.error);
      } else if (result.message?.includes('not configured')) {
        alert('⚠️ Apps Script URL not configured.\n\nPlease set the MEMBERS_SHEET_APP_SCRIPT_URL in src/routes/api/sync-members/+server.ts\n\nSee "Apps Script Setup" section below for instructions.');
      } else {
        alert(`✅ Member sync completed!\n\nSynced ${result.recordsProcessed} members to Google Sheets.`);
        window.location.reload();
      }
    } catch (err) {
      alert('Member sync failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      memberSyncing = false;
    }
  }
</script>

<svelte:head>
  <title>Admin Dashboard — RAC Portal</title>
  <meta name="robots" content="noindex, nofollow" />
  <meta name="description" content="Rotaract Club of Lilongwe admin dashboard for managing club members, activities, dues, attendance, donations, and partnerships." />
  <script type="application/ld+json">
    {JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Rotaract Club of Lilongwe Admin Portal',
      url: 'https://rotaractlilongwe.com/admin'
    })}
  </script>
</svelte:head>

<div class="portal-page">
  <div class="container" style="padding-top:var(--space-10);padding-bottom:var(--space-16)">

    <div class="portal-page-header">
      <div>
        <h2>Admin Dashboard</h2>
        <p>Manage your Rotaract club members and activities.</p>
      </div>
    </div>

    <!-- Google Sheets Sync Status (Admin only) -->
    {#if data.member?.is_admin}
      <div class="card sync-card" style="margin-bottom:var(--space-8)">
        <div class="sync-header">
          <div class="sync-title">
            <Database size={20} />
            <div>
              <h4>Google Sheets Sync</h4>
              <p class="sync-subtitle">
                Last sync: {formatDate(data.syncStatus?.lastSync ?? null)}
              </p>
            </div>
          </div>
          <button class="btn btn--primary" on:click={triggerSync} disabled={syncing}>
            {#if syncing}
              <RefreshCw size={16} class="spin" />
              <span>Syncing...</span>
            {:else}
              <RefreshCw size={16} />
              <span>Sync Now</span>
            {/if}
          </button>
        </div>

        {#if data.syncStatus?.recentResults?.length}
          <div class="sync-results">
            <h5>Recent Sync Results</h5>
            <div class="sync-table-wrap">
              <table class="sync-table">
                <thead>
                  <tr>
                    <th>Sheet</th>
                    <th>Status</th>
                    <th>Records</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {#each data.syncStatus.recentResults.slice(0, 5) as result}
                    <tr>
                      <td>{result.sheet_name}</td>
                      <td>
                        <span class="status-badge" class:success={result.success}>
                          {result.success ? '✓ Success' : '✗ Failed'}
                        </span>
                      </td>
                      <td>{result.records_processed}</td>
                      <td>{formatDate(result.last_sync)}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/if}

        <div class="sync-info">
          <p>
            <strong>Auto-sync:</strong> Data syncs automatically when you log in.
            Sheets: MEMBER_DUES, MEETING_ATTENDANCE, VOLUNTEER_HOURS, ACTIVITIES
          </p>
        </div>
      </div>

      <!-- Members Google Sheets Sync -->
      <div class="card sync-card" style="margin-bottom:var(--space-8)">
        <div class="sync-header">
          <div class="sync-title">
            <UserCheck size={20} />
            <div>
              <h4>Sync Members to Google Sheets</h4>
              <p class="sync-subtitle">
                Syncs member records (ID, RAC Number, Name, Phone, Gmail) to the MEMBERS sheet.
              </p>
            </div>
          </div>
          <button class="btn btn--primary" on:click={triggerMemberSync} disabled={memberSyncing}>
            {#if memberSyncing}
              <RefreshCw size={16} class="spin" />
              <span>Syncing Members...</span>
            {:else}
              <UserCheck size={16} />
              <span>Sync Members</span>
            {/if}
          </button>
        </div>
        <div class="sync-info">
          <p>
            <strong>Columns synced:</strong> id, rac_number, full_name, phone, gmail
            &nbsp;·&nbsp;
            <strong>Sheet:</strong> MEMBERS
          </p>
        </div>
      </div>
    {/if}

    <div class="admin-grid">
      <!-- Applications -->
      <a href="/admin/applications" class="admin-card">
        <div class="admin-card__icon">
          <FileText size={24} />
        </div>
        <h4>Applications</h4>
        <p>Review and process membership applications.</p>
        <span class="admin-card__link">View Applications →</span>
      </a>

      <!-- Members -->
      <a href="/admin/members" class="admin-card">
        <div class="admin-card__icon">
          <Users size={24} />
        </div>
        <h4>Members</h4>
        <p>View and manage member statuses.</p>
        <span class="admin-card__link">Manage Members →</span>
      </a>

      <!-- Dues -->
      <a href="/admin/dues" class="admin-card">
        <div class="admin-card__icon">
          <DollarSign size={24} />
        </div>
        <h4>Member Dues</h4>
        <p>Track and update member dues payments.</p>
        <span class="admin-card__link">Manage Dues →</span>
      </a>

      <!-- Attendance -->
      <a href="/admin/attendance" class="admin-card">
        <div class="admin-card__icon">
          <ClipboardList size={24} />
        </div>
        <h4>Meeting Attendance</h4>
        <p>Record and track meeting attendance.</p>
        <span class="admin-card__link">Manage Attendance →</span>
      </a>

      <!-- Volunteer Hours -->
      <a href="/admin/volunteer" class="admin-card">
        <div class="admin-card__icon">
          <Clock size={24} />
        </div>
        <h4>Volunteer Hours</h4>
        <p>Log and manage volunteer contributions.</p>
        <span class="admin-card__link">Manage Hours →</span>
      </a>

       <!-- Activities -->
       <a href="/admin/activities" class="admin-card">
         <div class="admin-card__icon">
           <Target size={24} />
         </div>
         <h4>Activities</h4>
         <p>Create and manage club activities.</p>
         <span class="admin-card__link">Manage Activities →</span>
       </a>

       <!-- Partnership Inquiries -->
       <a href="/admin/partnerships" class="admin-card">
         <div class="admin-card__icon">
           <Users size={24} />
         </div>
         <h4>Partnership Inquiries</h4>
         <p>View and manage partnership inquiries.</p>
         <span class="admin-card__link">View Inquiries →</span>
       </a>

       <!-- Donation Interests -->
       <a href="/admin/donations" class="admin-card">
         <div class="admin-card__icon">
           <DollarSign size={24} />
         </div>
         <h4>Donation Interests</h4>
         <p>View and manage donation interests.</p>
         <span class="admin-card__link">View Donations →</span>
       </a>
     </div>
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
    margin-bottom: var(--space-10);
  }
  .portal-page-header h2 { color: var(--near-black); }
  .portal-page-header p { color: var(--text-muted); margin-top: var(--space-1); }

  .card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
  }

  .sync-card {
    border-color: var(--gold);
  }

  .sync-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-4);
  }

  .sync-title {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .sync-title h4 {
    margin: 0;
    color: var(--near-black);
  }

  .sync-subtitle {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin: var(--space-1) 0 0;
  }

  .sync-results {
    margin-top: var(--space-4);
    padding-top: var(--space-4);
    border-top: 1px solid var(--border);
  }

  .sync-results h5 {
    margin: 0 0 var(--space-3);
    font-size: 0.875rem;
    color: var(--text-light);
  }

  .sync-table-wrap {
    overflow-x: auto;
  }

  .sync-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8125rem;
  }

  .sync-table th {
    text-align: left;
    padding: var(--space-2) var(--space-3);
    background: var(--cream);
    font-weight: 600;
    color: var(--text-light);
  }

  .sync-table td {
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--border);
  }

  .status-badge {
    display: inline-block;
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    font-weight: 500;
    background: #f8d7da;
    color: #721c24;
  }

  .status-badge.success {
    background: #d4edda;
    color: #155724;
  }

  .sync-info {
    margin-top: var(--space-4);
    padding: var(--space-3);
    background: var(--cream);
    border-radius: var(--radius-sm);
  }

  .sync-info p {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--text-muted);
  }

  .admin-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--space-6);
  }

  .admin-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-6);
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    text-decoration: none;
    transition: all var(--duration);
  }

  .admin-card:hover {
    border-color: var(--gold);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  .admin-card__icon {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--cream);
    border-radius: var(--radius-lg);
    color: var(--near-black);
  }

  .admin-card:hover .admin-card__icon {
    background: var(--gold-pale);
    color: var(--gold);
  }

  .admin-card h4 {
    color: var(--near-black);
    font-size: 1.125rem;
    margin: 0;
  }

  .admin-card p {
    color: var(--text-muted);
    font-size: 0.875rem;
    line-height: 1.5;
    margin: 0;
    flex: 1;
  }

  .admin-card__link {
    color: var(--near-black);
    font-weight: 600;
    font-size: 0.875rem;
    margin-top: var(--space-2);
  }

  .admin-card:hover .admin-card__link {
    color: var(--gold);
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
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn--primary {
    background: var(--near-black);
    color: var(--gold-light);
  }

  .btn--primary:hover:not(:disabled) {
    background: var(--black);
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .spin {
    animation: spin 1s linear infinite;
  }
</style>