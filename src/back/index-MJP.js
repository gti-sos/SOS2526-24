import Datastore from "nedb";

// Datos iniciales
const datosMaria = [
    { year: 2024, country: "canada", avg_monthly_nc: 6926.7, avg_monthly_usd: 5056.8, exchange_rate: 1.369779307, currency: "CAD" },
    { year: 2023, country: "canada", avg_monthly_nc: 6750.4, avg_monthly_usd: 5001.8, exchange_rate: 1.349594146, currency: "CAD" },
    { year: 2022, country: "canada", avg_monthly_nc: 6513.1, avg_monthly_usd: 5004.2, exchange_rate: 1.301526718, currency: "CAD" },
    { year: 2023, country: "usa",    avg_monthly_nc: 6678.3, avg_monthly_usd: 6678.3, exchange_rate: 1,           currency: "USD" },
    { year: 2024, country: "uk",     avg_monthly_nc: 3733.8, avg_monthly_usd: 4771.6, exchange_rate: 0.7825048202, currency: "GBP" },
    { year: 2022, country: "spain",  avg_monthly_nc: 2531.6, avg_monthly_usd: 2662.2, exchange_rate: 0.9509428292, currency: "EUR" },
    { year: 2023, country: "ireland",avg_monthly_nc: 4496.2, avg_monthly_usd: 4862.3, exchange_rate: 0.9247064147, currency: "EUR" },
    { year: 2023, country: "poland", avg_monthly_nc: 6873.8, avg_monthly_usd: 1636.4, exchange_rate: 4.20056221,  currency: "PLN" },
    { year: 2023, country: "italy",  avg_monthly_nc: 2704.2, avg_monthly_usd: 2924.4, exchange_rate: 0.9247025031, currency: "EUR" },
    { year: 2022, country: "germany",avg_monthly_nc: 3790.4, avg_monthly_usd: 3986.0, exchange_rate: 0.9509282489, currency: "EUR" }
];

// Base de datos NeDB persistente
let db = new Datastore({
    filename: "./src/back/average-wages.db",
    autoload: true
});

function loadBackendMaria(app) {

    // Versiones de la API
    const versions = [
        {
            base: "/api/v1/average-monthly-wages",
            docs: "https://documenter.getpostman.com/view/52434605/2sBXigMDXA"
        },
        {
            base: "/api/v2/average-monthly-wages",
            docs: "https://documenter.getpostman.com/view/52434605/2sBXijJrz1" 
    
        }];

    // Bucle para registrar ambas versiones automáticamente
    versions.forEach((v) => {
        let MJP_API_PATH = v.base;
        let DOCS_URL = v.docs;

        // ------------------------------------------
        // DOCS — redirige al portal de Postman
        // ------------------------------------------
        app.get(MJP_API_PATH + "/docs", (req, res) => {
            res.redirect(301, DOCS_URL);
        });

        // ------------------------------------------
        // LOAD INITIAL DATA
        // ------------------------------------------
        app.get(MJP_API_PATH + "/loadInitialData", (req, res) => {
            db.find({}, (err, datos) => {
                if (err) return res.status(500).json({ error: "Error consultando la base de datos." });
                if (datos.length === 0) {
                    db.insert(datosMaria, (err, nuevosDatos) => {
                        if (err) return res.status(500).json({ error: "Error al insertar datos iniciales." });
                        nuevosDatos.forEach(d => { delete d._id; });
                        return res.status(201).json(nuevosDatos);
                    });
                } else {
                    return res.status(409).json({ error: "La base de datos ya contiene datos." });
                }
            });
        });

        // ------------------------------------------
        // COLECCIÓN: GET con búsqueda y paginación
        // ------------------------------------------
        app.get(MJP_API_PATH, (req, res) => {
            let query = {};
            if (req.query.country)         query.country         = req.query.country;
            if (req.query.year)            query.year            = parseInt(req.query.year);
            if (req.query.currency)        query.currency        = req.query.currency;
            if (req.query.avg_monthly_nc)  query.avg_monthly_nc  = parseFloat(req.query.avg_monthly_nc);
            if (req.query.avg_monthly_usd) query.avg_monthly_usd = parseFloat(req.query.avg_monthly_usd);
            if (req.query.exchange_rate)   query.exchange_rate   = parseFloat(req.query.exchange_rate);

            let offset = parseInt(req.query.offset) || 0;
            let limit  = parseInt(req.query.limit)  || 100;

            db.find(query).skip(offset).limit(limit).exec((err, datos) => {
                if (err) return res.status(500).json({ error: "Error en la base de datos." });
                datos.forEach(d => { delete d._id; });
                res.status(200).json(datos);
            });
        });

        // COLECCIÓN: POST
        app.post(MJP_API_PATH, (req, res) => {
            const newData = req.body;
            if (!newData || !newData.country || !newData.year || !newData.avg_monthly_nc ||
                !newData.avg_monthly_usd || !newData.exchange_rate || !newData.currency) {
                return res.status(400).json({ error: "Datos incompletos o incorrectos." });
            }
            const yearSearch = parseInt(newData.year);
            db.find({ country: newData.country, year: yearSearch }, (err, datos) => {
                if (err) return res.status(500).json({ error: "Error al consultar la base de datos." });
                if (datos.length > 0) {
                    return res.status(409).json({ error: "El recurso ya existe para ese país y año." });
                } else {
                    newData.year = yearSearch;
                    db.insert(newData, (err, newDoc) => {
                        if (err) return res.status(500).json({ error: "Error al insertar en la base de datos." });
                        delete newDoc._id;
                        return res.status(201).json({ message: "Recurso creado con éxito." });
                    });
                }
            });
        });

        // COLECCIÓN: DELETE (borra todo)
        app.delete(MJP_API_PATH, (req, res) => {
            db.remove({}, { multi: true }, (err, numRemoved) => {
                if (err) return res.status(500).json({ error: "Error al borrar la base de datos." });
                return res.status(200).json({ message: `Se han eliminado ${numRemoved} recursos.` });
            });
        });

        // COLECCIÓN: PUT no permitido
        app.put(MJP_API_PATH, (req, res) => {
            res.status(405).json({ error: "Método PUT no permitido en la lista completa." });
        });

        // ------------------------------------------
        // RECURSO INDIVIDUAL: /:country/:year
        // ------------------------------------------

        // GET individual
        app.get(MJP_API_PATH + "/:country/:year", (req, res) => {
            const { country, year } = req.params;
            const yearNum = parseInt(year, 10);
            db.findOne({ country: country, year: yearNum }, (err, resource) => {
                if (err) return res.status(500).json({ error: "Error al consultar la base de datos." });
                if (!resource) return res.status(404).json({ error: "Recurso no encontrado." });
                delete resource._id;
                return res.status(200).json(resource);
            });
        });

        // PUT individual
        app.put(MJP_API_PATH + "/:country/:year", (req, res) => {
            const { country, year } = req.params;
            const yearNum = parseInt(year, 10);
            const body = req.body;
            if (!body || body.country !== country || parseInt(body.year) !== yearNum) {
                return res.status(400).json({ error: "El ID del recurso no coincide con la URL." });
            }
            delete body._id;
            db.update({ country: country, year: yearNum }, body, {}, (err, numReplaced) => {
                if (err) return res.status(500).json({ error: "Error interno al actualizar el recurso." });
                if (numReplaced === 0) return res.status(404).json({ error: "Recurso no encontrado para actualizar." });
                return res.status(200).json({ message: "Recurso actualizado con éxito." });
            });
        });

        // DELETE individual
        app.delete(MJP_API_PATH + "/:country/:year", (req, res) => {
            const { country, year } = req.params;
            const yearNum = parseInt(year, 10);
            db.remove({ country: country, year: yearNum }, {}, (err, numRemoved) => {
                if (err) return res.status(500).json({ error: "Error interno al intentar eliminar el recurso." });
                if (numRemoved === 0) return res.status(404).json({ error: "Recurso no encontrado para eliminar." });
                return res.status(200).json({ message: "Recurso eliminado correctamente." });
            });
        });

        // POST individual no permitido
        app.post(MJP_API_PATH + "/:country/:year", (req, res) => {
            res.status(405).json({ error: "No se permite POST sobre un recurso concreto." });
        });

    }); // fin forEach versions

    // ------------------------------------------
    // PROXIES PARA INTEGRACIONES EXTERNAS
    // ------------------------------------------

        // 1. PROXY GRUPO 25 (Arrivals)
    app.get("/api/v1/integrations/arrivals", async (req, res) => {
        try {
            // Primero intenta cargar datos iniciales
            await fetch("https://sos2526-25.onrender.com/api/v1/international-tourist-arrivals/loadInitialData");
            
            // Luego obtiene los datos
            const response = await fetch("https://sos2526-25.onrender.com/api/v1/international-tourist-arrivals");
            const data = await response.json();
            res.status(200).json(Array.isArray(data) ? data : []);
        } catch (error) {
            res.status(500).json({ error: "Error Arrivals" });
        }
    });

    // 2. PROXY GRUPO 30 (Olympics)
    app.get("/api/v1/integrations/olympics", async (req, res) => {
        try {
            // 1. Carga los datos iniciales
            await fetch("https://sos2526-30.onrender.com/api/v1/olympics-athlete-events/loadInitialData");
            
            // 2. Luego obtiene los datos
            const response = await fetch("https://sos2526-30.onrender.com/api/v1/olympics-athlete-events/");
            const json = await response.json();
            
            // Los datos están dentro de .data
            const data = json.data || json;
            res.status(200).json(Array.isArray(data) ? data : []);
        } catch (error) {
            res.status(500).json({ error: "Error Olympics" });
        }
    });

// 3. CONSTRUCCIÓN - World Bank API
    app.get("/api/v1/integrations/construction", async (req, res) => {
        try {
            const response = await fetch("https://api.worldbank.org/v2/country/all/indicator/NE.CON.TOTL.CD?date=2019:2024&per_page=500&format=json");
            const data = await response.json();
            const transformed = [];
            if (data[1]) {
                data[1].forEach(record => {
                    if (record.value !== null && record.countryiso3code) {
                        transformed.push({
                            country: record.countryiso3code,
                            year: parseInt(record.date),
                            construction_cost: record.value
                        });
                    }
                });
            }
            res.status(200).json(transformed.slice(0, 100));
        } catch (error) {
            res.status(500).json({ error: "Error World Bank" });
        }
    });
// 4. COUNTRIES - REST Countries API
    app.get("/api/v1/integrations/countries", async (req, res) => {
        try {
            const response = await fetch("https://restcountries.com/v3.1/all?fields=name,region,population,cca2,cca3");            const data = await response.json();
            const transformed = data.map(country => ({
                name: country.name?.common || country.name?.official || "Unknown",
                region: country.region || "Unknown",
                population: country.population || 0,
                code: country.cca2 || country.cca3 || "XX"
            }));
            res.status(200).json(transformed);
        } catch (error) {
            res.status(500).json({ error: "Error REST Countries" });
        }
    });

   // 5. EARTHQUAKES - USGS API
    app.get("/api/v1/integrations/earthquakes", async (req, res) => {
        try {
            const response = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson");
            const data = await response.json();
            const transformed = data.features.map(feature => ({
                magnitude: feature.properties.mag,
                place: feature.properties.place,
                time: feature.properties.time,
                depth: feature.geometry.coordinates[2],
                latitude: feature.geometry.coordinates[1],
                longitude: feature.geometry.coordinates[0]
            }));
            res.status(200).json(transformed);
        } catch (error) {
            res.status(500).json({ error: "Error USGS Earthquakes" });
        }
    });
}


export { loadBackendMaria };