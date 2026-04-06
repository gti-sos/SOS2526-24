<script>
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";

  let country = $derived(decodeURIComponent(page.params.country ?? ""));
  let year = $derived(page.params.year ?? "");
  let city = $derived(decodeURIComponent(page.params.city ?? ""));

  let dato = $state({
    country: "",
    year: "",
    city: "",
    cost_usd_per_m2: 0,
    cost_change_range: "",
    rank: 0
  });

  let mensaje = $state("");
  let esError = $state(false);

  const API = $derived(
    `/api/v2/international-construction-costs/${encodeURIComponent(country)}/${year}/${encodeURIComponent(city)}`
  );

  function mostrarMensaje(texto, error = false) {
    mensaje = texto;
    esError = error;
  }

  async function getDatoActual() {
    try {
      const res = await fetch(API);

      if (res.ok) {
        dato = await res.json();
      } else {
        mostrarMensaje(`No se ha encontrado el registro para ${city} en ${year}.`, true);
      }
    } catch {
      mostrarMensaje("Se produjo un problema de conexión al cargar el registro.", true);
    }
  }

  async function guardarCambios() {
    const res = await fetch(API, {
      method: "PUT",
      body: JSON.stringify(dato),
      headers: { "Content-Type": "application/json" }
    });

    if (res.ok) {
      mostrarMensaje("Los cambios se han guardado correctamente.");
      esError = false;
    } else if (res.status === 400) {
      mostrarMensaje(
        "Los datos enviados no son correctos o los identificadores no coinciden.",
        true
      );
    } else {
      mostrarMensaje("Ha ocurrido un error inesperado al intentar actualizar.", true);
    }
  }

  function volverAlListado() {
    goto("/international-construction-costs");
  }

  onMount(() => {
    getDatoActual();
  });
</script>

<div class="page">
  <div class="hero-shell">
    <p class="eyebrow">IRG · INTERNATIONAL CONSTRUCTION COSTS</p>
    <h1>Editando registro</h1>
    <p class="hero-subtitle">{city} ({year})</p>
  </div>

  {#if mensaje}
    <div class="message" class:error={esError} class:success={!esError}>
      {mensaje}
    </div>
  {/if}

  <section class="editor-card">
    <div class="readonly-grid">
      <p>País: <strong>{dato.country}</strong> <span>(No editable)</span></p>
      <p>Año: <strong>{dato.year}</strong> <span>(No editable)</span></p>
      <p>Ciudad: <strong>{dato.city}</strong> <span>(No editable)</span></p>
    </div>

    <div class="form-grid">
      <div class="field">
        <label for="edit-cost">Coste USD por m²</label>
        <input id="edit-cost" type="number" bind:value={dato.cost_usd_per_m2} />
      </div>

      <div class="field">
        <label for="edit-range">Rango de cambio</label>
        <input id="edit-range" bind:value={dato.cost_change_range} />
      </div>

      <div class="field">
        <label for="edit-rank">Ranking</label>
        <input id="edit-rank" type="number" bind:value={dato.rank} />
      </div>
    </div>

    <div class="button-row">
      <button class="action-btn primary-btn" type="button" onclick={guardarCambios}>
        Guardar cambios
      </button>

      <button class="action-btn neutral-btn" type="button" onclick={volverAlListado}>
        Volver al listado
      </button>
    </div>
  </section>
</div>

<style>
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Cormorant+Garamond:wght@500;600;700&display=swap");

  :global(*) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    color: #2f3a39;
    font-family: "Inter", system-ui, sans-serif;
    background: linear-gradient(120deg, #485a57 0%, #6f827e 24%, #9fb0ad 58%, #d2ddd8 100%);
  }

  .page {
    max-width: 980px;
    margin: 0 auto;
    padding: 1.1rem 1rem 2.4rem;
  }

  .hero-shell {
    margin-bottom: 1.2rem;
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
    margin: 0;
    font-family: "Cormorant Garamond", serif;
    font-size: clamp(3rem, 6vw, 4.5rem);
    line-height: 1;
    color: #f4efe9;
  }

  .hero-subtitle {
    margin-top: 0.55rem;
    color: #f4efe9;
    opacity: 0.9;
  }

  .editor-card {
    background: rgba(247, 245, 243, 0.92);
    border: 1px solid rgba(47, 58, 57, 0.08);
    border-radius: 24px;
    box-shadow: 0 14px 34px rgba(44, 61, 57, 0.08);
    padding: 1rem;
  }

  .message {
    margin: 0 0 1.2rem;
    padding: 0.9rem 1rem;
    border-radius: 18px;
    box-shadow: 0 10px 24px rgba(44, 61, 57, 0.07);
    font-family: "Inter", sans-serif;
    font-weight: 700;
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

  .readonly-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(180px, 1fr));
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .readonly-grid p {
    margin: 0;
    padding: 0.9rem 1rem;
    border-radius: 16px;
    background: #fbfbfa;
    border: 1px solid rgba(47, 58, 57, 0.07);
  }

  .readonly-grid span {
    color: #667673;
    font-size: 0.9rem;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
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

  .action-btn {
    border: none;
    border-radius: 999px;
    cursor: pointer;
    font-family: "Inter", sans-serif;
    font-size: 0.95rem;
    font-weight: 700;
    padding: 0.82rem 1.2rem;
    transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
    box-shadow: 0 8px 18px rgba(58, 77, 72, 0.08);
  }

  .action-btn:hover {
    transform: translateY(-1px);
    opacity: 0.96;
  }

  .primary-btn {
    background: #89a8a0;
    color: #f8faf9;
  }

  .neutral-btn {
    background: #d8d5d1;
    color: #425652;
  }

  @media (max-width: 780px) {
    .page {
      padding: 0.9rem 0.8rem 2rem;
    }

    .readonly-grid,
    .form-grid {
      grid-template-columns: 1fr;
    }

    h1 {
      font-size: clamp(2.5rem, 9vw, 3.8rem);
    }
  }
</style>