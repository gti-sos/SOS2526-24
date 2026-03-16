
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

// URL de la colección de Postman
const DOCS_URL = "https://documenter.getpostman.com/view/52434605/2sBXigMDXA";


function loadBackendMaria(app) {

    let BASE_URL_API = "/api/v1";
    let MJP_API_PATH = BASE_URL_API + "/average-monthly-wages";

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
            if (err) {
                return res.status(500).json({ error: "Error consultando la base de datos." });
            }
            if (datos.length === 0) {
                
                db.insert(datosMaria, (err, nuevosDatos) => {
                    if (err) {
                        console.log("ERROR AL INSERTAR:", JSON.stringify(err));
                        return res.status(500).json({ error: "Error al insertar datos iniciales." });
                    }
                    nuevosDatos.forEach(d => { delete d._id; });
                    return res.status(201).json(nuevosDatos);
                });
            } else {
                return res.status(409).json({ error: "La base de datos ya contiene datos." });
            }
        });
    });


    // ------------------------------------------
    // COLECCIÓN: GET con búsqueda por todos los campos y paginación
    // Ejemplos:
    //   GET /average-monthly-wages
    //   GET /average-monthly-wages?country=canada
    //   GET /average-monthly-wages?year=2023
    //   GET /average-monthly-wages?currency=EUR
    //   GET /average-monthly-wages?offset=0&limit=5
    // ------------------------------------------
    app.get(MJP_API_PATH, (req, res) => {
        let query = {};

        // Búsqueda por todos los campos del recurso
        if (req.query.country)         query.country         = req.query.country;
        if (req.query.year)            query.year            = parseInt(req.query.year);
        if (req.query.currency)        query.currency        = req.query.currency;
        if (req.query.avg_monthly_nc)  query.avg_monthly_nc  = parseFloat(req.query.avg_monthly_nc);
        if (req.query.avg_monthly_usd) query.avg_monthly_usd = parseFloat(req.query.avg_monthly_usd);
        if (req.query.exchange_rate)   query.exchange_rate   = parseFloat(req.query.exchange_rate);

        // Paginación
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

        // Validación de campos obligatorios (400)
        if (!newData || !newData.country || !newData.year || !newData.avg_monthly_nc ||
            !newData.avg_monthly_usd || !newData.exchange_rate || !newData.currency) {
            return res.status(400).json({ error: "Datos incompletos o incorrectos." });
        }

        const yearSearch = parseInt(newData.year);

        // Validación de duplicados (409)
        db.find({ country: newData.country, year: yearSearch }, (err, datos) => {
            if (err) {
                return res.status(500).json({ error: "Error al consultar la base de datos." });
            }
            if (datos.length > 0) {
                return res.status(409).json({ error: "El recurso ya existe para ese país y año." });
            } else {
                newData.year = yearSearch;
                db.insert(newData, (err, newDoc) => {
                    if (err) {
                        return res.status(500).json({ error: "Error al insertar en la base de datos." });
                    }
                    delete newDoc._id;
                    return res.status(201).json({ message: "Recurso creado con éxito." });
                });
            }
        });
    });


    // COLECCIÓN: DELETE (borra todo)
    app.delete(MJP_API_PATH, (req, res) => {
        db.remove({}, { multi: true }, (err, numRemoved) => {
            if (err) {
                return res.status(500).json({ error: "Error al borrar la base de datos." });
            }
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
            if (err) {
                return res.status(500).json({ error: "Error al consultar la base de datos." });
            }
            if (!resource) {
                return res.status(404).json({ error: "Recurso no encontrado." });
            } else {
                delete resource._id;
                return res.status(200).json(resource);
            }
        });
    });


    // PUT individual
    app.put(MJP_API_PATH + "/:country/:year", (req, res) => {
        const { country, year } = req.params;
        const yearNum = parseInt(year, 10);
        const body = req.body;

        // Validar que el ID del body coincide con la URL (400)
        if (
            !body ||
            body.country !== country ||
            parseInt(body.year) !== yearNum
        ) {
            return res.status(400).json({ error: "El ID del recurso no coincide con la URL." });
        }

        delete body._id;

        db.update({ country: country, year: yearNum }, body, {}, (err, numReplaced) => {
            if (err) {
                return res.status(500).json({ error: "Error interno al actualizar el recurso." });
            }
            if (numReplaced === 0) {
                return res.status(404).json({ error: "Recurso no encontrado para actualizar." });
            } else {
                return res.status(200).json({ message: "Recurso actualizado con éxito." });
            }
        });
    });


    // DELETE individual
    app.delete(MJP_API_PATH + "/:country/:year", (req, res) => {
        const { country, year } = req.params;
        const yearNum = parseInt(year, 10);

        db.remove({ country: country, year: yearNum }, {}, (err, numRemoved) => {
            if (err) {
                return res.status(500).json({ error: "Error interno al intentar eliminar el recurso." });
            }
            if (numRemoved === 0) {
                return res.status(404).json({ error: "Recurso no encontrado para eliminar." });
            } else {
                return res.status(200).json({ message: "Recurso eliminado correctamente." });
            }
        });
    });


    // POST individual no permitido
    app.post(MJP_API_PATH + "/:country/:year", (req, res) => {
        res.status(405).json({ error: "No se permite POST sobre un recurso concreto." });
    });


 //cambio prueba
}

export { loadBackendMaria };