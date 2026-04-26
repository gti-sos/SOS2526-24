<script>
  import Highcharts from "highcharts";
  import { onMount, onDestroy } from "svelte";

  let chartContainer;
  let chart;

  let loading = true;
  let error = null;

  let years = [];
  let allSeries = [];

  const API = "/api/v2/recreation-culture-expenditure";

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

  function prepararDatosParaGrafica(datos) {
    const datosValidos = datos
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

    const yearsPreparados = [...new Set(datosValidos.map((d) => d.year))]
      .sort((a, b) => a - b);

    const countriesPreparados = [...new Set(datosValidos.map((d) => d.country))]
      .sort((a, b) => a.localeCompare(b));

    const seriesPaises = countriesPreparados.map((country) => {
      const datosPais = datosValidos.filter((d) => d.country === country);

      const valoresPorAnio = new Map(
        datosPais.map((d) => [d.year, d.recreation_per_capita])
      );

      return {
        name: country,
        data: yearsPreparados.map((year) => valoresPorAnio.get(year) ?? null)
      };
    });

    const serieMediaAnual = {
        name: "Media anual",
        color: "red",
        fillOpacity: 0.15,
        marker: {
            enabled: true,
            radius: 4
        },
        data: yearsPreparados.map((year) => {
            const valoresDelAnio = datosValidos
            .filter((d) => d.year === year)
            .map((d) => d.recreation_per_capita);

            if (valoresDelAnio.length === 0) {
            return null;
            }

            const suma = valoresDelAnio.reduce((total, valor) => total + valor, 0);
            return suma / valoresDelAnio.length;
        })
        };

    return {
      years: yearsPreparados,
      series: [...seriesPaises, serieMediaAnual]
    };
  }

  function pintarGrafica() {
    if (!chartContainer) {
      console.error("No existe el contenedor de la gráfica.");
      return;
    }

    if (chart) {
      chart.destroy();
      chart = null;
    }

    if (allSeries.length === 0) {
      return;
    }

    chart = Highcharts.chart(chartContainer, {
      chart: {
        type: "area"
      },

      title: {
        text: "Evolución del gasto en ocio y cultura por persona"
      },

      subtitle: {
        text: "Datos obtenidos desde la API v2 de recreation-culture-expenditure"
      },

      xAxis: {
        categories: years,
        title: {
          text: "Año"
        }
      },

      yAxis: {
        title: {
          text: "Gasto por persona"
        },
        labels: {
          format: "{value:,.2f}"
        }
      },

      tooltip: {
        shared: true,
        valueDecimals: 2,
        pointFormat:
          '<span style="color:{series.color}">\u25CF</span> {series.name}: <b>{point.y:,.2f}</b><br/>'
      },

      plotOptions: {
        area: {
          fillOpacity: 0.35,
          marker: {
            enabled: false,
            symbol: "circle",
            radius: 2,
            states: {
              hover: {
                enabled: true
              }
            }
          }
        }
      },

      legend: {
        enabled: true,
        title: {
          text: "Países y media anual"
        }
      },

      credits: {
        enabled: true
      },

      series: allSeries
    });
  }

  async function cargarGrafica() {
    loading = true;
    error = null;

    try {
      const response = await fetchConTimeout(API);

      if (!response.ok) {
        throw new Error(
          `No se pudieron cargar los datos de la API. Código recibido: ${response.status}`
        );
      }

      const datos = await response.json();

      if (!Array.isArray(datos)) {
        throw new Error("La API no ha devuelto una lista de registros.");
      }

      const preparedData = prepararDatosParaGrafica(datos);

      years = preparedData.years;
      allSeries = preparedData.series;

      if (years.length === 0 || allSeries.length === 0) {
        throw new Error("No hay datos suficientes para construir la gráfica.");
      }

      pintarGrafica();
    } catch (e) {
      if (e.name === "AbortError") {
        error =
          "La API ha tardado demasiado en responder. Revisa que /api/v2/recreation-culture-expenditure funcione correctamente.";
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
  <title>Gasto en Recreación y Cultura – Analytics</title>
</svelte:head>

<section class="analytics-page">
  <h1>Gasto en ocio y cultura por persona</h1>

  <p class="description">
    Esta visualización muestra la evolución del gasto en ocio y cultura por persona.
    Cada área representa un país y también se incluye una serie adicional con la media anual
    de gasto por persona calculada a partir de todos los países disponibles en cada año.
  </p>

  {#if loading}
    <p class="status">Cargando datos de la API...</p>
  {:else if error}
    <p class="error">{error}</p>
  {/if}

  <div bind:this={chartContainer} class="chart-container"></div>
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
    max-width: 900px;
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

  .chart-container {
    width: 100%;
    min-height: 520px;
    margin-top: 1rem;
    background: white;
  }
</style>