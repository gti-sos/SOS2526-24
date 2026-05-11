<script>
  import { onMount } from "svelte";

  let chartContainer;
  let combinedData = [];
  let loading = true;
  let error = "";

  const OWN_API_URL = "/api/v2/recreation-culture-expenditure";

  const TICKETMASTER_PROXY_URL =
    "/api/v2/recreation-culture-expenditure/proxy/external/ticketmaster/events";

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

  async function getTicketmasterEventsCount(countryCode) {
    const params = new URLSearchParams({
      countryCode,
      size: "1"
    });

    const response = await fetch(`${TICKETMASTER_PROXY_URL}?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "No se pudo consultar Ticketmaster");
    }

    return data.page?.totalElements || data._embedded?.events?.length || 0;
  }

  async function loadData() {
    try {
      loading = true;
      error = "";

      const ownApiResponse = await fetch(OWN_API_URL);
      const ownApiData = await ownApiResponse.json();

      if (!ownApiResponse.ok) {
        throw new Error("No se pudieron cargar los datos de recreation-culture-expenditure");
      }

      const latestRecords = getLatestRecordByCountry(ownApiData)
        .filter((record) => countryCodes[record.country]);

      combinedData = await Promise.all(
        latestRecords.map(async (record) => {
          const countryCode = countryCodes[record.country];
          const ticketmasterEvents = await getTicketmasterEventsCount(countryCode);

          return {
            country: record.country,
            countryCode,
            year: Number(record.year),
            recreation_per_capita: Number(record.recreation_per_capita),
            recreation_share: Number(record.recreation_share),
            ticketmaster_events: Number(ticketmasterEvents)
          };
        })
      );

      await drawChart();
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function drawChart() {
    const { default: embed } = await import("vega-embed");

    const spec = {
      "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
      "description": "Relación entre gasto en ocio y cultura y eventos de Ticketmaster por país",
      "width": 650,
      "height": 380,
      "data": {
        "values": combinedData
      },
      "mark": {
        "type": "circle",
        "opacity": 0.8
      },
      "encoding": {
        "x": {
          "field": "recreation_per_capita",
          "type": "quantitative",
          "title": "Gasto en ocio y cultura por habitante"
        },
        "y": {
          "field": "ticketmaster_events",
          "type": "quantitative",
          "title": "Eventos disponibles en Ticketmaster"
        },
        "size": {
          "field": "recreation_share",
          "type": "quantitative",
          "title": "Peso del ocio y cultura (%)"
        },
        "color": {
          "field": "country",
          "type": "nominal",
          "title": "País"
        },
        "tooltip": [
          { "field": "country", "type": "nominal", "title": "País" },
          { "field": "year", "type": "ordinal", "title": "Año del dato" },
          {
            "field": "recreation_per_capita",
            "type": "quantitative",
            "title": "Gasto per cápita"
          },
          {
            "field": "recreation_share",
            "type": "quantitative",
            "title": "Porcentaje de consumo"
          },
          {
            "field": "ticketmaster_events",
            "type": "quantitative",
            "title": "Eventos Ticketmaster"
          }
        ]
      }
    };

    await embed(chartContainer, spec, {
      actions: false
    });
  }

  onMount(loadData);
</script>

<svelte:head>
  <title>Integración Elena | Ticketmaster y ocio cultural</title>
</svelte:head>

<section class="container">
  <h1>Integración de Ticketmaster con Recreation and Culture Expenditure</h1>

  <p>
    Esta visualización compara el gasto en ocio y cultura por habitante con el
    número de eventos disponibles en Ticketmaster para cada país.
  </p>

  {#if loading}
    <p>Cargando datos integrados...</p>
  {/if}

  {#if error}
    <p class="error">{error}</p>
  {/if}

  <div bind:this={chartContainer} class="chart"></div>

  {#if combinedData.length > 0}
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
            <td>{item.recreation_per_capita}</td>
            <td>{item.recreation_share}%</td>
            <td>{item.ticketmaster_events}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</section>

<style>
  .container {
    max-width: 950px;
    margin: 0 auto;
    padding: 2rem;
  }

  h1 {
    color: #1e293b;
  }

  p {
    color: #475569;
  }

  .chart {
    margin-top: 2rem;
    margin-bottom: 2rem;
  }

  .error {
    color: #b91c1c;
    font-weight: bold;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
  }

  th,
  td {
    border: 1px solid #e2e8f0;
    padding: 0.75rem;
    text-align: left;
  }

  th {
    background-color: #f8fafc;
  }
</style>