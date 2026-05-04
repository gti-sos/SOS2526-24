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
// GRAFICA 1: Average-Monthly-Wages + Arrivals (Series normalizadas por año)
app.get("/api/v1/integrations/chart1", async (req, res) => {
    try {
        db.find({}, (err, wages) => {
            if (err) return res.status(500).json({ error: "Error" });

            // Primero cargar datos iniciales de Grupo 25
            fetch("https://sos2526-25.onrender.com/api/v1/international-tourist-arrivals/loadInitialData")
                .then(() => {
                    // Luego obtener los datos de arrivals
                    return fetch("https://sos2526-25.onrender.com/api/v1/international-tourist-arrivals");
                })
                .then(r => r.json())
                .then(arrivals => {
                    // Agrupar salarios por año - promedios
                    const wagesByYear = {};
                    wages.forEach(w => {
                        if (!wagesByYear[w.year]) wagesByYear[w.year] = [];
                        wagesByYear[w.year].push(w.avg_monthly_usd);
                    });

                    const wageAvgByYear = {};
                    Object.keys(wagesByYear).forEach(year => {
                        const avg = wagesByYear[year].reduce((a, b) => a + b, 0) / wagesByYear[year].length;
                        wageAvgByYear[year] = avg;
                    });

                    // Agrupar arrivals por año - totales
                    const arrivalsByYear = {};
                    arrivals.forEach(a => {
                        const totalArrivals = (a.air_arrival || 0) + (a.water_arrival || 0) + (a.land_arrival || 0);
                        if (!arrivalsByYear[a.year]) {
                            arrivalsByYear[a.year] = 0;
                        }
                        arrivalsByYear[a.year] += totalArrivals;
                    });

                    // Combinar años
                    const allYears = new Set([...Object.keys(wageAvgByYear), ...Object.keys(arrivalsByYear)]);
                    const combined = Array.from(allYears).sort().map(year => ({
                        year: parseInt(year),
                        salary: wageAvgByYear[year] || 0,
                        arrivals: arrivalsByYear[year] || 0
                    }));

                    res.status(200).json({ combined });
                })
                .catch(() => res.status(500).json({ error: "Error" }));
        });
    } catch (error) {
        res.status(500).json({ error: "Error" });
    }
});

// GRAFICA 2: Average-Monthly-Wages + Olympics Medallistas (por CONTINENTE)
    app.get("/api/v1/integrations/chart2", async (req, res) => {
        try {
            db.find({}, (err, wages) => {
                if (err) return res.status(500).json({ error: "Error" });

                // Mapping exhaustivo de país a continente (múltiples variantes)
                const countryToContinent = {
                    // North America
                    "canada": "North America",
                    "canadian": "North America",
                    "usa": "North America",
                    "us": "North America",
                    "united states": "North America",
                    "united states of america": "North America",
                    "american": "North America",

                    // Europe
                    "uk": "Europe",
                    "united kingdom": "Europe",
                    "great britain": "Europe",
                    "gb": "Europe",
                    "britain": "Europe",
                    "england": "Europe",
                    "scotland": "Europe",
                    "wales": "Europe",
                    "northern ireland": "Europe",
                    "british": "Europe",

                    "spain": "Europe",
                    "spanish": "Europe",
                    "españa": "Europe",

                    "ireland": "Europe",
                    "republic of ireland": "Europe",
                    "eire": "Europe",
                    "irish": "Europe",

                    "poland": "Europe",
                    "polish": "Europe",
                    "polen": "Europe",

                    "italy": "Europe",
                    "italian": "Europe",
                    "italia": "Europe",

                    "germany": "Europe",
                    "german": "Europe",
                    "deutschland": "Europe",
                    "allemagne": "Europe",

                    // Variantes adicionales comunes
                    "north america": "North America",
                    "europe": "Europe",
                    "european": "Europe"
                };

                // Primero cargar datos iniciales de Grupo 30 (Olympics)
                fetch("https://sos2526-30.onrender.com/api/v1/olympics-athlete-events/loadInitialData")
                    .then(() => {
                        // Luego obtener los datos de olympics
                        return fetch("https://sos2526-30.onrender.com/api/v1/olympics-athlete-events/");
                    })
                    .then(r => r.json())
                    .then(olympics => {
                        const data = olympics.data || olympics;

                        // Contar atletas y medallistas por continente
                        const medallistsByContinent = {};
                        const athletesByContinent = {};

                        data.forEach(athlete => {
                            const country = athlete.team ? athlete.team.toLowerCase() : "unknown";
                            const continent = countryToContinent[country] || "Other";

                            // Contar TODOS los atletas (no filtrar por medalla)
                            athletesByContinent[continent] = (athletesByContinent[continent] || 0) + 1;
                        });

                        console.log("DEBUG Chart2 - Atletas por continente:", athletesByContinent);

                        res.status(200).json({
                            wages,
                            athletes: athletesByContinent,
                            debug: { totalAthletes: data.length }
                        });
                    })
                    .catch((err) => {
                        console.error("Error fetching Olympics data:", err);
                        res.status(500).json({ error: "Error" });
                    });
            });
        } catch (error) {
            res.status(500).json({ error: "Error" });
        }
    });

// GRAFICA 3: Average-Monthly-Wages + World Bank Construction
app.get("/api/v1/integrations/chart3", async (req, res) => {
    try {
        db.find({}, (err, wages) => {
            if (err) return res.status(500).json({ error: "Error" });
            
            fetch("https://api.worldbank.org/v2/country/all/indicator/NE.CON.TOTL.CD?date=2019:2024&per_page=500&format=json")
                .then(r => r.json())
                .then(data => {
                    const construction = [];
                    if (data[1]) {
                        data[1].forEach(record => {
                            if (record.value !== null && record.countryiso3code) {
                                construction.push({
                                    country: record.countryiso3code,
                                    year: parseInt(record.date),
                                    construction_value: record.value
                                });
                            }
                        });
                    }
                    res.status(200).json({ wages, construction });
                })
                .catch(() => res.status(500).json({ error: "Error World Bank" }));
        });
    } catch (error) {
        res.status(500).json({ error: "Error" });
    }
});

// GRAFICA 4: Average-Monthly-Wages + REST Countries (Population)
app.get("/api/v1/integrations/chart4", async (req, res) => {
    try {
        db.find({}, (err, wages) => {
            if (err) return res.status(500).json({ error: "Error" });
            
            fetch("https://restcountries.com/v3.1/all?fields=name,region,population,cca2,cca3")
                .then(r => r.json())
                .then(countries => {
                    const countryData = {};
                    countries.forEach(c => {
                        const code = c.cca2.toLowerCase();
                        countryData[code] = {
                            name: c.name.common,
                            region: c.region,
                            population: c.population || 0,
                            code: c.cca2
                        };
                    });
                    res.status(200).json({ wages, countries: countryData });
                })
                .catch(() => res.status(500).json({ error: "Error REST Countries" }));
        });
    } catch (error) {
        res.status(500).json({ error: "Error" });
    }
});

   // GRAFICA 5: Earthquakes + Average-Monthly-Wages (Radar)
app.get("/api/v1/integrations/chart5", async (req, res) => {
    try {
        db.find({}, (err, wages) => {
            if (err) return res.status(500).json({ error: "Error" });

            fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson")
                .then(r => r.json())
                .then(data => {
                    const earthquakes = data.features.map(feature => ({
                        magnitude: feature.properties.mag,
                        place: feature.properties.place,
                        latitude: feature.geometry.coordinates[1],
                        longitude: feature.geometry.coordinates[0]
                    }));
                    res.status(200).json({ wages, earthquakes });
                })
                .catch(() => res.status(500).json({ error: "Error USGS" }));
        });
    } catch (error) {
        res.status(500).json({ error: "Error" });
    }
});

}

export { loadBackendMaria };