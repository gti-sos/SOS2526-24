import { test, expect } from '@playwright/test';

// URL base configurable para local o Render
const URL_BASE = process.env.BASE_URL || 'http://localhost:3000';
const URL_APP = `${URL_BASE}/recreation-culture-expenditure`;

test.describe('Pruebas E2E - recreation-culture-expenditure', () => {
  test.beforeEach(async ({ page }) => {
    // Aceptar automáticamente los confirm de borrar
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    await page.goto(URL_APP, { waitUntil: 'networkidle' });
  });

  async function abrirPanelFiltros(page) {
    const boton = page.getByRole('button', { name: /búsqueda y filtros|ocultar búsqueda y filtros/i });
    await boton.click();
    await expect(page.locator('.search-panel')).toBeVisible();
  }

  async function cargarDatosIniciales(page) {
    await page.getByRole('button', { name: /cargar datos iniciales/i }).click();

    // Puede devolver éxito o conflicto si ya estaban cargados
    await expect(
      page.locator('.alert-box')
    ).toContainText(
      /Datos iniciales cargados correctamente|Los datos iniciales ya estaban cargados/i,
      { timeout: 10000 }
    );
  }

  async function crearRegistro(page, {
    country,
    year,
    recreation_value,
    total_household_consumption,
    population
  }) {
    const panelAlta = page.locator('.side-panel');

    const inputs = panelAlta.locator('input');
    await inputs.nth(0).fill(country);
    await inputs.nth(1).fill(String(year));
    await inputs.nth(2).fill(String(recreation_value));
    await inputs.nth(3).fill(String(total_household_consumption));
    await inputs.nth(4).fill(String(population));

    await panelAlta.getByRole('button', { name: /añadir registro/i }).click();
  }

  test('1. Debe listar registros y permitir cargar datos iniciales', async ({ page }) => {
    // Esta prueba cubre la funcionalidad de listado
    await cargarDatosIniciales(page);

    await expect(page.getByRole('heading', { name: /listado de registros/i })).toBeVisible();

    // Debe existir al menos una fila o, como mínimo, el contador no estar vacío
    const filas = page.locator('.records-row');
    await expect(filas.first()).toBeVisible({ timeout: 10000 });

    // Comprobación adicional: el badge de contador debe existir
    await expect(page.locator('.counter-badge')).toBeVisible();
  });

  test('2. Debe crear un recurso y actualizar automáticamente el listado', async ({ page }) => {
    const country = `Testland_${Date.now()}`;
    const year = 2030;

    await crearRegistro(page, {
      country,
      year,
      recreation_value: 123456,
      total_household_consumption: 999999,
      population: 5000
    });

    await expect(page.locator('.alert-box')).toContainText(/Registro creado correctamente/i);

    // Verifica recarga automática del listado sin refresco manual
    const filaNueva = page.locator('.records-row', { hasText: country });
    await expect(filaNueva).toContainText(String(year));
    await expect(filaNueva).toContainText('123456');
  });

  test('3. Debe buscar recursos usando los filtros del frontend', async ({ page }) => {
    const country = `Findme_${Date.now()}`;
    const year = 2031;

    // Creamos un dato único para que la búsqueda sea fiable
    await crearRegistro(page, {
      country,
      year,
      recreation_value: 777777,
      total_household_consumption: 888888,
      population: 9999
    });

    await expect(page.locator('.alert-box')).toContainText(/Registro creado correctamente/i);

    await abrirPanelFiltros(page);

    const filtros = page.locator('.search-panel input');
    await filtros.nth(0).fill(country); // country exacto

    await page.getByRole('button', { name: /^buscar$/i }).click();

    await expect(page.locator('.alert-box')).toContainText(/Búsqueda completada/i);

    // Tras buscar, debe aparecer el registro único
    const filas = page.locator('.records-row');
    await expect(filas).toHaveCount(1);
    await expect(filas.first()).toContainText(country);
    await expect(filas.first()).toContainText(String(year));
  });

  test('4. Debe editar un recurso en la vista dinámica separada', async ({ page }) => {
    const country = `Editland_${Date.now()}`;
    const year = 2032;

    await crearRegistro(page, {
      country,
      year,
      recreation_value: 1000,
      total_household_consumption: 2000,
      population: 300
    });

    await expect(page.locator('.alert-box')).toContainText(/Registro creado correctamente/i);

    const fila = page.locator('.records-row', { hasText: country });
    await expect(fila).toBeVisible();

    await fila.getByRole('link', { name: /editar/i }).click();

    // Ruta dinámica /recreation-culture-expenditure/:country/:year
    await expect(page).toHaveURL(new RegExp(`/recreation-culture-expenditure/${encodeURIComponent(country)}/${year}$`));
    await expect(page.getByRole('heading', { name: /editar registro/i })).toBeVisible();

    const inputsEdicion = page.locator('.form-grid input');
    await inputsEdicion.nth(0).fill('5555');   // recreation_value
    await inputsEdicion.nth(1).fill('6666');   // total_household_consumption
    await inputsEdicion.nth(2).fill('777');    // population

    await page.getByRole('button', { name: /guardar cambios/i }).click();

    await expect(page.locator('.alert-box')).toContainText(/Los cambios se han guardado correctamente/i);

    // Tras guardar, la vista redirige al listado
    await expect(page).toHaveURL(new RegExp(`/recreation-culture-expenditure$`), { timeout: 10000 });

    const filaActualizada = page.locator('.records-row', { hasText: country });
    await expect(filaActualizada).toContainText('5555');
    await expect(filaActualizada).toContainText('6666');
    await expect(filaActualizada).toContainText('777');
  });

  test('5. Debe borrar un recurso concreto desde el listado', async ({ page }) => {
    const country = `DeleteOne_${Date.now()}`;
    const year = 2033;

    await crearRegistro(page, {
      country,
      year,
      recreation_value: 4000,
      total_household_consumption: 5000,
      population: 600
    });

    await expect(page.locator('.alert-box')).toContainText(/Registro creado correctamente/i);

    const fila = page.locator('.records-row', { hasText: country });
    await expect(fila).toBeVisible();

    await fila.getByRole('button', { name: /borrar/i }).click();

    await expect(page.locator('.alert-box')).toContainText(
      new RegExp(`Se ha borrado correctamente el registro de ${country} \\(${year}\\)`, 'i')
    );

    await expect(page.locator('.records-row', { hasText: country })).toHaveCount(0);
  });

  test('6. Debe borrar todos los recursos de la base de datos', async ({ page }) => {
    await cargarDatosIniciales(page);

    const filasAntes = await page.locator('.records-row').count();
    expect(filasAntes).toBeGreaterThan(0);

    await page.getByRole('button', { name: /eliminar todos los registros/i }).click();

    await expect(page.locator('.alert-box')).toContainText(/Se han eliminado todos los registros/i);

    // Al borrar todo, debe mostrarse el estado vacío
    await expect(page.locator('.records-row')).toHaveCount(0);
    await expect(page.getByText(/No hay registros cargados todavía/i)).toBeVisible();
  });

  test('7. Debe avisar al usuario si intenta crear un registro incompleto', async ({ page }) => {
    // Esta prueba te viene bien como extra para demostrar manejo de errores comprensible
    const panelAlta = page.locator('.side-panel');

    const inputs = panelAlta.locator('input');
    await inputs.nth(0).fill('Spain');
    await inputs.nth(1).fill('2035');
    // Dejamos campos sin completar a propósito

    await panelAlta.getByRole('button', { name: /añadir registro/i }).click();

    await expect(page.locator('.alert-box')).toContainText(
      /Completa todos los campos obligatorios antes de añadir el registro/i
    );
  });
});