let cool = require("cool-ascii-faces");
console.log(cool());

let express = require("express");
const irg = require("./index-IRG.js");

const mjp = require("./index-MJP.js");

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


let datosMaria = [
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

app.get(BASE_URL_API
    + "/average-monthly-wages", (req, res) => {
    res.send(JSON.stringify(datosMaria, null, 2));
});



app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});