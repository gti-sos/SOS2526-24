<script>
import { onMount } from 'svelte';
    let datos = $state([]);
    let nuevoDato = $state({ country: "", year: "", city: "", cost_usd_per_m2: "", cost_change_range: "", rank: "" });
    let mensaje = $state("");
    let esError = $state(false);
    const API = "/api/v2/international-construction-costs"; // Usamos la v2



    async function getDatos() {
        const res = await fetch(API);
        if (res.ok) {
            datos = await res.json();
        }
    }

    async function crearDato() {
        const res = await fetch(API, {
            method: "POST",
            body: JSON.stringify(nuevoDato),
            headers: { "Content-Type": "application/json" }
        });
        
        if (res.status === 201) {
            mensaje = "¡Recurso creado con éxito!";
            esError = false;
            getDatos(); // Recargamos la lista
        } else if (res.status === 409) {
            mensaje = `Error: Ya existe un dato para ${nuevoDato.country} en ${nuevoDato.year}.`;
            esError = true;
        } else {
            mensaje = "Error: Asegúrate de rellenar todos los campos correctamente.";
            esError = true;
        }
    }

    async function borrarDato(country, year, city) {
        if (!confirm(`¿Estás seguro de borrar el dato de ${city}?`)) return;
        const res = await fetch(`${API}/${country}/${year}/${city}`, { method: "DELETE" });
        if (res.ok) {
            mensaje = `Se ha borrado el registro de ${city} correctamente.`;
            esError = false;
            getDatos();
        }
    }

    async function borrarTodo() {
        if (!confirm("¡ATENCIÓN! Vas a borrar TODOS los datos. ¿Continuar?")) return;
        const res = await fetch(API, { method: "DELETE" });
        if (res.ok) {
            mensaje = "Se han eliminado todos los registros de la base de datos.";
            esError = false;
            getDatos();
        }
    }

    onMount(() => {
        getDatos();
    });


    async function cargarDatosIniciales() {
    // Generalmente es un GET a /api/v2/recurso/loadInitialData
    const res = await fetch(`${API}/loadInitialData`);
    
    if (res.ok) {
        const datosCargados = await res.json();
        mensaje = `Se han cargado ${datosCargados.length} registros iniciales con éxito.`;
        esError = false;
        getDatos(); // Refrescamos la tabla para ver los nuevos datos
    } else {
        mensaje = "Error: No se han podido cargar los datos iniciales (quizás la base de datos no está vacía).";
        esError = true;
    }
}

let mostrarFiltros = $state(false); // Empieza cerrado (false)

function toggleFiltros() {
    mostrarFiltros = !mostrarFiltros; // Cambia de true a false y viceversa
}



let filtros = $state({
    from: "", to: "",          // Rango de años
    country: "", city: "",     // Texto
    min_cost: "", max_cost: "", // Rango de coste
    min_rank: "", max_rank: ""  // Rango de ranking
});

async function buscar() {
    const queryParams = new URLSearchParams();
    
    // Recorremos el objeto y añadimos solo los que tienen valor
    Object.keys(filtros).forEach(key => {
        if (filtros[key]) queryParams.append(key, filtros[key]);
    });

    const res = await fetch(`${API}?${queryParams.toString()}`);
    if (res.ok) {
        datos = await res.json();
        mensaje = `Búsqueda finalizada: ${datos.length} resultados encontrados.`;
        esError = false;
    } else {
        mensaje = "Error en los parámetros de búsqueda.";
        esError = true;
    }
}


function limpiarBusqueda() {
    filtros.from = "";
    filtros.to = "";
    filtros.country = "";
    filtros.city = "";
    getDatos(); // Recarga la lista completa
}


</script>

<h1>Gestión de Costes de Construcción</h1>

{#if mensaje}
    <p style="color: {esError ? 'red' : 'green'}; font-weight: bold; border: 1px solid; padding: 10px;">
        {mensaje}
    </p>
{/if}

<section style="background: #f9f9f9; padding: 15px; margin-bottom: 20px;">
    <h3>Añadir nuevo registro</h3>
    <input bind:value={nuevoDato.country} placeholder="País" />
    <input bind:value={nuevoDato.year} type="number" placeholder="Año" />
    <input bind:value={nuevoDato.city} placeholder="Ciudad" />
    <input bind:value={nuevoDato.cost_usd_per_m2} type="number" placeholder="Coste USD/m2" />
    <input bind:value={nuevoDato.cost_change_range} placeholder="Rango cambio (ej: 5%)" />
    <input bind:value={nuevoDato.rank} type="number" placeholder="Ranking" />
    <button onclick={crearDato}>Añadir Registro</button>
</section>

<table>
    <thead>
        <tr>
            <th>País</th> <th>Año</th> <th>Ciudad</th> <th>Coste por metro cuadrado</th> <th>Acciones</th>
        </tr>
    </thead>
    <tbody>
        {#each datos as d}
            <tr>
                <td>{d.country}</td>
                <td>{d.year}</td>
                <td>{d.city}</td>
                <td>{d.cost_usd_per_m2}</td>
                <td>
                    <a href="/international-construction-costs/{d.country}/{d.year}/{d.city}">
                        <button>Editar</button>
                    </a>
                    <button onclick={() => borrarDato(d.country, d.year, d.city)} style="background: #ffcccc;">
                        Borrar
                    </button>
                </td>
            </tr>
        {/each}
    </tbody>
</table>

<button onclick={borrarTodo} style="background: red; color: white; margin-top: 20px;">

    Limpiar Base de Datos Completa
</button>


<button onclick={cargarDatosIniciales} style="background: red; color: white; margin-top: 20px;">

    carga datos iniciales 
</button>


<button onclick={toggleFiltros} style="background: #333; color: white; margin-bottom: 10px;">
    {mostrarFiltros ? "Cerrar Filtros" : "Abrir Buscador"}
</button>


{#if mostrarFiltros}
    <section style="background: #f1f1f1; padding: 15px; border-radius: 8px; border: 1px solid #ccc; margin-bottom: 20px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            
            <div>
                <label>País: <input bind:value={filtros.country} placeholder="Ej: Spain" style="width: 100%;" /></label><br/>
                <label>Ciudad: <input bind:value={filtros.city} placeholder="Ej: Madrid" style="width: 100%; margin-top: 5px;" /></label>
                <div style="display: flex; gap: 5px; margin-top: 10px;">
                    <label>Desde: <input type="number" bind:value={filtros.from} style="width: 60px;" /></label>
                    <label>Hasta: <input type="number" bind:value={filtros.to} style="width: 60px;" /></label>
                </div>
            </div>

            <div>
                <p style="margin: 0 0 5px 0;"><strong>Rango de Coste (USD/m²)</strong></p>
                <input type="number" bind:value={filtros.min_cost} placeholder="Mínimo" style="width: 80px;" />
                <span> a </span>
                <input type="number" bind:value={filtros.max_cost} placeholder="Máximo" style="width: 80px;" />
            </div>
        </div>

        <div style="margin-top: 15px; border-top: 1px solid #ddd; padding-top: 10px;">
            <button onclick={buscar} style="background: #007bff; color: white; padding: 5px 15px; border: none; cursor: pointer;">
                Filtrar ahora
            </button>
            <button onclick={limpiarBusqueda} style="background: #6c757d; color: white; padding: 5px 15px; border: none; cursor: pointer; margin-left: 5px;">
                Limpiar filtros
            </button>
        </div>
    </section>
{/if}