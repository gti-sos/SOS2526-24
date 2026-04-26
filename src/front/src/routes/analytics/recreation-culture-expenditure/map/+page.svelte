<script>
  import { onMount, onDestroy } from "svelte";

  let chartContainer;
  let chart;
  let Highcharts;
  let topology;

  let loading = true;
  let error = null;

  let allRecords = [];

  let globalAverage = 0;
  let countriesAboveAverage = 0;
  let countriesBelowAverage = 0;
  let countriesRepresented = 0;
  let yearsRangeText = "";

  const API = "/api/v2/recreation-culture-expenditure";
  const WORLD_TOPOLOGY_URL =
    "https://code.highcharts.com/mapdata/custom/world.topo.json";

  async function fetchConTimeout(url, timeout = 10000) {
    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      return await fetch(url, {
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function normalizeCountryName(name) {
    return String(name)
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  const COUNTRY_TO_ISO2 = {
    spain: "ES",
    espana: "ES",
    france: "FR",
    francia: "FR",
    germany: "DE",
    alemania: "DE",
    italy: "IT",
    italia: "IT",
    portugal: "PT",
    netherlands: "NL",
    "the netherlands": "NL",
    "paises bajos": "NL",
    belgium: "BE",
    belgica: "BE",
    luxembourg: "LU",
    luxemburgo: "LU",
    austria: "AT",
    poland: "PL",
    polonia: "PL",
    "czech republic": "CZ",
    czechia: "CZ",
    "republica checa": "CZ",
    slovakia: "SK",
    eslovaquia: "SK",
    hungary: "HU",
    hungria: "HU",
    slovenia: "SI",
    eslovenia: "SI",
    croatia: "HR",
    croacia: "HR",
    romania: "RO",
    bulgaria: "BG",
    greece: "GR",
    grecia: "GR",
    ireland: "IE",
    irlanda: "IE",
    "united kingdom": "GB",
    uk: "GB",
    "reino unido": "GB",
    sweden: "SE",
    suecia: "SE",
    norway: "NO",
    noruega: "NO",
    denmark: "DK",
    dinamarca: "DK",
    finland: "FI",
    finlandia: "FI",
    iceland: "IS",
    islandia: "IS",
    switzerland: "CH",
    suiza: "CH",
    "united states": "US",
    "united states of america": "US",
    usa: "US",
    "estados unidos": "US",
    canada: "CA",
    mexico: "MX",
    brazil: "BR",
    brasil: "BR",
    argentina: "AR",
    chile: "CL",
    colombia: "CO",
    peru: "PE",
    japan: "JP",
    japon: "JP",
    "south korea": "KR",
    korea: "KR",
    "corea del sur": "KR",
    china: "CN",
    india: "IN",
    australia: "AU",
    "new zealand": "NZ",
    "nueva zelanda": "NZ",
    "south africa": "ZA",
    sudafrica: "ZA",
    turkey: "TR",
    turquia: "TR",
    russia: "RU",
    rusia: "RU"
  };

  function getIso2Code(country) {
    const raw = String(country).trim();

    if (/^[A-Za-z]{2}$/.test(raw)) {
      return raw.toUpperCase();
    }

    const normalized = normalizeCountryName(raw);
    return COUNTRY_TO_ISO2[normalized] ?? null;
  }

  function prepararDatos(rawData) {
    const validRecords = rawData
      .filter((d) =>
        d.country &&
        d.year !== undefined &&
        d.recreation_per_capita !== undefined &&
        d.recreation_per_capita !== null &&
        !Number.isNaN(Number(d.year)) &&
        !Number.isNaN(Number(d.recreation_per_capita))
      )
      .map((d) => ({
        country: String(d.country),
        year: Number(d.year),
        recreation_per_capita: Number(d.recreation_per_capita)
      }));

    const years = [...new Set(validRecords.map((d) => d.year))].sort(
      (a, b) => a - b
    );

    if (years.length > 0) {
      yearsRangeText = `${years[0]} - ${years[years.length - 1]}`;
    } else {
      yearsRangeText = "sin años disponibles";
    }

    return validRecords;
  }

  function construirSerieMapa() {
    if (allRecords.length === 0) {
      return {
        average: 0,
        above: 0,
        below: 0,
        represented: 0,
        data: []
      };
    }

    const countries = [...new Set(allRecords.map((d) => d.country))];

    const countryAverages = countries
      .map((country) => {
        const recordsOfCountry = allRecords.filter((d) => d.country === country);

        const code = getIso2Code(country);

        if (!code || recordsOfCountry.length === 0) {
          return null;
        }

        const average =
          recordsOfCountry.reduce(
            (sum, d) => sum + d.recreation_per_capita,
            0
          ) / recordsOfCountry.length;

        const yearsOfCountry = recordsOfCountry
          .map((d) => d.year)
          .sort((a, b) => a - b);

        return {
          code,
          country,
          value: average,
          yearsCount: recordsOfCountry.length,
          firstYear: yearsOfCountry[0],
          lastYear: yearsOfCountry[yearsOfCountry.length - 1]
        };
      })
      .filter(Boolean);

    const average =
      countryAverages.reduce((sum, d) => sum + d.value, 0) /
      countryAverages.length;

    const data = countryAverages.map((d) => {
      const isAboveOrEqual = d.value >= average;

      return {
        ...d,
        category: isAboveOrEqual
          ? "Por encima o igual a la media global"
          : "Por debajo de la media global"
      };
    });

    const above = data.filter((d) => d.value >= average).length;
    const below = data.filter((d) => d.value < average).length;

    return {
      average,
      above,
      below,
      represented: data.length,
      data
    };
  }

  function renderMap() {
    if (!Highcharts || !topology || !chartContainer) {
      return;
    }

    const { average, above, below, represented, data } = construirSerieMapa();

    globalAverage = average;
    countriesAboveAverage = above;
    countriesBelowAverage = below;
    countriesRepresented = represented;

    if (chart) {
      chart.destroy();
      chart = null;
    }

    chart = Highcharts.mapChart(chartContainer, {
      chart: {
        map: topology,
        spacingBottom: 20
      },

      title: {
        text: "Mapa mundial del gasto medio en ocio y cultura por persona"
      },

      subtitle: {
        text: `Media calculada con los años registrados (${yearsRangeText}) · Media global: ${globalAverage.toFixed(2)}`
      },

      mapNavigation: {
        enabled: true,
        enableMouseWheelZoom: false,
        buttonOptions: {
          verticalAlign: "bottom"
        }
      },

      legend: {
        title: {
          text: "Categoría"
        }
      },

      colorAxis: {
        dataClasses: [
          {
            to: globalAverage - 0.000001,
            color: "#f4a261",
            name: "Por debajo de la media global"
          },
          {
            from: globalAverage,
            color: "#d62828",
            name: "Por encima o igual a la media global"
          }
        ]
      },

      tooltip: {
        useHTML: true,
        pointFormatter: function () {
          if (this.value === undefined || this.value === null) {
            return `<b>${this.name}</b><br/>Sin datos en la API`;
          }

          return `
            <b>${this.country || this.name}</b><br/>
            Media del país: <b>${this.value.toFixed(2)}</b><br/>
            Media global: <b>${globalAverage.toFixed(2)}</b><br/>
            Años usados: <b>${this.firstYear} - ${this.lastYear}</b><br/>
            Registros usados: <b>${this.yearsCount}</b><br/>
            Categoría: <b>${this.category}</b>
          `;
        }
      },

      plotOptions: {
        map: {
          allAreas: true,
          joinBy: ["iso-a2", "code"],
          nullColor: "#e6e6e6",
          borderColor: "#ffffff",
          states: {
            hover: {
              color: "#457b9d"
            }
          },
          dataLabels: {
            enabled: false
          }
        }
      },

      credits: {
        enabled: false
      },

      series: [
        {
          type: "map",
          name: "Media de gasto por persona",
          data,
          accessibility: {
            description:
              "Mapa mundial que clasifica los países según si su gasto medio en ocio y cultura por persona está por encima o por debajo de la media global calculada con los países disponibles en la API."
          }
        }
      ]
    });
  }

  async function loadMapPage() {
    loading = true;
    error = null;

    try {
      const highchartsModule = await import("highcharts");
      Highcharts = highchartsModule.default ?? highchartsModule;

      const mapModule = await import("highcharts/modules/map");
      const initMapModule = mapModule.default ?? mapModule;

      if (typeof initMapModule === "function") {
        initMapModule(Highcharts);
      }

      const [topologyResponse, apiResponse] = await Promise.all([
        fetchConTimeout(WORLD_TOPOLOGY_URL),
        fetchConTimeout(API)
      ]);

      if (!topologyResponse.ok) {
        throw new Error("No se pudo cargar el mapa mundial.");
      }

      if (!apiResponse.ok) {
        throw new Error(
          `No se pudieron cargar los datos de la API. Código: ${apiResponse.status}`
        );
      }

      topology = await topologyResponse.json();

      const apiData = await apiResponse.json();

      if (!Array.isArray(apiData)) {
        throw new Error("La API no ha devuelto una lista de registros.");
      }

      allRecords = prepararDatos(apiData);

      if (allRecords.length === 0) {
        throw new Error("No hay datos suficientes para construir el mapa.");
      }

      renderMap();
    } catch (e) {
      if (e.name === "AbortError") {
        error = "La carga del mapa o de la API ha tardado demasiado.";
      } else {
        error = e.message;
      }
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadMapPage();
  });

  onDestroy(() => {
    if (chart) {
      chart.destroy();
    }
  });
</script>

<svelte:head>
  <title>Mapa geoespacial - Gasto en ocio y cultura</title>
</svelte:head>

<section class="analytics-map-page">
  <h1>Mapa mundial del gasto medio en ocio y cultura por persona</h1>

  <p class="description">
    Esta visualización geoespacial muestra la media de gasto en ocio y cultura por persona
    de cada país usando todos los años disponibles en la API. Cada país se clasifica según
    si su media está por encima o por debajo de la media global calculada con todos los países
    representados.
  </p>

  {#if loading}
    <p class="status">Cargando mapa y datos de la API...</p>
  {:else if error}
    <p class="error">{error}</p>
  {:else}
    <div class="summary" aria-live="polite">
      <p><strong>Años usados:</strong> {yearsRangeText}</p>
      <p><strong>Media global:</strong> {globalAverage.toFixed(2)}</p>
      <p><strong>Países representados:</strong> {countriesRepresented}</p>
      <p><strong>Por encima o igual a la media global:</strong> {countriesAboveAverage}</p>
      <p><strong>Por debajo de la media global:</strong> {countriesBelowAverage}</p>
    </div>
  {/if}

  <div
    bind:this={chartContainer}
    class="map-container"
    aria-label="Mapa mundial del gasto medio en ocio y cultura por persona"
  ></div>
</section>

<style>
  .analytics-map-page {
    padding: 2rem;
  }

  .analytics-map-page h1 {
    margin-bottom: 0.75rem;
    color: #12332f;
    text-align: center;
  }

  .description {
    max-width: 950px;
    margin: 0 auto 1.5rem auto;
    text-align: center;
    color: #3f5f59;
    font-size: 1.05rem;
    line-height: 1.5;
  }

  .status {
    text-align: center;
    font-weight: 600;
    color: #3f5f59;
  }

  .error {
    max-width: 900px;
    margin: 1rem auto;
    padding: 1rem;
    border-radius: 0.75rem;
    background-color: #ffe8e8;
    color: #8a1f1f;
    text-align: center;
    font-weight: 600;
  }

  .summary {
    max-width: 900px;
    margin: 0 auto 1rem auto;
    padding: 1rem 1.25rem;
    border-radius: 0.75rem;
    background: #f4f7f6;
    color: #12332f;
  }

  .summary p {
    margin: 0.35rem 0;
  }

  .map-container {
    width: 100%;
    min-height: 650px;
    margin-top: 1rem;
    background: white;
    border-radius: 0.75rem;
    overflow: hidden;
  }
</style>