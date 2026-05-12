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
  const MAP_ROUTE = "/analytics/recreation-culture-expenditure/map";

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
      color: "#b54a4a",
      fillOpacity: 0.12,
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
        return Number((suma / valoresDelAnio.length).toFixed(2));
      })
    };

    return {
      years: yearsPreparados,
      series: [...seriesPaises, serieMediaAnual]
    };
  }

  function pintarGrafica() {
    if (!chartContainer) {
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
        type: "area",
        height: 430,
        spacing: [18, 24, 18, 24]
      },

      title: {
        text: "Evolución del gasto en ocio y cultura por persona",
        style: {
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: "1.7rem",
          fontWeight: "700",
          color: "#12332f"
        }
      },

      subtitle: {
        text: "Datos obtenidos desde la API v2 de recreation-culture-expenditure",
        style: {
          color: "#526e68",
          fontSize: "0.85rem"
        }
      },

      xAxis: {
        categories: years.map(String),
        title: {
          text: "Año"
        },
        lineColor: "#d9e2df",
        tickColor: "#d9e2df"
      },

      yAxis: {
        title: {
          text: "Gasto por persona"
        },
        labels: {
          format: "{value:,.2f}"
        },
        gridLineColor: "#edf2f0"
      },

      tooltip: {
        shared: true,
        valueDecimals: 2,
        pointFormat:
          '<span style="color:{series.color}">●</span> {series.name}: <b>{point.y:,.2f}</b><br/>'
      },

      plotOptions: {
        area: {
          fillOpacity: 0.28,
          lineWidth: 2,
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
        },
        series: {
          animation: {
            duration: 700
          }
        }
      },

      legend: {
        enabled: true,
        layout: "horizontal",
        align: "center",
        verticalAlign: "bottom",
        maxHeight: 95,
        title: {
          text: "Países y media anual",
          style: {
            color: "#12332f",
            fontWeight: "600"
          }
        },
        itemStyle: {
          color: "#12332f",
          fontWeight: "500",
          fontSize: "0.8rem"
        },
        navigation: {
          enabled: true
        }
      },

      credits: {
        enabled: false
      },

      responsive: {
        rules: [
          {
            condition: {
              maxWidth: 700
            },
            chartOptions: {
              chart: {
                height: 380
              },
              legend: {
                maxHeight: 80,
                itemStyle: {
                  fontSize: "0.72rem"
                }
              }
            }
          }
        ]
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

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<section class="analytics-page">
  <h1>Gasto en ocio y cultura por persona</h1>

  <p class="description">
    Esta visualización muestra la evolución del gasto en ocio y cultura por persona.
    Cada área representa un país y también se incluye una serie adicional con la media anual
    de gasto por persona calculada a partir de todos los países disponibles en cada año.
  </p>

  <div class="actions">
    <a class="map-button" href={MAP_ROUTE}>
      Ver visualización en mapa
    </a>
  </div>

  {#if !loading && error}
    <p class="error">{error}</p>
  {/if}

  <div
    bind:this={chartContainer}
    class="chart-container"
    aria-label="Gráfica de área sobre el gasto en ocio y cultura por persona"
  ></div>
</section>

<style>
  .analytics-page {
    padding: 2rem 1rem 3rem;
  }

  .analytics-page h1 {
    margin-bottom: 0.75rem;
    color: #fefefe;
    text-align: center;
    font-family: "Cormorant Garamond", serif;
    font-size: clamp(2.2rem, 4vw, 3.4rem);
    font-weight: 700;
    line-height: 1.05;
  }

  .description {
    max-width: 900px;
    margin: 0 auto 1.25rem auto;
    text-align: center;
    color: #3f5f59;
    font-size: 1.02rem;
    line-height: 1.5;
  }

  .actions {
    display: flex;
    justify-content: center;
    margin: 0.75rem auto 1.5rem;
  }

  .map-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1.15rem;
    border-radius: 999px;
    background-color: #12332f;
    color: #ffffff;
    text-decoration: none;
    font-weight: 700;
    font-size: 0.95rem;
    box-shadow: 0 8px 18px rgba(18, 51, 47, 0.18);
    transition:
      transform 0.15s ease,
      background-color 0.15s ease,
      box-shadow 0.15s ease;
  }

  .map-button:hover {
    background-color: #1e4a43;
    transform: translateY(-1px);
    box-shadow: 0 10px 22px rgba(18, 51, 47, 0.24);
  }

  .map-button:focus {
    outline: 3px solid rgba(18, 51, 47, 0.28);
    outline-offset: 3px;
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
    width: min(100%, 1120px);
    height: 430px;
    min-height: 0;
    margin: 1rem auto 0;
    background: #ffffff;
    border-radius: 1rem;
    box-shadow: 0 10px 28px rgba(18, 51, 47, 0.12);
    overflow: hidden;
  }

  @media (max-width: 768px) {
    .analytics-page {
      padding: 1.5rem 0.75rem 2rem;
    }

    .description {
      font-size: 0.95rem;
    }

    .map-button {
      width: 100%;
      max-width: 320px;
    }

    .chart-container {
      height: 380px;
    }
  }
</style>