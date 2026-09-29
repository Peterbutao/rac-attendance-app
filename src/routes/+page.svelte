<script lang="ts">
  import { CalendarDays, ClipboardCheck, UserRound, Clock3, ArrowUpRight } from 'lucide-svelte';
  import MemberProfileCard from '$lib/components/MemberProfileCard.svelte';

  export let data;
</script>

<svelte:head>
  <title>Overview — Rotaract Portal</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="dashboard-page">
  <div class="dashboard-container">
    <section class="welcome-panel">
      <div>
        <span class="eyebrow">Member workspace</span>
        <h2>Welcome back, {data.member?.full_name?.split(' ')[0] ?? 'member'}.</h2>
        <p>Keep up with your attendance, service, and club activity in one place.</p>
      </div>
      {#if data.member}
        <div class="welcome-id">
          <span class="welcome-id__dot"></span>
          <span>Active member</span>
        </div>
      {/if}
    </section>
    {#if data.member}
      <div class="dashboard-columns">
        <MemberProfileCard member={data.member} summary={data.profileSummary} />

        <aside class="dashboard-aside">
          <section class="guest-card">
            <div class="guest-card__top">
              <span class="eyebrow">Your impact</span>
              <span class="guest-card__icon"><UserRound size={18} /></span>
            </div>
            <div class="impact-metrics">
              <div class="impact-metric">
                <strong>{data.guestCount ?? 0}</strong>
                <h3>Guests invited</h3>
              </div>
              <div class="impact-metric">
                <!-- <span class="impact-metric__icon"><Clock3 size={15} /></span> -->
                <strong>{data.profileSummary?.volunteer_hours ?? 0}</strong>
                <h3>Total volunteer hours</h3>
              </div>
            </div>
            <p>Approved guest invitations connected to your attendance submissions.</p>
            <a href="/portal/attendance">Invite a guest <ArrowUpRight size={15} /></a>
          </section>

          <section class="dashboard-note">
            <span class="dashboard-note__mark">i</span>
            <div>
              <strong>Keep your record current</strong>
              <p>Submit attendance soon after each event so it can be reviewed promptly.</p>
            </div>
          </section>
        </aside>
      </div>
    {:else}
      <div class="empty-dashboard">Your member profile is not available yet. Please contact the admin team.</div>
    {/if}

    <section class="quick-actions" aria-label="Quick actions">
      <a href="/portal/events" class="quick-action quick-action--pink">
        <span class="quick-action__icon"><CalendarDays size={20} /></span>
        <span><strong>Browse events</strong><small>See upcoming sessions</small></span>
        <ArrowUpRight size={17} />
      </a>
      <a href="/portal/attendance" class="quick-action quick-action--navy">
        <span class="quick-action__icon"><ClipboardCheck size={20} /></span>
        <span><strong>Submit attendance</strong><small>Record an event or project</small></span>
        <ArrowUpRight size={17} />
      </a>
      <a href="/portal/profile" class="quick-action quick-action--light">
        <span class="quick-action__icon"><UserRound size={20} /></span>
        <span><strong>Update profile</strong><small>Manage your details</small></span>
        <ArrowUpRight size={17} />
      </a>
    </section>

  </div>
</div>

<style>
  .dashboard-page { min-height: 100%; }
  .dashboard-container { width: min(1180px, 100%); margin: 0 auto; }
  .welcome-panel { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 22px; padding: 26px 30px; border: 1px solid #e5eaf1; border-radius: 18px; background: linear-gradient(135deg, #fff 0%, #fff7fa 100%); box-shadow: var(--shadow-sm); }
  .eyebrow { color: var(--primary); font-size: .66rem; font-weight: 850; letter-spacing: .13em; text-transform: uppercase; }
  h2 { margin: 7px 0 6px; color: #101828; font-size: clamp(1.45rem, 3vw, 2rem); letter-spacing: -.045em; }
  .welcome-panel p { color: #667085; font-size: .86rem; }
  .welcome-id { display: inline-flex; align-items: center; gap: 8px; padding: 9px 12px; border: 1px solid #cfe9da; border-radius: 999px; background: #f0fbf4; color: #227044; font-size: .72rem; font-weight: 750; white-space: nowrap; }
  .welcome-id__dot { width: 7px; height: 7px; border-radius: 50%; background: #39a866; box-shadow: 0 0 0 4px rgba(57,168,102,.13); }
  .quick-actions { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 22px; }
  .quick-action { display: flex; align-items: center; gap: 11px; min-width: 0; padding: 15px; border: 1px solid transparent; border-radius: 14px; color: #fff; text-decoration: none; box-shadow: var(--shadow-sm); transition: transform .18s ease, box-shadow .18s ease; }
  .quick-action:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
  .quick-action > span:nth-child(2) { min-width: 0; flex: 1; }
  .quick-action strong, .quick-action small { display: block; }
  .quick-action strong { font-size: .78rem; }
  .quick-action small { margin-top: 3px; color: rgba(255,255,255,.68); font-size: .68rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .quick-action--pink { background: linear-gradient(135deg, #d83f6a, #b82d55); }
  .quick-action--navy { background: linear-gradient(135deg, #17253d, #101828); }
  .quick-action--light { border-color: #e5eaf1; background: #fff; color: #101828; }
  .quick-action--light small { color: #667085; }
  .quick-action__icon { display: grid; place-items: center; width: 34px; height: 34px; flex: 0 0 34px; border-radius: 10px; background: rgba(255,255,255,.15); }
  .quick-action--light .quick-action__icon { background: #fce8ef; color: var(--primary); }
  .dashboard-columns { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(260px, .8fr); gap: 22px; align-items: start; }
  .dashboard-aside { display: grid; gap: 14px; }
  .guest-card { padding: 22px; border-radius: 18px; background: #101828; color: #fff; box-shadow: var(--shadow-md); }
  .guest-card__top { display: flex; align-items: center; justify-content: space-between; }
  .guest-card .eyebrow { color: #ff86a8; }
  .guest-card__icon { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; background: rgba(255,255,255,.1); color: #ff86a8; }
  .impact-metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-top: 22px; }
  .impact-metric { min-width: 0; }
  .impact-metric strong { display: block; color: #fff; font-size: 2.2rem; line-height: 1; letter-spacing: -.06em; }
  .impact-metric h3 { margin: 8px 0 5px; font-size: .78rem; line-height: 1.25; }
  .impact-metric__icon { display: inline-grid; place-items: center; width: 26px; height: 26px; margin-bottom: 9px; border-radius: 8px; background: rgba(255,255,255,.1); color: #ff86a8; }
  .guest-card p { color: rgba(255,255,255,.58); font-size: .75rem; line-height: 1.55; }
  .guest-card a { display: inline-flex; align-items: center; gap: 5px; margin-top: 20px; color: #ff86a8; font-size: .75rem; font-weight: 800; text-decoration: none; }
  .dashboard-note { display: flex; gap: 11px; padding: 16px; border: 1px solid #e5eaf1; border-radius: 14px; background: #fff; }
  .dashboard-note__mark { display: grid; place-items: center; width: 22px; height: 22px; flex: 0 0 22px; border-radius: 50%; background: #fce8ef; color: var(--primary); font-size: .75rem; font-weight: 850; }
  .dashboard-note strong { color: #101828; font-size: .76rem; }
  .dashboard-note p { margin-top: 4px; color: #667085; font-size: .71rem; line-height: 1.45; }
  .empty-dashboard { padding: 40px; border: 1px dashed #cbd5e1; border-radius: 16px; color: #667085; text-align: center; }
  @media (max-width: 900px) { .welcome-panel { padding: 21px; } .dashboard-columns { grid-template-columns: 1fr; } }
  @media (max-width: 640px) { .welcome-panel { display: block; } .welcome-id { margin-top: 16px; } .quick-actions { grid-template-columns: 1fr; } .quick-action { min-height: 54px; } }
</style>
