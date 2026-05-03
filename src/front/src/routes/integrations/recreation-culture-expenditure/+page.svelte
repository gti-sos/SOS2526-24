<script>
  import { onMount, onDestroy, tick } from "svelte";
  import Plotly from "plotly.js-dist-min";

  const PROXY_BASE = "/api/v2/recreation-culture-expenditure/proxy";

  const integrations = [
    {
      key: "g23-stock-market",
      label: "G23-stock-market",
      title: "G23 - Daily Global Stock Market Indicators",
      description:
        "Visualización jerárquica de los indicadores bursátiles globales agrupados por región, país e índice."
    },
    {
      key: "g30-esports",
      label: "G30-esports-growth",
      title: "G30 - Esports Growth Stats",
      description:
        "Visualización de "
    },
    {
      key: "spotify",
      label: "Spotify",
      title: "Spotify",
      description:
        "Integración externa con OAuth y widget "
    },
    {
      key: "ticketmaster",
      label: "Ticketmaster",
      title: "Ticketmaster",
      description:
        "Integración externa con widget preparada para eventos culturales o de ocio."
    },
    {
      key: "nager",
      label: "Nager.Date",
      title: "Nager.Date",
      description:
        "Integración externa con widget preparada para festivos por país y año."
    }
  ];


  //ESTADOS
  let active = $state("g23-stock-market");
  let loading = $state(false);
  let error = $state(null);

  let title = $state("");
  let description = $state("");
  let tableRows = $state([]);
  let chartVisible = $state(false);
  let pendingMessage = $state("");

  //Referencias
  let chartContainer;

  function getIntegration(key) {
    return integrations.find((integration) => integration.key === key);
  }

  async function fetchJson(url) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`La petición ha fallado con estado ${response.status}`);
    }

    return await response.json();
  }

  function getArrayFromPayload(payload) {
    if (Array.isArray(payload)) {
      return payload;
    }

    const possibleArrayFields = ["data", "results", "items", "records"];

    for (const field of possibleArrayFields) {
      if (Array.isArray(payload?.[field])) {
        return payload[field];
      }
    }

    return [];
  }

  function pickText(object, candidateFields, fallback) {
    for (const field of candidateFields) {
      const value = object?.[field];

      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return String(value).trim();
      }
    }

    return fallback;
  }

  function parseNumber(value) {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    let text = String(value).trim().replace("%", "").replace(/\s/g, "");

    if (text.includes(",") && !text.includes(".")) {
      text = text.replace(",", ".");
    } else {
      text = text.replace(/,/g, "");
    }

    const number = Number(text);

    return Number.isFinite(number) ? number : null;
  }

  function pickNumber(object, candidateFields) {
    for (const field of candidateFields) {
      const number = parseNumber(object?.[field]);

      if (number !== null) {
        return number;
      }
    }

    return null;
  }

  function normalizeStockMarketData(payload) {
    const rows = getArrayFromPayload(payload);

    return rows
      .map((row, index) => {
        const region = pickText(
          row,
          ["region", "continent", "market_region", "market-region"],
          "Mercado global"
        );

        const country = pickText(
          row,
          ["country", "country_name", "market_country", "market-country"],
          "Sin país"
        );

        const indexName = pickText(
          row,
          [
            "index",
            "index_name",
            "market_index",
            "market-index",
            "stock_index",
            "stock-index",
            "symbol",
            "ticker",
            "name"
          ],
          `Indicador ${index + 1}`
        );

        const mainValue =
          pickNumber(row, [
            "close",
            "closing_price",
            "close_price",
            "price",
            "last",
            "value",
            "index_value",
            "index-value",
            "volume",
            "daily_volume",
            "daily-volume"
          ]) ?? 1;

        return {
          region,
          country,
          indexName,
          value: Math.max(Math.abs(mainValue), 1),
          original: row
        };
      })
      .filter((row) => row.region && row.country && row.indexName);
  }

  function buildSunburst(stockRows) {
    const limitedRows = stockRows.slice(0, 60);

    const ids = ["root"];
    const labels = ["Mercados bursátiles"];
    const parents = [""];
    const values = [0];

    const indexById = new Map();
    indexById.set("root", 0);

    function addAggregateNode(id, label, parent, increment) {
      if (!indexById.has(id)) {
        indexById.set(id, ids.length);
        ids.push(id);
        labels.push(label);
        parents.push(parent);
        values.push(0);
      }

      values[indexById.get(id)] += increment;
    }

    limitedRows.forEach((row, index) => {
      const regionId = `region-${row.region}`;
      const countryId = `country-${row.region}-${row.country}`;
      const leafId = `index-${row.region}-${row.country}-${row.indexName}-${index}`;

      values[0] += row.value;

      addAggregateNode(regionId, row.region, "root", row.value);
      addAggregateNode(countryId, row.country, regionId, row.value);

      ids.push(leafId);
      labels.push(row.indexName);
      parents.push(countryId);
      values.push(row.value);
    });

    return { ids, labels, parents, values };
  }

  async function renderStockMarketSunburst(stockRows) {
    const { ids, labels, parents, values } = buildSunburst(stockRows);

    chartVisible = true;
    pendingMessage = "";

    await tick();

    if (!chartContainer) {
      throw new Error("No se ha podido inicializar el contenedor de la gráfica.");
    }

    Plotly.purge(chartContainer);

    await Plotly.newPlot(
      chartContainer,
      [
        {
          type: "sunburst",
          ids,
          labels,
          parents,
          values,
          branchvalues: "total",
          maxdepth: 3,
          hovertemplate:
            "<b>%{label}</b><br>Valor agregado: %{value}<extra></extra>"
        }
      ],
      {
        title: {
          text: "G23: indicadores bursátiles globales",
          font: { size: 20 }
        },
        margin: { t: 70, l: 10, r: 10, b: 10 }
      },
      {
        responsive: true,
        displayModeBar: true
      }
    );
  }

  async function loadStockMarket() {
    loading = true;
    error = null;
    chartVisible = false;
    pendingMessage = "";
    tableRows = [];

    const integration = getIntegration("g23-stock-market");
    title = integration.title;
    description = integration.description;

    try {
      const payload = await fetchJson(`${PROXY_BASE}/sos/stock-market`);
      const stockRows = normalizeStockMarketData(payload);

      if (stockRows.length === 0) {
        throw new Error("La API no ha devuelto registros utilizables para la visualización.");
      }

      tableRows = stockRows.slice(0, 10);
      loading = false;

      await renderStockMarketSunburst(stockRows);
    } catch (err) {
      loading = false;
      chartVisible = false;
      error =
        err?.message ||
        "No se pudo cargar la integración con daily-global-stock-market-indicators.";
    }
  }

  function showPendingIntegration(key) {
    const integration = getIntegration(key);

    if (chartContainer) {
      Plotly.purge(chartContainer);
    }

    active = key;
    loading = false;
    error = null;
    chartVisible = false;
    tableRows = [];
    title = integration.title;
    description = integration.description;
    pendingMessage =
      "Esta integración está preparada en la interfaz. El siguiente paso es crear o terminar su proxy y conectarla con un widget distinto.";
  }

  async function loadIntegration(key) {
    active = key;

    if (key === "g23-stock-market") {
      await loadStockMarket();
      return;
    }

    showPendingIntegration(key);
  }

  function resizeChart() {
    if (chartContainer && chartVisible) {
      Plotly.Plots.resize(chartContainer);
    }
  }

  onMount(async () => {
    window.addEventListener("resize", resizeChart);
    await loadIntegration("g23-stock-market");
  });

  onDestroy(() => {
    window.removeEventListener("resize", resizeChart);

    if (chartContainer) {
      Plotly.purge(chartContainer);
    }
  });
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
      <button
        type="button"
        class:active={active === integration.key}
        aria-pressed={active === integration.key}
        onclick={() => loadIntegration(integration.key)}
      >
        {integration.label}
      </button>
    {/each}
  </div>

  {#if loading}
    <p class="status">Cargando datos de la integración...</p>
  {:else if error}
    <div class="error-box">
      {error}
    </div>
  {:else}
    <article class="chart-card">
      <div class="chart-header">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      {#if chartVisible}
        <div bind:this={chartContainer} class="chart-container"></div>
      {:else}
        <div class="pending-box">
          {pendingMessage}
        </div>
      {/if}
    </article>

    {#if tableRows.length > 0}
      <section class="data-preview">
        <h2>Vista previa de datos usados</h2>

        <table>
          <thead>
            <tr>
              <th>Región</th>
              <th>País</th>
              <th>Índice / indicador</th>
              <th>Valor usado</th>
            </tr>
          </thead>
          <tbody>
            {#each tableRows as row}
              <tr>
                <td>{row.region}</td>
                <td>{row.country}</td>
                <td>{row.indexName}</td>
                <td>{row.value}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </section>
    {/if}
  {/if}
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

  button {
    border: none;
    border-radius: 4px;
    background: #a8c98b;
    color: #111827;
    padding: 0.8rem 1.4rem;
    font-size: 0.95rem;
    cursor: pointer;
    transition:
      transform 0.15s ease,
      background 0.15s ease,
      box-shadow 0.15s ease;
  }

  button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
  }

  button.active {
    background: #6f9f4d;
    color: white;
    font-weight: 700;
  }

  .status {
    padding: 1rem;
    color: #374151;
    background: #f3f4f6;
    border-radius: 8px;
  }

  .error-box {
    padding: 1rem;
    border-radius: 8px;
    color: #991b1b;
    background: #fee2e2;
    border: 1px solid #fecaca;
  }

  .chart-card,
  .data-preview {
    background: white;
    border-radius: 14px;
    padding: 1.5rem;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
    margin-bottom: 2rem;
  }

  .chart-header h2 {
    margin: 0 0 0.4rem;
    color: #1f2937;
  }

  .chart-header p {
    margin: 0 0 1.2rem;
    color: #4b5563;
  }

  .chart-container {
    width: 100%;
    min-height: 560px;
  }

  .pending-box {
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

  table {
    width: 100%;
    border-collapse: collapse;
    overflow: hidden;
  }

  th,
  td {
    padding: 0.8rem;
    border-bottom: 1px solid #e5e7eb;
    text-align: left;
  }

  th {
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

    button {
      width: 100%;
    }

    .chart-container {
      min-height: 460px;
    }
  }
</style>