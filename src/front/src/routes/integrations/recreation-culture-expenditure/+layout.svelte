<script>
  import { page } from "$app/state";

  const integrations = [
    {
      label: "G23-stock-market",
      path: "/integrations/recreation-culture-expenditure/G23-daily-global-stock-market-indicators"
    },
    {
      label: "G22-agriculture-climate",
      path: "/integrations/recreation-culture-expenditure/G22-global-agriculture-climate-impacts"
    },
    {
      label: "G30-esports-growth",
      path: "/integrations/recreation-culture-expenditure/G30-esports-growth"
    },
    {
      label: "Spotify",
      path: "/integrations/recreation-culture-expenditure/spotify"
    },
    {
      label: "Ticketmaster",
      path: "/integrations/recreation-culture-expenditure/ticketmaster"
    },
    {
      label: "Nager.Date",
      path: "/integrations/recreation-culture-expenditure/nager-date"
    }
  ];

  let currentPath = $derived(page.url.pathname);
</script>

<svelte:head>
  <title>Integraciones | Recreation Culture Expenditure</title>
  <meta
    name="description"
    content="Integraciones de APIs externas y APIs SOS para recreation-culture-expenditure"
  />
</svelte:head>

<section class="integrations-page">
  <p class="eyebrow">EBP · PROXY · API </p>
  <h1>Integraciones de Ocio y Cultura</h1>

  <div class="button-row" aria-label="Selector de integraciones">
    {#each integrations as integration}
      <a
        href={integration.path}
        class:active={currentPath === integration.path}
        aria-current={currentPath === integration.path ? "page" : undefined}
      >
        {integration.label}
      </a>
    {/each}
  </div>

  <slot />
</section>

<style>
  .integrations-page {
    max-width: 1180px;
    margin: 0 auto;
    padding: 2.2rem 2rem 2.5rem;
    font-family:
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }

  .eyebrow {
    margin: 0 0 0.4rem;
    color: #f7f3ea;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0 0 1.8rem;
    color: #f7f3ea;
    font-family: Georgia, "Cormorant Garamond", serif;
    font-size: clamp(2.8rem, 4.6vw, 4.2rem);
    line-height: 0.98;
    font-weight: 600;
    letter-spacing: -0.03em;
  }

  .button-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 2.2rem;
  }

  .button-row a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    border: none;
    border-radius: 8px;
    background: rgba(238, 244, 239, 0.18);
    color: #f7f3ea;
    padding: 0.75rem 1.25rem;
    font-size: 0.92rem;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
    backdrop-filter: blur(3px);
    transition:
      transform 0.15s ease,
      background 0.15s ease,
      box-shadow 0.15s ease;
  }

  .button-row a:hover {
    transform: translateY(-1px);
    background: rgba(238, 244, 239, 0.28);
    box-shadow: 0 6px 16px rgba(32, 45, 39, 0.18);
  }

  .button-row a.active {
    background: #5f766d;
    color: #ffffff;
    font-weight: 600;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.16);
  }

  :global(.status) {
    padding: 1rem;
    color: #374151;
    background: #f3f4f6;
    border-radius: 8px;
  }

  :global(.error-box) {
    padding: 1rem;
    border-radius: 8px;
    color: #991b1b;
    background: #fee2e2;
    border: 1px solid #fecaca;
  }

  :global(.chart-card),
  :global(.data-preview) {
    background: white;
    border-radius: 14px;
    padding: 1.5rem;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
    margin-bottom: 2rem;
  }

  :global(.chart-header h2) {
    margin: 0 0 0.4rem;
    color: #1f2937;
  }

  :global(.chart-header p) {
    margin: 0 0 1.2rem;
    color: #4b5563;
  }

  :global(.chart-container) {
    width: 100%;
    min-height: 560px;
  }

  :global(.pending-box) {
    min-height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    border: 2px dashed #cbd5e1;
    border-radius: 12px;
    color: #475569;
    background: #f8fafc;
    text-align: center;
  }

  :global(table) {
    width: 100%;
    border-collapse: collapse;
    overflow: hidden;
  }

  :global(th),
  :global(td) {
    padding: 0.8rem;
    border-bottom: 1px solid #e5e7eb;
    text-align: left;
  }

  :global(th) {
    background: #f3f4f6;
    color: #374151;
  }

  @media (max-width: 700px) {
    .integrations-page {
      padding: 1.2rem;
    }

    h1 {
      font-size: clamp(2rem, 10vw, 3rem);
    }

    .button-row {
      gap: 0.75rem;
    }

    .button-row a {
      width: 100%;
      text-align: center;
      border-radius: 8px;
    }

    :global(.chart-container) {
      min-height: 460px;
    }
  }
</style>