
let BASE_URL_API = "/api/v1";
let EBP_API_PATH = BASE_URL_API + "/recreation-culture-expenditure"; 

//función
function loadBackendElena(app){

//Declaración de los datos
const datos = [
  { year: 2024, country: "Canada", recreation_exp: 127727000000, total_exp: 1654821000000, percentage: 7.72, population: 41288599, per_capita: 3093.52 },
  { year: 2023, country: "Canada", recreation_exp: 124522000000, total_exp: 1572103000000, percentage: 7.92, population: 40083484, per_capita: 3106.57 },
  { year: 2022, country: "Canada", recreation_exp: 118767000000, total_exp: 1488875000000, percentage: 7.98, population: 38935934, per_capita: 3050.32 },
  { year: 2022, country: "Germany", recreation_exp: 187327000000, total_exp: 2017981000000, percentage: 9.28, population: 83177813, per_capita: 2252.13 },
  { year: 2023, country: "Ireland", recreation_exp: 9931000000, total_exp: 140665460000, percentage: 7.06, population: 5311538, per_capita: 1869.70 },
  { year: 2022, country: "Ireland", recreation_exp: 8954000000, total_exp: 124192688000, percentage: 7.21, population: 5212836, per_capita: 1717.68 },
  { year: 2023, country: "Italy", recreation_exp: 85658000000, total_exp: 1218946100000, percentage: 7.03, population: 58984216, per_capita: 1452.22 },
  { year: 2022, country: "Italy", recreation_exp: 79846000000, total_exp: 1156909900000, percentage: 6.90, population: 59013667, per_capita: 1353.01 },
  { year: 2023, country: "Poland", recreation_exp: 118473000000, total_exp: 1934063000000, percentage: 6.13, population: 36687353, per_capita: 3229.26 },
  { year: 2022, country: "Poland", recreation_exp: 101603000000, total_exp: 1772069000000, percentage: 5.73, population: 36821749, per_capita: 2759.32 },
  { year: 2022, country: "Spain", recreation_exp: 63671000000, total_exp: 759001000000, percentage: 8.39, population: 47786102, per_capita: 1332.42 },
  { year: 2024, country: "United Kingdom", recreation_exp: 158522000000, total_exp: 1706364000000, percentage: 9.29, population: 69226000, per_capita: 2289.92 },
  { year: 2023, country: "United Kingdom", recreation_exp: 151870000000, total_exp: 1646716000000, percentage: 9.22, population: 68492000, per_capita: 2217.34 },
  { year: 2022, country: "United Kingdom", recreation_exp: 149789000000, total_exp: 1534744000000, percentage: 9.76, population: 67604000, per_capita: 2215.68 },
  { year: 2023, country: "United States", recreation_exp: 1797911000000, total_exp: 18268702000000, percentage: 9.84, population: 336806231, per_capita: 5338.12 }
];

//Elegimos el valor geográfico
const countryTarget= "Canada";

//Filtramos
const fitrados = datos.filter(d => d.country == countryTarget);

//Calculamos la media
const mediaConsumoPaisPorHogar= fitrados.map( d => d.per_capita)
        .reduce((acum, valor) => acum + valor, 0) / fitrados.length;

//Mostramos el resultado
//console.log(`Media del gasto por hogar en ocio en ${countryTarget}: ${mediaConsumoPaisPorHogar.toFixed(2)}`)





function loadBackendElena(app){
  let BASE_URL_API = "/api/v1";
  let EBP_API_PATH = BASE_URL_API + "/recreation-culture-expenditure"; 
 
  let datosEBP=[]
  const initialDatosEBP = datos; 


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


//tu codigo del samples (creo que hay que quitarlo pero lo meto por si acaso)


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
}
}

export {loadBackendElena}