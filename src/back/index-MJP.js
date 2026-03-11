

// 1. Inicialización del array con los 10 datos de la ficha de trabajo
const datosMaria2 = [
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

// 2. Algoritmo usando iteradores para calcular la media de Canada
const targetCountry = "canada";

// Filtramos el subconjunto de filas de Canada usando .filter()
const canadaRows = datosMaria2.filter((row) => {
    return row.country === targetCountry;
});

// Sumamos los valores de 'avg_monthly_usd' usando .forEach()
let totalUsd = 0;
canadaRows.forEach((row) => {
    totalUsd += row.avg_monthly_usd;
});

// Calculamos la media final
const averageUsd = totalUsd / canadaRows.length;

// 3. Resultado por consola
/*
console.log("---------------------------------------------------------");
console.log(`Análisis de datos para el país: ${targetCountry.toUpperCase()}`);
console.log(`Registros encontrados: ${canadaRows.length}`);
console.log(`La media del salario mensual en USD es: ${averageUsd.toFixed(2)}`);
console.log("---------------------------------------------------------");
*/




function loadBackendMaria(app){
    let datosMaria = [];
    //te he cambiado el nombre arriba a tus datos y te lo he puesto con un 2 cambialo si no te gusta
    const initialDatosMaria = datosMaria2;
    let BASE_URL_API = "/api/v1";
    let MJP_API_PATH = BASE_URL_API + "/average-monthly-wages";

//tu codigo del samples (creo que hay que quitarlo luego pero por si acaso )
app.get("/samples/MJP", (req, res) => {
    const datos = datosMaria2; 
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




// 1. GET /loadInitialData - Carga los 10 datos si está vacío
app.get(MJP_API_PATH + "/loadInitialData", (req, res) => {
    if (datosMaria.length === 0) {
        datosMaria = [...initialDatosMaria];
        res.status(201).json(datosMaria); // 201 Created
    } else {
        res.status(409).json({ error: "El array ya contiene datos." }); // 409 Conflict
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






}

export { loadBackendMaria };