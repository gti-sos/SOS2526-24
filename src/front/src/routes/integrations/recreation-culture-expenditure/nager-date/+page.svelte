<script>
  import { onMount, onDestroy, tick } from "svelte";

  const MY_API_BASE = "/api/v2/recreation-culture-expenditure";
  const PROXY_BASE = "/api/v2/recreation-culture-expenditure/proxy";

  let loading = $state(false);
  let error = $state(null);
  let chartVisible = $state(false);

  let chartContainer;
  let vegaView = null;

  let integratedRows = $state([]);
  let skippedRows = $state([]);
  let summary = $state({
    totalMyApiRows: 0,
    compatibleRows: 0,
    integratedRows: 0,
    skippedRows: 0,
    nagerRequests: 0
  });

  async function fetchJson(url) {
    const response = await fetch(url);

    if (!response.ok) {
      let message = `La petición ha fallado con estado ${response.status}`;

      try {
        const body = await response.json();
        if (body?.error) {
          message = body.error;
        }
      } catch (_) {
        // Si la respuesta de error no es JSON, dejamos el mensaje genérico.
      }

      throw new Error(message);
    }

    return await response.json();
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

  function pickText(object, candidateFields, fallback = "") {
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

      uk: "united kingdom",
      "reino unido": "united kingdom",
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

  const COUNTRY_CODE_MAP = {
    spain: "ES",
    portugal: "PT",
    france: "FR",
    italy: "IT",
    ireland: "IE",
    germany: "DE",
    "united kingdom": "GB",
    netherlands: "NL",
    belgium: "BE",
    switzerland: "CH",
    austria: "AT",
    denmark: "DK",
    sweden: "SE",
    norway: "NO",
    finland: "FI",
    poland: "PL",
    greece: "GR",
    romania: "RO",
    hungary: "HU",
    czechia: "CZ",
    "czech republic": "CZ",
    slovakia: "SK",
    slovenia: "SI",
    croatia: "HR",
    serbia: "RS",
    bulgaria: "BG",
    estonia: "EE",
    latvia: "LV",
    lithuania: "LT",
    luxembourg: "LU",
    malta: "MT",
    cyprus: "CY",
    iceland: "IS",

    canada: "CA",
    "united states": "US",
    mexico: "MX",

    china: "CN",
    japan: "JP",
    "south korea": "KR",
    india: "IN",
    indonesia: "ID",
    thailand: "TH",
    vietnam: "VN",
    malaysia: "MY",
    singapore: "SG",
    philippines: "PH",
    pakistan: "PK",
    bangladesh: "BD",
    turkey: "TR",
    israel: "IL",
    "saudi arabia": "SA",
    "united arab emirates": "AE",
    qatar: "QA",
    kuwait: "KW",
    russia: "RU",

    australia: "AU",
    "new zealand": "NZ",
    brazil: "BR",
    argentina: "AR",
    chile: "CL",
    colombia: "CO",
    peru: "PE",
    uruguay: "UY",
    "south africa": "ZA"
  };

  function getCountryCode(country) {
    const countryKey = normalizeCountryName(country);
    return COUNTRY_CODE_MAP[countryKey] ?? null;
  }

  function normalizeRecreationData(payload) {
    const rows = getArrayFromPayload(payload);

    return rows.map((row, index) => {
      const country = pickText(
        row,
        ["country", "country_name", "country-name"],
        ""
      );

      const year = pickNumber(row, ["year"]);

      const recreationValue = pickNumber(row, [
        "recreation_value",
        "recreation-value"
      ]);

      const recreationShare = pickNumber(row, [
        "recreation_share",
        "recreation-share"
      ]);

      const recreationPerCapita = pickNumber(row, [
        "recreation_per_capita",
        "recreation-per-capita"
      ]);

      const population = pickNumber(row, ["population"]);

      return {
        sourceIndex: index,
        country,
        year,
        countryCode: getCountryCode(country),
        recreationValue,
        recreationShare,
        recreationPerCapita,
        population,
        original: row
      };
    });
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

  function getValidRowsForNager(recreationRows) {
    return recreationRows.filter((row) => {
      const recreationPerCapita = getRecreationPerCapita(row);

      return (
        row.country &&
        Number.isInteger(row.year) &&
        row.countryCode &&
        recreationPerCapita !== null
      );
    });
  }

  function getSkippedRows(recreationRows) {
    return recreationRows
      .filter((row) => {
        const recreationPerCapita = getRecreationPerCapita(row);

        return !(
          row.country &&
          Number.isInteger(row.year) &&
          row.countryCode &&
          recreationPerCapita !== null
        );
      })
      .map((row) => {
        const reasons = [];

        if (!row.country) {
          reasons.push("No tiene país");
        }

        if (!Number.isInteger(row.year)) {
          reasons.push("No tiene año válido");
        }

        if (row.country && !row.countryCode) {
          reasons.push("No hay código ISO alpha-2 configurado para Nager.Date");
        }

        if (getRecreationPerCapita(row) === null) {
          reasons.push("No tiene gasto per cápita ni datos suficientes para calcularlo");
        }

        return {
          country: row.country || "Sin país",
          year: row.year ?? "Sin año",
          reason: reasons.join("; ")
        };
      });
  }

  function getUniqueCountryYearPairs(rows) {
    const pairs = new Map();

    rows.forEach((row) => {
      const key = `${row.countryCode}-${row.year}`;

      if (!pairs.has(key)) {
        pairs.set(key, {
          country: row.country,
          countryCode: row.countryCode,
          year: row.year
        });
      }
    });

    return [...pairs.values()];
  }

  async function fetchHolidaysForCountryYear(pair) {
    const url =
      `${PROXY_BASE}/external/nager/public-holidays` +
      `?year=${encodeURIComponent(pair.year)}` +
      `&countryCode=${encodeURIComponent(pair.countryCode)}`;

    const holidays = await fetchJson(url);

    const holidayRows = Array.isArray(holidays) ? holidays : [];

    const publicHolidays = holidayRows.filter((holiday) => {
      if (!Array.isArray(holiday.types)) {
        return true;
      }

      return holiday.types.includes("Public");
    });

    const nationalHolidays = holidayRows.filter(
      (holiday) => holiday.global === true
    );

    return {
      countryCode: pair.countryCode,
      year: pair.year,
      holidayCount: holidayRows.length,
      publicHolidayCount: publicHolidays.length,
      nationalHolidayCount: nationalHolidays.length,
      firstHolidayName:
        holidayRows[0]?.localName || holidayRows[0]?.name || "Sin festivos"
    };
  }

  async function fetchNagerStatsByPair(pairs) {
    const entries = await Promise.allSettled(
      pairs.map(async (pair) => {
        const stats = await fetchHolidaysForCountryYear(pair);
        return [`${pair.countryCode}-${pair.year}`, stats];
      })
    );

    const statsByPair = new Map();

    entries.forEach((entry) => {
      if (entry.status === "fulfilled") {
        const [key, stats] = entry.value;
        statsByPair.set(key, stats);
      }
    });

    return statsByPair;
  }

  function buildIntegratedRows(validRows, statsByPair) {
    const groupedRows = new Map();

    validRows.forEach((row) => {
      const key = `${row.countryCode}-${row.year}`;
      const nagerStats = statsByPair.get(key);

      if (!nagerStats) {
        return;
      }

      const recreationPerCapita = getRecreationPerCapita(row);

      if (recreationPerCapita === null) {
        return;
      }

      const groupKey = `${normalizeCountryName(row.country)}-${row.year}`;

      if (!groupedRows.has(groupKey)) {
        groupedRows.set(groupKey, {
          country: row.country,
          countryCode: row.countryCode,
          year: row.year,
          recreationPerCapitaSum: 0,
          recreationPerCapitaCount: 0,
          recreationValueSum: 0,
          recreationValueCount: 0,
          recreationShareSum: 0,
          recreationShareCount: 0,
          publicHolidayCount: nagerStats.publicHolidayCount,
          nationalHolidayCount: nagerStats.nationalHolidayCount,
          holidayCount: nagerStats.holidayCount,
          firstHolidayName: nagerStats.firstHolidayName,
          sourceRows: 0
        });
      }

      const accumulator = groupedRows.get(groupKey);

      accumulator.recreationPerCapitaSum += recreationPerCapita;
      accumulator.recreationPerCapitaCount += 1;
      accumulator.sourceRows += 1;

      if (row.recreationValue !== null) {
        accumulator.recreationValueSum += row.recreationValue;
        accumulator.recreationValueCount += 1;
      }

      if (row.recreationShare !== null) {
        accumulator.recreationShareSum += row.recreationShare;
        accumulator.recreationShareCount += 1;
      }
    });

    return [...groupedRows.values()]
      .filter((row) => row.recreationPerCapitaCount > 0)
      .map((row) => ({
        country: row.country,
        countryCode: row.countryCode,
        year: row.year,
        recreationPerCapita:
          row.recreationPerCapitaSum / row.recreationPerCapitaCount,
        recreationValue:
          row.recreationValueCount > 0
            ? row.recreationValueSum / row.recreationValueCount
            : null,
        recreationShare:
          row.recreationShareCount > 0
            ? row.recreationShareSum / row.recreationShareCount
            : null,
        publicHolidayCount: row.publicHolidayCount,
        nationalHolidayCount: row.nationalHolidayCount,
        holidayCount: row.holidayCount,
        firstHolidayName: row.firstHolidayName,
        sourceRows: row.sourceRows
      }))
      .sort((a, b) => {
        if (a.country !== b.country) {
          return a.country.localeCompare(b.country);
        }

        return a.year - b.year;
      });
  }

  async function renderHeatmap(rows) {
    chartVisible = true;

    await tick();

    if (!chartContainer) {
      throw new Error("No se ha podido inicializar el contenedor de la gráfica.");
    }

    const { default: embed } = await import("vega-embed");

    if (vegaView) {
      vegaView.finalize();
      vegaView = null;
    }

    chartContainer.innerHTML = "";

    const countries = [...new Set(rows.map((row) => row.country))];
    const chartHeight = Math.max(440, countries.length * 38);

    const spec = {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      title:
        "Relación entre festivos públicos y gasto cultural per cápita",
      width: "container",
      height: chartHeight,
      autosize: {
        type: "fit",
        contains: "padding"
      },
      data: {
        values: rows
      },
      mark: {
        type: "rect",
        cornerRadius: 3,
        tooltip: true
      },
      encoding: {
        x: {
          field: "year",
          type: "ordinal",
          title: "Año",
          axis: {
            labelAngle: 0,
            labelColor: "#142337",
            titleColor: "#142337",
            grid: false
          }
        },
        y: {
          field: "country",
          type: "nominal",
          title: "País",
          sort: "ascending",
          axis: {
            labelColor: "#142337",
            titleColor: "#142337",
            grid: false
          }
        },
        color: {
          field: "recreationPerCapita",
          type: "quantitative",
          title: "Gasto per cápita",
          scale: {
            scheme: "greens"
          },
          legend: {
            titleColor: "#142337",
            labelColor: "#142337"
          }
        },
        tooltip: [
          {
            field: "country",
            type: "nominal",
            title: "País"
          },
          {
            field: "countryCode",
            type: "nominal",
            title: "Código Nager.Date"
          },
          {
            field: "year",
            type: "ordinal",
            title: "Año"
          },
          {
            field: "publicHolidayCount",
            type: "quantitative",
            title: "Festivos públicos"
          },
          {
            field: "nationalHolidayCount",
            type: "quantitative",
            title: "Festivos nacionales"
          },
          {
            field: "holidayCount",
            type: "quantitative",
            title: "Festivos totales devueltos"
          },
          {
            field: "recreationPerCapita",
            type: "quantitative",
            title: "Gasto per cápita",
            format: ".2f"
          },
          {
            field: "recreationValue",
            type: "quantitative",
            title: "Gasto total",
            format: ".2f"
          },
          {
            field: "recreationShare",
            type: "quantitative",
            title: "Porcentaje ocio/cultura",
            format: ".2f"
          },
          {
            field: "firstHolidayName",
            type: "nominal",
            title: "Primer festivo"
          },
          {
            field: "sourceRows",
            type: "quantitative",
            title: "Registros de mi API agregados"
          }
        ]
      },
      config: {
        background: "transparent",
        axis: {
          labelFontSize: 12,
          titleFontSize: 13,
          domain: false,
          tickColor: "#d8e0dc"
        },
        title: {
          fontSize: 20,
          fontWeight: 500,
          anchor: "middle",
          color: "#142337",
          dy: -8
        },
        view: {
          stroke: "transparent"
        }
      }
    };

    const result = await embed(chartContainer, spec, {
      actions: true,
      renderer: "svg"
    });

    vegaView = result.view;
  }

  async function loadNagerIntegration() {
    loading = true;
    error = null;
    chartVisible = false;
    integratedRows = [];
    skippedRows = [];

    try {
      const recreationPayload = await fetchJson(MY_API_BASE);
      const recreationRows = normalizeRecreationData(recreationPayload);

      const validRows = getValidRowsForNager(recreationRows);
      const baseSkippedRows = getSkippedRows(recreationRows);
      const pairs = getUniqueCountryYearPairs(validRows);

      const statsByPair = await fetchNagerStatsByPair(pairs);
      const rows = buildIntegratedRows(validRows, statsByPair);

      const unavailablePairs = pairs
        .filter((pair) => !statsByPair.has(`${pair.countryCode}-${pair.year}`))
        .map((pair) => ({
          country: pair.country,
          year: pair.year,
          reason:
            "Nager.Date no devolvió datos para ese país y año a través del proxy"
        }));

      skippedRows = [...baseSkippedRows, ...unavailablePairs];

      if (rows.length === 0) {
        throw new Error(
          "No hay registros de mi API que puedan cruzarse con Nager.Date. Revisa país, año, código ISO y gasto per cápita."
        );
      }

      integratedRows = rows;

      summary = {
        totalMyApiRows: recreationRows.length,
        compatibleRows: validRows.length,
        integratedRows: rows.length,
        skippedRows: skippedRows.length,
        nagerRequests: pairs.length
      };

      loading = false;

      await renderHeatmap(rows);
    } catch (err) {
      loading = false;
      chartVisible = false;
      error =
        err?.message ||
        "No se pudo cargar la integración entre Nager.Date y mi API.";
    }
  }

  onMount(async () => {
    await loadNagerIntegration();
  });

  onDestroy(() => {
    if (vegaView) {
      vegaView.finalize();
      vegaView = null;
    }
  });
</script>

<svelte:head>
  <title>Nager.Date | Integraciones | Recreation Culture Expenditure</title>
  <meta
    name="description"
    content="Integración de Nager.Date con recreation-culture-expenditure usando Vega-Lite"
  />
</svelte:head>

<section class="integrations-page">
  {#if loading}
    <article class="chart-card">
      <p class="status">Cargando datos de la integración...</p>
    </article>
  {:else if error}
    <article class="chart-card">
      <div class="error-box">
        {error}
      </div>
    </article>
  {:else}
    <article class="chart-card">
      <div class="chart-header">
        <h2>Integración de gasto en ocio y cultura con Nager.Date</h2>

        <p>
          Esta visualización combina datos de la API de gasto per cápita en ocio 
          y cultura con información externa procedente de la API Nager.Date. La 
          gráfica organiza los datos por país y año, de forma que cada celda 
          representa una combinación concreta de ambos valores. La intensidad del 
          color refleja el gasto per cápita en ocio y cultura, y la información 
          emergente muestra los días festivos públicos y nacionales asociados, 
          junto con los datos económicos integrados.
        </p>
      </div>

      {#if chartVisible}
        <div bind:this={chartContainer} class="chart-container"></div>
      {/if}
    </article>
  {/if}
</section>

<style>
  .integrations-page {
    max-width: 1116px;
    margin: 0 auto;
    padding: 16px 0 48px;
  }

  .chart-card {
    width: 100%;
    background: #ffffff;
    border-radius: 12px;
    padding: 26px 24px 28px;
    margin-bottom: 28px;
    box-shadow: 0 18px 34px rgba(28, 48, 43, 0.16);
    box-sizing: border-box;
  }

  .chart-header {
    margin-bottom: 20px;
  }

  .chart-header h2 {
    margin: 0 0 8px;
    color: #142337;
    font-size: 24px;
    line-height: 1.25;
    font-weight: 800;
    letter-spacing: 0.01em;
  }

  .chart-header p {
    margin: 0;
    color: #142337;
    font-size: 16px;
    line-height: 1.35;
    max-width: 1030px;
  }

  .chart-container {
    width: 100%;
    min-height: 560px;
    margin-top: 16px;
  }

  .status {
    margin: 0;
    padding: 10px 0;
    color: #142337;
    font-size: 16px;
  }

  .error-box {
    padding: 16px;
    border-radius: 8px;
    background: #ffe5e5;
    color: #8a1f1f;
    font-weight: 600;
  }

  :global(.vega-actions) {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 8px;
    font-size: 12px;
  }

  :global(.vega-actions a) {
    color: #5e8e42;
    text-decoration: none;
    font-weight: 700;
  }

  :global(.vega-actions a:hover) {
    text-decoration: underline;
  }

  @media (max-width: 1200px) {
    .integrations-page {
      max-width: calc(100% - 96px);
    }
  }

  @media (max-width: 800px) {
    .integrations-page {
      max-width: calc(100% - 32px);
      padding-top: 16px;
    }

    .chart-card {
      padding: 22px 18px;
    }

    .chart-header h2 {
      font-size: 21px;
    }

    .chart-header p {
      font-size: 15px;
    }
  }
</style>