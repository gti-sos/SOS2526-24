<script>
    import { onMount } from 'svelte';

    let datos = $state([]);
    let nuevoDato = $state({
        country: "",
        year: "",
        avg_monthly_nc: "",
        avg_monthly_usd: "",
        exchange_rate: "",
        currency: ""
    });
    let mensaje = $state("");
    let esError = $state(false);
    let mostrarFiltros = $state(false);

    const API = "/api/v2/average-monthly-wages";

    let filtros = $state({
        country: "",
        offset: "",
        limit: ""
    });

    async function getDatos() {
        const res = await fetch(API);
        if (res.ok) {
            datos = await res.json();
        } else {
            mensaje = "Error al cargar los datos de salarios.";
            esError = true;
        }
    }

    async function crearDato() {
        const res = await fetch(API, {
            method: "POST",
            body: JSON.stringify({
                ...nuevoDato,
                year: parseInt(nuevoDato.year),
                avg_monthly_nc: parseFloat(nuevoDato.avg_monthly_nc),
                avg_monthly_usd: parseFloat(nuevoDato.avg_monthly_usd),
                exchange_rate: parseFloat(nuevoDato.exchange_rate)
            }),
            headers: { "Content-Type": "application/json" }
        });

        if (res.status === 201) {
            mensaje = "¡Registro de salario creado con éxito!";
            esError = false;
            nuevoDato = { country: "", year: "", avg_monthly_nc: "", avg_monthly_usd: "", exchange_rate: "", currency: "" };
            getDatos();
        } else if (res.status === 409) {
            mensaje = `Error: Ya existe un registro para el país '${nuevoDato.country}' en el año ${nuevoDato.year}.`;
            esError = true;
        } else if (res.status === 400) {
            mensaje = "Error: Asegúrate de rellenar todos los campos correctamente.";
            esError = true;
        } else {
            mensaje = "Ha ocurrido un error inesperado al intentar crear el registro.";
            esError = true;
        }
    }

    async function borrarDato(country, year) {
        if (!confirm(`¿Estás seguro de borrar el registro de ${country} (${year})?`)) return;
        const res = await fetch(`${API}/${country}/${year}`, { method: "DELETE" });
        if (res.ok) {
            mensaje = `Se ha borrado el registro de ${country} (${year}) correctamente.`;
            esError = false;
            getDatos();
        } else if (res.status === 404) {
            mensaje = `No existe un registro para el país '${country}' en el año ${year}.`;
            esError = true;
        } else {
            mensaje = `Error al borrar el registro de ${country} (${year}).`;
            esError = true;
        }
    }

    async function borrarTodo() {
        if (!confirm("¡ATENCIÓN! Vas a borrar TODOS los registros de salarios. ¿Continuar?")) return;
        const res = await fetch(API, { method: "DELETE" });
        if (res.ok) {
            mensaje = "Se han eliminado todos los registros de salarios.";
            esError = false;
            getDatos();
        } else {
            mensaje = "Error al intentar borrar todos los registros.";
            esError = true;
        }
    }

    async function cargarDatosIniciales() {
        const res = await fetch(`${API}/loadInitialData`);
        if (res.ok) {
            const datosCargados = await res.json();
            mensaje = `Se han cargado ${datosCargados.length} registros iniciales con éxito.`;
            esError = false;
            getDatos();
        } else if (res.status === 409) {
            mensaje = "Error: La base de datos ya contiene datos. Límpiala antes de cargar los datos iniciales.";
            esError = true;
        } else {
            mensaje = "Error: No se han podido cargar los datos iniciales.";
            esError = true;
        }
    }

    function toggleFiltros() {
        mostrarFiltros = !mostrarFiltros;
    }

    async function buscar() {
        const queryParams = new URLSearchParams();
        Object.keys(filtros).forEach(key => {
            if (filtros[key]) queryParams.append(key, filtros[key]);
        });

        const res = await fetch(`${API}?${queryParams.toString()}`);
        if (res.ok) {
            datos = await res.json();
            mensaje = `Búsqueda completada: ${datos.length} resultado(s) encontrado(s).`;
            esError = false;
        } else {
            mensaje = "Error en los parámetros de búsqueda. Revisa los valores introducidos.";
            esError = true;
        }
    }

    function limpiarBusqueda() {
        filtros.country = "";
        filtros.offset = "";
        filtros.limit = "";
        getDatos();
    }

    onMount(() => {
        getDatos();
    });
</script>

<h1>Gestión de Salarios Mensuales Medios</h1>

{#if mensaje}
    <p style="color: {esError ? 'red' : 'green'}; font-weight: bold; border: 1px solid; padding: 10px;">
        {mensaje}
    </p>
{/if}

<section style="background: #f9f9f9; padding: 15px; margin-bottom: 20px;">
    <h3>Añadir nuevo registro</h3>
    <input bind:value={nuevoDato.country} placeholder="País (ej: spain)" />
    <input bind:value={nuevoDato.year} type="number" placeholder="Año (ej: 2023)" />
    <input bind:value={nuevoDato.avg_monthly_nc} type="number" placeholder="Salario mensual medio (moneda local)" />
    <input bind:value={nuevoDato.avg_monthly_usd} type="number" placeholder="Salario mensual medio (USD)" />
    <input bind:value={nuevoDato.exchange_rate} type="number" step="0.0001" placeholder="Tipo de cambio (ej: 0.928)" />
    <input bind:value={nuevoDato.currency} placeholder="Moneda (ej: EUR)" />
    <button onclick={crearDato}>Añadir Registro</button>
</section>

<button onclick={toggleFiltros} style="background: #333; color: white; margin-bottom: 10px;">
    {mostrarFiltros ? "Cerrar Buscador" : "Abrir Buscador"}
</button>

{#if mostrarFiltros}
    <section style="background: #f1f1f1; padding: 15px; border-radius: 8px; border: 1px solid #ccc; margin-bottom: 20px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">

            <div>
                <label>País: <input bind:value={filtros.country} placeholder="Ej: spain" style="width: 100%;" /></label>
            </div>

            <div>
                <p style="margin: 0 0 5px 0;"><strong>Paginación</strong></p>
                <label>Desde el registro nº: <input type="number" bind:value={filtros.offset} placeholder="0" style="width: 80px;" /></label>
                <label style="margin-left: 10px;">Máximo de resultados: <input type="number" bind:value={filtros.limit} placeholder="10" style="width: 80px;" /></label>
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

<table>
    <thead>
        <tr>
            <th>País</th>
            <th>Año</th>
            <th>Salario (moneda local)</th>
            <th>Salario (USD)</th>
            <th>Tipo de cambio</th>
            <th>Moneda</th>
            <th>Acciones</th>
        </tr>
    </thead>
    <tbody>
        {#each datos as d}
            <tr>
                <td>{d.country}</td>
                <td>{d.year}</td>
                <td>{d.avg_monthly_nc}</td>
                <td>{d.avg_monthly_usd}</td>
                <td>{d.exchange_rate}</td>
                <td>{d.currency}</td>
                <td>
                    <a href="/average-monthly-wages/{d.country}/{d.year}">
                        <button>Editar</button>
                    </a>
                    <button
                        onclick={() => borrarDato(d.country, d.year)}
                        style="background: #ffcccc;">
                        Borrar
                    </button>
                </td>
            </tr>
        {/each}
    </tbody>
</table>

<div style="margin-top: 20px; display: flex; gap: 10px;">
    <button onclick={borrarTodo} style="background: red; color: white;">
        Limpiar Base de Datos Completa
    </button>
    <button onclick={cargarDatosIniciales} style="background: #28a745; color: white;">
        Cargar Datos Iniciales
    </button>
</div>