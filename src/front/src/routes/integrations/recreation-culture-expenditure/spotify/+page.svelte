<script>
    import { onMount } from "svelte";
    import vegaEmbed from "vega-embed";

    const LOCAL_API = "/api/v2/recreation-culture-expenditure";

    const SPOTIFY_COUNTRY_PROXY =
        "/api/v2/recreation-culture-expenditure/proxy/external/spotify/country-tracks";

    let integratedData = [];
    let loading = false;
    let chartReady = false;
    let errorMessage = "";
    let successMessage = "";

    let chartContainer;
    let vegaView;

    const countries = [
        { code: "ES", name: "España", apiCountry: "Spain" },
        { code: "CA", name: "Canadá", apiCountry: "Canada" },
        { code: "DE", name: "Alemania", apiCountry: "Germany" },
        { code: "IT", name: "Italia", apiCountry: "Italy" },
        { code: "GB", name: "Reino Unido", apiCountry: "United Kingdom" },
        { code: "US", name: "Estados Unidos", apiCountry: "United States" }
    ];

    function average(values) {
        const validValues = values.filter((value) => Number.isFinite(value));

        if (validValues.length === 0) {
            return 0;
        }

        return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
    }

    function normalizeByKey(rows, key, value) {
        const values = rows
            .map((row) => Number(row[key]))
            .filter((item) => Number.isFinite(item));

        const min = Math.min(...values);
        const max = Math.max(...values);

        if (!Number.isFinite(min) || !Number.isFinite(max) || max === min) {
            return 50;
        }

        return ((Number(value) - min) / (max - min)) * 100;
    }

    function getLatestRecordByCountry(localData, apiCountry) {
        return localData
            .filter((item) => item.country === apiCountry)
            .sort((a, b) => Number(b.year) - Number(a.year))[0];
    }

    function summarizeSpotifyTracks(tracks) {
        return {
            spotify_track_count: tracks.length,
            spotify_avg_duration_seconds: Number(
                average(tracks.map((track) => Number(track.duration_ms) / 1000)).toFixed(2)
            ),
            spotify_explicit_tracks: tracks.filter((track) => track.explicit).length
        };
    }

    function buildIndexedRows(rows) {
        return rows.map((row) => {
            const recreationPerCapitaIndex = normalizeByKey(
                rows,
                "recreation_per_capita",
                row.recreation_per_capita
            );

            const recreationShareIndex = normalizeByKey(
                rows,
                "recreation_share",
                row.recreation_share
            );

            const spotifyDurationIndex = normalizeByKey(
                rows,
                "spotify_avg_duration_seconds",
                row.spotify_avg_duration_seconds
            );

            const apiIndex = (recreationPerCapitaIndex + recreationShareIndex) / 2;

            /*
                Ya no usamos popularidad media.
                El índice Spotify queda basado únicamente en la duración media.
            */
            const spotifyIndex = spotifyDurationIndex;

            const integratedIndex = (apiIndex + spotifyIndex) / 2;

            return {
                ...row,
                apiIndex: Number(apiIndex.toFixed(2)),
                spotifyIndex: Number(spotifyIndex.toFixed(2)),
                integratedIndex: Number(integratedIndex.toFixed(2)),
                sectorValue: 1
            };
        });
    }

    async function fetchSpotifyCountry(countryCode) {
        const params = new URLSearchParams({
            country: countryCode,
            limit: "10"
        });

        const response = await fetch(`${SPOTIFY_COUNTRY_PROXY}?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || `No se pudieron cargar datos de Spotify para ${countryCode}`
            );
        }

        return data.tracks || [];
    }

    async function loadIntegratedData() {
        loading = true;
        chartReady = false;
        errorMessage = "";
        successMessage = "";
        integratedData = [];

        try {
            const localResponse = await fetch(LOCAL_API);
            const localData = await localResponse.json();

            if (!localResponse.ok) {
                throw new Error(
                    localData.error || "No se pudieron cargar los datos de la API local."
                );
            }

            if (!Array.isArray(localData) || localData.length === 0) {
                throw new Error(
                    "La API local no tiene datos. Ejecuta primero loadInitialData."
                );
            }

            const rows = await Promise.all(
                countries.map(async (country) => {
                    const localRecord = getLatestRecordByCountry(
                        localData,
                        country.apiCountry
                    );

                    if (!localRecord) {
                        return null;
                    }

                    const spotifyTracks = await fetchSpotifyCountry(country.code);
                    const spotifySummary = summarizeSpotifyTracks(spotifyTracks);

                    return {
                        country: country.name,
                        api_country: country.apiCountry,
                        spotify_market: country.code,

                        year: Number(localRecord.year),
                        recreation_per_capita: Number(localRecord.recreation_per_capita),
                        recreation_share: Number(localRecord.recreation_share),
                        recreation_value: Number(localRecord.recreation_value),
                        population: Number(localRecord.population),

                        ...spotifySummary
                    };
                })
            );

            const cleanRows = rows.filter(Boolean);

            if (cleanRows.length === 0) {
                throw new Error(
                    "No se han podido combinar países entre tu API y Spotify."
                );
            }

            integratedData = buildIndexedRows(cleanRows);

            successMessage = `Se han integrado ${integratedData.length} países usando tu API y Spotify.`;
            await renderChart(integratedData);
        } catch (error) {
            console.error("Error integrando Spotify con la API local:", error);

            integratedData = [];
            await renderChart([]);

            errorMessage =
                error.message ||
                "No se pudo generar la integración entre Spotify y tu API.";
        } finally {
            loading = false;
        }
    }

    async function renderChart(data) {
    if (!chartContainer) {
        return;
    }

    if (vegaView) {
        vegaView.finalize();
        vegaView = null;
    }

    chartReady = false;
    chartContainer.innerHTML = "";

    if (!data || data.length === 0) {
        return;
    }

    /*
        Ahora la anchura angular de cada país representa el gasto cultural per cápita.
        Para evitar que unos sectores tapen a otros, no usamos valores sueltos como ángulos,
        sino que calculamos los sectores de forma acumulada.

        - País con mayor recreation_per_capita => sector más ancho.
        - País con menor recreation_per_capita => sector más estrecho.
        - integratedIndex sigue representándose con el radio.
    */
    const totalCountries = data.length;
    const fullCircle = Math.PI * 2;
    const gap = 0.035;

    const validPerCapitaValues = data
        .map((row) => Number(row.recreation_per_capita))
        .filter((value) => Number.isFinite(value) && value > 0);

    const totalPerCapita = validPerCapitaValues.reduce(
        (sum, value) => sum + value,
        0
    );

    const usableCircle = fullCircle - gap * totalCountries;

    let currentAngle = 0;

    const chartData = data.map((row) => {
        const perCapita = Number(row.recreation_per_capita);

        /*
            Si hubiera algún dato inválido o cero, le damos peso 1 para que
            siga apareciendo en la gráfica y no rompa la visualización.
        */
        const weight =
            Number.isFinite(perCapita) && perCapita > 0 && totalPerCapita > 0
                ? perCapita / totalPerCapita
                : 1 / totalCountries;

        const sectorAngle = usableCircle * weight;

        const thetaStart = currentAngle + gap / 2;
        const thetaEnd = thetaStart + sectorAngle;

        currentAngle += sectorAngle + gap;

        return {
            ...row,
            thetaStart,
            thetaEnd,
            sectorWidthPercent: Number((weight * 100).toFixed(2))
        };
    });

    const durationValues = chartData
        .map((row) => Number(row.spotify_avg_duration_seconds))
        .filter((value) => Number.isFinite(value) && value > 0);

    const maxDuration = Math.max(...durationValues, 1);

    const spec = {
        $schema: "https://vega.github.io/schema/vega-lite/v6.json",
        description:
            "Visualización radial integrada entre gasto cultural per cápita y datos de Spotify",
        width: 680,
        height: 520,
        data: {
            values: chartData
        },
        mark: {
            type: "arc",
            innerRadius: 55,
            stroke: "#ffffff",
            strokeWidth: 2,
            cornerRadius: 4
        },
        encoding: {
            theta: {
                field: "thetaStart",
                type: "quantitative",
                scale: null
            },
            theta2: {
                field: "thetaEnd",
                type: "quantitative",
                scale: null
            },
            radius: {
                field: "spotify_avg_duration_seconds",
                type: "quantitative",
                title: "Duración media Spotify (s)",
                scale: {
                    domain: [0, maxDuration],
                    range: [110, 240]
                }
            },
            radius2: {
                value: 55
            },
            color: {
                field: "country",
                type: "nominal",
                title: "País"
            },
            tooltip: [
                {
                    field: "country",
                    type: "nominal",
                    title: "País"
                },
                {
                    field: "spotify_market",
                    type: "nominal",
                    title: "Mercado Spotify"
                },
                {
                    field: "year",
                    type: "quantitative",
                    title: "Año API local"
                },
                {
                    field: "recreation_per_capita",
                    type: "quantitative",
                    title: "Gasto cultural per cápita",
                    format: ".2f"
                },
                {
                    field: "sectorWidthPercent",
                    type: "quantitative",
                    title: "Anchura del sector (%)",
                    format: ".2f"
                },
                {
                    field: "integratedIndex",
                    type: "quantitative",
                    title: "Índice integrado",
                    format: ".2f"
                },
                {
                    field: "apiIndex",
                    type: "quantitative",
                    title: "Índice API propia",
                    format: ".2f"
                },
                {
                    field: "spotifyIndex",
                    type: "quantitative",
                    title: "Índice Spotify",
                    format: ".2f"
                },
                {
                    field: "recreation_share",
                    type: "quantitative",
                    title: "Gasto cultural (%)",
                    format: ".2f"
                },
                {
                    field: "spotify_avg_duration_seconds",
                    type: "quantitative",
                    title: "Altura radial: Duración media Spotify",
                    format: ".2f"
                },
                {
                    field: "spotify_track_count",
                    type: "quantitative",
                    title: "Canciones analizadas"
                }
            ]
        },
        view: {
            stroke: null
        }
    };

    try {
        const result = await vegaEmbed(chartContainer, spec, {
            actions: false,
            renderer: "svg"
        });

        vegaView = result.view;
        chartReady = true;
    } catch (error) {
        console.error("Error renderizando Vega-Lite:", error);
        chartReady = false;
        errorMessage =
            "Los datos se han integrado, pero no se pudo generar la gráfica radial.";
    }
}

    function formatNumber(value) {
        return Number(value).toLocaleString("es-ES", {
            maximumFractionDigits: 2
        });
    }

    onMount(() => {
        loadIntegratedData();

        return () => {
            if (vegaView) {
                vegaView.finalize();
            }
        };
    });
</script>

<svelte:head>
    <title>Integración Spotify y API local | SOS2526-24</title>
</svelte:head>

<main class="page">
    <section class="hero">
        <p class="eyebrow">SOS2526-24 · D03.B · Integraciones</p>

        <h1>Integración entre Spotify y gasto en ocio y cultura</h1>

        <p>
            Esta vista combina datos de la API propia
            <code>recreation-culture-expenditure</code> con datos obtenidos desde
            Spotify mediante un proxy propio del backend. La integración compara
            indicadores económicos de ocio y cultura con métricas musicales calculadas
            a partir de canciones disponibles en varios mercados de Spotify.
        </p>
    </section>

    <section class="card">
        <h2>Datos integrados</h2>

        <p>
            Se cargan los últimos datos disponibles de cada país en la API local y se
            cruzan con canciones disponibles en el mercado correspondiente de Spotify.
        </p>

        <button type="button" on:click={loadIntegratedData} disabled={loading}>
            {loading ? "Cargando integración..." : "Recargar integración"}
        </button>

        {#if successMessage}
            <p class="message success">{successMessage}</p>
        {/if}

        {#if errorMessage}
            <p class="message error">{errorMessage}</p>
        {/if}
    </section>

    <section class="card">
        <h2>Visualización radial integrada con Vega-Lite</h2>

        <p>
            Cada sector representa un país. La anchura angular de cada sector representa
            el gasto cultural per cápita obtenido desde la API local, mientras que el
            radio representa la duración media en segundos de las canciones obtenidas
            desde Spotify para cada mercado. De esta forma, la gráfica compara el gasto
            cultural per cápita con una métrica musical externa sin usar la popularidad,
            ya que ese dato no aporta variación en esta integración.
        </p>

        {#if loading}
            <p class="loading">Cargando datos de tu API y Spotify...</p>
        {/if}

        <div class="chart-wrapper">
            <div bind:this={chartContainer}></div>

            {#if !loading && !chartReady && integratedData.length === 0}
                <p class="empty">
                    No hay datos integrados disponibles para representar.
                </p>
            {/if}
        </div>
    </section>

    <section class="card">
        <h2>Tabla de datos combinados</h2>

        {#if integratedData.length > 0}
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>País</th>
                            <th>Año API</th>
                            <th>Gasto cultural per cápita</th>
                            <th>Gasto cultural (%)</th>
                            <th>Mercado Spotify</th>
                            <th>Canciones</th>
                            <th>Duración media Spotify</th>
                            <th>Índice API</th>
                            <th>Índice Spotify</th>
                            <th>Índice integrado</th>
                        </tr>
                    </thead>

                    <tbody>
                        {#each integratedData as row}
                            <tr>
                                <td>{row.country}</td>
                                <td>{row.year}</td>
                                <td>{formatNumber(row.recreation_per_capita)}</td>
                                <td>{formatNumber(row.recreation_share)}%</td>
                                <td>{row.spotify_market}</td>
                                <td>{row.spotify_track_count}</td>
                                <td>{formatNumber(row.spotify_avg_duration_seconds)} s</td>
                                <td>{formatNumber(row.apiIndex)}</td>
                                <td>{formatNumber(row.spotifyIndex)}</td>
                                <td><strong>{formatNumber(row.integratedIndex)}</strong></td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {:else}
            <p class="empty">Todavía no hay datos integrados cargados.</p>
        {/if}
    </section>

    <section class="card explanation">
        <h2>Justificación técnica</h2>

        <ul>
            <li>
                Se consulta la API propia mediante <code>fetch</code> a
                <code>{LOCAL_API}</code>.
            </li>
            <li>
                Se consulta Spotify mediante un proxy propio:
                <code>{SPOTIFY_COUNTRY_PROXY}</code>.
            </li>
            <li>
                Los datos se cruzan por país, usando el país de la API local y el
                mercado de Spotify.
            </li>
            <li>
                Se calcula un índice de la API propia, un índice de Spotify y un índice
                integrado para representar ambas fuentes en una única visualización.
            </li>
            <li>
                La respuesta JSON se transforma en una tabla HTML y una gráfica
                Vega-Lite, sin mostrar datos en crudo.
            </li>
        </ul>
    </section>
</main>

<style>
    .page {
        max-width: 1100px;
        margin: 0 auto;
        padding: 2rem 1rem 4rem;
        color: #1f2937;
    }

    .hero {
        margin-bottom: 1.5rem;
        padding: 2rem;
        border-radius: 18px;
        background: linear-gradient(135deg, #f7fee7, #ecfeff);
        border: 1px solid #d9f99d;
    }

    .eyebrow {
        margin: 0 0 0.5rem;
        font-size: 0.85rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #15803d;
    }

    h1 {
        margin: 0 0 1rem;
        font-size: clamp(2rem, 5vw, 3rem);
        color: #111827;
    }

    h2 {
        margin-top: 0;
        color: #111827;
    }

    code {
        padding: 0.1rem 0.3rem;
        border-radius: 6px;
        background: #f3f4f6;
        color: #374151;
    }

    .card {
        margin-top: 1rem;
        padding: 1.5rem;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        background: white;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
    }

    button {
        padding: 0.8rem 1rem;
        border: none;
        border-radius: 10px;
        background: #16a34a;
        color: white;
        font-weight: 700;
        cursor: pointer;
    }

    button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .message {
        margin-top: 1rem;
        padding: 0.9rem 1rem;
        border-radius: 10px;
        font-weight: 600;
    }

    .success {
        background: #dcfce7;
        color: #166534;
        border: 1px solid #86efac;
    }

    .error {
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fecaca;
    }

    .loading,
    .empty {
        color: #6b7280;
        font-style: italic;
    }

    .chart-wrapper {
        width: 100%;
        min-height: 560px;
        margin-top: 1rem;
        overflow-x: auto;
    }

    .table-wrapper {
        overflow-x: auto;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
    }

    th,
    td {
        padding: 0.85rem;
        border-bottom: 1px solid #e5e7eb;
        text-align: left;
        vertical-align: middle;
        white-space: nowrap;
    }

    th {
        background: #f9fafb;
        color: #374151;
    }

    a {
        color: #15803d;
        font-weight: 700;
    }

    .explanation ul {
        margin-bottom: 0;
        padding-left: 1.4rem;
    }

    .explanation li {
        margin-bottom: 0.6rem;
    }

    @media (max-width: 760px) {
        .hero,
        .card {
            padding: 1.1rem;
        }
    }
</style>