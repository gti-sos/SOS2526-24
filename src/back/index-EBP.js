//Importamos base de datos nedb
import dataStore from "nedb";

// Constantes de RUTAS
let BASE_URL_API = "/api/v1";
let EBP_API_PATH = BASE_URL_API + "/recreation-culture-expenditure";

//VARIABLE BASE DE DATOS (en memoria)
let db = new dataStore({
  filename: "./src/back/recreation-culture-expenditure.db",
  autoload: true,
});

//Declaración de DATOS INICIALES
const datos = [
  { year: 2024, country: "Canada", recreation_value: 127727000000, total_household_consumption: 1654821000000, recreation_share: 7.72, population: 41288599, recreation_per_capita: 3093.52 },
  { year: 2023, country: "Canada", recreation_value: 124522000000, total_household_consumption: 1572103000000, recreation_share: 7.92, population: 40083484, recreation_per_capita: 3106.57 },
  { year: 2022, country: "Canada", recreation_value: 118767000000, total_household_consumption: 1488875000000, recreation_share: 7.98, population: 38935934, recreation_per_capita: 3050.32 },
  { year: 2022, country: "Germany", recreation_value: 187327000000, total_household_consumption: 2017981000000, recreation_share: 9.28, population: 83177813, recreation_per_capita: 2252.13 },
  { year: 2023, country: "Ireland", recreation_value: 9931000000, total_household_consumption: 140665460000, recreation_share: 7.06, population: 5311538, recreation_per_capita: 1869.7 },
  { year: 2022, country: "Ireland", recreation_value: 8954000000, total_household_consumption: 124192688000, recreation_share: 7.21, population: 5212836, recreation_per_capita: 1717.68 },
  { year: 2023, country: "Italy", recreation_value: 85658000000, total_household_consumption: 1218946100000, recreation_share: 7.03, population: 58984216, recreation_per_capita: 1452.22 },
  { year: 2022, country: "Italy", recreation_value: 79846000000, total_household_consumption: 1156909900000, recreation_share: 6.9, population: 59013667, recreation_per_capita: 1353.01 },
  { year: 2023, country: "Poland", recreation_value: 118473000000, total_household_consumption: 1934063000000, recreation_share: 6.13, population: 36687353, recreation_per_capita: 3229.26 },
  { year: 2022, country: "Poland", recreation_value: 101603000000, total_household_consumption: 1772069000000, recreation_share: 5.73, population: 36821749, recreation_per_capita: 2759.32 },
  { year: 2022, country: "Spain", recreation_value: 63671000000, total_household_consumption: 759001000000, recreation_share: 8.39, population: 47786102, recreation_per_capita: 1332.42 },
  { year: 2024, country: "United Kingdom", recreation_value: 158522000000, total_household_consumption: 1706364000000, recreation_share: 9.29, population: 69226000, recreation_per_capita: 2289.92 },
  { year: 2023, country: "United Kingdom", recreation_value: 151870000000, total_household_consumption: 1646716000000, recreation_share: 9.22, population: 68492000, recreation_per_capita: 2217.34 },
  { year: 2022, country: "United Kingdom", recreation_value: 149789000000, total_household_consumption: 1534744000000, recreation_share: 9.76, population: 67604000, recreation_per_capita: 2215.68 },
  { year: 2023, country: "United States", recreation_value: 1797911000000, total_household_consumption: 18268702000000, recreation_share: 9.84, population: 336806231, recreation_per_capita: 5338.12 }
];

// ---- FUNCIONES AUXILIARES ----
function sanitize(doc) {
  const { _id, ...cleanDoc } = doc;
  // Elimina el campo interno _id de cada documento antes de enviarlos
  return cleanDoc;
}

function sanitizeArray(docs) {
  // Elimina el campo interno _id de cada documento antes de enviarlos
  return docs.map(sanitize);
}

// ---- FUNCION BACKEND ----
function loadBackendElena(app) {
  const initialDatosEBP = datos;

  // INICIALIZACIÓN DE DATOS
  app.get(EBP_API_PATH + "/loadInitialData", (req, res) => {
    //Cuenta cuántos documentos hay en la colección
    db.count({}, (err, count) => {
      //ERROR BASE DE DATOS 500
      if (err) return res.status(500).json({error: "Error al acceder a la base de datos"});

      if (count === 0) {
        db.insert(initialDatosEBP, (err, newDocs) => {
          //ERROR INSERTAR BASE DE DATOS 500
          if (err) return res.status(500).json({error: "Error insertando datos en la base."});
          //201 CREATED
          return res.status(201).json(sanitizeArray(newDocs));
        });
      } else {
        return res.status(409).json({error: "La base de datos ya contiene datos." });
      }
    });
  });

  // ########### DATOS ##############

  // GET colección completa, por país o por año y paginación
  app.get(EBP_API_PATH, (req, res) => {
    let query = {};

    const hasCountry = req.query.country !== undefined;
    const hasYear = req.query.year !== undefined;

    // Si mandan country y year a la vez, no lo permites aquí
    if (hasCountry && hasYear) {
      return res.status(400).json({
        error: "No se permite filtrar por country y year a la vez en la colección. Usa /api/v1/recreation-culture-expenditure/:country/:year"
      });
    }

    // Solo por país
    if (hasCountry) {
      query.country = String(req.query.country);
    }

    // Solo por año
    if (hasYear) {
      query.year = parseInt(req.query.year);
    }

    //PAGINACIÓN
    let limit = req.query.limit ? parseInt(req.query.limit) : 0;
    let offset = req.query.offset ? parseInt(req.query.offset) : 0;

    db.find(query).skip(offset).limit(limit).exec((err, docs) => {
      if (err) {
        return res.status(500).json({ error: "Error en la base de datos." });
      }

      const cleanDocs = docs.map(sanitize);
      return res.status(200).json(cleanDocs);
    });
  });

  // POST datos codigo 400
  app.post(EBP_API_PATH, (req, res) => {
    const newData = req.body;

    // Validación campos obligatorios
    if (
      !newData ||
      newData.year === undefined ||
      !newData.country ||
      newData.recreation_value === undefined ||
      newData.total_household_consumption === undefined ||
      newData.recreation_share === undefined ||
      newData.population === undefined ||
      newData.recreation_per_capita === undefined
    ) {
      return res
        .status(400)
        .json({ error: "Datos incompletos o incorrectos." }); //Datos incompletos
    }

    if (newData._id !== undefined) {
      return res.status(400).json({ error: "No se permite enviar _id." });
    }

    const country = String(newData.country);
    const year = parseInt(newData.year);

    //Búsqueda del recurso
    db.findOne({ country: country, year: year }, (err, doc) => {
      if (err) return res.status(500).json({ error: "Error en la base de datos." });

      if (doc) {
        return res.status(409).json({ error: "El recurso ya existe para ese país y año." });
      }

    const normalized = {
      year,
      country,
      recreation_value: Number(newData.recreation_value),
      total_household_consumption: Number(newData.total_household_consumption),
      recreation_share: Number(newData.recreation_share),
      population: Number(newData.population),
      recreation_per_capita: Number(newData.recreation_per_capita),
    };

    db.insert(normalized, (err, insertedDoc) => {
        if (err) return res.status(500).json({ error: "Error insertando el recurso." });
        //Dato insertado con éxito
        return res.status(201).json(sanitize(insertedDoc));
      });
    });
  });

  // DELETE datos codigo 200
  app.delete(EBP_API_PATH, (req, res) => {
    //Borrado de la base de datos
    db.remove({}, { multi: true }, (err, numRemoved) => {
      if (err) return res.status(500).json({ error: "Error borrando datos." });

      res.status(200).json({
        message: "Datos eliminados correctamente.",
        deleted: numRemoved
      });
    });
  });

  // PUT datos no permitido
  app.put(EBP_API_PATH, (req, res) => {
    res.status(405).json({ error: "Método PUT no permitido en los datos." });
  });

  // ########### RECURSOS INDIVIDUALES ##############
  // GET recurso codigo 200
  app.get(EBP_API_PATH + "/:country/:year", (req, res) => {
    const country = String(req.params.country);
    const year = parseInt(req.params.year);

    db.findOne({ country: country, year: year }, (err, resource) => {
      if (err) return res.status(500).json({ error: "Error en la base de datos." });
      if (!resource) return res.status(404).json({ error: "Recurso no encontrado." });
      
      res.status(200).json(sanitize(resource)); //Recurso encontrado
    });
  });

  // PUT recurso codigo 400
  app.put(EBP_API_PATH + "/:country/:year", (req, res) => {
    const country = String(req.params.country);
    const year = parseInt(req.params.year);
    const body = req.body;

    // El ID del body debe coincidir con la URL
    if (
      !body ||
      String(body.country) !== country ||
      parseInt(body.year) !== year
    ) {
      return res.status(400).json({ error: "El ID del recurso no coincide con la URL." });
    }

    if (
      body.recreation_value === undefined ||
      body.total_household_consumption === undefined ||
      body.recreation_share === undefined ||
      body.population === undefined ||
      body.recreation_per_capita === undefined
    ) {
      return res.status(400).json({ error: "Datos incompletos o incorrectos." });
    }

    if (body._id !== undefined) {
      return res.status(400).json({ error: "No se permite enviar _id." });
    }

    const updatedResource = {
      year,
      country,
      recreation_value: Number(body.recreation_value),
      total_household_consumption: Number(body.total_household_consumption),
      recreation_share: Number(body.recreation_share),
      population: Number(body.population),
      recreation_per_capita: Number(body.recreation_per_capita)
    };

    db.update({ country: country, year: year }, updatedResource, {}, (err, numReplaced) => {
      if (err) return res.status(500).json({ error: "Error actualizando el recurso." });

      if (numReplaced === 0) {
        return res.status(404).json({ error: "Recurso no encontrado para actualizar." });
      }

      res.status(200).json({ message: "Recurso actualizado con éxito." });
    });
  });

  // DELETE recurso codigo 200
  app.delete(EBP_API_PATH + "/:country/:year", (req, res) => {
    const country = String(req.params.country);
    const year = parseInt(req.params.year);

    db.remove({ country: country, year: year }, {}, (err, numRemoved) => {
      if (err) return res.status(500).json({ error: "Error eliminando el recurso." });

      if (numRemoved === 0) {
        return res.status(404).json({ error: "Recurso no encontrado para eliminar." });
      }

      res.status(200).json({ message: "Recurso eliminado correctamente." });
    });
  });

  // POST recurso no permitido
  app.post(EBP_API_PATH + "/:country/:year", (req, res) => {
    res
      .status(405)
      .json({ error: "No se permite POST sobre un recurso concreto." });
  });
}

export {loadBackendElena};