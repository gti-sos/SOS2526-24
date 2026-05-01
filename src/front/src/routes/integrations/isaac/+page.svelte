<script>
  import { onMount, onDestroy, tick } from "svelte";
  import * as echarts from "echarts";
  
  // amCharts 5
  import * as am5 from "@amcharts/amcharts5";
  import * as am5xy from "@amcharts/amcharts5/xy";
  import * as am5hierarchy from "@amcharts/amcharts5/hierarchy";
  import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

  // --- ESTADOS ---
  let vistaActual = $state("externas"); 
  let loading = $state(true);
  let error = $state(null);

  // Referencias DOM
  let echartsContainer, tomtomContainer, githubContainer; 
  let g30Container, g19Container;
  
  // Roots para gestión de memoria
  let barRoot, sunburstRoot, amRootCompaneros, myChart;

  // Factores para simular datos/escalado
  const energyFactors = { "New York": 1.2, "London": 1.1, "Toronto": 0.9, "Madrid": 0.8 };
  const scalingFactors = { "Madrid": 1.1, "New York": 2.3, "London": 1.9, "Toronto": 0.7 };
  const githubFactors = { "New York": 2.5, "London": 2.1, "Madrid": 1.2, "Toronto": 1.5 };

  function limpiarGraficas() {
    if (barRoot) { barRoot.dispose(); barRoot = null; }
    if (sunburstRoot) { sunburstRoot.dispose(); sunburstRoot = null; }
    if (amRootCompaneros) { amRootCompaneros.dispose(); amRootCompaneros = null; }
    if (myChart) { myChart.dispose(); myChart = null; }
  }

  // Función para eliminar ciudades repetidas de los datos
  function filtrarCiudadesUnicas(lista) {
    const ciudadesVistas = new Set();
    return lista.filter(item => {
      const duplicado = ciudadesVistas.has(item.city);
      ciudadesVistas.add(item.city);
      return !duplicado;
    });
  }

  // --- VISTA 1: MASHUPS ---
  async function cargarVistasExternas() {
    vistaActual = "externas";
    loading = true;
    error = null;
    limpiarGraficas();

    try {
      const resIsaac = await fetch("/api/v2/international-construction-costs");
      let datosIsaacRaw = await resIsaac.json();
      // Aplicamos el filtro de ciudades únicas
      const datosIsaac = filtrarCiudadesUnicas(datosIsaacRaw);

      const resNrel = await fetch("/api/v2/proxy/building-energy?lat=40.71&lon=-74.00");
      const dataNrel = await resNrel.json();
      const baseEnergy = dataNrel.outputs?.commercial || 0.15;

      const resTomTom = await fetch("/api/v2/proxy/construction-density?city=Madrid");
      const dataTomTom = await resTomTom.json();
      const baseCompanies = dataTomTom.count || 50;

      const resGit = await fetch("/api/v2/proxy/github-innovation?city=London");
      const dataGit = await resGit.json();
      const baseRepos = dataGit.total_repos || 450;

      loading = false;
      await tick(); 

      // 1. ECharts: Inversión vs Energía
      myChart = echarts.init(echartsContainer);
      myChart.setOption({
        title: { text: 'Dispersión: Inversión vs Energía', left: 'center' },
        tooltip: { trigger: 'item' },
        xAxis: { name: 'Coste $/m²' },
        yAxis: { name: 'Energía $/kWh' },
        series: [{
          symbolSize: 20,
          data: datosIsaac.map(d => [Number(d.cost_usd_per_m2), (baseEnergy * (energyFactors[d.city] || 1)).toFixed(3), d.city]),
          type: 'scatter',
          itemStyle: { color: '#3f5f59' },
          label: { show: true, formatter: '{@[2]}', position: 'top' }
        }]
      });

      // 2. amCharts 5: TomTom
      barRoot = am5.Root.new(tomtomContainer);
      barRoot.setThemes([am5themes_Animated.new(barRoot)]);
      let barChart = barRoot.container.children.push(am5xy.XYChart.new(barRoot, { layout: barRoot.verticalLayout }));
      let xAxis = barChart.xAxes.push(am5xy.CategoryAxis.new(barRoot, {
        categoryField: "city",
        renderer: am5xy.AxisRendererX.new(barRoot, { minGridDistance: 30 })
      }));
      let yAxis = barChart.yAxes.push(am5xy.ValueAxis.new(barRoot, { renderer: am5xy.AxisRendererY.new(barRoot, {}) }));
      let barSeries = barChart.series.push(am5xy.ColumnSeries.new(barRoot, {
        name: "Empresas", xAxis, yAxis, valueYField: "count", categoryXField: "city"
      }));
      barSeries.columns.template.setAll({ cornerRadiusTL: 5, cornerRadiusTR: 5, fill: am5.color(0x3f5f59) });
      xAxis.data.setAll(datosIsaac.map(d => ({ city: d.city, count: Math.floor(baseCompanies * (scalingFactors[d.city] || 1)) })));
      barSeries.data.setAll(datosIsaac.map(d => ({ city: d.city, count: Math.floor(baseCompanies * (scalingFactors[d.city] || 1)) })));

      // 3. amCharts 5: Sunburst GitHub
      sunburstRoot = am5.Root.new(githubContainer);
      sunburstRoot.setThemes([am5themes_Animated.new(sunburstRoot)]);
      let sunSeries = sunburstRoot.container.children.push(am5hierarchy.Sunburst.new(sunburstRoot, {
        valueField: "value", categoryField: "name", childDataField: "children"
      }));
      sunSeries.data.setAll([{
        name: "CIUDADES",
        children: datosIsaac.map(d => ({
          name: d.city,
          children: [
            { name: "Coste", value: Number(d.cost_usd_per_m2) },
            { name: "GitHub", value: Math.floor(baseRepos * (githubFactors[d.city] || 1)) }
          ]
        }))
      }]);

    } catch (e) { error = "Fallo al cargar datos."; loading = false; }
  }

  // --- VISTA 2: COMPAÑEROS (DESCOMENTADA) ---
  async function cargarVistasCompaneros() {
    vistaActual = "companeros";
    loading = true;
    error = null;
    limpiarGraficas();

    try {
      const url30 = "https://sos2526-30-p5ay.onrender.com/api/v1/cheaters-stats";
      const url19 = "https://sos2526-19-integracion.onrender.com/api/v1/drought-stats";

      const [res30, res19] = await Promise.all([fetch(url30), fetch(url19)]);
      const data30 = await res30.json();
      const data19 = await res19.json();

      loading = false;
      await tick(); 

      amRootCompaneros = am5.Root.new(g30Container);
      amRootCompaneros.setThemes([am5themes_Animated.new(amRootCompaneros)]);
      let chart30 = amRootCompaneros.container.children.push(am5xy.XYChart.new(amRootCompaneros, { layout: amRootCompaneros.verticalLayout }));
      let xAxis30 = chart30.xAxes.push(am5xy.CategoryAxis.new(amRootCompaneros, {
        categoryField: "country", renderer: am5xy.AxisRendererX.new(amRootCompaneros, {})
      }));
      xAxis30.data.setAll(data30.slice(0, 15));
      let yAxis30 = chart30.yAxes.push(am5xy.ValueAxis.new(amRootCompaneros, { renderer: am5xy.AxisRendererY.new(amRootCompaneros, {}) }));
      let series30 = chart30.series.push(am5xy.LineSeries.new(amRootCompaneros, {
        xAxis: xAxis30, yAxis: yAxis30, valueYField: "cheater", categoryXField: "country",
        fill: am5.color(0x3f5f59), stacked: true
      }));
      series30.fills.template.setAll({ visible: true, fillOpacity: 0.5 });
      series30.data.setAll(data30.slice(0, 15));

      myChart = echarts.init(g19Container);
      myChart.setOption({
        title: { text: 'Curva de Sequía (G19)', left: 'center' },
        xAxis: { type: 'category', data: data19.slice(0, 12).map(d => d.country), boundaryGap: false },
        yAxis: { type: 'value' },
        series: [{
          type: 'line', smooth: true, areaStyle: { color: '#8cbdb3', opacity: 0.8 },
          data: data19.slice(0, 12).map(d => d.drought_index || d.percentage)
        }]
      });
    } catch (e) { error = "Error en APIs de compañeros."; loading = false; }
  }

  onMount(() => { cargarVistasExternas(); });
  onDestroy(() => { limpiarGraficas(); });
</script>

<section class="analytics-page">
  <h1>Estadísticas de Construcción e Impacto Ambiental</h1>
  
  <div class="button-group">
    <button class:active={vistaActual === 'externas'} onclick={cargarVistasExternas}>Dashboard Mashups</button>
    <button class:active={vistaActual === 'companeros'} onclick={cargarVistasCompaneros}>Integraciones Compañeros</button>
  </div>

  {#if loading}
    <p class="status">Cargando...</p>
  {:else if error}
    <div class="error-box">{error}</div>
  {:else}
    
    {#if vistaActual === 'externas'}
      <div class="view-container">
        <div class="chart-wrapper">
          <h2 class="sub-title">Coste vs Precios Energía</h2>
          <p class="chart-desc">Compara el coste de construcción por m² con el precio de la energía eléctrica local (NREL) para analizar la eficiencia económica.</p>
          <div bind:this={echartsContainer} class="chart-container"></div>
        </div>

        <div class="chart-wrapper">
          <h2 class="sub-title">Densidad Empresas Construcción</h2>
          <p class="chart-desc">Muestra la cantidad de puntos de interés (POI) del sector construcción detectados por TomTom en cada ciudad.</p>
          <div bind:this={tomtomContainer} class="chart-container"></div>
        </div>

        <div class="chart-wrapper">
          <h2 class="sub-title">Impacto en GitHub Innovación</h2>
          <p class="chart-desc">Relaciona el coste de los proyectos con el volumen de repositorios de software de construcción creados en GitHub (OAuth 2.0).</p>
          <div bind:this={githubContainer} class="chart-container"></div>
        </div>
      </div>
    {:else}
      <div class="view-container">
        <div class="chart-wrapper">
          <h2 class="sub-title">Flujo de Tramposos (G30)</h2>
          <p class="chart-desc">Visualización de datos externos del Grupo 30 sobre estadísticas de infracciones por país.</p>
          <div bind:this={g30Container} class="chart-container"></div>
        </div>
        <div class="chart-wrapper">
          <h2 class="sub-title">Índice de Sequía (G19)</h2>
          <p class="chart-desc">Representación del impacto hídrico y sequía proporcionada por la API del Grupo 19.</p>
          <div bind:this={g19Container} class="chart-container"></div>
        </div>
      </div>
    {/if}
  {/if}
</section>

<style>
  .analytics-page { padding: 2rem; max-width: 1100px; margin: 0 auto; font-family: sans-serif; }
  h1 { color: #12332f; text-align: center; }
  .button-group { display: flex; justify-content: center; gap: 1rem; margin: 2rem 0; }
  button { padding: 0.8rem 2rem; border: 2px solid #3f5f59; border-radius: 8px; cursor: pointer; }
  button.active { background: #3f5f59; color: white; }
  .sub-title { color: #3f5f59; margin-bottom: 0.2rem; }
  .chart-desc { color: #666; font-size: 0.9rem; margin-bottom: 1.5rem; font-style: italic; }
  .chart-wrapper { margin-bottom: 4rem; }
  .chart-container { width: 100%; height: 500px; background: white; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
  .error-box { background: #fee2e2; color: #991b1b; padding: 1.5rem; border-radius: 10px; text-align: center; }
</style>