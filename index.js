let cool = require("cool-ascii-faces");
console.log(cool());

let express = require("express");
let bodyParser = require("body-parser");

//Importacion de modulos
const irg = require("./index-IRG.js");
const mjp = require("./index-MJP.js");
const ebp = require("./index-EBP.js")


const app = express();
let BASE_URL_API = "/api/v1";
let MJP_API_PATH = BASE_URL_API + "/average-monthly-wages";
let IRG_API_PATH = BASE_URL_API+"/international-construccion-costs"; 
let EBP_API_PATH = BASE_URL_API + "/recreation-culture-expenditure"; 
const port = process.env.PORT || 3000;


//Datos
let datosMaria = [];

let initialDatosMaria = [
    { year: 2024, country: "canada", avg_monthly_nc: 6926.7, avg_monthly_usd: 5056.8, currency: "CAD" },
    { year: 2023, country: "canada", avg_monthly_nc: 6750.4, avg_monthly_usd: 5001.8, currency: "CAD" },
    { year: 2022, country: "canada", avg_monthly_nc: 6513.1, avg_monthly_usd: 5004.2, currency: "CAD" },
    { year: 2023, country: "usa", avg_monthly_nc: 6678.3, avg_monthly_usd: 6678.3, currency: "USD" },
    { year: 2024, country: "uk", avg_monthly_nc: 3733.8, avg_monthly_usd: 4771.6, currency: "GBP" },
    { year: 2022, country: "spain", avg_monthly_nc: 2531.6, avg_monthly_usd: 2662.2, currency: "EUR" },
    { year: 2023, country: "ireland", avg_monthly_nc: 4496.2, avg_monthly_usd: 4862.3, currency: "EUR" },
    { year: 2023, country: "poland", avg_monthly_nc: 6873.8, avg_monthly_usd: 1636.4, currency: "PLN" },
    { year: 2023, country: "italy", avg_monthly_nc: 2704.2, avg_monthly_usd: 2924.4, currency: "EUR" },
    { year: 2022, country: "germany", avg_monthly_nc: 3790.4, avg_monthly_usd: 3986.0, currency: "EUR" }
];


let datosIrg=[]
const datosIsaac = irg.datosIsaac; 


let datosEBP=[]
const initialDatosEBP = ebp.datos; 



app.use("/", express.static("./public")); 
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.get("/cool", (req, res) => {
    res.send("<html><body><h1>" + cool() + "</h1></body></html>");
});

app.get("/samples/IRG", (req, res) => {
    const pais = "Canada";

    const filtrados = datosIsaac.filter(d => d.country === pais);

    if (filtrados.length === 0) {
        return res.send("No hay datos para ese país.");
    }

    const listaCiudades = [];
    filtrados.forEach(d => {
        if (!listaCiudades.includes(d.city)) {
            listaCiudades.push(d.city);
        }
    });

    const mediaCostoM2 = filtrados.reduce((acum, valor) => acum + valor.cost_usd_per_m2, 0) / filtrados.length;

    const mensaje = `Media del costo m2 en ${pais} tomando las ciudades ${listaCiudades.join(", ")}: ${mediaCostoM2.toFixed(2)} USD`;
    
    res.send(`<h1>Resultado del Algoritmo (IRG)</h1><p>${mensaje}</p>`);
});




// REQUISITO F04: Algoritmo de María Jesús (MJP)
app.get("/samples/MJP", (req, res) => {
    const datos = mjp.datosMaria; 
    const targetCountry = "canada";

    const canadaRows = datos.filter((row) => row.country === targetCountry);
    
    if (canadaRows.length === 0) {
        return res.status(404).json({
            error: "No se encontraron datos para el país especificado."
        });
    }

    let totalUsd = 0;
    canadaRows.forEach((row) => {
        totalUsd += row.avg_monthly_usd;
    });

    const averageUsd = totalUsd / canadaRows.length;

    // Enviamos un objeto JSON con los resultados
    res.status(200).json({
        sample: "MJP",
        country: targetCountry,
        records_found: canadaRows.length,
        average_monthly_usd: Number(averageUsd.toFixed(2)),
        explanation: `La media del salario mensual en ${targetCountry} es de ${averageUsd.toFixed(2)} USD.`
    });
});

//Algoritmo de index-EBP.js
app.get("/samples/EBP", (req, res) => {
    const countryTarget = "Canada";

    const filtrados = ebp.datos.filter(d => d.country === countryTarget);

    if (filtrados.length === 0) {
        return res.status(404).json({ error: "No hay datos para ese país." });
    }

    const media = filtrados
        .map(d => d.per_capita)
        .reduce((acum, valor) => acum + valor, 0) / filtrados.length;

    const resultado = Number(media.toFixed(2));

    res.status(200).json({
        sample: "EBP",
        country: countryTarget,
        registros: filtrados.length,
        average_per_capita: resultado,
        message: `Media del gasto por hogar en ocio en ${countryTarget}: ${resultado}`
    });
});

// 1. GET /loadInitialData - Carga los 10 datos si está vacío
app.get(MJP_API_PATH + "/loadInitialData", (req, res) => {
    if (datosMaria.length === 0) {
        datosMaria = [...initialDatosMaria];
        res.status(201).json(datosMaria); // 201 Created
    } else {
        res.status(400).json({ error: "El array ya contiene datos." }); // 400 Bad Request
    }
});

// 2. Operaciones sobre la COLECCIÓN (Lista completa)
app.get(MJP_API_PATH, (req, res) => {
    res.status(200).json(datosMaria); // 200 OK
});

app.post(MJP_API_PATH, (req, res) => {
    const newData = req.body;
    // Validación: Comprobar campos obligatorios
    if (!newData || !newData.country || !newData.year || !newData.avg_monthly_nc || !newData.avg_monthly_usd || !newData.currency) {
        return res.status(400).json({ error: "Datos incompletos o incorrectos." });
    }
    // Validación: Comprobar duplicados (409 Conflict)
    const exists = datosMaria.some(d => d.country === newData.country && d.year === parseInt(newData.year));
    if (exists) {
        res.status(409).json({ error: "El recurso ya existe para ese país y año." });
    } else {
        datosMaria.push(newData);
        res.status(201).json({ message: "Recurso creado con éxito." });
    }
});

app.delete(MJP_API_PATH, (req, res) => {
    datosMaria = [];
    res.status(200).json({ message: "Colección eliminada correctamente." });
});

app.put(MJP_API_PATH, (req, res) => {
    res.status(405).json({ error: "Método PUT no permitido en la lista completa." }); // 405 Method Not Allowed
});
// 3. Operaciones sobre RECURSOS INDIVIDUALES (/:país/:año)
app.get(MJP_API_PATH + "/:country/:year", (req, res) => {
    const { country, year } = req.params;
    const resource = datosMaria.find(d => d.country === country && d.year === parseInt(year));
    if (resource) {
        res.status(200).json(resource);
    } else {
        res.status(404).json({ error: "Recurso no encontrado." }); // 404 Not Found
    }
});


app.put(MJP_API_PATH + "/:country/:year", (req, res) => {
    const { country, year } = req.params;
    const body = req.body;
    // El ID de la URL y el del JSON deben coincidir según los patrones SOS
    if (country !== body.country || parseInt(year) !== body.year) {
        return res.status(400).json({ error: "El ID del recurso no coincide con la URL." });
    }
    const index = datosMaria.findIndex(d => d.country === country && d.year === parseInt(year));
    if (index !== -1) {
        datosMaria[index] = body;
        res.status(200).json({ message: "Recurso actualizado con éxito." });
    } else {
        res.status(404).json({ error: "Recurso no encontrado para actualizar." });
    }
});

app.delete(MJP_API_PATH + "/:country/:year", (req, res) => {
    const { country, year } = req.params;
    const initialLen = datosMaria.length;
    datosMaria = datosMaria.filter(d => !(d.country === country && d.year === parseInt(year)));
    if (datosMaria.length < initialLen) {
        res.status(200).json({ message: "Recurso eliminado correctamente." });
    } else {
        res.status(404).json({ error: "Recurso no encontrado para eliminar." });
    }
});

app.post(MJP_API_PATH + "/:country/:year", (req, res) => {
    res.status(405).json({ error: "No se permite POST sobre un recurso concreto." });
});



app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});




///////////////////////////////////////////////////





app.get(IRG_API_PATH+"/loadInitialData", (req, res) => {
    if (datosIrg.length === 0) {
        datosIrg = [...datosIsaac];
        res.status(201).json(datosIrg); // 201 Created
    } else {
        res.status(409).json({ error: "El array ya contiene datos." }); // 400 Bad Request
    }
});


app.get(IRG_API_PATH, (req, res) => {
    res.status(200).json(datosIrg); // 200 OK
});


app.post(IRG_API_PATH, (req, res) => {
    const newData = req.body;
    // Validación: Comprobar campos obligatorios
    if (!newData || !newData.country || !newData.year || !newData.city || !newData.cost_usd_per_m2 || !newData.cost_change_range || !newData.rank) {
        return res.status(400).json({ error: "Datos incompletos o incorrectos.,error 400" });
    }
    // Validación: Comprobar duplicados (409 Conflict)
    const exists = datosIrg.some(d => d.country === newData.country && d.year === parseInt(newData.year) && newData.city===d.city);
    if (exists) {
        res.status(409).json({ error: "El recurso ya existe para ese país y año y ciudad., error 409" });
    } else {
        datosIrg.push(newData);
        res.status(201).json({ message: "Recurso creado con éxito. codigo 201" });
    }
});


app.delete(IRG_API_PATH, (req, res) => {
    datosIrg = [];
    res.status(200).json({ message: "Colección eliminada correctamente. codigo 200" });
});



app.put(IRG_API_PATH, (req, res) => {
    res.status(405).json({ error: "Método PUT no permitido en la lista completa, error 405." }); // 405 Method Not Allowed
});




/////////////////////////////////////////////////

const sameId = (d, country, year, city) =>
  d.country === country &&
  d.year === year &&
  d.city === city;

// GET individual
app.get(IRG_API_PATH + "/:country/:year/:city", (req, res) => {
  const { country, year, city } = req.params;
  const yearNum = parseInt(year, 10);

  const resource = datosIrg.find(d =>
    sameId(d, country, yearNum, city)
  );

  if (resource) {
    res.status(200).json(resource);
  } else {
    res.status(404).json({ error: "Recurso no encontrado. error 404" });
  }
});

// PUT individual
app.put(IRG_API_PATH + "/:country/:year/:city", (req, res) => {
  const { country, year, city } = req.params;
  const yearNum = parseInt(year, 10);
  const body = req.body;

  if (
    !body ||
    body.country !== country ||
    body.year !== yearNum ||
    body.city !== city
  ) {
    return res.status(400).json({
      error: "El ID del recurso no coincide con la URL., error 400"
    });
  }

  const index = datosIrg.findIndex(d =>
    sameId(d, country, yearNum, city)
  );

  if (index !== -1) {
    datosIrg[index] = body;
    res.status(200).json({ message: "Recurso actualizado con éxito." });
  } else {
    res.status(404).json({ error: "Recurso no encontrado para actualizar. codigo 404" });
  }
});

// DELETE individual
app.delete(IRG_API_PATH + "/:country/:year/:city", (req, res) => {
  const { country, year, city } = req.params;
  const yearNum = parseInt(year, 10);

  const initialLen = datosIrg.length;

  datosIrg = datosIrg.filter(d =>
    !sameId(d, country, yearNum, city)
  );

  if (datosIrg.length < initialLen) {
    res.status(200).json({ message: "Recurso eliminado correctamente." });
  } else {
    res.status(404).json({ error: "Recurso no encontrado para eliminar." });
  }
});

// POST individual no permitido
app.post(IRG_API_PATH + "/:country/:year/:city", (req, res) => {
  res.status(405).json({
    error: "No se permite POST sobre un recurso concreto, error 405."
  });

});


// ========================
// EBP (recreation-culture-expenditure) DATA
// ========================

//Inicialización de datos
app.get(EBP_API_PATH + "/loadInitialData", (req, res) => {
  if (datosEBP.length === 0) {
    datosEBP = [...initialDatosEBP];
    return res.status(201).json(datosEBP); // 201 Created
  }
  return res.status(409).json({ error: "El array ya contiene datos." }); // 400
});

// ########### DATOS ##############
// GET datos codigo 200
app.get(EBP_API_PATH, (req, res) => {
  res.status(200).json(datosEBP);
});

// POST datos codigo 400
app.post(EBP_API_PATH, (req, res) => {
  const newData = req.body;

  // Validación campos obligatorios
  if (!newData ||
      newData.year === undefined ||
      !newData.country ||
      newData.recreation_value === undefined ||
      newData.total_household_consumption === undefined ||
      newData.recreation_share === undefined ||
      newData.population === undefined ||
      newData.recreation_per_capita === undefined) {
    return res.status(400).json({ error: "Datos incompletos o incorrectos." });
  }

  const country = String(newData.country);
  const year = parseInt(newData.year);

  const exists = datosEBP.some(d => d.country === country && d.year === year);
  if (exists) return res.status(409).json({ error: "El recurso ya existe para ese país y año." });

  const normalized = {
    year,
    country,
    recreation_value: Number(newData.recreation_value),
    total_household_consumption: Number(newData.total_household_consumption),
    recreation_share: Number(newData.recreation_share),
    population: Number(newData.population),
    recreation_per_capita: Number(newData.recreation_per_capita)
  };

  datosEBP.push(normalized);
  return res.status(201).json({ message: "Recurso creado con éxito." });
});

// DELETE datos codigo 200
app.delete(EBP_API_PATH, (req, res) => {
  datosEBP = [];
  res.status(200).json({ message: "Datos eliminados correctamente." });
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

  const resource = datosEBP.find(d => d.country === country && d.year === year);
  if (!resource) return res.status(404).json({ error: "Recurso no encontrado." });

  res.status(200).json(resource);
});

// PUT recurso codigo 400
app.put(EBP_API_PATH + "/:country/:year", (req, res) => {
  const country = String(req.params.country);
  const year = parseInt(req.params.year);
  const body = req.body;

  // El ID del body debe coincidir con la URL
  if (!body || String(body.country) !== country || parseInt(body.year) !== year) {
    return res.status(400).json({ error: "El ID del recurso no coincide con la URL." });
  }

  const index = datosEBP.findIndex(d => d.country === country && d.year === year);
  if (index === -1) return res.status(404).json({ error: "Recurso no encontrado para actualizar." });

  datosEBP[index] = {
    year,
    country,
    recreation_value: Number(body.recreation_value),
    total_household_consumption: Number(body.total_household_consumption),
    recreation_share: Number(body.recreation_share),
    population: Number(body.population),
    recreation_per_capita: Number(body.recreation_per_capita)
  };

  res.status(200).json({ message: "Recurso actualizado con éxito." });
});

// DELETE recurso codigo 200
app.delete(EBP_API_PATH + "/:country/:year", (req, res) => {
  const country = String(req.params.country);
  const year = parseInt(req.params.year);

  const before = datosEBP.length;
  datosEBP = datosEBP.filter(d => !(d.country === country && d.year === year));

  if (datosEBP.length === before) return res.status(404).json({ error: "Recurso no encontrado para eliminar." });

  res.status(200).json({ message: "Recurso eliminado correctamente." });
});

// POST recurso no permitido
app.post(EBP_API_PATH + "/:country/:year", (req, res) => {
  res.status(405).json({ error: "No se permite POST sobre un recurso concreto." });
});