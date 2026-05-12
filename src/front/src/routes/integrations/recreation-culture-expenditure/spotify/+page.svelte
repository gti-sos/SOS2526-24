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
            const spotifyIndex = spotifyDurationIndex;
            const integratedIndex = (apiIndex + spotifyIndex) / 2;

            return {
                ...row,
                apiIndex: Number(apiIndex.toFixed(2)),
                spotifyIndex: Number(spotifyIndex.toFixed(2)),
                integratedIndex: Number(integratedIndex.toFixed(2))
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
                "Visualización radial integrada entre gasto cultural per cápita y duración media de canciones en Spotify",
            width: 760,
            height: 600,
            data: {
                values: chartData
            },
            mark: {
                type: "arc",
                innerRadius: 60,
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
                    title: "Duración media Spotify",
                    scale: {
                        domain: [0, maxDuration],
                        range: [120, 260]
                    }
                },
                radius2: {
                    value: 60
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
                        field: "recreation_share",
                        type: "quantitative",
                        title: "Gasto cultural (%)",
                        format: ".2f"
                    },
                    {
                        field: "spotify_avg_duration_seconds",
                        type: "quantitative",
                        title: "Duración media Spotify",
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
    <section class="chart-card">
        <h2>Integración de gasto en ocio y cultura con Spotify</h2> 
        <p> 
            La visualización radial integra datos procedentes de la API de gasto en ocio 
            y cultura con información musical obtenida desde Spotify. Cada sector corresponde 
            a un país común entre ambas fuentes. La dimensión angular representa el gasto cultural 
            per cápita, mientras que la dimensión radial muestra la duración media de las canciones 
            asociadas al mercado de Spotify de cada país. Relaciona una variable económica-cultural 
            con una característica musical externa. 
        </p>
        {#if loading}
            <p class="status">Cargando gráfica...</p>
        {/if}

        {#if errorMessage}
            <p class="error">{errorMessage}</p>
        {/if}

        <div class="chart-wrapper">
            <div bind:this={chartContainer}></div>
        </div>
    </section>
</main>

<style>
    .page {
        max-width: 1100px;
        margin: 0 auto;
        padding: 2rem 1rem 4rem;
        color: #1f2937;
    }

    .chart-card {
        padding: 1.5rem;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        background: white;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
    }

    .chart-wrapper {
        width: 100%;
        min-height: 620px;
        overflow-x: auto;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .status {
        color: #6b7280;
        font-style: italic;
        margin: 0 0 1rem;
    }

    .error {
        margin: 0 0 1rem;
        padding: 0.9rem 1rem;
        border-radius: 10px;
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fecaca;
        font-weight: 600;
    }

    @media (max-width: 760px) {
        .chart-card {
            padding: 1rem;
        }
    }
</style>