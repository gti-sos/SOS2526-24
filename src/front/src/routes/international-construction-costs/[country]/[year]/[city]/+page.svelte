<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  let { country, year, city } = $page.params;

  let dato = $state({ country, year, city, cost_usd_per_m2: 0, cost_change_range: "", rank: 0 });
  let mensaje = $state("");
  let esError = $state(false);

  const API = `/api/v2/international-construction-costs/${country}/${year}/${city}`;

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
    <p style="color: {esError ? 'red' : 'green'}; padding: 10px; border: 1px solid;">{mensaje}</p>
  {/if}

  <section class="editor-card">
    <div class="readonly-grid">
      <p>País: <strong>{dato.country}</strong> <span>(No editable)</span></p>
      <p>Año: <strong>{dato.year}</strong> <span>(No editable)</span></p>
    </div>

    <div class="form-grid">
      <label>
        Coste USD por m²:
        <input type="number" bind:value={dato.cost_usd_per_m2} />
      </label>

      <label>
        Rango de cambio:
        <input bind:value={dato.cost_change_range} />
      </label>

      <label>
        Ranking:
        <input type="number" bind:value={dato.rank} />
      </label>
    </div>

    <div class="actions">
      <button onclick={guardarCambios}>Guardar cambios</button>
      <a href="/international-construction-costs">
        <button class="secondary-button">Volver al listado</button>
      </a>
    </div>
  </section>
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
    max-width: 980px;
    margin: 0 auto;
    padding: 1.1rem 1rem 2.4rem;
  }

  .hero-shell {
    margin-bottom: 1.2rem;
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
    margin: 0;
    font-family: "Cormorant Garamond", serif;
    font-size: clamp(3rem, 5.8vw, 4.5rem);
    line-height: 1.02;
    font-weight: 700;
    color: #f4efe9;
    letter-spacing: -0.02em;
  }

  .hero-subtitle {
    margin: 0.45rem 0 0;
    font-family: "Inter", sans-serif;
    font-size: 1.08rem;
    font-weight: 500;
    color: rgba(244, 239, 233, 0.92);
  }

  .editor-card {
    background: rgba(247, 245, 243, 0.93);
    border-radius: 28px;
    padding: 1.6rem 1.45rem;
    border: 1px solid rgba(56, 74, 70, 0.06);
    box-shadow: 0 14px 34px rgba(44, 61, 57, 0.08);
    backdrop-filter: blur(4px);
  }

  .readonly-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(220px, 1fr));
    gap: 1rem;
    margin-bottom: 1.25rem;
    padding: 0.25rem 0 0.95rem;
    border-bottom: 1px solid rgba(68, 87, 84, 0.08);
  }

  .readonly-grid p {
    margin: 0;
    font-family: "Inter", sans-serif;
    font-size: 1rem;
    color: #38514d;
    line-height: 1.6;
  }

  .readonly-grid strong {
    color: #183632;
  }

  .readonly-grid span {
    color: #6c7f7b;
    font-size: 0.96rem;
  }

  .form-grid {
    display: grid;
    gap: 1rem;
  }

  label {
    display: block;
    font-family: "Inter", sans-serif;
    font-size: 0.98rem;
    font-weight: 600;
    color: #415653;
    line-height: 1.5;
  }

  input {
    width: 100%;
    margin-top: 0.42rem;
    padding: 0.9rem 1rem;
    border-radius: 16px;
    border: 1px solid rgba(63, 83, 78, 0.12);
    background: rgba(255, 255, 255, 0.68);
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
    background: rgba(255, 255, 255, 0.84);
  }

  .actions {
    display: flex;
    gap: 0.8rem;
    flex-wrap: wrap;
    margin-top: 1.35rem;
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
    background: #89a8a0;
    color: #f8faf9;
  }

  button:hover {
    transform: translateY(-1px);
    opacity: 0.96;
  }

  .secondary-button {
    background: #d8d5d1;
    color: #425652;
  }

  a {
    text-decoration: none;
  }

  p[style*="color: green"] {
    margin: 0 0 1.2rem;
    border-radius: 18px;
    background: #edf8ee !important;
    color: #3f8f52 !important;
    border: 1px solid #9fd4a8 !important;
    box-shadow: 0 10px 24px rgba(44, 61, 57, 0.07);
    font-family: "Inter", sans-serif;
    font-weight: 700;
  }

  p[style*="color: red"] {
    margin: 0 0 1.2rem;
    border-radius: 18px;
    background: #fff0ef !important;
    color: #c6756d !important;
    border: 1px solid #efb3ad !important;
    box-shadow: 0 10px 24px rgba(44, 61, 57, 0.07);
    font-family: "Inter", sans-serif;
    font-weight: 700;
  }

  @media (max-width: 780px) {
    .page {
      padding: 0.9rem 0.8rem 2rem;
    }

    .readonly-grid {
      grid-template-columns: 1fr;
      gap: 0.55rem;
    }

    h1 {
      font-size: clamp(2.5rem, 9vw, 3.8rem);
    }
  }
</style>