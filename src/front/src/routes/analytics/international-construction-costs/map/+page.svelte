<script>
  import Highcharts from "highcharts";
  import { onMount, tick } from "svelte";

  // --- ESTADO REACTIVO (SVELTE 5) ---
  let chartContainer = $state();
  let chartInstance = null;
  let loading = $state(true);
  let error = $state(null);
  
  let rawData = [];
  let availableYears = $state([]);
  let selectedYear = $state();

  const API = "/api/v2/international-construction-costs";

  // Mapeo de tus nombres de país a códigos ISO-A3
  const isoMapping = {
    "USA": "USA",
    "Canada": "CAN",
    "uk": "GBR",
    "Spain": "ESP",
    "Italy": "ITA",
    "Ireland": "IRL",
    "Germany": "DEU",
    "Poland": "POL"
  };

  function prepararDatosMapa(anio) {
    const filtrados = rawData.filter(d => Number(d.year) === Number(anio));
    const porPais = {};
    
    filtrados.forEach(d => {
      const code = isoMapping[d.country];
      if (code) {
        if (!porPais[code]) porPais[code] = [];
        porPais[code].push(Number(d.cost_usd_per_m2));
      }
    });

    return Object.entries(porPais).map(([code, valores]) => ({
      code: code,
      value: Math.round(valores.reduce((a, b) => a + b, 0) / valores.length)
    }));
  }

  async function cambiarAnio(anio) {
    selectedYear = anio;
    const nuevosDatos = prepararDatosMapa(anio);
    if (chartInstance) {
      chartInstance.series[0].setData(nuevosDatos);
      chartInstance.setTitle({ text: `Coste Medio de Construcción (${anio})` });
    }
  }

  onMount(async () => {
    try {
      console.log("Cargando módulos de mapa...");

      // --- CARGA DE MÓDULOS (Solución al error "not a function") ---
      
      // 1. Módulo de Mapas
      const mapModule = await import("highcharts/modules/map");
      // Truco: Highcharts Maps a veces requiere una inicialización específica
      const initMap = mapModule.default || mapModule;
      if (typeof initMap === 'function') {
        initMap(Highcharts);
      }

      // 2. Módulo de Accesibilidad
      const accModule = await import("highcharts/modules/accessibility");
      const initAcc = accModule.default || accModule;
      if (typeof initAcc === 'function') {
        initAcc(Highcharts);
      }

      // 3. Obtener Topología del mundo
      const topology = await fetch(
        'https://code.highcharts.com/mapdata/custom/world.topo.json'
      ).then(r => r.json());

      // 4. Obtener Datos de la API
      const response = await fetch(API);
      if (!response.ok) throw new Error("No se pudo acceder a la API.");
      rawData = await response.json();
      
      if (rawData.length === 0) throw new Error("La base de datos está vacía.");

      // Extraer años disponibles
      availableYears = [...new Set(rawData.map(d => d.year))].sort((a, b) => b - a);
      selectedYear = availableYears[0];

      loading = false;
      await tick();

      // --- CREACIÓN DEL MAPA ---
      chartInstance = Highcharts.mapChart(chartContainer, {
        chart: { map: topology },
        title: { text: `Coste Medio de Construcción (${selectedYear})` },
        subtitle: { text: 'Usa los botones para cambiar de año' },
        
        mapNavigation: {
          enabled: true,
          buttonOptions: { verticalAlign: 'bottom' }
        },

        colorAxis: {
          min: 0,
          minColor: '#E6E7FA',
          maxColor: '#7010f9',
          labels: { format: '{value}$' }
        },

        series: [{
          name: 'Coste Medio USD/m²',
          joinBy: ['iso-a3', 'code'],
          data: prepararDatosMapa(selectedYear),
          states: {
            hover: { color: '#00f194' }
          },
          dataLabels: {
            enabled: true,
            format: '{point.value}$'
          }
        }],
        
        credits: { enabled: false }
      });

    } catch (err) {
      console.error("Fallo en el mapa:", err);
      error = err.message;
      loading = false;
    }
  });
</script>

<div class="map-page">
  <nav class="breadcrumb">
    <a href="/">Inicio</a> › <a href="/analytics">Análisis</a> › <span>Mapa Geoespacial</span>
  </nav>

  <h1>Localización Global de Costes</h1>

  {#if loading}
    <div class="status">🌀 Cargando topografía y datos...</div>
  {:else if error}
    <div class="error-box">
      <p>⚠️ Error: {error}</p>
      <button onclick={() => window.location.reload()}>Reintentar</button>
    </div>
  {:else}
    <div class="filter-bar">
      <span class="label">Seleccionar periodo:</span>
      {#each availableYears as anio}
        <button 
          class:active={selectedYear === anio} 
          onclick={() => cambiarAnio(anio)}
        >
          {anio}
        </button>
      {/each}
    </div>

    <div bind:this={chartContainer} class="map-container"></div>
  {/if}
</div>

<style>
  .map-page { max-width: 1200px; margin: 0 auto; padding: 2rem; font-family: 'Segoe UI', sans-serif; }
  .breadcrumb { font-size: 0.85rem; margin-bottom: 1rem; color: #64748b; text-align: center; }
  .breadcrumb a { color: #2563eb; text-decoration: none; }

  h1 { text-align: center; color: #1e293b; margin-bottom: 2rem; }

  .filter-bar { 
    margin-bottom: 2rem; 
    display: flex; 
    gap: 10px; 
    justify-content: center; 
    align-items: center; 
  }
  
  .label { font-weight: bold; color: #475569; }

  button {
    padding: 8px 18px;
    border-radius: 20px;
    border: 1px solid #e2e8f0;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  button:hover { background: #f8fafc; }
  button.active { background: #7010f9; color: white; border-color: #7010f9; box-shadow: 0 4px 6px rgba(112, 16, 249, 0.2); }

  .map-container {
    width: 100%;
    height: 600px;
    background: #fdfdfd;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    border: 1px solid #e2e8f0;
  }

  .status { text-align: center; padding: 5rem; color: #64748b; font-style: italic; }
  .error-box { background: #fff1f2; color: #9f1239; padding: 2rem; border-radius: 12px; text-align: center; }
</style>