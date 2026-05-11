// src/back/proxies-EBP.js

export function setupProxiesEBP(app) {
  const PROXY_PATH = "/api/v2/recreation-culture-expenditure/proxy";

  /** -------------------- API de esportsgrowth-stats / Grupo 30 -------------------- */
  app.get(`${PROXY_PATH}/sos/esports-growth`, async (req, res) => {
    try {
      const targetUrl = buildUrl(
        "https://sos2526-30.onrender.com/api/v1/esportsgrowth-stats",
        req.query
      );

      console.log("[Proxy EBP] esports-growth:", targetUrl);

      const data = await fetchJson(targetUrl);
      return res.status(200).json(data);
    } catch (error) {
      console.error("[Proxy EBP] Error esports-growth:", error.message);

      return res.status(502).json({
        error: "No se pudo obtener información de la API SOS esportsgrowth-stats"
      });
    }
  });

  /** -------------------- API de daily-global-stock-market-indicators / Grupo 23 -------------------- */
  app.get(`${PROXY_PATH}/sos/stock-market`, async (req, res) => {
    try {
      const targetUrl = buildUrl(
        "https://mi-api-estable-sos.onrender.com/api/v1/daily-global-stock-market-indicators",
        req.query
      );

      console.log("[Proxy EBP] stock-market:", targetUrl);

      const data = await fetchJson(targetUrl);
      return res.status(200).json(data);
    } catch (error) {
      console.error("[Proxy EBP] Error stock-market:", error.message);

      return res.status(502).json({
        error: "No se pudo obtener información de la API SOS daily-global-stock-market-indicators"
      });
    }
  });

    app.get(`${PROXY_PATH}/sos/stock-market/loadInitialData`, async (req, res) => {
    try {
      const targetUrl =
        "https://mi-api-estable-sos.onrender.com/api/v1/daily-global-stock-market-indicators/loadInitialData";

      console.log("[Proxy EBP] stock-market loadInitialData:", targetUrl);

      const response = await fetch(targetUrl, {
        headers: {
          Accept: "application/json"
        }
      });

      /*
        Estados aceptables:
        - 200: datos cargados o respuesta correcta
        - 201: datos iniciales creados
        - 204: operación correcta sin cuerpo
        - 409: ya había datos, no es un error real para la gráfica
      */
      if ([200, 201, 204, 409].includes(response.status)) {
        try {
          const data = await response.json();
          return res.status(response.status).json(data);
        } catch {
          return res.status(response.status).json({
            message: "loadInitialData ejecutado correctamente sin cuerpo JSON."
          });
        }
      }

      return res.status(502).json({
        error: `No se pudo ejecutar loadInitialData de G23. Estado ${response.status}`
      });
    } catch (error) {
      console.error(
        "[Proxy EBP] Error stock-market loadInitialData:",
        error.message
      );

      return res.status(502).json({
        error:
          "No se pudo ejecutar loadInitialData de la API SOS daily-global-stock-market-indicators"
      });
    }
  });

  /** -------------------- API de global-agriculture-climate-impacts / Grupo 22 -------------------- */
  app.get(`${PROXY_PATH}/sos/agriculture-climate`, async (req, res) => {
    try {
      const targetUrl = buildUrl(
        "https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts",
        req.query
      );

      console.log("[Proxy EBP] agriculture-climate:", targetUrl);

      const data = await fetchJson(targetUrl);
      return res.status(200).json(data);
    } catch (error) {
      console.error("[Proxy EBP] Error agriculture-climate:", error.message);

      return res.status(502).json({
        error: "No se pudo obtener información de la API SOS global-agriculture-climate-impacts"
      });
    }
  });

  /** -------------------- API externa: Nager.Date -------------------- */
  app.get(`${PROXY_PATH}/external/nager/public-holidays`, async (req, res) => {
    try {
      const year = req.query.year || "2024";
      const countryCode = req.query.countryCode || "ES";

      const targetUrl = `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`;

      console.log("[Proxy EBP] nager:", targetUrl);

      const data = await fetchJson(targetUrl);
      return res.status(200).json(data);
    } catch (error) {
      console.error("[Proxy EBP] Error Nager.Date:", error.message);

      return res.status(502).json({
        error: "No se pudo obtener información de la API Nager.Date"
      });
    }
  });

  /** -------------------- API externa: TicketMaster -------------------- */
  app.get(`${PROXY_PATH}/external/ticketmaster/events`, async (req, res) => {
    try {
      const apiKey = process.env.TICKETMASTER_API_KEY;

      if (!apiKey) {
        return res.status(500).json({
          error: "Falta configurar TICKETMASTER_API_KEY"
        });
      }

      const params = new URLSearchParams();

      for (const [key, value] of Object.entries(req.query)) {
        params.set(key, value);
      }

      params.set("apikey", apiKey);

      const targetUrl = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`;

      console.log("[Proxy EBP] ticketmaster events");

      const data = await fetchJson(targetUrl);
      return res.status(200).json(data);
    } catch (error) {
      console.error("[Proxy EBP] Error TicketMaster:", error.message);

      return res.status(502).json({
        error: "No se pudo obtener información de la API TicketMaster"
      });
    }
  });

  /** -------------------- API externa: Spotify -------------------- */
  app.get(`${PROXY_PATH}/external/spotify/search`, async (req, res) => {
    try {
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return res.status(500).json({
          error: "Faltan configurar SPOTIFY_CLIENT_ID y/o SPOTIFY_CLIENT_SECRET"
        });
      }

      const query = req.query.query || req.query.q;
      const type = req.query.type || "artist";
      const limit = req.query.limit || "5";

      if (!query) {
        return res.status(400).json({
          error: "El parámetro query es obligatorio"
        });
      }

      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

      const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          grant_type: "client_credentials"
        })
      });

      if (!tokenResponse.ok) {
        throw new Error(`Error obteniendo token de Spotify: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();

      const params = new URLSearchParams({
        q: String(query),
        type: String(type),
        limit: String(limit)
      });

      const targetUrl = `https://api.spotify.com/v1/search?${params.toString()}`;

      console.log("[Proxy EBP] spotify search");

      const data = await fetchJson(targetUrl, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`
        }
      });

      return res.status(200).json(data);
    } catch (error) {
      console.error("[Proxy EBP] Error Spotify:", error.message);

      return res.status(502).json({
        error: "No se pudo obtener información de la API Spotify"
      });
    }
  });
}

function buildUrl(baseUrl, query) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  }

  const queryString = params.toString();

  return queryString.length === 0 ? baseUrl : `${baseUrl}?${queryString}`;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status}`);
  }

  return await response.json();
}