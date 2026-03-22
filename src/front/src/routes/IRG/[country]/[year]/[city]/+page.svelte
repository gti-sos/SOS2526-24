<script>
    import { page } from '$app/stores';
    let { country, year, city } = $page.params;
    
    let dato = $state({ country, year, city, cost_usd_per_m2: 0, cost_change_range: "", rank: 0 });
    let mensaje = $state("");
    let esError = $state(false);

    const API = `/api/v2/international-construccion-costs/${country}/${year}/${city}`;

    async function getDatoActual() {
        const res = await fetch(API);
        if (res.ok) {
            dato = await res.json();
        } else {
            mensaje = `No se ha encontrado el registro para ${city} en ${year}.`;
            esError = true;
        }
    }

    async function guardarCambios() {
        const res = await fetch(API, {
            method: "PUT",
            body: JSON.stringify(dato),
            headers: { "Content-Type": "application/json" }
        });

        if (res.ok) {
            mensaje = "Los cambios se han guardado correctamente.";
            esError = false;
        } else if (res.status === 400) {
            mensaje = "Error: Los datos enviados no son correctos o los identificadores no coinciden.";
            esError = true;
        } else {
            mensaje = "Ha ocurrido un error inesperado al intentar actualizar.";
            esError = true;
        }
    }

    getDatoActual();
</script>

<h2>Editando registro: {city} ({year})</h2>

{#if mensaje}
    <p style="color: {esError ? 'red' : 'green'}; padding: 10px; border: 1px solid;">{mensaje}</p>
{/if}

<div>
    <p>País: <strong>{dato.country}</strong> (No editable)</p>
    <p>Año: <strong>{dato.year}</strong> (No editable)</p>
    
    <label>Coste USD por m²: <input type="number" bind:value={dato.cost_usd_per_m2} /></label><br/>
    <label>Rango de cambio: <input bind:value={dato.cost_change_range} /></label><br/>
    <label>Ranking: <input type="number" bind:value={dato.rank} /></label><br/>

    <button onclick={guardarCambios}>Guardar Cambios</button>
    <a href="/IRG"><button style="background: #ccc;">Volver al listado</button></a>
</div>