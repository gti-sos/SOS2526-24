<svelte:head>
  <title>EBP | Recreation Culture Expenditure</title>
  <meta
    name="description"
    content="Management panel for recreation and culture expenditure data."
  />
</svelte:head>

<script>
  import { onMount } from 'svelte';

  const crearDatoInicial = () => ({
    country: "",
    year: "",
    recreation_value: "",
    total_household_consumption: "",
    recreation_share: "",
    population: "",
    recreation_per_capita: ""
  });

  let datos = $state([]);
  let nuevoDato = $state(crearDatoInicial());
  let mensaje = $state("");
  let esError = $state(false);

  const API = "/api/v1/recreation-culture-expenditure";

  async function getDatos() {
    const res = await fetch(API);
    if (res.ok) {
      datos = await res.json();
    } else {
      mensaje = "Error al cargar los datos.";
      esError = true;
    }
  }

  async function cargarDatosIniciales() {
    const rutas = [
      `${API}/loadinitialData`,
      `${API}/loadInitialData`
    ];

    let res = null;

    for (const ruta of rutas) {
      res = await fetch(ruta);
      if (res.ok || res.status === 409) break;
    }

    if (res && res.ok) {
      mensaje = "Datos iniciales cargados correctamente.";
      esError = false;
      getDatos();
    } else if (res && res.status === 409) {
      mensaje = "Los datos iniciales ya estaban cargados.";
      esError = true;
    } else {
      mensaje = "Error al cargar los datos iniciales.";
      esError = true;
    }
  }

  async function crearDato() {
    const res = await fetch(API, {
      method: "POST",
      body: JSON.stringify({
        ...nuevoDato,
        year: Number(nuevoDato.year),
        recreation_value: Number(nuevoDato.recreation_value),
        total_household_consumption: Number(nuevoDato.total_household_consumption),
        recreation_share: Number(nuevoDato.recreation_share),
        population: Number(nuevoDato.population),
        recreation_per_capita: Number(nuevoDato.recreation_per_capita)
      }),
      headers: { "Content-Type": "application/json" }
    });

    if (res.status === 201) {
      mensaje = "¡Recurso creado con éxito!";
      esError = false;
      nuevoDato = crearDatoInicial();
      getDatos();
    } else if (res.status === 409) {
      mensaje = `Error: Ya existe un dato para ${nuevoDato.country} en ${nuevoDato.year}.`;
      esError = true;
    } else {
      mensaje = "Error: Asegúrate de rellenar todos los campos correctamente.";
      esError = true;
    }
  }

  async function borrarDato(country, year) {
    if (!confirm(`¿Estás seguro de borrar el dato de ${country} (${year})?`)) return;

    const res = await fetch(`${API}/${country}/${year}`, { method: "DELETE" });

    if (res.ok) {
      mensaje = `Se ha borrado el registro de ${country} (${year}) correctamente.`;
      esError = false;
      getDatos();
    } else {
      mensaje = "Error al borrar el registro.";
      esError = true;
    }
  }

  async function borrarTodo() {
    if (!confirm("¡ATENCIÓN! Vas a borrar TODOS los datos. ¿Continuar?")) return;

    const res = await fetch(API, { method: "DELETE" });

    if (res.ok) {
      mensaje = "Se han eliminado todos los registros de la base de datos.";
      esError = false;
      getDatos();
    } else {
      mensaje = "Error al borrar todos los registros.";
      esError = true;
    }
  }

  onMount(() => {
    getDatos();
  });
</script>

<div class="page">
  <section class="hero-shell">
    <div class="hero-card small-hero">
      <div class="hero-overlay"></div>

      <div class="hero-content">
        <div class="hero-text">
          <p class="eyebrow">EBP · Recreation & Culture</p>
          <h1>
            Gestión de gasto<br />
            en ocio y cultura
          </h1>

          <p>
            Panel de administración para consultar, añadir y eliminar registros del conjunto
            de datos sobre gasto en ocio y cultura, consumo doméstico y gasto per cápita.
          </p>
        </div>
      </div>
    </div>
  </section>

  <section class="cards-section">
    {#if mensaje}
      <div class:alert-error={esError} class:alert-success={!esError} class="alert-box">
        {mensaje}
      </div>
    {/if}

    <div class="section-heading">
      <p class="eyebrow">Management panel</p>
      <h2>Administración de registros</h2>
      <p>
        Aquí puedes cargar datos iniciales, insertar nuevos registros manualmente y gestionar
        el contenido almacenado en la API.
      </p>
    </div>

    <div class="cards-grid two-columns">
      <article class="team-card form-card">
        <div class="card-top">
          <h3>Nuevo registro</h3>
          <span class="badge">CREATE</span>
        </div>

        <div class="form-grid">
          <div class="field">
            <label>País</label>
            <input bind:value={nuevoDato.country} placeholder="País" />
          </div>

          <div class="field">
            <label>Año</label>
            <input bind:value={nuevoDato.year} type="number" placeholder="Año" />
          </div>

          <div class="field">
            <label>Gasto en ocio y cultura</label>
            <input bind:value={nuevoDato.recreation_value} type="number" placeholder="Valor" />
          </div>

          <div class="field">
            <label>Consumo total de los hogares</label>
            <input
              bind:value={nuevoDato.total_household_consumption}
              type="number"
              placeholder="Valor"
            />
          </div>

          <div class="field">
            <label>Porcentaje ocio/cultura</label>
            <input
              bind:value={nuevoDato.recreation_share}
              type="number"
              step="any"
              placeholder="%"
            />
          </div>

          <div class="field">
            <label>Población</label>
            <input bind:value={nuevoDato.population} type="number" placeholder="Población" />
          </div>

          <div class="field full">
            <label>Gasto por persona</label>
            <input
              bind:value={nuevoDato.recreation_per_capita}
              type="number"
              step="any"
              placeholder="Per cápita"
            />
          </div>
        </div>

        <div class="card-links buttons-row">
          <button class="action-btn primary" onclick={crearDato}>
            Añadir registro
          </button>
          <button class="action-btn secondary" onclick={cargarDatosIniciales}>
            Carga datos
          </button>
        </div>
      </article>

      <article class="team-card">
        <div class="card-top">
          <h3>Acciones rápidas</h3>
          <span class="badge">TOOLS</span>
        </div>

        <p>
          Usa esta sección para recargar el dataset inicial o limpiar completamente la base
          de datos del recurso.
        </p>

        <div class="card-links buttons-column">
          <button class="action-btn secondary" onclick={getDatos}>
            Recargar listado
          </button>
          <button class="action-btn secondary" onclick={cargarDatosIniciales}>
            Cargar datos iniciales
          </button>
          <button class="action-btn danger" onclick={borrarTodo}>
            Limpiar base de datos completa
          </button>
        </div>
      </article>
    </div>

    <div class="table-card">
      <div class="card-top table-head">
        <div>
          <p class="eyebrow dark">Stored dataset</p>
          <h3>Listado de registros</h3>
        </div>
        <span class="badge">{datos.length} registros</span>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>País</th>
              <th>Año</th>
              <th>Gasto ocio/cultura</th>
              <th>Consumo hogares</th>
              <th>% ocio/cultura</th>
              <th>Población</th>
              <th>Gasto per cápita</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {#each datos as d}
              <tr>
                <td>{d.country}</td>
                <td>{d.year}</td>
                <td>{d.recreation_value}</td>
                <td>{d.total_household_consumption}</td>
                <td>{d.recreation_share}</td>
                <td>{d.population}</td>
                <td>{d.recreation_per_capita}</td>
                <td>
                  <button
                    class="mini-btn delete"
                    onclick={() => borrarDato(d.country, d.year)}
                  >
                    Borrar
                  </button>
                </td>
              </tr>
            {/each}

            {#if datos.length === 0}
              <tr>
                <td colspan="8" class="empty-state">
                  No hay registros cargados todavía.
                </td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>
    </div>
  </section>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Cormorant+Garamond:wght@500;600;700&display=swap');

  :global(html) {
    scroll-behavior: smooth;
  }

  :global(body) {
    margin: 0;
    font-family: 'Inter', system-ui, sans-serif;
    color: #111827;
    background:
      radial-gradient(circle at 48% 38%, rgba(255, 255, 255, 0.92) 0%, rgba(255, 255, 255, 0.38) 18%, rgba(255, 255, 255, 0) 34%),
      linear-gradient(90deg, #8b0f45 0%, #b74263 22%, #f4d7cf 50%, #d98a67 76%, #c96b4b 100%);
    min-height: 100vh;
  }

  .page {
    padding: 14px 18px 40px;
  }

  .hero-shell,
  .cards-section {
    max-width: 1420px;
    margin: 0 auto;
  }

  .hero-card {
    position: relative;
    overflow: hidden;
    border-radius: 28px;
    background:
      linear-gradient(rgba(20, 16, 14, 0.28), rgba(20, 16, 14, 0.28)),
      url('/hero-campus.jpg') center/cover no-repeat;
    box-shadow: 0 22px 60px rgba(0, 0, 0, 0.22);
  }

  .small-hero {
    min-height: 420px;
  }

  .hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.52) 0%,
      rgba(0, 0, 0, 0.22) 40%,
      rgba(0, 0, 0, 0.12) 100%
    );
    pointer-events: none;
  }

  .hero-content {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: flex-start;
    min-height: 420px;
    padding: 78px 58px 48px;
  }

  .hero-text {
    max-width: 760px;
    color: #fffaf6;
  }

  .hero-text h1 {
    margin: 0 0 18px;
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: clamp(3.4rem, 6vw, 5.6rem);
    line-height: 0.92;
    font-weight: 600;
    letter-spacing: -0.03em;
  }

  .hero-text p {
    margin: 0;
    font-size: 1.08rem;
    line-height: 1.75;
    color: rgba(255, 248, 242, 0.96);
  }

  .cards-section {
    margin-top: 30px;
  }

  .section-heading {
    margin-bottom: 20px;
    color: #fff7f2;
  }

  .eyebrow {
    margin: 0 0 8px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.82rem;
    font-weight: 700;
    color: rgba(255, 247, 241, 0.88);
  }

  .eyebrow.dark {
    color: #7a1837;
  }

  .section-heading h2 {
    margin: 0 0 10px;
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: clamp(2.2rem, 4vw, 3.4rem);
    font-weight: 600;
    color: #fff9f5;
  }

  .section-heading p {
    margin: 0;
    max-width: 900px;
    line-height: 1.7;
    color: rgba(255, 245, 238, 0.95);
  }

  .alert-box {
    margin-bottom: 18px;
    padding: 14px 16px;
    border-radius: 16px;
    font-weight: 700;
    backdrop-filter: blur(8px);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
  }

  .alert-success {
    background: rgba(236, 253, 245, 0.92);
    color: #065f46;
    border: 1px solid rgba(16, 185, 129, 0.35);
  }

  .alert-error {
    background: rgba(254, 242, 242, 0.94);
    color: #991b1b;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .cards-grid {
    display: grid;
    gap: 20px;
  }

  .two-columns {
    grid-template-columns: 1.35fr 0.85fr;
    margin-bottom: 24px;
  }

  .team-card,
  .table-card {
    background: rgba(250, 245, 239, 0.94);
    border: 1px solid rgba(255, 255, 255, 0.32);
    border-radius: 24px;
    padding: 22px;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(8px);
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
  }

  .team-card h3,
  .table-card h3 {
    margin: 0;
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 2rem;
    line-height: 1;
    color: #111827;
  }

  .badge {
    background: #efe3b1;
    color: #111827;
    border-radius: 999px;
    padding: 7px 12px;
    font-size: 0.8rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .team-card p {
    margin: 0 0 10px;
    color: #374151;
    line-height: 1.7;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    margin-top: 10px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .field.full {
    grid-column: 1 / -1;
  }

  .field label {
    font-size: 0.9rem;
    font-weight: 700;
    color: #7a1837;
  }

  .field input {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid rgba(122, 24, 55, 0.14);
    background: rgba(255, 255, 255, 0.76);
    border-radius: 14px;
    padding: 13px 14px;
    font-size: 0.96rem;
    color: #111827;
    outline: none;
    transition: border-color 0.15s ease, transform 0.15s ease, background 0.15s ease;
  }

  .field input:focus {
    border-color: #b74263;
    background: #ffffff;
    transform: translateY(-1px);
  }

  .card-links {
    display: flex;
    gap: 10px;
    margin-top: 18px;
  }

  .buttons-row {
    flex-wrap: wrap;
  }

  .buttons-column {
    flex-direction: column;
  }

  .action-btn,
  .mini-btn {
    border: none;
    cursor: pointer;
    font-family: inherit;
    font-weight: 700;
    transition: transform 0.15s ease, opacity 0.15s ease, background 0.15s ease;
  }

  .action-btn:hover,
  .mini-btn:hover {
    transform: translateY(-1px);
  }

  .action-btn {
    border-radius: 14px;
    padding: 12px 16px;
    font-size: 0.95rem;
  }

  .primary {
    background: #7a1837;
    color: #fffaf6;
  }

  .secondary {
    background: rgba(255, 255, 255, 0.7);
    color: #7a1837;
  }

  .danger {
    background: #b42318;
    color: #fff;
  }

  .table-head {
    margin-bottom: 18px;
  }

  .table-wrap {
    overflow-x: auto;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.52);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 980px;
  }

  thead th {
    text-align: left;
    padding: 15px 14px;
    font-size: 0.88rem;
    color: #7a1837;
    background: rgba(247, 238, 231, 0.92);
    border-bottom: 1px solid rgba(122, 24, 55, 0.12);
  }

  tbody td {
    padding: 14px;
    color: #374151;
    border-bottom: 1px solid rgba(17, 24, 39, 0.08);
    background: rgba(255, 255, 255, 0.58);
  }

  tbody tr:hover td {
    background: rgba(255, 255, 255, 0.78);
  }

  .mini-btn {
    border-radius: 10px;
    padding: 9px 12px;
    font-size: 0.88rem;
  }

  .mini-btn.delete {
    background: #fee2e2;
    color: #991b1b;
  }

  .empty-state {
    text-align: center;
    font-style: italic;
    color: #6b7280;
    padding: 24px;
  }

  @media (max-width: 1100px) {
    .two-columns {
      grid-template-columns: 1fr;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 820px) {
    .page {
      padding: 12px 12px 30px;
    }

    .hero-content {
      padding: 54px 24px 30px;
      min-height: 340px;
    }

    .hero-text h1 {
      font-size: clamp(2.8rem, 12vw, 4.5rem);
    }

    .hero-text p {
      font-size: 1rem;
      line-height: 1.65;
    }

    .team-card,
    .table-card {
      padding: 18px;
    }
  }
</style>