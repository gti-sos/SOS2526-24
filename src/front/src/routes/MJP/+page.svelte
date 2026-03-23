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

    const API = "/api/v2/average-monthly-wages";

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
            mensaje = `Error: Ya existe un registro para ${nuevoDato.country} en el año ${nuevoDato.year}.`;
            esError = true;
        } else {
            mensaje = "Error: Asegúrate de rellenar todos los campos correctamente.";
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

<button onclick={borrarTodo} style="background: red; color: white; margin-top: 20px;">
    Limpiar Base de Datos Completa
</button>