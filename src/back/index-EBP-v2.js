// Importamos base de datos nedb
import dataStore from "nedb";

// Constantes de rutas
const BASE_URL_API = "/api/v2";
const EBP_API_PATH = BASE_URL_API + "/recreation-culture-expenditure";

// Ruta /docs
const DOCS_URL = "https://documenter.getpostman.com/view/52412956/2sBXinGqPr";

// Base de datos
let db = new dataStore({
  filename: "./src/back/recreation-culture-expenditure.db",
  autoload: true,
});

// Datos base iniciales de v2
const initialBaseData = [
  { year: 2024, country: "Canada", recreation_value: 127727000000, total_household_consumption: 1654821000000, population: 41288599 },
  { year: 2023, country: "Canada", recreation_value: 124522000000, total_household_consumption: 1572103000000, population: 40083484 },
  { year: 2022, country: "Canada", recreation_value: 118767000000, total_household_consumption: 1488875000000, population: 38935934 },
  { year: 2022, country: "Germany", recreation_value: 187327000000, total_household_consumption: 2017981000000, population: 83177813 },
  { year: 2023, country: "Ireland", recreation_value: 9931000000, total_household_consumption: 140665460000, population: 5311538 },
  { year: 2022, country: "Ireland", recreation_value: 8954000000, total_household_consumption: 124192688000, population: 5212836 },
  { year: 2023, country: "Italy", recreation_value: 85658000000, total_household_consumption: 1218946100000, population: 58984216 },
  { year: 2022, country: "Italy", recreation_value: 79846000000, total_household_consumption: 1156909900000, population: 59013667 },
  { year: 2023, country: "Poland", recreation_value: 118473000000, total_household_consumption: 1934063000000, population: 36687353 },
  { year: 2022, country: "Poland", recreation_value: 101603000000, total_household_consumption: 1772069000000, population: 36821749 },
  { year: 2022, country: "Spain", recreation_value: 63671000000, total_household_consumption: 759001000000, population: 47786102 },
  { year: 2024, country: "United Kingdom", recreation_value: 158522000000, total_household_consumption: 1706364000000, population: 69226000 },
  { year: 2023, country: "United Kingdom", recreation_value: 151870000000, total_household_consumption: 1646716000000, population: 68492000 },
  { year: 2022, country: "United Kingdom", recreation_value: 149789000000, total_household_consumption: 1534744000000, population: 67604000 },
  { year: 2023, country: "United States", recreation_value: 1797911000000, total_household_consumption: 18268702000000, population: 336806231 }
];

// Campos base exactos permitidos en v2
const BASE_FIELDS = [
  "year",
  "country",
  "recreation_value",
  "total_household_consumption",
  "population"
];

// ---- FUNCIONES AUXILIARES ----

function parseaId(doc) {
  //función auxiliar que limpia el campo interno _id de NeDB --> parseaId
  const { _id, ...cleanDoc } = doc;
  return cleanDoc;
}

function parseaIdArray(docs) {
  //función auxiliar que limpia el campo interno _id de NeDB --> parseaIdArray
  return docs.map(parseaId);
}

function redondeo(num, decimals = 2) {
  //función auxiliar que redondea decimales (por el calculo de las propiedades derivadas) --> redondeo
  return Number(num.toFixed(decimals));
}

function propiedadesIndividuales(obj) {
  //comprueba que los campos recibidos sean solo los base (propiedades individuales) --> propiedadesIndividuales
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;

  const keys = Object.keys(obj).sort();
  const expected = [...BASE_FIELDS].sort();

  return JSON.stringify(keys) === JSON.stringify(expected);
}

function parseaDatos(data) {
  //parsea los datos que recibe para que sea del tipo correcto --> parseaDatos
  return {
    year: parseInt(data.year),
    country: String(data.country),
    recreation_value: Number(data.recreation_value),
    total_household_consumption: Number(data.total_household_consumption),
    population: Number(data.population),
  };
}

function validateBaseData(data) {
  //comprueba que los datos base sean del tipo correcto
  if (!Number.isInteger(data.year)) {
    return "El campo 'year' debe ser un número entero.";
  }

  if (!data.country || data.country.trim() === "") {
    return "El campo 'country' es obligatorio.";
  }

  if (!Number.isFinite(data.recreation_value) || data.recreation_value < 0) {
    return "El campo 'recreation_value' debe ser un número mayor o igual que 0.";
  }

  if (
    !Number.isFinite(data.total_household_consumption) ||
    data.total_household_consumption <= 0
  ) {
    return "El campo 'total_household_consumption' debe ser un número mayor que 0.";
  }

  if (!Number.isFinite(data.population) || data.population <= 0) {
    return "El campo 'population' debe ser un número mayor que 0.";
  }

  return null;
}

function propiedadesDerivadas(baseData) {
  //añade las propiedades derivadas calculándolas --> propiedadesDerivadas
  return {
    ...baseData,
    recreation_share: redondeo(
      (baseData.recreation_value / baseData.total_household_consumption) * 100,
      2
    ),
    recreation_per_capita: redondeo(
      baseData.recreation_value / baseData.population,
      2
    ),
  };
}

function buildQuery(queryParams) {
  //devuelve el objeto query que después NeDB usa para búsquedas
  let query = {};

  // Campo texto
  if (queryParams.country !== undefined) {
    query.country = String(queryParams.country);
  }

  // YEAR
  if (queryParams.year !== undefined) {
    query.year = parseInt(queryParams.year);
  } else if (
    queryParams.year_gte !== undefined ||
    queryParams.year_lte !== undefined
  ) {
    query.year = {};
    if (queryParams.year_gte !== undefined) {
      query.year.$gte = parseInt(queryParams.year_gte);
    }
    if (queryParams.year_lte !== undefined) {
      query.year.$lte = parseInt(queryParams.year_lte);
    }
  }

  // RECREATION VALUE
  if (queryParams.recreation_value !== undefined) {
    query.recreation_value = Number(queryParams.recreation_value);
  } else if (
    queryParams.recreation_value_gte !== undefined ||
    queryParams.recreation_value_lte !== undefined
  ) {
    query.recreation_value = {};
    if (queryParams.recreation_value_gte !== undefined) {
      query.recreation_value.$gte = Number(queryParams.recreation_value_gte);
    }
    if (queryParams.recreation_value_lte !== undefined) {
      query.recreation_value.$lte = Number(queryParams.recreation_value_lte);
    }
  }

  // TOTAL HOUSEHOLD CONSUMPTION
  if (queryParams.total_household_consumption !== undefined) {
    query.total_household_consumption = Number(queryParams.total_household_consumption);
  } else if (
    queryParams.total_household_consumption_gte !== undefined ||
    queryParams.total_household_consumption_lte !== undefined
  ) {
    query.total_household_consumption = {};
    if (queryParams.total_household_consumption_gte !== undefined) {
      query.total_household_consumption.$gte = Number(queryParams.total_household_consumption_gte);
    }
    if (queryParams.total_household_consumption_lte !== undefined) {
      query.total_household_consumption.$lte = Number(queryParams.total_household_consumption_lte);
    }
  }

  // RECREATION SHARE
  if (queryParams.recreation_share !== undefined) {
    query.recreation_share = Number(queryParams.recreation_share);
  } else if (
    queryParams.recreation_share_gte !== undefined ||
    queryParams.recreation_share_lte !== undefined
  ) {
    query.recreation_share = {};
    if (queryParams.recreation_share_gte !== undefined) {
      query.recreation_share.$gte = Number(queryParams.recreation_share_gte);
    }
    if (queryParams.recreation_share_lte !== undefined) {
      query.recreation_share.$lte = Number(queryParams.recreation_share_lte);
    }
  }

  // POPULATION
  if (queryParams.population !== undefined) {
    query.population = Number(queryParams.population);
  } else if (
    queryParams.population_gte !== undefined ||
    queryParams.population_lte !== undefined
  ) {
    query.population = {};
    if (queryParams.population_gte !== undefined) {
      query.population.$gte = Number(queryParams.population_gte);
    }
    if (queryParams.population_lte !== undefined) {
      query.population.$lte = Number(queryParams.population_lte);
    }
  }

  // RECREATION PER CAPITA
  if (queryParams.recreation_per_capita !== undefined) {
    query.recreation_per_capita = Number(queryParams.recreation_per_capita);
  } else if (
    queryParams.recreation_per_capita_gte !== undefined ||
    queryParams.recreation_per_capita_lte !== undefined
  ) {
    query.recreation_per_capita = {};
    if (queryParams.recreation_per_capita_gte !== undefined) {
      query.recreation_per_capita.$gte = Number(queryParams.recreation_per_capita_gte);
    }
    if (queryParams.recreation_per_capita_lte !== undefined) {
      query.recreation_per_capita.$lte = Number(queryParams.recreation_per_capita_lte);
    }
  }

  return query;
}

// ---- FUNCION BACKEND v2 ----
function loadBackendElenav2(app) {

  // GET /loadInitialData (INICIALIZACIÓN DE DATOS)
  app.get(EBP_API_PATH + "/loadInitialData", (req, res) => {
    db.count({}, (err, count) => {
      if (err) {
        return res.status(500).json({ error: "Error al acceder a la base de datos." });
      }

      if (count > 0) {
        return res.status(409).json({ error: "La base de datos ya contiene datos." });
      }

      const initialDataWithDerived = initialBaseData.map((item) =>
        propiedadesDerivadas(parseaDatos(item))
      );

      db.insert(initialDataWithDerived, (err, newDocs) => {
        if (err) {
          return res.status(500).json({ error: "Error insertando datos en la base." });
        }

        return res.status(201).json(parseaIdArray(newDocs));
      });
    });
  });

  // GET colección + búsquedas + paginación
  app.get(EBP_API_PATH, (req, res) => {
    const query = buildQuery(req.query);

    const limit = req.query.limit ? parseInt(req.query.limit) : 0;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;

    if (
      (req.query.limit !== undefined && (!Number.isInteger(limit) || limit < 0)) ||
      (req.query.offset !== undefined && (!Number.isInteger(offset) || offset < 0))
    ) {
      return res.status(400).json({
        error: "Los parámetros 'limit' y 'offset' deben ser números enteros mayores o iguales que 0.",
      });
    }

    db.find(query).skip(offset).limit(limit).exec((err, docs) => {
      if (err) {
        return res.status(500).json({ error: "Error en la base de datos." });
      }

      return res.status(200).json(parseaIdArray(docs));
    });
  });

  // POST colección: SOLO CAMPOS BASE
  app.post(EBP_API_PATH, (req, res) => {
    const body = req.body;

    if (!propiedadesIndividuales(body)) {
      return res.status(400).json({
        error:
          "El JSON debe contener exactamente estos campos: year, country, recreation_value, total_household_consumption y population.",
      });
    }

    const normalized = parseaDatos(body);
    const validationError = validateBaseData(normalized);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    db.findOne(
      { country: normalized.country, year: normalized.year },
      (err, doc) => {
        if (err) {
          return res.status(500).json({ error: "Error en la base de datos." });
        }

        if (doc) {
          return res.status(409).json({
            error: "El recurso ya existe para ese país y año.",
          });
        }

        const finalData = propiedadesDerivadas(normalized);

        db.insert(finalData, (err, insertedDoc) => {
          if (err) {
            return res.status(500).json({ error: "Error insertando el recurso." });
          }

          return res.status(201).json(parseaId(insertedDoc));
        });
      }
    );
  });

  // DELETE colección
  app.delete(EBP_API_PATH, (req, res) => {
    db.remove({}, { multi: true }, (err, numRemoved) => {
      if (err) {
        return res.status(500).json({ error: "Error borrando datos." });
      }

      if (numRemoved === 0) {
        return res.status(404).json({ error: "No hay datos para borrar." });
      }

      return res.status(200).json({
        message: "Datos eliminados correctamente.",
        deleted: numRemoved,
      });
    });
  });

  // PUT colección no permitido
  app.put(EBP_API_PATH, (req, res) => {
    return res.status(405).json({
      error: "Método PUT no permitido en la colección.",
    });
  });

  // GET recurso individual
  app.get(EBP_API_PATH + "/:country/:year", (req, res) => {
    const country = String(req.params.country);
    const year = parseInt(req.params.year);

    db.findOne({ country, year }, (err, resource) => {
      if (err) {
        return res.status(500).json({ error: "Error en la base de datos." });
      }

      if (!resource) {
        return res.status(404).json({ error: "Recurso no encontrado." });
      }

      return res.status(200).json(parseaId(resource));
    });
  });

  // PUT recurso individual: SOLO CAMPOS BASE
  app.put(EBP_API_PATH + "/:country/:year", (req, res) => {
    const country = String(req.params.country);
    const year = parseInt(req.params.year);
    const body = req.body;

    if (!propiedadesIndividuales(body)) {
      return res.status(400).json({
        error:
          "El JSON debe contener exactamente estos campos: year, country, recreation_value, total_household_consumption y population.",
      });
    }

    const normalized = parseaDatos(body);

    if (normalized.country !== country || normalized.year !== year) {
      return res.status(400).json({
        error: "El ID del recurso no coincide con la URL.",
      });
    }

    const validationError = validateBaseData(normalized);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const updatedResource = propiedadesDerivadas(normalized);

    db.update({ country, year }, updatedResource, {}, (err, numReplaced) => {
      if (err) {
        return res.status(500).json({ error: "Error actualizando el recurso." });
      }

      if (numReplaced === 0) {
        return res.status(404).json({
          error: "Recurso no encontrado para actualizar.",
        });
      }

      return res.status(200).json({
        message: "Recurso actualizado con éxito.",
      });
    });
  });

  // DELETE recurso individual
  app.delete(EBP_API_PATH + "/:country/:year", (req, res) => {
    const country = String(req.params.country);
    const year = parseInt(req.params.year);

    db.remove({ country, year }, {}, (err, numRemoved) => {
      if (err) {
        return res.status(500).json({ error: "Error eliminando el recurso." });
      }

      if (numRemoved === 0) {
        return res.status(404).json({
          error: "Recurso no encontrado para eliminar.",
        });
      }

      return res.status(200).json({
        message: "Recurso eliminado correctamente.",
      });
    });
  });

  // POST recurso individual no permitido
  app.post(EBP_API_PATH + "/:country/:year", (req, res) => {
    return res.status(405).json({
      error: "No se permite POST sobre un recurso concreto.",
    });
  });

  // Ruta de documentación
  app.get(EBP_API_PATH + "/docs", (req, res) => {
    return res.redirect(301, DOCS_URL);
  });
}

export { loadBackendElenav2 };