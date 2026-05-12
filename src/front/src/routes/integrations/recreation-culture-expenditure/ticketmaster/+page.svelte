<script>
  import { onMount } from "svelte";

  let chartContainer;
  let combinedData = [];
  let loading = true;
  let error = "";

  const OWN_API_URL = "/api/v2/recreation-culture-expenditure";

  const TICKETMASTER_COUNTS_PROXY_URL =
    "/api/v2/recreation-culture-expenditure/proxy/external/ticketmaster/events-count-by-country";

  const countryCodes = {
    Canada: "CA",
    Germany: "DE",
    Ireland: "IE",
    Italy: "IT",
    Poland: "PL",
    Spain: "ES",
    "United Kingdom": "GB",
    "United States": "US"
  };

  function getLatestRecordByCountry(records) {
    const latestByCountry = new Map();

    records.forEach((record) => {
      const current = latestByCountry.get(record.country);

      if (!current || Number(record.year) > Number(current.year)) {
        latestByCountry.set(record.country, record);
      }
    });

    return Array.from(latestByCountry.values());
  }

  async function getTicketmasterCountsByCountry(latestRecords) {
    const countryCodeList = latestRecords
      .map((record) => countryCodes[record.country])
      .filter(Boolean);

    const params = new URLSearchParams({
      countryCodes: countryCodeList.join(","),
      classificationName: "music"
    });

    const response = await fetch(
      `${TICKETMASTER_COUNTS_PROXY_URL}?${params.toString()}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "No se pudieron consultar los eventos de Ticketmaster"
      );
    }

    return new Map(data.map((item) => [item.countryCode, Number(item.events)]));
  }

  async function loadData() {
    try {
      loading = true;
      error = "";
      combinedData = [];

      const ownApiResponse = await fetch(OWN_API_URL);
      const ownApiData = await ownApiResponse.json();

      if (!ownApiResponse.ok) {
        throw new Error(
          "No se pudieron cargar los datos de recreation-culture-expenditure"
        );
      }

      const latestRecords = getLatestRecordByCountry(ownApiData).filter(
        (record) => countryCodes[record.country]
      );

      const ticketmasterCounts =
        await getTicketmasterCountsByCountry(latestRecords);

      combinedData = latestRecords.map((record) => {
        const countryCode = countryCodes[record.country];

        return {
          country: record.country,
          countryCode,
          year: Number(record.year),
          recreation_per_capita: Number(record.recreation_per_capita),
          recreation_share: Number(record.recreation_share),
          ticketmaster_events: Number(ticketmasterCounts.get(countryCode) || 0)
        };
      });

      await drawChart();
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function drawChart() {
    const { default: embed } = await import("vega-embed");

    if (chartContainer) {
      chartContainer.innerHTML = "";
    }

    const spec = {
      "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
      "description":
        "Relación entre gasto en ocio y cultura y eventos de Ticketmaster por país",
      "width": 760,
      "height": 390,
      "title": {
        "text": "Relación entre eventos musicales y gasto cultural per cápita",
        "fontSize": 20,
        "fontWeight": "normal",
        "anchor": "middle",
        "offset": 18
      },
      "data": {
        "values": combinedData
      },
      "mark": {
        "type": "circle",
        "opacity": 0.82
      },
      "encoding": {
        "x": {
          "field": "recreation_per_capita",
          "type": "quantitative",
          "title": "Gasto en ocio y cultura por habitante",
          "axis": {
            "labelFontSize": 12,
            "titleFontSize": 13,
            "titlePadding": 12,
            "grid": true
          }
        },
        "y": {
          "field": "ticketmaster_events",
          "type": "quantitative",
          "title": "Eventos musicales disponibles en Ticketmaster",
          "axis": {
            "labelFontSize": 12,
            "titleFontSize": 13,
            "titlePadding": 12,
            "grid": true
          }
        },
        "size": {
          "field": "recreation_share",
          "type": "quantitative",
          "title": "Peso del ocio y cultura (%)",
          "legend": {
            "titleFontSize": 12,
            "labelFontSize": 11
          }
        },
        "color": {
          "field": "country",
          "type": "nominal",
          "title": "País",
          "legend": {
            "titleFontSize": 12,
            "labelFontSize": 11
          }
        },
        "tooltip": [
          {
            "field": "country",
            "type": "nominal",
            "title": "País"
          },
          {
            "field": "year",
            "type": "ordinal",
            "title": "Año del dato"
          },
          {
            "field": "recreation_per_capita",
            "type": "quantitative",
            "title": "Gasto per cápita",
            "format": ".2f"
          },
          {
            "field": "recreation_share",
            "type": "quantitative",
            "title": "Porcentaje de ocio/cultura",
            "format": ".2f"
          },
          {
            "field": "ticketmaster_events",
            "type": "quantitative",
            "title": "Eventos Ticketmaster"
          }
        ]
      },
      "config": {
        "background": "transparent",
        "view": {
          "stroke": "transparent"
        },
        "axis": {
          "labelColor": "#020617",
          "titleColor": "#020617",
          "gridColor": "#e5e7eb",
          "domainColor": "#cbd5e1",
          "tickColor": "#cbd5e1"
        },
        "legend": {
          "labelColor": "#020617",
          "titleColor": "#020617"
        }
      }
    };

    await embed(chartContainer, spec, {
      actions: true
    });
  }

  onMount(loadData);
</script>

<svelte:head>
  <title>Integración Elena | Ticketmaster y ocio cultural</title>
</svelte:head>

<main class="page">
  <section class="card">
    <h1>Integración de gasto en ocio y cultura con Ticketmaster</h1>

    <p class="description">
      Esta visualización combina datos de la API de gasto per cápita en ocio y
      cultura con información externa procedente de la API Ticketmaster. La
      gráfica compara, para cada país, el gasto cultural por habitante con el
      número de eventos musicales disponibles. El tamaño de cada punto representa
      el peso del ocio y la cultura sobre el consumo total, permitiendo analizar
      la relación entre los datos económicos propios y la actividad cultural
      registrada por Ticketmaster.
    </p>

    {#if error}
      <p class="error">{error}</p>
    {/if}

    <div class="chart-wrapper">
      <div bind:this={chartContainer} class="chart"></div>
    </div>

    {#if combinedData.length > 0}
      <section class="table-section">
        <h2>Datos combinados</h2>

        <table>
          <thead>
            <tr>
              <th>País</th>
              <th>Año</th>
              <th>Gasto per cápita</th>
              <th>Porcentaje ocio/cultura</th>
              <th>Eventos Ticketmaster</th>
            </tr>
          </thead>
          <tbody>
            {#each combinedData as item}
              <tr>
                <td>{item.country}</td>
                <td>{item.year}</td>
                <td>{item.recreation_per_capita.toFixed(2)}</td>
                <td>{item.recreation_share.toFixed(2)}%</td>
                <td>{item.ticketmaster_events}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </section>
    {/if}
  </section>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #7f918c;
    font-family:
      Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
      sans-serif;
    color: #020617;
  }

  .page {
    min-height: 100vh;
    padding: 30px 26px;
    box-sizing: border-box;
    background: #7f918c;
  }

  .card {
    width: 100%;
    max-width: 1115px;
    min-height: 720px;
    margin: 0 auto;
    padding: 26px 24px 36px;
    box-sizing: border-box;
    background: #ffffff;
    border-radius: 10px;
    box-shadow: 0 18px 45px rgba(15, 23, 42, 0.18);
  }

  h1 {
    margin: 0 0 8px;
    color: #061631;
    font-size: 26px;
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: -0.03em;
  }

  .description {
    max-width: 1040px;
    margin: 0 0 26px;
    color: #061631;
    font-size: 15.5px;
    line-height: 1.48;
  }

  .status {
    margin: 24px 0;
    color: #334155;
    font-weight: 600;
  }

  .error {
    margin: 24px 0;
    color: #b91c1c;
    font-weight: 700;
  }

  .chart-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 22px;
    margin-bottom: 34px;
    overflow-x: auto;
  }

  .chart {
    min-width: 780px;
  }

  .table-section {
    margin-top: 18px;
  }

  h2 {
    margin: 0 0 12px;
    color: #061631;
    font-size: 20px;
    font-weight: 750;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
    font-size: 14px;
  }

  th,
  td {
    border: 1px solid #e2e8f0;
    padding: 0.75rem;
    text-align: left;
  }

  th {
    background-color: #f8fafc;
    color: #061631;
    font-weight: 700;
  }

  td {
    color: #1e293b;
  }

  @media (max-width: 900px) {
    .page {
      padding: 18px;
    }

    .card {
      padding: 22px 18px 30px;
    }

    h1 {
      font-size: 22px;
    }

    .description {
      font-size: 14.5px;
    }

    .chart {
      min-width: 720px;
    }
  }
</style>