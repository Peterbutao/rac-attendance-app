<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import { user, member, loading } from '$lib/stores/auth';
  import { createClient } from '$lib/supabase';
  import { generateSEO, generateStructuredData, getOGImage, generateWebPageStructuredData } from '$lib/seo';
  import { FileText, Users, User, BookOpen, House, Calendar, ClipboardList, QrCode } from 'lucide-svelte';

  export let data;

  const supabase = createClient();
  
  $: seo = generateSEO(($page.data as Record<string, unknown>)?.seo as SEOData | undefined);
  $: ogImage = getOGImage(seo.image);
  $: ogImageUrl = new URL(ogImage.url, $page.url.origin).href;
  $: structuredData = generateStructuredData({ ...seo, url: $page.url.href });
  $: webPageStructuredData = generateWebPageStructuredData({
    title: seo.title,
    description: seo.description,
    url: $page.url.href
  });

  $: {
    $user = data.user ?? data.session?.user ?? null;
    $member = data.member ?? null;
    $loading = false;
  }

  onMount(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      $user = session?.user ?? null;
      if (!session) {
        $member = null;
        $loading = false;
        return;
      }
      if (!$member) {
        const { data: m } = await supabase
          .from('members')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        $member = m ?? null;
      }
      $loading = false;
    });

    return () => subscription.unsubscribe();
  });

  onMount(() => {
    try { document.body.classList.add('site-theme'); } catch (e) { /* noop */ }
  });

  let scrolled = false;
  let committeePromptOpen = true;
  let committeePromptSaving = false;
  let committeePromptError = '';
  let selectedCommitteeIds: string[] = [];
  let selectedCommitteeMemberId: number | null = null;

  $: isPortal = $page.url.pathname.startsWith('/portal') || $page.url.pathname.startsWith('/admin');
  $: isApp = isPortal || $page.url.pathname === '/';
  $: isAdmin  = $member?.is_admin ?? false;
  $: isTracker = $page.url.pathname === '/endpolio/D9210-endpolionow-tracker';
  $: pageTitle = $page.url.pathname === '/' ? 'Overview'
    : $page.url.pathname.includes('/events') ? 'Events'
    : $page.url.pathname.includes('/attendance') ? 'Attendance'
    : $page.url.pathname.includes('/profile') ? 'My profile'
    : $page.url.pathname.includes('/applications') ? 'Applications'
    : $page.url.pathname.includes('/members') ? 'Members'
    : $page.url.pathname.includes('/directory') ? 'Directory'
    : $page.url.pathname.includes('/qr-codes') ? 'QR codes'
    : $page.url.pathname.includes('/activities') ? 'Activities'
    : 'Admin workspace';
  $: if (data.member?.id !== selectedCommitteeMemberId) {
    selectedCommitteeMemberId = data.member?.id ?? null;
    selectedCommitteeIds = (data.memberCommitteeIds ?? []).map((id: number) => String(id));
    committeePromptOpen = true;
    committeePromptError = '';
  }
  $: shouldShowCommitteePrompt =
    committeePromptOpen &&
    isPortal &&
    Boolean($member) &&
    (data.committees?.length ?? 0) > 0 &&
    !$member?.committee_onboarding_completed &&
    !$member?.committee_onboarding_skipped_at &&
    (data.memberCommitteeIds?.length ?? 0) < 3;

  onMount(() => {
    const handler = () => { scrolled = window.scrollY > 60; };
    window.addEventListener('scroll', handler);
    handler();
    return () => {
      window.removeEventListener('scroll', handler);
    };
  });

</script>

<svelte:head>
  <title>{seo.title}</title>
  <meta name="description" content={seo.description} />
  <meta name="keywords" content={seo.keywords?.join(', ')} />
  <meta name="robots" content={seo.robots} />
  <meta name="author" content="Rotaract Club of Lilongwe" />
  <meta name="theme-color" content="#E8175D" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content={seo.type} />
  <meta property="og:url" content={$page.url.href} />
  <meta property="og:title" content={seo.title} />
  <meta property="og:description" content={seo.description} />
  <meta property="og:image" content={ogImageUrl} />
  <meta property="og:image:secure_url" content={ogImageUrl} />
  <meta property="og:image:type" content={ogImageUrl.endsWith('.png') ? 'image/png' : 'image/jpeg'} />
    <meta property="og:image:width" content={String(ogImage.width)} />
    <meta property="og:image:height" content={String(ogImage.height)} />
    <meta property="og:image:alt" content={ogImage.alt} />
  <meta property="og:site_name" content={seo.siteName} />
  <meta property="og:locale" content={seo.locale} />
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content={$page.url.href} />
  <meta name="twitter:title" content={seo.title} />
  <meta name="twitter:description" content={seo.description} />
  <meta name="twitter:image" content={ogImageUrl} />    <meta name="twitter:image:alt" content={ogImage.alt} />
  {#if seo.twitterHandle}
    <meta name="twitter:site" content={seo.twitterHandle} />
    <meta name="twitter:creator" content={seo.twitterHandle} />
  {/if}
  
  <!-- Canonical URL -->
  <link rel="canonical" href={$page.url.href} />
  <meta name="application-name" content="Rotaract Club of Lilongwe" />
  
  <!-- Structured Data (JSON-LD) -->
  <script type="application/ld+json">
    {JSON.stringify(structuredData)}
  </script>
  <script type="application/ld+json">
    {JSON.stringify(webPageStructuredData)}
  </script>
</svelte:head>

{#if isApp}
<div class="app-shell">
  <aside class="app-sidebar">
    <a href="/" class="app-brand">
      <span class="app-brand-mark"><img src="/logo.png" alt="" /></span>
      <span>
        <strong>Rotaract</strong>
        <small>{isAdmin ? 'Admin workspace' : 'Member workspace'}</small>
      </span>
    </a>

    <div class="app-sidebar-label">Workspace</div>
    <nav class="app-nav" aria-label="Workspace navigation">
      {#if isAdmin}
        <a href="/admin" class:active={$page.url.pathname === '/admin'}><House size={18} /><span>Overview</span></a>
        <a href="/admin/applications" class:active={$page.url.pathname.includes('applications')}><FileText size={18} /><span>Applications</span></a>
        <a href="/admin/members" class:active={$page.url.pathname.includes('/admin/members')}><Users size={18} /><span>Members</span></a>
        <a href="/admin/attendance" class:active={$page.url.pathname.includes('/admin/attendance')}><ClipboardList size={18} /><span>Attendance</span></a>
        <a href="/admin/activities" class:active={$page.url.pathname.includes('activities')}><Calendar size={18} /><span>Activities</span></a>
        <a href="/admin/qr-codes" class:active={$page.url.pathname.includes('qr-codes')}><QrCode size={18} /><span>QR codes</span></a>
        <a href="/admin/directory" class:active={$page.url.pathname.includes('directory')}><BookOpen size={18} /><span>Directory</span></a>
      {:else}
        <a href="/" class:active={$page.url.pathname === '/'}><House size={18} /><span>Overview</span></a>
        <a href="/portal/events" class:active={$page.url.pathname.includes('events')}><Calendar size={18} /><span>Events</span></a>
        <a href="/portal/attendance" class:active={$page.url.pathname.includes('attendance')}><ClipboardList size={18} /><span>Attendance</span></a>
        <a href="/portal/profile" class:active={$page.url.pathname.includes('profile')}><User size={18} /><span>My profile</span></a>
      {/if}
    </nav>

    <div class="app-sidebar-footer">
      {#if $member}
        <div class="app-user-chip">
          <span class="app-avatar">{$member.full_name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
          <span><strong>{$member.full_name}</strong><small>{$member.rac_number}</small></span>
        </div>
      {/if}
      <a href="/portal/profile" class="app-account-link"><User size={16} /> Account settings</a>
    </div>
  </aside>

  <div class="app-content">
    <header class="app-topbar">
      <div>
        <span class="app-kicker">{isAdmin ? 'Administration' : 'Member portal'}</span>
        <h1>{pageTitle}</h1>
      </div>
      {#if $member}
        <a href="/portal/profile" class="app-topbar-profile" aria-label="Open profile">
          <span class="app-avatar">{$member.full_name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
          <span class="app-topbar-name">{$member.full_name.split(' ')[0]}</span>
        </a>
      {/if}
    </header>
    <main class="app-page">
      <slot />
    </main>
  </div>
</div>
{:else if !isTracker}
<header class="site-header" class:scrolled={scrolled}>
  <div class=" site-header__inner">
    <a href="/" class="site-logo">
      <span class="site-logo__wheel" aria-hidden="true">
        <img src="/logo.png" alt="logo">
      </span>
      <div>
        <span class="site-logo__name">Rotaract</span>
        <span class="site-logo__sub">Club of Lilongwe</span>
      </div>
    </a>


  </div>
</header>
{/if}

{#if !isApp}
<main>
  <slot />
</main>
{/if}

{#if isApp}
  {#if isAdmin}
    <nav class="mobile-bottom-nav">
      <a href="/admin" class="mobile-nav-item" class:active={$page.url.pathname === '/admin'}>
        <House size={21} />
        <span>Home</span>
      </a>
      <a href="/admin/attendance" class="mobile-nav-item" class:active={$page.url.pathname.includes('attendance')}>
        <ClipboardList size={21} />
        <span>Attendance</span>
      </a>
      <a href="/portal/profile" class="mobile-nav-item" class:active={$page.url.pathname === '/portal/profile'}>
        <User size={21} />
        <span>Profile</span>
      </a>
      <a href="/admin/directory" class="mobile-nav-item" class:active={$page.url.pathname === '/admin/directory'}>
        <BookOpen size={21} />
        <span>Directory</span>
      </a>
    </nav>
   {:else}
      <nav class="mobile-bottom-nav">
        <a href="/" class="mobile-nav-item" class:active={$page.url.pathname === '/'}>
          <House size={22} />
          <span>Home</span>
        </a>
        <a href="/portal/events" class="mobile-nav-item" class:active={$page.url.pathname.includes('events')}>
          <Calendar size={22} />
          <span>Events</span>
        </a>
        <a href="/portal/attendance" class="mobile-nav-item" class:active={$page.url.pathname.includes('attendance')}>
          <ClipboardList size={22} />
          <span>Attendance</span>
        </a>
        <a href="/portal/profile" class="mobile-nav-item" class:active={$page.url.pathname === '/portal/profile'}>
          <User size={22} />
          <span>Profile</span>
        </a>
      </nav>
   {/if}
 {/if}

{#if shouldShowCommitteePrompt}
  <div class="committee-prompt-backdrop" role="presentation">
    <div class="committee-prompt" role="dialog" aria-modal="true" tabindex="-1">
      <div class="committee-prompt__header">
        <div>
          <h3>Select Your Committees</h3>
          <p>Choose at least 3 committees where you would like to contribute.</p>
        </div>
      </div>

      {#if committeePromptError}
        <div class="alert alert--error">{committeePromptError}</div>
      {/if}

      <form
        method="POST"
        action="/portal/profile?/updateCommittees"
        use:enhance={() => {
          committeePromptSaving = true;
          committeePromptError = '';
          return async ({ result, update }) => {
            committeePromptSaving = false;
            await update();

            if (result.type === 'failure') {
              committeePromptError = (result.data as any)?.error ?? 'Could not save committees.';
              return;
            }

            committeePromptOpen = false;
            await invalidateAll();
          };
        }}
      >
        <div class="committee-options">
          {#each data.committees ?? [] as committee}
            <label class="committee-option">
              <input
                type="checkbox"
                name="committee_ids"
                value={String(committee.id)}
                bind:group={selectedCommitteeIds}
              />
              <span>
                <strong>{committee.name}</strong>
                {#if committee.description}
                  <small>{committee.description}</small>
                {/if}
              </span>
            </label>
          {/each}
        </div>

        <div class="committee-prompt__footer">
          <span>{selectedCommitteeIds.length} selected</span>
          <div class="committee-prompt__actions">
            <button
              type="submit"
              name="intent"
              value="skip"
              class="btn btn--ghost"
              disabled={committeePromptSaving}
              formnovalidate
            >
              Later
            </button>
            <button
              type="submit"
              name="intent"
              value="save"
              class="btn btn--primary"
              disabled={committeePromptSaving || selectedCommitteeIds.length < 3}
            >
              {committeePromptSaving ? 'Saving...' : 'Save Committees'}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
{/if}


<style>
.nav_padding{
  padding: 0 10px;
}
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}
.site-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: auto;
  z-index: 100;
  background: rgba(255,255,255,0);
  border-bottom: none;
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
  transition: background 200ms var(--ease), backdrop-filter 200ms var(--ease), border-color 200ms var(--ease);
}

.site-header.scrolled {
  background: rgba(217, 217, 217, 0.4);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}

main { padding-top: 0; }
.portal-main { padding-top: 0; }
main.has-mobile-nav { padding-bottom: 70px; }
.site-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 68px;
  margin: 0 auto;
  max-width: 1200px;
  padding: 0 5vw;
}

.site-logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-decoration: none;
  flex-shrink: 0;
}
.site-logo__wheel {
  font-size: 1.6rem;
  color: var(--gold);
  line-height: 1;
  animation: spin 12s linear infinite;
  width: 30px;
}
.site-logo__wheel img {
  width: 100%;
}
@keyframes spin { to { transform: rotate(360deg); } }
.site-logo--light .site-logo__wheel { color: var(--gold-light); }
.site-logo__name {
  display: block;
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--primary);
  line-height: 1;
}
.site-logo--light .site-logo__name { color: var(--white); }
.site-logo__sub {
  display: block;
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-light);
  line-height: 1;
  margin-top: 2px;
}
.site-logo--light .site-logo__sub { color: rgba(255,255,255,0.5); }

.portal-header {
  background: rgba(26, 26, 26, .96);
  border-bottom: 1px solid rgba(232, 23, 93, .22);
  box-shadow: 0 10px 30px rgba(26, 26, 26, .14);
  position: sticky;
  top: 0;
  z-index: 100;
}
.portal-header__inner {
  display: flex;
  align-items: center;
  height: 64px;
  gap: var(--space-8);
}
.portal-nav {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex: 1;
}
.portal-nav__link {
  padding: var(--space-2) var(--space-4);
  font-size: 0.875rem;
  color: rgba(255,255,255,0.68);
  border-radius: var(--radius-sm);
  transition: all var(--duration) var(--ease);
  text-decoration: none;
  font-weight: 700;
}
.portal-nav__link:hover, .portal-nav__link.active {
  color: var(--white);
  background: rgba(232, 23, 93, .18);
}
.portal-nav__link.active { color: var(--gold-light); }
.portal-header__user {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-left: auto;
}
.portal-header__name {
  font-size: 0.875rem;
  color: rgba(255,255,255,0.7);
}

.portal-main {
  background:
    linear-gradient(180deg, rgba(251, 245, 243, 1) 0%, rgba(245, 240, 235, 1) 100%);
  min-height: calc(100vh - 64px);
}

/* Bottom Navigation - Fixed at bottom of portal pages */
.mobile-bottom-nav {
  display: flex;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(26, 26, 26, 0.98);
  border-top: 1px solid rgba(232, 23, 93, 0.3);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 200;
  padding: 8px 0;
  padding-bottom: max(8px, env(safe-area-inset-bottom));
  border-radius: 5rem;
  margin-bottom: 1vh;
  margin-left: 10px;
  margin-right: 10px;
}

.mobile-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 8px 4px;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.2s ease;
  border-radius: 8px;
  gap: 4px;
}

.mobile-nav-item:hover {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(232, 23, 93, 0.1);
}

.mobile-nav-item.active {
  color: #E8175D;
}

.mobile-nav-item span {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.committee-prompt-backdrop {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: grid;
  place-items: center;
  padding: var(--space-6);
  background: rgba(26, 26, 26, 0.62);
}

.committee-prompt {
  width: min(760px, 100%);
  max-height: min(760px, calc(100vh - 48px));
  overflow: auto;
  background: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--space-8);
}

.committee-prompt__header {
  margin-bottom: var(--space-6);
}

.committee-prompt__header p {
  margin-top: var(--space-2);
}

.committee-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
  margin: var(--space-6) 0;
}

.committee-option {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-3);
  align-items: start;
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--cream);
  cursor: pointer;
}

.committee-option:has(input:checked) {
  border-color: var(--gold);
  background: var(--gold-pale);
}

.committee-option input {
  margin-top: 4px;
}

.committee-option strong {
  display: block;
  color: var(--near-black);
  line-height: 1.35;
}

.committee-option small {
  display: block;
  margin-top: var(--space-1);
  color: var(--text-muted);
  line-height: 1.45;
}

.committee-prompt__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border);
}

.committee-prompt__footer > span {
  color: var(--text-muted);
  font-size: 0.875rem;
}

.committee-prompt__actions {
  display: flex;
  gap: var(--space-3);
}

@media (max-width: 768px) {
  .site-header__inner{
    padding: 0 20px;
  }
  .portal-header__user .rac-number,
  .portal-header__name { display: none; }
  .committee-prompt { padding: var(--space-6); }
  .committee-options { grid-template-columns: 1fr; }
  .committee-prompt__footer {
    align-items: stretch;
    flex-direction: column;
  }
  .committee-prompt__actions {
    flex-direction: column-reverse;
  }
  .committee-prompt__actions .btn {
    justify-content: center;
  }
  .portal-header__inner {
    align-items: flex-start;
    height: auto;
    padding: var(--space-4) 0;
  }
  .portal-nav {
    display: none;
  }
  .portal-nav__link {
    padding: var(--space-2) var(--space-3);
    font-size: 0.8125rem;
  }
  
  /* Show mobile bottom nav */
  .mobile-bottom-nav {
    display: flex;
  }
  .mobile-bottom-nav a span {
    font-size: 7px;
  }
}

/* Authenticated application shell */
.app-shell {
  display: flex;
  min-height: 100vh;
  background: var(--app-bg, #f4f7fb);
}

.app-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  width: 252px;
  padding: 24px 16px 18px;
  background: #101828;
  color: #fff;
}

.app-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 0 10px 28px;
  color: #fff;
  text-decoration: none;
}

.app-brand-mark {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  border-radius: 12px;
  background: var(--primary);
  box-shadow: 0 8px 20px rgba(232, 23, 93, .28);
  overflow: hidden;
}

.app-brand-mark img { width: 29px; height: 29px; object-fit: contain; }
.app-brand strong, .app-brand small { display: block; }
.app-brand strong { font-size: .96rem; letter-spacing: -.02em; }
.app-brand small { margin-top: 3px; color: rgba(255,255,255,.48); font-size: .68rem; }
.app-sidebar-label { padding: 0 12px 10px; color: rgba(255,255,255,.36); font-size: .65rem; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
.app-nav { display: grid; gap: 4px; }
.app-nav a { display: flex; align-items: center; gap: 12px; min-height: 44px; padding: 0 12px; border-radius: 10px; color: rgba(255,255,255,.62); font-size: .82rem; font-weight: 650; text-decoration: none; transition: background .18s ease, color .18s ease; }
.app-nav a:hover { color: #fff; background: rgba(255,255,255,.07); }
.app-nav a.active { color: #fff; background: rgba(232,23,93,.18); box-shadow: inset 3px 0 0 var(--primary); }
.app-nav a.active :global(svg) { color: #ff83a7; }
.app-sidebar-footer { margin-top: auto; padding: 16px 8px 0; border-top: 1px solid rgba(255,255,255,.08); }
.app-user-chip { display: flex; align-items: center; gap: 10px; min-width: 0; padding: 4px 4px 14px; }
.app-user-chip > span:last-child { min-width: 0; }
.app-user-chip strong, .app-user-chip small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.app-user-chip strong { color: #fff; font-size: .76rem; }
.app-user-chip small { margin-top: 3px; color: rgba(255,255,255,.44); font-family: var(--font-mono); font-size: .64rem; }
.app-avatar { display: inline-grid; place-items: center; width: 34px; height: 34px; flex: 0 0 34px; border-radius: 10px; background: rgba(255,255,255,.12); color: #fff; font-size: .7rem; font-weight: 800; }
.app-account-link { display: flex; align-items: center; gap: 8px; padding: 9px 4px; color: rgba(255,255,255,.45); font-size: .72rem; text-decoration: none; }
.app-account-link:hover { color: #fff; }
.app-content { width: calc(100% - 252px); min-width: 0; margin-left: 252px; }
.app-topbar { position: sticky; top: 0; z-index: 80; display: flex; align-items: center; justify-content: space-between; min-height: 82px; padding: 16px clamp(24px, 4vw, 56px); border-bottom: 1px solid #e5eaf1; background: rgba(244,247,251,.88); backdrop-filter: blur(18px); }
.app-kicker { display: block; margin-bottom: 4px; color: var(--primary); font-size: .65rem; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
.app-topbar h1 { color: #101828; font-size: 1.32rem; letter-spacing: -.035em; }
.app-topbar-profile { display: flex; align-items: center; gap: 10px; color: #101828; text-decoration: none; }
.app-topbar-profile .app-avatar { background: #101828; color: #fff; }
.app-topbar-name { font-size: .78rem; font-weight: 750; }
.app-page { min-height: calc(100vh - 82px); padding: 30px clamp(24px, 4vw, 56px) 64px; background: #f4f7fb; }
:global(.app-page > .portal-page) { min-height: 0; background: transparent; }
:global(.app-page > .portal-page > .container) { max-width: 1240px; padding: 0 !important; }
:global(.app-page .portal-page-header) { margin-bottom: 28px; }
.mobile-bottom-nav { display: none; }

@media (max-width: 900px) {
  .app-sidebar { display: none; }
  .app-content { width: 100%; margin-left: 0; }
  .app-topbar { min-height: 70px; padding: 13px 18px; }
  .app-topbar h1 { font-size: 1.05rem; }
  .app-topbar-name { display: none; }
  .app-page { min-height: calc(100vh - 70px); padding: 22px 16px 104px; }
  .mobile-bottom-nav { display: flex; position: fixed; right: 12px; bottom: max(12px, env(safe-area-inset-bottom)); left: 12px; z-index: 200; padding: 7px; border: 1px solid rgba(16,24,40,.08); border-radius: 18px; background: rgba(16,24,40,.96); box-shadow: 0 14px 30px rgba(16,24,40,.2); }
  .mobile-nav-item { min-height: 54px; border-radius: 12px; }
  .mobile-nav-item.active { background: rgba(232,23,93,.18); color: #ff83a7; }
  .mobile-nav-item span { font-size: .62rem; letter-spacing: .02em; text-transform: none; }
}
</style>
