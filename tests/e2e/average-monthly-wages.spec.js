import { test, expect } from '@playwright/test';

// URL base configurable para local o Render
const URL_BASE = process.env.BASE_URL || 'http://localhost:3000';
const URL_APP = `${URL_BASE}/average-monthly-wages`;

test.describe('Pruebas E2E - average-monthly-wages', () => {
  test.beforeEach(async ({ page }) => {
    // Aceptar automáticamente los confirm de borrar
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    await page.goto(URL_APP, { waitUntil: 'networkidle' });
  });

  // ─── Helpers ────────────────────────────────────────────────────────────────

  async function abrirPanelFiltros(page) {
    const boton = page.getByRole('button', { name: /buscar y filtrar|cerrar buscador/i });
    await boton.click();
    await expect(page.locator('.search-panel')).toBeVisible();
  }

  async function cargarDatosIniciales(page) {
    await page.getByRole('button', { name: /cargar datos iniciales/i }).click();

    // Puede devolver éxito o conflicto si ya estaban cargados
    await expect(
      page.locator('.toast')
    ).toContainText(
      /registros iniciales cargados con éxito|La base de datos ya tiene datos/i,
      { timeout: 10000 }
    );
  }

  async function crearRegistro(page, { country, year, avg_monthly_nc, avg_monthly_usd, exchange_rate, currency }) {
    const panelAlta = page.locator('.form-card');

    const inputs = panelAlta.locator('input');
    await inputs.nth(0).fill(country);
    await inputs.nth(1).fill(String(year));
    await inputs.nth(2).fill(String(avg_monthly_nc));
    await inputs.nth(3).fill(String(avg_monthly_usd));
    await inputs.nth(4).fill(String(exchange_rate));
    await inputs.nth(5).fill(currency);

    await panelAlta.getByRole('button', { name: /añadir registro/i }).click();
  }

  // ─── Tests ──────────────────────────────────────────────────────────────────

  test('1. Debe listar registros y permitir cargar datos iniciales', async ({ page }) => {
    await cargarDatosIniciales(page);

    // La tabla debe estar visible y tener al menos una fila
    const filas = page.locator('tbody tr');
    await expect(filas.first()).toBeVisible({ timeout: 10000 });

    // El badge de contador debe existir y mostrar un número
    await expect(page.locator('.count-badge')).toBeVisible();
  });

  test('2. Debe crear un recurso y actualizar automáticamente el listado', async ({ page }) => {
    const country = `testland_${Date.now()}`;
    const year = 2030;

    await crearRegistro(page, {
      country,
      year,
      avg_monthly_nc: 3500,
      avg_monthly_usd: 3800,
      exchange_rate: 1.085,
      currency: 'EUR'
    });

    // Mensaje de éxito comprensible para el usuario
    await expect(page.locator('.toast')).toContainText(/Registro creado con éxito/i);

    // Verifica recarga automática del listado sin refresco manual
    const filaNueva = page.locator('tbody tr', { hasText: country });
    await expect(filaNueva).toContainText(String(year));
    await expect(filaNueva).toContainText('3500');
    await expect(filaNueva).toContainText('EUR');
  });

  test('3. Debe buscar recursos usando los filtros del frontend', async ({ page }) => {
    const country = `findme_${Date.now()}`;
    const year = 2031;

    // Creamos un dato único para que la búsqueda sea fiable
    await crearRegistro(page, {
      country,
      year,
      avg_monthly_nc: 7777,
      avg_monthly_usd: 8500,
      exchange_rate: 1.09,
      currency: 'EUR'
    });

    await expect(page.locator('.toast')).toContainText(/Registro creado con éxito/i);

    await abrirPanelFiltros(page);

    // Rellenamos el filtro de país con el valor único
    const filtros = page.locator('.search-panel input');
    await filtros.nth(0).fill(country);

    await page.getByRole('button', { name: /^filtrar$/i }).click();

    // Mensaje de resultados
    await expect(page.locator('.toast')).toContainText(/resultado/i);

    // Tras filtrar, debe aparecer únicamente ese registro
    const filas = page.locator('tbody tr');
    await expect(filas).toHaveCount(1);
    await expect(filas.first()).toContainText(country);
    await expect(filas.first()).toContainText(String(year));
  });

  test('4. Debe editar un recurso en la vista dinámica separada', async ({ page }) => {
    const country = `editland_${Date.now()}`;
    const year = 2032;

    await crearRegistro(page, {
      country,
      year,
      avg_monthly_nc: 1000,
      avg_monthly_usd: 1100,
      exchange_rate: 1.1,
      currency: 'USD'
    });

    await expect(page.locator('.toast')).toContainText(/Registro creado con éxito/i);

    const fila = page.locator('tbody tr', { hasText: country });
    await expect(fila).toBeVisible();

    // Click en el enlace de editar de esa fila
    await fila.getByRole('link', { name: /editar/i }).click();

    // Comprobamos que la URL es dinámica: /average-monthly-wages/:country/:year
    await expect(page).toHaveURL(
      new RegExp(`/average-monthly-wages/${encodeURIComponent(country)}/${year}$`)
    );

    // El título de edición debe estar visible
    await expect(page.getByRole('heading', { name: /editar/i })).toBeVisible();

    // Modificamos los campos editables del formulario
    const inputsEdicion = page.locator('.form-grid input');
    await inputsEdicion.nth(0).fill('5555');    // avg_monthly_nc
    await inputsEdicion.nth(1).fill('6000');    // avg_monthly_usd
    await inputsEdicion.nth(2).fill('1.0800');  // exchange_rate
    await inputsEdicion.nth(3).fill('GBP');     // currency

    await page.getByRole('button', { name: /guardar cambios/i }).click();

    // Mensaje comprensible de confirmación
    await expect(page.locator('.toast')).toContainText(/Los cambios se han guardado correctamente/i);
  });

  test('5. Debe borrar un recurso concreto desde el listado', async ({ page }) => {
    const country = `deleteone_${Date.now()}`;
    const year = 2033;

    await crearRegistro(page, {
      country,
      year,
      avg_monthly_nc: 4000,
      avg_monthly_usd: 4300,
      exchange_rate: 1.075,
      currency: 'EUR'
    });

    await expect(page.locator('.toast')).toContainText(/Registro creado con éxito/i);

    const fila = page.locator('tbody tr', { hasText: country });
    await expect(fila).toBeVisible();

    // Borrar la fila concreta
    await fila.getByRole('button', { name: /borrar/i }).click();

    // Mensaje de confirmación de borrado
    await expect(page.locator('.toast')).toContainText(
      new RegExp(`${country}.*${year}|eliminado`, 'i')
    );

    // La fila ya no debe aparecer en la tabla
    await expect(page.locator('tbody tr', { hasText: country })).toHaveCount(0);
  });

  test('6. Debe borrar todos los recursos de la base de datos', async ({ page }) => {
    await cargarDatosIniciales(page);

    // Comprobamos que hay filas antes de borrar
    const filasAntes = await page.locator('tbody tr').count();
    expect(filasAntes).toBeGreaterThan(0);

    await page.getByRole('button', { name: /eliminar todos los registros/i }).click();

    // Mensaje de confirmación global
    await expect(page.locator('.toast')).toContainText(/eliminados/i);

    // La tabla queda vacía y se muestra el estado vacío
    await expect(page.locator('tbody tr')).toHaveCount(0);
    await expect(page.getByText(/No hay registros cargados todavía/i)).toBeVisible();
  });

  test('7. Debe avisar si se intenta crear un registro duplicado', async ({ page }) => {
    const country = `duplicate_${Date.now()}`;
    const year = 2034;

    const datos = {
      country,
      year,
      avg_monthly_nc: 2000,
      avg_monthly_usd: 2200,
      exchange_rate: 1.1,
      currency: 'EUR'
    };

    // Primer alta — debe tener éxito
    await crearRegistro(page, datos);
    await expect(page.locator('.toast')).toContainText(/Registro creado con éxito/i);

    // Segundo alta con los mismos identificadores — debe dar conflicto 409
    await crearRegistro(page, datos);
    await expect(page.locator('.toast')).toContainText(
      new RegExp(`Ya existe un registro para.*${country}.*${year}`, 'i')
    );
  });

  test('8. Debe avisar si se intenta crear un registro con campos incompletos', async ({ page }) => {
    const panelAlta = page.locator('.form-card');

    // Solo rellenamos el país y el año, dejamos el resto vacío
    const inputs = panelAlta.locator('input');
    await inputs.nth(0).fill('spain');
    await inputs.nth(1).fill('2035');

    await panelAlta.getByRole('button', { name: /añadir registro/i }).click();

    // La API debe devolver 400 y mostrar un mensaje comprensible
    await expect(page.locator('.toast')).toContainText(
      /Rellena todos los campos correctamente|datos no son válidos/i
    );
  });
});