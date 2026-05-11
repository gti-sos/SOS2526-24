<svelte:head>
  <title>Integraciones MJP | SOS2526-24</title>
</svelte:head>

<script>
  import Chart from 'chart.js/auto';
  import * as d3 from 'd3';
  import * as echarts from 'echarts';
  import { onDestroy, tick } from 'svelte';

  // Gráfica 1: Salarios vs Llegadas Turísticas
  let mostrarGrafica1 = $state(false);
  let chart1Container = $state();
  let chart1 = $state(null);
  let error1 = $state(null);
  let sinDatos1 = $state(false);

  async function cargarGrafica1() {
    await new Promise(resolve => setTimeout(resolve, 100));

    error1 = null;
    sinDatos1 = false;

    try {
      const res = await fetch('/api/v1/integrations/chart1');
      const data = await res.json();

      const combined = data.combined;

      // Validar si hay datos
      if (!combined || combined.length === 0) {
        sinDatos1 = true;
        return;
      }

      // Normalizar ambas series a 0-100
      const maxSalary = Math.max(...combined.map(c => c.salary));
      const maxArrivals = Math.max(...combined.map(c => c.arrivals));

      const normalizedSalaries = combined.map(c => maxSalary > 0 ? Math.round((c.salary / maxSalary) * 100) : 0);
      const normalizedArrivals = combined.map(c => maxArrivals > 0 ? Math.round((c.arrivals / maxArrivals) * 100) : 0);
      const years = combined.map(c => c.year);

      pintarGrafica1(years, normalizedSalaries, normalizedArrivals);
    } catch (e) {
      console.error('Error Gráfica 1:', e);
      error1 = 'Error al cargar los datos: ' + e.message;
    }
  }

  function pintarGrafica1(years, salaries, arrivals) {
    if (!chart1Container) {
      console.error('chart1Container no está disponible');
      return;
    }
    if (chart1) {
      chart1.destroy();
      chart1 = null;
    }

    // Calcular promedios para el doughnut
    const avgSalary = Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length);
    const avgArrivals = Math.round(arrivals.reduce((a, b) => a + b, 0) / arrivals.length);

    chart1 = new Chart(chart1Container, {
      type: 'doughnut',
      data: {
        labels: ['Salario promedio (normalizado)', 'Llegadas turísticas (normalizado)'],
        datasets: [
          {
            label: 'Valores normalizados 0-100',
            data: [avgSalary, avgArrivals],
            borderColor: ['#2563eb', '#dc2626'],
            backgroundColor: ['rgba(37, 99, 235, 0.7)', 'rgba(220, 38, 38, 0.7)'],
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.parsed}%`;
              }
            }
          }
        }
      }
    });
  }

  // Gráfica 2: Salarios vs Atletas Olímpicos
  let mostrarGrafica2 = $state(false);
  let chart2Container = $state();
  let chart2 = $state(null);

  async function cargarGrafica2() {
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const res = await fetch('/api/v1/integrations/chart2');
      const data = await res.json();

      const wages = data.wages;
      const athletes = data.athletes;

      // Mapping exhaustivo de país a continente (múltiples variantes)
      const countryToContinent = {
        // North America
        "canada": "North America",
        "canadian": "North America",
        "usa": "North America",
        "us": "North America",
        "united states": "North America",
        "united states of america": "North America",
        "american": "North America",

        // Europe
        "uk": "Europe",
        "united kingdom": "Europe",
        "great britain": "Europe",
        "gb": "Europe",
        "britain": "Europe",
        "england": "Europe",
        "scotland": "Europe",
        "wales": "Europe",
        "northern ireland": "Europe",
        "british": "Europe",

        "spain": "Europe",
        "spanish": "Europe",
        "españa": "Europe",

        "ireland": "Europe",
        "republic of ireland": "Europe",
        "eire": "Europe",
        "irish": "Europe",

        "poland": "Europe",
        "polish": "Europe",
        "polen": "Europe",

        "italy": "Europe",
        "italian": "Europe",
        "italia": "Europe",

        "germany": "Europe",
        "german": "Europe",
        "deutschland": "Europe",
        "allemagne": "Europe",

        // Variantes adicionales comunes
        "north america": "North America",
        "europe": "Europe",
        "european": "Europe"
      };

      // Agrupar salarios por continente
      const wagesByContinent = {};
      wages.forEach(w => {
        const continent = countryToContinent[w.country.toLowerCase()] || "Other";
        if (!wagesByContinent[continent]) wagesByContinent[continent] = [];
        wagesByContinent[continent].push(w.avg_monthly_usd);
      });

      const wageAvgByContinent = {};
      Object.keys(wagesByContinent).forEach(continent => {
        const avg = wagesByContinent[continent].reduce((a, b) => a + b, 0) / wagesByContinent[continent].length;
        wageAvgByContinent[continent] = Math.round(avg);
      });

      console.log('Salarios por continente:', wageAvgByContinent);
      console.log('Atletas por continente:', athletes);

      // Combinar datos de continentes en común
      const continents = [];
      const wageValues = [];
      const athleteValues = [];

      Object.keys(wageAvgByContinent).forEach(continent => {
        if (athletes[continent]) {
          continents.push(continent);
          wageValues.push(wageAvgByContinent[continent]);
          athleteValues.push(athletes[continent]);
        }
      });

      console.log('Continentes combinados:', continents, 'Salarios:', wageValues, 'Atletas:', athleteValues);

      pintarGrafica2(continents, wageValues, athleteValues);
    } catch (e) {
      console.error('Error:', e);
    }
  }

  function pintarGrafica2(continents, wages, athletes) {
    if (!chart2Container) return;

    // Limpiar SVG anterior
    d3.select(chart2Container).selectAll("*").remove();

    const scatterData = continents.map((continent, idx) => ({
      continent: continent,
      x: wages[idx],
      y: athletes[idx]
    }));

    // Dimensiones
    const margin = { top: 20, right: 30, bottom: 60, left: 70 };
    const width = chart2Container.clientWidth - margin.left - margin.right;
    const height = 450 - margin.top - margin.bottom;

    // Escalas
    const xScale = d3.scaleLinear()
      .domain([d3.min(scatterData, d => d.x) - 500, d3.max(scatterData, d => d.x) + 500])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(scatterData, d => d.y) + 1])
      .range([height, 0]);

    // SVG
    const svg = d3.select(chart2Container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Ejes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis);

    svg.append('g')
      .call(yAxis);

    // Etiquetas ejes
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + 50)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Salario promedio mensual (USD)');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Número total de atletas olímpicos');

    // Puntos
    const circles = svg.selectAll('circle')
      .data(scatterData)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', 7)
      .attr('fill', '#2563eb')
      .attr('opacity', 0.7)
      .attr('stroke', '#1e40af')
      .attr('stroke-width', 2);

    // Tooltip
    const tooltip = d3.select('body')
      .append('div')
      .style('position', 'absolute')
      .style('background', '#333')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 1000);

    circles.on('mouseover', (event, d) => {
      tooltip.style('opacity', 1)
        .html(`<strong>${d.continent}</strong><br/>Salario: $${d.x.toFixed(0)} USD<br/>Atletas: ${d.y}`)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mousemove', (event) => {
      tooltip.style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', () => {
      tooltip.style('opacity', 0);
    });

    // Hover efecto
    circles.on('mouseenter', function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('r', 10)
        .attr('opacity', 1);
    })
    .on('mouseleave', function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('r', 7)
        .attr('opacity', 0.7);
    });

    chart2 = svg;
  }

  // Gráfica 3: Salarios vs Construcción (World Bank)
  let mostrarGrafica3 = $state(false);
  let chart3Container = $state();
  let chart3 = $state(null);

  async function cargarGrafica3() {
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const res = await fetch('/api/v1/integrations/chart3');
      const data = await res.json();

      const wages = data.wages;
      const construction = data.construction;

      const wagesByYear = {};
      wages.forEach(w => {
        if (!wagesByYear[w.year]) wagesByYear[w.year] = [];
        wagesByYear[w.year].push(w.avg_monthly_usd);
      });

      const wageAvgByYear = {};
      Object.keys(wagesByYear).forEach(year => {
        const avg = wagesByYear[year].reduce((a, b) => a + b, 0) / wagesByYear[year].length;
        wageAvgByYear[year] = Math.round(avg);
      });

      const constructionByYear = {};
      construction.forEach(c => {
        if (!constructionByYear[c.year]) constructionByYear[c.year] = [];
        constructionByYear[c.year].push(c.construction_value || 0);
      });

      const constructionAvgByYear = {};
      Object.keys(constructionByYear).forEach(year => {
        const total = constructionByYear[year].reduce((a, b) => a + b, 0);
        constructionAvgByYear[year] = Math.round(total / 1e9); // Convertir a miles de millones
      });

      const years = Object.keys(wageAvgByYear).sort();
      const wageValues = years.map(y => wageAvgByYear[y]);
      const constructionValues = years.map(y => constructionAvgByYear[y] || 0);

      pintarGrafica3(years, wageValues, constructionValues);
    } catch (e) {
      console.error('Error:', e);
    }
  }

  function pintarGrafica3(years, wages, construction) {
    if (!chart3Container) return;
    if (chart3) chart3.destroy();

    // Normalizar datos para que sean comparables en polar area
    const maxWage = Math.max(...wages);
    const maxConstruction = Math.max(...construction);
    const normalizedWages = wages.map(w => Math.round((w / maxWage) * 100));
    const normalizedConstruction = construction.map(c => Math.round((c / maxConstruction) * 100));

    chart3 = new Chart(chart3Container, {
      type: 'polarArea',
      data: {
        labels: years,
        datasets: [
          {
            label: 'Salario promedio (normalizado)',
            data: normalizedWages,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.5)',
            borderWidth: 2
          },
          {
            label: 'Inversión en construcción (normalizada)',
            data: normalizedConstruction,
            borderColor: '#059669',
            backgroundColor: 'rgba(5, 150, 105, 0.5)',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.r}%`;
              }
            }
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            title: { display: true, text: 'Valor normalizado (%)' }
          }
        }
      }
    });
  }

  // Gráfica 4: Salarios vs Población (REST Countries)
  let mostrarGrafica4 = $state(false);
  let chart4Container = $state();
  let chart4 = $state(null);

  async function cargarGrafica4() {
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const res = await fetch('/api/v1/integrations/chart4');
      const data = await res.json();

      const wages = data.wages;
      const countries = data.countries;

      // Mapping de nombres de países a códigos cca2
      const countryMapping = {
        'ireland': 'ie',
        'canada': 'ca',
        'usa': 'us',
        'uk': 'gb',
        'spain': 'es',
        'germany': 'de',
        'italy': 'it',
        'poland': 'pl'
      };

      // Agrupar salarios por país (promedio de todos los años)
      const wagesByCountry = {};
      wages.forEach(w => {
        const countryCode = w.country.toLowerCase();
        if (!wagesByCountry[countryCode]) wagesByCountry[countryCode] = [];
        wagesByCountry[countryCode].push(w.avg_monthly_usd);
      });

      const wageAvgByCountry = {};
      Object.keys(wagesByCountry).forEach(country => {
        const avg = wagesByCountry[country].reduce((a, b) => a + b, 0) / wagesByCountry[country].length;
        wageAvgByCountry[country] = Math.round(avg);
      });

      // Crear datos para bubble chart
      const bubbleData = [];
      Object.keys(wageAvgByCountry).forEach(countryName => {
        const mappedCode = countryMapping[countryName.toLowerCase()];
        const countryInfo = countries[mappedCode];
        if (countryInfo) {
          bubbleData.push({
            x: wageAvgByCountry[countryName],
            y: Math.log10(countryInfo.population), // Log para mejor visualización
            r: Math.sqrt(wageAvgByCountry[countryName] / 10),
            label: countryInfo.name,
            region: countryInfo.region
          });
        }
      });

      pintarGrafica4(bubbleData);
    } catch (e) {
      console.error('Error:', e);
    }
  }

  function pintarGrafica4(bubbleData) {
    if (!chart4Container) return;
    if (chart4) chart4.destroy();

    // Colores únicos por país
    const countryColors = {
      'canada': { bg: 'rgba(59, 130, 246, 0.7)', border: 'rgb(59, 130, 246)' },
      'usa': { bg: 'rgba(29, 78, 216, 0.7)', border: 'rgb(29, 78, 216)' },
      'ireland': { bg: 'rgba(34, 197, 94, 0.7)', border: 'rgb(34, 197, 94)' },
      'uk': { bg: 'rgba(239, 68, 68, 0.7)', border: 'rgb(239, 68, 68)' },
      'spain': { bg: 'rgba(245, 158, 11, 0.7)', border: 'rgb(245, 158, 11)' },
      'germany': { bg: 'rgba(168, 85, 247, 0.7)', border: 'rgb(168, 85, 247)' },
      'italy': { bg: 'rgba(236, 72, 153, 0.7)', border: 'rgb(236, 72, 153)' },
      'poland': { bg: 'rgba(6, 182, 212, 0.7)', border: 'rgb(6, 182, 212)' }
    };

    const chartDatasets = bubbleData.map(point => {
      const countryName = point.label.toLowerCase();
      const colors = countryColors[countryName] || { bg: 'rgba(107, 114, 128, 0.7)', border: 'rgb(107, 114, 128)' };

      return {
        label: point.label,
        data: [point],
        backgroundColor: colors.bg,
        borderColor: colors.border,
        borderWidth: 2
      };
    });

    chart4 = new Chart(chart4Container, {
      type: 'bubble',
      data: {
        datasets: chartDatasets
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const point = context.raw;
                const population = Math.pow(10, point.y);
                return `${point.label}: $${point.x} USD, Pop: ${Math.round(population / 1e6)}M`;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            display: true,
            title: { display: true, text: 'Salario promedio (USD)' }
          },
          y: {
            type: 'linear',
            display: true,
            title: { display: true, text: 'Población (escala logarítmica)' }
          }
        }
      }
    });
  }

  // Gráfica 5: Earthquakes vs Salarios (Radar)
  let mostrarGrafica5 = $state(false);
  let chart5Container = $state();
  let chart5 = $state(null);

  async function cargarGrafica5() {
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const res = await fetch('/api/v1/integrations/chart5');
      const data = await res.json();

      const wages = data.wages;
      const earthquakes = data.earthquakes;

      // Agrupar salarios por país
      const wagesByCountry = {};
      wages.forEach(w => {
        const country = w.country.toUpperCase();
        if (!wagesByCountry[country]) wagesByCountry[country] = [];
        wagesByCountry[country].push(w.avg_monthly_usd);
      });

      const wageAvgByCountry = {};
      Object.keys(wagesByCountry).forEach(country => {
        const avg = wagesByCountry[country].reduce((a, b) => a + b, 0) / wagesByCountry[country].length;
        wageAvgByCountry[country] = Math.round(avg);
      });

      // Agrupar terremotos por región (usando latitud/longitud aproximada a región)
      const regionNames = {
        'PACIFIC': { lat: [0, 60], lon: [120, 180] },
        'AMERICAS': { lat: [-60, 80], lon: [-180, -30] },
        'EUROPE-AFRICA': { lat: [-60, 60], lon: [-30, 120] }
      };

      const earthquakesByRegion = {
        'PACIFIC': 0,
        'AMERICAS': 0,
        'EUROPE-AFRICA': 0
      };

      earthquakes.forEach(eq => {
        const lat = eq.latitude || 0;
        const lon = eq.longitude || 0;

        if (lon >= 120 || lon <= -150) earthquakesByRegion['PACIFIC']++;
        else if (lon < -30 && lon > -180) earthquakesByRegion['AMERICAS']++;
        else earthquakesByRegion['EUROPE-AFRICA']++;
      });

      // Crear labels con países
      const countries = Object.keys(wageAvgByCountry).slice(0, 8); // Máximo 8 para legibilidad
      const wageValues = countries.map(c => wageAvgByCountry[c]);

      // Normalizar terremotos para que sean comparables
      const maxEq = Math.max(...Object.values(earthquakesByRegion));
      const eqValues = countries.map(() => {
        const avgEq = Object.values(earthquakesByRegion).reduce((a, b) => a + b, 0) / 3;
        return Math.round(avgEq);
      });

      pintarGrafica5(countries, wageValues, eqValues);
    } catch (e) {
      console.error('Error:', e);
    }
  }

  function pintarGrafica5(countries, wages, earthquakes) {
    if (!chart5Container) return;
    if (chart5) chart5.destroy();

    // Normalizar salarios para que sean comparables con terremotos
    const maxWage = Math.max(...wages);
    const normalizedWages = wages.map(w => Math.round((w / maxWage) * 100));

    chart5 = new Chart(chart5Container, {
      type: 'radar',
      data: {
        labels: countries,
        datasets: [
          {
            label: 'Salario promedio (normalizado)',
            data: normalizedWages,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.2)',
            fill: true,
            tension: 0.3
          },
          {
            label: 'Actividad sísmica (normalizada)',
            data: earthquakes,
            borderColor: '#dc2626',
            backgroundColor: 'rgba(220, 38, 38, 0.2)',
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            title: { display: true, text: 'Valor normalizado' }
          }
        },
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                const value = context.parsed.r;
                return `${label}: ${value}`;
              }
            }
          }
        }
      }
    });
  }

  // Gráfica 6: Salarios vs Consumo de Ozono (ECharts)
  let mostrarGrafica6 = $state(false);
  let chart6Container = $state();
  let echartsInstance = $state(null);
  let error6 = $state(null);
  let sinDatos6 = $state(false);

  async function cargarGrafica6() {
    await new Promise(resolve => setTimeout(resolve, 100));

    error6 = null;
    sinDatos6 = false;

    try {
      const res = await fetch('/api/v1/integrations/chart6');
      const data = await res.json();

      if (!data || (!data.wages && !data.ozoneData)) {
        sinDatos6 = true;
        return;
      }

      const wages = data.wages || [];
      const ozoneData = data.ozoneData || [];

      // Crear mapas agregados por país (promedio de años)
      const countryWages = {};
      const countryOzone = {};

      wages.forEach(w => {
        if (w && w.country && w.country.toLowerCase() !== 'world' && w.year !== undefined) {
          if (!countryWages[w.country]) countryWages[w.country] = [];
          countryWages[w.country].push(w.value || 0);
        }
      });

      ozoneData.forEach(o => {
        if (o && o.country && o.country.toLowerCase() !== 'world' && o.year !== undefined) {
          if (!countryOzone[o.country]) countryOzone[o.country] = [];
          countryOzone[o.country].push(Math.abs(o.value || 0));
        }
      });

      // Calcular promedios
      const treemapData = [];
      const allCountries = new Set([...Object.keys(countryWages), ...Object.keys(countryOzone)]);

      allCountries.forEach(country => {
        const wageVals = countryWages[country] || [0];
        const ozoneVals = countryOzone[country] || [0];

        const avgWage = wageVals.length > 0 ? wageVals.reduce((a, b) => a + b, 0) / wageVals.length : 0;
        const avgOzone = ozoneVals.length > 0 ? ozoneVals.reduce((a, b) => a + b, 0) / ozoneVals.length : 0;

        if (avgWage > 0) {
          treemapData.push({
            name: country.toUpperCase(),
            value: Math.round(avgWage),
            wageValue: avgWage,
            ozoneValue: avgOzone
          });
        }
      });

      if (treemapData.length === 0) {
        sinDatos6 = true;
        return;
      }

      console.log('📊 Treemap Data:', treemapData);
      pintarGrafica6(treemapData);
    } catch (e) {
      console.error('Error Gráfica 6:', e);
      error6 = 'Error al cargar los datos: ' + e.message;
    }
  }

  function pintarGrafica6(treemapData) {
    if (!chart6Container) return;

    if (echartsInstance) {
      echartsInstance.dispose();
      echartsInstance = null;
    }

    echartsInstance = echarts.init(chart6Container);

    // Preparar datos con colores según ozono
    const ozoneValues = treemapData.map(d => d.ozoneValue || 0).filter(v => v > 0);
    const maxOzone = Math.max(...ozoneValues, 1);
    const minOzone = Math.min(...ozoneValues, 0);

    const colors = ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'];

    const treemapDataProcessed = treemapData.map(d => {
      const ozone = d.ozoneValue || 0;
      const ratio = maxOzone > minOzone ? (ozone - minOzone) / (maxOzone - minOzone) : 0.5;
      const colorIndex = Math.floor(ratio * (colors.length - 1));
      const color = colors[Math.max(0, Math.min(colorIndex, colors.length - 1))];

      return {
        name: d.name,
        value: d.value,
        itemStyle: { color: color },
        wageValue: d.wageValue,
        ozoneValue: ozone
      };
    });

    const option = {
      title: {
        text: '🌍 Salarios vs Consumo de Ozono por País',
        subtext: 'Tamaño = Salario promedio (USD) | Color = Consumo de Ozono (azul=bajo, rojo=alto)',
        left: 'center',
        top: '1%',
        textStyle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' }
      },
      tooltip: {
        formatter: function(params) {
          if (!params || !params.data) return '';
          const wage = params.data.wageValue || params.value;
          const ozone = params.data.ozoneValue || 0;
          return `<strong>${params.name}</strong><br/>💰 Salario: $${wage.toFixed(2)} USD<br/>🌍 Ozono: ${ozone.toFixed(2)} toneladas`;
        }
      },
      series: [
        {
          type: 'treemap',
          data: treemapDataProcessed,
          leafDepth: 1,
          label: {
            show: true,
            formatter: function(params) {
              return `${params.name}\n$${params.value}`;
            },
            fontSize: 13,
            fontWeight: 'bold',
            color: '#fff',
            textShadowColor: '#000',
            textShadowBlur: 3,
            textShadowOffsetX: 1,
            textShadowOffsetY: 1
          },
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 2,
            gapWidth: 3
          },
          emphasis: {
            itemStyle: {
              borderColor: '#000',
              borderWidth: 3,
              shadowBlur: 15,
              shadowColor: 'rgba(0,0,0,0.6)'
            }
          }
        }
      ]
    };

    echartsInstance.setOption(option);
    window.addEventListener('resize', () => {
      if (echartsInstance) echartsInstance.resize();
    });
  }

  onDestroy(() => {
    if (chart1) chart1.destroy();
    if (chart2) chart2.destroy();
    if (chart3) chart3.destroy();
    if (chart4) chart4.destroy();
    if (chart5) chart5.destroy();
    if (echartsInstance) echartsInstance.dispose();
  });
</script>

<div class="container">
  <h1>🔗 Mis Integraciones de APIs (Chart.js)</h1>

  <section class="api-section">
    <div class="section-header">
      <h2>📊 Gráfica 1: Salarios vs Llegadas Turísticas</h2>
      <button
        class="btn-toggle"
        onclick={() => {
          mostrarGrafica1 = !mostrarGrafica1;
          if (mostrarGrafica1) cargarGrafica1();
        }}
      >
        {mostrarGrafica1 ? '❌ Ocultar' : '👁️ Mostrar'}
      </button>
    </div>

    {#if mostrarGrafica1}
      <p class="description">
        <strong>Datos normalizados:</strong> Salario mensual promedio (USD) de tu API + Número de llegadas turísticas de Grupo 25, ambos normalizados a escala 0-100%. Muestra tendencias por año para comparar cuál crece más rápido.
      </p>
      {#if error1}
        <div class="error-message">
          <strong>⚠️ Error:</strong> {error1}
        </div>
      {/if}
      {#if sinDatos1}
        <div class="no-data-message">
          <strong>📭 Sin datos:</strong> No hay datos disponibles para mostrar esta gráfica. Verifica que las APIs estén disponibles y contengan información.
        </div>
      {/if}
      {#if !error1 && !sinDatos1}
        <canvas bind:this={chart1Container}></canvas>
      {/if}
    {/if}
  </section>

  <section class="api-section">
    <div class="section-header">
      <h2>🏅 Gráfica 2: Salarios vs Atletas Olímpicos</h2>
      <button
        class="btn-toggle"
        onclick={() => {
          mostrarGrafica2 = !mostrarGrafica2;
          if (mostrarGrafica2) cargarGrafica2();
        }}
      >
        {mostrarGrafica2 ? '❌ Ocultar' : '👁️ Mostrar'}
      </button>
    </div>

    {#if mostrarGrafica2}
      <p class="description">
        <strong>Datos combinados:</strong> Salario mensual promedio (USD) de tu API + Número total de atletas olímpicos de Grupo 30.
        Muestra la relación entre participación olímpica y nivel salarial por continente: ¿Los continentes con mayores salarios tienen más atletas compitiendo?
      </p>
      <div bind:this={chart2Container} style="width: 100%; min-height: 500px;"></div>
    {/if}
  </section>

  <section class="api-section">
    <div class="section-header">
      <h2>🏗️ Gráfica 3: Salarios vs Inversión en Construcción</h2>
      <button
        class="btn-toggle"
        onclick={() => {
          mostrarGrafica3 = !mostrarGrafica3;
          if (mostrarGrafica3) cargarGrafica3();
        }}
      >
        {mostrarGrafica3 ? '❌ Ocultar' : '👁️ Mostrar'}
      </button>
    </div>

    {#if mostrarGrafica3}
      <p class="description">
        <strong>Datos combinados:</strong> Salario mensual promedio (USD) de tu API + Inversión total en construcción del Banco Mundial (API World Bank).
        Se muestra la evolución temporal (2019-2024) de ambas variables con dos ejes Y diferentes.
      </p>
      <canvas bind:this={chart3Container}></canvas>
    {/if}
  </section>

  <section class="api-section">
    <div class="section-header">
      <h2>🌍 Gráfica 4: Salarios vs Población por País</h2>
      <button
        class="btn-toggle"
        onclick={() => {
          mostrarGrafica4 = !mostrarGrafica4;
          if (mostrarGrafica4) cargarGrafica4();
        }}
      >
        {mostrarGrafica4 ? '❌ Ocultar' : '👁️ Mostrar'}
      </button>
    </div>

    {#if mostrarGrafica4}
      <p class="description">
        <strong>Datos combinados:</strong> Salario mensual promedio (USD) de tu API + Información demográfica de REST Countries.
        Cada burbuja representa un país, coloreada por región. El tamaño de la burbuja indica el nivel salarial.
      </p>
      <canvas bind:this={chart4Container}></canvas>
    {/if}
  </section>

  <section class="api-section">
    <div class="section-header">
      <h2>⚡ Gráfica 5: Salarios vs Actividad Sísmica (Radar)</h2>
      <button
        class="btn-toggle"
        onclick={() => {
          mostrarGrafica5 = !mostrarGrafica5;
          if (mostrarGrafica5) cargarGrafica5();
        }}
      >
        {mostrarGrafica5 ? '❌ Ocultar' : '👁️ Mostrar'}
      </button>
    </div>

    {#if mostrarGrafica5}
      <p class="description">
        <strong>Datos combinados:</strong> Salario mensual promedio (USD) de tu API + Actividad sísmica global de la API USGS.
        Visualización radar que muestra la correlación entre salarios por país y actividad sísmica. Ambas series están normalizadas para comparabilidad.
      </p>
      <canvas bind:this={chart5Container}></canvas>
    {/if}
  </section>

  <section class="api-section">
    <div class="section-header">
      <h2>🌍 Gráfica 6: Salarios vs Consumo de Ozono (ECharts)</h2>
      <button
        class="btn-toggle"
        onclick={() => {
          mostrarGrafica6 = !mostrarGrafica6;
          if (mostrarGrafica6) cargarGrafica6();
        }}
      >
        {mostrarGrafica6 ? '❌ Ocultar' : '👁️ Mostrar'}
      </button>
    </div>

    {#if mostrarGrafica6}
      <p class="description">
        <strong>Integración ECharts:</strong> Salario mensual promedio (USD) de tu API + Consumo de sustancias que agotan ozono de Grupo 22.
        Dos heatmaps lado a lado mostrando la relación entre niveles salariales y consumo de ozono por país y año, ambos normalizados a escala 0-100.
      </p>
      {#if error6}
        <div class="error-message">
          <strong>⚠️ Error:</strong> {error6}
        </div>
      {/if}
      {#if sinDatos6}
        <div class="no-data-message">
          <strong>📭 Sin datos:</strong> No hay datos disponibles para mostrar esta gráfica. Verifica que las APIs estén disponibles y contengan información.
        </div>
      {/if}
      {#if !error6 && !sinDatos6}
        <div bind:this={chart6Container} style="width: 100%; height: 700px; margin-top: 1rem;"></div>
      {/if}
    {/if}
  </section>
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
    margin-bottom: 2rem;
  }

  .api-section {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  h2 {
    margin: 0;
    color: #334155;
  }

  .btn-toggle {
    padding: 8px 16px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
  }

  .btn-toggle:hover {
    background: #2563eb;
  }

  .description {
    color: #64748b;
    margin: 1rem 0;
    font-size: 0.95rem;
  }

  canvas {
    max-width: 100%;
    height: auto;
  }

  .error-message {
    background: #fee2e2;
    border: 1px solid #fecaca;
    color: #991b1b;
    padding: 1.5rem;
    border-radius: 8px;
    margin: 1rem 0;
  }

  .no-data-message {
    background: #fef3c7;
    border: 1px solid #fde68a;
    color: #92400e;
    padding: 1.5rem;
    border-radius: 8px;
    margin: 1rem 0;
  }

  .chart-apexcharts {
    width: 100%;
    min-height: 400px;
  }
</style>