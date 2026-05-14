<script>
  import { onMount, onDestroy, tick } from "svelte";
  import * as echarts from "echarts";

  import * as am5 from "@amcharts/amcharts5";
  import * as am5xy from "@amcharts/amcharts5/xy";
  import * as am5percent from "@amcharts/amcharts5/percent";
  import * as am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

  // =========================================================
  // ESTADOS
  // =========================================================
  let vistaActual = $state("externas");
  let loading = $state(true);
  let loadingMsg = $state("Cargando e integrando datos reales...");
  let error = $state(null);
//errores en caso de que falle la grafica
  let errorClima = $state(null);
  let errorPais  = $state(null);
  let errorGit   = $state(null);
  let errorG30   = $state(null);
  let errorG19   = $state(null);

  // Debug: para mostrar qué devuelve realmente GitHub
  let githubDebug = $state(null);

  // =========================================================
  // DOM
  // =========================================================
  let amchartsBubbleContainer;   // Gráfica 1: ECharts scatter bubble 
  let echartsRadarContainer;     // Gráfica 2: ECharts Radar
  let amchartsFunnelContainer;   // Gráfica 3: amCharts FunnelSeries
  let echartstreemapContainer;   // Gráfica 4: ECharts Treemap
  let echartsSunburstContainer;  // Gráfica 5: ECharts Sunburst

  // =========================================================
  // INSTANCIAS
  // =========================================================
  let myChartBubble;  // ECharts scatter (gráfica 1)
  let funnelRoot;
  let myChartRadar;
  let myChartTreemap;
  let myChartSunburst;

  // =========================================================
  // HELPERS

  // =========================================================
  //dispose elimina las graficas,se llama antes de cargar alguna vista nueva para evitar errores
  function limpiarGraficas() {
    if (myChartBubble)     { myChartBubble.dispose();    myChartBubble    = null; }
    if (funnelRoot)        { funnelRoot.dispose();       funnelRoot       = null; }
    if (myChartRadar)      { myChartRadar.dispose();     myChartRadar     = null; }
    if (myChartTreemap)    { myChartTreemap.dispose();   myChartTreemap   = null; }
    if (myChartSunburst)   { myChartSunburst.dispose();  myChartSunburst  = null; }
  }
//evita duplicados de ciudades de mi api
  function filtrarCiudadesUnicas(lista) {
    const ciudades = new Set();
    const resultado = [];
    for (const item of lista) {
      if (item?.city && !ciudades.has(item.city)) {
        ciudades.add(item.city);
        resultado.push(item);
      }
    }
    return resultado;
  }
//detecta el formato en el cual le llefan los datos y los transforma en array (por ejemplo data:[..] o {items:[...]})
  function normalizeArray(payload) {
    if (Array.isArray(payload))          return payload;
    if (Array.isArray(payload?.data))    return payload.data;
    if (Array.isArray(payload?.items))   return payload.items;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
  }
  //para pasar a valores numericos
  function toNumber(value, defaultValue = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : defaultValue;
  }
//para pasar a string si traen %
  function parsePct(str) {
    if (!str) return 0;
    return toNumber(String(str).replace("%", "").trim());
  }


  // fetchJson básico sin retry (para APIs propias que son rápidas)
  async function fetchJson(url, nombreApi) {
    const response = await fetch(url);
    let payload = null;
    try { payload = await response.json(); } catch { payload = null; }
    if (!response.ok) throw new Error(payload?.error || `No se pudo cargar ${nombreApi}`);
    return payload;
  }

  // fetchJsonConRetry: para APIs externas lentas (Render cold-start, etc.)
  // timeout: ms por intento | intentos: max reintentos | backoff: espera base entre intentos
  // fetchJsonConRetry: para APIs externas lentas (Render cold-start, etc.)
  // Sin timeout artificial, espera a que el servidor responda
  async function fetchJsonConRetry(url, nombreApi, { intentos = 3, backoff = 8000 } = {}) {
    let ultimoError = null;

    for (let intento = 1; intento <= intentos; intento++) {
      try {
        // Hacemos el fetch normal, sin signal, para que espere lo que haga falta
        const response = await fetch(url);

        let payload = null;
        try { payload = await response.json(); } catch { payload = null; }
        if (!response.ok) throw new Error(payload?.error || `Error ${response.status} en ${nombreApi}`);
        return payload;

      } catch (e) {
        ultimoError = e;
        console.warn(`[${nombreApi}] Intento ${intento}/${intentos} fallido: ${e.message}`);
        
        if (intento < intentos) {
          const espera = backoff * intento; 
          console.info(`[${nombreApi}] Reintentando en ${espera / 1000}s...`);
          await new Promise(r => setTimeout(r, espera));
        }
      }
    }

    throw new Error(`${nombreApi}: ${ultimoError?.message ?? "Error desconocido"} (${intentos} intentos)`);
  }


  function setEmptyChart(chart, title, message) {
    chart.setOption({
      title: { text: title, left: "center", textStyle: { color: "#991b1b" } },
      graphic: [{ type: "text", left: "center", top: "middle",
        style: { text: `⚠️ ${message}`, font: "16px sans-serif", fill: "#991b1b" } }]
    });
  }

  // =========================================================
  // VISTA EXTERNAS
  //
  // Gráfica 1: IPC — amCharts XYChart con BubbleSeries (BUBBLE)
  //   IPC = (cost_usd_per_m2 / tempK) * (1 + |cambio%| / 100)
  //   Eje X: temperatura °C | Eje Y: coste | Tamaño burbuja: IPC
  //
  // Gráfica 2: IAE — ECharts RADAR
  //   IAE = (gdp_per_capita / cost_usd_per_m2) * (61 − rank)
  //   Cada ciudad como un spoke del radar con dimensiones:
  //   gdp_per_capita, cost_usd_per_m2, rank, IAE calculado
  //
  // Gráfica 3: IIR — amCharts FunnelSeries (FUNNEL)
  //   IIR = (estrellas_reales_de_repos_construccion / cost_usd_per_m2) * 1000
  //   GitHub: busca repos con query "construction {city}" para datos verídicos
  // =========================================================
  async function cargarVistasExternas() {
    vistaActual = "externas";
    loading = true;
    error = null;
    githubDebug = null;
    errorClima = errorPais = errorGit = errorG30 = errorG19 = null;

    limpiarGraficas();

    try {
      const rawIsaac = await fetchJson(
        "/api/v2/international-construction-costs",
        "API de costes internacionales de construcción"
      );

      const datosIsaac = normalizeArray(rawIsaac);
      const ciudadesUnicas = filtrarCiudadesUnicas(datosIsaac).slice(0, 5);

      if (ciudadesUnicas.length === 0) {
        throw new Error("No hay ciudades válidas en la API de costes internacionales de construcción");
      }

      const ipcData  = [];
      const iaeData  = [];
      const iirData  = [];
      const paisesProcesados = new Set();

      for (const dato of ciudadesUnicas) {
        const city    = dato.city;
        const country = dato.country;
        const cost    = toNumber(dato.cost_usd_per_m2);
        const rank    = toNumber(dato.rank, 60);
        const cambio  = Math.abs(parsePct(dato.cost_change_range));

        // ── 1. OPEN-METEO ──────────────────────────────────
        try {
          const weather = await fetchJson(
            `/api/v2/proxy/weather?city=${encodeURIComponent(city)}`,
            "Open-Meteo"
          );
          const tempC = weather?.temperature != null ? toNumber(weather.temperature) : null;
          if (tempC !== null && cost > 0) {
            const tempK = tempC + 273.15;
            const ipc   = Number(((cost / tempK) * (1 + cambio / 100)).toFixed(2));
            ipcData.push({ city, ipc, cost, tempC, cambio, rank });
          }
        } catch (e) {
          console.warn(`[OPEN-METEO] ${city}:`, e.message);
          errorClima = "Algunas ciudades no pudieron cruzarse con Open-Meteo.";
        }

        // ── 2. API NINJAS ──────────────────────────────────
        try {
          if (country && !paisesProcesados.has(country) && cost > 0) {
            const countryPayload = await fetchJson(
              `/api/v2/proxy/country?name=${encodeURIComponent(country)}`,
              "API Ninjas"
            );
            const countryArray = normalizeArray(countryPayload);
            const gdpPerCapita = toNumber(countryArray?.[0]?.gdp_per_capita);
            const gdpFallback  = toNumber(countryArray?.[0]?.gdp);
            const gdp          = gdpPerCapita > 0 ? gdpPerCapita : gdpFallback;
            if (gdp > 0) {
              const factorRank = Math.max(1, 61 - rank);
              const iae        = Number(((gdp / cost) * factorRank).toFixed(2));
              iaeData.push({ pais: country, city, iae, gdp, cost, rank, factorRank });
              paisesProcesados.add(country);
            }
          }
        } catch (e) {
          console.warn(`[API NINJAS] ${country}:`, e.message);
          errorPais = "Algunos países no pudieron cruzarse con API Ninjas.";
        }

        // ── 3. GITHUB ──────────────────────────────────────
        // Se busca "construction {city}" para obtener repos REALES
        // relacionados con construcción en esa ciudad.
        // El proxy debe hacer: GET https://api.github.com/search/repositories?q=construction+{city}&sort=stars&per_page=10
        try {
          const githubPayload = await fetchJson(
            `/api/v2/proxy/github-innovation?city=${encodeURIComponent(city)}`,
            "GitHub"
          );

          
  
          const items          = Array.isArray(githubPayload?.items) ? githubPayload.items : [];
          const totalEstrellas = items.reduce((acc, r) => acc + toNumber(r?.stargazers_count), 0);

          if (cost > 0) {
            const iir = Number(((totalEstrellas / cost) * 1000).toFixed(4));
            iirData.push({
              city,
              iir,
              estrellas: totalEstrellas,
              repos: items.length,
              cost,
              totalEncontrados: toNumber(githubPayload?.total_count),
              // Incluir nombre del repo más popular para mostrar en tooltip
              topRepo: items[0]?.full_name ?? "—"
            });
          }
        } catch (e) {
          console.warn(`[GITHUB] ${city}:`, e.message);
          errorGit = `Error GitHub: ${e.message}`;
        }
      }

      loading = false;
      await tick();

      // =====================================================
      // GRÁFICA 1: IPC — amCharts XYChart BubbleSeries
      // Librería: amCharts 5  |  Tipo: BubbleSeries (scatter con tamaño)
      // Eje X: temperatura °C  |  Eje Y: coste USD/m²  |  Burbuja: IPC
      // =====================================================
      // GRÁFICA 1: IPC — ECharts scatter (bubble)
      // Librería: ECharts  |  Tipo: scatter con symbolSize dinámico
      // Eje X: temperatura °C | Eje Y: coste USD/m² | Tamaño: IPC
      // =====================================================
      if (amchartsBubbleContainer) {
        // Reutilizamos el contenedor DOM pero con ECharts 
        myChartBubble = echarts.init(amchartsBubbleContainer);

        if (ipcData.length > 0) {
          const maxIpc = Math.max(...ipcData.map(d => d.ipc));

          myChartBubble.setOption({
            title: {
              text: "Índice de Presión Climática (IPC) — Scatter Bubble",
              subtext: "IPC = (coste / tempK) × (1 + |Δprecio%| / 100)   |   Tamaño de burbuja ∝ IPC",
              left: "center",
              textStyle: { fontSize: 13 }
            },
            tooltip: {
              trigger: "item",
              formatter: (params) => {
                const d = ipcData[params.dataIndex];
                return `<b>${d.city}</b><br/>` +
                  `IPC: <b>${d.ipc}</b><br/>` +
                  `Temperatura: ${d.tempC} °C<br/>` +
                  `Coste: $${d.cost.toLocaleString()} USD/m²<br/>` +
                  `Variación anual: ${d.cambio}%<br/>` +
                  `Ranking global: #${d.rank}`;
              }
            },
            xAxis: {
              name: "Temperatura (°C)",
              nameLocation: "middle",
              nameGap: 35,
              splitLine: { lineStyle: { type: "dashed" } }
            },
            yAxis: {
              name: "Coste (USD/m²)",
              nameLocation: "middle",
              nameGap: 60,
              splitLine: { lineStyle: { type: "dashed" } }
            },
            series: [{
              type: "scatter",
              data: ipcData.map(d => [d.tempC, d.cost]),
              symbolSize: (val, params) => {
                const ipc = ipcData[params.dataIndex]?.ipc ?? 0;
                return Math.max(20, Math.min(80, (ipc / maxIpc) * 80));
              },
              itemStyle: {
                color: (params) => {
                  const ipc = ipcData[params.dataIndex]?.ipc ?? 0;
                  return ipc > maxIpc * 0.6 ? "#c0392b" : "#3f5f59";
                },
                opacity: 0.8
              },
              label: {
                show: true,
                formatter: (params) => ipcData[params.dataIndex]?.city ?? "",
                position: "top",
                fontSize: 11
              }
            }]
          });
        } else {
          errorClima = errorClima || "No se pudo calcular el IPC para ninguna ciudad.";
          myChartBubble.setOption({
            graphic: [{ type: "text", left: "center", top: "middle",
              style: { text: "⚠️ Sin datos de temperatura", font: "16px sans-serif", fill: "#991b1b" } }]
          });
        }
      }

      // =====================================================
      // GRÁFICA 2: IAE — ECharts Radar
      // Librería: ECharts  |  Tipo: radar
      // Ejes: gdp, cost, rank, factorRank, IAE calculado (normalizado)
      // =====================================================
      if (echartsRadarContainer) {
        myChartRadar = echarts.init(echartsRadarContainer);

        if (iaeData.length > 0) {
          // Normalizar cada dimensión a [0, 100] para que el radar sea legible
          const maxGdp        = Math.max(...iaeData.map(d => d.gdp));
          const maxCost       = Math.max(...iaeData.map(d => d.cost));
          const maxIae        = Math.max(...iaeData.map(d => d.iae));
          const maxFactorRank = Math.max(...iaeData.map(d => d.factorRank));

          const normalize = (val, max) => max > 0 ? Number(((val / max) * 100).toFixed(1)) : 0;

          const indicators = [
            { name: "PIB per cápita",       max: 100 },
            { name: "Coste USD/m²",         max: 100 },
            { name: "Factor ranking",        max: 100 },
            { name: "IAE (accesibilidad)",   max: 100 }
          ];

          const seriesData = iaeData.map(d => ({
            name: `${d.city} (${d.pais})`,
            value: [
              normalize(d.gdp,        maxGdp),
              normalize(d.cost,       maxCost),
              normalize(d.factorRank, maxFactorRank),
              normalize(d.iae,        maxIae)
            ]
          }));

          myChartRadar.setOption({
            title: {
              text: "Índice de Accesibilidad Económica (IAE) — Radar",
              subtext: "IAE = (PIB p.c. / coste) × (61 − rank)   |   Valores normalizados [0–100]",
              left: "center",
              textStyle: { fontSize: 13 }
            },
            tooltip: {
              trigger: "item",
              formatter: (params) => {
                const d = iaeData[params.dataIndex];
                return `<b>${d.city} (${d.pais})</b><br/>` +
                  `IAE: <b>${d.iae}</b><br/>` +
                  `PIB per cápita: $${d.gdp.toLocaleString()}<br/>` +
                  `Coste: $${d.cost.toLocaleString()} USD/m²<br/>` +
                  `Ranking global: #${d.rank}`;
              }
            },
            legend: {
              data: seriesData.map(d => d.name),
              bottom: 0
            },
            radar: {
              indicator: indicators,
              splitNumber: 4
            },
            series: [{
              type: "radar",
              data: seriesData,
              areaStyle: { opacity: 0.2 },
              symbol: "circle",
              symbolSize: 6
            }]
          });
        } else {
          errorPais = errorPais || "No se pudo calcular el IAE con API Ninjas.";
          setEmptyChart(myChartRadar, "Sin datos de API Ninjas", "Sin datos de IAE");
        }
      }

      // =====================================================
      // GRÁFICA 3: IIR — amCharts FunnelSeries
      // Librería: amCharts 5 (percent)  |  Tipo: FunnelSeries
      // Cada ciudad como un segmento del embudo, tamaño = IIR
      // NOTA: Los datos vienen de GitHub real via proxy
      // =====================================================
      if (amchartsFunnelContainer) {
        if (iirData.length > 0) {
          funnelRoot = am5.Root.new(amchartsFunnelContainer);
          funnelRoot.setThemes([am5themes_Animated.default.new(funnelRoot)]);

          const chart = funnelRoot.container.children.push(
            am5percent.SlicedChart.new(funnelRoot, {
              layout: funnelRoot.verticalLayout,
              paddingBottom: 30
            })
          );

          chart.children.unshift(am5.Label.new(funnelRoot, {
            text: "Índice de Innovación Relativa (IIR) — Funnel\n(⭐ repos GitHub construcción / coste USD/m²) × 1000",
            textAlign: "center",
            x: am5.percent(50),
            centerX: am5.percent(50),
            fontSize: 13,
            fontWeight: "500"
          }));

          const series = chart.series.push(
            am5percent.FunnelSeries.new(funnelRoot, {
              alignLabels: false,
              orientation: "vertical",
              valueField: "iir",
              categoryField: "city",
              tooltip: am5.Tooltip.new(funnelRoot, {
                labelText: "{city}\nIIR: {iir}\n⭐ Estrellas: {estrellas}\nTop repo: {topRepo}\nCoste: {cost} USD/m²\nTotal GitHub: {totalEncontrados}"
              })
            })
          );

          series.labels.template.setAll({
            fontSize: 12,
            text: "{category}: {value}"
          });

          series.data.setAll(iirData);
          series.appear();
          chart.appear(1000, 100);

          // Legend
          const legend = chart.children.push(am5.Legend.new(funnelRoot, {
            centerX: am5.percent(50),
            x: am5.percent(50),
            marginTop: 10,
            marginBottom: 10
          }));
          legend.data.setAll(series.dataItems);

        } else {
          errorGit = errorGit || "No se pudo calcular el IIR para ninguna ciudad.";
        }
      }

    } catch (e) {
      console.error(e);
      error = e.message;
      loading = false;
    }
  }

  // =========================================================
  // VISTA COMPAÑEROS
  //
  // Gráfica 4: IREF — ECharts TREEMAP
  //   IREF = cheater_reports * (coste_promedio_país / 1000)
  //   Cada país = rectángulo, tamaño = IREF
  //
  // Gráfica 5: IVHC — ECharts SUNBURST
  //   IVHC = severity_km2 / avg_cost_usd_per_m2
  //   Nivel externo: país | Nivel interno: severidad vs coste
  // =========================================================
  async function cargarVistasCompaneros() {
    vistaActual = "companeros";
    loading = true;
    error = null;
    errorClima = errorPais = errorGit = errorG30 = errorG19 = null;

    limpiarGraficas();

    let data30 = [];
    let data19 = [];

    try {
   
      loadingMsg = "Cargando tu API de construcción...";
      await tick();

      const [resIsaac, res30, res19] = await Promise.allSettled([
        fetchJson("/api/v2/international-construction-costs", "Tu API"),
        (async () => {
          loadingMsg = "Contactando API G30 (puede tardar ~20s si Render está iniciando)...";
          await tick();
          return fetchJsonConRetry("/api/v2/proxy/cheaters-stats", "API SOS G30",
            { timeout: 30000, intentos: 3, backoff: 4000 });
        })(),
        (async () => {
          loadingMsg = "Contactando API G19 (puede tardar ~20s si Render está iniciando)...";
          await tick();
          return fetchJsonConRetry("/api/v2/proxy/drought-stats", "API SOS G19",
            { timeout: 30000, intentos: 3, backoff: 4000 });
        })()
      ]);

      loadingMsg = "Procesando datos...";
      await tick();

      // Mapa país (lowercase) → coste promedio
      const costePorPais = {};
      if (resIsaac.status === "fulfilled") {
        const datosIsaac = normalizeArray(resIsaac.value);
        const acumulado  = {};
        for (const d of datosIsaac) {
          const pais = (d.country ?? "").toLowerCase().trim();
          const cost = toNumber(d.cost_usd_per_m2);
          if (pais && cost > 0) {
            if (!acumulado[pais]) acumulado[pais] = { suma: 0, n: 0 };
            acumulado[pais].suma += cost;
            acumulado[pais].n   += 1;
          }
        }
        for (const [pais, { suma, n }] of Object.entries(acumulado)) {
          costePorPais[pais] = Number((suma / n).toFixed(2));
        }
      }

      if (res30.status === "fulfilled") {
        data30 = normalizeArray(res30.value);
      } else {
        console.warn("[G30]", res30.reason?.message);
        errorG30 = res30.reason?.message || "No se pudo cargar la integración con G30.";
      }

      if (res19.status === "fulfilled") {
        data19 = normalizeArray(res19.value);
      } else {
        console.warn("[G19]", res19.reason?.message);
        errorG19 = res19.reason?.message || "No se pudo cargar la integración con G19.";
      }

      loading = false;
      await tick();

      // =====================================================
      // GRÁFICA 4: IREF — ECharts Gauge (múltiple)
      // Librería: ECharts  |  Tipo: gauge
      // Un gauge por país (máx 6), aguja = IREF normalizado 0-100
      // Color: verde (bajo riesgo) → rojo (alto riesgo)
      // =====================================================
      if (echartstreemapContainer) {
        myChartTreemap = echarts.init(echartstreemapContainer);

        const medianaFallback = medianaCostes(costePorPais);

        const irefData = data30
          .filter(d => d?.country)
          .slice(0, 6)   // máx 6 gauges para que quepan bien
          .map(d => {
            const paisKey   = (d.country ?? "").toLowerCase().trim();
            const costePais = costePorPais[paisKey] ?? medianaFallback;
            const reports   = toNumber(d.cheater_reports);
            const iref      = Number((reports * (costePais / 1000)).toFixed(2));
            return { name: d.country, iref, reports, costePais,
              tieneCruce: costePorPais[paisKey] !== undefined };
          })
          .filter(d => d.iref > 0);

        if (irefData.length > 0) {
          // Normalizar IREF a [0, 100] para la escala del gauge
          const maxIref = Math.max(...irefData.map(d => d.iref));

          // Distribuir gauges en una cuadrícula 3×2
          const cols = Math.min(3, irefData.length);
          const rows = Math.ceil(irefData.length / cols);

          const gaugeSeries = irefData.map((d, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const w   = 100 / cols;
            const h   = 100 / rows;
            const cx  = w * col + w / 2;
            const cy  = h * row + h / 2 + 8; // +8% para dejar espacio al título

            const normalizado = Number(((d.iref / maxIref) * 100).toFixed(1));

            return {
              type: "gauge",
              center: [`${cx}%`, `${cy}%`],
              radius: `${Math.min(w, h) * 0.42}%`,
              startAngle: 200,
              endAngle: -20,
              min: 0,
              max: 100,
              splitNumber: 4,
              axisLine: {
                lineStyle: {
                  width: 8,
                  color: [
                    [0.33, "#27ae60"],
                    [0.66, "#f39c12"],
                    [1,    "#c0392b"]
                  ]
                }
              },
              pointer: { itemStyle: { color: "auto" }, length: "70%" },
              axisTick:   { distance: -8, length: 4, lineStyle: { color: "#fff", width: 1 } },
              splitLine:  { distance: -12, length: 8, lineStyle: { color: "#fff", width: 2 } },
              axisLabel:  { color: "auto", distance: 12, fontSize: 9 },
              detail: {
                valueAnimation: true,
                formatter: (val) => `${val}`,
                color: "auto",
                fontSize: 12,
                fontWeight: "bold",
                offsetCenter: [0, "60%"]
              },
              title: {
                offsetCenter: [0, "88%"],
                fontSize: 10,
                color: "#333",
                overflow: "break",
                width: 80
              },
              tooltip: {
                formatter: () =>
                  `<b>${d.name}</b><br/>` +
                  `IREF: <b>${d.iref}</b><br/>` +
                  `Reportes: ${d.reports}<br/>` +
                  `Coste: $${d.costePais.toLocaleString()} USD/m²` +
                  (d.tieneCruce ? "" : " <i>(mediana)</i>")
              },
              data: [{ value: normalizado, name: d.name }]
            };
          });

          myChartTreemap.setOption({
            title: {
              text: "Índice de Riesgo Económico por Fraude (IREF) — Gauge",
              subtext: "IREF = cheater_reports × (coste_construcción_país / 1000)   |   Escala 0–100 normalizada",
              left: "center",
              textStyle: { fontSize: 13 }
            },
            tooltip: { trigger: "item" },
            series: gaugeSeries
          });
        } else {
          errorG30 = errorG30 || "La API G30 no devolvió datos representables para el IREF.";
          setEmptyChart(myChartTreemap, "Sin datos G30", "Sin datos de cheaters-stats");
        }
      }

      // =====================================================
      // GRÁFICA 5: IVHC — ECharts Sunburst
      // Librería: ECharts  |  Tipo: sunburst
      // Nivel 1 (anillo externo): país
      // El valor es el IVHC = severity_km2 / coste_país
      // Se agrupan por cuartil de IVHC en el anillo interior
      // =====================================================
      if (echartsSunburstContainer) {
        myChartSunburst = echarts.init(echartsSunburstContainer);

        const medianaFallback = medianaCostes(costePorPais);

        const ivhcData = data19
          .filter(d => d?.country)
          .slice(0, 12)
          .map(d => {
            const paisKey   = (d.country ?? "").toLowerCase().trim();
            const costePais = costePorPais[paisKey] ?? medianaFallback;
            const severity  = toNumber(d.severity_km2);
            const ivhc      = costePais > 0 ? Number((severity / costePais).toFixed(4)) : 0;
            return {
              name: d.country, value: ivhc, severity, costePais,
              tieneCruce: costePorPais[paisKey] !== undefined
            };
          })
          .filter(d => d.value > 0);

        if (ivhcData.length > 0) {
          // Agrupar en 3 niveles: Alta / Media / Baja vulnerabilidad
          const sorted  = [...ivhcData].sort((a, b) => b.value - a.value);
          const tercio  = Math.ceil(sorted.length / 3);
          const alta    = sorted.slice(0, tercio);
          const media   = sorted.slice(tercio, tercio * 2);
          const baja    = sorted.slice(tercio * 2);

          const sunburstData = [
            {
              name: "Alta vulnerabilidad",
              itemStyle: { color: "#c0392b" },
              children: alta.map(d => ({
                name: d.name,
                value: d.value,
                tooltip: { formatter: () =>
                  `<b>${d.name}</b><br/>IVHC: ${d.value}<br/>Sequía: ${d.severity.toLocaleString()} km²<br/>Coste: $${d.costePais.toLocaleString()} USD/m²` +
                  (d.tieneCruce ? "" : " (mediana)")
                }
              }))
            },
            {
              name: "Media vulnerabilidad",
              itemStyle: { color: "#e67e22" },
              children: media.map(d => ({
                name: d.name,
                value: d.value
              }))
            },
            {
              name: "Baja vulnerabilidad",
              itemStyle: { color: "#27ae60" },
              children: baja.map(d => ({
                name: d.name,
                value: d.value
              }))
            }
          ].filter(g => g.children.length > 0);

          myChartSunburst.setOption({
            title: {
              text: "Índice de Vulnerabilidad Hídrica Constructiva (IVHC) — Sunburst",
              subtext: "IVHC = severidad_sequía_km² / coste_construcción_país",
              left: "center",
              textStyle: { fontSize: 13 }
            },
            tooltip: {
              trigger: "item",
              formatter: (params) => {
                const d = ivhcData.find(x => x.name === params.name);
                if (!d) return `<b>${params.name}</b>`;
                return `<b>${d.name}</b><br/>` +
                  `IVHC: <b>${d.value}</b><br/>` +
                  `Severidad sequía: ${d.severity.toLocaleString()} km²<br/>` +
                  `Coste construcción: $${d.costePais.toLocaleString()} USD/m²` +
                  (d.tieneCruce ? "" : " <i>(mediana global)</i>");
              }
            },
            series: [{
              type: "sunburst",
              data: sunburstData,
              radius: ["20%", "85%"],
              label: {
                rotate: "radial",
                fontSize: 11
              },
              itemStyle: {
                borderWidth: 2,
                borderColor: "#fff"
              },
              emphasis: {
                focus: "ancestor"
              }
            }]
          });
        } else {
          errorG19 = errorG19 || "La API G19 no devolvió datos representables para el IVHC.";
          setEmptyChart(myChartSunburst, "Sin datos G19", "Sin datos de drought-stats");
        }
      }

    } catch (e) {
      console.error(e);
      error = e.message;
      loading = false;
    }
  }

  function medianaCostes(costePorPais) {
    const valores = Object.values(costePorPais).sort((a, b) => a - b);
    if (valores.length === 0) return 2500;
    const mid = Math.floor(valores.length / 2);
    return valores.length % 2 === 0
      ? (valores[mid - 1] + valores[mid]) / 2
      : valores[mid];
  }

  onMount(() => { cargarVistasExternas(); });
  onDestroy(() => { limpiarGraficas(); });
</script>

<section class="analytics-page">
  <h1>Estadísticas de Construcción e Impacto Ambiental</h1>

  <div class="button-group">
    <button class:active={vistaActual === "externas"} onclick={cargarVistasExternas}>
      Dashboard Mashups
    </button>
    <button class:active={vistaActual === "companeros"} onclick={cargarVistasCompaneros}>
      Integraciones Compañeros
    </button>
  </div>

  {#if loading}
    <div class="status-box">
      <div class="spinner"></div>
      <p class="status">{loadingMsg}</p>
    </div>
  {:else if error}
    <div class="error-box">{error}</div>
  {:else}
    <div class="view-container">

      {#if vistaActual === "externas"}

        <!-- GRÁFICA 1: amCharts BubbleSeries -->
        <div class="chart-wrapper">
          <h2 class="sub-title">Open-Meteo × Tu API — Índice de Presión Climática (IPC)</h2>
          <p class="integration-desc">
            <strong>IPC = (cost_usd_per_m² / temperatura_Kelvin) × (1 + |Δprecio%| / 100)</strong>
            Cada burbuja es una ciudad. El eje X muestra la temperatura actual, el eje Y el coste
            de construcción y el tamaño de la burbuja representa el IPC calculado.
            Ciudades frías con fuerte subida de precio tienen IPC más alto.
            <em>Widget: <b>ECharts — scatter</b> (symbolSize dinámico proporcional al IPC).</em>
          </p>
          {#if errorClima}
            <p class="warn-box">⚠️ {errorClima}</p>
          {/if}
          <div bind:this={amchartsBubbleContainer} class="chart-container"></div>
        </div>

        <!-- GRÁFICA 2: ECharts Radar -->
        <div class="chart-wrapper">
          <h2 class="sub-title">API Ninjas × Tu API — Índice de Accesibilidad Económica (IAE)</h2>
          <p class="integration-desc">
            <strong>IAE = (PIB per cápita / cost_usd_per_m²) × (61 − rank)</strong>
            El radar muestra 4 dimensiones normalizadas [0–100] para cada ciudad:
            PIB per cápita del país, coste de construcción, factor de ranking y el IAE resultante.
            Cuanto más amplio el polígono, más accesible económicamente es la ciudad.
            <em>Widget: <b>ECharts — radar</b>.</em>
          </p>
          {#if errorPais}
            <p class="warn-box">⚠️ {errorPais}</p>
          {/if}
          <div bind:this={echartsRadarContainer} class="chart-container"></div>
        </div>

        <!-- GRÁFICA 3: amCharts FunnelSeries -->
        <div class="chart-wrapper">
          <h2 class="sub-title">GitHub × Tu API — Índice de Innovación Relativa (IIR)</h2>
          <p class="integration-desc">
            <strong>IIR = (⭐ estrellas top repos "construction [ciudad]" / cost_usd_per_m²) × 1000</strong>
            El proxy busca en GitHub repositorios reales relacionados con "construction [ciudad]"
            ordenados por estrellas. Los datos son verídicos de la GitHub Search API.
            El embudo ordena ciudades de mayor a menor IIR: cuanto más arriba, más ecosistema
            open-source de construcción en relación a lo que cuesta construir allí.
            <em>Widget: <b>amCharts 5 — FunnelSeries</b> (SlicedChart vertical).</em>
          </p>
          {#if errorGit}
            <p class="warn-box">⚠️ {errorGit}</p>
          {/if}
          <!-- Debug de GitHub: muestra qué devuelve realmente el proxy -->
          {#if githubDebug}
            <details class="debug-box">
              <summary>🔍 Debug GitHub — ¿Qué devuelve el proxy?</summary>
              <p><strong>URL llamada:</strong> <code>{githubDebug.urlUsada}</code></p>
              <p><strong>total_count:</strong> {githubDebug.totalCount ?? "—"}</p>
              {#if githubDebug.primerRepo}
                <p><strong>Primer repo:</strong>
                  <code>{githubDebug.primerRepo.full_name}</code> —
                  ⭐ {githubDebug.primerRepo.stars} —
                  {githubDebug.primerRepo.description || "(sin descripción)"}
                </p>
              {:else}
                <p class="warn-box">⚠️ El proxy devolvió 0 items. Comprueba que el proxy
                  llama a <code>https://api.github.com/search/repositories?q=construction+[ciudad]&sort=stars&per_page=10</code>
                  y que incluye el header <code>Accept: application/vnd.github+json</code>.</p>
              {/if}
            </details>
          {/if}
          <div bind:this={amchartsFunnelContainer} class="chart-container"></div>
        </div>

      {:else}

        <!-- GRÁFICA 4: ECharts Treemap -->
        <div class="chart-wrapper">
          <h2 class="sub-title">G30 × Tu API — Índice de Riesgo Económico por Fraude (IREF)</h2>
          <p class="integration-desc">
            <strong>IREF = cheater_reports × (coste_medio_construcción_país / 1000)</strong>
            Cada gauge representa un país; la aguja indica el IREF normalizado [0–100].
            Verde = riesgo bajo, naranja = medio, rojo = alto. Se cruzan los reportes
            de fraude de G30 con el coste promedio de construcción de tu API.
            Si el país no está en la API se usa la mediana global como fallback.
            <em>Widget: <b>ECharts — gauge</b> (múltiple, cuadrícula 3×2).</em>
          </p>
          {#if errorG30}
            <p class="warn-box">⚠️ {errorG30}</p>
          {/if}
          <div bind:this={echartstreemapContainer} class="chart-container"></div>
        </div>

        <!-- GRÁFICA 5: ECharts Sunburst -->
        <div class="chart-wrapper">
          <h2 class="sub-title">G19 × Tu API — Índice de Vulnerabilidad Hídrica Constructiva (IVHC)</h2>
          <p class="integration-desc">
            <strong>IVHC = severidad_sequía_km² / coste_medio_construcción_país</strong>
            El sunburst agrupa países en tres anillos según nivel de vulnerabilidad hídrica
            (Alta / Media / Baja). El anillo interior son los grupos y el exterior los países.
            Un IVHC alto indica que hay mucha sequía severa respecto al coste de construcción.
            <em>Widget: <b>ECharts — sunburst</b>.</em>
          </p>
          {#if errorG19}
            <p class="warn-box">⚠️ {errorG19}</p>
          {/if}
          <div bind:this={echartsSunburstContainer} class="chart-container"></div>
        </div>

      {/if}
    </div>
  {/if}
</section>

<style>
  .analytics-page {
    padding: 2rem;
    max-width: 1100px;
    margin: 0 auto;
    font-family: sans-serif;
  }

  h1 {
    color: #12332f;
    text-align: center;
    margin-bottom: 2rem;
  }

  .button-group {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 3rem;
    flex-wrap: wrap;
  }

  button {
    padding: 0.8rem 2rem;
    border: 2px solid #3f5f59;
    border-radius: 8px;
    cursor: pointer;
    background: white;
    font-weight: 600;
  }

  button.active {
    background: #3f5f59;
    color: white;
  }

  .integration-desc {
    font-size: 0.95rem;
    color: #444;
    background: #f4f7f6;
    padding: 1rem;
    border-left: 5px solid #3f5f59;
    margin-bottom: 1.5rem;
    border-radius: 0 8px 8px 0;
    line-height: 1.6;
  }

  .integration-desc strong {
    display: block;
    font-family: monospace;
    font-size: 0.9rem;
    background: #dde8e6;
    padding: 0.3rem 0.5rem;
    border-radius: 4px;
    margin-bottom: 0.5rem;
    color: #12332f;
  }

  .integration-desc em {
    display: block;
    margin-top: 0.5rem;
    font-size: 0.88rem;
    color: #666;
  }

  .sub-title {
    color: #12332f;
    font-weight: bold;
    margin-bottom: 0.5rem;
    font-size: 1.1rem;
  }

  .chart-wrapper {
    margin-bottom: 5rem;
  }

  .chart-container {
    width: 100%;
    height: 500px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  .warn-box {
    background: #fff7ed;
    color: #92400e;
    padding: 0.8rem 1rem;
    border-radius: 8px;
    border-left: 4px solid #f59e0b;
    margin-bottom: 0.8rem;
    font-size: 0.9rem;
  }

  .error-box {
    background: #fee2e2;
    color: #991b1b;
    padding: 2rem;
    border-radius: 12px;
    text-align: center;
    border: 1px solid #fecaca;
  }

  .status-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 3rem 0;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #dde8e6;
    border-top-color: #3f5f59;
    border-radius: 50%;
    animation: spin 0.9s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .status {
    text-align: center;
    font-size: 1rem;
    color: #555;
    max-width: 420px;
    line-height: 1.5;
  }

  .debug-box {
    background: #f0f4ff;
    border: 1px solid #93c5fd;
    border-radius: 8px;
    padding: 0.8rem 1rem;
    margin-bottom: 1rem;
    font-size: 0.88rem;
    color: #1e3a5f;
  }

  .debug-box summary {
    cursor: pointer;
    font-weight: 600;
    color: #1e40af;
  }

  .debug-box code {
    background: #dbeafe;
    padding: 0.1rem 0.3rem;
    border-radius: 4px;
  }
</style>