import { test, expect } from '@playwright/test';

// URL base configurable para local o Render
const URL_BASE = process.env.BASE_URL || 'http://localhost:3000';
const URL_APP = `${URL_BASE}/average-monthly-wages`;

test.describe('Pruebas E2E - average-monthly-wages (María)', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(URL_APP, { waitUntil: 'networkidle' });
    });

    test('1. Debe cargar los datos iniciales y listarlos', async ({ page }) => {
        page.on('dialog', dialog => dialog.accept());

        // Limpiamos primero para evitar error 409
        await page.getByRole('button', { name: /Limpiar Base de Datos/i }).click();

        // Cargamos los datos iniciales
        await page.getByRole('button', { name: /Cargar Datos Iniciales/i }).click();

        // Verificamos el mensaje de éxito
        await expect(page.getByText(/registros iniciales con éxito/i)).toBeVisible({ timeout: 10000 });

        // Verificamos que la tabla tiene filas
        const filas = page.locator('table tbody tr');
        await expect(filas.first()).toBeVisible();
    });

    test('2. Debe crear un recurso y actualizar la tabla automáticamente', async ({ page }) => {
        const paisUnico = 'testpais' + Math.floor(Math.random() * 9999);

        await page.getByPlaceholder('País (ej: spain)').fill(paisUnico);
        await page.getByPlaceholder('Año (ej: 2023)').fill('2030');
        await page.getByPlaceholder('Salario mensual medio (moneda local)').fill('3000');
        await page.getByPlaceholder('Salario mensual medio (USD)').fill('3200');
        await page.getByPlaceholder('Tipo de cambio (ej: 0.928)').fill('0.93');
        await page.getByPlaceholder('Moneda (ej: EUR)').fill('EUR');

        await page.getByRole('button', { name: 'Añadir Registro' }).click();

        // Verificamos mensaje de éxito
        await expect(page.getByText('¡Registro de salario creado con éxito!')).toBeVisible();

        // Verificamos que el nuevo registro aparece en la tabla sin recargar
        await expect(page.locator('table')).toContainText(paisUnico);
    });

    test('3. Debe buscar recursos usando el buscador por país', async ({ page }) => {
        page.on('dialog', dialog => dialog.accept());

        // Nos aseguramos de tener datos
        await page.getByRole('button', { name: /Cargar Datos Iniciales/i }).click();

        // Abrimos el buscador
        await page.getByRole('button', { name: /Abrir Buscador/i }).click();

        // Filtramos por país
        await page.getByPlaceholder('Ej: spain').fill('canada');

        await page.getByRole('button', { name: 'Filtrar ahora' }).click();

        // Verificamos el mensaje de búsqueda
        await expect(page.getByText(/resultado\(s\) encontrado\(s\)/i)).toBeVisible();

        // Verificamos que todos los resultados son de canada
        const celdasPais = page.locator('table tbody tr td:nth-child(1)');
        const textos = await celdasPais.allTextContents();
        for (const t of textos) {
            expect(t.trim().toLowerCase()).toBe('canada');
        }
    });

    test('4. Debe editar un recurso en vista separada dinámica', async ({ page }) => {
        page.on('dialog', dialog => dialog.accept());

        // Nos aseguramos de tener datos
        await page.getByRole('button', { name: /Cargar Datos Iniciales/i }).click();
        await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10000 });

        // Hacemos click en el primer botón Editar
        await page.locator('table tbody tr').first().getByRole('button', { name: 'Editar' }).click();

        // Verificamos que la URL es dinámica
        await expect(page).toHaveURL(/.*\/average-monthly-wages\/.+\/.+/);
        await expect(page.locator('h2')).toContainText('Editando registro');

        // Modificamos el salario en USD
        await page.getByLabel(/Salario mensual medio \(USD\):/).fill('9999');

        await page.getByRole('button', { name: 'Guardar Cambios' }).click();

        // Verificamos mensaje de éxito
        await expect(page.getByText('Los cambios se han guardado correctamente.')).toBeVisible();

        // Volvemos al listado y comprobamos que el valor se actualizó
        await page.getByRole('button', { name: 'Volver al listado' }).click();
        await expect(page.locator('table')).toContainText('9999');
    });

    test('5. Debe borrar un recurso concreto', async ({ page }) => {
        page.on('dialog', dialog => dialog.accept());

        // Nos aseguramos de tener datos
        await page.getByRole('button', { name: /Cargar Datos Iniciales/i }).click();
        await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10000 });

        // Contamos filas antes de borrar
        const filasAntes = await page.locator('table tbody tr').count();

        // Borramos la primera fila
        await page.locator('table tbody tr').first().getByRole('button', { name: 'Borrar' }).click();

        // Verificamos que la tabla tiene una fila menos (recarga automática)
        await expect(page.locator('table tbody tr')).toHaveCount(filasAntes - 1);
    });

    test('6. Debe borrar toda la base de datos', async ({ page }) => {
        page.on('dialog', dialog => dialog.accept());

        await page.getByRole('button', { name: 'Limpiar Base de Datos Completa' }).click();

        // Verificamos mensaje de confirmación
        await expect(page.getByText(/Se han eliminado todos los registros/i)).toBeVisible();

        // Verificamos que la tabla queda vacía
        await expect(page.locator('table tbody tr')).toHaveCount(0);
    });

    test('7. Debe mostrar error al intentar crear un registro duplicado', async ({ page }) => {
        page.on('dialog', dialog => dialog.accept());

        // Cargamos datos para tener canada/2024 en la base
        await page.getByRole('button', { name: /Cargar Datos Iniciales/i }).click();
        await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10000 });

        // Intentamos crear un duplicado
        await page.getByPlaceholder('País (ej: spain)').fill('canada');
        await page.getByPlaceholder('Año (ej: 2023)').fill('2024');
        await page.getByPlaceholder('Salario mensual medio (moneda local)').fill('1000');
        await page.getByPlaceholder('Salario mensual medio (USD)').fill('1000');
        await page.getByPlaceholder('Tipo de cambio (ej: 0.928)').fill('1.3');
        await page.getByPlaceholder('Moneda (ej: EUR)').fill('CAD');

        await page.getByRole('button', { name: 'Añadir Registro' }).click();

        // Verificamos mensaje de error comprensible
        await expect(page.getByText(/Ya existe un registro para el país/i)).toBeVisible();
    });

    test('8. Debe paginar resultados correctamente', async ({ page }) => {
        page.on('dialog', dialog => dialog.accept());

        // Cargamos datos
        await page.getByRole('button', { name: /Cargar Datos Iniciales/i }).click();
        await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10000 });

        // Abrimos el buscador y aplicamos límite de 3
        await page.getByRole('button', { name: /Abrir Buscador/i }).click();
        await page.getByPlaceholder('10').fill('3');

        await page.getByRole('button', { name: 'Filtrar ahora' }).click();

        await expect(page.getByText(/resultado\(s\) encontrado\(s\)/i)).toBeVisible();

        // Verificamos que hay máximo 3 filas
        const filas = await page.locator('table tbody tr').count();
        expect(filas).toBeLessThanOrEqual(3);
    });
});