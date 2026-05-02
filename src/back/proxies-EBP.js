export function setupProxiesEBP(app) {
  const PROXY_PATH = "/api/v2/recreation-culture-expenditure/proxy";

  /** -------------------- API de esportsgrowth-stats / Grupo 30 -------------------- */
  app.get(`${PROXY_PATH}/sos/esports-growth`, async (req, res) => {
    try {
      const url = "https://sos2526-30.onrender.com/api/v1/esportsgrowth-stats";
      const data = await fetchJson(url);

      return res.status(200).json(data);
    } catch (error) {
      return res.status(502).json({
        error: "No se pudo obtener información de la API SOS esportsgrowth-stats"
      });
    }
  });

    /** -------------------- API de daily-global-stock-market-indicators / Grupo 23 -------------------- */
  app.get(`${PROXY_PATH}/sos/stock-market`, async (req, res) => {
    try {
      const url = "https://mi-api-estable-sos.onrender.com/api/v1/daily-global-stock-market-indicators";
      const data = await fetchJson(url);

      return res.status(200).json(data);
    } catch (error) {
      return res.status(502).json({
        error: "No se pudo obtener información de la API SOS daily-global-stock-market-indicators"
      });
    }
  });
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status}`);
  }

  return await response.json();
}