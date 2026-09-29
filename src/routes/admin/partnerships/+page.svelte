<script lang="ts">
  import type { PartnershipInquiry } from '$lib/types';

  export let data: { inquiries: PartnershipInquiry[] };

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'new': return '#E8175D';
      case 'contacted': return '#4CAF50';
      case 'rejected': return '#999';
      default: return '#666';
    }
  }

  function getTypeLabel(type: string) {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
</script>

<svelte:head>
  <title>Partnership Inquiries — Admin</title>
</svelte:head>

<main class="admin-main">
  <div class="admin-header">
    <h1>Partnership Inquiries</h1>
    <span class="count">{data.inquiries.length} total</span>
  </div>

  {#if data.inquiries.length === 0}
    <div class="empty-state">
      <p>No partnership inquiries yet.</p>
    </div>
  {:else}
    <div class="table-wrapper">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Organization</th>
            <th>Contact</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Type</th>
            <th>Message</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {#each data.inquiries as inquiry}
            <tr>
              <td class="date-cell">{formatDate(inquiry.created_at)}</td>
              <td><strong>{inquiry.organization_name}</strong></td>
              <td>{inquiry.contact_name}</td>
              <td><a href="mailto:{inquiry.email}">{inquiry.email}</a></td>
              <td>{inquiry.phone}</td>
              <td>{getTypeLabel(inquiry.partnership_type)}</td>
              <td class="message-cell">{inquiry.message}</td>
              <td>
                <span class="status-badge" style="background: {getStatusColor(inquiry.status)}">
                  {inquiry.status}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</main>

<style>
  .admin-main {
    padding: 32px 5vw;
    max-width: 1400px;
    margin: 0 auto;
  }

  .admin-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
  }

  .admin-header h1 {
    font-family: 'Anton', sans-serif;
    font-size: 32px;
    text-transform: uppercase;
    color: var(--near-black);
    margin: 0;
  }

  .count {
    color: rgba(26, 26, 26, 0.5);
    font-size: 14px;
  }

  .empty-state {
    text-align: center;
    padding: 64px;
    color: rgba(26, 26, 26, 0.5);
    background: var(--cream);
    border-radius: 8px;
  }

  .table-wrapper {
    overflow-x: auto;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .admin-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }

  .admin-table th {
    text-align: left;
    padding: 16px;
    background: var(--cream);
    color: rgba(26, 26, 26, 0.6);
    font-weight: 600;
    text-transform: uppercase;
    font-size: 11px;
    letter-spacing: 0.5px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  .admin-table td {
    padding: 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    vertical-align: top;
  }

  .admin-table tr:last-child td {
    border-bottom: none;
  }

  .admin-table tr:hover {
    background: rgba(232, 23, 93, 0.02);
  }

  .date-cell {
    white-space: nowrap;
    color: rgba(26, 26, 26, 0.6);
    font-size: 13px;
  }

  .message-cell {
    max-width: 250px;
    color: rgba(26, 26, 26, 0.7);
    line-height: 1.5;
  }

  .admin-table a {
    color: var(--primary);
    text-decoration: none;
  }

  .admin-table a:hover {
    text-decoration: underline;
  }

  .status-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 100px;
    color: white;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
</style>