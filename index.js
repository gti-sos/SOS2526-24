import express from "express";
import bodyParser from "body-parser";

// ---- IMPORTACIÓN DE MÓDULOS (modularizados correctamente) ----
import  {loadBackendIsaac} from "./src/back/index-IRG.js"; // MODULO ISAAC
import {loadBackendMaria} from "./src/back/index-MJP.js"; //MODULO MARIA
import {loadBackendElena} from "./src/back/index-EBP.js"; //MODULO ELENA

const app = express();
const port = process.env.PORT || 3000;

//Rutas simples (F04)
app.use("/", express.static("./public")); 
app.use(bodyParser.json());

// ---- CARGA DE MODULOS ----
loadBackendIsaac(app);
loadBackendMaria(app);
loadBackendElena(app);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
}); 