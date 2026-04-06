<script>
    import { page } from '$app/stores';
    let { country, year } = $page.params;

    let dato = $state({
        country,
        year: parseInt(year),
        avg_monthly_nc: 0,
        avg_monthly_usd: 0,
        exchange_rate: 0,
        currency: ""
    });
    let mensaje = $state("");
    let esError = $state(false);

    const API = `/api/v2/average-monthly-wages/${country}/${year}`;

    async function getDatoActual() {
        const res = await fetch(API);
        if (res.ok) {
            dato = await res.json();
        } else if (res.status === 404) {
            mensaje = `No existe un registro de salario para el país '${country}' en el año ${year}.`;
            esError = true;
        } else {
            mensaje = "Ha ocurrido un error inesperado al cargar el registro.";
            esError = true;
        }
    }

    async function guardarCambios() {
        const res = await fetch(API, {
            method: "PUT",
            body: JSON.stringify({
                ...dato,
                year: parseInt(dato.year),
                avg_monthly_nc: parseFloat(dato.avg_monthly_nc),
                avg_monthly_usd: parseFloat(dato.avg_monthly_usd),
                exchange_rate: parseFloat(dato.exchange_rate)
            }),
            headers: { "Content-Type": "application/json" }
        });

        if (res.ok) {
            mensaje = "Los cambios se han guardado correctamente.";
            esError = false;
        } else if (res.status === 400) {
            mensaje = "Error: Los datos enviados no son correctos o los identificadores no coinciden con la URL.";
            esError = true;
        } else if (res.status === 404) {
            mensaje = `No existe un registro de salario para el país '${country}' en el año ${year}.`;
            esError = true;
        } else {
            mensaje = "Ha ocurrido un error inesperado al intentar actualizar el registro.";
            esError = true;
        }
    }

    getDatoActual();
</script>

<h2>Editando registro: {country} ({year})</h2>

{#if mensaje}
    <p style="color: {esError ? 'red' : 'green'}; padding: 10px; border: 1px solid;">{mensaje}</p>
{/if}

<div>
    <p>País: <strong>{dato.country}</strong> (No editable)</p>
    <p>Año: <strong>{dato.year}</strong> (No editable)</p>

    <label>Salario mensual medio (moneda local):
        <input type="number" bind:value={dato.avg_monthly_nc} />
    </label><br/>

    <label>Salario mensual medio (USD):
        <input type="number" bind:value={dato.avg_monthly_usd} />
    </label><br/>

    <label>Tipo de cambio:
        <input type="number" step="0.0001" bind:value={dato.exchange_rate} />
    </label><br/>

    <label>Moneda:
        <input bind:value={dato.currency} />
    </label><br/>

    <button onclick={guardarCambios}>Guardar Cambios</button>
    <a href="/average-monthly-wages">
        <button style="background: #ccc;">Volver al listado</button>
    </a>
</div>