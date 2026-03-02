let cool = require("cool-ascii-faces");
console.log(cool());

let express = require("express");
let bodyParser = require("body-parser");

//Importacion de modulos
const irg = require("./index-IRG.js");
const mjp = require("./index-MJP.js");


const app = express();
let BASE_URL_API = "/api/v1";
let MJP_API_PATH = BASE_URL_API + "/average-monthly-wages"; 
let IRG_API_PATH=BASE_URL_API+"/international-construccion-costs"
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
    const datos = mjp.datosMaria; // Cogemos el array que exportaste
    const targetCountry = "canada";

    // Replicamos el algoritmo:
    const canadaRows = datos.filter((row) => row.country === targetCountry);
    
    let totalUsd = 0;
    canadaRows.forEach((row) => {
        totalUsd += row.avg_monthly_usd;
    });

    const averageUsd = totalUsd / canadaRows.length;

    // Enviamos la respuesta al navegador
    res.send(`
        <html>
            <head><title>Algoritmo MJP</title></head>
            <body>
                <h1>Resultado del Algoritmo (MJP)</h1>
                <p><b>País analizado:</b> ${targetCountry.toUpperCase()}</p>
                <p><b>Registros encontrados:</b> ${canadaRows.length}</p>
                <p><b>Media del salario mensual:</b> ${averageUsd.toFixed(2)} USD</p>
                <hr>
                <a href="/about">Volver al About</a>
            </body>
        </html>
    `);
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
        res.status(400).json({ error: "El array ya contiene datos." }); // 400 Bad Request
    }
});


app.get(IRG_API_PATH, (req, res) => {
    res.status(200).json(datosIrg); // 200 OK
});


app.post(IRG_API_PATH, (req, res) => {
    const newData = req.body;
    // Validación: Comprobar campos obligatorios
    if (!newData || !newData.country || !newData.year || !newData.city || !newData.cost_usd_per_m2 || !newData.cost_change_range || !newData.rank) {
        return res.status(400).json({ error: "Datos incompletos o incorrectos." });
    }
    // Validación: Comprobar duplicados (409 Conflict)
    const exists = datosIrg.some(d => d.country === newData.country && d.year === parseInt(newData.year) && newData.city===d.city);
    if (exists) {
        res.status(409).json({ error: "El recurso ya existe para ese país y año y ciudad." });
    } else {
        datosIrg.push(newData);
        res.status(201).json({ message: "Recurso creado con éxito." });
    }
});


app.delete(IRG_API_PATH, (req, res) => {
    datosIrg = [];
    res.status(200).json({ message: "Colección eliminada correctamente." });
});



app.put(IRG_API_PATH, (req, res) => {
    res.status(405).json({ error: "Método PUT no permitido en la lista completa." }); // 405 Method Not Allowed
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
    res.status(404).json({ error: "Recurso no encontrado." });
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
      error: "El ID del recurso no coincide con la URL."
    });
  }

  const index = datosIrg.findIndex(d =>
    sameId(d, country, yearNum, city)
  );

  if (index !== -1) {
    datosIrg[index] = body;
    res.status(200).json({ message: "Recurso actualizado con éxito." });
  } else {
    res.status(404).json({ error: "Recurso no encontrado para actualizar." });
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
    error: "No se permite POST sobre un recurso concreto."
  });

});
