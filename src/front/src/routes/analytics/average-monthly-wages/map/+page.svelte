<script>
  import { onMount, onDestroy, tick } from "svelte";

  let chartContainer = $state();
  let chart = $state();
  let Highcharts = $state();
  let topology = $state();

  let loading = $state(true);
  let error = $state(null);

  let allRecords = [];

  let globalAverage = 0;
  let countriesAboveAverage = 0;
  let countriesBelowAverage = 0;
  let countriesRepresented = 0;
  let yearsRangeText = "";
  let highestSalary = { country: "", value: 0 };
  let lowestSalary = { country: "", value: 0 };

  const API = "/api/v2/average-monthly-wages";
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
        d.avg_monthly_usd !== undefined &&
        d.avg_monthly_usd !== null &&
        !Number.isNaN(Number(d.year)) &&
        !Number.isNaN(Number(d.avg_monthly_usd))
      )
      .map((d) => ({
        country: String(d.country),
        year: Number(d.year),
        avg_monthly_usd: Number(d.avg_monthly_usd)
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
            (sum, d) => sum + d.avg_monthly_usd,
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

    // Calcular máximo y mínimo
    const sorted = [...countryAverages].sort((a, b) => b.value - a.value);
    if (sorted.length > 0) {
      highestSalary = { country: sorted[0].country, value: sorted[0].value };
      lowestSalary = { country: sorted[sorted.length - 1].country, value: sorted[sorted.length - 1].value };
    }

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
        text: "Mapa mundial del salario mensual medio (USD)"
      },

      subtitle: {
        text: `Media calculada con los años registrados (${yearsRangeText}) · Media global: $${globalAverage.toFixed(2)}`
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
          text: "Categoría salarial"
        }
      },

      colorAxis: {
        dataClasses: [
          {
            to: globalAverage - 0.000001,
            color: "#fca5a5",
            name: "Por debajo de la media global"
          },
          {
            from: globalAverage,
            color: "#22c55e",
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

          const diferencia = this.value - globalAverage;
          const signo = diferencia >= 0 ? "+" : "";

          return `
            <b>${this.country || this.name}</b><br/>
            Salario medio: <b>$${this.value.toFixed(2)}</b>/mes<br/>
            Media global: <b>$${globalAverage.toFixed(2)}</b><br/>
            Diferencia: <b>${signo}$${diferencia.toFixed(2)}</b><br/>
            Años usados: <b>${this.firstYear} - ${this.lastYear}</b><br/>
            Registros: <b>${this.yearsCount}</b><br/>
            Categoría: <b>${this.category}</b>
          `;
        }
      },

      plotOptions: {
        map: {
          allAreas: true,
          joinBy: ["iso-a2", "code"],
          nullColor: "#e5e7eb",
          borderColor: "#ffffff",
          states: {
            hover: {
              color: "#3b82f6"
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
          name: "Salario mensual medio",
          data,
          accessibility: {
            description:
              "Mapa mundial que clasifica los países según si su salario mensual medio está por encima o por debajo de la media global calculada con los países disponibles en la API."
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

      loading = false;
      await tick();

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
  <title>Mapa geoespacial - Salarios mensuales medios</title>
</svelte:head>

<section class="analytics-map-page">
  <nav class="breadcrumb">
    <a href="/">Inicio</a> › <a href="/analytics">Análisis grupal</a> › <a href="/analytics/average-monthly-wages">Salarios (MJP)</a> › <span>Mapa mundial</span>
  </nav>

  <h1>Mapa mundial del salario mensual medio (USD)</h1>

  <p class="description">
    Esta visualización geoespacial muestra el salario mensual medio en dólares estadounidenses
    de cada país usando todos los años disponibles en la API. Cada país se clasifica según
    si su salario medio está por encima o por debajo de la media global calculada con todos 
    los países representados.
  </p>

  {#if loading}
    <div class="status-container">
      <div class="spinner"></div>
      <p>Cargando mapa mundial y datos salariales...</p>
    </div>
  {:else if error}
    <div class="error-container">
      <p><strong>⚠️ Error:</strong> {error}</p>
      <button onclick={() => loadMapPage()}>Reintentar</button>
    </div>
    
  {/if}

  <div
    bind:this={chartContainer}
    class="map-container"
    aria-label="Mapa mundial del salario mensual medio"
  ></div>
</section>

<style>
  .analytics-map-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }

  .breadcrumb {
    font-size: 0.85rem;
    color: #64748b;
    margin-bottom: 1rem;
    text-align: center;
  }
  
  .breadcrumb a {
    color: #2563eb;
    text-decoration: none;
  }
  
  .breadcrumb a:hover {
    text-decoration: underline;
  }

  h1 {
    font-size: 1.8rem;
    margin-bottom: 0.5rem;
    color: #1e293b;
    text-align: center;
  }

  .description {
    max-width: 900px;
    margin: 0 auto 2rem auto;
    text-align: center;
    color: #475569;
    font-size: 1.05rem;
    line-height: 1.5;
  }

  .status-container {
    padding: 3rem;
    text-align: center;
    color: #64748b;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f1f5f9;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    margin: 0 auto 1rem;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error-container {
    background: #fff1f2;
    border: 1px solid #fda4af;
    padding: 2rem;
    border-radius: 10px;
    color: #9f1239;
    text-align: center;
    margin-bottom: 1rem;
  }

  .error-container button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: #e11d48;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-weight: 600;
  }

  .error-container button:hover {
    background: #be123c;
  }

  .summary {
    max-width: 1000px;
    margin: 0 auto 2rem auto;
    padding: 1.5rem;
    border-radius: 12px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .summary-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .label {
    font-size: 0.85rem;
    color: #64748b;
    font-weight: 500;
  }

  .value {
    font-size: 1.1rem;
    color: #1e293b;
    font-weight: 700;
  }

  .value.highlight {
    color: #2563eb;
  }

  .value.green {
    color: #16a34a;
  }

  .value.red {
    color: #dc2626;
  }

  .map-container {
    width: 100%;
    min-height: 650px;
    margin-top: 1rem;
    background: white;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
    border: 1px solid #e2e8f0;
  }

  @media (max-width: 768px) {
    .analytics-map-page {
      padding: 1rem;
    }

    h1 {
      font-size: 1.4rem;
    }

    .summary-grid {
      grid-template-columns: 1fr;
    }
  }
</style>