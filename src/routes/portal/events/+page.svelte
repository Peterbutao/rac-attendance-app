<script lang="ts">
  import { PUBLIC_SUPABASE_URL } from '$env/static/public';
  import { ArrowRight, ChevronLeft, ChevronRight, Clock, MapPin, X } from 'lucide-svelte';

  export let data;

  $: EVENTS = data.ACTIVITES ?? [];
  $: activeEvent = selectedEventIndex === null ? null : EVENTS[selectedEventIndex] ?? null;

  let selectedEventIndex: number | null = null;
  let touchStartX = 0;
  let touchStartY = 0;

  function eventPoster(event) {
    if (!event?.attachment_storage_path) return '';
    let path = String(event.attachment_storage_path).replace(/^\/+/, '');
    if (path.startsWith('RAC/ACTIVITIES/')) path = path.slice('RAC/ACTIVITIES/'.length);
    if (path.startsWith('ACTIVITIES/')) path = path.slice('ACTIVITIES/'.length);
    const safePath = path.split('/').map(encodeURIComponent).join('/');
    return `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/RAC/ACTIVITIES/${safePath}`;
  }

  const eventMonth = (event) => event?.date?.split(' ')[0] ?? '';
  const eventDay = (event) => event?.date?.split(' ')[1] ?? '';

  function openEventModal(index: number) {
    selectedEventIndex = index;
    document.body.style.overflow = 'hidden';
  }

  function closeEventModal() {
    selectedEventIndex = null;
    document.body.style.overflow = '';
  }

  function showPreviousEvent() {
    if (!EVENTS.length || selectedEventIndex === null) return;
    selectedEventIndex = (selectedEventIndex - 1 + EVENTS.length) % EVENTS.length;
  }

  function showNextEvent() {
    if (!EVENTS.length || selectedEventIndex === null) return;
    selectedEventIndex = (selectedEventIndex + 1) % EVENTS.length;
  }

  function handleModalKeydown(event) {
    if (!activeEvent) return;
    if (event.key === 'Escape') closeEventModal();
    if (event.key === 'ArrowLeft') showPreviousEvent();
    if (event.key === 'ArrowRight') showNextEvent();
  }

  function handleTouchStart(event) {
    const touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }

  function handleTouchEnd(event) {
    const touch = event.changedTouches[0];
    const diffX = touch.clientX - touchStartX;
    const diffY = touch.clientY - touchStartY;
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
      diffX > 0 ? showPreviousEvent() : showNextEvent();
    }
    touchStartX = 0;
    touchStartY = 0;
  }
</script>

<svelte:head>
  <title>Events & Sessions — Rotaract Portal</title>
  <meta name="robots" content="noindex, nofollow" />
  <meta name="description" content="Upcoming events and sessions for Rotaract Club of Lilongwe members." />
</svelte:head>

<svelte:window on:keydown={handleModalKeydown} />

<section class="events-section">
  <div class="events-container">
    <div class="events-header">
      <div>
        <span class="events-chip">Upcoming</span>
        <h2 class="events-title">Events & <span>Sessions</span></h2>
      </div>
    </div>

    <div class="events-carousel">
      {#if EVENTS.length === 0}
        {#each Array(3) as _}
          <article class="event-card skeleton-event">
            <div class="event-card-header"><div class="skel skel-event-tag"></div><div class="skel skel-event-date"></div></div>
            <div class="skel skel-event-title"></div>
            <div class="skel skel-event-speaker"></div>
            <div class="event-details"><div class="skel skel-event-detail"></div><div class="skel skel-event-detail"></div></div>
          </article>
        {/each}
      {:else}
        {#each EVENTS as event, index}
          <button
            type="button"
            class="event-card"
            style={`background-image: url('${eventPoster(event)}'); background-position: center; background-size: contain; background-blend-mode: multiply;`}
            aria-label={`View poster and details for ${event.title}`}
            on:click={() => openEventModal(index)}
          >
            <div class="event-card-header">
              <span class="event-tag">{event.tags}</span>
              <div class="event-date"><div class="event-day">{eventDay(event)}</div><div class="event-month">{eventMonth(event)}</div></div>
            </div>
            <h3 class="event-title">{event.title}</h3>
            <p class="event-speaker">{event.events_speaker ?? event.speaker}</p>
            <div class="event-details">
              <div class="event-detail-item"><Clock class="detail-icon" /> {event.activity_date} - {event.activity_time}</div>
              <div class="event-detail-item"><MapPin class="detail-icon" /> {event.location_name}</div>
            </div>
            <span class="event-rsvp-btn">View poster <ArrowRight /></span>
          </button>
        {/each}
      {/if}
    </div>
  </div>
</section>

{#if activeEvent}
  <div class="event-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
    <button type="button" class="event-modal-backdrop" aria-label="Close event popup" on:click={closeEventModal}></button>
    <div class="event-modal-shell" role="document" on:touchstart={handleTouchStart} on:touchend={handleTouchEnd}>
      <button type="button" class="event-modal-close" aria-label="Close event popup" on:click={closeEventModal}><X size={22} /></button>
      <div class="event-modal-poster-wrap">
        <img class="event-modal-poster" src={eventPoster(activeEvent)} alt={activeEvent.title ? `${activeEvent.title} event poster` : 'Event poster'} />
      </div>
      <div class="event-modal-details-panel">
        <div class="event-modal-meta-row">
          <span class="event-tag">{activeEvent.tags}</span>
          <div class="event-modal-date"><div class="event-day">{eventDay(activeEvent)}</div><div class="event-month">{eventMonth(activeEvent)}</div></div>
        </div>
        <h3 id="event-modal-title" class="event-modal-title">{activeEvent.title}</h3>
        <p class="event-modal-speaker">{activeEvent.events_speaker ?? activeEvent.speaker}</p>
        <div class="event-modal-details">
          <div class="event-modal-detail-item"><Clock class="detail-icon" /> {activeEvent.activity_time}</div>
          <div class="event-modal-detail-item"><MapPin class="detail-icon" /> {activeEvent.location_name}</div>
        </div>
        <div class="event-modal-controls">
          <button type="button" class="event-modal-nav" aria-label="Previous event" on:click={showPreviousEvent}><ChevronLeft size={20} /></button>
          <span class="event-modal-count">{selectedEventIndex + 1} / {EVENTS.length}</span>
          <button type="button" class="event-modal-nav" aria-label="Next event" on:click={showNextEvent}><ChevronRight size={20} /></button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .events-section { min-height: calc(100vh - 64px); background: var(--cream); padding: var(--space-10) 5vw var(--space-16); }
  .events-container { max-width: 1200px; margin: 0 auto; }
  .events-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 48px; flex-wrap: wrap; gap: 16px; }
  .events-chip { display: inline-block; margin-bottom: 12px; padding: 4px 14px; border-radius: 100px; background: rgba(232,23,93,.1); color: var(--primary); font-size: 11px; font-weight: 700; letter-spacing: 1.5px; }
  .events-title { color: var(--near-black); font-family: var(--font-display); font-size: clamp(36px, 5vw, 64px); line-height: 1; }
  .events-title span { margin-left: 12px; color: var(--primary); font-family: var(--font-cursive); }
  .events-carousel { display: flex; gap: 24px; overflow-x: auto; padding-bottom: 16px; scroll-snap-type: x mandatory; }
  .event-card { flex: 0 0 320px; min-height: 400px; display: flex; flex-direction: column; position: relative; overflow: hidden; padding: 28px; border: 0; border-radius: 4px; background-color: rgba(26,26,26,.78); color: white; text-align: left; cursor: pointer; scroll-snap-align: start; transition: transform .25s ease, box-shadow .25s ease; }
  .event-card:hover { transform: translateY(-4px); box-shadow: 0 12px 34px rgba(26,26,26,.18); }
  .event-card:focus-visible { outline: 3px solid var(--primary); outline-offset: 4px; }
  .event-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
  .event-tag { padding: 4px 12px; border-radius: 100px; background: rgba(232,23,93,.2); color: var(--primary); font-size: 11px; font-weight: 700; letter-spacing: 1px; }
  .event-date, .event-modal-date { text-align: right; }
  .event-day { color: white; font-family: var(--font-display); font-size: 32px; line-height: 1; }
  .event-month { color: rgba(255,255,255,.4); font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
  .event-title { flex: 1; margin-bottom: 8px; color: white; font-family: var(--font-display); font-size: 22px; line-height: 1.2; }
  .event-speaker { margin-bottom: 20px; color: rgba(255,255,255,.5); font-size: 13px; }
  .event-details { display: flex; flex-direction: column; gap: 8px; }
  .event-detail-item { display: flex; align-items: center; gap: 8px; color: rgba(255,255,255,.6); font-size: 13px; }
  .event-rsvp-btn { display: inline-flex; align-self: flex-start; align-items: center; gap: .5rem; margin-top: 1.25rem; color: var(--primary); font-size: .875rem; font-weight: bold; letter-spacing: .1em; text-transform: uppercase; }
  .event-card:hover .event-rsvp-btn { gap: .75rem; }
  .events-carousel::-webkit-scrollbar { height: 8px; }
  .events-carousel::-webkit-scrollbar-thumb { background: var(--primary); border-radius: 4px; }
  .skel { border-radius: 6px; background: linear-gradient(90deg, rgba(255,255,255,.06) 25%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.06) 75%); background-size: 600px 100%; animation: shimmer 1.6s infinite linear; }
  .skel-event-tag { width: 70px; height: 22px; border-radius: 100px; }
  .skel-event-date { width: 40px; height: 48px; border-radius: 4px; }
  .skel-event-title { width: 80%; height: 22px; margin: 12px 0 8px; }
  .skel-event-speaker { width: 55%; height: 14px; margin-bottom: 16px; }
  .skel-event-detail { width: 100px; height: 14px; }
  .event-modal { position: fixed; inset: 0; z-index: 300; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .event-modal-backdrop { position: absolute; inset: 0; width: 100%; height: 100%; background: rgba(0,0,0,.74); backdrop-filter: blur(8px); cursor: pointer; }
  .event-modal-shell { position: relative; z-index: 1; width: min(680px, 100%); max-height: 85vh; overflow-y: auto; border-radius: 4px; background: var(--cream); box-shadow: 0 30px 90px rgba(0,0,0,.42); touch-action: pan-y; }
  .event-modal-close, .event-modal-nav { display: inline-flex; align-items: center; justify-content: center; color: white; cursor: pointer; }
  .event-modal-close { position: absolute; top: 12px; right: 12px; z-index: 2; width: 40px; height: 40px; border-radius: 50%; background: rgba(26,26,26,.86); }
  .event-modal-close:hover, .event-modal-nav:hover { background: var(--primary); }
  .event-modal-poster-wrap { min-height: 320px; display: flex; align-items: center; justify-content: center; padding: 18px; background: #111; }
  .event-modal-poster { display: block; max-width: 100%; max-height: min(62vh, 680px); width: auto; height: auto; object-fit: contain; }
  .event-modal-details-panel { padding: 28px; background: var(--cream); }
  .event-modal-meta-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
  .event-modal-date .event-day { color: var(--near-black); }
  .event-modal-date .event-month { color: rgba(26,26,26,.55); }
  .event-modal-title { margin-bottom: 10px; color: var(--near-black); font-family: var(--font-display); font-size: clamp(28px, 5vw, 44px); line-height: 1.05; }
  .event-modal-speaker { margin-bottom: 20px; color: rgba(26,26,26,.62); font-size: 14px; line-height: 1.6; }
  .event-modal-details { display: grid; gap: 10px; margin-bottom: 24px; }
  .event-modal-detail-item { display: flex; align-items: center; gap: 10px; color: rgba(26,26,26,.68); font-size: 14px; font-weight: 700; }
  .event-modal-detail-item :global(.detail-icon) { color: var(--primary); width: 18px; height: 18px; }
  .event-modal-controls { display: flex; align-items: center; justify-content: center; gap: 18px; padding-top: 20px; border-top: 1px solid rgba(26,26,26,.09); }
  .event-modal-nav { width: 42px; height: 42px; border-radius: 50%; background: var(--near-black); }
  .event-modal-count { min-width: 56px; color: rgba(26,26,26,.52); font-size: 12px; font-weight: 800; letter-spacing: 1px; text-align: center; }
  @media (max-width: 560px) { .events-section { padding-inline: var(--space-4); } .event-card { flex-basis: min(320px, calc(100vw - 2rem)); } .event-modal { padding: 12px; } }

  .events-section { min-height: 0; padding: 0; background: transparent; }
  .events-container { max-width: 1180px; }
  .events-header { align-items: center; margin-bottom: 22px; }
  .events-chip { margin-bottom: 8px; background: #fce8ef; color: var(--primary); }
  .events-title { color: #101828; font-family: var(--font-display); font-size: clamp(1.45rem, 3vw, 2rem); letter-spacing: -.045em; }
  .events-title span { margin-left: 4px; color: var(--primary); font-family: var(--font-display); }
  .events-carousel { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; overflow: visible; padding: 0; }
  .event-card { min-height: 250px; flex: none; padding: 20px; border-radius: 16px; background-color: #17253d; box-shadow: var(--shadow-sm); }
  .event-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
  .event-card-header { margin-bottom: 26px; }
  .event-title { font-family: var(--font-display); font-size: 1.1rem; letter-spacing: -.025em; }
  .event-speaker { font-size: .75rem; }
  .event-detail-item { font-size: .72rem; }
  .event-rsvp-btn { margin-top: 18px; font-size: .7rem; letter-spacing: .06em; }
  @media (max-width: 900px) { .events-carousel { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 560px) { .events-carousel { grid-template-columns: 1fr; } .event-card { min-height: 220px; } }
</style>
