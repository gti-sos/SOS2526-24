import express from "express";
import cors from 'cors';
import bodyParser from "body-parser";

// ---- IMPORTACIÓN DE MÓDULOS (modularizados correctamente) ----
import  {loadBackendIsaac} from "./src/back/index-IRG.js"; // MODULO ISAAC
import {loadBackendMaria} from "./src/back/index-MJP.js"; //MODULO MARIA
//import {loadBackendElena} from "./src/back/index-EBP.js"; //MODULO ELENA
import {loadBackendElenav2} from "./src/back/index-EBP-v2.js"; //MODULO ELENA v2

// ---- IMPORTACIÓN DE PROXY ----
import { setupProxiesIsaac } from "./src/back/proxiesIsaac.js";
import { setupProxiesEBP } from "./src/back/proxies-EBP.js";

import {handler} from './src/front/build/handler.js';

const app = express();
app.use(cors());
const port = process.env.PORT || 3000;

//Rutas simples (F04)

app.use(bodyParser.json());

// TEST endpoint
app.get('/api/test', (req, res) => {
	res.json({ message: 'Backend works' });
});

// ---- CARGA DE MODULOS (ANTES del handler de SvelteKit) ----
loadBackendIsaac(app);
loadBackendMaria(app);
//loadBackendElena(app);
loadBackendElenav2(app);

//--carga de los modulos del proxy
setupProxiesIsaac(app);
setupProxiesEBP(app);
// SvelteKit handler - comentado para desarrollo local
// En producción (después de npm run build), descomentar esta línea:
app.use(handler);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
}); 