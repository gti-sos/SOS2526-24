<script>
  import Highcharts from 'highcharts';
  import { onMount } from "svelte";

  let chartContainer;
  let loading = true;
  let error = null;
  let chartInstance = null;

  const API_PRIMARY  = '/api/v2/recreation-culture-expenditure';
  const API_FALLBACK = '/api/v1/recreation-culture-expenditure';

  function pickMetric(row) {
    if (row.recreation_per_capita != null) return { field: 'recreation_per_capita', value: Number(row.recreation_per_capita) };
    if (row.recreation_share      != null) return { field: 'recreation_share',      value: Number(row.recreation_share) };
    if (row.recreation_value      != null) return { field: 'recreation_value',      value: Number(row.recreation_value) };
    return null;
  }

  function buildSeries(raw, MAX_COUNTRIES = 7) {
    const normalize = d => Array.isArray(d) ? d : (d?.data ?? d?.items ?? []);
    const data = normalize(raw);

    let metricField = null;
    for (const row of data) {
      const m = pickMetric(row);
      if (m) { metricField = m.field; break; }
    }
    if (!metricField) throw new Error('No se encontró ningún campo de valor reconocible (recreation_per_capita, recreation_share, recreation_value).');

    const byCountry = {};
    for (const row of data) {
      const country = row.country;
      const year    = row.year != null ? Number(row.year) : null;
      const m       = pickMetric(row);
      if (!country || year == null || !m) continue;
      if (!byCountry[country]) byCountry[country] = {};
      byCountry[country][year] = m.value;
    }

    const allYears = [...new Set(data.filter(r => r.year != null).map(r => Number(r.year)))].sort((a, b) => a - b);
    if (!allYears.length) throw new Error('No se encontraron datos de años en la API.');

    const countries = Object.entries(byCountry)
      .sort((a, b) => Object.keys(b[1]).length - Object.keys(a[1]).length)
      .slice(0, MAX_COUNTRIES)
      .map(([c]) => c);

    const series = countries.map(country => ({
      name: country,
      data: allYears.map(y => byCountry[country][y] ?? null)
    }));

    return { allYears, series, metricField };
  }

  const METRIC_LABELS = {
    recreation_per_capita: 'Gasto per cápita en recreación y cultura (USD)',
    recreation_share:      'Porcentaje del gasto en recreación y cultura (%)',
    recreation_value:      'Valor del gasto en recreación y cultura'
  };

  onMount(async () => {
    const AccessibilityModule = (await import('highcharts/modules/accessibility')).default
      ?? (await import('highcharts/modules/accessibility'));
    if (typeof AccessibilityModule === 'function') AccessibilityModule(Highcharts);

    try {
      let raw;
      try {
        raw = await fetch(API_PRIMARY).then(r => {
          if (!r.ok) throw new Error(r.status);
          return r.json();
        });
      } catch {
        raw = await fetch(API_FALLBACK).then(r => {
          if (!r.ok) throw new Error(`Error ${r.status} al obtener los datos de la API.`);
          return r.json();
        });
      }

      const { allYears, series, metricField } = buildSeries(raw);
      const yAxisLabel = METRIC_LABELS[metricField] ?? 'Valor';

      loading = false;

      chartInstance = Highcharts.chart(chartContainer, {
        chart: {
          type: 'area',
          style: { fontFamily: 'inherit' }
        },
        accessibility: {
          enabled: true,
          description:
            `Gráfica de área que muestra la evolución temporal del ${yAxisLabel.toLowerCase()} ` +
            `para distintos países, según los datos de la API de Gasto en Recreación y Cultura ` +
            `de Elena Bejarano Periñán. Cada serie representa un país y el eje horizontal muestra los años disponibles.`
        },
        title:    { text: 'Evolución del gasto en recreación y cultura por país' },
        subtitle: { text: `Métrica: ${yAxisLabel} · Fuente: API recreation-culture-expenditure` },
        xAxis: {
          categories: allYears.map(String),
          title: { text: 'Año' },
          tickmarkPlacement: 'on'
        },
        yAxis: {
          title: { text: yAxisLabel },
          min: 0
        },
        tooltip: {
          headerFormat: '<b>Año {point.key}</b><br/>',
          pointFormat: '<span style="color:{series.color}">\u25CF</span> {series.name}: <b>{point.y:.2f}</b><br/>',
          shared: true,
          crosshairs: true
        },
        plotOptions: {
          area: {
            fillOpacity: 0.2,
            marker: {
              enabled: false,
              symbol: 'circle',
              radius: 3,
              states: { hover: { enabled: true } }
            },
            connectNulls: false
          }
        },
        legend: { enabled: true, layout: 'horizontal', align: 'center', verticalAlign: 'bottom' },
        series,
        credits: { enabled: false }
      });
    } catch (err) {
      loading = false;
      error = err.message || 'Error desconocido al cargar los datos.';
    }
  });
</script>

<svelte:head>
  <title>Gasto en Recreación y Cultura – Analytics</title>
</svelte:head>

<div class="analytics-page">
  <nav class="breadcrumb" aria-label="Ruta de navegación">
    <a href="/">Inicio</a>
    <span aria-hidden="true"> › </span>
    <a href="/analytics">Análisis grupal</a>
    <span aria-hidden="true"> › </span>
    <span>Recreación y Cultura</span>
  </nav>

  <h1>Gasto en recreación y cultura por país</h1>

  <p class="description">
    Esta visualización muestra la <strong>evolución temporal</strong> del gasto en recreación y
    cultura en distintos países, usando datos de la API individual de
    <strong>Elena Bejarano Periñán</strong>. Cada área coloreada representa un país diferente.
    El eje horizontal corresponde al año y el eje vertical al valor del indicador seleccionado
    automáticamente según los datos disponibles.
  </p>

  {#if loading}
    <div class="loading" role="status" aria-live="polite">
      <span class="spinner" aria-hidden="true"></span>
      Cargando datos de la API…
    </div>
  {:else if error}
    <div class="error" role="alert">
      <strong>Error al cargar los datos:</strong> {error}
      <br/>
      <small>Comprueba que la API <code>/api/v1/recreation-culture-expenditure</code> esté disponible.</small>
    </div>
  {/if}

  <div
    bind:this={chartContainer}
    class="chart-container"
    aria-label="Gráfica de área con la evolución del gasto en recreación y cultura por país y año"
    style={loading || error ? 'display:none' : ''}
  ></div>

  <p class="footnote">
    Fuente: API <code>recreation-culture-expenditure</code> — Elena Bejarano Periñán.
    Se muestran los países con más datos disponibles (máximo 7). Datos obtenidos en tiempo real.
  </p>
</div>

<style>
  .analytics-page {
    max-width: 1000px;
    margin: 0 auto;
    padding: 1.5rem;
    font-family: inherit;
  }
  .breadcrumb { font-size: 0.85rem; color: #64748b; margin-bottom: 1rem; }
  .breadcrumb a { color: #3b82f6; text-decoration: none; }
  .breadcrumb a:hover { text-decoration: underline; }
  h1 { font-size: 1.6rem; margin-bottom: 0.5rem; color: #1e293b; }
  .description { color: #475569; margin-bottom: 1.5rem; line-height: 1.6; max-width: 800px; }
  .chart-container {
    width: 100%;
    min-height: 420px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
  .loading { display: flex; align-items: center; gap: 0.75rem; padding: 2rem; color: #64748b; }
  .spinner {
    display: inline-block;
    width: 20px; height: 20px;
    border: 3px solid #e2e8f0;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .error {
    background: #fef2f2; border: 1px solid #fecaca;
    border-radius: 6px; padding: 1rem 1.25rem; color: #991b1b; margin-bottom: 1rem;
  }
  .footnote { font-size: 0.8rem; color: #94a3b8; margin-top: 1rem; font-style: italic; }
  code { background: #f1f5f9; padding: 0.1em 0.35em; border-radius: 3px; font-size: 0.85em; }
</style>
