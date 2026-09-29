<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import type { Project } from '$lib/data/induction-projects';

  export let selectedProject: Project | null = null;
  export let modalImageIndex = 0;

  function closeModal() {
    selectedProject = null;
    modalImageIndex = 0;
    document.body.style.overflow = '';
  }

  function handleModalImageNav(dir: number) {
    if (!selectedProject) return;
    const len = selectedProject.images.length;
    modalImageIndex = (modalImageIndex + dir + len) % len;
  }

  function handleOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      closeModal();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft' && selectedProject) handleModalImageNav(-1);
    if (e.key === 'ArrowRight' && selectedProject) handleModalImageNav(1);
  }

  import { onMount, onDestroy } from 'svelte';

  onMount(() => {
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });

  onDestroy(() => {
    document.body.style.overflow = '';
  });
</script>

{#if selectedProject}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="modal-overlay" on:click={handleOverlayClick} transition:fade={{ duration: 200 }}>
    <div class="modal-container" transition:scale={{ start: 0.95, duration: 200 }}>
      <button class="modal-close" on:click={closeModal} aria-label="Close modal">✕</button>

      <div class="modal-scroll">
        <!-- Modal Image Gallery -->
        {#if selectedProject.images && selectedProject.images.length > 0}
          <div class="modal-gallery">
            <div class="modal-img-main" style="background-image:url('{selectedProject.images[modalImageIndex]}')"></div>
            {#if selectedProject.images.length > 1}
              <button class="modal-img-arrow prev" on:click={() => handleModalImageNav(-1)} aria-label="Previous image">‹</button>
              <button class="modal-img-arrow next" on:click={() => handleModalImageNav(1)} aria-label="Next image">›</button>
              <div class="modal-img-dots">
                {#each selectedProject.images as _, i}
                  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
                  <span class:active={i === modalImageIndex} on:click={() => modalImageIndex = i}></span>
                {/each}
              </div>
              <div class="modal-img-counter">{modalImageIndex + 1} / {selectedProject.images.length}</div>
            {/if}
          </div>
        {/if}

        <!-- Modal Content -->
        <div class="modal-content">
          <div class="modal-header">
            <span class="modal-tag">{selectedProject.quarter}</span>
            <h2 class="modal-title">{selectedProject.title}</h2>
          </div>

          <!-- Meta Info -->
          <div class="modal-meta">
            {#if selectedProject.details.date}
              <div class="modal-meta-item">
                <span class="meta-icon">📅</span>
                <span>{selectedProject.details.date}</span>
              </div>
            {/if}
            {#if selectedProject.details.time}
              <div class="modal-meta-item">
                <span class="meta-icon">⏰</span>
                <span>{selectedProject.details.time}</span>
              </div>
            {/if}
            {#if selectedProject.details.venue}
              <div class="modal-meta-item">
                <span class="meta-icon">📍</span>
                <span>{selectedProject.details.venue}</span>
              </div>
            {/if}
            {#if selectedProject.details.areaOfFocus}
              <div class="modal-meta-item">
                <span class="meta-icon">🎯</span>
                <span>{selectedProject.details.areaOfFocus}</span>
              </div>
            {/if}
            {#if selectedProject.details.objective}
              <div class="modal-meta-item">
                <span class="meta-icon">🎯</span>
                <span>{selectedProject.details.objective}</span>
              </div>
            {/if}
          </div>

          <!-- Full Description -->
          <div class="modal-section">
            <h3 class="modal-section-title">About This Project</h3>
            <p class="modal-text">{selectedProject.details.fullDescription}</p>
          </div>

          <!-- Highlights -->
          {#if selectedProject.details.highlights && selectedProject.details.highlights.length > 0}
            <div class="modal-section">
              <h3 class="modal-section-title">Key Highlights</h3>
              <ul class="modal-list">
                {#each selectedProject.details.highlights as highlight}
                  <li>{highlight}</li>
                {/each}
              </ul>
            </div>
          {/if}

          <!-- Key Learnings -->
          {#if selectedProject.details.keyLearnings && selectedProject.details.keyLearnings.length > 0}
            <div class="modal-section">
              <h3 class="modal-section-title">Key Learnings</h3>
              <ul class="modal-list">
                {#each selectedProject.details.keyLearnings as learning}
                  <li>{learning}</li>
                {/each}
              </ul>
            </div>
          {/if}

          <!-- Awards -->
          {#if selectedProject.details.awards && selectedProject.details.awards.length > 0}
            <div class="modal-section">
              <h3 class="modal-section-title">Awards & Recognition</h3>
              <div class="modal-awards">
                {#each selectedProject.details.awards as award}
                  <span class="modal-award-badge">{award}</span>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Activities -->
          {#if selectedProject.details.activities && selectedProject.details.activities.length > 0}
            <div class="modal-section">
              <h3 class="modal-section-title">Activities Conducted</h3>
              <ul class="modal-list">
                {#each selectedProject.details.activities as activity}
                  <li>{activity}</li>
                {/each}
              </ul>
            </div>
          {/if}

          <!-- Impact -->
          <div class="modal-section modal-impact-section">
            <h3 class="modal-section-title">Impact</h3>
            <p class="modal-text">{selectedProject.details.fullImpact}</p>
          </div>

          <!-- Challenges -->
          {#if selectedProject.details.challenges}
            <div class="modal-section modal-challenge-section">
              <h3 class="modal-section-title">Challenges</h3>
              <p class="modal-text">{selectedProject.details.challenges}</p>
            </div>
          {/if}

          <!-- Call to Action -->
          {#if selectedProject.details.callToAction}
            <div class="modal-section modal-cta-section">
              <h3 class="modal-section-title">Call to Action</h3>
              <p class="modal-text">{selectedProject.details.callToAction}</p>
            </div>
          {/if}

          <!-- Note -->
          {#if selectedProject.note}
            <div class="modal-section modal-note-section">
              <p class="modal-text">{selectedProject.note}</p>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  :root{
    --ink:#221d16;
    --ink-soft:#4a4238;
    --cream:#f2ead9;
    --cream-deep:#e7dabd;
    --card:#fffcf5;
    --pink:#c4276b;
    --pink-deep:#9c1c54;
    --gold:#dd9a3b;
    --sage:#93a78f;
    --olive:#6c6a3d;
    --olive2:#a6a066;
    --terracotta:#c97462;
    --blush:#e7c7b7;
    --sand:#e9d8bc;
    --line:rgba(34,29,22,.14);
    --radius:0;
  }
  .modal-overlay{
    position:fixed;
    inset:0;
    z-index:1000;
    background:rgba(0,0,0,.65);
    display:flex;
    align-items:center;
    justify-content:center;
    padding:20px;
    backdrop-filter:blur(4px);
  }
  .modal-container{
    background:var(--card);
    max-width:800px;
    width:100%;
    max-height:90vh;
    border-radius:var(--radius);
    overflow:hidden;
    display:flex;
    flex-direction:column;
    position:relative;
    box-shadow:0 40px 80px rgba(0,0,0,.5);
  }
  .modal-close{
    position:absolute;
    top:12px;
    right:12px;
    z-index:10;
    width:36px;
    height:36px;
    border-radius:50%;
    background:rgba(0,0,0,.5);
    color:#fff;
    border:none;
    font-size:1.1rem;
    cursor:pointer;
    display:flex;
    align-items:center;
    justify-content:center;
    transition:background .2s;
  }
  .modal-close:hover{
    background:var(--pink);
  }
  .modal-scroll{
    overflow-y:auto;
    flex:1;
  }
  .modal-scroll::-webkit-scrollbar{
    width:6px;
  }
  .modal-scroll::-webkit-scrollbar-track{
    background:var(--cream);
  }
  .modal-scroll::-webkit-scrollbar-thumb{
    background:var(--olive2);
    border-radius:3px;
  }

  /* Modal Gallery */
  .modal-gallery{
    position:relative;
    width:100%;
    aspect-ratio:16/9;
    background:linear-gradient(135deg,var(--sand),var(--blush));
    overflow:hidden;
  }
  .modal-img-main{
    position:absolute;
    inset:0;
    background-size:cover;
    background-position:center;
    transition:background-image .4s ease;
  }
  .modal-img-arrow{
    position:absolute;
    top:50%;
    transform:translateY(-50%);
    width:40px;
    height:40px;
    border-radius:50%;
    background:rgba(255,255,255,.85);
    border:none;
    display:flex;
    align-items:center;
    justify-content:center;
    cursor:pointer;
    color:var(--ink);
    font-size:1.3rem;
    box-shadow:0 4px 12px rgba(0,0,0,.2);
    transition:background .2s;
  }
  .modal-img-arrow:hover{
    background:#fff;
  }
  .modal-img-arrow.prev{left:12px;}
  .modal-img-arrow.next{right:12px;}
  .modal-img-dots{
    position:absolute;
    bottom:12px;
    left:0;
    right:0;
    display:flex;
    justify-content:center;
    gap:6px;
  }
  .modal-img-dots span{
    width:8px;
    height:8px;
    border-radius:50%;
    background:rgba(255,255,255,.5);
    cursor:pointer;
    transition:all .2s;
  }
  .modal-img-dots span.active{
    background:#fff;
    width:20px;
    border-radius:4px;
  }
  .modal-img-counter{
    position:absolute;
    bottom:12px;
    right:12px;
    background:rgba(0,0,0,.5);
    color:#fff;
    font-size:.75rem;
    padding:4px 10px;
    border-radius:12px;
    font-family:'Poppins',sans-serif;
  }

  /* Modal Content */
  .modal-content{
    padding:28px 30px 36px;
  }
  .modal-header{
    margin-bottom:20px;
  }
  .modal-tag{
    display:inline-block;
    font-size:.7rem;
    letter-spacing:.1em;
    text-transform:uppercase;
    color:#fff;
    background:var(--pink);
    padding:4px 10px;
    font-weight:600;
    margin-bottom:10px;
  }
  .modal-title{
    font-size:1.6rem;
    font-weight:700;
    color:var(--ink);
    line-height:1.25;
    font-family:'Poppins',sans-serif;
  }

  .modal-meta{
    display:flex;
    flex-wrap:wrap;
    gap:10px;
    margin-bottom:24px;
    padding-bottom:20px;
    border-bottom:1px solid var(--line);
  }
  .modal-meta-item{
    display:flex;
    align-items:center;
    gap:6px;
    font-size:.85rem;
    color:var(--ink-soft);
    background:var(--cream);
    padding:6px 12px;
    border-radius:var(--radius);
  }
  .meta-icon{
    font-size:1rem;
  }

  .modal-section{
    margin-bottom:22px;
  }
  .modal-section-title{
    font-size:1rem;
    font-weight:700;
    color:var(--pink-deep);
    margin-bottom:8px;
    font-family:'Poppins',sans-serif;
    text-transform:uppercase;
    letter-spacing:.04em;
  }
  .modal-text{
    font-size:.92rem;
    color:var(--ink-soft);
    line-height:1.7;
    margin:0;
  }
  .modal-list{
    margin:0;
    padding:0 0 0 18px;
  }
  .modal-list li{
    font-size:.9rem;
    color:var(--ink-soft);
    line-height:1.6;
    margin-bottom:4px;
  }

  .modal-awards{
    display:flex;
    flex-wrap:wrap;
    gap:8px;
  }
  .modal-award-badge{
    background:linear-gradient(135deg, var(--gold), #c98a2a);
    color:#fff;
    font-size:.78rem;
    font-weight:600;
    padding:6px 14px;
    border-radius:var(--radius);
  }

  .modal-impact-section{
    background:var(--cream);
    border-left:4px solid var(--pink);
    padding:16px 18px;
    margin-bottom:22px;
  }
  .modal-challenge-section{
    background:#fff0e8;
    border-left:4px solid var(--terracotta);
    padding:16px 18px;
    margin-bottom:22px;
  }
  .modal-cta-section{
    background:var(--blush);
    border-left:4px solid var(--olive);
    padding:16px 18px;
    margin-bottom:22px;
  }
  .modal-note-section{
    background:var(--sand);
    border-left:4px solid var(--gold);
    padding:16px 18px;
    font-style:italic;
  }

  @media (max-width:480px){
    .modal-overlay{padding:10px;}
    .modal-content{padding:20px 18px 28px;}
    .modal-title{font-size:1.3rem;}
    .modal-meta{gap:6px;}
  }
</style>