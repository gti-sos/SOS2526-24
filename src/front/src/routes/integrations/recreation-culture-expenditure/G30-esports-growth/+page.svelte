<script>
  import { onMount, onDestroy, tick } from "svelte";

  const PROXY_BASE = "/api/v2/recreation-culture-expenditure/proxy";

  const MY_API_URL = "/api/v2/recreation-culture-expenditure";
  const G30_ESPORTS_PROXY_URL = `${PROXY_BASE}/sos/esports-growth`;

  let Plotly = null;

  let loading = $state(false);
  let error = $state(null);
  let chartVisible = $state(false);

  let chartContainer;

  let title = $state("G30 - eSports Growth Stats");
  let description = $state("");
  let relationMode = $state("");

  async function loadPlotly() {
    if (Plotly) {
      return Plotly;
    }

    const module = await import("plotly.js-dist-min");
    Plotly = module.default || module;

    return Plotly;
  }

  async function fetchJson(url) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`La petición a ${url} ha fallado con estado ${response.status}`);
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

    return number.toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
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

      espana: "spain",
      "españa": "spain",

      japon: "japan",
      "japón": "japan",

      corea: "south korea",
      "corea del sur": "south korea",
      "republic of korea": "south korea",
      "korea republic of": "south korea",

      china: "china"
    };

    return aliases[normalized] ?? normalized;
  }

  function displayCountry(value) {
    const normalized = normalizeCountryName(value);

    const displayNames = {
      spain: "Spain",
      japan: "Japan",
      china: "China",
      "south korea": "South Korea",
      "united states": "United States"
    };

    return displayNames[normalized] ?? String(value ?? "").trim();
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
          countryKey: normalizeCountryName(country),
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
      .filter((row) => row.country && row.countryKey);
  }

  function normalizeEsportsGrowthData(payload) {
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
          countryKey: normalizeCountryName(country),
          year,
          activePlayerNo: pickNumber(row, [
            "active_player_no",
            "active-player-no",
            "active_players",
            "active-players"
          ]),
          viewership: pickNumber(row, ["viewership"]),
          topGenre: pickText(row, ["top_genre", "top-genre"], "No disponible"),
          topPlatform: pickText(
            row,
            ["top_platform", "top-platform"],
            "No disponible"
          ),
          tournamentNo: pickNumber(row, [
            "tournament_no",
            "tournament-no",
            "tournaments"
          ]),
          proPlayerNo: pickNumber(row, [
            "pro_player_no",
            "pro-player-no",
            "pro_players",
            "pro-players"
          ]),
          internetPenetration: pickNumber(row, [
            "internet_penetration",
            "internet-penetration"
          ]),
          companyNo: pickNumber(row, ["company_no", "company-no"]),
          original: row
        };
      })
      .filter((row) => row.country && row.countryKey);
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

  function average(values) {
    const validValues = values.filter((value) => Number.isFinite(value));

    if (validValues.length === 0) {
      return null;
    }

    return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
  }

  function mostFrequent(values) {
    const cleanValues = values.filter(
      (value) => value !== undefined && value !== null && String(value).trim() !== ""
    );

    if (cleanValues.length === 0) {
      return "No disponible";
    }

    const counts = new Map();

    cleanValues.forEach((value) => {
      counts.set(value, (counts.get(value) || 0) + 1);
    });

    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }

  function groupRecreationByCountry(recreationRows) {
    const groups = new Map();

    recreationRows.forEach((row) => {
      const recreationPerCapita = getRecreationPerCapita(row);

      if (recreationPerCapita === null) {
        return;
      }

      if (!groups.has(row.countryKey)) {
        groups.set(row.countryKey, {
          country: displayCountry(row.country),
          recreationPerCapitaValues: [],
          recreationShareValues: [],
          recreationValueValues: [],
          years: []
        });
      }

      const accumulator = groups.get(row.countryKey);

      accumulator.recreationPerCapitaValues.push(recreationPerCapita);

      if (row.recreationShare !== null) {
        accumulator.recreationShareValues.push(row.recreationShare);
      }

      if (row.recreationValue !== null) {
        accumulator.recreationValueValues.push(row.recreationValue);
      }

      if (row.year !== null) {
        accumulator.years.push(row.year);
      }
    });

    const result = new Map();

    groups.forEach((group, countryKey) => {
      result.set(countryKey, {
        country: group.country,
        recreationPerCapita: average(group.recreationPerCapitaValues),
        recreationShare: average(group.recreationShareValues),
        recreationValue: average(group.recreationValueValues),
        yearLabel: group.years.length > 0 ? "Media" : "Sin año"
      });
    });

    return result;
  }

  function groupEsportsByCountry(esportsRows) {
    const groups = new Map();

    esportsRows.forEach((row) => {
      if (row.viewership === null) {
        return;
      }

      if (!groups.has(row.countryKey)) {
        groups.set(row.countryKey, {
          country: displayCountry(row.country),
          viewershipValues: [],
          activePlayerValues: [],
          internetPenetrationValues: [],
          tournamentValues: [],
          companyValues: [],
          genres: [],
          platforms: [],
          years: []
        });
      }

      const accumulator = groups.get(row.countryKey);

      accumulator.viewershipValues.push(row.viewership);

      if (row.activePlayerNo !== null) {
        accumulator.activePlayerValues.push(row.activePlayerNo);
      }

      if (row.internetPenetration !== null) {
        accumulator.internetPenetrationValues.push(row.internetPenetration);
      }

      if (row.tournamentNo !== null) {
        accumulator.tournamentValues.push(row.tournamentNo);
      }

      if (row.companyNo !== null) {
        accumulator.companyValues.push(row.companyNo);
      }

      accumulator.genres.push(row.topGenre);
      accumulator.platforms.push(row.topPlatform);

      if (row.year !== null) {
        accumulator.years.push(row.year);
      }
    });

    const result = new Map();

    groups.forEach((group, countryKey) => {
      result.set(countryKey, {
        country: group.country,
        viewership: average(group.viewershipValues),
        activePlayerNo: average(group.activePlayerValues),
        internetPenetration: average(group.internetPenetrationValues),
        tournamentNo: average(group.tournamentValues),
        companyNo: average(group.companyValues),
        topGenre: mostFrequent(group.genres),
        topPlatform: mostFrequent(group.platforms),
        yearLabel: group.years.length > 0 ? "Media" : "Sin año"
      });
    });

    return result;
  }

  function joinByCountryAndYear(recreationRows, esportsRows) {
    const esportsByCountryYear = new Map();

    esportsRows.forEach((row) => {
      if (!row.countryKey || row.year === null) {
        return;
      }

      const key = `${row.countryKey}-${row.year}`;

      if (!esportsByCountryYear.has(key)) {
        esportsByCountryYear.set(key, []);
      }

      esportsByCountryYear.get(key).push(row);
    });

    const joinedRows = [];

    recreationRows.forEach((recreationRow) => {
      if (!recreationRow.countryKey || recreationRow.year === null) {
        return;
      }

      const recreationPerCapita = getRecreationPerCapita(recreationRow);

      if (recreationPerCapita === null) {
        return;
      }

      const key = `${recreationRow.countryKey}-${recreationRow.year}`;
      const esportsMatches = esportsByCountryYear.get(key) || [];

      esportsMatches.forEach((esportsRow) => {
        if (esportsRow.viewership === null) {
          return;
        }

        joinedRows.push({
          relationType: "exact",
          country: displayCountry(recreationRow.country),
          year: recreationRow.year,
          label: `${displayCountry(recreationRow.country)} ${recreationRow.year}`,
          recreationPerCapita,
          recreationShare: recreationRow.recreationShare,
          recreationValue: recreationRow.recreationValue,
          viewership: esportsRow.viewership,
          activePlayerNo: esportsRow.activePlayerNo,
          internetPenetration: esportsRow.internetPenetration,
          tournamentNo: esportsRow.tournamentNo,
          companyNo: esportsRow.companyNo,
          topGenre: esportsRow.topGenre,
          topPlatform: esportsRow.topPlatform
        });
      });
    });

    return joinedRows;
  }

  function joinByCountryAverage(recreationRows, esportsRows) {
    const recreationByCountry = groupRecreationByCountry(recreationRows);
    const esportsByCountry = groupEsportsByCountry(esportsRows);

    const joinedRows = [];

    recreationByCountry.forEach((recreationRow, countryKey) => {
      const esportsRow = esportsByCountry.get(countryKey);

      if (!esportsRow) {
        return;
      }

      if (
        recreationRow.recreationPerCapita === null ||
        esportsRow.viewership === null
      ) {
        return;
      }

      joinedRows.push({
        relationType: "average",
        country: recreationRow.country,
        year: "Media",
        label: recreationRow.country,
        recreationPerCapita: recreationRow.recreationPerCapita,
        recreationShare: recreationRow.recreationShare,
        recreationValue: recreationRow.recreationValue,
        viewership: esportsRow.viewership,
        activePlayerNo: esportsRow.activePlayerNo,
        internetPenetration: esportsRow.internetPenetration,
        tournamentNo: esportsRow.tournamentNo,
        companyNo: esportsRow.companyNo,
        topGenre: esportsRow.topGenre,
        topPlatform: esportsRow.topPlatform
      });
    });

    return joinedRows;
  }

  function buildBarChartData(rows) {
    const limitedRows = rows.slice(0, 12);

    const labels = limitedRows.map((row) => row.label);

    const recreationValues = limitedRows.map((row) => row.recreationPerCapita);
    const viewershipValues = limitedRows.map((row) => row.viewership);

    return {
      limitedRows,
      traces: [
        {
          type: "bar",
          name: "Gasto ocio/cultura per cápita",
          x: labels,
          y: recreationValues,
          yaxis: "y",
          offsetgroup: "gasto",
          customdata: limitedRows.map((row) => [
            formatNumber(row.recreationPerCapita),
            row.country,
            row.year
          ]),
          hovertemplate:
            "<b>%{x}</b><br>" +
            "Gasto ocio/cultura per cápita: %{customdata[0]}<br>" +
            "País: %{customdata[1]}<br>" +
            "Año: %{customdata[2]}" +
            "<extra></extra>"
        },
        {
          type: "bar",
          name: "Audiencia de eSports",
          x: labels,
          y: viewershipValues,
          yaxis: "y2",
          offsetgroup: "audiencia",
          customdata: limitedRows.map((row) => [
            formatNumber(row.viewership),
            row.topGenre,
            row.topPlatform
          ]),
          hovertemplate:
            "<b>%{x}</b><br>" +
            "Audiencia de eSports: %{customdata[0]}<br>" +
            "Género principal: %{customdata[1]}<br>" +
            "Plataforma principal: %{customdata[2]}" +
            "<extra></extra>"
        }
      ]
    };
  }

  async function renderEsportsBarChart(
    rows,
    chartTitle = "Relación entre gasto en ocio/cultura y audiencia de eSports"
  ) {
    const { traces } = buildBarChartData(rows);

    chartVisible = true;

    await tick();

    if (!chartContainer) {
      throw new Error("No se ha podido inicializar el contenedor de la gráfica.");
    }

    const plotly = await loadPlotly();

    plotly.purge(chartContainer);

    await plotly.newPlot(
      chartContainer,
      traces,
      {
        title: {
          text: chartTitle,
          font: { size: 20 }
        },
        barmode: "group",
        xaxis: {
          title: {
            text: relationMode === "exact" ? "País y año" : "País"
          },
          tickangle: -30,
          automargin: true
        },
        yaxis: {
          title: {
            text: "Gasto en ocio y cultura per cápita"
          },
          rangemode: "tozero"
        },
        yaxis2: {
          title: {
            text: "Audiencia de eSports"
          },
          overlaying: "y",
          side: "right",
          rangemode: "tozero"
        },
        legend: {
          orientation: "h",
          x: 0,
          y: -0.25
        },
        margin: {
          t: 80,
          l: 80,
          r: 90,
          b: 110
        }
      },
      {
        responsive: true,
        displayModeBar: true
      }
    );
  }

  async function loadEsportsGrowth() {
    loading = true;
    error = null;
    chartVisible = false;
    relationMode = "";
    description = "";

    try {
      const [esportsPayload, recreationPayload] = await Promise.all([
        fetchJson(G30_ESPORTS_PROXY_URL),
        fetchJson(MY_API_URL)
      ]);

      const esportsRows = normalizeEsportsGrowthData(esportsPayload);
      const recreationRows = normalizeRecreationData(recreationPayload);

      if (esportsRows.length === 0) {
        throw new Error(
          "La API del grupo 30 no ha devuelto datos válidos de esportsgrowth-stats."
        );
      }

      if (recreationRows.length === 0) {
        throw new Error(
          "Mi API recreation-culture-expenditure no ha devuelto datos válidos."
        );
      }

      let joinedRows = joinByCountryAndYear(recreationRows, esportsRows);

      if (joinedRows.length > 0) {
        relationMode = "exact";
        description =
          "Visualización que cruza mi API con la API esportsgrowth-stats del grupo 30 usando país y año como clave común. Cada grupo de barras compara el gasto per cápita en ocio/cultura con la audiencia de eSports para el mismo país y año.";
      } else {
        joinedRows = joinByCountryAverage(recreationRows, esportsRows);
        relationMode = "average";
        description =
          "No había coincidencias exactas por país y año, así que la integración compara ambos datasets por país usando medias. La gráfica relaciona el gasto medio per cápita en ocio/cultura con la audiencia media de eSports por país. La comparación es descriptiva y no implica causalidad.";
      }

      if (joinedRows.length === 0) {
        throw new Error(
          "No se han encontrado países comunes entre mi API y la API esportsgrowth-stats del grupo 30. Revisa que los nombres de países coincidan, por ejemplo Spain, Japan, China, South Korea o United States."
        );
      }

      joinedRows = joinedRows.sort((a, b) => {
        const countryComparison = a.country.localeCompare(b.country);

        if (countryComparison !== 0) {
          return countryComparison;
        }

        return Number(a.year || 0) - Number(b.year || 0);
      });

      loading = false;

      await renderEsportsBarChart(joinedRows);
    } catch (err) {
      loading = false;
      chartVisible = false;
      error =
        err?.message ||
        "No se pudo cargar la integración cruzada entre G30 y recreation-culture-expenditure.";
    }
  }

  function resizeChart() {
    if (chartContainer && chartVisible && Plotly) {
      Plotly.Plots.resize(chartContainer);
    }
  }

  onMount(async () => {
    window.addEventListener("resize", resizeChart);
    await loadEsportsGrowth();
  });

  onDestroy(() => {
    window.removeEventListener("resize", resizeChart);

    if (chartContainer && Plotly) {
      Plotly.purge(chartContainer);
    }
  });
</script>

<svelte:head>
  <title>G30 | Integraciones | Recreation Culture Expenditure</title>
  <meta
    name="description"
    content="Integración G30 con esportsgrowth-stats y recreation-culture-expenditure"
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
      <h2>{title}</h2>
      <p>
        {description}
      </p>
    </div>

    {#if chartVisible}
      <div bind:this={chartContainer} class="chart-container"></div>
    {/if}
  </article>
{/if}

<style>
  .status {
    padding: 1rem;
    border-radius: 0.75rem;
    background: #f3f4f6;
    color: #374151;
    font-weight: 600;
  }

  .error-box {
    padding: 1rem;
    border-radius: 0.75rem;
    background: #fee2e2;
    color: #991b1b;
    font-weight: 600;
  }

  .chart-card {
    padding: 1.5rem;
    border-radius: 1rem;
    background: white;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  }

  .chart-header {
    margin-bottom: 1rem;
  }

  .chart-header h2 {
    margin: 0 0 0.75rem;
    color: #111827;
    font-size: 1.6rem;
  }

  .chart-header p {
    margin: 0 0 0.75rem;
    color: #4b5563;
    line-height: 1.6;
  }

  .chart-container {
    width: 100%;
    min-height: 520px;
  }

  @media (max-width: 768px) {
    .chart-card {
      padding: 1rem;
    }

    .chart-container {
      min-height: 420px;
    }
  }
</style>