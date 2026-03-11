const datosIsaac = [
  { year: 2024, country: "USA", city: "New York", cost_usd_per_m2: 5723, cost_change_range: "5%", rank: 1 },
  { year: 2024, country: "Canada", city: "Toronto", cost_usd_per_m2: 2973, cost_change_range: "5.01%", rank: 24 },
  { year: 2024, country: "uk", city: "London", cost_usd_per_m2: 4473, cost_change_range: "15%", rank: 5 },
  { year: 2024, country: "Spain", city: "Madrid", cost_usd_per_m2: 2205, cost_change_range: "2.13%", rank: 48 },
  { year: 2023, country: "Canada", city: "Vancouver", cost_usd_per_m2: 2870, cost_change_range: "7%", rank: 30 },
  { year: 2023, country: "Italy", city: "Milan", cost_usd_per_m2: 2689, cost_change_range: "-9.31%", rank: 46 },
  { year: 2023, country: "Ireland", city: "Dublin", cost_usd_per_m2: 3708, cost_change_range: "-1.75%", rank: 19 },
  { year: 2023, country: "Germany", city: "Munich", cost_usd_per_m2: 3787, cost_change_range: "17.65%", rank: 17 },
  { year: 2022, country: "Poland", city: "Wasaw", cost_usd_per_m2: 1667, cost_change_range: "30.16%", rank: 59 },
  { year: 2023, country: "USA", city: "New York", cost_usd_per_m2: 5451, cost_change_range: "5%", rank: 4 },
  { year: 2023, country: "Canada", city: "Toronto", cost_usd_per_m2: 2834, cost_change_range: "5%", rank: 26 }
];

const pais = "Canada";

// 1. Filtramos los datos para tenerlos listos
const filtrados = datosIsaac.filter(d => d.country === pais);

// 2. Creamos la lista de ciudades (solo si no están ya en el array)
const listaCiudades = [];
filtrados.forEach(d => {
    if (!listaCiudades.includes(d.city)) {
        listaCiudades.push(d.city);
    }
});

// 3. Tu cálculo de la media (tal cual lo tenías)
const mediaCostoM2 = filtrados.reduce((acum, valor) => acum + valor.cost_usd_per_m2, 0) / filtrados.length;

// 4. Resultado
// console.log(`Media del costo m2 en ${pais} tomando las ciudades ${listaCiudades.join(", ")}: ${mediaCostoM2.toFixed(2)} USD`);






function loadBackendIsaac(app){
   
//rutas
let BASE_URL_API = "/api/v1";
let IRG_API_PATH = BASE_URL_API+"/international-construccion-costs"; 

let datosIrg=[]




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

}


export{loadBackendIsaac};
