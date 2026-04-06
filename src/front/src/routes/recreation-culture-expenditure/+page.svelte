<svelte:head>
  <title>EBP | Recreation Culture Expenditure</title>
  <meta
    name="description"
    content="Panel de gestión de datos sobre gasto en ocio y cultura."
  />
</svelte:head>

<script>
  import { onMount } from "svelte";

  const crearDatoInicial = () => ({
    country: "",
    year: "",
    recreation_value: "",
    total_household_consumption: "",
    population: ""
  });

  let datos = $state([]);
  let nuevoDato = $state(crearDatoInicial());
  let mensaje = $state("");
  let esError = $state(false);
  let mostrarPanelFiltros = $state(false);

  // Estado de filtros del frontend
  let filtros = $state({
    country: "",
    year: "",
    from: "",
    to: "",
    min_recreation_value: "",
    max_recreation_value: "",
    min_population: "",
    max_population: ""
  });

  const API = "/api/v2/recreation-culture-expenditure";

  function mostrarMensaje(texto, error = false) {
    mensaje = texto;
    esError = error;

    setTimeout(() => {
      mensaje = "";
    }, 3500);
  }

  async function getDatos() {
    try {
      const res = await fetch(API);

      if (res.ok) {
        datos = await res.json();
      } else {
        mostrarMensaje("ERROR: No se pudieron cargar los registros.", true);
      }
    } catch (error) {
      mostrarMensaje("ERROR: Se produjo un problema de conexión al cargar los datos.", true);
    }
  }

  async function buscarDatos() {
    try {
      const queryParams = new URLSearchParams();

      // Búsquedas exactas
      if (filtros.country?.trim() !== "") {
        queryParams.append("country", filtros.country.trim());
      }

      if (filtros.year !== "" && filtros.year !== null && filtros.year !== undefined) {
        queryParams.append("year", String(filtros.year));
      }

      // Rangos de año
      if (filtros.from !== "" && filtros.from !== null && filtros.from !== undefined) {
        queryParams.append("year_gte", String(filtros.from));
      }

      if (filtros.to !== "" && filtros.to !== null && filtros.to !== undefined) {
        queryParams.append("year_lte", String(filtros.to));
      }

      // Rangos de gasto en ocio y cultura
      if (
        filtros.min_recreation_value !== "" &&
        filtros.min_recreation_value !== null &&
        filtros.min_recreation_value !== undefined
      ) {
        queryParams.append("recreation_value_gte", String(filtros.min_recreation_value));
      }

      if (
        filtros.max_recreation_value !== "" &&
        filtros.max_recreation_value !== null &&
        filtros.max_recreation_value !== undefined
      ) {
        queryParams.append("recreation_value_lte", String(filtros.max_recreation_value));
      }

      // Rangos de población
      if (
        filtros.min_population !== "" &&
        filtros.min_population !== null &&
        filtros.min_population !== undefined
      ) {
        queryParams.append("population_gte", String(filtros.min_population));
      }

      if (
        filtros.max_population !== "" &&
        filtros.max_population !== null &&
        filtros.max_population !== undefined
      ) {
        queryParams.append("population_lte", String(filtros.max_population));
      }

      const url = queryParams.toString() ? `${API}?${queryParams.toString()}` : API;

      const res = await fetch(url);

      if (res.ok) {
        datos = await res.json();
        mostrarMensaje(`Búsqueda completada: ${datos.length} resultados encontrados.`);
      } else {
        mostrarMensaje("ERROR: Los filtros introducidos no son válidos.", true);
      }
    } catch (error) {
      mostrarMensaje("ERROR: Se produjo un problema de conexión al realizar la búsqueda.", true);
    }
  }

  async function limpiarBusqueda() {
    filtros = {
      country: "",
      year: "",
      from: "",
      to: "",
      min_recreation_value: "",
      max_recreation_value: "",
      min_population: "",
      max_population: ""
    };

    await getDatos();
    mostrarMensaje("Filtros eliminados. Se muestran todos los registros.");
  }

  async function cargarDatosIniciales() {
    const rutas = [`${API}/loadInitialData`, `${API}/loadinitialData`];

    let res = null;

    try {
      for (const ruta of rutas) {
        res = await fetch(ruta);
        if (res.ok || res.status === 409) break;
      }

      if (res && res.ok) {
        mostrarMensaje("Datos iniciales cargados correctamente.");
        await getDatos();
      } else if (res && res.status === 409) {
        mostrarMensaje("ERROR: Los datos iniciales ya estaban cargados.", true);
      } else {
        mostrarMensaje("ERROR: No fue posible cargar los datos iniciales.", true);
      }
    } catch (error) {
      mostrarMensaje(
        "ERROR: Se produjo un problema de conexión al cargar los datos iniciales.",
        true
      );
    }
  }

  function formularioValido() {
    return (
      nuevoDato.country.trim() !== "" &&
      nuevoDato.year !== "" &&
      nuevoDato.recreation_value !== "" &&
      nuevoDato.total_household_consumption !== "" &&
      nuevoDato.population !== ""
    );
  }

  async function crearDato() {
    if (!formularioValido()) {
      mostrarMensaje(
        "ERROR: Completa todos los campos obligatorios antes de añadir el registro.",
        true
      );
      return;
    }

    const payload = {
      country: nuevoDato.country.trim(),
      year: Number(nuevoDato.year),
      recreation_value: Number(nuevoDato.recreation_value),
      total_household_consumption: Number(nuevoDato.total_household_consumption),
      population: Number(nuevoDato.population)
    };

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.status === 201) {
        mostrarMensaje("Registro creado correctamente.");
        nuevoDato = crearDatoInicial();
        await getDatos();
      } else if (res.status === 409) {
        mostrarMensaje(
          `ERROR: Ya existe un registro para ${payload.country} en el año ${payload.year}.`,
          true
        );
      } else if (res.status === 400) {
        mostrarMensaje(
          "ERROR: Los datos introducidos no son válidos. Revisa los campos obligatorios.",
          true
        );
      } else {
        mostrarMensaje("ERROR: No se pudo crear el registro.", true);
      }
    } catch (error) {
      mostrarMensaje("ERROR: Se produjo un problema de conexión al crear el registro.", true);
    }
  }

  async function borrarDato(country, year) {
    if (!confirm(`¿Estás seguro de que quieres borrar el registro de ${country} (${year})?`)) {
      return;
    }

    try {
      const res = await fetch(`${API}/${country}/${year}`, {
        method: "DELETE"
      });

      if (res.ok) {
        mostrarMensaje(`Se ha borrado correctamente el registro de ${country} (${year}).`);
        await getDatos();
      } else if (res.status === 404) {
        mostrarMensaje(`ERROR: No existe el registro de ${country} (${year}).`, true);
      } else {
        mostrarMensaje("ERROR: No se pudo borrar el registro.", true);
      }
    } catch (error) {
      mostrarMensaje("ERROR: Se produjo un problema de conexión al borrar el registro.", true);
    }
  }

  async function borrarTodo() {
    if (!confirm("Vas a eliminar todos los registros. ¿Deseas continuar?")) {
      return;
    }

    try {
      const res = await fetch(API, { method: "DELETE" });

      if (res.ok) {
        mostrarMensaje("Se han eliminado todos los registros de la base de datos.");
        await getDatos();
      } else {
        mostrarMensaje("ERROR: No se pudieron eliminar todos los registros.", true);
      }
    } catch (error) {
      mostrarMensaje("ERROR: Se produjo un problema de conexión al borrar todos los registros.", true);
    }
  }

  onMount(() => {
    getDatos();
  });
</script>

<div class="page">
  <section class="hero-shell">
    <div class="hero-card">
      <div class="hero-content">
        <div class="hero-text">
          <p class="eyebrow">EBP · RECREATION & CULTURE</p>
          <h1>Gasto en ocio y cultura</h1>
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

    <div class="search-toolbar">
      <button
        class="filters-main-btn"
        type="button"
        onclick={() => (mostrarPanelFiltros = !mostrarPanelFiltros)}
      >
        {#if mostrarPanelFiltros}
          Ocultar búsqueda y filtros
        {:else}
          Búsqueda y filtros
        {/if}
      </button>
    </div>

    {#if mostrarPanelFiltros}
      <div class="search-panel">
        <div class="search-panel-header">
          <h3>Buscar registros</h3>
          <p class="search-subtitle">
            Completa solo los filtros que quieras usar y pulsa en buscar.
          </p>
        </div>

        <div class="filters-grid">
          <div class="field">
            <label for="filtro-country">País</label>
            <input
              id="filtro-country"
              bind:value={filtros.country}
              type="text"
              placeholder="Ej. Canada"
            />
          </div>

          <div class="field">
            <label for="filtro-year">Año exacto</label>
            <input
              id="filtro-year"
              bind:value={filtros.year}
              type="number"
              placeholder="Ej. 2024"
            />
          </div>

          <div class="field">
            <label for="filtro-from">Desde el año</label>
            <input
              id="filtro-from"
              bind:value={filtros.from}
              type="number"
              placeholder="Ej. 2020"
            />
          </div>

          <div class="field">
            <label for="filtro-to">Hasta el año</label>
            <input
              id="filtro-to"
              bind:value={filtros.to}
              type="number"
              placeholder="Ej. 2024"
            />
          </div>

          <div class="field">
            <label for="filtro-min-recreation">Gasto mínimo en ocio y cultura</label>
            <input
              id="filtro-min-recreation"
              bind:value={filtros.min_recreation_value}
              type="number"
              placeholder="Mínimo"
            />
          </div>

          <div class="field">
            <label for="filtro-max-recreation">Gasto máximo en ocio y cultura</label>
            <input
              id="filtro-max-recreation"
              bind:value={filtros.max_recreation_value}
              type="number"
              placeholder="Máximo"
            />
          </div>

          <div class="field">
            <label for="filtro-min-population">Población mínima</label>
            <input
              id="filtro-min-population"
              bind:value={filtros.min_population}
              type="number"
              placeholder="Mínima"
            />
          </div>

          <div class="field">
            <label for="filtro-max-population">Población máxima</label>
            <input
              id="filtro-max-population"
              bind:value={filtros.max_population}
              type="number"
              placeholder="Máxima"
            />
          </div>
        </div>

        <div class="search-actions">
          <button class="action-btn secondary" type="button" onclick={buscarDatos}>
            Buscar
          </button>
          <button class="action-btn clear-btn" type="button" onclick={limpiarBusqueda}>
            Limpiar filtros
          </button>
        </div>
      </div>
    {/if}

    <div class="dashboard-layout">
      <div class="main-column">
        <div class="main-panel">
          <div class="panel-header">
            <h3>Listado de registros</h3>
            <span class="counter-badge">{datos.length} registros</span>
          </div>

          <div class="list-area">
            {#if datos.length > 0}
              <div class="records-table-wrap">
                <div class="records-table">
                  <div class="records-head">
                    <div>País</div>
                    <div>Año</div>
                    <div>Gasto ocio/cultura</div>
                    <div>Consumo hogares</div>
                    <div>% ocio/cultura</div>
                    <div>Población</div>
                    <div>Gasto por persona</div>
                    <div>Acciones</div>
                  </div>

                  {#each datos as d}
                    <div class="records-row">
                      <div>{d.country}</div>
                      <div>{d.year}</div>
                      <div>{d.recreation_value}</div>
                      <div>{d.total_household_consumption}</div>
                      <div>{d.recreation_share}</div>
                      <div>{d.population}</div>
                      <div>{d.recreation_per_capita}</div>
                      <div class="row-actions">
                        <a
                          class="mini-btn edit link-btn"
                          href={`/recreation-culture-expenditure/${encodeURIComponent(d.country)}/${d.year}`}
                        >
                          Editar
                        </a>
                        <button
                          class="mini-btn delete"
                          type="button"
                          onclick={() => borrarDato(d.country, d.year)}
                        >
                          Borrar
                        </button>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {:else}
              <div class="empty-state-box">
                No hay registros cargados todavía.
              </div>
            {/if}
          </div>

          <div class="panel-actions">
            <button class="action-btn secondary" type="button" onclick={cargarDatosIniciales}>
              Cargar datos iniciales
            </button>

            <button class="action-btn danger" type="button" onclick={borrarTodo}>
              Eliminar todos los registros
            </button>
          </div>
        </div>
      </div>

      <div class="side-column">
        <article class="side-panel">
          <div class="card-top">
            <h3>Nuevo registro</h3>
            <span class="badge">Alta</span>
          </div>

          <div class="form-grid">
            <div class="field">
              <label for="nuevo-country">País</label>
              <input id="nuevo-country" bind:value={nuevoDato.country} placeholder="Ej. Canada" />
            </div>

            <div class="field">
              <label for="nuevo-year">Año</label>
              <input
                id="nuevo-year"
                bind:value={nuevoDato.year}
                type="number"
                placeholder="Ej. 2024"
              />
            </div>

            <div class="field">
              <label for="nuevo-recreation-value">Gasto en ocio y cultura</label>
              <input
                id="nuevo-recreation-value"
                bind:value={nuevoDato.recreation_value}
                type="number"
                placeholder="Valor"
              />
            </div>

            <div class="field">
              <label for="nuevo-total-household-consumption">Consumo total de los hogares</label>
              <input
                id="nuevo-total-household-consumption"
                bind:value={nuevoDato.total_household_consumption}
                type="number"
                placeholder="Valor"
              />
            </div>

            <div class="field full">
              <label for="nuevo-population">Población</label>
              <input
                id="nuevo-population"
                bind:value={nuevoDato.population}
                type="number"
                placeholder="Población"
              />
            </div>
          </div>

          <p class="helper-text">
            El porcentaje de ocio/cultura y el gasto por persona se calculan automáticamente
            en el servidor.
          </p>

          <div class="card-links buttons-row">
            <button class="action-btn secondary" type="button" onclick={crearDato}>
              Añadir registro
            </button>
          </div>
        </article>
      </div>
    </div>
  </section>
</div>

<style>
  .page {
    padding: 16px 18px 22px;
  }

  .hero-shell,
  .cards-section {
    max-width: 1460px;
    margin: 0 auto;
  }

  .hero-card {
    position: relative;
    border-radius: 28px;
    margin-bottom: 14px;
  }

  .hero-content {
    padding: 6px 4px 8px;
  }

  .hero-text {
    max-width: 760px;
    color: #f6f4ef;
  }

  .eyebrow {
    margin: 0 0 6px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.82rem;
    font-weight: 700;
    color: rgba(246, 244, 239, 0.95);
  }

  .hero-text h1 {
    margin: 0;
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: clamp(2.8rem, 4.6vw, 4.2rem);
    line-height: 0.98;
    font-weight: 600;
    letter-spacing: -0.03em;
    color: #f6f4ef;
  }

  .cards-section {
    margin-top: 4px;
  }

  .alert-box {
    margin-bottom: 14px;
    padding: 12px 14px;
    border-radius: 16px;
    font-weight: 700;
    box-shadow: 0 8px 22px rgba(47, 58, 57, 0.08);
    font-size: 0.92rem;
  }

  .alert-success {
    background: rgba(230, 243, 236, 0.96);
    color: #2e5a49;
    border: 1px solid rgba(46, 90, 73, 0.14);
  }

  .alert-error {
    background: rgba(248, 221, 218, 0.96);
    color: #8a3a35;
    border: 1px solid rgba(138, 58, 53, 0.14);
  }

  .search-toolbar {
    margin-bottom: 18px;
    display: flex;
    justify-content: flex-start;
  }

  .filters-main-btn {
    border: none;
    background: #f7f8f6;
    color: #2f3a39;
    border-radius: 999px;
    padding: 13px 18px;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    font-family: 'IBM Plex Sans', system-ui, sans-serif;
    box-shadow: 0 14px 32px rgba(47, 58, 57, 0.08);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .filters-main-btn:hover {
    transform: translateY(-1px);
  }

  .search-panel {
    background: #f7f8f6;
    border-radius: 24px;
    padding: 20px;
    margin-bottom: 18px;
    box-shadow: 0 14px 32px rgba(47, 58, 57, 0.08);
  }

  .search-panel-header {
    margin-bottom: 14px;
  }

  .search-panel-header h3 {
    margin: 0;
    font-size: 1.18rem;
    font-weight: 600;
    color: #2f3a39;
  }

  .search-subtitle {
    margin: 6px 0 0;
    font-size: 0.9rem;
    color: #6a7674;
    line-height: 1.45;
  }

  .filters-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  .search-actions {
    display: flex;
    gap: 10px;
    margin-top: 16px;
    flex-wrap: wrap;
  }

  .clear-btn {
    background: #e8e5df;
    color: #2f3a39;
  }

  .dashboard-layout {
    display: grid;
    grid-template-columns: 1.95fr 0.72fr;
    gap: 20px;
    align-items: stretch;
  }

  .main-column,
  .side-column {
    display: flex;
  }

  .main-panel,
  .side-panel {
    width: 100%;
    background: #f7f8f6;
    border-radius: 24px;
    padding: 20px;
    box-shadow: 0 14px 32px rgba(47, 58, 57, 0.08);
  }

  .main-panel,
  .side-panel {
    min-height: 620px;
  }

  .main-panel {
    display: flex;
    flex-direction: column;
  }

  .side-panel {
    display: flex;
    flex-direction: column;
  }

  .panel-header,
  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 14px;
  }

  .panel-header h3,
  .card-top h3 {
    margin: 0;
    font-size: 1.18rem;
    line-height: 1.1;
    font-weight: 600;
    color: #2f3a39;
    letter-spacing: 0.01em;
  }

  .counter-badge,
  .badge {
    background: #e8e5df;
    color: #2f3a39;
    border-radius: 999px;
    padding: 6px 11px;
    font-size: 0.76rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .list-area {
    flex: 1;
    min-height: 520px;
    height: 520px;
    display: flex;
  }

  .records-table-wrap {
    width: 100%;
    min-width: 100%;
    max-width: 100%;
    height: 520px;
    max-height: 520px;
    overflow: auto;
    border-radius: 16px;
    background: #fbfbfa;
    border: 1px solid rgba(47, 58, 57, 0.07);
  }

  .records-table {
    width: 100%;
    min-width: 980px;
  }

  .empty-state-box {
    width: 100%;
    min-width: 100%;
    max-width: 100%;
    height: 520px;
    background: #fbfbfa;
    border-radius: 16px;
    padding: 22px;
    text-align: center;
    color: #6a7674;
    font-style: italic;
    border: 1px solid rgba(47, 58, 57, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }

  .records-head,
  .records-row {
    display: grid;
    grid-template-columns: 1fr 0.6fr 1.1fr 1.15fr 0.8fr 0.9fr 0.95fr 1.2fr;
    gap: 10px;
    align-items: center;
    padding: 12px 14px;
  }

  .records-head {
    position: sticky;
    top: 0;
    z-index: 2;
    background: #efefec;
    font-size: 0.8rem;
    font-weight: 700;
    color: #53615f;
    border-bottom: 1px solid rgba(47, 58, 57, 0.08);
  }

  .records-row {
    font-size: 0.88rem;
    color: #3d4b49;
    border-bottom: 1px solid rgba(47, 58, 57, 0.06);
    background: #fbfbfa;
  }

  .records-row:last-child {
    border-bottom: none;
  }

  .records-row:hover {
    background: #f4f5f2;
  }

  .row-actions {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .panel-actions {
    display: flex;
    gap: 10px;
    margin-top: 12px;
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    margin-top: 4px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .field.full {
    grid-column: 1 / -1;
  }

  .field label {
    font-size: 0.88rem;
    font-weight: 600;
    color: #2f3a39;
  }

  .field input {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid rgba(47, 58, 57, 0.12);
    background: #fbfbfa;
    border-radius: 14px;
    padding: 12px 13px;
    font-size: 0.92rem;
    color: #2f3a39;
    outline: none;
    transition: border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
    font-family: 'IBM Plex Sans', system-ui, sans-serif;
  }

  .field input:focus {
    border-color: #e97b6c;
    transform: translateY(-1px);
    box-shadow: 0 0 0 3px rgba(233, 123, 108, 0.12);
  }

  .helper-text {
    margin-top: 12px;
    font-size: 0.84rem;
    color: #6a7674;
    line-height: 1.5;
  }

  .card-links,
  .buttons-row {
    display: flex;
    gap: 10px;
    margin-top: 16px;
    flex-wrap: wrap;
  }

  .action-btn,
  .mini-btn {
    border: none;
    cursor: pointer;
    font-family: 'IBM Plex Sans', system-ui, sans-serif;
    font-weight: 600;
    border-radius: 999px;
    transition: transform 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease;
  }

  .action-btn:hover,
  .mini-btn:hover {
    transform: translateY(-1px);
  }

  .action-btn {
    padding: 11px 16px;
    font-size: 0.9rem;
  }

  .link-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
  }

  .mini-btn {
    padding: 8px 13px;
    font-size: 0.84rem;
  }

  .secondary {
    background: #7f9c96;
    color: #ffffff;
  }

  .edit {
    background: #d9e4df;
    color: #33524c;
  }

  .danger,
  .mini-btn.delete {
    background: #e3a097;
    color: #7a2a24;
  }

  @media (max-width: 1100px) {
    .dashboard-layout {
      grid-template-columns: 1fr;
    }

    .filters-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .main-panel,
    .side-panel {
      min-height: auto;
    }

    .records-table-wrap {
      width: 100%;
      min-width: 100%;
      max-width: 100%;
      height: 420px;
      max-height: 420px;
    }

    .empty-state-box {
      width: 100%;
      min-width: 100%;
      max-width: 100%;
      height: 420px;
    }
  }

  @media (max-width: 820px) {
    .page {
      padding: 12px 12px 20px;
    }

    .hero-content {
      padding: 2px 2px 8px;
    }

    .hero-text h1 {
      font-size: clamp(2.2rem, 10vw, 3.5rem);
    }

    .filters-grid {
      grid-template-columns: 1fr;
    }

    .main-panel,
    .side-panel {
      padding: 16px;
    }

    .records-table {
      min-width: 1080px;
    }
  }
</style>