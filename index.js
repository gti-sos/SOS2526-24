import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = process.env.PORT || 3000;

// ---- IMPORTACIÓN DE MÓDULOS (modularizados correctamente) ----

// ---- MODULO ISAAC ----
import  {loadBackendIsaac} from "./src/back/index-IRG.js";
loadBackendIsaac(app);

// ---- MODULO MARIA ----
import { loadBackendMaria } from "./src/back/index-MJP.js";
loadBackendMaria(app);

// ---- MODULO ELENA ----
import { loadBackendElena } from "./src/back/index-EBP.js";
loadBackendElena(app);

//Rutas simples (F04)
app.use("/", express.static("./public")); 
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Hello World');
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});