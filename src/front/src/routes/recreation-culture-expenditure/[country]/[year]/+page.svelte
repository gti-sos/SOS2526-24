<svelte:head>
  <title>Editar | Recreation Culture Expenditure</title>
  <meta
    name="description"
    content="Edición de registros de gasto en ocio y cultura."
  />
</svelte:head>

<script>
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";

  // =========================================================
  // ESTADO
  // =========================================================
  let dato = $state({
    country: "",
    year: "",
    recreation_value: "",
    total_household_consumption: "",
    population: ""
  });

  let cargando = $state(true);
  let mensaje = $state("");
  let esError = $state(false);

  // =========================================================
  // API BASE
  // =========================================================
  const API = "/api/v2/recreation-culture-expenditure";

  // =========================================================
  // MENSAJES
  // =========================================================
  function mostrarMensaje(texto, error = false) {
    mensaje = texto;
    esError = error;

    setTimeout(() => {
      mensaje = "";
    }, 3500);
  }

  // =========================================================
  // CARGAR EL RECURSO A EDITAR
  // =========================================================
  async function cargarDato() {
    cargando = true;

    const countryParam = decodeURIComponent(page.params.country);
    const yearParam = page.params.year;

    try {
      const res = await fetch(`${API}/${encodeURIComponent(countryParam)}/${yearParam}`);

      if (res.ok) {
        const recurso = await res.json();

        dato = {
          country: recurso.country,
          year: recurso.year,
          recreation_value: recurso.recreation_value,
          total_household_consumption: recurso.total_household_consumption,
          population: recurso.population
        };
      } else if (res.status === 404) {
        mostrarMensaje(`ERROR: No existe el registro de ${countryParam} (${yearParam}).`, true);
      } else {
        mostrarMensaje("ERROR: No se pudo cargar el registro.", true);
      }
    } catch (error) {
      mostrarMensaje("ERROR: Se produjo un problema de conexión al cargar el registro.", true);
    } finally {
      cargando = false;
    }
  }

  // =========================================================
  // VALIDACIÓN SIMPLE DEL FORMULARIO
  // =========================================================
  function formularioValido() {
    return (
      dato.country.trim() !== "" &&
      dato.year !== "" &&
      dato.recreation_value !== "" &&
      dato.total_household_consumption !== "" &&
      dato.population !== ""
    );
  }

  // =========================================================
  // GUARDAR CAMBIOS CON PUT
  // =========================================================
  async function guardarCambios() {
    if (!formularioValido()) {
      mostrarMensaje("ERROR: Completa todos los campos obligatorios antes de guardar.", true);
      return;
    }

    const countryOriginal = decodeURIComponent(page.params.country);
    const yearOriginal = page.params.year;

    const payload = {
      country: dato.country.trim(),
      year: Number(dato.year),
      recreation_value: Number(dato.recreation_value),
      total_household_consumption: Number(dato.total_household_consumption),
      population: Number(dato.population)
    };

    try {
      const res = await fetch(`${API}/${encodeURIComponent(countryOriginal)}/${yearOriginal}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        mostrarMensaje("Registro actualizado correctamente.");
        setTimeout(() => {
          goto("/recreation-culture-expenditure");
        }, 800);
      } else if (res.status === 400) {
        mostrarMensaje("ERROR: Los datos introducidos no son válidos.", true);
      } else if (res.status === 404) {
        mostrarMensaje("ERROR: El registro que intentas editar ya no existe.", true);
      } else if (res.status === 409) {
        mostrarMensaje("ERROR: Ya existe otro registro con ese país y año.", true);
      } else {
        mostrarMensaje("ERROR: No se pudo actualizar el registro.", true);
      }
    } catch (error) {
      mostrarMensaje("ERROR: Se produjo un problema de conexión al guardar los cambios.", true);
    }
  }

  // =========================================================
  // CANCELAR Y VOLVER AL LISTADO
  // =========================================================
  function volverAlListado() {
    goto("/recreation-culture-expenditure");
  }

  // =========================================================
  // CARGA INICIAL
  // =========================================================
  onMount(() => {
    cargarDato();
  });
</script>

<div class="page">
  <section class="hero-shell">
    <div class="hero-card">
      <div class="hero-content">
        <div class="hero-text">
          <p class="eyebrow">EBP · RECREATION & CULTURE</p>
          <h1>Editar registro</h1>
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

    <div class="edit-layout">
      <article class="edit-panel">
        <div class="card-top">
          <h3>Edición del registro</h3>
          <span class="badge">Editar</span>
        </div>

        {#if cargando}
          <div class="loading-box">
            Cargando datos del registro...
          </div>
        {:else}
          <div class="form-grid">
            <div class="field">
              <label>País</label>
              <input bind:value={dato.country} placeholder="Ej. Canada" />
            </div>

            <div class="field">
              <label>Año</label>
              <input bind:value={dato.year} type="number" placeholder="Ej. 2024" />
            </div>

            <div class="field">
              <label>Gasto en ocio y cultura</label>
              <input
                bind:value={dato.recreation_value}
                type="number"
                placeholder="Valor"
              />
            </div>

            <div class="field">
              <label>Consumo total de los hogares</label>
              <input
                bind:value={dato.total_household_consumption}
                type="number"
                placeholder="Valor"
              />
            </div>

            <div class="field full">
              <label>Población</label>
              <input bind:value={dato.population} type="number" placeholder="Población" />
            </div>
          </div>

          <p class="helper-text">
            El porcentaje de ocio/cultura y el gasto por persona se calculan automáticamente
            en el servidor al guardar.
          </p>

          <div class="card-links buttons-row">
            <button class="action-btn secondary" onclick={guardarCambios}>
              Guardar cambios
            </button>

            <button class="action-btn cancel-btn" onclick={volverAlListado}>
              Cancelar
            </button>
          </div>
        {/if}
      </article>
    </div>
  </section>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=Cormorant+Garamond:wght@500;600;700&display=swap');

  :global(html) {
    scroll-behavior: smooth;
  }

  :global(body) {
    margin: 0;
    font-family: 'IBM Plex Sans', system-ui, sans-serif;
    color: #2f3a39;
    background: linear-gradient(120deg, #485a57 0%, #6f827e 24%, #9fb0ad 58%, #d2ddd8 100%);
    min-height: 100vh;
    letter-spacing: 0.01em;
  }

  .page {
    padding: 16px 18px 22px;
  }

  .hero-shell,
  .cards-section {
    max-width: 980px;
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

  .edit-layout {
    display: grid;
    grid-template-columns: 1fr;
  }

  .edit-panel {
    width: 100%;
    background: #f7f8f6;
    border-radius: 24px;
    padding: 20px;
    box-shadow: 0 14px 32px rgba(47, 58, 57, 0.08);
    min-height: 520px;
    box-sizing: border-box;
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 14px;
  }

  .card-top h3 {
    margin: 0;
    font-size: 1.18rem;
    line-height: 1.1;
    font-weight: 600;
    color: #2f3a39;
    letter-spacing: 0.01em;
  }

  .badge {
    background: #e8e5df;
    color: #2f3a39;
    border-radius: 999px;
    padding: 6px 11px;
    font-size: 0.76rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .loading-box {
    min-height: 360px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fbfbfa;
    border-radius: 16px;
    border: 1px solid rgba(47, 58, 57, 0.07);
    color: #6a7674;
    font-style: italic;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
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

  .action-btn {
    border: none;
    cursor: pointer;
    font-family: 'IBM Plex Sans', system-ui, sans-serif;
    font-weight: 600;
    border-radius: 999px;
    transition: transform 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease;
    padding: 11px 16px;
    font-size: 0.9rem;
  }

  .action-btn:hover {
    transform: translateY(-1px);
  }

  .secondary {
    background: #7f9c96;
    color: #ffffff;
  }

  .cancel-btn {
    background: #e8e5df;
    color: #2f3a39;
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

    .edit-panel {
      padding: 16px;
      min-height: auto;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }
  }
</style>