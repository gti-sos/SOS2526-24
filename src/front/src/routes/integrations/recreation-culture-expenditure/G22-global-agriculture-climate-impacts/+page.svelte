<script>
  import { onMount, onDestroy, tick } from "svelte";
  import { browser } from "$app/environment";

  let Plotly;

  const PROXY_BASE = "/api/v2/recreation-culture-expenditure/proxy";
  const API_URL = "/api/v2/recreation-culture-expenditure";

  let loading = $state(false);
  let error = $state(null);
  let chartVisible = $state(false);

  let chartContainer;

  async function fetchJson(url) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`La petición ha fallado con estado ${response.status}`);
    }

    return await response.json();
  }

  async function ensureInitialData(url) {
    const response = await fetch(url);

    /*
      loadInitialData puede devolver:
      - 201 si ha cargado los datos iniciales
      - 200 si la API lo tiene implementado así
      - 204 si responde correctamente sin cuerpo
      - 409 si la base de datos ya tenía datos

      El 409 no debe romper la gráfica.
    */
    if ([200, 201, 204, 409].includes(response.status)) {
      return;
    }

    throw new Error(
      `No se pudieron cargar los datos iniciales desde ${url}. Estado ${response.status}`
    );
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

  function formatNumber(value) {
    if (value === undefined || value === null || value === "") {
      return "";
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
      return String(value);
    }

    return number.toFixed(2);
  }

  function normalizeCountryName(value) {
    const normalized = String(value ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/-/g, " ")
      .replace(/\s+/g, " ");

    const aliases = {
      usa: "united states",
      us: "united states",
      "u.s.": "united states",
      "u.s.a.": "united states",
      "united states of america": "united states",
      "estados unidos": "united states",
      "estados unidos de america": "united states",

      "reino unido": "united kingdom",
      uk: "united kingdom",
      "great britain": "united kingdom",
      england: "united kingdom",

      espana: "spain",
      "españa": "spain",
      alemania: "germany",
      francia: "france",
      italia: "italy",
      irlanda: "ireland",
      portugal: "portugal",
      holanda: "netherlands",
      "paises bajos": "netherlands",
      belgica: "belgium",
      suiza: "switzerland",
      austria: "austria",
      dinamarca: "denmark",
      suecia: "sweden",
      noruega: "norway",
      finlandia: "finland",
      polonia: "poland",
      grecia: "greece",

      japon: "japan",
      china: "china",
      india: "india",
      corea: "south korea",
      "corea del sur": "south korea",
      "republic of korea": "south korea",
      "korea republic of": "south korea",
      "viet nam": "vietnam",
      rusia: "russia",
      "russian federation": "russia"
    };

    return aliases[normalized] ?? normalized;
  }

  function normalizeRecreationData(payload) {
    const rows = getArrayFromPayload(payload);

    return rows
      .map((row) => {
        const country = pickText(
          row,
          ["country", "country_name", "country-name"],
          ""
        );

        return {
          country,
          countryKey: normalizeCountryName(country),
          year: pickNumber(row, ["year"]),
          recreationValue: pickNumber(row, [
            "recreation_value",
            "recreation-value"
          ]),
          recreationShare: pickNumber(row, [
            "recreation_share",
            "recreation-share"
          ]),
          recreationPerCapita: pickNumber(row, [
            "recreation_per_capita",
            "recreation-per-capita"
          ]),
          population: pickNumber(row, ["population"]),
          original: row
        };
      })
      .filter((row) => row.country && row.countryKey);
  }

  function normalizeAgricultureClimateData(payload) {
    const rows = getArrayFromPayload(payload);

    return rows
      .map((row) => {
        const country = pickText(
          row,
          ["country", "country_name", "country-name"],
          ""
        );

        return {
          country,
          countryKey: normalizeCountryName(country),
          year: pickNumber(row, ["year"]),
          cropType: pickText(
            row,
            ["crop_type", "crop-type", "crop", "crop_name", "crop-name"],
            "Cultivo no indicado"
          ),
          averageTemperature: pickNumber(row, [
            "average_temperature_c",
            "average-temperature-c",
            "avg_temperature_c",
            "temperature",
            "temperature_c"
          ]),
          totalPrecipitation: pickNumber(row, [
            "total_precipitation_mm",
            "total-precipitation-mm",
            "precipitation_mm",
            "precipitation"
          ]),
          original: row
        };
      })
      .filter(
        (row) =>
          row.country &&
          row.countryKey &&
          row.averageTemperature !== null &&
          row.totalPrecipitation !== null
      );
  }

  function getRecreationPerCapita(row) {
    if (row.recreationPerCapita !== null) {
      return row.recreationPerCapita;
    }

    if (
      row.recreationValue !== null &&
      row.population !== null &&
      row.population > 0
    ) {
      return row.recreationValue / row.population;
    }

    return null;
  }

  function getRecreationShare(row) {
    if (row.recreationShare !== null) {
      return row.recreationShare;
    }

    return null;
  }

  function average(values) {
    const validValues = values.filter(
      (value) => value !== null && Number.isFinite(Number(value))
    );

    if (validValues.length === 0) {
      return null;
    }

    return (
      validValues.reduce((sum, value) => sum + Number(value), 0) /
      validValues.length
    );
  }

  function uniqueSortedNumbers(values) {
    return [
      ...new Set(values.filter((value) => Number.isFinite(Number(value))))
    ].sort((a, b) => a - b);
  }

  function uniqueTexts(values) {
    return [
      ...new Set(
        values
          .map((value) => String(value ?? "").trim())
          .filter((value) => value !== "")
      )
    ];
  }

  function joinAgricultureClimateWithRecreation(climateRows, recreationRows) {
    const climateByCountry = new Map();
    const recreationByCountry = new Map();

    climateRows.forEach((row) => {
      if (!climateByCountry.has(row.countryKey)) {
        climateByCountry.set(row.countryKey, []);
      }

      climateByCountry.get(row.countryKey).push(row);
    });

    recreationRows.forEach((row) => {
      if (!recreationByCountry.has(row.countryKey)) {
        recreationByCountry.set(row.countryKey, []);
      }

      recreationByCountry.get(row.countryKey).push(row);
    });

    const joinedRows = [];

    recreationByCountry.forEach((recreationItems, countryKey) => {
      const climateItems = climateByCountry.get(countryKey);

      if (!climateItems) {
        return;
      }

      const recreationPerCapitaValues = recreationItems
        .map((row) => getRecreationPerCapita(row))
        .filter((value) => value !== null);

      if (recreationPerCapitaValues.length === 0) {
        return;
      }

      const recreationShareValues = recreationItems
        .map((row) => getRecreationShare(row))
        .filter((value) => value !== null);

      const averageTemperature = average(
        climateItems.map((row) => row.averageTemperature)
      );

      const averagePrecipitation = average(
        climateItems.map((row) => row.totalPrecipitation)
      );

      if (averageTemperature === null || averagePrecipitation === null) {
        return;
      }

      joinedRows.push({
        country: recreationItems[0].country,
        value: average(recreationPerCapitaValues),
        recreationPerCapita: average(recreationPerCapitaValues),
        recreationShare: average(recreationShareValues),
        averageTemperature,
        averagePrecipitation,
        cropTypes: uniqueTexts(climateItems.map((row) => row.cropType)),
        recreationYears: uniqueSortedNumbers(
          recreationItems.map((row) => row.year)
        ),
        climateYears: uniqueSortedNumbers(climateItems.map((row) => row.year))
      });
    });

    return joinedRows.sort((a, b) => a.country.localeCompare(b.country));
  }

async function renderAgricultureClimateScatter(
  rows,
  chartTitle = "Relación entre temperatura agrícola y gasto en ocio per cápita"
) {
  chartVisible = true;

  await tick();

  if (!chartContainer) {
    throw new Error("No se ha podido inicializar el contenedor de la gráfica.");
  }

  if (!Plotly) {
    throw new Error("No se ha podido cargar la librería de visualización.");
  }

  Plotly.purge(chartContainer);

  await Plotly.newPlot(
    chartContainer,
    [
      {
        type: "scatter",
        mode: "markers",
        x: rows.map((row) => row.averageTemperature),
        y: rows.map((row) => row.recreationPerCapita),
        text: rows.map((row) => row.country),
        customdata: rows.map((row) => [
          row.country,
          row.cropTypes.join(", "),
          row.climateYears.join(", "),
          row.recreationYears.join(", "),
          formatNumber(row.averagePrecipitation),
          formatNumber(row.recreationShare)
        ]),
        marker: {
          size: rows.map((row) => {
            const size = row.averagePrecipitation / 20;
            return Number.isFinite(size) && size > 10 ? size : 10;
          }),
          opacity: 0.75
        },
        hovertemplate:
          "<b>%{customdata[0]}</b><br>" +
          "Cultivos G22: %{customdata[1]}<br>" +
          "Años clima G22: %{customdata[2]}<br>" +
          "Años mi API: %{customdata[3]}<br>" +
          "Temperatura media: %{x:.2f} ºC<br>" +
          "Precipitación media: %{customdata[4]} mm<br>" +
          "Gasto ocio/cultura per cápita: %{y:.2f}<br>" +
          "% ocio/cultura: %{customdata[5]}%" +
          "<extra></extra>"
      }
    ],
    {
      title: {
        text: chartTitle,
        font: { size: 20 }
      },
      xaxis: {
        title: "Temperatura media agrícola de G22 (ºC)"
      },
      yaxis: {
        title: "Gasto medio en ocio y cultura por persona"
      },
      margin: { t: 70, l: 80, r: 30, b: 70 }
    },
    {
      responsive: true,
      displayModeBar: true
    }
  );
}

  async function loadAgricultureClimate() {
    loading = true;
    error = null;
    chartVisible = false;

    try {
      /*
        Primero intentamos cargar datos iniciales.

        - La primera llamada a la API G22 mediante proxy.
        - La segunda llamada a mi API v2.

        Si los datos ya existen, loadInitialData devolverá 409.
      */
      await Promise.all([
        ensureInitialData(`${PROXY_BASE}/sos/agriculture-climate/loadInitialData`),
        ensureInitialData(`${API_URL}/loadInitialData`)
      ]);

      /*
        Después de asegurar que hay datos, pedimos los datos reales
        para construir la gráfica.
      */
      const [climatePayload, recreationPayload] = await Promise.all([
        fetchJson(`${PROXY_BASE}/sos/agriculture-climate`),
        fetchJson(API_URL)
      ]);

      const climateRows = normalizeAgricultureClimateData(climatePayload);
      const recreationRows = normalizeRecreationData(recreationPayload);

      const joinedRows = joinAgricultureClimateWithRecreation(
        climateRows,
        recreationRows
      );

      if (joinedRows.length === 0) {
        throw new Error(
          "No hay países comunes entre la API G22 de clima agrícola y recreation-culture-expenditure con datos numéricos suficientes para pintar la gráfica."
        );
      }

      loading = false;

      await renderAgricultureClimateScatter(joinedRows);
    } catch (err) {
      loading = false;
      chartVisible = false;
      error =
        err?.message ||
        "No se pudo cargar la integración cruzada entre G22 y recreation-culture-expenditure.";
    }
  }

  function resizeChart() {
    if (Plotly && chartContainer && chartVisible) {
      Plotly.Plots.resize(chartContainer);
    }
  }

  onMount(async () => {
    try {
      const plotlyModule = await import("plotly.js-dist-min");
      Plotly = plotlyModule.default;

      window.addEventListener("resize", resizeChart);

      await loadAgricultureClimate();
    } catch (err) {
      loading = false;
      chartVisible = false;
      error =
        err?.message ||
        "No se pudo cargar la visualización de la integración.";
    }
  });

  onDestroy(() => {
    if (!browser) {
      return;
    }

    window.removeEventListener("resize", resizeChart);

    if (Plotly && chartContainer) {
      Plotly.purge(chartContainer);
    }
  });
</script>

<svelte:head>
  <title>G22 | Integraciones | Recreation Culture Expenditure</title>
  <meta
    name="description"
    content="Integración G22 con global-agriculture-climate-impacts y recreation-culture-expenditure"
  />
</svelte:head>

{#if loading}
  <p class="status">Cargando datos de la integración...</p>
{:else if error}
  <div class="error-box">
    {error}
  </div>
{:else}
  <article class="chart-card">
    <div class="chart-header">
      <h2>G22 - Impactos Climáticos Globales en la Agricultura</h2>
      <p>
        Esta visualización combina datos de dos APIs REST. Por un lado, utiliza 
        los países de la API sobre gasto en ocio y cultura; por otro, incorpora 
        los datos de la API sobre impactos climáticos en la agricultura. La gráfica 
        muestra únicamente los países presentes en ambas fuentes. En cada punto, el 
        eje X representa la temperatura media agrícola y el eje Y muestra la media 
        del gasto per cápita en ocio y cultura.
      </p>
    </div>

    {#if chartVisible}
      <div bind:this={chartContainer} class="chart-container"></div>
    {/if}
  </article>
{/if}

<style>
  .status {
    width: min(1050px, calc(100% - 48px));
    margin: 64px auto;
    padding: 34px 28px;
    border-radius: 16px;
    background: #ffffff;
    text-align: center;
    color: #10213d;
    box-shadow: 0 10px 25px rgba(15, 23, 42, 0.12);
  }

  .error-box {
    width: min(1050px, calc(100% - 48px));
    margin: 64px auto;
    padding: 28px;
    border-radius: 16px;
    background: #fff1f2;
    color: #991b1b;
    border: 1px solid #fecdd3;
    box-shadow: 0 10px 25px rgba(15, 23, 42, 0.12);
  }

  .chart-card {
    width: min(1050px, calc(100% - 48px));
    margin: 64px auto;
    padding: 32px;
    border-radius: 18px;
    background: #ffffff;
    box-shadow: 0 10px 25px rgba(15, 23, 42, 0.12);
  }

  .chart-header {
    margin-bottom: 24px;
  }

  .chart-header h2 {
    margin: 0 0 12px;
    color: #10213d;
    font-size: 1.7rem;
  }

  .chart-header p {
    margin: 0;
    color: #23344f;
    line-height: 1.6;
  }

  .chart-container {
    width: 100%;
    min-height: 560px;
  }

  @media (max-width: 700px) {
    .chart-card,
    .status,
    .error-box {
      width: calc(100% - 24px);
      margin: 32px auto;
      padding: 22px;
    }

    .chart-container {
      min-height: 440px;
    }
  }
</style>