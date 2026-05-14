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

  //Llamada de carga inicial de datos de la api G30
  app.get(`${PROXY_PATH}/sos/esports-growth/loadInitialData`, async (req, res) => {
  try {
    const targetUrl =
      "https://sos2526-30.onrender.com/api/v1/esportsgrowth-stats/loadInitialData";

    console.log("[Proxy EBP] esports-growth loadInitialData:", targetUrl);

    const response = await fetch(targetUrl, {
      headers: {
        Accept: "application/json"
      }
    });

    /*
      Estados aceptables:
      - 200: los datos ya estaban cargados o respuesta correcta
      - 201: datos iniciales creados
      - 204: operación correcta sin cuerpo
      - 409: algunas APIs lo usan para indicar que ya había datos

      Ninguno de estos estados debe romper la gráfica.
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
      error: `No se pudo ejecutar loadInitialData de G30. Estado ${response.status}`
    });
  } catch (error) {
    console.error(
      "[Proxy EBP] Error esports-growth loadInitialData:",
      error.message
    );

    return res.status(502).json({
      error: "No se pudo ejecutar loadInitialData de la API SOS esportsgrowth-stats"
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

  //Llamada de carga inicial de datos de la api G23
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

  //Llamada de carga inicial de datos de la api G22
  app.get(`${PROXY_PATH}/sos/agriculture-climate/loadInitialData`, async (req, res) => {
  try {
    const targetUrl =
      "https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts/loadInitialData";

    console.log("[Proxy EBP] agriculture-climate loadInitialData:", targetUrl);

    const response = await fetch(targetUrl, {
      headers: {
        Accept: "application/json"
      }
    });

    /*
      Estados aceptables:
      - 200: respuesta correcta
      - 201: datos iniciales creados
      - 204: operación correcta sin cuerpo
      - 409: ya había datos, no es un error para la gráfica
    */
    if ([200, 201, 204, 409].includes(response.status)) {
      try {
        const data = await response.json();
        return res.status(response.status).json(data);
      } catch {
        return res.status(response.status).json({
          message: "loadInitialData de G22 ejecutado correctamente sin cuerpo JSON."
        });
      }
    }

    return res.status(502).json({
      error: `No se pudo ejecutar loadInitialData de G22. Estado ${response.status}`
    });
  } catch (error) {
    console.error(
      "[Proxy EBP] Error agriculture-climate loadInitialData:",
      error.message
    );

    return res.status(502).json({
      error:
        "No se pudo ejecutar loadInitialData de la API SOS global-agriculture-climate-impacts"
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
const ticketmasterCache = new Map();
  const TICKETMASTER_CACHE_MS = 30 * 60 * 1000;

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function fetchTicketmasterEvents(params) {
    const apiKey = process.env.TICKETMASTER_API_KEY;

    if (!apiKey) {
      const error = new Error("Falta configurar TICKETMASTER_API_KEY");
      error.status = 500;
      throw error;
    }

    const publicParams = new URLSearchParams(params);
    const cacheKey = publicParams.toString();

    const cached = ticketmasterCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < TICKETMASTER_CACHE_MS) {
      return cached.data;
    }

    const privateParams = new URLSearchParams(publicParams);
    privateParams.set("apikey", apiKey);

    const targetUrl =
      `https://app.ticketmaster.com/discovery/v2/events.json?${privateParams.toString()}`;

    console.log("[Proxy EBP] ticketmaster events:", publicParams.toString());

    const response = await fetch(targetUrl, {
      headers: {
        Accept: "application/json"
      }
    });

    if (response.status === 429) {
      const error = new Error(
        "Ticketmaster ha limitado temporalmente las peticiones. Espera unos segundos y vuelve a intentarlo."
      );
      error.status = 429;
      throw error;
    }

    if (!response.ok) {
      const error = new Error(`Error consultando Ticketmaster: HTTP ${response.status}`);
      error.status = 502;
      throw error;
    }

    const data = await response.json();

    ticketmasterCache.set(cacheKey, {
      timestamp: Date.now(),
      data
    });

    return data;
  }

  app.get(`${PROXY_PATH}/external/ticketmaster/events`, async (req, res) => {
    try {
      const allowedParams = [
        "keyword",
        "countryCode",
        "city",
        "classificationName",
        "startDateTime",
        "endDateTime",
        "size",
        "page",
        "sort"
      ];

      const params = new URLSearchParams();

      for (const param of allowedParams) {
        const value = req.query[param];

        if (Array.isArray(value)) {
          value.forEach((item) => params.append(param, String(item)));
        } else if (value !== undefined && value !== null) {
          params.set(param, String(value));
        }
      }

      if (!params.has("countryCode")) {
        params.set("countryCode", "ES");
      }

      if (!params.has("size")) {
        params.set("size", "1");
      }

      const data = await fetchTicketmasterEvents(params);

      return res.status(200).json(data);
    } catch (error) {
      console.error("[Proxy EBP] Error TicketMaster:", error.message);

      return res.status(error.status || 502).json({
        error:
          error.message ||
          "No se pudo obtener información de la API TicketMaster"
      });
    }
  });

  app.get(`${PROXY_PATH}/external/ticketmaster/events-count-by-country`, async (req, res) => {
    try {
      const countryCodes = String(req.query.countryCodes || "ES")
        .split(",")
        .map((code) => code.trim().toUpperCase())
        .filter((code) => /^[A-Z]{2}$/.test(code));

      if (countryCodes.length === 0) {
        return res.status(400).json({
          error: "Debes indicar al menos un código de país válido"
        });
      }

      const results = [];

      for (const countryCode of countryCodes) {
        const params = new URLSearchParams({
          countryCode,
          size: "1"
        });

        if (req.query.keyword) {
          params.set("keyword", String(req.query.keyword));
        }

        if (req.query.classificationName) {
          params.set("classificationName", String(req.query.classificationName));
        }

        const data = await fetchTicketmasterEvents(params);

        results.push({
          countryCode,
          events: data.page?.totalElements || data._embedded?.events?.length || 0
        });

        await sleep(700);
      }

      return res.status(200).json(results);
    } catch (error) {
      console.error("[Proxy EBP] Error TicketMaster count:", error.message);

      return res.status(error.status || 502).json({
        error:
          error.message ||
          "No se pudo obtener el recuento de eventos de TicketMaster"
      });
    }
  });
  /** -------------------- API externa: Spotify -------------------- */
  const SPOTIFY_ALLOWED_COUNTRIES = {
    ES: "España",
    MX: "México",
    US: "Estados Unidos",
    GB: "Reino Unido",
    FR: "Francia",
    IT: "Italia",
    DE: "Alemania",
    CA: "Canadá"
  };

  async function getSpotifyAccessToken() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      const error = new Error(
        "Faltan configurar SPOTIFY_CLIENT_ID y/o SPOTIFY_CLIENT_SECRET"
      );
      error.status = 500;
      throw error;
    }

    const credentials = Buffer
      .from(`${clientId}:${clientSecret}`)
      .toString("base64");

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
      const error = new Error(
        `Error obteniendo token de Spotify: HTTP ${tokenResponse.status}`
      );
      error.status = 502;
      throw error;
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  }

  app.get(`${PROXY_PATH}/external/spotify/country-tracks`, async (req, res) => {
    try {
      const country = String(req.query.country || "ES").trim().toUpperCase();
      const limit = Number(req.query.limit || 10);

      if (!SPOTIFY_ALLOWED_COUNTRIES[country]) {
        return res.status(400).json({
          error:
            "El país indicado no está soportado. Usa ES, MX, US, GB, FR, IT, DE, BR, AR o CA."
        });
      }

      if (!Number.isInteger(limit) || limit < 1 || limit > 10) {
        return res.status(400).json({
          error: "El parámetro limit debe ser un número entero entre 1 y 10"
        });
      }

      const accessToken = await getSpotifyAccessToken();

      const params = new URLSearchParams({
        q: "genre:pop",
        type: "track",
        market: country,
        limit: String(limit)
      });

      const targetUrl = `https://api.spotify.com/v1/search?${params.toString()}`;

      console.log(
        `[Proxy EBP] spotify country-tracks: ${country} (${SPOTIFY_ALLOWED_COUNTRIES[country]})`
      );

      const spotifyData = await fetchJson(targetUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      const tracks = (spotifyData.tracks?.items || []).map((track) => ({
        id: track.id,
        name: track.name,
        popularity: track.popularity ?? 0,
        duration_ms: track.duration_ms,
        explicit: track.explicit,
        album: track.album?.name || "Álbum no disponible",
        release_date: track.album?.release_date || "Fecha no disponible",
        image: track.album?.images?.[0]?.url || "",
        spotify_url: track.external_urls?.spotify || "",
        artists: track.artists?.map((artist) => artist.name).join(", ") || "Artista no disponible",
        market: country,
        country_name: SPOTIFY_ALLOWED_COUNTRIES[country]
      }));

      return res.status(200).json({
        country,
        country_name: SPOTIFY_ALLOWED_COUNTRIES[country],
        query: "genre:pop",
        total: tracks.length,
        tracks
      });
    } catch (error) {
      console.error("[Proxy EBP] Error Spotify country-tracks:", error.message);

      return res.status(error.status || 502).json({
        error:
          error.message ||
          "No se pudo obtener información de Spotify por país"
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