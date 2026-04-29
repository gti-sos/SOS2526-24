<script>
  import Highcharts from "highcharts";
  import { onMount, onDestroy, tick } from "svelte";

  let containers = $state({ arrivals: null, olympics: null, construction: null, countries: null, earthquakes: null });
  let charts = $state({ arrivals: null, olympics: null, construction: null, countries: null, earthquakes: null });
  let loading = $state(true);
  let error = $state(null);
  let data = $state({ arrivals: null, olympics: null, construction: null, countries: null, earthquakes: null });

  async function fetchConTimeout(url, timeout = 15000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      return await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function loadIntegrations() {
    loading = true;
    error = null;

    try {
      const arrRes = await fetchConTimeout('/api/v1/integrations/arrivals');
      if (!arrRes.ok) throw new Error("Arrivals: " + arrRes.status);
      data.arrivals = await arrRes.json();
      console.log("✅ Arrivals cargado");

      const olymRes = await fetchConTimeout('/api/v1/integrations/olympics');
      if (!olymRes.ok) throw new Error("Olympics: " + olymRes.status);
      data.olympics = await olymRes.json();

      const conRes = await fetchConTimeout('/api/v1/integrations/construction');
      if (!conRes.ok) throw new Error("Construction: " + conRes.status);
      data.construction = await conRes.json();

      const countriesRes = await fetchConTimeout('/api/v1/integrations/countries');
      if (!countriesRes.ok) throw new Error("Countries: " + countriesRes.status);
      data.countries = await countriesRes.json();
      
      const earthquakesRes = await fetchConTimeout('/api/v1/integrations/earthquakes');
      if (!earthquakesRes.ok) throw new Error("Earthquakes: " + earthquakesRes.status);
      data.earthquakes = await earthquakesRes.json();

    } catch (e) {
      error = "Error: " + e.message;
      console.error("❌ Error:", e);
    } finally {
      loading = false;
    }
  }

  function createCharts() {
    if (data.arrivals && containers.arrivals && Array.isArray(data.arrivals)) {
      const countryData = {};
      data.arrivals.forEach(item => {
        if (item.country) {
          countryData[item.country] = (countryData[item.country] || 0) + (item.number || 1);
        }
      });

      const countries = Object.keys(countryData).slice(0, 10);
      const values = countries.map(c => countryData[c]);

      if (charts.arrivals) charts.arrivals.destroy();
      charts.arrivals = Highcharts.chart(containers.arrivals, {
        chart: { type: "bar" },
        title: { text: "Llegadas Turísticas por País" },
        xAxis: { categories: countries },
        yAxis: { title: { text: "Número de llegadas" } },
        series: [{
          name: "Llegadas",
          data: values,
          colorByPoint: true
        }],
        credits: { enabled: false }
      });
    }
        // 2. OLYMPICS (Column Chart)
    if (data.olympics && containers.olympics && Array.isArray(data.olympics)) {
    const sportData = {};
    data.olympics.forEach(item => {
        if (item.sport) {
        sportData[item.sport] = (sportData[item.sport] || 0) + 1;
        }
    });

    const sports = Object.keys(sportData).slice(0, 10);
    const counts = sports.map(s => sportData[s]);

    if (charts.olympics) charts.olympics.destroy();
    charts.olympics = Highcharts.chart(containers.olympics, {
        chart: { type: "column" },
        title: { text: "Atletas por Deporte Olímpico" },
        xAxis: { categories: sports },
        yAxis: { title: { text: "Número de atletas" } },
        series: [{
        name: "Atletas",
        data: counts,
        colorByPoint: true
        }],
        credits: { enabled: false }
    });
    }
    // 3. CONSTRUCTION (Pie Chart)
    if (data.construction && containers.construction && Array.isArray(data.construction)) {
    const countryData = {};
    data.construction.slice(0, 15).forEach(record => {
        const country = record.country || "Unknown";
        const cost = record.construction_cost || 0;
        if (cost > 0) {
        countryData[country] = (countryData[country] || 0) + cost;
        }
    });

    const pieData = Object.entries(countryData)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, value]) => ({
        name,
        y: Math.round(value / 1e9)
        }));

    if (charts.construction) charts.construction.destroy();
    charts.construction = Highcharts.chart(containers.construction, {
        chart: { type: "pie" },
        title: { text: "Gastos en Construcción por País (Billones USD)" },
        series: [{
        name: "Gasto",
        colorByPoint: true,
        data: pieData
        }],
        credits: { enabled: false }
    });
    }

    // 4. COUNTRIES (Area Chart - REST Countries by Region)
    if (data.countries && containers.countries && Array.isArray(data.countries)) {
    const regionData = {};
    data.countries.forEach(item => {
        if (item.region) {
        regionData[item.region] = (regionData[item.region] || 0) + 1;
        }
    });

    const regions = Object.keys(regionData).sort();
    const countryCounts = regions.map(r => regionData[r]);

    if (charts.countries) charts.countries.destroy();
    charts.countries = Highcharts.chart(containers.countries, {
        chart: { type: "area" },
        title: { text: "Países por Región" },
        xAxis: { categories: regions },
        yAxis: { title: { text: "Número de países" } },
        series: [{
        name: "Países",
        data: countryCounts,
        fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
            [0, "rgba(52, 152, 219, 0.5)"],
            [1, "rgba(52, 152, 219, 0)"]
            ]
        },
        color: "rgba(52, 152, 219, 1)"
        }],
        credits: { enabled: false }
    });
    }
    
    // 5. EARTHQUAKES (Bar Chart - USGS Earthquakes by Magnitude)
    if (data.earthquakes && containers.earthquakes && Array.isArray(data.earthquakes)) {
    const quakeData = {};
    data.earthquakes.slice(0, 20).forEach(item => {
        const magBucket = Math.floor(item.magnitude * 10) / 10;
        const key = `${magBucket}+`;
        quakeData[key] = (quakeData[key] || 0) + 1;
    });

    const magnitudes = Object.keys(quakeData).sort((a, b) => parseFloat(a) - parseFloat(b));
    const counts = magnitudes.map(m => quakeData[m]);

    if (charts.earthquakes) charts.earthquakes.destroy();
    charts.earthquakes = Highcharts.chart(containers.earthquakes, {
        chart: { type: "column" },
        title: { text: "Terremotos por Magnitud (Último Día)" },
        xAxis: { categories: magnitudes },
        yAxis: { title: { text: "Número de terremotos" } },
        series: [{
        name: "Terremotos",
        data: counts,
        colorByPoint: true
        }],
        credits: { enabled: false }
    });
    }

  }

  onMount(() => {
    loadIntegrations();
  });

  onDestroy(() => {
    if (charts.arrivals) charts.arrivals.destroy();
    if (charts.olympics) charts.olympics.destroy();
    if (charts.construction) charts.construction.destroy();
    if (charts.countries) charts.countries.destroy();
    if (charts.earthquakes) charts.earthquakes.destroy();
  });

  $effect(() => {
    if (!loading && !error && data.arrivals) {
      tick().then(() => createCharts());
    }
  });
</script>

<svelte:head>
  <title>Integraciones MJP | SOS2526-24</title>
</svelte:head>

<div class="container">
  <h1>🔗 Mis Integraciones de APIs</h1>

  {#if loading}
    <p>⏳ Cargando...</p>
  {:else if error}
    <p style="color: red;"><strong>⚠️ Error:</strong> {error}</p>
  {:else}
    <section class="api-section">
      <h2>✈️ API 1: International Tourist Arrivals</h2>
      <p><strong>Grupo 25</strong> | Bar Chart</p>
      <div bind:this={containers.arrivals} class="chart"></div>
    </section>
    <section class="api-section">
      <h2>🏅 API 2: Olympics Athlete Events</h2>
      <p><strong>Grupo 30</strong> | Column Chart</p>
      <div bind:this={containers.olympics} class="chart"></div>
    </section>
    <section class="api-section">
      <h2>🏗️ API 3: Gastos en Construcción</h2>
      <p><strong>World Bank API</strong> | Pie Chart</p>
      <div bind:this={containers.construction} class="chart"></div>
    </section>
    <section class="api-section">
      <h2>🌍 API 4: Países por Región</h2>
      <p><strong>REST Countries API</strong> | Area Chart</p>
      <div bind:this={containers.countries} class="chart"></div>
    </section>
    <section class="api-section">
      <h2>🌍 API 5: Terremotos en Tiempo Real</h2>
      <p><strong>USGS Earthquakes API</strong> | Column Chart</p>
      <div bind:this={containers.earthquakes} class="chart"></div>
    </section>
  {/if}
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  h1 {
    text-align: center;
    color: #1e293b;
  }

  .api-section {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 2rem;
  }

  .chart {
    width: 100%;
    min-height: 400px;
  }
</style>