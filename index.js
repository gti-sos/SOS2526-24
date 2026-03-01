let cool = require("cool-ascii-faces");
console.log(cool());

let express = require("express");
const irg = require("./index-IRG.js");

// 1. Usamos el nombre que tú has elegido
const datosIsaac = irg.datosIsaac; 

const app = express();
let BASE_URL_API = "/api/v1";
const port = process.env.PORT || 3000;

// ERROR CORREGIDO: Es app.use, no app.arguments. 
// Y mejor apuntar a "./public" si ahí tienes tu about.html
app.use("/", express.static("./public")); 

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.get("/cool", (req, res) => {
    res.send("<html><body><h1>" + cool() + "</h1></body></html>");
});

app.get("/samples/IRG", (req, res) => {
    const pais = "Canada";

    // ERROR CORREGIDO: Aquí usamos datosIsaac
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

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});