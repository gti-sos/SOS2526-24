<script>
  import Highcharts from "highcharts";
  import { onMount, onDestroy } from "svelte";

  let chartContainer;
  let chart;

  let loading = true;
  let error = null;

  const API = "/api/v2/average-monthly-wages";

  async function fetchConTimeout(url, timeout = 8000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      return await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function prepararDatosParaGrafica(datos) {
    // Obtener países únicos ordenados
    const paises = [...new Set(datos.map(d => d.country))].sort();

    // Obtener años únicos ordenados
    const anios = [...new Set(datos.map(d => d.year))].sort((a, b) => a - b);

    // Crear una serie por cada año
    const series = anios.map(anio => ({
      name: `Año ${anio}`,
      data: paises.map(pais => {
        const registro = datos.find(d => d.country === pais && d.year === anio);
        return registro ? Number(registro.avg_monthly_usd) : null;
      })
    }));

    return { paises, series };
  }

  function pintarGrafica(paises, series) {
    if (!chartContainer) return;
    if (chart) { chart.destroy(); chart = null; }

    chart = Highcharts.chart(chartContainer, {
      chart: {
        type: "column"
      },

      title: {
        text: "Salario Mensual Medio por País (USD)"
      },

      subtitle: {
        text: "Fuente: API average-monthly-wages (MJP) — datos en dólares estadounidenses"
      },

      xAxis: {
        categories: paises,
        crosshair: true,
        title: { text: "País" },
        labels: {
          style: { fontSize: "12px" },
          rotation: -30
        }
      },

      yAxis: {
        min: 0,
        title: { text: "Salario mensual medio (USD)" },
        labels: { format: "${value:,.0f}" }
      },

      tooltip: {
        shared: true,
        valuePrefix: "$",
        valueDecimals: 2,
        pointFormat:
          '<span style="color:{series.color}">\u25CF</span> {series.name}: <b>${point.y:,.2f}</b><br/>'
      },

      plotOptions: {
        column: {
          pointPadding: 0.2,
          borderWidth: 0,
          dataLabels: {
            enabled: false
          }
        }
      },

      legend: {
        enabled: true,
        title: { text: "Año" }
      },

      accessibility: {
        enabled: true,
        description: "Gráfico de columnas que muestra el salario mensual medio en USD por país y año."
      },

      credits: { enabled: false },

      series: series
    });
  }

  async function cargarGrafica() {
    loading = true;
    error = null;

    try {
      const response = await fetchConTimeout(API);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudo conectar con la API.`);
      }

      const datos = await response.json();

      if (!Array.isArray(datos) || datos.length === 0) {
        throw new Error("La base de datos está vacía. Carga los datos iniciales primero.");
      }

      const { paises, series } = prepararDatosParaGrafica(datos);

      loading = false;

      // Esperamos a que Svelte renderice el contenedor
      await new Promise(resolve => setTimeout(resolve, 50));

      pintarGrafica(paises, series);

    } catch (e) {
      if (e.name === "AbortError") {
        error = "La API ha tardado demasiado en responder. Revisa que /api/v2/average-monthly-wages funcione correctamente.";
      } else {
        error = e.message;
      }
      loading = false;
    }
  }

  onMount(() => {
    cargarGrafica();
  });

  onDestroy(() => {
    if (chart) chart.destroy();
  });
</script>

<svelte:head>
  <title>Salarios Mensuales Medios — Analytics MJP</title>
</svelte:head>

<section class="analytics-page">
  <nav class="breadcrumb">
    <a href="/">Inicio</a> › <a href="/analytics">Análisis grupal</a> › <span>Salarios Mensuales (MJP)</span>
  </nav>

  <h1>Salario Mensual Medio por País</h1>

  <p class="description">
    Esta visualización de tipo <strong>columnas agrupadas</strong> muestra el salario mensual
    medio en dólares estadounidenses (USD) para cada país disponible en la base de datos,
    desglosado por año. Permite comparar fácilmente la evolución salarial entre países y periodos.
  </p>

  {#if loading}
    <div class="status-container">
      <div class="spinner"></div>
      <p>Cargando datos de salarios...</p>
    </div>
  {:else if error}
    <div class="error-container">
      <p><strong>⚠️ Error:</strong> {error}</p>
      <button onclick={() => cargarGrafica()}>Reintentar</button>
    </div>
  {/if}

  <div bind:this={chartContainer} class="chart-container"></div>
</section>

<style>
  .analytics-page {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2rem;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }

  .breadcrumb {
    font-size: 0.85rem;
    color: #64748b;
    margin-bottom: 1rem;
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
    color: #1e293b;
    margin-bottom: 0.5rem;
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

  .chart-container {
    width: 100%;
    min-height: 520px;
    background: white;
    border-radius: 15px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
    padding: 1.5rem;
    border: 1px solid #e2e8f0;
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
  }
</style>