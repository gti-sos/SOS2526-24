<script>
  import { onMount } from 'svelte';

  let datos = $state([]);
  let nuevoDato = $state({
    country: "",
    year: "",
    city: "",
    cost_usd_per_m2: "",
    cost_change_range: "",
    rank: ""
  });
  let mensaje = $state("");
  let esError = $state(false);
  const API = "/api/v2/international-construction-costs";

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
      getDatos();
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
    const res = await fetch(`${API}/loadInitialData`);

    if (res.ok) {
      const datosCargados = await res.json();
      mensaje = `Se han cargado ${datosCargados.length} registros iniciales con éxito.`;
      esError = false;
      getDatos();
    } else {
      mensaje = "Error: No se han podido cargar los datos iniciales (quizás la base de datos no está vacía).";
      esError = true;
    }
  }

  let mostrarFiltros = $state(false);

  function toggleFiltros() {
    mostrarFiltros = !mostrarFiltros;
  }

  let filtros = $state({
    from: "",
    to: "",
    country: "",
    city: "",
    min_cost: "",
    max_cost: "",
    min_rank: "",
    max_rank: ""
  });

  async function buscar() {
    const queryParams = new URLSearchParams();

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
    getDatos();
  }
</script>

<div class="page">
  <div class="hero-shell">
    <p class="eyebrow">IRG · INTERNATIONAL CONSTRUCTION COSTS</p>
    <h1>Gestión de costes de construcción</h1>
  </div>

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
        <th>País</th>
        <th>Año</th>
        <th>Ciudad</th>
        <th>Coste por metro cuadrado</th>
        <th>Acciones</th>
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
    Carga datos iniciales
  </button>

  <button onclick={toggleFiltros} style="background: #333; color: white; margin-bottom: 10px;">
    {mostrarFiltros ? "Cerrar Filtros" : "Abrir Buscador"}
  </button>

  {#if mostrarFiltros}
    <section style="background: #f1f1f1; padding: 15px; border-radius: 8px; border: 1px solid #ccc; margin-bottom: 20px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div>
          <label>País: <input bind:value={filtros.country} placeholder="Ej: Spain" style="width: 100%;" /></label><br />
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
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Cormorant+Garamond:wght@500;600;700&display=swap');

  :global(*) {
    box-sizing: border-box;
  }

  :global(body) {
    color: #2f3a39;
  }

  .page {
    max-width: 1180px;
    margin: 0 auto;
    padding: 1.1rem 1rem 2.4rem;
  }

  .hero-shell {
    margin-bottom: 1.1rem;
  }

  .eyebrow {
    margin: 0 0 0.55rem;
    font-family: "Inter", sans-serif;
    font-size: 1rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #f4efe9;
  }

  h1 {
    margin: 0 0 1.4rem;
    font-family: "Cormorant Garamond", serif;
    font-size: clamp(3.2rem, 6vw, 4.8rem);
    line-height: 1.02;
    font-weight: 700;
    color: #f4efe9;
    letter-spacing: -0.02em;
  }

  h3 {
    margin: 0 0 1rem;
    font-family: "Inter", sans-serif;
    font-size: 1.55rem;
    font-weight: 700;
    color: #243c39;
  }

  p {
    font-family: "Inter", sans-serif;
  }

  label {
    display: block;
    margin-bottom: 0.55rem;
    font-family: "Inter", sans-serif;
    font-size: 0.96rem;
    font-weight: 600;
    color: #415653;
  }

  input {
    width: 100%;
    padding: 0.9rem 1rem;
    border-radius: 16px;
    border: 1px solid rgba(63, 83, 78, 0.12);
    background: rgba(255, 255, 255, 0.62);
    color: #304744;
    font-family: "Inter", sans-serif;
    font-size: 0.98rem;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  }

  input::placeholder {
    color: #7e8d89;
  }

  input:focus {
    border-color: rgba(120, 154, 145, 0.72);
    box-shadow: 0 0 0 4px rgba(168, 193, 186, 0.18);
    background: rgba(255, 255, 255, 0.82);
  }

  section {
    background: rgba(247, 245, 243, 0.92) !important;
    border-radius: 28px;
    padding: 1.4rem 1.3rem;
    margin-bottom: 1.4rem;
    border: 1px solid rgba(56, 74, 70, 0.06);
    box-shadow: 0 14px 34px rgba(44, 61, 57, 0.08);
    backdrop-filter: blur(4px);
  }

  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    overflow: hidden;
    border-radius: 24px;
    background: rgba(247, 245, 243, 0.94);
    border: 1px solid rgba(56, 74, 70, 0.06);
    box-shadow: 0 14px 34px rgba(44, 61, 57, 0.08);
    font-family: "Inter", sans-serif;
    margin-top: 0.6rem;
  }

  thead tr {
    background: #e8e4df;
  }

  th {
    text-align: left;
    padding: 1rem 0.9rem;
    font-size: 0.95rem;
    font-weight: 700;
    color: #445754;
    border-bottom: 1px solid rgba(68, 87, 84, 0.08);
  }

  td {
    padding: 0.95rem 0.9rem;
    font-size: 0.96rem;
    color: #38514d;
    border-bottom: 1px solid rgba(68, 87, 84, 0.06);
    background: rgba(255, 255, 255, 0.25);
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  tbody tr:hover td {
    background: rgba(231, 239, 236, 0.42);
  }

  button {
    border: none;
    border-radius: 999px;
    padding: 0.82rem 1.2rem;
    font-family: "Inter", sans-serif;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
    box-shadow: 0 8px 18px rgba(58, 77, 72, 0.08);
  }

  button:hover {
    transform: translateY(-1px);
    opacity: 0.95;
  }

  button:active {
    transform: translateY(0);
  }

  a {
    text-decoration: none;
  }

  a button {
    background: #cfd9d4;
    color: #264744;
  }

  /* Mensajes pastel */
  p[style*="font-weight: bold"] {
    margin: 0 0 1.2rem;
    border-radius: 18px;
    box-shadow: 0 10px 24px rgba(44, 61, 57, 0.07);
    font-family: "Inter", sans-serif;
    font-weight: 700;
  }

  p[style*="color: green"] {
    background: #edf8ee !important;
    color: #3f8f52 !important;
    border: 1px solid #9fd4a8 !important;
  }

  p[style*="color: red"] {
    background: #fff0ef !important;
    color: #c6756d !important;
    border: 1px solid #efb3ad !important;
  }

  section:first-of-type {
    display: grid;
    grid-template-columns: repeat(3, minmax(180px, 1fr));
    gap: 0.9rem;
    align-items: end;
  }

  section:first-of-type h3 {
    grid-column: 1 / -1;
  }

  section:first-of-type button {
    width: fit-content;
    background: #89a8a0;
    color: #f8faf9;
  }

  table + button,
  table + button + button,
  table + button + button + button {
    margin-top: 1.2rem;
    margin-right: 0.6rem;
  }

  button[style*="background: #333"] {
    background: #f4efe9 !important;
    color: #243c39 !important;
    box-shadow: 0 8px 18px rgba(44, 61, 57, 0.08);
  }

  section[style*="grid-template-columns: 1fr 1fr"] {
    background: rgba(247, 245, 243, 0.92) !important;
  }

  section[style*="grid-template-columns: 1fr 1fr"] > div[style*="display: grid"],
  section[style*="grid-template-columns: 1fr 1fr"] > div {
    color: #38514d;
  }

  button[style*="background: #007bff"] {
    background: #89a8a0 !important;
    color: #f8faf9 !important;
  }

  button[style*="background: #6c757d"] {
    background: #d8d5d1 !important;
    color: #425652 !important;
  }

  button[style*="background: red"] {
    background: #dc9a90 !important;
    color: #fff8f6 !important;
  }

  button[style*="background: #ffcccc"] {
    background: #dc9a90 !important;
    color: #7a2f26 !important;
  }

  /* Carga datos iniciales en verde pastel */
  button[onclick={cargarDatosIniciales}] {
    background: #a9cbb7 !important;
    color: #f7fbf8 !important;
  }

  br {
    display: block;
    content: "";
    margin-bottom: 0.35rem;
  }

  @media (max-width: 1100px) {
    .page {
      max-width: 1000px;
      padding: 1rem 0.9rem 2rem;
    }

    h1 {
      font-size: clamp(2.6rem, 8vw, 4rem);
    }

    section:first-of-type {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 720px) {
    .page {
      padding: 0.8rem 0.8rem 1.8rem;
    }

    section:first-of-type {
      grid-template-columns: 1fr;
    }

    table {
      display: block;
      overflow-x: auto;
      white-space: nowrap;
    }

    th,
    td {
      min-width: 140px;
    }
  }
</style>