// src/back/proxiesIsaac.js

import axios from "axios";

export function setupProxiesIsaac(app) {

    const PROXY_PATH = "/api/v2/proxy";

    // =========================================================
    // FETCH CON TIMEOUT + RETRY (MEJORADO)
    // =========================================================
    async function fetchWithTimeout(url, options = {}, timeoutMs = 25000, retries = 2) {

        for (let attempt = 0; attempt <= retries; attempt++) {

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), timeoutMs);

            try {
                const response = await fetch(url, {
                    ...options,
                    signal: controller.signal
                });

                clearTimeout(timeout);
                return response;

            } catch (error) {

                clearTimeout(timeout);

                const isLast = attempt === retries;

                if (error.name === "AbortError") {
                    console.warn(`[Timeout] intento ${attempt + 1}/${retries + 1} → ${url}`);
                } else {
                    console.warn(`[Fetch error] intento ${attempt + 1}/${retries + 1}`, error.message);
                }

                if (isLast) throw error;
            }
        }
    }

    // =========================================================
    // 1. NREL ENERGY
    // =========================================================
    app.get(`${PROXY_PATH}/building-energy`, async (req, res) => {

        const NREL_KEY = process.env.NREL_KEY;
        const { lat, lon } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({ error: "Parámetros lat y lon obligatorios" });
        }

        if (!NREL_KEY) {
            return res.status(500).json({ error: "NREL_KEY no configurada" });
        }

        try {

            const url =
                `https://developer.nrel.gov/api/utility_rates/v3.json` +
                `?api_key=${NREL_KEY}&lat=${lat}&lon=${lon}`;

            const response = await fetchWithTimeout(url);

            if (!response.ok) {
                return res.status(response.status).json({
                    error: "Error API NREL",
                    details: await response.text()
                });
            }

            const data = await response.json();
            return res.status(200).json(data);

        } catch (error) {
            console.error("[NREL] Error:", error.message);

            return res.status(500).json({
                error: "Error interno NREL",
                details: error.message
            });
        }
    });

    // =========================================================
    // 2. TOMTOM
    // =========================================================
    app.get(`${PROXY_PATH}/construction-density`, async (req, res) => {

        const TOMTOM_KEY = process.env.TOMTOM_KEY;
        const { city } = req.query;

        if (!city) {
            return res.status(400).json({ error: "Parámetro city obligatorio" });
        }

        try {

            const geoUrl =
                `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(city)}.json?key=${TOMTOM_KEY}`;

            const geoRes = await fetchWithTimeout(geoUrl);

            if (!geoRes.ok) {
                return res.status(geoRes.status).json({
                    error: "Error geocoding TomTom",
                    details: await geoRes.text()
                });
            }

            const geoData = await geoRes.json();
            const position = geoData.results?.[0]?.position;

            if (!position) {
                return res.status(404).json({ error: "Ciudad no encontrada" });
            }

            const { lat, lon } = position;

            const poiUrl =
                `https://api.tomtom.com/search/2/poiSearch/construction.json` +
                `?key=${TOMTOM_KEY}&lat=${lat}&lon=${lon}&radius=10000`;

            const poiRes = await fetchWithTimeout(poiUrl);

            if (!poiRes.ok) {
                return res.status(poiRes.status).json({
                    error: "Error POI TomTom",
                    details: await poiRes.text()
                });
            }

            const poiData = await poiRes.json();

            res.status(200).json({
                city,
                coordinates: { lat, lon },
                totalResults: poiData.summary?.totalResults ?? 0,
                results: poiData.results ?? []
            });

        } catch (error) {
            console.error("[TomTom] Error:", error.message);

            res.status(500).json({
                error: "Error interno TomTom",
                details: error.message
            });
        }
    });

    // =========================================================
    // 3. GITHUB
    // =========================================================
    app.get(`${PROXY_PATH}/github-innovation`, async (req, res) => {

        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const { city } = req.query;

        if (!city) {
            return res.status(400).json({ error: "Parámetro city obligatorio" });
        }

        try {

            const url =
                `https://api.github.com/search/repositories` +
                `?q=construction+location:${encodeURIComponent(city)}&sort=stars`;

            const response = await fetchWithTimeout(url, {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    "User-Agent": "Isaac-App"
                }
            });

            if (!response.ok) {
                return res.status(response.status).json({
                    error: "Error API GitHub",
                    details: await response.text()
                });
            }

            const data = await response.json();
            return res.status(200).json(data);

        } catch (error) {
            console.error("[GitHub] Error:", error.message);

            return res.status(500).json({
                error: "Error interno GitHub",
                details: error.message
            });
        }
    });

    // =========================================================
    // 4. G30 CHEATERS (ROBUSTO)
    // =========================================================
    app.get(`${PROXY_PATH}/cheaters-stats`, async (req, res) => {

        const url = "https://sos2526-30-p5ay.onrender.com/api/v1/cheaters-stats";

        try {

            const response = await fetchWithTimeout(url);

            if (!response.ok) throw new Error(await response.text());

            const data = await response.json();

            return res.status(200).json(data);

        } catch (error) {

            console.error("[Proxy G30] Error:", error.message);

            return res.status(200).json({
                data: [],
                error: "G30 unavailable"
            });
        }
    });

    // =========================================================
    // 5. G19 DROUGHT (ROBUSTO)
    // =========================================================
    app.get(`${PROXY_PATH}/drought-stats`, async (req, res) => {

        const url = "https://sos2526-19.onrender.com/api/v1/drought-stats";

        try {

            const response = await fetchWithTimeout(url);

            if (!response.ok) throw new Error(await response.text());

            const data = await response.json();

            return res.status(200).json(data);

        } catch (error) {

            console.error("[Proxy G19] Error:", error.message);

            return res.status(200).json({
                data: [],
                error: "G19 unavailable"
            });
        }
    });

}