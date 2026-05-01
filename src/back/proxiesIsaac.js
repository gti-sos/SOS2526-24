// src/back/proxiesIsaac.js

export function setupProxiesIsaac(app) {
    const PROXY_PATH = "/api/v2/proxy";

    // 1. PROXY ENERGÍA (NREL) - Se mantiene igual
    app.get(`${PROXY_PATH}/building-energy`, async (req, res) => {
        const NREL_KEY = "GnPTFp39AfhIzagN4Os3p4j0CH0raGWBnhFaK25S";
        const { lat, lon } = req.query;
        try {
            const url = `https://developer.nrel.gov/api/utility_rates/v3.json?api_key=${NREL_KEY}&lat=${lat || "38.89"}&lon=${lon || "-77.03"}`;
            const response = await fetch(url);
            const data = await response.json();
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: "Error NREL" });
        }
    });

    // 2. DENSIDAD DE EMPRESAS 
    app.get(`${PROXY_PATH}/construction-density`, async (req, res) => {
        const TOMTOM = "i6EMvSDa7GV5v2B0ME2C6hRRN4YX5qkg";
        const city = req.query.city || "Madrid";

        try {
            // Paso A: Obtener coordenadas de la ciudad
            const geoUrl = `https://api.tomtom.com/search/2/geocode/${city}.json?key=${TOMTOM}`;
            const geoRes = await fetch(geoUrl);
            const geoData = await geoRes.json();
            
            if (!geoData.results || geoData.results.length === 0) {
                return res.status(404).json({ error: "Ciudad no encontrada" });
            }

            const { lat, lon } = geoData.results[0].position;

            // Paso B: Buscar empresas de construcción (POI) en un radio de 10km
            const poiUrl = `https://api.tomtom.com/search/2/poiSearch/construction.json?key=${TOMTOM_KEY}&lat=${lat}&lon=${lon}&radius=10000&limit=1`;
            const poiRes = await fetch(poiUrl);
            const poiData = await poiRes.json();

            res.status(200).json({
                city: city,
                count: poiData.summary.totalResults || 0
            });
        } catch (error) {
            res.status(500).json({ error: "Error en TomTom Proxy" });
        }
    });

    // 3. PROXY GITHUB (OAuth 2.0) - Se mantiene igual
    app.get(`${PROXY_PATH}/github-innovation`, async (req, res) => {
        const GITHUB_TOKEN = "-------------------------------"; 
        const city = req.query.city || 'Madrid';
        try {
            const url = `https://api.github.com/search/repositories?q=construction+location:${city}&sort=stars`;
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'User-Agent': 'Isaac-App' }
            });
            const data = await response.json();
            res.status(200).json({ city, total_repos: data.total_count });
        } catch (error) {
            res.status(500).json({ error: "Error GitHub" });
        }
    });
}