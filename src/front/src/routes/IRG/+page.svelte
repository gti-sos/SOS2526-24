<script>
import { onMount } from 'svelte';
    let datos = $state([]);
    let nuevoDato = $state({ country: "", year: "", city: "", cost_usd_per_m2: "", cost_change_range: "", rank: "" });
    let mensaje = $state("");
    let esError = $state(false);

    const API = "/api/v2/international-construccion-costs"; // Usamos la v2

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
            <th>País</th> <th>Año</th> <th>Ciudad</th> <th>Acciones</th>
        </tr>
    </thead>
    <tbody>
        {#each datos as d}
            <tr>
                <td>{d.country}</td>
                <td>{d.year}</td>
                <td>{d.city}</td>
                <td>
                    <a href="/IRG/{d.country}/{d.year}/{d.city}">
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