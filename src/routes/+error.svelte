<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { Search, AlertTriangle, ShieldX, ServerCrash, XCircle } from 'lucide-svelte';
  
  let mounted = false;
  
  onMount(() => {
    mounted = true;
  });
  
  $: status = $page.status;
  $: message = $page.error?.message || 'An unexpected error occurred';
  
  interface ErrorInfo {
    title: string;
    description: string;
    icon: any;
  }
  
  const errorMessages: Record<number, ErrorInfo> = {
    404: {
      title: 'Page Not Found',
      description: "The page you're looking for doesn't exist or has been moved.",
      icon: Search
    },
    500: {
      title: 'Server Error',
      description: 'Something went wrong on our end. Please try again later.',
      icon: AlertTriangle
    },
    403: {
      title: 'Access Denied',
      description: "You don't have permission to access this page.",
      icon: ShieldX
    },
    503: {
      title: 'Service Unavailable',
      description: 'The service is temporarily unavailable. Please try again later.',
      icon: ServerCrash
    }
  };
  
  $: errorInfo = errorMessages[status] ?? {
    title: 'Error',
    description: message,
    icon: XCircle
  };
</script>

<svelte:head>
  <title>{status} - {errorInfo.title} | Rotaract Club of Lilongwe</title>
</svelte:head>

<section class="error-page">
  <div class="error-container">
    <div class="error-icon" role="img" aria-label="Error icon">
      <svelte:component this={errorInfo.icon} size={80} strokeWidth={1.5} />
    </div>
    
    <div class="error-status">{status}</div>
    
    <h1 class="error-title">{errorInfo.title}</h1>
    
    <p class="error-description">{errorInfo.description}</p>
    
    {#if message && message !== errorInfo.description}
      <div class="error-details">
        <code>{message}</code>
      </div>
    {/if}
    
    <div class="error-actions">
      <a href="/" class="btn-primary">Go Home</a>
      <button class="btn-secondary" on:click={() => window.history.back()}>
        Go Back
      </button>
    </div>
    
    <div class="error-help">
      <p>Need help? <a href="/contact">Contact us</a> or visit our <a href="/about">about page</a>.</p>
    </div>
  </div>
  
  <div class="error-decoration">
    <div class="decoration-circle circle-1"></div>
    <div class="decoration-circle circle-2"></div>
    <div class="decoration-circle circle-3"></div>
  </div>
</section>

<style>
  :global(:root) {
    --primary: #E8175D;
    --primary-dark: #c91450;
    --cream: #FDF8F5;
    --near-black: #1a1a1a;
    --orange: #F7A13A;
    --font-display: 'Playfair Display', Georgia, serif;
    --font-jakarta: 'Plus Jakarta Sans', system-ui, sans-serif;
    --font-cursive: 'Dancing Script', cursive;
  }
  
  .error-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--near-black);
    position: relative;
    overflow: hidden;
    padding: 24px;
    margin-top: -68px;
    padding-top: 92px;
  }
  
  .error-container {
    max-width: 600px;
    text-align: center;
    position: relative;
    z-index: 1;
    animation: fadeInUp 0.6s ease-out;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .error-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 24px;
    color: var(--primary);
    animation: bounce 2s ease-in-out infinite;
  }
  
  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
  
  .error-status {
    font-family: var(--font-display);
    font-size: clamp(80px, 15vw, 150px);
    font-weight: 700;
    color: var(--primary);
    line-height: 1;
    margin-bottom: 16px;
    opacity: 0.9;
    text-shadow: 0 4px 30px rgba(232, 23, 93, 0.3);
  }
  
  .error-title {
    font-family: var(--font-display);
    font-size: clamp(28px, 5vw, 42px);
    color: white;
    margin-bottom: 16px;
    line-height: 1.2;
  }
  
  .error-description {
    font-family: var(--font-jakarta);
    font-size: 18px;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.7;
    margin-bottom: 32px;
    max-width: 480px;
    margin-left: auto;
    margin-right: auto;
  }
  
  .error-details {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 16px 24px;
    margin-bottom: 32px;
    max-width: 100%;
    overflow-x: auto;
  }
  
  .error-details code {
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 13px;
    color: var(--orange);
    word-break: break-word;
  }
  
  .error-actions {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 40px;
  }
  
  .btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--primary);
    color: white;
    padding: 16px 36px;
    border-radius: 100px;
    font-family: var(--font-jakarta);
    font-size: 15px;
    font-weight: 800;
    text-decoration: none;
    letter-spacing: 0.3px;
    box-shadow: 0 8px 32px rgba(232, 23, 93, 0.4);
    transition: all 0.2s ease;
    cursor: pointer;
    border: none;
  }
  
  .btn-primary:hover {
    background: var(--primary-dark);
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(232, 23, 93, 0.5);
  }
  
  .btn-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    color: white;
    padding: 16px 36px;
    border-radius: 100px;
    font-family: var(--font-jakarta);
    font-size: 15px;
    font-weight: 700;
    text-decoration: none;
    letter-spacing: 0.3px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    transition: all 0.2s ease;
    cursor: pointer;
  }
  
  .btn-secondary:hover {
    border-color: white;
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-3px);
  }
  
  .error-help {
    font-family: var(--font-jakarta);
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .error-help a {
    color: var(--primary);
    text-decoration: none;
    font-weight: 600;
    transition: color 0.2s ease;
  }
  
  .error-help a:hover {
    color: var(--orange);
    text-decoration: underline;
  }
  
  .error-decoration {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }
  
  .decoration-circle {
    position: absolute;
    border-radius: 50%;
    opacity: 0.1;
  }
  
  .circle-1 {
    width: 400px;
    height: 400px;
    background: var(--primary);
    top: -200px;
    right: -200px;
    animation: float 8s ease-in-out infinite;
  }
  
  .circle-2 {
    width: 300px;
    height: 300px;
    background: var(--orange);
    bottom: -150px;
    left: -150px;
    animation: float 10s ease-in-out infinite 2s;
  }
  
  .circle-3 {
    width: 200px;
    height: 200px;
    background: var(--primary);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: pulse 4s ease-in-out infinite;
  }
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0) rotate(0deg);
    }
    50% {
      transform: translateY(-30px) rotate(5deg);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 0.05;
      transform: translate(-50%, -50%) scale(1);
    }
    50% {
      opacity: 0.1;
      transform: translate(-50%, -50%) scale(1.1);
    }
  }
  
  @media (max-width: 640px) {
    .error-page {
      padding: 16px;
      padding-top: 84px;
    }
    
    .error-icon {
      font-size: 60px;
    }
    
    .error-description {
      font-size: 16px;
    }
    
    .error-actions {
      flex-direction: column;
      width: 100%;
    }
    
    .btn-primary,
    .btn-secondary {
      width: 100%;
    }
    
    .circle-1 {
      width: 250px;
      height: 250px;
      top: -125px;
      right: -125px;
    }
    
    .circle-2 {
      width: 200px;
      height: 200px;
      bottom: -100px;
      left: -100px;
    }
    
    .circle-3 {
      width: 150px;
      height: 150px;
    }
  }
  
  @media (prefers-reduced-motion: reduce) {
    .error-container,
    .error-icon,
    .decoration-circle {
      animation: none;
    }
  }
</style>