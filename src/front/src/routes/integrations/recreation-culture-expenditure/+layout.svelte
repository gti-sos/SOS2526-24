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
  <h1>Visualizaciones del Gasto en Ocio y Cultura</h1>

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
    padding: 2rem;
    font-family:
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }

  h1 {
    margin: 0 0 1.8rem;
    color: #111827;
    font-size: 2rem;
    font-weight: 700;
  }

  .button-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .button-row a {
    border: none;
    border-radius: 4px;
    background: #a8c98b;
    color: #111827;
    padding: 0.8rem 1.4rem;
    font-size: 0.95rem;
    cursor: pointer;
    text-decoration: none;
    transition:
      transform 0.15s ease,
      background 0.15s ease,
      box-shadow 0.15s ease;
  }

  .button-row a:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
  }

  .button-row a.active {
    background: #6f9f4d;
    color: white;
    font-weight: 700;
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
      padding: 1rem;
    }

    h1 {
      font-size: 1.5rem;
    }

    .button-row a {
      width: 100%;
      text-align: center;
    }

    :global(.chart-container) {
      min-height: 460px;
    }
  }
</style>