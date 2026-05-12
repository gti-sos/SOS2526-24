<script>
  import { onMount, onDestroy, tick } from "svelte";
  import { browser } from "$app/environment";

  let Plotly;

  const PROXY_BASE = "/api/v2/recreation-culture-expenditure/proxy";

  let loading = $state(false);
  let error = $state(null);
  let chartVisible = $state(false);

  let chartContainer;

  async function fetchJson(url) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`La petición ha fallado con estado ${response.status}`);
    }

    return await response.json();
  }

  async function ensureInitialData(url) {
    const response = await fetch(url);

    /*
      loadInitialData puede devolver:
      - 201 si ha cargado los datos iniciales
      - 200 si la API lo tiene implementado así
      - 204 si no devuelve cuerpo
      - 409 si la base de datos ya tenía datos

      El 409 no debe romper la gráfica, aunque el navegador pueda mostrarlo
      si se llama directamente a este endpoint.
    */
    if ([200, 201, 204, 409].includes(response.status)) {
      return;
    }

    throw new Error(
      `No se pudieron cargar los datos iniciales desde ${url}. Estado ${response.status}`
    );
  }

  async function fetchCollectionWithAutoLoad(collectionUrl, loadInitialDataUrl) {
    /*
      Primero pedimos los datos reales de la colección.
      Solo si la colección viene vacía llamamos a loadInitialData.

      Así evitamos llamar a loadInitialData siempre y evitamos el 409 Conflict
      en consola cuando la API ya tenía datos cargados.
    */
    let payload = await fetchJson(collectionUrl);
    let rows = getArrayFromPayload(payload);

    if (rows.length > 0) {
      return payload;
    }

    await ensureInitialData(loadInitialDataUrl);

    payload = await fetchJson(collectionUrl);
    rows = getArrayFromPayload(payload);

    return payload;
  }

  function getArrayFromPayload(payload) {
    if (Array.isArray(payload)) {
      return payload;
    }

    const possibleArrayFields = ["data", "results", "items", "records"];

    for (const field of possibleArrayFields) {
      if (Array.isArray(payload?.[field])) {
        return payload[field];
      }
    }

    return [];
  }

  function pickText(object, candidateFields, fallback) {
    for (const field of candidateFields) {
      const value = object?.[field];

      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return String(value).trim();
      }
    }

    return fallback;
  }

  function parseNumber(value) {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    let text = String(value).trim().replace("%", "").replace(/\s/g, "");

    if (text.includes(",") && !text.includes(".")) {
      text = text.replace(",", ".");
    } else {
      text = text.replace(/,/g, "");
    }

    const number = Number(text);

    return Number.isFinite(number) ? number : null;
  }

  function pickNumber(object, candidateFields) {
    for (const field of candidateFields) {
      const number = parseNumber(object?.[field]);

      if (number !== null) {
        return number;
      }
    }

    return null;
  }

  function formatNumber(value) {
    if (value === undefined || value === null || value === "") {
      return "";
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
      return String(value);
    }

    return number.toFixed(2);
  }

  function normalizeCountryName(value) {
    const normalized = String(value ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/-/g, " ")
      .replace(/\s+/g, " ");

    const aliases = {
      usa: "united states",
      us: "united states",
      "u.s.": "united states",
      "u.s.a.": "united states",
      "united states of america": "united states",
      "estados unidos": "united states",
      "estados unidos de america": "united states",

      "reino unido": "united kingdom",
      uk: "united kingdom",
      "great britain": "united kingdom",
      england: "united kingdom",

      espana: "spain",
      "españa": "spain",
      alemania: "germany",
      francia: "france",
      italia: "italy",
      irlanda: "ireland",
      portugal: "portugal",
      holanda: "netherlands",
      "paises bajos": "netherlands",
      belgica: "belgium",
      suiza: "switzerland",
      austria: "austria",
      dinamarca: "denmark",
      suecia: "sweden",
      noruega: "norway",
      finlandia: "finland",
      polonia: "poland",
      grecia: "greece",

      japon: "japan",
      china: "china",
      india: "india",
      corea: "south korea",
      "corea del sur": "south korea",
      "republic of korea": "south korea",
      "korea republic of": "south korea",
      "viet nam": "vietnam",
      rusia: "russia",
      "russian federation": "russia"
    };

    return aliases[normalized] ?? normalized;
  }

  function normalizeRegionName(value) {
    const normalized = String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/-/g, " ")
      .replace(/\s+/g, " ");

    const aliases = {
      europe: "Europe",
      europa: "Europe",
      "north america": "North America",
      norteamerica: "North America",
      "norte america": "North America",
      asia: "Asia"
    };

    return aliases[normalized] ?? String(value ?? "").trim();
  }

  function normalizeKey(value) {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  const COUNTRY_REGION_MAP = {
    canada: "North America",
    "united states": "North America",
    mexico: "North America",

    spain: "Europe",
    portugal: "Europe",
    france: "Europe",
    italy: "Europe",
    ireland: "Europe",
    germany: "Europe",
    "united kingdom": "Europe",
    netherlands: "Europe",
    belgium: "Europe",
    switzerland: "Europe",
    austria: "Europe",
    denmark: "Europe",
    sweden: "Europe",
    norway: "Europe",
    finland: "Europe",
    poland: "Europe",
    greece: "Europe",
    romania: "Europe",
    hungary: "Europe",
    czechia: "Europe",
    "czech republic": "Europe",
    slovakia: "Europe",
    slovenia: "Europe",
    croatia: "Europe",
    serbia: "Europe",
    bulgaria: "Europe",
    estonia: "Europe",
    latvia: "Europe",
    lithuania: "Europe",
    luxembourg: "Europe",
    malta: "Europe",
    cyprus: "Europe",
    iceland: "Europe",

    china: "Asia",
    japan: "Asia",
    "south korea": "Asia",
    india: "Asia",
    indonesia: "Asia",
    thailand: "Asia",
    vietnam: "Asia",
    malaysia: "Asia",
    singapore: "Asia",
    philippines: "Asia",
    pakistan: "Asia",
    bangladesh: "Asia",
    turkey: "Asia",
    israel: "Asia",
    "saudi arabia": "Asia",
    "united arab emirates": "Asia",
    qatar: "Asia",
    kuwait: "Asia",
    russia: "Asia"
  };

  function getRegionForMyCountry(country) {
    const countryKey = normalizeCountryName(country);
    return COUNTRY_REGION_MAP[countryKey] ?? null;
  }

  function normalizeStockMarketData(payload) {
    const rows = getArrayFromPayload(payload);

    return rows
      .map((row, index) => {
        const region = normalizeRegionName(
          pickText(
            row,
            ["region", "continent", "market_region", "market-region"],
            "Mercado global"
          )
        );

        const country = pickText(
          row,
          ["country", "country_name", "market_country", "market-country"],
          "Sin país"
        );

        const indexName = pickText(
          row,
          [
            "index",
            "index_name",
            "market_index",
            "market-index",
            "stock_index",
            "stock-index",
            "symbol",
            "ticker",
            "name"
          ],
          `Indicador ${index + 1}`
        );

        const mainValue = pickNumber(row, [
          "close",
          "closing_price",
          "close_price",
          "price",
          "last",
          "value",
          "index_value",
          "index-value",
          "volume",
          "daily_volume",
          "daily-volume"
        ]);

        if (mainValue === null) {
          return null;
        }

        return {
          region,
          country,
          indexName,
          indexKey: normalizeKey(indexName),
          value: Math.abs(mainValue),
          original: row
        };
      })
      .filter((row) => row !== null && row.region && row.country && row.indexName);
  }

  function normalizeRecreationData(payload) {
    const rows = getArrayFromPayload(payload);

    return rows
      .map((row) => {
        const country = pickText(
          row,
          ["country", "country_name", "country-name"],
          ""
        );

        const year = pickNumber(row, ["year"]);

        return {
          country,
          year,
          recreationValue: pickNumber(row, [
            "recreation_value",
            "recreation-value"
          ]),
          recreationShare: pickNumber(row, [
            "recreation_share",
            "recreation-share"
          ]),
          recreationPerCapita: pickNumber(row, [
            "recreation_per_capita",
            "recreation-per-capita"
          ]),
          population: pickNumber(row, ["population"]),
          original: row
        };
      })
      .filter((row) => row.country);
  }

  function getRecreationPerCapita(row) {
    if (row.recreationPerCapita !== null) {
      return row.recreationPerCapita;
    }

    if (
      row.recreationValue !== null &&
      row.population !== null &&
      row.population > 0
    ) {
      return row.recreationValue / row.population;
    }

    return null;
  }

  function getAverageStockValueByRegion(stockRows) {
    const indexValuesByRegion = new Map();

    stockRows.forEach((row) => {
      const region = normalizeRegionName(row.region);

      if (!["Europe", "North America", "Asia"].includes(region)) {
        return;
      }

      if (!indexValuesByRegion.has(region)) {
        indexValuesByRegion.set(region, new Map());
      }

      const indexMap = indexValuesByRegion.get(region);
      const indexKey = row.indexKey || normalizeKey(row.indexName);

      if (!indexMap.has(indexKey)) {
        indexMap.set(indexKey, {
          sum: 0,
          count: 0
        });
      }

      const accumulator = indexMap.get(indexKey);
      accumulator.sum += row.value;
      accumulator.count += 1;
    });

    const averageByRegion = new Map();

    indexValuesByRegion.forEach((indexMap, region) => {
      const indexAverages = [...indexMap.values()]
        .filter((item) => item.count > 0)
        .map((item) => item.sum / item.count);

      if (indexAverages.length === 0) {
        return;
      }

      const regionAverage =
        indexAverages.reduce((sum, value) => sum + value, 0) /
        indexAverages.length;

      averageByRegion.set(region, regionAverage);
    });

    return averageByRegion;
  }

  function joinStockRegionsWithRecreation(stockRows, recreationRows) {
    const averageStockValueByRegion = getAverageStockValueByRegion(stockRows);
    const recreationByCountry = new Map();

    recreationRows.forEach((row) => {
      const region = getRegionForMyCountry(row.country);

      if (!region) {
        return;
      }

      const stockRegionValue = averageStockValueByRegion.get(region);

      if (stockRegionValue === undefined) {
        return;
      }

      const recreationPerCapita = getRecreationPerCapita(row);

      if (recreationPerCapita === null) {
        return;
      }

      const countryKey = normalizeCountryName(row.country);

      if (!recreationByCountry.has(countryKey)) {
        recreationByCountry.set(countryKey, {
          region,
          country: row.country,
          stockRegionValue,
          recreationPerCapitaSum: 0,
          recreationPerCapitaCount: 0
        });
      }

      const accumulator = recreationByCountry.get(countryKey);
      accumulator.recreationPerCapitaSum += recreationPerCapita;
      accumulator.recreationPerCapitaCount += 1;
    });

    return [...recreationByCountry.values()]
      .filter((row) => row.recreationPerCapitaCount > 0)
      .map((row) => {
        const averageRecreationPerCapita =
          row.recreationPerCapitaSum / row.recreationPerCapitaCount;

        return {
          region: row.region,
          country: row.country,
          value: averageRecreationPerCapita,
          recreationValue: averageRecreationPerCapita,
          stockRegionValue: row.stockRegionValue,
          indexName: "Media de gasto per cápita",
          original: row
        };
      });
  }

  function buildSunburst(rows) {
    const limitedRows = rows.slice(0, 60);

    const ids = ["root"];
    const labels = ["Regiones"];
    const parents = [""];
    const values = [0];
    const customdata = [["Raíz", "", "", ""]];

    const regionValues = new Map();

    limitedRows.forEach((row) => {
      if (!regionValues.has(row.region)) {
        regionValues.set(row.region, row.stockRegionValue);
      }
    });

    regionValues.forEach((stockRegionValue, region) => {
      const regionId = `region-${normalizeKey(region)}`;

      ids.push(regionId);
      labels.push(region);
      parents.push("root");
      values.push(stockRegionValue);
      customdata.push([
        "Región",
        "",
        formatNumber(stockRegionValue),
        "Media de los índices bursátiles de G23"
      ]);

      values[0] += stockRegionValue;
    });

    limitedRows.forEach((row) => {
      const regionId = `region-${normalizeKey(row.region)}`;
      const countryId = `country-${normalizeKey(row.region)}-${normalizeKey(
        row.country
      )}`;

      ids.push(countryId);
      labels.push(row.country);
      parents.push(regionId);
      values.push(row.value);
      customdata.push([
        "País",
        formatNumber(row.recreationValue),
        formatNumber(row.stockRegionValue),
        "Media del gasto per cápita de mi API"
      ]);
    });

    return { ids, labels, parents, values, customdata };
  }

  async function renderStockMarketSunburst(
    rows,
    chartTitle = "Media de indicadores de mercado por región y gasto en ocio per cápita por país"
  ) {
    const { ids, labels, parents, values, customdata } = buildSunburst(rows);

    chartVisible = true;

    await tick();

    if (!chartContainer) {
      throw new Error("No se ha podido inicializar el contenedor de la gráfica.");
    }

    if (!Plotly) {
      throw new Error("No se ha podido cargar la librería de visualización.");
    }

    Plotly.purge(chartContainer);

    await Plotly.newPlot(
      chartContainer,
      [
        {
          type: "sunburst",
          ids,
          labels,
          parents,
          values,
          customdata,
          branchvalues: "remainder",
          maxdepth: 3,
          hovertemplate:
            "<b>%{label}</b><br>" +
            "Nivel: %{customdata[0]}<br>" +
            "%{customdata[3]}<br>" +
            "Valor mostrado: %{value:.2f}<br>" +
            "Dato mi API: %{customdata[1]}<br>" +
            "Media G23 región: %{customdata[2]}" +
            "<extra></extra>"
        }
      ],
      {
        title: {
          text: chartTitle,
          font: { size: 20 }
        },
        margin: { t: 70, l: 10, r: 10, b: 10 }
      },
      {
        responsive: true,
        displayModeBar: true
      }
    );
  }

  async function loadStockMarket() {
    loading = true;
    error = null;
    chartVisible = false;

    try {
      /*
        Primero intentamos leer los datos normales.

        Solo si alguna API devuelve 0 registros, llamamos a su loadInitialData.
        Así evitamos llamar siempre a loadInitialData y evitamos el 409 Conflict
        cuando la API ya tiene datos cargados.
      */
      const [stockPayload, recreationPayload] = await Promise.all([
        fetchCollectionWithAutoLoad(
          `${PROXY_BASE}/sos/stock-market`,
          `${PROXY_BASE}/sos/stock-market/loadInitialData`
        ),
        fetchCollectionWithAutoLoad(
          "/api/v2/recreation-culture-expenditure",
          "/api/v2/recreation-culture-expenditure/loadInitialData"
        )
      ]);

      const stockRows = normalizeStockMarketData(stockPayload);
      const recreationRows = normalizeRecreationData(recreationPayload);
      const joinedRows = joinStockRegionsWithRecreation(stockRows, recreationRows);

      if (joinedRows.length === 0) {
        throw new Error(
          "No hay países de mi API que se puedan asociar a las regiones Europe, North America o Asia del compañero usando también sus datos numéricos."
        );
      }

      loading = false;

      await renderStockMarketSunburst(joinedRows);
    } catch (err) {
      loading = false;
      chartVisible = false;
      error =
        err?.message ||
        "No se pudo cargar la integración cruzada entre G23 y recreation-culture-expenditure.";
    }
  }

  function resizeChart() {
    if (Plotly && chartContainer && chartVisible) {
      Plotly.Plots.resize(chartContainer);
    }
  }

  onMount(async () => {
    try {
      const plotlyModule = await import("plotly.js-dist-min");
      Plotly = plotlyModule.default ?? plotlyModule;

      window.addEventListener("resize", resizeChart);

      await loadStockMarket();
    } catch (err) {
      loading = false;
      chartVisible = false;
      error =
        err?.message ||
        "No se pudo cargar la visualización de la integración G23.";
    }
  });

  onDestroy(() => {
    if (!browser) {
      return;
    }

    window.removeEventListener("resize", resizeChart);

    if (Plotly && chartContainer) {
      Plotly.purge(chartContainer);
    }
  });
</script>

<svelte:head>
  <title>G23 | Integraciones | Recreation Culture Expenditure</title>
  <meta
    name="description"
    content="Integración G23 con daily-global-stock-market-indicators y recreation-culture-expenditure"
  />
</svelte:head>

{#if loading}
  <p class="status">Cargando datos de la integración...</p>
{:else if error}
  <div class="error-box">
    {error}
  </div>
{:else}
  <article class="chart-card">
    <div class="chart-header">
      <h2>G23 - Indicadores diarios del mercado de valores</h2>
      <p>
        La visualización integra información procedente de dos APIs REST. Los países de
        la API de gasto en ocio y cultura se asocian con las regiones Europe, North America
        y Asia proporcionadas por la API de indicadores diarios del mercado de valores. Para
        cada región se representa un valor agregado de índices bursátiles, calculado como la
        media de las medias de cada índice regional. Paralelamente, para cada país se muestra
        la media de su gasto per cápita en ocio y cultura.
      </p>
    </div>

    {#if chartVisible}
      <div bind:this={chartContainer} class="chart-container"></div>
    {/if}
  </article>
{/if}