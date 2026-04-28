<script>
  import Highcharts from "highcharts";
  import { onMount, onDestroy, tick } from "svelte";
  
  let chartContainer = $state();
  let chart = $state();
  let loading = $state(true);
  let error = $state(null);

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
    // Agrupar por país y calcular la media de avg_monthly_usd
    const porPais = {};
    datos.forEach(d => {
      if (!porPais[d.country]) porPais[d.country] = [];
      porPais[d.country].push(Number(d.avg_monthly_usd));
    });

    const slices = Object.entries(porPais).map(([pais, valores]) => {
      const media = valores.reduce((a, b) => a + b, 0) / valores.length;
      return {
        name: pais.charAt(0).toUpperCase() + pais.slice(1),
        y: Number(media.toFixed(2))
      };
    });

    // Ordenar de mayor a menor
    slices.sort((a, b) => b.y - a.y);

    return slices;
  }

  function pintarGrafica(slices) {
    if (!chartContainer) return;
    if (chart) { chart.destroy(); chart = null; }

    chart = Highcharts.chart(chartContainer, {
      chart: {
        type: "pie"
      },

      title: {
        text: "Distribución del Salario Mensual Medio por País (USD)"
      },

      subtitle: {
        text: "Media de todos los años disponibles — Fuente: API average-monthly-wages (MJP)"
      },

      tooltip: {
        pointFormat: "<b>{point.name}</b>: <b>${point.y:,.2f}</b> USD/mes ({point.percentage:.1f}%)"
      },

      accessibility: {
        enabled: true,
        description: "Gráfico circular que muestra la distribución del salario mensual medio en USD por país."
      },

      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: "pointer",
          dataLabels: {
            enabled: true,
            format: "<b>{point.name}</b><br>${point.y:,.0f}",
            style: { fontSize: "12px" }
          },
          showInLegend: true
        }
      },

      legend: {
        enabled: true,
        layout: "vertical",
        align: "right",
        verticalAlign: "middle"
      },

      credits: { enabled: false },

      series: [{
        name: "Salario medio (USD)",
        colorByPoint: true,
        data: slices
      }]
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

      const slices = prepararDatosParaGrafica(datos);

      loading = false;

      await tick();

      pintarGrafica(slices);

    } catch (e) {
      if (e.name === "AbortError") {
        error = "La API ha tardado demasiado en responder.";
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

  <h1>Distribución del Salario Mensual Medio por País</h1>

  <p class="description">
    Esta visualización de tipo <strong>circular (pie)</strong> muestra la distribución
    del salario mensual medio en dólares estadounidenses (USD) para cada país disponible,
    calculando la media de todos los años registrados. Permite comparar de forma visual
    el peso relativo de cada país en términos salariales.
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
  {:else}
  <div bind:this={chartContainer} class="chart-container"></div>
  {/if}
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
  .breadcrumb a:hover { text-decoration: underline; }

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

  @keyframes spin { to { transform: rotate(360deg); } }

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