<script>
  import Highcharts from "highcharts";
  import { onMount, onDestroy } from "svelte";

  let chartContainer;
  let chart;

  let loading = true;
  let error = null;
  let warnings = [];

  const COUNTRY = "Canada";
  const YEARS = [2021, 2022, 2023, 2024];

  const APIS = [
    {
      name: "Gasto en ocio y cultura",
      endpoints: [
        "/api/v2/recreation-culture-expenditure",
        "/api/v1/recreation-culture-expenditure"
      ],
      preferredFields: [
        "recreation_per_capita",
        "recreation_value",
        "recreation_share"
      ]
    },
    {
      name: "Salario medio mensual",
      endpoints: [
        "/api/v1/average-monthly-wages",
        "/api/v2/average-monthly-wages"
      ],
      preferredFields: [
        "average_monthly_wage",
        "average_monthly_wages",
        "monthly_wage",
        "average_wage",
        "wage",
        "salary",
        "value"
      ]
    },
    {
      name: "Coste de construcción",
      endpoints: [
        "/api/v1/international-construction-costs",
        "/api/v2/international-construction-costs"
      ],
      preferredFields: [
        "cost_usd_per_m2",
        "construction_cost"
      ]
    }
  ];

  async function fetchConTimeout(url, timeout = 8000) {
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

  function normalizarTexto(value) {
    return String(value).trim().toLowerCase();
  }

  async function cargarDatosDeApi(api) {
    let lastError = null;

    for (const endpoint of api.endpoints) {
      try {
        const response = await fetchConTimeout(endpoint);

        if (!response.ok) {
          lastError = `${endpoint} respondió con ${response.status}`;
          continue;
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          lastError = `${endpoint} no devolvió un array`;
          continue;
        }

        return {
          endpoint,
          data
        };
      } catch (e) {
        lastError = `${endpoint}: ${e.message}`;
      }
    }

    throw new Error(lastError ?? `No se pudo cargar ${api.name}`);
  }

  function obtenerCampoPais(record) {
    if (record.country !== undefined) return "country";
    if (record.pais !== undefined) return "pais";
    if (record.location !== undefined) return "location";
    return null;
  }

  function obtenerCampoAnio(record) {
    if (record.year !== undefined) return "year";
    if (record.anio !== undefined) return "anio";
    if (record.date !== undefined) return "date";
    return null;
  }

  function obtenerValorNumerico(record, preferredFields) {
    for (const field of preferredFields) {
      if (
        record[field] !== undefined &&
        record[field] !== null &&
        record[field] !== "" &&
        !Number.isNaN(Number(record[field]))
      ) {
        return Number(record[field]);
      }
    }

    const forbiddenFields = new Set([
      "year",
      "anio",
      "country",
      "pais",
      "location",
      "_id",
      "id"
    ]);

    const numericCandidates = Object.entries(record)
      .filter(([key, value]) => {
        return (
          !forbiddenFields.has(key) &&
          value !== null &&
          value !== "" &&
          !Number.isNaN(Number(value))
        );
      })
      .map(([key, value]) => ({
        key,
        value: Number(value)
      }));

    if (numericCandidates.length === 0) {
      return null;
    }

    return numericCandidates[0].value;
  }

  function obtenerRegistrosPorPaisYAnio(data, year) {
    return data.filter((record) => {
      const countryField = obtenerCampoPais(record);
      const yearField = obtenerCampoAnio(record);

      if (!countryField || !yearField) {
        return false;
      }

      return (
        normalizarTexto(record[countryField]) === normalizarTexto(COUNTRY) &&
        Number(record[yearField]) === Number(year)
      );
    });
  }

  function obtenerValorMedioPorPaisYAnio(data, year, preferredFields) {
    const registros = obtenerRegistrosPorPaisYAnio(data, year);

    const valores = registros
      .map((record) => obtenerValorNumerico(record, preferredFields))
      .filter((value) => value !== null && !Number.isNaN(Number(value)));

    if (valores.length === 0) {
      return null;
    }

    const suma = valores.reduce((total, value) => total + value, 0);
    return suma / valores.length;
  }

  function prepararSerie(api, data) {
    const valoresReales = YEARS.map((year) =>
      obtenerValorMedioPorPaisYAnio(data, year, api.preferredFields)
    );

    const primerValorValido = valoresReales.find(
      (value) => value !== null && value !== 0
    );

    if (!primerValorValido) {
      throw new Error(
        `No hay datos suficientes para ${api.name} en ${COUNTRY}.`
      );
    }

    const valoresNormalizados = valoresReales.map((value) => {
      if (value === null) {
        return null;
      }

      return Number(((value / primerValorValido) * 100).toFixed(2));
    });

    return {
      name: api.name,
      data: valoresNormalizados
    };
  }

  function pintarGrafica(series) {
    if (!chartContainer) {
      return;
    }

    if (chart) {
      chart.destroy();
      chart = null;
    }

    chart = Highcharts.chart(chartContainer, {
      chart: {
        type: "bar"
      },

      title: {
        text: `Evolución comparada de indicadores del grupo en ${COUNTRY}`
      },

      subtitle: {
        text:
          "Valores normalizados con índice base 100. Si hay varios registros del mismo país y año, se usa su media."
      },

      xAxis: {
        categories: YEARS.map(String),
        title: {
          text: "Año"
        },
        gridLineWidth: 1,
        lineWidth: 0
      },

      yAxis: {
        min: 0,
        title: {
          text: "Índice base 100",
          align: "high"
        },
        labels: {
          overflow: "justify"
        },
        gridLineWidth: 0
      },

      tooltip: {
        shared: true,
        valueSuffix: " puntos",
        valueDecimals: 2
      },

      plotOptions: {
        bar: {
          borderRadius: "50%",
          dataLabels: {
            enabled: true,
            format: "{point.y:.2f}"
          },
          groupPadding: 0.1
        }
      },

      legend: {
        layout: "vertical",
        align: "right",
        verticalAlign: "top",
        x: -40,
        y: 80,
        floating: true,
        borderWidth: 1,
        backgroundColor: "var(--highcharts-background-color, #ffffff)",
        shadow: true
      },

      credits: {
        enabled: false
      },

      series
    });
  }

  async function cargarGrafica() {
    loading = true;
    error = null;
    warnings = [];

    try {
      const results = await Promise.allSettled(
        APIS.map(async (api) => {
          const { data } = await cargarDatosDeApi(api);
          return prepararSerie(api, data);
        })
      );

      const series = [];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          series.push(result.value);
        } else {
          warnings = [
            ...warnings,
            `No se pudo incluir ${APIS[index].name}: ${result.reason.message}`
          ];
        }
      });

      if (series.length === 0) {
        throw new Error(
          "No se ha podido construir la gráfica con ninguna API del grupo."
        );
      }

      pintarGrafica(series);
    } catch (e) {
      if (e.name === "AbortError") {
        error =
          "Alguna API ha tardado demasiado en responder. Revisa que las APIs estén funcionando.";
      } else {
        error = e.message;
      }
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    cargarGrafica();
  });

  onDestroy(() => {
    if (chart) {
      chart.destroy();
    }
  });
</script>

<svelte:head>
  <title>Analytics grupal - SOS2526-24</title>
</svelte:head>

<section class="analytics-page">
  <h1>Visualización integrada del grupo</h1>

  <p class="description">
    Esta gráfica compara datos de las APIs de los miembros del grupo para Canada.
    Como cada API utiliza unidades distintas, los valores se han normalizado con índice
    base 100. Si una API tiene varios registros para Canada en el mismo año, se calcula
    la media de esos registros antes de normalizar.
  </p>

  {#if loading}
    <p class="status">Cargando datos de las APIs del grupo...</p>
  {:else if error}
    <p class="error">{error}</p>
  {:else if warnings.length > 0}
    <div class="warning">
      <p><strong>Aviso:</strong> la gráfica se ha generado, pero faltan algunos datos.</p>
      {#each warnings as warning}
        <p>{warning}</p>
      {/each}
    </div>
  {/if}

  <div
    bind:this={chartContainer}
    class="chart-container"
    aria-label="Gráfica de barras comparando las APIs del grupo en Canada"
  ></div>
</section>

<style>
  .analytics-page {
    padding: 2rem;
  }

  .analytics-page h1 {
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

  .error,
  .warning {
    max-width: 950px;
    margin: 1rem auto;
    padding: 1rem;
    border-radius: 0.75rem;
    text-align: center;
    font-weight: 600;
  }

  .error {
    background-color: #ffe8e8;
    color: #8a1f1f;
  }

  .warning {
    background-color: #fff6df;
    color: #6f4e00;
  }

  .warning p {
    margin: 0.35rem 0;
  }

  .chart-container {
    width: 100%;
    min-height: 560px;
    margin-top: 1rem;
    background: white;
  }
</style>