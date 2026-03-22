import Datastore from "nedb";

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


//tengo que comprobar que sea persistente con esto
let db = new Datastore({ filename: "./src/back/international-costs.db", autoload: true })

function loadBackendIsaac(app) {

//rutas
    const versions = [
        { 
            base: "/api/v1/international-construccion-costs", 
            docs: "https://documenter.getpostman.com/view/52380629/2sBXiesuH7" 
        },
        { 
            base: "/api/v2/international-construccion-costs", 
            docs: "https://documenter.getpostman.com/view/52380629/2sBXijJXME" // <--- Pon aquí el nuevo link que generes
        }
    ];

    // bucle  para cada versión automáticamente
    versions.forEach((v) => {
        let IRG_API_PATH = v.base;
        let DOCS_URL = v.docs;

        

        app.get(IRG_API_PATH + "/loadInitialData", (req, res) => {
            db.find({}, (err, datos) => {
                if (err) return res.status(500).json({ error: "Error consultando la base de datos" });
                if (datos.length === 0) {
                    db.insert(datosIsaac, (err, nuevosDatos) => {
                        if (err) return res.status(500).json({ error: "Error al insertar datos iniciales" });
                        return res.status(201).json(nuevosDatos);
                    });
                } else {
                    return res.status(409).json({ error: "La base de datos ya contiene datos." });
                }
            });
        });

        app.get(IRG_API_PATH, (req, res) => {
            let query = {};
            if (req.query.country) query.country = req.query.country;
            if (req.query.city) query.city = req.query.city;
            if (req.query.year) query.year = parseInt(req.query.year);
            if (req.query.cost_usd_per_m2) query.cost_usd_per_m2 = parseInt(req.query.cost_usd_per_m2);
            if (req.query.cost_change_range) query.cost_change_range = req.query.cost_change_range;
            if (req.query.rank) query.rank = parseInt(req.query.rank);
            let offset = parseInt(req.query.offset) || 0; 
            let limit = parseInt(req.query.limit) || 100;
            db.find(query).skip(offset).limit(limit).exec((err, datos) => {
                if (err) return res.status(500).json({ error: "Error en la base de datos." });
                datos.forEach(d => { delete d._id; });
                res.status(200).json(datos);
            });
        });

        app.post(IRG_API_PATH, (req, res) => {
            const newData = req.body;
            if (!newData || !newData.country || !newData.year || !newData.city || 
                !newData.cost_usd_per_m2 || !newData.cost_change_range || !newData.rank) {
                return res.status(400).json({ error: "Datos incompletos o incorrectos." });
            }
            const yearSearch = parseInt(newData.year);
            db.find({ country: newData.country, year: yearSearch, city: newData.city }, (err,datos) => {
                if (err) return res.status(500).json({ error: "Error al consultar la base de datos." });
                if (datos.length > 0) {
                    return res.status(409).json({ error: "El recurso ya existe para ese país, año y ciudad." });
                } else {
                    newData.year = yearSearch; 
                    db.insert(newData, (err, newDoc) => {
                        if (err) return res.status(500).json({ error: "Error al insertar en la base de datos." });
                        return res.status(201).json({ message: "Recurso creado con éxito." });
                    });
                }
            });
        });

        app.get(IRG_API_PATH + "/:country/:year/:city", (req, res) => {
            const { country, year, city } = req.params;
            const yearNum = parseInt(year, 10);
            db.findOne({ country: country, year: yearNum, city: city }, (err, resource) => {
                if (err) return res.status(500).json({ error: "Error al consultar la base de datos." });
                if (!resource) return res.status(404).json({ error: "Recurso no encontrado. error 404" });
                delete resource._id;
                return res.status(200).json(resource);
            });
        });

        app.delete(IRG_API_PATH + "/:country/:year/:city", (req, res) => {
            const { country, year, city } = req.params;
            const yearNum = parseInt(year, 10);
            db.remove({ country: country, year: yearNum, city: city }, {}, (err, numRemoved) => {
                if (err) return res.status(500).json({ error: "Error interno al intentar eliminar el recurso." });
                if (numRemoved === 0) return res.status(404).json({ error: "Recurso no encontrado para eliminar." });
                return res.status(200).json({ message: "Recurso eliminado correctamente." });
            });
        });

        app.delete(IRG_API_PATH, (req, res) => {
            db.remove({}, { multi: true }, (err, datos) => {
                if (err) return res.status(500).json({ error: "Error al borrar la base de datos." });
                return res.status(200).json({ message: `Se han eliminado ${datos} recursos.` });
            });
        });

        app.put(IRG_API_PATH, (req, res) => {
            res.status(405).json({ error: "Método PUT no permitido en la lista completa, error 405." });
        });

        app.put(IRG_API_PATH + "/:country/:year/:city", (req, res) => {
            const { country, year, city } = req.params;
            const yearNum = parseInt(year, 10);
            const body = req.body;
            if (!body || body.country !== country || parseInt(body.year) !== yearNum || body.city !== city) {
                return res.status(400).json({ error: "El ID del recurso no coincide con la URL. Error 400" });
            }
            delete body._id;
            db.update({ country, year: yearNum, city }, body, {}, (err, numReplaced) => {
                if (err) return res.status(500).json({ error: "Error interno al actualizar el recurso." });
                if (numReplaced === 0) return res.status(404).json({ error: "Recurso no encontrado para actualizar. Código 404" });
                return res.status(200).json({ message: "Recurso actualizado con éxito." });
            });
        });

        app.post(IRG_API_PATH + "/:country/:year/:city", (req, res) => {
            res.status(405).json({ error: "No se permite POST sobre un recurso concreto, error 405." });
        });

        app.get(IRG_API_PATH + "/docs", (req, res) => {
            res.redirect(301, DOCS_URL);
        });

        // --- TU CÓDIGO ORIGINAL TERMINA AQUÍ ---
    });
}


export{loadBackendIsaac};