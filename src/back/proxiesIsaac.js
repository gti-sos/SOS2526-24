

export function setupProxiesIsaac(app) {
  const PROXY_PATH = "/api/v2/proxy";
 
  // =========================================================
  // HELPERS
  // =========================================================
  async function fetchWithTimeout(url, options = {}, timeoutMs = 20000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
 
    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }
  }
 
  async function readJsonSafe(response) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
 
  function normalizeArray(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
  }
 
  function externalApiError(res, apiName, status, payload = null) {
    return res.status(502).json({
      error: `${apiName} respondió con estado ${status}`,
      details: payload
    });
  }
 
  // =========================================================
  // 1. OPEN-METEO (geocoding + forecast, sin API key)
  //
  // Paso 1: geocoding-api.open-meteo.com  → lat/lon/country
  // Paso 2: api.open-meteo.com/v1/forecast → temperatura actual
  //
  // Devuelve el mismo contrato que antes:
  //   { city, country, coordinates, temperature, humidity, windSpeed, weather }
  // =========================================================
  app.get(`${PROXY_PATH}/weather`, async (req, res) => {
    const { city } = req.query;
 
    if (!city) {
      return res.status(400).json({ error: "city obligatorio" });
    }
 
    try {
      // ── Paso 1: Open-Meteo Geocoding API ──────────────────
      const geoUrl =
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
 
      const geoRes = await fetchWithTimeout(geoUrl);
      const geoData = await readJsonSafe(geoRes);
 
      if (!geoRes.ok) {
        return externalApiError(res, "Open-Meteo Geocoding", geoRes.status, geoData);
      }
 
      const results = Array.isArray(geoData?.results) ? geoData.results : [];
 
      if (results.length === 0) {
        return res.status(404).json({ error: `Ciudad no encontrada: ${city}` });
      }
 
      const { latitude, longitude, country, name } = results[0];
 
      // ── Paso 2: Open-Meteo Forecast API ───────────────────
      const weatherUrl =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${latitude}&longitude=${longitude}` +
        `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
        `&timezone=auto`;
 
      const weatherRes = await fetchWithTimeout(weatherUrl);
      const weatherData = await readJsonSafe(weatherRes);
 
      if (!weatherRes.ok) {
        return externalApiError(res, "Open-Meteo Forecast", weatherRes.status, weatherData);
      }
 
      const current = weatherData?.current ?? {};
 
      const wmoToLabel = (code) => {
        if (code === 0)  return "Clear sky";
        if (code <= 3)   return "Partly cloudy";
        if (code <= 49)  return "Fog";
        if (code <= 69)  return "Rain";
        if (code <= 79)  return "Snow";
        if (code <= 99)  return "Thunderstorm";
        return "Unknown";
      };
 
      return res.status(200).json({
        city:        name ?? city,
        country:     country ?? null,
        coordinates: { lat: latitude, lon: longitude },
        temperature: current.temperature_2m        ?? null,
        humidity:    current.relative_humidity_2m  ?? null,
        windSpeed:   current.wind_speed_10m        ?? null,
        weather:     wmoToLabel(current.weather_code)
      });
    } catch (err) {
      console.error("[OPEN-METEO ERROR]", err.message);
      const status = err.name === "AbortError" ? 504 : 500;
      return res.status(status).json({
        error: "No se pudo obtener el clima (Open-Meteo)"
      });
    }
  });
 
  // =========================================================
  // 2. API NINJAS (COUNTRY)
  // =========================================================
  app.get(`${PROXY_PATH}/country`, async (req, res) => {
    const API_NINJAS_KEY = process.env.API_NINJAS_KEY;
    const { name } = req.query;
 
    if (!name) {
      return res.status(400).json({ error: "name obligatorio" });
    }
 
    if (!API_NINJAS_KEY) {
      return res.status(500).json({ error: "API_NINJAS_KEY no configurada" });
    }
 
    try {
      const url =
        `https://api.api-ninjas.com/v1/country?name=${encodeURIComponent(name)}`;
 
      const response = await fetchWithTimeout(url, {
        headers: { "X-Api-Key": API_NINJAS_KEY }
      });
 
      const data = await readJsonSafe(response);
 
      if (!response.ok) {
        return externalApiError(res, "API Ninjas", response.status, data);
      }
 
      return res.status(200).json(normalizeArray(data));
    } catch (err) {
      console.error("[NINJAS ERROR]", err.message);
      const status = err.name === "AbortError" ? 504 : 500;
      return res.status(status).json({
        error: "No se pudo contactar con API Ninjas"
      });
    }
  });
 
  // =========================================================
  // 3. GITHUB
  // Busca repos que mencionen "construction" y la ciudad en
  // nombre, descripción o topics. Ordena por estrellas para
  // obtener los más relevantes. No usa location: porque muy
  // pocos usuarios completan ese campo en su perfil.
  // =========================================================
  app.get(`${PROXY_PATH}/github-innovation`, async (req, res) => {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const { city } = req.query;
 
    if (!city) {
      return res.status(400).json({ error: "city obligatorio" });
    }
 
    try {
      // Busca repos cuyo nombre o descripción contenga tanto
      // "construction" como el nombre de la ciudad, con al
      // menos 1 estrella para filtrar proyectos abandonados.
      const query = `construction+${encodeURIComponent(city)}+stars:>=1`;
      const url =
        `https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=10`;
 
      const headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "Isaac-App"
      };
 
      if (GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
      }
 
      const response = await fetchWithTimeout(url, { headers });
      const data = await readJsonSafe(response);
 
      if (!response.ok) {
        return externalApiError(res, "GitHub", response.status, data);
      }
 
      const items = Array.isArray(data?.items) ? data.items : [];
 
      return res.status(200).json({
        total_count:        data?.total_count ?? 0,
        incomplete_results: data?.incomplete_results ?? false,
        items: items.map(r => ({
          id:               r.id,
          full_name:        r.full_name,
          html_url:         r.html_url,
          description:      r.description,
          stargazers_count: r.stargazers_count,
          language:         r.language
        }))
      });
    } catch (err) {
      console.error("[GITHUB ERROR]", err.message);
      const status = err.name === "AbortError" ? 504 : 500;
      return res.status(status).json({
        error: "No se pudo contactar con GitHub"
      });
    }
  });
 
  // =========================================================
  // 4. G30 - CHEATERS STATS
  // =========================================================
  app.get(`${PROXY_PATH}/cheaters-stats`, async (req, res) => {
    try {
      const url = "https://sos2526-30-p5ay.onrender.com/api/v1/cheaters-stats";
 
      const response = await fetchWithTimeout(url);
      const data = await readJsonSafe(response);
 
      if (!response.ok) {
        return externalApiError(res, "API SOS G30", response.status, data);
      }
 
      return res.status(200).json(normalizeArray(data));
    } catch (err) {
      console.error("[G30 ERROR]", err.message);
      const status = err.name === "AbortError" ? 504 : 500;
      return res.status(status).json({
        error: "No se pudo contactar con la API SOS G30"
      });
    }
  });
 
  // =========================================================
  // 5. G19 - DROUGHT STATS
  // =========================================================
  app.get(`${PROXY_PATH}/drought-stats`, async (req, res) => {
    try {
      const url = "https://sos2526-19.onrender.com/api/v1/drought-stats";
 
      const response = await fetchWithTimeout(url);
      const data = await readJsonSafe(response);
 
      if (!response.ok) {
        return externalApiError(res, "API SOS G19", response.status, data);
      }
 
      return res.status(200).json(normalizeArray(data));
    } catch (err) {
      console.error("[G19 ERROR]", err.message);
      const status = err.name === "AbortError" ? 504 : 500;
      return res.status(status).json({
        error: "No se pudo contactar con la API SOS G19"
      });
    }
  });
}