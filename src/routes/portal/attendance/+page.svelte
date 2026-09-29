<script lang="ts">
  import { onDestroy, tick } from 'svelte';
  import { CheckCircle2, ClipboardCheck, Clock3, QrCode, UsersRound, XCircle } from 'lucide-svelte';
  import { Capacitor } from '@capacitor/core';
  import { Camera } from '@capacitor/camera';
  import type { BrowserQRCodeReader as BrowserQRCodeReaderType, IScannerControls } from '@zxing/browser';

  export let data;
  export let form;

  let selectedEventKey = '';
  let attendanceCategory = 'event';
  let guestInvited = false;
  let scannerOpen = false;
  let scannerStarting = false;
  let scannerMessage = '';
  let scannerVideo: HTMLVideoElement;
  let scannerReader: BrowserQRCodeReaderType | null = null;
  let scannerControls: IScannerControls | null = null;
  let releaseScannerStreams: (() => void) | null = null;
  let scannerSession = 0;

  $: availableOptions = data.events.filter((event) => attendanceCategory === 'project'
    ? event.event_type === 'project'
    : event.event_type !== 'project');
  $: selectedEvent = availableOptions.find((event) => event.event_key === selectedEventKey);
  $: requiresHours = selectedEvent?.event_type === 'activity' || selectedEvent?.event_type === 'project';

  function formatDate(value: string | null) {
    if (!value) return 'Date to be confirmed';
    return new Date(`${value}T00:00:00`).toLocaleDateString('en-MW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function setAttendanceCategory(value: string) {
    attendanceCategory = value;
    selectedEventKey = '';
    scannerMessage = '';
  }

  function extractEventKey(value: string) {
    const rawValue = value.trim();
    if (!rawValue) return '';

    try {
      const payload = JSON.parse(rawValue);
      const key = payload?.event_key ?? payload?.eventKey ?? payload?.event;
      if (key) return String(key);
    } catch {
      // QR codes may contain a plain event key or URL instead of JSON.
    }

    if (/^(https?:\/\/|rac-attendance:)/i.test(rawValue)) {
      try {
        const url = new URL(rawValue);
        const queryKey = url.searchParams.get('event_key') ?? url.searchParams.get('event');
        if (queryKey) return queryKey;

        const pathParts = url.pathname.split('/').filter(Boolean);
        const eventPartIndex = pathParts.findIndex((part) => part === 'event' || part === 'attendance');
        if (eventPartIndex >= 0 && pathParts[eventPartIndex + 1]) {
          return decodeURIComponent(pathParts[eventPartIndex + 1]);
        }

        if (url.hostname === 'event' && url.pathname.length > 1) {
          return decodeURIComponent(url.pathname.slice(1));
        }
      } catch {
        return rawValue;
      }
    }

    return rawValue;
  }

  function stopQrScanner() {
    scannerSession += 1;
    scannerControls?.stop();
    scannerControls = null;
    releaseScannerStreams?.();
    releaseScannerStreams = null;
    scannerReader = null;
    scannerStarting = false;
    scannerOpen = false;
  }

  function handleQrValue(value: string) {
    const eventKey = extractEventKey(value);
    const matchedEvent = data.events.find((event) => String(event.event_key) === eventKey);

    if (!matchedEvent) {
      scannerMessage = 'This QR code is not available for attendance.';
      return;
    }

    attendanceCategory = matchedEvent.event_type === 'project' ? 'project' : 'event';
    selectedEventKey = matchedEvent.event_key;
    scannerMessage = `Selected: ${matchedEvent.title ?? 'Attendance item'}`;
    stopQrScanner();
  }

  async function requestCameraAccess() {
    if (!Capacitor.isNativePlatform()) return true;

    const current = await Camera.checkPermissions();
    if (current.camera === 'granted') return true;

    const requested = await Camera.requestPermissions({ permissions: ['camera'] });
    return requested.camera === 'granted';
  }

  async function startQrScanner() {
    scannerMessage = '';
    scannerOpen = true;
    scannerStarting = true;
    const session = ++scannerSession;

    await tick();

    try {
      const cameraAllowed = await requestCameraAccess();
      if (!cameraAllowed) {
        scannerStarting = false;
        scannerOpen = false;
        scannerMessage = 'Camera permission is required to scan a QR code. You can choose the item manually.';
        return;
      }

      const { BrowserCodeReader, BrowserQRCodeReader } = await import('@zxing/browser');
      releaseScannerStreams = () => BrowserCodeReader.releaseAllStreams();
      scannerReader = new BrowserQRCodeReader();
      const cameras = await BrowserQRCodeReader.listVideoInputDevices();
      const preferredCamera = cameras.find((camera) => /back|rear|environment/i.test(camera.label));
      const controls = await scannerReader.decodeFromVideoDevice(
        preferredCamera?.deviceId,
        scannerVideo,
        (result) => {
          if (result) handleQrValue(result.getText());
        }
      );

      if (session !== scannerSession) {
        controls.stop();
        return;
      }

      scannerControls = controls;
      scannerStarting = false;
    } catch (error) {
      if (session !== scannerSession) return;
      scannerStarting = false;
      scannerMessage = error instanceof DOMException && error.name === 'NotAllowedError'
        ? 'Camera access was blocked. Allow camera access in Android settings, then try again.'
        : 'QR scanning is unavailable on this device. Choose the item manually instead.';
    }
  }

  onDestroy(stopQrScanner);
</script>

<svelte:head>
  <title>Attendance - Rotaract Portal</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="portal-page attendance-page">
  <div class="attendance-container">

    {#if form?.error}
      <div class="alert alert--error"><XCircle size={17} />{form.error}</div>
    {/if}
    {#if form?.success}
      <div class="alert alert--success"><CheckCircle2 size={17} />Attendance sent for approval.</div>
    {/if}

    <div class="attendance-layout">
      <section class="form-card">
        

        {#if data.events.length === 0}
          <div class="empty-state">There are no events or projects available yet.</div>
        {:else}
          <form method="POST" action="?/submitAttendance">
            <input type="hidden" name="attendance_category" value={attendanceCategory} />

            <div class="field-block">
              <span class="field-label">Type</span>
              <div class="segmented-control" role="group" aria-label="Attendance type">
                <button type="button" class:active={attendanceCategory === 'event'} on:click={() => setAttendanceCategory('event')}>Event or activity</button>
                <button type="button" class:active={attendanceCategory === 'project'} on:click={() => setAttendanceCategory('project')}>Project</button>
              </div>
            </div>

            <div class="field-block">
              <label class="field-label" for="event_key">{attendanceCategory === 'project' ? 'Project' : 'Event or activity'}</label>
              <div class="selection-row">
                <select id="event_key" name="event_key" bind:value={selectedEventKey} required>
                  <option value="">Select {attendanceCategory === 'project' ? 'a project' : 'an event or activity'}</option>
                  {#each availableOptions as option}
                    <option value={option.event_key}>
                      {option.title ?? (attendanceCategory === 'project' ? 'Untitled project' : 'Untitled event')} · {formatDate(option.event_date)}
                    </option>
                  {/each}
                </select>
                <button type="button" class="scan-button" on:click={startQrScanner} disabled={scannerStarting}>
                  <QrCode size={16} />{scannerStarting ? 'Opening' : 'Scan QR'}
                </button>
              </div>
            </div>

            {#if scannerOpen}
              <div class="scanner-panel">
                <div class="scanner-panel__top">
                  <div><strong>Scan the event code</strong><small>Point your camera at the QR code.</small></div>
                  <button type="button" class="scanner-close" on:click={stopQrScanner}>Close</button>
                </div>
                <div class="scanner-frame">
                  <video bind:this={scannerVideo} muted playsinline aria-label="QR code scanner preview"></video>
                  <span class="scanner-target" aria-hidden="true"></span>
                  {#if scannerStarting}<span class="scanner-status">Starting camera...</span>{/if}
                </div>
              </div>
            {/if}

            {#if scannerMessage}
              <p class:error-copy={scannerMessage.startsWith('This QR') || scannerMessage.startsWith('Camera') || scannerMessage.startsWith('QR scanning')} class="scanner-message">{scannerMessage}</p>
            {/if}

            {#if selectedEvent}
              <div class="selected-item">
                <CheckCircle2 size={17} />
                <div><strong>{selectedEvent.title ?? 'Untitled event'}</strong><span>{selectedEvent.event_type} · {formatDate(selectedEvent.event_date)}</span></div>
              </div>
            {/if}

            {#if requiresHours}
              <div class="field-block">
                <label class="field-label" for="volunteer_hours">Volunteer hours</label>
                <div class="hours-input"><Clock3 size={17} /><input id="volunteer_hours" name="volunteer_hours" type="number" min="0.5" step="0.5" placeholder="0.0" required /><span>hours</span></div>
              </div>
            {/if}

            <fieldset class="guest-box">
              <div class="guest-heading">
                <div><span class="field-label">Invited guest</span><small>{guestInvited ? 'Add their details below' : 'Optional'}</small></div>
                <label class="switch" aria-label="I invited a guest">
                  <input type="checkbox" name="guest_invited" bind:checked={guestInvited} />
                  <span></span>
                </label>
              </div>

              {#if guestInvited}
                <div class="guest-fields">
                  <div class="field-block"><label class="field-label" for="guest_name">Guest name</label><input id="guest_name" name="guest_name" type="text" placeholder="Full name" required /></div>
                  <div class="field-block"><label class="field-label" for="guest_email">Email <em>optional</em></label><input id="guest_email" name="guest_email" type="email" placeholder="guest@example.com" /></div>
                </div>
              {/if}
            </fieldset>

            <button type="submit" class="submit-button" disabled={!selectedEvent}>
              <ClipboardCheck size={18} />Submit for approval
            </button>
          </form>
        {/if}
      </section>

      <aside class="attendance-aside">
       
        <section class="aside-card status-card">
          <span class="card-kicker">Your records</span>
          <strong>{data.pendingAttendance.length}</strong>
          <span>recent submissions</span>
          <p>Approved records become official.</p>
        </section>
      </aside>
    </div>

    <section class="history-card">
      <div class="history-heading">
        <div><span class="card-kicker">Activity log</span><h2>Recent submissions</h2></div>
        <span class="history-count">{data.pendingAttendance.length}</span>
      </div>

      {#if data.pendingAttendance.length === 0}
        <div class="empty-state">No submissions yet.</div>
      {:else}
        <div class="submission-list">
          {#each data.pendingAttendance as submission (submission.id)}
            <article class="submission-item">
              <div class="submission-icon"><ClipboardCheck size={16} /></div>
              <div class="submission-copy">
                <strong>{submission.event_name}</strong>
                <span>{submission.event_type} · {formatDate(submission.event_date)}{submission.volunteer_hours ? ` · ${submission.volunteer_hours} hours` : ''}</span>
                {#if submission.guest_name}<small>Guest: {submission.guest_name}</small>{/if}
                {#if submission.status === 'rejected' && submission.rejection_reason}<small class="rejection-reason">{submission.rejection_reason}</small>{/if}
              </div>
              <span class="status status--{submission.status}">{submission.status}</span>
            </article>
          {/each}
        </div>
      {/if}
    </section>
  </div>
</div>

<style>
  .attendance-page { min-height: 100%; }
  .attendance-container { width: min(1120px, 100%); margin: 0 auto; }
  .attendance-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
  .eyebrow, .card-kicker { color: var(--primary); font-size: .65rem; font-weight: 850; letter-spacing: .13em; text-transform: uppercase; }
  h1 { margin: 6px 0 5px; color: #101828; font-size: clamp(1.55rem, 3vw, 2.1rem); letter-spacing: -.05em; }
  .attendance-head p { color: #667085; font-size: .82rem; }
  .guest-metric { display: grid; grid-template-columns: auto 1fr; align-items: center; column-gap: 8px; min-width: 150px; padding: 12px 14px; border: 1px solid #e5eaf1; border-radius: 13px; background: #fff; box-shadow: var(--shadow-sm); color: var(--primary); }
  .guest-metric span { color: #667085; font-size: .68rem; font-weight: 700; }
  .guest-metric strong { grid-column: 2; color: #101828; font-size: 1.25rem; line-height: 1; }
  .alert { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding: 11px 13px; border-radius: 10px; font-size: .78rem; }
  .alert--error { background: #fff1f0; color: #b42318; }
  .alert--success { background: #f0fbf4; color: #227044; }
  .attendance-layout { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(230px, .7fr); gap: 20px; align-items: start; }
  .form-card, .aside-card, .history-card { border: 1px solid #e5eaf1; border-radius: 17px; background: #fff; box-shadow: var(--shadow-sm); }
  .form-card { padding: 24px; }
  .card-heading { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 22px; }
  .step-number { display: grid; place-items: center; width: 32px; height: 32px; flex: 0 0 32px; border-radius: 10px; background: #fce8ef; color: var(--primary); font-size: .7rem; font-weight: 850; }
  h2 { margin-top: 6px; color: #101828; font-size: 1.02rem; letter-spacing: -.035em; }
  form { display: grid; gap: 18px; }
  .field-block { display: grid; gap: 7px; }
  .field-label { color: #344054; font-size: .74rem; font-weight: 800; }
  .field-label em { color: #98a2b3; font-size: .68rem; font-style: normal; font-weight: 500; }
  .segmented-control { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px; border-radius: 10px; background: #f2f4f7; }
  .segmented-control button { min-height: 38px; border: 0; border-radius: 7px; background: transparent; color: #667085; cursor: pointer; font: inherit; font-size: .74rem; font-weight: 750; }
  .segmented-control button.active { background: #fff; color: var(--primary); box-shadow: 0 2px 7px rgba(16,24,40,.08); }
  select, input { width: 100%; box-sizing: border-box; min-height: 42px; padding: 0 11px; border: 1px solid #dbe3ed; border-radius: 9px; background: #fff; color: #101828; font: inherit; font-size: .78rem; }
  select:focus, input:focus { outline: 2px solid rgba(216,63,106,.18); border-color: var(--primary); }
  .selection-row { display: flex; gap: 8px; }
  .selection-row select { min-width: 0; flex: 1; }
  .scan-button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-width: 96px; padding: 0 12px; border: 1px solid #17253d; border-radius: 9px; background: #17253d; color: #fff; cursor: pointer; font: inherit; font-size: .74rem; font-weight: 800; white-space: nowrap; }
  .scan-button:disabled { cursor: wait; opacity: .6; }
  .scanner-panel { padding: 13px; border-radius: 13px; background: #101828; color: #fff; }
  .scanner-panel__top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
  .scanner-panel__top strong, .scanner-panel__top small { display: block; }
  .scanner-panel__top strong { font-size: .78rem; }
  .scanner-panel__top small { margin-top: 3px; color: rgba(255,255,255,.58); font-size: .68rem; }
  .scanner-close { padding: 5px 8px; border: 1px solid rgba(255,255,255,.25); border-radius: 7px; background: transparent; color: #fff; cursor: pointer; font: inherit; font-size: .68rem; }
  .scanner-frame { position: relative; display: grid; min-height: 230px; overflow: hidden; place-items: center; border-radius: 9px; background: #05070b; }
  .scanner-frame video { display: block; width: 100%; max-height: 330px; aspect-ratio: 4 / 3; object-fit: cover; }
  .scanner-target { position: absolute; width: min(55vw, 190px); aspect-ratio: 1; border: 2px solid #ff86a8; border-radius: 14px; box-shadow: 0 0 0 999px rgba(0,0,0,.2); }
  .scanner-status { position: absolute; bottom: 12px; padding: 6px 9px; border-radius: 6px; background: rgba(0,0,0,.68); font-size: .68rem; }
  .scanner-message { margin-top: -7px; color: #227044; font-size: .72rem; }
  .scanner-message.error-copy { color: #b42318; }
  .selected-item { display: flex; align-items: center; gap: 9px; padding: 11px; border: 1px solid #cfe9da; border-radius: 10px; background: #f4fcf6; color: #227044; }
  .selected-item div { display: grid; gap: 3px; min-width: 0; }
  .selected-item strong { overflow: hidden; color: #185c35; font-size: .76rem; text-overflow: ellipsis; white-space: nowrap; }
  .selected-item span { color: #5a8a6c; font-size: .68rem; text-transform: capitalize; }
  .hours-input { display: flex; align-items: center; gap: 8px; }
  .hours-input :global(svg) { flex: 0 0 auto; color: var(--primary); }
  .hours-input input { flex: 1; }
  .hours-input span { color: #667085; font-size: .72rem; }
  .guest-box { padding: 13px; border: 1px solid #e5eaf1; border-radius: 12px; background: #f8fafc; }
  .guest-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .guest-heading > div { display: grid; gap: 3px; }
  .guest-heading small { color: #98a2b3; font-size: .68rem; }
  .switch { position: relative; display: inline-flex; cursor: pointer; }
  .switch input { position: absolute; width: 1px; height: 1px; opacity: 0; }
  .switch span { width: 38px; height: 22px; border-radius: 999px; background: #d0d5dd; transition: background .16s ease; }
  .switch span::after { display: block; width: 16px; height: 16px; margin: 3px; border-radius: 50%; background: #fff; content: ''; box-shadow: 0 1px 3px rgba(16,24,40,.2); transition: transform .16s ease; }
  .switch input:checked + span { background: var(--primary); }
  .switch input:checked + span::after { transform: translateX(16px); }
  .guest-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 13px; padding-top: 13px; border-top: 1px solid #e5eaf1; }
  .submit-button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 45px; border: 0; border-radius: 10px; background: var(--primary); color: #fff; cursor: pointer; font: inherit; font-size: .78rem; font-weight: 800; box-shadow: 0 7px 16px rgba(216,63,106,.2); }
  .submit-button:hover { background: var(--dark-magenta); }
  .submit-button:disabled { cursor: not-allowed; opacity: .48; }
  .attendance-aside { display: grid; gap: 14px; }
  .aside-card { padding: 19px; }
  .aside-card h2 { margin-bottom: 17px; }
  .steps-card ol { display: grid; gap: 14px; padding: 0; list-style: none; counter-reset: steps; }
  .steps-card li { display: grid; grid-template-columns: 23px 1fr; column-gap: 9px; counter-increment: steps; }
  .steps-card li::before { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 7px; background: #fce8ef; color: var(--primary); content: counter(steps); font-size: .65rem; font-weight: 850; }
  .steps-card li b, .steps-card li span { grid-column: 2; }
  .steps-card li b { margin-top: -22px; color: #344054; font-size: .74rem; }
  .steps-card li span { margin-top: 3px; color: #667085; font-size: .68rem; line-height: 1.4; }
  .status-card { display: grid; gap: 4px; background: #101828; color: #fff; }
  .status-card .card-kicker { color: #ff86a8; }
  .status-card strong { margin-top: 8px; font-size: 2.4rem; line-height: 1; }
  .status-card > span:not(.card-kicker) { color: rgba(255,255,255,.65); font-size: .72rem; }
  .status-card p { margin-top: 10px; color: rgba(255,255,255,.48); font-size: .68rem; }
  .history-card { margin-top: 20px; padding: 21px; }
  .history-heading { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 15px; }
  .history-count { display: grid; place-items: center; min-width: 25px; height: 25px; border-radius: 8px; background: #f2f4f7; color: #667085; font-size: .68rem; font-weight: 800; }
  .submission-list { display: grid; gap: 7px; }
  .submission-item { display: flex; align-items: center; gap: 10px; padding: 11px; border: 1px solid #edf0f4; border-radius: 10px; }
  .submission-icon { display: grid; place-items: center; width: 28px; height: 28px; flex: 0 0 28px; border-radius: 8px; background: #fce8ef; color: var(--primary); }
  .submission-copy { display: grid; min-width: 0; flex: 1; gap: 3px; }
  .submission-copy strong { overflow: hidden; color: #344054; font-size: .75rem; text-overflow: ellipsis; white-space: nowrap; }
  .submission-copy span, .submission-copy small { color: #667085; font-size: .67rem; }
  .submission-copy small { color: #5a8a6c; }
  .rejection-reason { color: #b42318 !important; }
  .status { align-self: flex-start; padding: 5px 7px; border-radius: 999px; font-size: .63rem; font-weight: 800; text-transform: capitalize; }
  .status--pending { background: #fff8e6; color: #9a6700; }
  .status--approved { background: #f0fbf4; color: #227044; }
  .status--rejected { background: #fff1f0; color: #b42318; }
  .empty-state { padding: 20px 0; color: #667085; font-size: .76rem; }
  @media (max-width: 820px) { .attendance-layout { grid-template-columns: 1fr; } .attendance-aside { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 600px) { .attendance-head { display: block; } .guest-metric { width: fit-content; margin-top: 16px; } .form-card, .history-card, .aside-card { padding: 17px; border-radius: 14px; } .attendance-aside { grid-template-columns: 1fr; } .selection-row { display: grid; grid-template-columns: 1fr; } .scan-button { min-height: 42px; } .guest-fields { grid-template-columns: 1fr; } .submission-item { align-items: flex-start; flex-wrap: wrap; } .submission-item .status { margin-left: 38px; } }
</style>
