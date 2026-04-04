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

  const API = "/api/v2/recreation-culture-expenditure";

  let mensaje = $state("");
  let esError = $state(false);
  let cargando = $state(true);
  let guardando = $state(false);

  let dato = $state({
    country: decodeURIComponent(page.params.country ?? ""),
    year: Number(page.params.year ?? ""),
    recreation_value: "",
    total_household_consumption: "",
    population: ""
  });

  function mostrarMensaje(texto, error = false) {
    mensaje = texto;
    esError = error;
  }

  function limpiarMensajeTrasTiempo() {
    setTimeout(() => {
      mensaje = "";
    }, 3500);
  }

  function formularioValido() {
    return (
      dato.recreation_value !== "" &&
      dato.total_household_consumption !== "" &&
      dato.population !== "" &&
      !Number.isNaN(Number(dato.recreation_value)) &&
      !Number.isNaN(Number(dato.total_household_consumption)) &&
      !Number.isNaN(Number(dato.population))
    );
  }

  async function getDatoActual() {
    cargando = true;

    const country = decodeURIComponent(page.params.country);
    const year = page.params.year;

    try {
      const res = await fetch(`${API}/${encodeURIComponent(country)}/${year}`);

      if (res.ok) {
        const recurso = await res.json();

        dato = {
          country: recurso.country,
          year: Number(recurso.year),
          recreation_value: recurso.recreation_value,
          total_household_consumption: recurso.total_household_consumption,
          population: recurso.population
        };
      } else if (res.status === 404) {
        mostrarMensaje(
          `No existe el registro de ${country} en el año ${year}.`,
          true
        );
      } else {
        mostrarMensaje(
          "No se ha podido cargar el registro que quieres editar.",
          true
        );
      }
    } catch (error) {
      mostrarMensaje(
        "Se ha producido un problema de conexión al cargar los datos.",
        true
      );
    } finally {
      cargando = false;
      if (mensaje) limpiarMensajeTrasTiempo();
    }
  }

  async function guardarCambios() {
    if (!formularioValido()) {
      mostrarMensaje(
        "Revisa los campos editables antes de guardar. Todos deben tener un valor válido.",
        true
      );
      limpiarMensajeTrasTiempo();
      return;
    }

    guardando = true;

    const country = decodeURIComponent(page.params.country);
    const year = page.params.year;

    const payload = {
      country,
      year: Number(year),
      recreation_value: Number(dato.recreation_value),
      total_household_consumption: Number(dato.total_household_consumption),
      population: Number(dato.population)
    };

    try {
      const res = await fetch(`${API}/${encodeURIComponent(country)}/${year}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        mostrarMensaje("Los cambios se han guardado correctamente.");
        setTimeout(() => {
          goto("/recreation-culture-expenditure");
        }, 900);
      } else if (res.status === 400) {
        mostrarMensaje(
          "Los datos enviados no son válidos o no coinciden con el registro que se está editando.",
          true
        );
      } else if (res.status === 404) {
        mostrarMensaje(
          `No existe el registro de ${country} en el año ${year}.`,
          true
        );
      } else if (res.status === 409) {
        mostrarMensaje(
          "Ya existe un registro con esos identificadores.",
          true
        );
      } else {
        mostrarMensaje(
          "Ha ocurrido un error inesperado al intentar actualizar el registro.",
          true
        );
      }
    } catch (error) {
      mostrarMensaje(
        "Se ha producido un problema de conexión al guardar los cambios.",
        true
      );
    } finally {
      guardando = false;
      limpiarMensajeTrasTiempo();
    }
  }

  function volverAlListado() {
    goto("/recreation-culture-expenditure");
  }

  onMount(() => {
    getDatoActual();
  });
</script>

<div class="page">
  <section class="hero-shell">
    <div class="hero-card">
      <div class="hero-content">
        <div class="hero-text">
          <p class="eyebrow">EBP · RECREATION & CULTURE</p>
          <h1>Editar registro</h1>
          <p class="hero-subtitle">
            Modifica los datos principales del registro seleccionado sin salir de la vista de edición.
          </p>
        </div>
      </div>
    </div>
  </section>

  <section class="cards-section">
    {#if mensaje}
      <div class="alert-box" class:alert-error={esError} class:alert-success={!esError}>
        {mensaje}
      </div>
    {/if}

    <article class="edit-panel">
      <div class="card-top">
        <div>
          <h3>Edición del registro</h3>
          <p class="panel-description">
            País y año identifican el recurso, por eso aquí se muestran bloqueados.
          </p>
        </div>
        <span class="badge">Editar</span>
      </div>

      {#if cargando}
        <div class="loading-box">
          Cargando datos del registro...
        </div>
      {:else}
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">País</span>
            <strong>{dato.country}</strong>
          </div>

          <div class="summary-item">
            <span class="summary-label">Año</span>
            <strong>{dato.year}</strong>
          </div>
        </div>

        <div class="form-grid">
          <div class="field">
            <label>Gasto en ocio y cultura</label>
            <input
              type="number"
              bind:value={dato.recreation_value}
              placeholder="Introduce el valor"
              min="0"
            />
          </div>

          <div class="field">
            <label>Consumo total de los hogares</label>
            <input
              type="number"
              bind:value={dato.total_household_consumption}
              placeholder="Introduce el valor"
              min="0"
            />
          </div>

          <div class="field full">
            <label>Población</label>
            <input
              type="number"
              bind:value={dato.population}
              placeholder="Introduce la población"
              min="0"
            />
          </div>
        </div>

        <p class="helper-text">
          El porcentaje destinado a ocio/cultura y el gasto por persona se calculan automáticamente en el servidor al guardar.
        </p>

        <div class="buttons-row">
          <button
            class="action-btn secondary"
            onclick={guardarCambios}
            disabled={guardando}
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>

          <button class="action-btn cancel-btn" onclick={volverAlListado}>
            Volver al listado
          </button>
        </div>
      {/if}
    </article>
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

  .hero-subtitle {
    margin: 10px 0 0;
    max-width: 620px;
    color: rgba(246, 244, 239, 0.88);
    font-size: 0.98rem;
    line-height: 1.55;
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

  .edit-panel {
    width: 100%;
    background: #f7f8f6;
    border-radius: 24px;
    padding: 20px;
    box-shadow: 0 14px 32px rgba(47, 58, 57, 0.08);
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

  .panel-description {
    margin: 8px 0 0;
    color: #697473;
    font-size: 0.9rem;
    line-height: 1.5;
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
    min-height: 280px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fbfbfa;
    border-radius: 16px;
    border: 1px solid rgba(47, 58, 57, 0.07);
    color: #6a7674;
    font-style: italic;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 14px;
  }

  .summary-item {
    background: #fbfbfa;
    border: 1px solid rgba(47, 58, 57, 0.08);
    border-radius: 16px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .summary-label {
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #76817f;
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

  .buttons-row {
    display: flex;
    gap: 10px;
    margin-top: 18px;
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

  .action-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
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
    }

    .summary-grid,
    .form-grid {
      grid-template-columns: 1fr;
    }
  }
</style>