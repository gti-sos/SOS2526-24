<svelte:head>
  <title>MJP | Salarios Mensuales Medios</title>
  <meta name="description" content="Panel de gestión de datos sobre salarios mensuales medios por país." />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
</svelte:head>

<script>
  import { onMount } from 'svelte';

  let datos = $state([]);
  let nuevoDato = $state({
    country: "", year: "", avg_monthly_nc: "",
    avg_monthly_usd: "", exchange_rate: "", currency: ""
  });
  let mensaje = $state("");
  let esError = $state(false);
  let mostrarFiltros = $state(false);
  let filtros = $state({ country: "", offset: "", limit: "" });

  const API = "/api/v2/average-monthly-wages";

  function mostrarMensaje(texto, error = false) {
    mensaje = texto;
    esError = error;
    setTimeout(() => { mensaje = ""; }, 4000);
  }

  async function getDatos() {
    const res = await fetch(API);
    if (res.ok) {
      datos = await res.json();
    } else {
      mostrarMensaje("No se pudieron cargar los datos.", true);
    }
  }

  async function crearDato() {
    const res = await fetch(API, {
      method: "POST",
      body: JSON.stringify({
        ...nuevoDato,
        year: parseInt(nuevoDato.year),
        avg_monthly_nc: parseFloat(nuevoDato.avg_monthly_nc),
        avg_monthly_usd: parseFloat(nuevoDato.avg_monthly_usd),
        exchange_rate: parseFloat(nuevoDato.exchange_rate)
      }),
      headers: { "Content-Type": "application/json" }
    });

    if (res.status === 201) {
      mostrarMensaje("¡Registro creado con éxito!");
      nuevoDato = { country: "", year: "", avg_monthly_nc: "", avg_monthly_usd: "", exchange_rate: "", currency: "" };
      getDatos();
    } else if (res.status === 409) {
      mostrarMensaje(`Ya existe un registro para '${nuevoDato.country}' en el año ${nuevoDato.year}.`, true);
    } else if (res.status === 400) {
      mostrarMensaje("Rellena todos los campos correctamente antes de añadir.", true);
    } else {
      mostrarMensaje("Error inesperado al crear el registro.", true);
    }
  }

  async function borrarDato(country, year) {
    if (!confirm(`¿Borrar el registro de ${country} (${year})?`)) return;
    const res = await fetch(`${API}/${country}/${year}`, { method: "DELETE" });
    if (res.ok) {
      mostrarMensaje(`Registro de ${country} (${year}) eliminado.`);
      getDatos();
    } else if (res.status === 404) {
      mostrarMensaje(`No existe un registro para '${country}' en ${year}.`, true);
    } else {
      mostrarMensaje("Error al eliminar el registro.", true);
    }
  }

  async function borrarTodo() {
    if (!confirm("¿Eliminar TODOS los registros? Esta acción no se puede deshacer.")) return;
    const res = await fetch(API, { method: "DELETE" });
    if (res.ok) {
      mostrarMensaje("Todos los registros han sido eliminados.");
      getDatos();
    } else {
      mostrarMensaje("Error al eliminar todos los registros.", true);
    }
  }

  async function cargarDatosIniciales() {
    const res = await fetch(`${API}/loadInitialData`);
    if (res.ok) {
      const d = await res.json();
      mostrarMensaje(`${d.length} registros iniciales cargados con éxito.`);
      getDatos();
    } else if (res.status === 409) {
      mostrarMensaje("La base de datos ya tiene datos. Límpiala primero.", true);
    } else {
      mostrarMensaje("No se pudieron cargar los datos iniciales.", true);
    }
  }

  async function buscar() {
    const params = new URLSearchParams();
    Object.keys(filtros).forEach(k => { if (filtros[k]) params.append(k, filtros[k]); });
    const res = await fetch(`${API}?${params.toString()}`);
    if (res.ok) {
      datos = await res.json();
      mostrarMensaje(`${datos.length} resultado(s) encontrado(s).`);
    } else {
      mostrarMensaje("Error en los parámetros de búsqueda.", true);
    }
  }

  function limpiarBusqueda() {
    filtros = { country: "", offset: "", limit: "" };
    getDatos();
  }

  onMount(getDatos);
</script>

<div class="page">
  <header class="hero">
    <div class="hero-inner">
      <div class="hero-tag">MJP · DATOS SALARIALES</div>
      <h1 class="hero-title">Salarios<br/>Mensuales<br/><em>Medios</em></h1>
      <p class="hero-sub">Datos comparativos de retribución mensual media por país y año, expresados en moneda local y dólares estadounidenses.</p>
    </div>
    <div class="hero-deco" aria-hidden="true">
      <span class="deco-circle c1"></span>
      <span class="deco-circle c2"></span>
      <span class="deco-num">$</span>
    </div>
  </header>

  <main class="content">
    {#if mensaje}
      <div class="toast" class:toast-error={esError} class:toast-ok={!esError}>
        <span class="toast-icon">{esError ? "⚠" : "✓"}</span>
        {mensaje}
      </div>
    {/if}

    <div class="layout">
      <section class="col-main">
        <div class="search-bar">
          <button class="btn-ghost" onclick={() => mostrarFiltros = !mostrarFiltros}>
            <span class="btn-icon">⊞</span>
            {mostrarFiltros ? "Cerrar buscador" : "Buscar y filtrar"}
          </button>
        </div>

        {#if mostrarFiltros}
          <div class="search-panel">
            <h3 class="panel-title">Filtros de búsqueda</h3>
            <div class="filter-grid">
              <label class="field-wrap">
                <span>País</span>
                <input bind:value={filtros.country} placeholder="Ej: spain" />
              </label>
              <label class="field-wrap">
                <span>Desde el registro nº</span>
                <input type="number" bind:value={filtros.offset} placeholder="0" />
              </label>
              <label class="field-wrap">
                <span>Máx. resultados</span>
                <input type="number" bind:value={filtros.limit} placeholder="10" />
              </label>
            </div>
            <div class="filter-actions">
              <button class="btn-primary" onclick={buscar}>Filtrar</button>
              <button class="btn-secondary" onclick={limpiarBusqueda}>Limpiar</button>
            </div>
          </div>
        {/if}

        <div class="table-wrap">
          <div class="table-header-row">
            <h2 class="table-title">Registros <span class="count-badge">{datos.length}</span></h2>
          </div>

          {#if datos.length > 0}
            <div class="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>País</th><th>Año</th><th>Salario (moneda local)</th>
                    <th>Salario (USD)</th><th>Tipo de cambio</th><th>Moneda</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {#each datos as d}
                    <tr>
                      <td class="td-country">{d.country}</td>
                      <td class="td-year">{d.year}</td>
                      <td>{d.avg_monthly_nc.toLocaleString()}</td>
                      <td class="td-usd">{d.avg_monthly_usd.toLocaleString()}</td>
                      <td>{d.exchange_rate}</td>
                      <td><span class="currency-tag">{d.currency}</span></td>
                      <td class="td-actions">
                        <a href="/average-monthly-wages/{d.country}/{d.year}" class="btn-edit">Editar</a>
                        <button class="btn-delete" onclick={() => borrarDato(d.country, d.year)}>Borrar</button>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {:else}
            <div class="empty-state">
              <span class="empty-icon">📭</span>
              <p>No hay registros cargados todavía.</p>
            </div>
          {/if}
        </div>

        <div class="global-actions">
          <button class="btn-load" onclick={cargarDatosIniciales}>
            <span>↓</span> Cargar datos iniciales
          </button>
          <button class="btn-danger" onclick={borrarTodo}>
            <span>✕</span> Eliminar todos los registros
          </button>
        </div>
      </section>

      <aside class="col-side">
        <div class="form-card">
          <div class="form-card-top">
            <h3>Nuevo registro</h3>
            <span class="badge-alta">Alta</span>
          </div>
          <div class="form-fields">
            <label class="field-wrap"><span>País</span><input bind:value={nuevoDato.country} placeholder="Ej: spain" /></label>
            <label class="field-wrap"><span>Año</span><input type="number" bind:value={nuevoDato.year} placeholder="Ej: 2023" /></label>
            <label class="field-wrap"><span>Salario mensual (moneda local)</span><input type="number" bind:value={nuevoDato.avg_monthly_nc} placeholder="Ej: 2500" /></label>
            <label class="field-wrap"><span>Salario mensual (USD)</span><input type="number" bind:value={nuevoDato.avg_monthly_usd} placeholder="Ej: 2700" /></label>
            <label class="field-wrap"><span>Tipo de cambio</span><input type="number" step="0.0001" bind:value={nuevoDato.exchange_rate} placeholder="Ej: 0.928" /></label>
            <label class="field-wrap"><span>Moneda</span><input bind:value={nuevoDato.currency} placeholder="Ej: EUR" /></label>
          </div>
          <button class="btn-primary full" onclick={crearDato}>Añadir registro</button>
        </div>
      </aside>
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

  .hero {
    background: linear-gradient(135deg, #1a1a2e 0%, #2e4a8a 60%, #1a3060 100%);
    padding: 3rem 2.5rem 2.5rem;
    display: flex; justify-content: space-between; align-items: flex-end;
    overflow: hidden; min-height: 260px;
  }
  .hero-inner { max-width: 520px; }
  .hero-tag { font-family: 'DM Mono', monospace; font-size: 0.72rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold-light); margin-bottom: 1rem; opacity: 0.85; }
  .hero-title { font-family: 'Playfair Display', serif; font-size: clamp(2.8rem, 5vw, 4.5rem); line-height: 1.0; color: #fff; font-weight: 700; letter-spacing: -0.02em; }
  .hero-title em { font-style: italic; color: var(--gold-light); }
  .hero-sub { margin-top: 1rem; color: rgba(255,255,255,0.65); font-size: 0.95rem; line-height: 1.6; max-width: 420px; }
  .hero-deco { position: relative; display: flex; align-items: center; justify-content: center; width: 160px; height: 160px; flex-shrink: 0; }
  .deco-circle { position: absolute; border-radius: 50%; border: 2px solid rgba(201,168,76,0.3); }
  .c1 { width: 140px; height: 140px; } .c2 { width: 100px; height: 100px; border-color: rgba(255,255,255,0.1); }
  .deco-num { font-family: 'Playfair Display', serif; font-size: 4rem; color: rgba(201,168,76,0.4); font-weight: 700; }

  .content { max-width: 1440px; margin: 0 auto; padding: 2rem 2rem 3rem; }

  .toast { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-radius: 14px; font-weight: 600; font-size: 0.92rem; margin-bottom: 1.5rem; animation: slideIn 0.25s ease; }
  @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  .toast-ok { background: var(--success-bg); color: var(--success); border: 1px solid rgba(30,107,74,0.15); }
  .toast-error { background: var(--danger-bg); color: var(--danger); border: 1px solid rgba(192,57,43,0.15); }

  .layout { display: grid; grid-template-columns: 1fr 320px; gap: 1.5rem; align-items: start; }

  .search-bar { margin-bottom: 1rem; }
  .btn-ghost { display: inline-flex; align-items: center; gap: 8px; background: var(--surface); border: 1px solid var(--border); border-radius: 999px; padding: 10px 18px; font-size: 0.9rem; font-weight: 600; color: var(--ink-soft); cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; box-shadow: var(--shadow); }
  .btn-ghost:hover { transform: translateY(-1px); }

  .search-panel { background: var(--surface); border-radius: var(--radius); padding: 1.5rem; margin-bottom: 1.25rem; border: 1px solid var(--border); box-shadow: var(--shadow); }
  .panel-title { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 600; color: var(--ink); margin-bottom: 1rem; }
  .filter-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 1rem; }
  .filter-actions { display: flex; gap: 10px; }

  .table-wrap { background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow); overflow: hidden; }
  .table-header-row { padding: 1.25rem 1.5rem 0.75rem; border-bottom: 1px solid var(--border); }
  .table-title { font-family: 'Playfair Display', serif; font-size: 1.15rem; font-weight: 600; color: var(--ink); display: flex; align-items: center; gap: 10px; }
  .count-badge { background: var(--blue-soft); color: var(--blue); border-radius: 999px; padding: 3px 11px; font-family: 'DM Mono', monospace; font-size: 0.78rem; font-weight: 500; }
  .table-scroll { overflow-x: auto; max-height: 480px; overflow-y: auto; }
  table { width: 100%; border-collapse: collapse; min-width: 700px; }
  thead { position: sticky; top: 0; z-index: 2; background: #f0f0f8; }
  th { padding: 11px 14px; text-align: left; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-muted); border-bottom: 1px solid var(--border); }
  td { padding: 12px 14px; font-size: 0.88rem; color: var(--ink-soft); border-bottom: 1px solid var(--border); vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--surface2); }
  .td-country { font-weight: 600; color: var(--ink); text-transform: capitalize; }
  .td-year { font-family: 'DM Mono', monospace; color: var(--blue); font-weight: 500; }
  .td-usd { font-family: 'DM Mono', monospace; font-weight: 500; color: var(--success); }
  .currency-tag { background: var(--blue-soft); color: var(--blue); border-radius: 6px; padding: 3px 8px; font-family: 'DM Mono', monospace; font-size: 0.78rem; font-weight: 500; }
  .td-actions { display: flex; gap: 6px; align-items: center; }
  .btn-edit { text-decoration: none; background: var(--blue-soft); color: var(--blue); border-radius: 8px; padding: 6px 12px; font-size: 0.8rem; font-weight: 600; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
  .btn-edit:hover { background: var(--blue); color: white; }
  .btn-delete { background: var(--danger-bg); color: var(--danger); border: none; border-radius: 8px; padding: 6px 12px; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
  .btn-delete:hover { background: var(--danger); color: white; }
  .empty-state { padding: 3rem; text-align: center; color: var(--ink-muted); }
  .empty-icon { font-size: 2rem; display: block; margin-bottom: 0.75rem; }

  .global-actions { display: flex; gap: 10px; margin-top: 1rem; flex-wrap: wrap; }
  .btn-load { display: inline-flex; align-items: center; gap: 6px; background: var(--blue); color: white; border: none; border-radius: 12px; padding: 11px 20px; font-size: 0.88rem; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
  .btn-load:hover { transform: translateY(-1px); opacity: 0.9; }
  .btn-danger { display: inline-flex; align-items: center; gap: 6px; background: var(--danger-bg); color: var(--danger); border: 1px solid rgba(192,57,43,0.2); border-radius: 12px; padding: 11px 20px; font-size: 0.88rem; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
  .btn-danger:hover { background: var(--danger); color: white; }

  .form-card { background: var(--surface); border-radius: var(--radius); padding: 1.5rem; border: 1px solid var(--border); box-shadow: var(--shadow); position: sticky; top: 1.5rem; }
  .form-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
  .form-card-top h3 { font-family: 'Playfair Display', serif; font-size: 1.15rem; font-weight: 600; color: var(--ink); }
  .badge-alta { background: linear-gradient(135deg, var(--gold), #e8c068); color: #3a2a00; border-radius: 999px; padding: 4px 12px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
  .form-fields { display: flex; flex-direction: column; gap: 12px; margin-bottom: 1.25rem; }

  .field-wrap { display: flex; flex-direction: column; gap: 5px; }
  .field-wrap span { font-size: 0.8rem; font-weight: 600; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.05em; }
  .field-wrap input { width: 100%; border: 1.5px solid var(--border); background: var(--surface2); border-radius: 12px; padding: 10px 13px; font-size: 0.9rem; color: var(--ink); outline: none; font-family: 'DM Sans', sans-serif; transition: border-color 0.15s, box-shadow 0.15s; }
  .field-wrap input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.12); }

  .btn-primary { background: linear-gradient(135deg, var(--blue) 0%, #1a3060 100%); color: white; border: none; border-radius: 12px; padding: 11px 20px; font-size: 0.9rem; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
  .btn-primary:hover { transform: translateY(-1px); opacity: 0.92; }
  .btn-primary.full { width: 100%; }
  .btn-secondary { background: var(--surface2); color: var(--ink-soft); border: 1px solid var(--border); border-radius: 12px; padding: 11px 20px; font-size: 0.9rem; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
  .btn-secondary:hover { background: var(--border); }

  @media (max-width: 1100px) {
    .layout { grid-template-columns: 1fr; }
    .form-card { position: static; }
    .filter-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 640px) {
    .hero { padding: 2rem 1.25rem 2rem; min-height: auto; }
    .hero-deco { display: none; }
    .content { padding: 1.25rem 1rem 2rem; }
    .filter-grid { grid-template-columns: 1fr; }
    .global-actions { flex-direction: column; }
  }
</style>