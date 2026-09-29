<script lang="ts">
  export let member: any;
  export let summary: any;
  export let gridColumn = false;

  let showInfoBox = false;

  function money(value: number | null | undefined) {
    return `MWK ${Number(value ?? 0).toLocaleString('en-MW', { maximumFractionDigits: 0 })}`;
  }
</script>

<div class="card profile-stats-card" class:profile-stats-card--grid={gridColumn}>
  <div class="section-heading">
    <div>
      <h4>Member Profile</h4>
      <p>Dues, attendance, service, activities, and points.</p>
    </div>

    <div class="points-pill">
      <strong>{summary?.member_points ?? 0}</strong>
      <span>points</span>
      <button
        type="button"
        class="info-icon"
        aria-label="Show member points calculation"
        aria-expanded={showInfoBox}
        on:click={() => showInfoBox = !showInfoBox}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path fill="white" d="M12 6v6l4 2" />
        </svg>
      </button>
    </div>
  </div>

  {#if showInfoBox}
    <div class="info-box">
      <p>
        <strong>Member Points Calculation:</strong><br />
        Your points are calculated based on your <strong>dues fulfillment (40%)</strong>,
        <strong>meeting attendance (35%)</strong>, and <strong>volunteer hours (25%)</strong>.
      </p>
    </div>
  {/if}

  <div class="stats-grid">
    <div class="stat-tile">
      <span>Dues Required</span>
      <strong>{money(summary?.dues_required)}</strong>
    </div>
    <div class="stat-tile">
      <span>Dues Paid</span>
      <strong>{money(summary?.dues_paid)}</strong>
    </div>
    <div class="stat-tile">
      <span>Balance</span>
      <strong>{money(summary?.balance)}</strong>
    </div>
    <div class="stat-tile">
      <span>Attendance</span>
      <strong>{summary?.attendance_rate ?? 0}%</strong>
    </div>
    <div class="stat-tile">
      <span>Meetings</span>
      <strong>{summary?.meetings_attended ?? 0}/{summary?.meetings_recorded ?? 0}</strong>
    </div>
    <div class="stat-tile">
      <span>Volunteer Hours</span>
      <strong>{summary?.volunteer_hours ?? 0}</strong>
    </div>
    <div class="stat-tile">
      <span>Activities Attended</span>
      <strong>{summary?.activities_attended ?? 0}</strong>
    </div>
    <div class="stat-tile">
      <span>Skills</span>
      <strong>{member?.skills ? 'Added' : 'Pending'}</strong>
    </div>
  </div>
</div>

<style>
  .profile-stats-card {
    background-color: transparent;
  }

  .profile-stats-card--grid {
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

  .points-pill {
    flex-shrink: 0;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    min-width: 82px;
    border-radius: var(--radius-sm);
    background: var(--gold-pale);
    color: var(--near-black);
    padding: var(--space-2) var(--space-3);
    font-size: 0.8125rem;
    font-weight: 600;
  }

  .points-pill strong {
    font-family: var(--font-display);
    font-size: 1.55rem;
    line-height: 1;
  }

  .points-pill span {
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .info-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--primary);
    cursor: pointer;
  }

  .info-box {
    margin-bottom: var(--space-8);
    padding: var(--space-5);
    background: rgba(232, 23, 93, 0.06);
    border: 1px solid rgba(232, 23, 93, 0.22);
    border-radius: var(--radius-md);
  }

  .info-box p {
    margin: 0;
    color: var(--near-black);
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .info-box strong {
    text-transform: uppercase;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--space-3);
  }

  .stat-tile {
    min-height: 92px;
    padding: var(--space-4);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--cream);
  }

  .stat-tile span {
    display: block;
    color: var(--text-light);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    line-height: 1.35;
  }

  .stat-tile strong {
    display: block;
    margin-top: var(--space-3);
    color: var(--near-black);
    font-size: 1.1rem;
    line-height: 1.2;
  }

  @media (max-width: 768px) {
    .profile-stats-card--grid {
      grid-column: auto;
    }

    .section-heading {
      flex-direction: column;
      align-items: stretch;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }

    .stat-tile {
      min-height: auto;
      padding: var(--space-3);
    }

    .stat-tile strong {
      margin-top: var(--space-2);
      font-size: 1rem;
    }
  }

  .profile-stats-card {
    padding: 24px;
    border-color: #e5eaf1;
    box-shadow: var(--shadow-sm);
  }

  .section-heading { padding-bottom: 18px; border-bottom: 1px solid #edf0f4; }
  .section-heading h4 { color: #101828; font-size: 1rem; letter-spacing: -.02em; }
  .section-heading p { color: #667085; font-size: .76rem; }
  .points-pill { min-width: 74px; border-radius: 12px; background: #fce8ef; color: #101828; }
  .points-pill strong { color: var(--primary); font-size: 1.35rem; }
  .info-box { margin-bottom: 18px; background: #fff7fa; border-color: #f3c8d6; }
  .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .stat-tile { min-height: 84px; padding: 14px; border-color: #e5eaf1; border-radius: 12px; background: #f8fafc; }
  .stat-tile span { color: #667085; font-size: .65rem; letter-spacing: .04em; }
  .stat-tile strong { margin-top: 8px; color: #101828; font-size: 1rem; }
</style>
