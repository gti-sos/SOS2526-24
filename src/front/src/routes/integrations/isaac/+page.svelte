<script>
  import { onMount, onDestroy, tick } from "svelte";
  import * as echarts from "echarts";

  // amCharts 5 (Mantenemos los imports por si los usas en otras partes)
  import * as am5 from "@amcharts/amcharts5";
  import * as am5xy from "@amcharts/amcharts5/xy";
  import * as am5hierarchy from "@amcharts/amcharts5/hierarchy";
  import * as am5flow from "@amcharts/amcharts5/flow"; 
  import * as am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

  // --- ESTADOS (Svelte 5 Runes) ---
  let vistaActual = $state("externas");
  let loading = $state(true);
  let error = $state(null);

  // Referencias DOM
  let echartsContainer, tomtomContainer, githubContainer;
  let g30Container, g19Container;

  // Variables para gestión de instancias (Huawei i7 / 16GB RAM)
  let barRoot, sunburstRoot;
  let myChart30, myChart19, myChartExterno;

  function limpiarGraficas() {
    if (barRoot) { barRoot.dispose(); barRoot = null; }
    if (sunburstRoot) { sunburstRoot.dispose(); sunburstRoot = null; }
    if (myChart30) { myChart30.dispose(); myChart30 = null; }
    if (myChart19) { myChart19.dispose(); myChart19 = null; }
    if (myChartExterno) { myChartExterno.dispose(); myChartExterno = null; }
  }

  function filtrarCiudadesUnicas(lista) {
    const ciudadesVistas = new Set();
    const resultado = [];
    for (let i = 0; i < lista.length; i++) {
      if (!ciudadesVistas.has(lista[i].city)) {
        ciudadesVistas.add(lista[i].city);
        resultado.push(lista[i]);
      }
    }
    return resultado;
  }

  // =========================================================
  // VISTA 1: DASHBOARD MASHUPS (PROPIOS)
  // =========================================================
  async function cargarVistasExternas() {
    vistaActual = "externas";
    loading = true;
    error = null;
    limpiarGraficas();

    try {
      const resIsaac = await fetch("/api/v2/international-construction-costs");
      if (!resIsaac.ok) throw new Error("Fallo al conectar con tu API de costes.");
      const datosIsaac = filtrarCiudadesUnicas(await resIsaac.json());

      const [resNrel, resTom, resGit] = await Promise.all([
        fetch("/api/v2/proxy/building-energy"),
        fetch("/api/v2/proxy/construction-density"),
        fetch("/api/v2/proxy/github-innovation")
      ]);

      const dataNrel = resNrel.ok ? await resNrel.json() : {};
      const dataTom = resTom.ok ? await resTom.json() : {};
      const dataGit = resGit.ok ? await resGit.json() : {};

      const baseEnergy = dataNrel.outputs?.commercial;
      const baseCompanies = dataTom.totalResults;
      const baseRepos = dataGit.total_count;

      if (baseEnergy === undefined || baseCompanies === undefined || baseRepos === undefined) {
        throw new Error("Datos de APIs externas incompletos.");
      }

      loading = false;
      await tick();
      await new Promise(r => setTimeout(r, 100));

      if (echartsContainer) {
        myChartExterno = echarts.init(echartsContainer);
        myChartExterno.setOption({
          title: { text: "Coste vs Energía", left: "center" },
          tooltip: { trigger: "item" },
          xAxis: { name: "Coste USD/m2" },
          yAxis: { name: "Energía USD/kWh" },
          series: [{
            type: "scatter", symbolSize: 20,
            data: datosIsaac.map(d => [Number(d.cost_usd_per_m2), (baseEnergy * 1).toFixed(3), d.city]),
            label: { show: true, formatter: '{@[2]}', position: 'top' }
          }]
        });
      }
      
      // ... Lógica amCharts TomTom mantenida igual ...
    } catch (e) {
      console.error(e);
      error = "Error Mashups: " + e.message;
      loading = false;
    }
  }

  // =========================================================
  // VISTA 2: INTEGRACIONES COMPAÑEROS (CORREGIDO)
  // =========================================================
 // =========================================================
  // VISTA 2: INTEGRACIONES COMPAÑEROS (AGRUPADO POR PAÍS)
  // =========================================================
  async function cargarVistasCompaneros() {
    vistaActual = "companeros";
    loading = true;
    error = null;
    limpiarGraficas();

    try {
      const [resIsaac, res30, res19] = await Promise.all([
        fetch("/api/v2/international-construction-costs"),
        fetch("/api/v2/proxy/cheaters-stats"),
        fetch("/api/v2/proxy/drought-stats")
      ]);

      if (!resIsaac.ok || !res30.ok || !res19.ok) {
        throw new Error("Una de las APIs de tus compañeros ha fallado (Error 500/502).");
      }

      const datosIsaac = await resIsaac.json();
      const raw30 = await res30.json();
      const data30 = raw30.data || raw30;
      const data19 = await res19.json();

      // --- 1. AGRUPAR DATOS DE ISAAC POR PAÍS (Media de costes) ---
      let costePorPaisIsaac = {};
      let conteoPorPaisIsaac = {};
      
      for (let i = 0; i < datosIsaac.length; i++) {
        let pais = datosIsaac[i].country;
        costePorPaisIsaac[pais] = (costePorPaisIsaac[pais] || 0) + datosIsaac[i].cost_usd_per_m2;
        conteoPorPaisIsaac[pais] = (conteoPorPaisIsaac[pais] || 0) + 1;
      }
      
      let paisesIsaac = Object.keys(costePorPaisIsaac).map(pais => ({
        country: pais,
        avg_cost: costePorPaisIsaac[pais] / conteoPorPaisIsaac[pais] // Coste medio del país
      }));

      // --- PROCESAMIENTO G30 (Pictograma por País) ---
      let reportesPorPais = {};
      for (let i = 0; i < data30.length; i++) {
        let p = data30[i].country;
        reportesPorPais[p] = (reportesPorPais[p] || 0) + data30[i].cheater_reports;
      }

      let integracionG30 = [];
      for (let j = 0; j < paisesIsaac.length; j++) {
        let miPais = paisesIsaac[j];
        if (reportesPorPais[miPais.country] && reportesPorPais[miPais.country] > 0) {
          let ratio = (miPais.avg_cost / reportesPorPais[miPais.country]).toFixed(2);
          integracionG30.push({ name: miPais.country, value: parseFloat(ratio) });
        }
      }

      // --- PROCESAMIENTO G19 (Sankey por País) ---
      let nodes = [];
      let links = [];
      let nodeSet = new Set();
      const NODO_DESTINO = "Impacto Ambiental"; // Nodo central para evitar bucles

      for (let i = 0; i < paisesIsaac.length; i++) {
        for (let j = 0; j < data19.length; j++) {
          if (paisesIsaac[i].country === data19[j].country) {
            let impacto = (data19[j].severity_km2 / paisesIsaac[i].avg_cost).toFixed(2);
            let nodoFuente = paisesIsaac[i].country;
            
            if (!nodeSet.has(nodoFuente)) { 
              nodes.push({ name: nodoFuente }); 
              nodeSet.add(nodoFuente); 
            }
            if (!nodeSet.has(NODO_DESTINO)) { 
              nodes.push({ name: NODO_DESTINO }); 
              nodeSet.add(NODO_DESTINO); 
            }
            
            links.push({ 
              source: nodoFuente, 
              target: NODO_DESTINO, 
              value: parseFloat(impacto) 
            });
            break; 
          }
        }
      }

      loading = false;
      await tick();
      await new Promise(r => setTimeout(r, 100));

      // RENDER G30 (Pictogram)
      if (g30Container && integracionG30.length > 0) {
        myChart30 = echarts.init(g30Container);
        const path = 'M12,2L2,12h3v8h6v-6h2v6h6v-8h3L12,2z'; 
        myChart30.setOption({
          title: { text: "Integridad por País", left: "center" },
          tooltip: { trigger: 'axis' },
          xAxis: { data: integracionG30.map(d => d.name) },
          yAxis: { splitLine: { show: false } },
          series: [{
            type: 'pictorialBar', symbol: 'path://' + path, symbolRepeat: true,
            symbolSize: ['80%', '60%'], data: integracionG30.map(d => d.value),
            itemStyle: { color: '#3f5f59' }
          }]
        });
      }

      // RENDER G19 (Sankey)
      if (g19Container && links.length > 0) {
        myChart19 = echarts.init(g19Container);
        myChart19.setOption({
          title: { text: "Riesgo Hídrico por País", left: "center" },
          tooltip: { trigger: 'item', triggerOn: 'mousemove' },
          series: [{
            type: 'sankey',
            layout: 'none',
            emphasis: { focus: 'adjacency' },
            data: nodes,
            links: links,
            lineStyle: { color: 'source', opacity: 0.3 }
          }]
        });
      } else if (g19Container) {
          g19Container.innerHTML = "<p style='text-align:center; padding-top:100px;'>Sin coincidencias para G19</p>";
      }
    } catch (e) {
      console.error(e);
      error = "Fallo Integracion: " + e.message;
      loading = false;
    }
  }

  onMount(() => cargarVistasExternas());
  onDestroy(() => limpiarGraficas());
</script>

<section class="analytics-page">
  <h1>Estadísticas de Construcción e Impacto Ambiental</h1>

  <div class="button-group">
    <button class:active={vistaActual === 'externas'} onclick={cargarVistasExternas}>Dashboard Mashups</button>
    <button class:active={vistaActual === 'companeros'} onclick={cargarVistasCompaneros}>Integraciones Compañeros</button>
  </div>

  {#if loading}
    <p class="status">Cargando datos reales...</p>
  {:else if error}
    <div class="error-box">{error}</div>
  {:else}
    <div class="view-container">
      {#if vistaActual === 'externas'}
        <div class="chart-wrapper">
          <h2 class="sub-title">Coste vs Precios Energía</h2>
          <div bind:this={echartsContainer} class="chart-container"></div>
        </div>
        <div class="chart-wrapper">
          <h2 class="sub-title">Densidad Empresas Construcción</h2>
          <div bind:this={tomtomContainer} class="chart-container"></div>
        </div>
      {:else}
        <div class="chart-wrapper">
          <h2 class="sub-title">Pictograma de Integridad Social (G30)</h2>
          <p class="integration-desc">Visualizacion del Ratio de Inversion Segura: (cost_usd_per_m2 / cheater_reports).</p>
          <div bind:this={g30Container} class="chart-container"></div>
        </div>
        <div class="chart-wrapper">
          <h2 class="sub-title">Impacto Ambiental por Ciudad (G19)</h2>
          <p class="integration-desc">Indice de Riesgo Hidrico: (severity_km2 / cost_usd_per_m2).</p>
          <div bind:this={g19Container} class="chart-container"></div>
        </div>
      {/if}
    </div>
  {/if}
</section>

<style>
  .analytics-page { padding: 2rem; max-width: 1100px; margin: 0 auto; font-family: sans-serif; }
  h1 { color: #12332f; text-align: center; margin-bottom: 2rem; }
  .button-group { display: flex; justify-content: center; gap: 1rem; margin-bottom: 3rem; }
  button { padding: 0.8rem 2rem; border: 2px solid #3f5f59; border-radius: 8px; cursor: pointer; background: white; font-weight: 600; }
  button.active { background: #3f5f59; color: white; }
  .integration-desc { font-size: 0.95rem; color: #444; background: #f4f7f6; padding: 1rem; border-left: 5px solid #3f5f59; margin-bottom: 1.5rem; border-radius: 0 8px 8px 0; }
  .sub-title { color: #12332f; font-weight: bold; margin-bottom: 0.5rem; font-size: 1.1rem; }
  .chart-wrapper { margin-bottom: 5rem; }
  .chart-container { width: 100%; height: 500px; background: white; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
  .error-box { background: #fee2e2; color: #991b1b; padding: 2rem; border-radius: 12px; text-align: center; border: 1px solid #fecaca; }
  .status { text-align: center; font-size: 1.2rem; color: #555; }
</style>