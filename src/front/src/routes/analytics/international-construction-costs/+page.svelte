<script>
  import Highcharts from "highcharts";
  import { onMount, tick } from "svelte";

  // --- ESTADO REACTIVO (SVELTE 5 RUNES) ---
  let chartContainer = $state();
  let loading = $state(true);
  let error = $state(null);

  // Tu ruta de API (Isaac)
  const API = "/api/v2/international-construction-costs";

  /**
   * Transforma los datos brutos de la API para el formato Polar (Rosa de los Vientos)
   * Eje X (Círculo): Ciudades
   * Series (Colores): Años apilados
   */
  function prepararDatosPolares(datos) {
    // 1. Obtener ciudades únicas (serán las categorías del círculo)
    const ciudades = [...new Set(datos.map(d => `${d.city} (${d.country})`))].sort();
    
    // 2. Obtener años únicos (serán las diferentes capas de color)
    const anios = [...new Set(datos.map(d => d.year))].sort((a, b) => a - b);

    // 3. Crear una serie para cada año
    const series = anios.map(anio => {
      return {
        name: `Año ${anio}`,
        data: ciudades.map(ciudad => {
          // Buscamos el coste para esta ciudad en este año concreto
          const registro = datos.find(d => `${d.city} (${d.country})` === ciudad && d.year === anio);
          return registro ? Number(registro.cost_usd_per_m2) : 0;
        })
      };
    });

    return { ciudades, series };
  }

  onMount(async () => {
    try {
      console.log("Iniciando carga de componentes...");

      // --- CARGA DINÁMICA DE MÓDULOS (Evita Error 500 y .default is not a function) ---
      
      // 1. Módulo para gráficos Polares (Highcharts More)
      const moreModule = await import("highcharts/highcharts-more");
      const initMore = moreModule.default || moreModule;
      if (typeof initMore === 'function') initMore(Highcharts);

      // 2. Módulo de Accesibilidad (Requisito del proyecto)
      const accModule = await import("highcharts/modules/accessibility");
      const initAcc = accModule.default || accModule;
      if (typeof initAcc === 'function') initAcc(Highcharts);

      // --- OBTENCIÓN DE DATOS ---
      const response = await fetch(API);
      if (!response.ok) throw new Error(`Error ${response.status}: No se pudo conectar con la API.`);
      
      const datosBrutos = await response.json();
      if (!datosBrutos || datosBrutos.length === 0) {
        throw new Error("La base de datos está vacía. Carga los datos iniciales primero.");
      }

      const { ciudades, series } = prepararDatosPolares(datosBrutos);

      // --- RENDERIZADO ---
      loading = false; 
      await tick(); // Esperamos a que Svelte dibuje el contenedor

      Highcharts.chart(chartContainer, {
        chart: {
          polar: true, // Esto activa el formato circular
          type: 'column'
        },
        title: {
          text: 'Visualización Polar de Costes de Construcción'
        },
        subtitle: {
          text: 'Fuente: API International Construction Costs (Isaac)'
        },
        pane: {
          size: '85%'
        },
        xAxis: {
          categories: ciudades,
          tickmarkPlacement: 'on',
          labels: {
            style: { fontSize: '11px' }
          }
        },
        yAxis: {
          min: 0,
          endOnTick: false,
          showLastLabel: true,
          title: { text: 'Coste (USD/m²)' },
          labels: { format: '${value}' }
        },
        tooltip: {
          shared: true,
          pointFormat: '<span style="color:{series.color}">\u25CF</span> {series.name}: <b>{point.y} $</b><br/>'
        },
        plotOptions: {
          series: {
            stacking: 'normal', // Apila los años
            shadow: false,
            groupPadding: 0,
            pointPlacement: 'on'
          }
        },
        accessibility: {
          enabled: true,
          description: 'Gráfico circular que muestra el coste de construcción por ciudad y año.'
        },
        series: series,
        credits: { enabled: false }
      });

    } catch (err) {
      console.error("Fallo en la visualización:", err);
      error = err.message;
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Análisis Polar – Isaac</title>
</svelte:head>

<div class="analytics-page">
  <nav class="breadcrumb">
    <a href="/">Inicio</a> › <a href="/analytics">Análisis grupal</a> › <span>Visualización Polar (Isaac)</span>
  </nav>

  <h1>Rosa de Costes de Construcción Internacional</h1>

  <p class="description">
    Esta visualización de tipo <strong>polar</strong> permite comparar de forma radial 
    la inversión necesaria en el sector de la construcción. Cada segmento representa una ciudad 
    y los niveles de color indican los costes registrados en diferentes periodos anuales.
  </p>

  {#if loading}
    <div class="status-container">
      <div class="spinner"></div>
      <p>Generando visualización polar...</p>
    </div>
  {:else if error}
    <div class="error-container">
      <p><strong>⚠️ Error técnico:</strong> {error}</p>
      <button onclick={() => window.location.reload()}>Reintentar carga</button>
    </div>
  {:else}
    <div 
      bind:this={chartContainer} 
      class="chart-container"
    ></div>
  {/if}

  <p class="footnote">
    Nota: La longitud de cada "pétalo" representa el coste acumulado o individual por ciudad.
  </p>
</div>

<style>
  .analytics-page {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }

  .breadcrumb { font-size: 0.85rem; color: #64748b; margin-bottom: 1rem; }
  .breadcrumb a { color: #2563eb; text-decoration: none; }

  h1 { font-size: 1.8rem; color: #1e293b; margin-bottom: 0.5rem; }
  .description { color: #475569; margin-bottom: 2rem; line-height: 1.5; }

  .chart-container {
    width: 100%;
    height: 600px;
    background: white;
    border-radius: 15px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
    padding: 1.5rem;
    border: 1px solid #e2e8f0;
  }

  .status-container { padding: 5rem; text-align: center; color: #64748b; }
  .spinner {
    width: 40px; height: 40px;
    border: 4px solid #f1f5f9; border-top: 4px solid #3b82f6;
    border-radius: 50%; margin: 0 auto 1rem;
    animation: spin 1s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .error-container {
    background: #fff1f2; border: 1px solid #fda4af;
    padding: 2rem; border-radius: 10px; color: #9f1239; text-align: center;
  }

  .error-container button {
    margin-top: 1rem; padding: 0.5rem 1rem;
    background: #e11d48; color: white; border: none; border-radius: 5px; cursor: pointer;
  }

  .footnote { font-size: 0.8rem; color: #94a3b8; margin-top: 1.5rem; text-align: center; }
</style>