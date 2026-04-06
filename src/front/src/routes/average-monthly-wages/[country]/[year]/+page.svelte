<svelte:head>
  <title>Editar registro | Salarios Mensuales Medios</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
</svelte:head>

<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let { country, year } = $page.params;

  let dato = $state({ country, year: parseInt(year), avg_monthly_nc: 0, avg_monthly_usd: 0, exchange_rate: 0, currency: "" });
  let mensaje = $state("");
  let esError = $state(false);
  let cargando = $state(true);
  let guardando = $state(false);

  const API = `/api/v2/average-monthly-wages/${country}/${year}`;

  function mostrarMensaje(texto, error = false) {
    mensaje = texto;
    esError = error;
  }

  async function getDatoActual() {
    cargando = true;
    const res = await fetch(API);
    if (res.ok) {
      dato = await res.json();
    } else if (res.status === 404) {
      mostrarMensaje(`No existe un registro para '${country}' en el año ${year}.`, true);
    } else {
      mostrarMensaje("Error inesperado al cargar el registro.", true);
    }
    cargando = false;
  }

  async function guardarCambios() {
    guardando = true;
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
      mostrarMensaje("Los cambios se han guardado correctamente.");
    } else if (res.status === 400) {
      mostrarMensaje("Los datos no son válidos o los identificadores no coinciden.", true);
    } else if (res.status === 404) {
      mostrarMensaje(`No existe un registro para '${country}' en el año ${year}.`, true);
    } else {
      mostrarMensaje("Error inesperado al actualizar el registro.", true);
    }
    guardando = false;
  }

  getDatoActual();
</script>

<div class="page">
  <header class="hero">
    <div class="hero-inner">
      <div class="hero-tag">MJP · DATOS SALARIALES</div>
      <h1 class="hero-title">Editar<br/><em>Registro</em></h1>
      <p class="hero-sub">Modificando los datos del registro seleccionado. País y año identifican el recurso y no pueden editarse.</p>
    </div>
    <div class="hero-deco" aria-hidden="true">
      <span class="deco-circle c1"></span>
      <span class="deco-circle c2"></span>
      <span class="deco-num">✎</span>
    </div>
  </header>

  <main class="content">
    {#if mensaje}
      <div class="toast" class:toast-error={esError} class:toast-ok={!esError}>
        <span class="toast-icon">{esError ? "⚠" : "✓"}</span>
        {mensaje}
      </div>
    {/if}

    <div class="edit-wrapper">
      <div class="edit-card">
        <div class="card-top">
          <div>
            <h2 class="card-title">Editando: <em>{country}</em> ({year})</h2>
            <p class="card-sub">Modifica los valores numéricos y guarda los cambios.</p>
          </div>
          <span class="badge-editar">Editar</span>
        </div>

        {#if cargando}
          <div class="loading-box">Cargando datos del registro...</div>
        {:else}
          <div class="identity-grid">
            <div class="identity-item">
              <span class="identity-label">País</span>
              <strong class="identity-value">{dato.country}</strong>
            </div>
            <div class="identity-item">
              <span class="identity-label">Año</span>
              <strong class="identity-value mono">{dato.year}</strong>
            </div>
          </div>

          <div class="form-grid">
            <label class="field-wrap">
              <span>Salario mensual (moneda local)</span>
              <input type="number" bind:value={dato.avg_monthly_nc} />
            </label>
            <label class="field-wrap">
              <span>Salario mensual (USD)</span>
              <input type="number" bind:value={dato.avg_monthly_usd} />
            </label>
            <label class="field-wrap">
              <span>Tipo de cambio</span>
              <input type="number" step="0.0001" bind:value={dato.exchange_rate} />
            </label>
            <label class="field-wrap">
              <span>Moneda</span>
              <input bind:value={dato.currency} />
            </label>
          </div>

          <div class="buttons-row">
            <button class="btn-primary" onclick={guardarCambios} disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
            <a href="/average-monthly-wages" class="btn-back">← Volver al listado</a>
          </div>
        {/if}
      </div>
    </div>
  </main>
</div>

<style>
  :root {
    --ink: #1a1a2e; --ink-soft: #3d3d5c; --ink-muted: #7b7b9a;
    --gold: #c9a84c; --gold-light: #f0d99a;
    --blue: #2e4a8a; --blue-soft: #e8edf8;
    --bg: #f5f4f0; --surface: #ffffff; --surface2: #f9f8f5;
    --border: rgba(26,26,46,0.09);
    --danger: #c0392b; --danger-bg: #fdf0ef;
    --success: #1e6b4a; --success-bg: #edf7f2;
    --radius: 20px; --shadow: 0 8px 32px rgba(26,26,46,0.08);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .page { font-family: 'DM Sans', sans-serif; background: var(--bg); min-height: 100vh; color: var(--ink); }

  .hero { background: linear-gradient(135deg, #1a1a2e 0%, #2e4a8a 60%, #1a3060 100%); padding: 3rem 2.5rem 2.5rem; display: flex; justify-content: space-between; align-items: flex-end; overflow: hidden; min-height: 220px; }
  .hero-inner { max-width: 520px; }
  .hero-tag { font-family: 'DM Mono', monospace; font-size: 0.72rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold-light); margin-bottom: 1rem; opacity: 0.85; }
  .hero-title { font-family: 'Playfair Display', serif; font-size: clamp(2.4rem, 4vw, 3.8rem); line-height: 1.0; color: #fff; font-weight: 700; }
  .hero-title em { font-style: italic; color: var(--gold-light); }
  .hero-sub { margin-top: 0.75rem; color: rgba(255,255,255,0.65); font-size: 0.92rem; line-height: 1.6; max-width: 420px; }
  .hero-deco { position: relative; display: flex; align-items: center; justify-content: center; width: 140px; height: 140px; flex-shrink: 0; }
  .deco-circle { position: absolute; border-radius: 50%; border: 2px solid rgba(201,168,76,0.3); }
  .c1 { width: 130px; height: 130px; } .c2 { width: 90px; height: 90px; border-color: rgba(255,255,255,0.1); }
  .deco-num { font-family: 'Playfair Display', serif; font-size: 3.5rem; color: rgba(201,168,76,0.4); font-weight: 700; }

  .content { max-width: 900px; margin: 0 auto; padding: 2rem 2rem 3rem; }

  .toast { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-radius: 14px; font-weight: 600; font-size: 0.92rem; margin-bottom: 1.5rem; animation: slideIn 0.25s ease; }
  @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  .toast-ok { background: var(--success-bg); color: var(--success); border: 1px solid rgba(30,107,74,0.15); }
  .toast-error { background: var(--danger-bg); color: var(--danger); border: 1px solid rgba(192,57,43,0.15); }

  .edit-wrapper { width: 100%; }
  .edit-card { background: var(--surface); border-radius: var(--radius); padding: 2rem; border: 1px solid var(--border); box-shadow: var(--shadow); }
  .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; gap: 1rem; }
  .card-title { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 600; color: var(--ink); }
  .card-title em { font-style: italic; color: var(--blue); }
  .card-sub { margin-top: 6px; color: var(--ink-muted); font-size: 0.88rem; }
  .badge-editar { background: linear-gradient(135deg, var(--gold), #e8c068); color: #3a2a00; border-radius: 999px; padding: 5px 14px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap; }

  .loading-box { min-height: 200px; display: flex; align-items: center; justify-content: center; color: var(--ink-muted); font-style: italic; background: var(--surface2); border-radius: 14px; }

  .identity-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 1.5rem; }
  .identity-item { background: var(--blue-soft); border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; gap: 4px; }
  .identity-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--blue); }
  .identity-value { font-size: 1.1rem; color: var(--ink); font-weight: 600; }
  .identity-value.mono { font-family: 'DM Mono', monospace; }

  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 1.75rem; }
  .field-wrap { display: flex; flex-direction: column; gap: 5px; }
  .field-wrap span { font-size: 0.8rem; font-weight: 600; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.05em; }
  .field-wrap input { width: 100%; border: 1.5px solid var(--border); background: var(--surface2); border-radius: 12px; padding: 11px 13px; font-size: 0.9rem; color: var(--ink); outline: none; font-family: 'DM Sans', sans-serif; transition: border-color 0.15s, box-shadow 0.15s; }
  .field-wrap input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.12); }

  .buttons-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  .btn-primary { background: linear-gradient(135deg, var(--blue) 0%, #1a3060 100%); color: white; border: none; border-radius: 12px; padding: 12px 24px; font-size: 0.92rem; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
  .btn-primary:hover { transform: translateY(-1px); opacity: 0.92; }
  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  .btn-back { text-decoration: none; background: var(--surface2); color: var(--ink-soft); border: 1px solid var(--border); border-radius: 12px; padding: 12px 24px; font-size: 0.92rem; font-weight: 600; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
  .btn-back:hover { background: var(--border); }

  @media (max-width: 640px) {
    .hero { padding: 2rem 1.25rem; min-height: auto; }
    .hero-deco { display: none; }
    .content { padding: 1.25rem 1rem 2rem; }
    .form-grid, .identity-grid { grid-template-columns: 1fr; }
    .edit-card { padding: 1.25rem; }
  }
</style>