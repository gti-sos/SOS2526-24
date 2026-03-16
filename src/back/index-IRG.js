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
//crea nueva base de datos

//tengo que comprobar que sea persistente con esto
let db = new Datastore({ filename: "./src/back/international-costs.db", autoload: true })

//funcion
function loadBackendIsaac(app){
   
//rutas
let BASE_URL_API = "/api/v1";
let IRG_API_PATH = BASE_URL_API+"/international-construccion-costs"; 

//mi url 
const DOCS_URL = "https://documenter.getpostman.com/view/52380629/2sBXiesuH7";


//inicializar base

app.get(IRG_API_PATH + "/loadInitialData", (req, res) => {
    // 1. Buscamos si ya hay algo en la base de datos
    db.find({}, (err, datos) => {
        if (err) {
            return res.status(500).json({ error: "Error consultando la base de datos" });
        }

        if (datos.length === 0) {
            // 2. Si está vacía, insertamos los datos iniciales (datosIsaac) en la DB
            db.insert(datosIsaac, (err, nuevosDatos) => {
                if (err) {
                    return res.status(500).json({ error: "Error al insertar datos iniciales" });
                }
                // 3. Respondemos con los datos que acabamos de guardar
                return res.status(201).json(nuevosDatos);
            });
        } else {
            // 4. Si ya había datos, lanzamos el error 409 (Conflict)
            return res.status(409).json({ error: "La base de datos ya contiene datos." });
        }
    });
});



//get de la base 


//get de la base 
// GET de la colección con BÚSQUEDA (Toronto) y PAGINACIÓN
app.get(IRG_API_PATH, (req, res) => {
    let query = {};

    // Búsquedas por todos los campos
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
//post de la base 


app.post(IRG_API_PATH, (req, res) => {
    const newData = req.body;

    // 1. Validación de campos (Status 400)
    if (!newData || !newData.country || !newData.year || !newData.city || 
        !newData.cost_usd_per_m2 || !newData.cost_change_range || !newData.rank) {
        return res.status(400).json({ error: "Datos incompletos o incorrectos." });
    }

    
    const yearSearch = parseInt(newData.year);

    //Validación de duplicados en la BD (Status 409)

    db.find({ country: newData.country, year: yearSearch, city: newData.city }, (err,datos) => {
        if (err) {
            return res.status(500).json({ error: "Error al consultar la base de datos." });
        }

        if (datos.length > 0) {
            // El recurso ya existe
            return res.status(409).json({ error: "El recurso ya existe para ese país, año y ciudad." });
        } else {
            // 3. Si no existe, lo insertamos (Status 201)
            // Aseguramos que el año guardado sea un número
            newData.year = yearSearch; 
            
            db.insert(newData, (err, newDoc) => {
                if (err) {
                    return res.status(500).json({ error: "Error al insertar en la base de datos." });
                }
                return res.status(201).json({ message: "Recurso creado con éxito." });
            });
        }
    });
});


// GET individual (Ej: /api/v1/international-construccion-costs/Canada/2024/Toronto)
app.get(IRG_API_PATH + "/:country/:year/:city", (req, res) => {
    const { country, year, city } = req.params;
    const yearNum = parseInt(year, 10);

    
    db.findOne({ country: country, year: yearNum, city: city }, (err, resource) => {
       
        if (err) {
            return res.status(500).json({ error: "Error al consultar la base de datos." });
        }

        // 3. Si NeDB no encuentra nada, resource será 'null'
        if (!resource) {
            return res.status(404).json({ error: "Recurso no encontrado. error 404" });
        } else {
            // 4. Limpieza del campo _id antes de enviar
            delete resource._id;
            
            // 5. Respondemos con el recurso encontrado
            return res.status(200).json(resource);
        }
    });
});

 // DELETE individual (Ej: /api/v1/international-construccion-costs/Canada/2024/Toronto)
app.delete(IRG_API_PATH + "/:country/:year/:city", (req, res) => {
    const { country, year, city } = req.params;
    const yearNum = parseInt(year, 10);

    // 1. Ejecutamos el borrado en la base de datos
    // El segundo parámetro {} son opciones (no necesitamos multi:true porque la clave es única)
    db.remove({ country: country, year: yearNum, city: city }, {}, (err, numRemoved) => {
        
        // 2. Control de errores de la base de datos
        if (err) {
            console.error("Error al borrar en la DB:", err);
            return res.status(500).json({ error: "Error interno al intentar eliminar el recurso." });
        }

        // 3. Comprobamos si realmente se borró algo
        if (numRemoved === 0) {
            // No se encontró nada que coincida con esos parámetros
            return res.status(404).json({ error: "Recurso no encontrado para eliminar." });
        } else {
            // Se borró correctamente
            console.log(`Recurso eliminado: ${country} (${yearNum}) - ${city}`);
            return res.status(200).json({ message: "Recurso eliminado correctamente." });
        }
    });
});




//delete base
app.delete(IRG_API_PATH, (req, res) => {
    // El segundo parámetro { multi: true } es CLAVE para borrar todo
    db.remove({}, { multi: true }, (err, datos) => {
        if (err) {
            return res.status(500).json({ error: "Error al borrar la base de datos." });
        }
        return res.status(200).json({ message: `Se han eliminado ${datos} recursos.` });
    });
});

//put en la base (no se puede)

app.put(IRG_API_PATH, (req, res) => {
    res.status(405).json({ error: "Método PUT no permitido en la lista completa, error 405." }); // 405 Method Not Allowed
});




/////////////////////////////////////////////////


// PUT individual (Ej: /api/v1/international-construccion-costs/Canada/2024/Toronto)
app.put(IRG_API_PATH + "/:country/:year/:city", (req, res) => {
    const { country, year, city } = req.params;
    const yearNum = parseInt(year, 10);
    const body = req.body;

    
    // Comprobamos que los datos del cuerpo coincidan con los de la URL
    if (
        !body ||
        body.country !== country ||
        parseInt(body.year) !== yearNum ||
        body.city !== city
    ) {
        return res.status(400).json({
            error: "El ID del recurso no coincide con la URL. Error 400"
        });
    }

    
    // NeDB no permite modificar el campo _id. Lo eliminamos del body por si acaso.
    delete body._id;

    // 3. Actualización en la base de datos
  
    db.update({ country, year: yearNum, city }, body, {}, (err, numReplaced) => {
        
        // 4. Error de base de datos (Status 500)
        if (err) {
            console.error("Error al actualizar en la DB:", err);
            return res.status(500).json({ error: "Error interno al actualizar el recurso." });
        }

        // 5. Comprobar si se encontró y actualizó (Status 200 vs 404)
        if (numReplaced === 0) {
            return res.status(404).json({ 
                error: "Recurso no encontrado para actualizar. Código 404" 
            });
        } else {
            console.log(`Recurso actualizado: ${country} ${yearNum}`);
            return res.status(200).json({ message: "Recurso actualizado con éxito." });
        }
    });
});


// POST individual no permitido
app.post(IRG_API_PATH + "/:country/:year/:city", (req, res) => {
  res.status(405).json({
    error: "No se permite POST sobre un recurso concreto, error 405."
  });

});



//redireccion hacia mi coleccion

app.get(IRG_API_PATH + "/docs", (req, res) => {
    res.redirect(301, DOCS_URL);
});

//prueba

/*
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
*/
}


export{loadBackendIsaac};
