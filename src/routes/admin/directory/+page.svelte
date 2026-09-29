<script lang="ts">
  export let data;

  let search = '';

  $: filtered = data.members.filter((m: any) =>
    !search ||
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    m.occupation?.toLowerCase().includes(search.toLowerCase()) ||
    m.rac_number.toLowerCase().includes(search.toLowerCase())
  );
</script>

<svelte:head>
  <title>Member Directory — Rotaract Portal</title>
  <meta name="robots" content="noindex, nofollow" />
  <meta name="description" content="Member directory for the Rotaract Club of Lilongwe portal." />
</svelte:head>

<div class="portal-page">
  <div class="container" style="padding-top:var(--space-10);padding-bottom:var(--space-16)">

    <div class="portal-page-header">
      <div>
        <h2>Member Directory</h2>
        <p>{data.members.length} active members</p>
      </div>
    </div>

    <div class="search-wrap">
      <input
        type="search"
        class="form-input"
        placeholder="Search by name, occupation, or RAC number…"
        bind:value={search}
        style="max-width:400px"
      />
    </div>

    {#if filtered.length === 0}
      <div class="empty-state">
        <p>No members match your search.</p>
      </div>
    {:else}
      <div class="members-grid">
        {#each filtered as m (m.rac_number)}
          <div class="member-card">
            <div class="member-card__avatar">
              {m.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
            </div>
            <div class="member-card__info">
              <div class="member-card__name">{m.full_name}</div>
              <span class="rac-number" style="font-size:0.8rem">{m.rac_number}</span>
              {#if m.is_admin}
                <span class="badge badge--admin" style="margin-left:4px">Admin</span>
              {/if}
              {#if m.occupation}
                <div class="member-card__occupation">{m.occupation}</div>
              {/if}
              {#if m.skills}
                <div class="member-card__skills">{m.skills}</div>
              {/if}
            </div>
            <div class="member-card__since">
              Since {m.joined_year ?? '—'}
            </div>
          </div>
        {/each}
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
  margin-bottom: var(--space-6);
}
.portal-page-header h2 { color: var(--near-black); }
.portal-page-header p { color: var(--text-muted); margin-top: var(--space-1); }

.search-wrap { margin-bottom: var(--space-8); }

.members-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.member-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-5);
  transition: box-shadow var(--duration), transform var(--duration);
}
.member-card:hover { box-shadow: var(--shadow-md); transform: translateX(3px); }

.member-card__avatar {
  width: 48px; height: 48px;
  background: var(--near-black);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--gold-light);
  flex-shrink: 0;
}
.member-card__info { flex: 1; min-width: 0; }
.member-card__name { font-weight: 600; color: var(--near-black); font-size: 1rem; }
.member-card__occupation {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-top: var(--space-1);
}
.member-card__skills {
  font-size: 0.8125rem;
  color: var(--text-light);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.member-card__since {
  font-size: 0.8125rem;
  font-family: var(--font-mono);
  color: var(--text-light);
  flex-shrink: 0;
}

.empty-state {
  text-align: center;
  padding: var(--space-16) 0;
  color: var(--text-muted);
}
</style>
