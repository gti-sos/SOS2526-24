<script>
  import { onMount } from "svelte";

  const API = "/api/v2/international-construction-costs";

  const crearDatoInicial = () => ({
    country: "",
    year: "",
    city: "",
    cost_usd_per_m2: "",
    cost_change_range: "",
    rank: ""
  });

  const crearFiltrosIniciales = () => ({
    from: "",
    to: "",
    country: "",
    city: "",
    min_cost: "",
    max_cost: "",
    min_rank: "",
    max_rank: ""
  });

  let datos = $state([]);
  let nuevoDato = $state(crearDatoInicial());
  let filtros = $state(crearFiltrosIniciales());

  let mensaje = $state("");
  let esError = $state(false);
  let mostrarFiltros = $state(false);

  let temporizadorMensaje;

  function mostrarMensaje(texto, error = false) {
    clearTimeout(temporizadorMensaje);
    mensaje = texto;
    esError = error;

    temporizadorMensaje = setTimeout(() => {
      mensaje = "";
    }, 3500);
  }

  function formatearNumero(valor) {
    if (valor === null || valor === undefined || valor === "") return "—";
    const numero = Number(valor);
    if (Number.isNaN(numero)) return String(valor);
    return new Intl.NumberFormat("es-ES").format(numero);
  }

  async function getDatos() {
    try {
      const res = await fetch(API);

      if (res.ok) {
        datos = await res.json();
      } else {
        mostrarMensaje("No se pudieron cargar los registros.", true);
      }
    } catch {
      mostrarMensaje("Se produjo un problema de conexión al cargar los datos.", true);
    }
  }

  async function crearDato() {
    if (
      !nuevoDato.country.trim() ||
      nuevoDato.year === "" ||
      !nuevoDato.city.trim() ||
      nuevoDato.cost_usd_per_m2 === "" ||
      nuevoDato.cost_change_range === "" ||
      nuevoDato.rank === ""
    ) {
      mostrarMensaje("Completa todos los campos antes de añadir el registro.", true);
      return;
    }

    const payload = {
      country: nuevoDato.country.trim(),
      year: Number(nuevoDato.year),
      city: nuevoDato.city.trim(),
      cost_usd_per_m2: Number(nuevoDato.cost_usd_per_m2),
      cost_change_range: nuevoDato.cost_change_range.trim(),
      rank: Number(nuevoDato.rank)
    };

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.status === 201 || res.ok) {
        mostrarMensaje("Registro creado correctamente.");
        nuevoDato = crearDatoInicial();
        await getDatos();
      } else if (res.status === 409) {
        mostrarMensaje(
          `Ya existe un registro para ${payload.city}, ${payload.country} (${payload.year}).`,
          true
        );
      } else if (res.status === 400) {
        mostrarMensaje("Los datos enviados no son válidos.", true);
      } else {
        mostrarMensaje("No se pudo crear el registro.", true);
      }
    } catch {
      mostrarMensaje("Se produjo un problema de conexión al crear el registro.", true);
    }
  }

  async function borrarDato(country, year, city) {
    if (!confirm(`¿Seguro que quieres borrar el registro de ${city}, ${country} (${year})?`)) {
      return;
    }

    try {
      const res = await fetch(
        `${API}/${encodeURIComponent(country)}/${year}/${encodeURIComponent(city)}`,
        {
          method: "DELETE"
        }
      );

      if (res.ok) {
        mostrarMensaje(`Registro borrado correctamente: ${city}, ${country} (${year}).`);
        await getDatos();
      } else if (res.status === 404) {
        mostrarMensaje("El registro que intentas borrar no existe.", true);
      } else {
        mostrarMensaje("No se pudo borrar el registro.", true);
      }
    } catch {
      mostrarMensaje("Se produjo un problema de conexión al borrar el registro.", true);
    }
  }

  async function borrarTodo() {
    if (!confirm("¡Atención! Vas a borrar todos los datos. ¿Continuar?")) return;

    try {
      const res = await fetch(API, { method: "DELETE" });

      if (res.ok) {
        mostrarMensaje("Se han eliminado todos los registros.");
        await getDatos();
      } else {
        mostrarMensaje("No se pudieron eliminar todos los registros.", true);
      }
    } catch {
      mostrarMensaje("Se produjo un problema de conexión al borrar todos los registros.", true);
    }
  }

  async function cargarDatosIniciales() {
    try {
      const res = await fetch(`${API}/loadInitialData`);

      if (res.ok) {
        const datosCargados = await res.json();
        mostrarMensaje(`Se han cargado ${datosCargados.length} registros iniciales con éxito.`);
        await getDatos();
      } else {
        mostrarMensaje(
          "No se han podido cargar los datos iniciales. Puede que la base de datos no esté vacía.",
          true
        );
      }
    } catch {
      mostrarMensaje("Se produjo un problema de conexión al cargar los datos iniciales.", true);
    }
  }

  function toggleFiltros() {
    mostrarFiltros = !mostrarFiltros;
  }

  async function buscar() {
    try {
      const queryParams = new URLSearchParams();

      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
          queryParams.append(key, String(value));
        }
      });

      const res = await fetch(`${API}?${queryParams.toString()}`);

      if (res.ok) {
        datos = await res.json();
        mostrarMensaje(`Búsqueda finalizada: ${datos.length} resultado(s) encontrados.`);
      } else {
        mostrarMensaje("Error en los parámetros de búsqueda.", true);
      }
    } catch {
      mostrarMensaje("Se produjo un problema de conexión al filtrar los registros.", true);
    }
  }

  async function limpiarBusqueda() {
    filtros = crearFiltrosIniciales();
    await getDatos();
    mostrarMensaje("Filtros eliminados. Se muestran todos los registros.");
  }

  onMount(() => {
    getDatos();
  });
</script>

<div class="page">
  <div class="hero-shell">
    <p class="eyebrow">IRG · INTERNATIONAL CONSTRUCTION COSTS</p>
    <h1>Gestión de costes de construcción</h1>
  </div>

  {#if mensaje}
    <div class="message" class:error={esError} class:success={!esError}>
      {mensaje}
    </div>
  {/if}

  <section class="card">
    <div class="card-top">
      <div>
        <h3>Añadir nuevo registro</h3>
        <p class="card-subtitle">Alta</p>
      </div>
    </div>

    <div class="form-grid">
      <div class="field">
        <label for="new-country">País</label>
        <input id="new-country" bind:value={nuevoDato.country} placeholder="Ej. Spain" />
      </div>

      <div class="field">
        <label for="new-year">Año</label>
        <input id="new-year" bind:value={nuevoDato.year} type="number" placeholder="Ej. 2024" />
      </div>

      <div class="field">
        <label for="new-city">Ciudad</label>
        <input id="new-city" bind:value={nuevoDato.city} placeholder="Ej. Madrid" />
      </div>

      <div class="field">
        <label for="new-cost">Coste por metro cuadrado (USD)</label>
        <input
          id="new-cost"
          bind:value={nuevoDato.cost_usd_per_m2}
          type="number"
          placeholder="Ej. 3210"
        />
      </div>

      <div class="field">
        <label for="new-range">Rango de cambio</label>
        <input
          id="new-range"
          bind:value={nuevoDato.cost_change_range}
          placeholder="Ej. 10-20%"
        />
      </div>

      <div class="field">
        <label for="new-rank">Ranking</label>
        <input id="new-rank" bind:value={nuevoDato.rank} type="number" placeholder="Ej. 5" />
      </div>
    </div>

    <div class="button-row">
      <button class="action-btn primary-btn" type="button" onclick={crearDato}>
        Añadir registro
      </button>
    </div>
  </section>

  <section class="card">
    <div class="card-top">
      <div>
        <h3>Listado de registros</h3>
        <p class="card-subtitle">{datos.length} registro(s)</p>
      </div>
    </div>

    {#if datos.length > 0}
      <div class="table-wrap">
        <div class="table-head">
          <span>País</span>
          <span>Año</span>
          <span>Ciudad</span>
          <span>Coste por m²</span>
          <span>Rango de cambio</span>
          <span>Ranking</span>
          <span>Acciones</span>
        </div>

        {#each datos as d}
          <div class="table-row">
            <span>{d.country}</span>
            <span>{d.year}</span>
            <span>{d.city}</span>
            <span>{formatearNumero(d.cost_usd_per_m2)}</span>
            <span>{d.cost_change_range}</span>
            <span>{formatearNumero(d.rank)}</span>

            <div class="row-actions">
              <a
                class="mini-btn edit-btn"
                href={`/international-construction-costs/${encodeURIComponent(d.country)}/${d.year}/${encodeURIComponent(d.city)}`}
              >
                Editar
              </a>

              <button
                class="mini-btn delete-btn"
                type="button"
                onclick={() => borrarDato(d.country, d.year, d.city)}
              >
                Borrar
              </button>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="empty-box">No hay registros disponibles todavía.</div>
    {/if}

    <div class="button-row">
      <button class="action-btn neutral-btn" type="button" onclick={cargarDatosIniciales}>
        Cargar datos iniciales
      </button>

      <button class="action-btn danger-btn" type="button" onclick={borrarTodo}>
        Limpiar base de datos completa
      </button>
    </div>
  </section>

  <section class="card">
    <button class="action-btn dark-btn" type="button" onclick={toggleFiltros}>
      {mostrarFiltros ? "Cerrar filtros" : "Abrir buscador"}
    </button>

    {#if mostrarFiltros}
      <div class="filters-panel">
        <div class="filters-grid">
          <div class="field">
            <label for="filter-country">País</label>
            <input id="filter-country" bind:value={filtros.country} placeholder="Ej. Spain" />
          </div>

          <div class="field">
            <label for="filter-city">Ciudad</label>
            <input id="filter-city" bind:value={filtros.city} placeholder="Ej. Madrid" />
          </div>

          <div class="field">
            <label for="filter-from">Desde el año</label>
            <input id="filter-from" type="number" bind:value={filtros.from} />
          </div>

          <div class="field">
            <label for="filter-to">Hasta el año</label>
            <input id="filter-to" type="number" bind:value={filtros.to} />
          </div>

          <div class="field">
            <label for="filter-min-cost">Coste mínimo (USD/m²)</label>
            <input id="filter-min-cost" type="number" bind:value={filtros.min_cost} />
          </div>

          <div class="field">
            <label for="filter-max-cost">Coste máximo (USD/m²)</label>
            <input id="filter-max-cost" type="number" bind:value={filtros.max_cost} />
          </div>

          <div class="field">
            <label for="filter-min-rank">Ranking mínimo</label>
            <input id="filter-min-rank" type="number" bind:value={filtros.min_rank} />
          </div>

          <div class="field">
            <label for="filter-max-rank">Ranking máximo</label>
            <input id="filter-max-rank" type="number" bind:value={filtros.max_rank} />
          </div>
        </div>

        <div class="button-row">
          <button class="action-btn primary-btn" type="button" onclick={buscar}>
            Filtrar ahora
          </button>

          <button class="action-btn neutral-btn" type="button" onclick={limpiarBusqueda}>
            Limpiar filtros
          </button>
        </div>
      </div>
    {/if}
  </section>
</div>

<style>
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Cormorant+Garamond:wght@500;600;700&display=swap");

  :global(*) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    font-family: "Inter", system-ui, sans-serif;
    color: #2f3a39;
    background: linear-gradient(120deg, #485a57 0%, #6f827e 24%, #9fb0ad 58%, #d2ddd8 100%);
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
    color: #f4efe9;
  }

  h3 {
    margin: 0 0 0.35rem;
    color: #2f3a39;
  }

  .card-subtitle {
    margin: 0;
    color: #5d6d6a;
  }

  .card {
    background: rgba(247, 245, 243, 0.92);
    border: 1px solid rgba(47, 58, 57, 0.08);
    border-radius: 24px;
    box-shadow: 0 14px 34px rgba(44, 61, 57, 0.08);
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .card-top {
    margin-bottom: 1rem;
  }

  .message {
    margin: 0 0 1rem;
    padding: 0.9rem 1rem;
    border-radius: 18px;
    font-weight: 700;
    box-shadow: 0 10px 24px rgba(44, 61, 57, 0.07);
  }

  .message.success {
    background: #edf8ee;
    color: #3f8f52;
    border: 1px solid #9fd4a8;
  }

  .message.error {
    background: #fff0ef;
    color: #c6756d;
    border: 1px solid #efb3ad;
  }

  .form-grid,
  .filters-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(220px, 1fr));
    gap: 0.9rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  label {
    font-weight: 600;
    color: #38514d;
  }

  input {
    width: 100%;
    border: 1px solid rgba(47, 58, 57, 0.12);
    border-radius: 14px;
    padding: 0.8rem 0.9rem;
    background: #fbfbfa;
    color: #2f3a39;
  }

  .button-row {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-top: 1rem;
  }

  .action-btn,
  .mini-btn {
    border: none;
    border-radius: 999px;
    cursor: pointer;
    font-family: "Inter", sans-serif;
    font-weight: 700;
    transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
    text-decoration: none;
  }

  .action-btn:hover,
  .mini-btn:hover {
    transform: translateY(-1px);
    opacity: 0.96;
  }

  .action-btn {
    padding: 0.82rem 1.2rem;
    box-shadow: 0 8px 18px rgba(58, 77, 72, 0.08);
  }

  .primary-btn {
    background: #89a8a0;
    color: #f8faf9;
  }

  .neutral-btn {
    background: #d8d5d1;
    color: #425652;
  }

  .danger-btn {
    background: #dc9a90;
    color: #fff8f6;
  }

  .dark-btn {
    background: #2f3a39;
    color: #ffffff;
  }

  .table-wrap {
    overflow-x: auto;
    border: 1px solid rgba(47, 58, 57, 0.08);
    border-radius: 16px;
    background: #fbfbfa;
  }

  .table-head,
  .table-row {
    display: grid;
    grid-template-columns: 1fr 0.6fr 1fr 1fr 1fr 0.7fr 1.2fr;
    gap: 0.8rem;
    min-width: 980px;
    align-items: center;
    padding: 0.9rem 1rem;
  }

  .table-head {
    background: #f0ede8;
    color: #38514d;
    font-weight: 700;
  }

  .table-row {
    border-top: 1px solid rgba(47, 58, 57, 0.06);
  }

  .row-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .mini-btn {
    padding: 0.6rem 0.9rem;
    font-size: 0.88rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .edit-btn {
    background: #dce8e4;
    color: #26413c;
  }

  .delete-btn {
    background: #f2d2cf;
    color: #7a2f26;
  }

  .empty-box {
    min-height: 160px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16px;
    background: #fbfbfa;
    border: 1px solid rgba(47, 58, 57, 0.06);
    color: #6a7674;
    font-style: italic;
  }

  .filters-panel {
    margin-top: 1rem;
    border-top: 1px solid rgba(47, 58, 57, 0.08);
    padding-top: 1rem;
  }

  @media (max-width: 900px) {
    .form-grid,
    .filters-grid {
      grid-template-columns: 1fr;
    }

    .page {
      padding: 1rem 0.85rem 2rem;
    }
  }
</style>