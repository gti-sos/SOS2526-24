<script>
  import { onMount } from 'svelte';

  const API_BASE = '/api/v1/recreation-culture-expenditure';
  const LOAD_INITIAL_DATA_PATH = '/loadInitialData';

  const crearEstadoInicial = () => ({
    country: '',
    year: '',
    recreation_value: '',
    total_household_consumption: '',
    recreation_share: '',
    population: '',
    recreation_per_capita: ''
  });

  let datos = crearEstadoInicial();
  let registros = [];
  let aviso = null;

  let cargandoListado = false;
  let cargandoIniciales = false;
  let creando = false;
  let borrandoTodos = false;
  let borrandoUno = false;

  const formatoNumero = new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 2
  });

  function mostrarAviso(tipo, texto) {
    aviso = { tipo, texto };
  }

  function limpiarAviso() {
    aviso = null;
  }

  function limpiarCampos(limpiarMensaje = false) {
    datos = crearEstadoInicial();
    if (limpiarMensaje) {
      limpiarAviso();
    }
  }

  function numero(valor) {
    return valor === '' || valor === null || valor === undefined ? NaN : Number(valor);
  }

  function construirPayload() {
    const payload = {
      country: datos.country.trim(),
      year: numero(datos.year),
      recreation_value: numero(datos.recreation_value),
      total_household_consumption: numero(datos.total_household_consumption),
      recreation_share: numero(datos.recreation_share),
      population: numero(datos.population),
      recreation_per_capita: numero(datos.recreation_per_capita)
    };

    const invalidos = [
      payload.year,
      payload.recreation_value,
      payload.total_household_consumption,
      payload.recreation_share,
      payload.population,
      payload.recreation_per_capita
    ].some((n) => !Number.isFinite(n));

    if (!payload.country || invalidos) return null;
    return payload;
  }

  function normalizarRegistros(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.items)) return data.items;

    if (data && typeof data === 'object') {
      const primeraLista = Object.values(data).find((valor) => Array.isArray(valor));
      if (Array.isArray(primeraLista)) return primeraLista;
    }

    return [];
  }

  async function leerRespuesta(response) {
    if (response.status === 204) return null;

    const tipo = response.headers.get('content-type') || '';

    if (tipo.includes('application/json')) {
      return await response.json();
    }

    const texto = await response.text();
    return texto ? { message: texto } : null;
  }

  async function llamarAPI(path = '', options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });

    const body = await leerRespuesta(response);

    if (!response.ok) {
      const error = new Error(body?.message || body?.error || 'Ha ocurrido un error.');
      error.status = response.status;
      error.body = body;
      throw error;
    }

    return body;
  }

  function mensajeError(accion, error, contexto = {}) {
    const status = error?.status;

    if (accion === 'listar') {
      if (status === 404) return 'No hay registros disponibles en este momento.';
      if (status === 500) return 'Ahora mismo no se puede cargar el listado. Inténtalo de nuevo.';
      return 'No se ha podido cargar la información.';
    }

    if (accion === 'iniciales') {
      if (status === 409) return 'Los datos iniciales ya estaban cargados.';
      if (status === 500) return 'Ha ocurrido un problema al cargar los datos iniciales.';
      return 'No se han podido cargar los datos iniciales.';
    }

    if (accion === 'crear') {
      if (status === 400) {
        return 'No se ha podido guardar el registro porque faltan datos o alguno no tiene un formato válido.';
      }
      if (status === 409) {
        return `Ya existe un registro para ${contexto.country} en ${contexto.year}.`;
      }
      if (status === 500) return 'Ha ocurrido un problema al guardar el registro.';
      return 'No se ha podido crear el registro.';
    }

    if (accion === 'borrarTodos') {
      if (status === 404) return 'No hay registros guardados para borrar.';
      if (status === 500) return 'Ha ocurrido un problema al borrar todos los registros.';
      return 'No se han podido borrar los registros.';
    }

    if (accion === 'borrarUno') {
      if (status === 404) {
        return `No existe un registro de ocio y cultura para ${contexto.country} en ${contexto.year}.`;
      }
      if (status === 400) {
        return 'Para borrar un registro concreto debes indicar un país y un año válidos.';
      }
      if (status === 500) {
        return 'Ha ocurrido un problema al borrar el registro seleccionado.';
      }
      return 'No se ha podido borrar el registro.';
    }

    return 'Ha ocurrido un error inesperado.';
  }

  async function obtenerRegistros(silencioso = false) {
    cargandoListado = true;
    limpiarAviso();

    try {
      const data = await llamarAPI();
      registros = normalizarRegistros(data);

      if (!silencioso) {
        if (registros.length > 0) {
          mostrarAviso('exito', `Listado actualizado correctamente. Hay ${registros.length} registro(s).`);
        } else {
          mostrarAviso('exito', 'La consulta se ha realizado correctamente, pero no hay registros guardados.');
        }
      }
    } catch (error) {
      registros = [];
      if (!silencioso) {
        mostrarAviso('error', mensajeError('listar', error));
      }
    } finally {
      cargandoListado = false;
    }
  }

  async function cargarDatosIniciales() {
    cargandoIniciales = true;
    limpiarAviso();

    try {
      await llamarAPI(LOAD_INITIAL_DATA_PATH, { method: 'GET' });
      await obtenerRegistros(true);
      mostrarAviso('exito', 'Los datos iniciales se han cargado correctamente y ya se muestran en el listado.');
    } catch (error) {
      if (error?.status === 409) {
        await obtenerRegistros(true);
        mostrarAviso('exito', 'Los datos iniciales ya estaban cargados. Se ha actualizado el listado.');
      } else {
        mostrarAviso('error', mensajeError('iniciales', error));
      }
    } finally {
      cargandoIniciales = false;
    }
  }

  async function crearRegistro() {
    limpiarAviso();

    const payload = construirPayload();

    if (!payload) {
      mostrarAviso(
        'error',
        'Revisa el formulario: todos los campos son obligatorios y deben tener un formato válido.'
      );
      return;
    }

    creando = true;

    try {
      await llamarAPI('', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      await obtenerRegistros(true);
      limpiarCampos(false);
      mostrarAviso('exito', `Registro creado correctamente para ${payload.country} en ${payload.year}.`);
    } catch (error) {
      mostrarAviso(
        'error',
        mensajeError('crear', error, {
          country: payload.country,
          year: payload.year
        })
      );
    } finally {
      creando = false;
    }
  }

  async function borrarTodos() {
    limpiarAviso();

    const confirmar = window.confirm(
      'Se van a borrar todos los registros de ocio y cultura. ¿Deseas continuar?'
    );

    if (!confirmar) return;

    borrandoTodos = true;

    try {
      const data = await llamarAPI('', { method: 'DELETE' });

      registros = [];

      const cantidad =
        typeof data?.deleted === 'number'
          ? data.deleted
          : typeof data?.count === 'number'
            ? data.count
            : null;

      if (cantidad !== null) {
        mostrarAviso('exito', `Se han eliminado correctamente ${cantidad} registro(s) de la base de datos.`);
      } else {
        mostrarAviso('exito', 'Se han eliminado todos los registros de la base de datos.');
      }
    } catch (error) {
      mostrarAviso('error', mensajeError('borrarTodos', error));
    } finally {
      borrandoTodos = false;
    }
  }

  async function borrarRegistroConcreto() {
    limpiarAviso();

    const country = datos.country.trim();
    const year = numero(datos.year);

    if (!country || !Number.isFinite(year)) {
      mostrarAviso(
        'error',
        'Para borrar un registro concreto debes indicar al menos un país y un año válidos.'
      );
      return;
    }

    const confirmar = window.confirm(
      `Se va a borrar el registro de ${country} en ${year}. ¿Deseas continuar?`
    );

    if (!confirmar) return;

    borrandoUno = true;

    try {
      await llamarAPI(`/${encodeURIComponent(country)}/${encodeURIComponent(year)}`, {
        method: 'DELETE'
      });

      await obtenerRegistros(true);
      mostrarAviso('exito', `Se ha eliminado correctamente el registro de ${country} en ${year}.`);
    } catch (error) {
      mostrarAviso(
        'error',
        mensajeError('borrarUno', error, {
          country,
          year
        })
      );
    } finally {
      borrandoUno = false;
    }
  }

  async function borrarDesdeTarjeta(country, year) {
    limpiarAviso();

    const confirmar = window.confirm(
      `Se va a borrar el registro de ${country} en ${year}. ¿Deseas continuar?`
    );

    if (!confirmar) return;

    try {
      borrandoUno = true;
      await llamarAPI(`/${encodeURIComponent(country)}/${encodeURIComponent(year)}`, {
        method: 'DELETE'
      });

      await obtenerRegistros(true);
      mostrarAviso('exito', `Se ha eliminado correctamente el registro de ${country} en ${year}.`);
    } catch (error) {
      mostrarAviso(
        'error',
        mensajeError('borrarUno', error, {
          country,
          year
        })
      );
    } finally {
      borrandoUno = false;
    }
  }

  onMount(async () => {
    await obtenerRegistros(true);
  });
</script>

<svelte:head>
  <title>EBP | recreation-culture-expenditure</title>
  <meta
    name="description"
    content="Front-end Svelte para gestionar los registros de ocio y cultura."
  />
</svelte:head>

<div class="page">
  <section class="intro">
    <p class="eyebrow">SOS2526-24 · EBP</p>
    <h1>Formulario de gestión</h1>
    <p class="intro-text">
      Rellena los campos del registro y después usa el botón de la acción que quieras realizar.
      Para crear un registro hacen falta todos los datos. Para borrar uno concreto basta con país y año.
    </p>
  </section>

  {#if aviso}
    <section class:success={aviso.tipo === 'exito'} class:error={aviso.tipo === 'error'} class="notice">
      <strong>{aviso.tipo === 'exito' ? 'Operación completada' : 'Atención'}</strong>
      <p>{aviso.texto}</p>
    </section>
  {/if}

  <section class="control-card">
    <div class="control-inner">
      <div class="form-grid">
        <label>
          <span>País</span>
          <input type="text" bind:value={datos.country} placeholder="España" />
        </label>

        <label>
          <span>Año</span>
          <input type="number" bind:value={datos.year} placeholder="2024" min="1900" />
        </label>

        <label>
          <span>Gasto en ocio y cultura</span>
          <input type="number" bind:value={datos.recreation_value} placeholder="63671000000" step="any" min="0" />
        </label>

        <label>
          <span>Consumo total de los hogares</span>
          <input
            type="number"
            bind:value={datos.total_household_consumption}
            placeholder="759001000000"
            step="any"
            min="0"
          />
        </label>

        <label>
          <span>Porcentaje destinado a ocio y cultura</span>
          <input type="number" bind:value={datos.recreation_share} placeholder="8.39" step="any" min="0" />
        </label>

        <label>
          <span>Población</span>
          <input type="number" bind:value={datos.population} placeholder="47786102" step="1" min="0" />
        </label>

        <label class="wide">
          <span>Gasto por persona</span>
          <input type="number" bind:value={datos.recreation_per_capita} placeholder="1332.42" step="any" min="0" />
        </label>
      </div>

      <div class="actions-row">
        <button type="button" class="action-btn" on:click={() => obtenerRegistros()}>
          {cargandoListado ? 'Cargando...' : 'Ver todos los registros'}
        </button>

        <button type="button" class="action-btn" on:click={cargarDatosIniciales}>
          {cargandoIniciales ? 'Cargando...' : 'Cargar datos iniciales'}
        </button>

        <button type="button" class="action-btn action-primary" on:click={crearRegistro}>
          {creando ? 'Guardando...' : 'Guardar registro'}
        </button>

        <button type="button" class="action-btn" on:click={borrarRegistroConcreto}>
          {borrandoUno ? 'Borrando...' : 'Borrar este registro'}
        </button>

        <button type="button" class="action-btn action-danger" on:click={borrarTodos}>
          {borrandoTodos ? 'Borrando...' : 'Borrar todos'}
        </button>

        <button type="button" class="action-btn action-light" on:click={() => limpiarCampos(true)}>
          Limpiar campos
        </button>
      </div>
    </div>
  </section>

  <section class="results-section">
    <div class="results-header">
      <div>
        <p class="eyebrow dark">Listado actual</p>
        <h2>Registros disponibles</h2>
      </div>
      <p class="count">
        {#if cargandoListado}
          Cargando información...
        {:else}
          {registros.length} registro(s)
        {/if}
      </p>
    </div>

    {#if !cargandoListado && registros.length === 0}
      <div class="empty-state">
        No hay registros disponibles en este momento.
      </div>
    {:else}
      <div class="records-grid">
        {#each registros as registro}
          <article class="record-card">
            <div class="record-header">
              <div>
                <h3>{registro.country}</h3>
                <p>{registro.year}</p>
              </div>

              <button
                type="button"
                class="mini-delete"
                on:click={() => borrarDesdeTarjeta(registro.country, registro.year)}
              >
                Borrar
              </button>
            </div>

            <dl>
              <div>
                <dt>Gasto en ocio y cultura</dt>
                <dd>{formatoNumero.format(Number(registro.recreation_value))}</dd>
              </div>
              <div>
                <dt>Consumo total de los hogares</dt>
                <dd>{formatoNumero.format(Number(registro.total_household_consumption))}</dd>
              </div>
              <div>
                <dt>Porcentaje destinado a ocio y cultura</dt>
                <dd>{formatoNumero.format(Number(registro.recreation_share))}%</dd>
              </div>
              <div>
                <dt>Población</dt>
                <dd>{formatoNumero.format(Number(registro.population))}</dd>
              </div>
              <div>
                <dt>Gasto por persona</dt>
                <dd>{formatoNumero.format(Number(registro.recreation_per_capita))}</dd>
              </div>
            </dl>
          </article>
        {/each}
      </div>
    {/if}
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
    max-width: 1420px;
    margin: 0 auto;
    padding: 18px 18px 42px;
  }

  .intro {
    margin: 10px 0 18px;
    color: #fff8f4;
  }

  .eyebrow {
    margin: 0 0 8px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.8rem;
    font-weight: 700;
  }

  .eyebrow.dark {
    color: #7a1837;
  }

  .intro h1,
  .results-header h2 {
    margin: 0 0 10px;
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: clamp(2.5rem, 5vw, 4rem);
    line-height: 0.95;
    font-weight: 600;
  }

  .intro-text {
    max-width: 850px;
    margin: 0;
    line-height: 1.7;
    font-size: 1.05rem;
  }

  .notice {
    margin: 0 0 18px;
    padding: 16px 18px;
    border-radius: 18px;
    border: 1px solid transparent;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
  }

  .notice strong {
    display: block;
    margin-bottom: 6px;
  }

  .notice p {
    margin: 0;
    line-height: 1.6;
  }

  .success {
    background: rgba(236, 253, 245, 0.96);
    border-color: #a7f3d0;
    color: #065f46;
  }

  .error {
    background: rgba(254, 242, 242, 0.96);
    border-color: #fecaca;
    color: #991b1b;
  }

  .control-card {
    display: flex;
    justify-content: center;
    margin-top: 12px;
  }

  .control-inner {
    width: min(900px, 100%);
    background: rgba(245, 242, 238, 0.96);
    border: 4px solid #111827;
    border-radius: 56px;
    padding: 34px 30px 24px;
    box-shadow: 0 18px 44px rgba(0, 0, 0, 0.14);
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px 18px;
  }

  .form-grid label {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-grid span {
    font-weight: 700;
    color: #2d3748;
  }

  .form-grid input {
    border: 3px solid #111827;
    border-radius: 18px;
    background: #ffffff;
    padding: 13px 14px;
    font-size: 1rem;
    font-family: inherit;
  }

  .form-grid input:focus {
    outline: none;
    box-shadow: 0 0 0 4px rgba(183, 66, 99, 0.18);
  }

  .wide {
    grid-column: 1 / -1;
  }

  .actions-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 14px;
    margin-top: 24px;
  }

  .action-btn {
    border: 3px solid #111827;
    background: #ffffff;
    color: #111827;
    border-radius: 16px;
    padding: 12px 16px;
    font-weight: 700;
    font-size: 0.95rem;
    font-family: inherit;
    cursor: pointer;
    transition: transform 0.15s ease, background 0.15s ease;
  }

  .action-btn:hover {
    transform: translateY(-1px);
  }

  .action-primary {
    background: #efe3b1;
  }

  .action-danger {
    background: #ffd6d6;
  }

  .action-light {
    background: #f7f3ee;
  }

  .results-section {
    margin-top: 30px;
    background: rgba(250, 245, 239, 0.92);
    border-radius: 30px;
    padding: 24px;
    box-shadow: 0 14px 34px rgba(0, 0, 0, 0.1);
  }

  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 16px;
    margin-bottom: 18px;
  }

  .count {
    margin: 0;
    color: #374151;
    font-weight: 600;
  }

  .empty-state {
    background: #ffffff;
    border-radius: 18px;
    padding: 26px;
    text-align: center;
    color: #4b5563;
  }

  .records-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
  }

  .record-card {
    background: #ffffff;
    border: 1px solid #ece3da;
    border-radius: 22px;
    padding: 18px;
  }

  .record-header {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
    margin-bottom: 14px;
  }

  .record-card h3 {
    margin: 0;
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 2rem;
    line-height: 0.95;
  }

  .record-card p {
    margin: 6px 0 0;
    color: #6b7280;
  }

  .mini-delete {
    border: none;
    border-radius: 999px;
    background: #7a1837;
    color: #fff;
    padding: 10px 12px;
    font-size: 0.88rem;
    font-weight: 700;
    cursor: pointer;
  }

  .record-card dl {
    display: grid;
    gap: 10px;
    margin: 0;
  }

  .record-card dl div {
    background: #faf7f4;
    border-radius: 14px;
    padding: 12px;
  }

  .record-card dt {
    font-size: 0.84rem;
    color: #6b7280;
    margin-bottom: 4px;
  }

  .record-card dd {
    margin: 0;
    font-weight: 700;
    color: #111827;
  }

  @media (max-width: 1100px) {
    .records-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 820px) {
    .page {
      padding: 14px 14px 30px;
    }

    .control-inner {
      border-radius: 34px;
      padding: 22px 18px 18px;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }

    .wide {
      grid-column: auto;
    }

    .results-header,
    .record-header {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>