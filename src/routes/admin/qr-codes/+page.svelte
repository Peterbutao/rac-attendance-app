<script lang="ts">
  import { tick } from 'svelte';

  export let data;

  type Filter = 'all' | 'event' | 'project';

  let activeFilter: Filter = 'all';
  let search = '';
  let selectedKey = '';
  let qrMount: HTMLDivElement;
  let qrPayload = '';
  let qrError = '';
  let generating = false;
  let copied = false;

  $: filteredOptions = data.options.filter((option) => {
    const matchesFilter = activeFilter === 'all'
      || (activeFilter === 'project' && option.event_type === 'project')
      || (activeFilter === 'event' && option.event_type !== 'project');
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [option.title, option.event_type, option.event_date]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query);
    return matchesFilter && matchesSearch;
  });

  $: selectedOption = data.options.find((option) => option.event_key === selectedKey) ?? null;

  function formatDate(value: string | null) {
    if (!value) return 'Date to be confirmed';
    return new Date(`${value}T00:00:00`).toLocaleDateString('en-MW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function typeLabel(option) {
    return option.event_type === 'project' ? 'Project' : option.event_type === 'activity' ? 'Activity' : 'Event';
  }

  function slugify(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'attendance';
  }

  async function selectOption(option) {
    selectedKey = option.event_key;
    copied = false;
    await tick();
    await generateQrCode(option);
  }

  async function generateQrCode(option = selectedOption) {
    if (!option || !qrMount) return;

    generating = true;
    qrError = '';
    qrPayload = JSON.stringify({ event_key: option.event_key });

    try {
      const { BrowserQRCodeSvgWriter } = await import('@zxing/browser');
      const writer = new BrowserQRCodeSvgWriter();
      const svg = writer.write(qrPayload, 320, 320);
      qrMount.replaceChildren(svg);
    } catch (error) {
      qrError = error instanceof Error ? error.message : 'Unable to generate the QR code.';
    } finally {
      generating = false;
    }
  }

  async function copyPayload() {
    if (!qrPayload) return;
    await navigator.clipboard.writeText(qrPayload);
    copied = true;
    setTimeout(() => copied = false, 1800);
  }

  function downloadQrCode() {
    const svg = qrMount?.querySelector('svg');
    if (!svg || !selectedOption) return;

    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${slugify(selectedOption.title ?? 'attendance')}-qr.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }
</script>

<svelte:head>
  <title>QR codes - Admin workspace</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="portal-page qr-page">
  <div class="qr-container">
    <div class="screen-intro">
      <span class="screen-intro__eyebrow">Attendance tools</span>
      <h1>Generate QR codes</h1>
      <p>Create a QR code for an event or project. Members scan it from the attendance page, add any invited guest, and submit the record for approval.</p>
    </div>

    <div class="qr-layout">
      <section class="selector-card">
        <div class="card-heading">
          <div>
            <span class="card-kicker">Step 1</span>
            <h2>Choose an event or project</h2>
          </div>
          <span class="result-count">{filteredOptions.length}</span>
        </div>

        <div class="filter-row" role="group" aria-label="Filter QR items">
          <button type="button" class:active={activeFilter === 'all'} on:click={() => activeFilter = 'all'}>All</button>
          <button type="button" class:active={activeFilter === 'event'} on:click={() => activeFilter = 'event'}>Events</button>
          <button type="button" class:active={activeFilter === 'project'} on:click={() => activeFilter = 'project'}>Projects</button>
        </div>

        <label class="search-label" for="qr-search">Search</label>
        <input id="qr-search" class="search-input" type="search" bind:value={search} placeholder="Search by name or date" />

        <div class="option-list">
          {#if filteredOptions.length === 0}
            <p class="empty-state">No matching events or projects were found.</p>
          {:else}
            {#each filteredOptions as option (option.event_key)}
              <button type="button" class:selected={selectedKey === option.event_key} class="option-item" on:click={() => selectOption(option)}>
                <span class="option-icon">{option.event_type === 'project' ? 'P' : 'E'}</span>
                <span class="option-copy">
                  <strong>{option.title ?? 'Untitled item'}</strong>
                  <small>{typeLabel(option)} · {formatDate(option.event_date)}</small>
                </span>
                <span class="option-arrow">›</span>
              </button>
            {/each}
          {/if}
        </div>
      </section>

      <section class="preview-card qr-print-card">
        <div class="card-heading">
          <div>
            <span class="card-kicker">Step 2</span>
            <h2>QR preview</h2>
          </div>
          {#if selectedOption}<span class="ready-badge">Ready to print</span>{/if}
        </div>

        {#if selectedOption}
          <div class="selected-item">
            <strong>{selectedOption.title ?? 'Untitled item'}</strong>
            <span>{typeLabel(selectedOption)} · {formatDate(selectedOption.event_date)}</span>
          </div>

          <div class="qr-stage" aria-live="polite">
            <div bind:this={qrMount} class="qr-code"></div>
            {#if generating}<span class="qr-loading">Generating...</span>{/if}
          </div>

          {#if qrError}<p class="error-copy">{qrError}</p>{/if}

          <div class="qr-actions">
            <button type="button" class="btn btn--primary" on:click={downloadQrCode} disabled={generating}>Download SVG</button>
            <button type="button" class="btn btn--outline" on:click={() => window.print()} disabled={generating}>Print</button>
            <button type="button" class="btn btn--ghost" on:click={copyPayload}>{copied ? 'Copied' : 'Copy code'}</button>
          </div>

          <p class="qr-help">Place this code where members can scan it. The QR code contains only the event key; approval still happens through the attendance workflow.</p>
        {:else}
          <div class="preview-empty">
            <div class="preview-empty__icon">⌁</div>
            <strong>Select an item to generate its QR code</strong>
            <p>The generated code will be linked to the selected attendance item.</p>
          </div>
        {/if}
      </section>
    </div>
  </div>
</div>

<style>
  .qr-page { min-height: 100%; }
  .qr-container { width: min(1180px, 100%); margin: 0 auto; }
  .screen-intro { margin-bottom: 24px; }
  .screen-intro__eyebrow, .card-kicker { color: var(--primary); font-size: .66rem; font-weight: 850; letter-spacing: .13em; text-transform: uppercase; }
  h1 { margin: 7px 0 6px; color: #101828; font-size: clamp(1.45rem, 3vw, 2rem); letter-spacing: -.045em; }
  .screen-intro p { max-width: 680px; color: #667085; font-size: .84rem; line-height: 1.55; }
  .qr-layout { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(320px, .8fr); gap: 22px; align-items: start; }
  .selector-card, .preview-card { padding: 22px; border: 1px solid #e5eaf1; border-radius: 18px; background: #fff; box-shadow: var(--shadow-sm); }
  .card-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
  h2 { margin-top: 6px; color: #101828; font-size: 1.05rem; letter-spacing: -.035em; }
  .result-count, .ready-badge { display: inline-flex; align-items: center; min-height: 26px; padding: 0 9px; border-radius: 999px; background: #fce8ef; color: var(--primary); font-size: .7rem; font-weight: 800; }
  .ready-badge { background: #f0fbf4; color: #227044; }
  .filter-row { display: flex; gap: 7px; margin-bottom: 18px; }
  .filter-row button { padding: 7px 11px; border: 1px solid #e5eaf1; border-radius: 8px; background: #f8fafc; color: #667085; cursor: pointer; font: inherit; font-size: .72rem; font-weight: 750; }
  .filter-row button.active { border-color: var(--primary); background: #fce8ef; color: var(--primary); }
  .search-label { display: block; margin-bottom: 6px; color: #475467; font-size: .72rem; font-weight: 750; }
  .search-input { width: 100%; box-sizing: border-box; padding: 11px 12px; border: 1px solid #e5eaf1; border-radius: 9px; background: #f8fafc; color: #101828; font: inherit; font-size: .8rem; }
  .search-input:focus { outline: 2px solid rgba(216,63,106,.2); border-color: var(--primary); }
  .option-list { display: grid; gap: 8px; max-height: 510px; margin-top: 15px; overflow-y: auto; padding-right: 3px; }
  .option-item { display: flex; align-items: center; gap: 11px; width: 100%; padding: 11px; border: 1px solid #edf0f4; border-radius: 11px; background: #fff; color: #101828; cursor: pointer; text-align: left; transition: border-color .16s ease, background .16s ease, transform .16s ease; }
  .option-item:hover { border-color: #f0b3c5; background: #fff8fa; transform: translateY(-1px); }
  .option-item.selected { border-color: var(--primary); background: #fff5f8; box-shadow: inset 3px 0 0 var(--primary); }
  .option-icon { display: grid; place-items: center; width: 30px; height: 30px; flex: 0 0 30px; border-radius: 9px; background: #17253d; color: #ff86a8; font-size: .7rem; font-weight: 850; }
  .option-item.selected .option-icon { background: var(--primary); color: #fff; }
  .option-copy { display: grid; min-width: 0; flex: 1; gap: 3px; }
  .option-copy strong { overflow: hidden; font-size: .78rem; text-overflow: ellipsis; white-space: nowrap; }
  .option-copy small { color: #667085; font-size: .68rem; }
  .option-arrow { color: #98a2b3; font-size: 1.3rem; line-height: 1; }
  .empty-state, .qr-help, .preview-empty p { color: #667085; font-size: .78rem; line-height: 1.5; }
  .preview-card { position: sticky; top: 106px; }
  .selected-item { display: grid; gap: 4px; margin-bottom: 16px; padding: 12px; border-radius: 10px; background: #f8fafc; }
  .selected-item strong { color: #101828; font-size: .82rem; }
  .selected-item span { color: #667085; font-size: .7rem; }
  .qr-stage { display: grid; min-height: 330px; place-items: center; border-radius: 14px; background: #f8fafc; }
  .qr-code { display: grid; place-items: center; width: 320px; max-width: 100%; min-height: 320px; padding: 12px; box-sizing: border-box; background: #fff; }
  .qr-code :global(svg) { display: block; width: 100%; height: auto; }
  .qr-loading { position: absolute; color: #667085; font-size: .75rem; }
  .qr-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
  .qr-actions .btn { min-height: 38px; padding: 0 12px; font-size: .72rem; }
  .qr-help { margin-top: 16px; }
  .error-copy { margin-top: 10px; color: #b42318; font-size: .75rem; }
  .preview-empty { display: grid; min-height: 430px; place-items: center; align-content: center; gap: 8px; padding: 24px; text-align: center; }
  .preview-empty__icon { display: grid; place-items: center; width: 58px; height: 58px; margin-bottom: 8px; border-radius: 17px; background: #fce8ef; color: var(--primary); font-size: 2rem; transform: rotate(45deg); }
  .preview-empty__icon::first-letter { transform: rotate(-45deg); }
  .preview-empty strong { color: #101828; font-size: .84rem; }
  @media (max-width: 850px) { .qr-layout { grid-template-columns: 1fr; } .preview-card { position: static; } }
  @media (max-width: 560px) { .selector-card, .preview-card { padding: 17px; border-radius: 15px; } .qr-actions .btn { flex: 1 1 auto; } .qr-stage { min-height: 280px; } .qr-code { width: 280px; min-height: 280px; } .preview-empty { min-height: 300px; } }
  @media print { :global(body) { background: #fff; } :global(body > div > *) { visibility: hidden; } .qr-print-card, .qr-print-card * { visibility: visible; } .qr-print-card { position: absolute; inset: 0; width: 100%; border: 0; box-shadow: none; } .qr-print-card .card-heading, .qr-print-card .selected-item, .qr-print-card .qr-stage { display: grid; } .qr-print-card .qr-actions, .qr-print-card .qr-help { display: none; } .qr-stage { background: #fff; } }
</style>
