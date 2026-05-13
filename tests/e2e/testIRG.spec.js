import { test, expect } from '@playwright/test';

// URL dinámica para Local o Render
const URL_BASE = process.env.BASE_URL || 'http://localhost:3000';
const URL_APP = `${URL_BASE}/international-construction-costs`;

test.describe('Pruebas E2E - SOS2526-24 (Isaac)', () => {

    test.beforeEach(async ({ page }) => {
        // Aceptamos cualquier diálogo automáticamente para evitar bloqueos
        page.on('dialog', dialog => dialog.accept());
        // Espera que cargue la red
        await page.goto(URL_APP, { waitUntil: 'networkidle' });
    });

    test('1. Debe cargar los datos iniciales y listarlos', async ({ page }) => {
        // 1. Limpiamos la base de datos primero
        await page.getByRole('button', { name: 'Limpiar Base de Datos Completa' }).click();
        await expect(page.getByText(/eliminado todos los registros/i)).toBeVisible();

        // 2. Ahora cargamos los datos
        await page.getByRole('button', { name: 'carga datos iniciales' }).click();
        
        // 3. Verificamos el mensaje de éxito
        await expect(page.getByText(/registros iniciales con éxito/i)).toBeVisible({ timeout: 10000 });
        
        const filas = page.locator('table tbody tr');
        await expect(filas.first()).toBeVisible();
    });

    test('2. Debe crear un recurso y encontrarlo usando el buscador', async ({ page }) => {
        const ciudadUnica = "TestCity_" + Math.floor(Math.random() * 9999);

        await page.getByPlaceholder('País').fill('España');
        await page.getByPlaceholder('Año').fill('2026');
        await page.getByPlaceholder('Ciudad').fill(ciudadUnica);
        await page.getByPlaceholder('Coste USD/m2').fill('1200');
        await page.getByPlaceholder('Rango cambio (ej: 5%)').fill('2%');
        await page.getByPlaceholder('Ranking').fill('5');

        await page.getByRole('button', { name: 'Añadir Registro' }).click();
        await expect(page.getByText('¡Recurso creado con éxito!')).toBeVisible();

        // Usamos el buscador para evitar fallos si el dato cae en otra página
        await page.getByRole('button', { name: 'Abrir Buscador' }).click();
        await page.getByPlaceholder('Ej: Madrid').fill(ciudadUnica);
        await page.getByRole('button', { name: 'Filtrar ahora' }).click();

        await expect(page.locator('table')).toContainText(ciudadUnica);
    });

    test('3. Búsqueda por rango de años', async ({ page }) => {
        await page.getByRole('button', { name: 'Abrir Buscador' }).click();

        await page.locator('label', { hasText: 'Desde:' }).locator('input').fill('2024');
        await page.locator('label', { hasText: 'Hasta:' }).locator('input').fill('2024');
        
        await page.getByRole('button', { name: 'Filtrar ahora' }).click();
        await expect(page.getByText(/Búsqueda finalizada/i)).toBeVisible();

        const celdasAño = page.locator('table tbody tr td:nth-child(2)');
        const textos = await celdasAño.allTextContents();
        
        for (const t of textos) {
            expect(t.trim()).toBe('2024');
        }
    });

    test('4. Edición en vista separada dinámica (L08)', async ({ page }) => {
        // Aseguramos estado limpio
        await page.getByRole('button', { name: 'Limpiar Base de Datos Completa' }).click();
        await expect(page.getByText(/eliminado todos los registros/i)).toBeVisible();
        await page.getByRole('button', { name: 'carga datos iniciales' }).click();
        await expect(page.getByText(/registros iniciales con éxito/i)).toBeVisible();

        const primeraFila = page.locator('table tbody tr').first();
        await primeraFila.getByRole('button', { name: 'Editar' }).click();

        await expect(page).toHaveURL(/.*\/international-construction-costs\/.+\/.+\/.+/);
        await expect(page.locator('h2')).toContainText('Editando registro');

        await page.getByLabel('Coste USD por m²:').fill('9999');
        await page.getByLabel('Ranking:').fill('1');

        await page.getByRole('button', { name: 'Guardar Cambios' }).click();
        await expect(page.getByText('Los cambios se han guardado correctamente.')).toBeVisible();

        await page.getByRole('button', { name: 'Volver al listado' }).click();
        await expect(page.locator('table')).toContainText('9999');
    });

test('5. Debe borrar un recurso concreto', async ({ page }) => {
        // Aseguramos estado limpio
        await page.getByRole('button', { name: 'Limpiar Base de Datos Completa' }).click();
        await expect(page.getByText(/eliminado todos los registros/i)).toBeVisible();
        await page.getByRole('button', { name: 'carga datos iniciales' }).click();
        await expect(page.getByText(/registros iniciales con éxito/i)).toBeVisible();
        
        // Cambiamos el límite a 20 para ver todos los datos (los 11 iniciales)
        await page.getByLabel(/Resultados por página:/i).selectOption('20');
        
        // REGLA DE ORO: Esperamos explícitamente a que Svelte dibuje las 11 filas 
        // antes de hacer nada más. Así evitamos que cuente 10 por ir demasiado rápido.
        await expect(page.locator('table tbody tr')).toHaveCount(11);
        
        // Ahora sí, borramos la primera fila
        await page.locator('table tbody tr').first().getByRole('button', { name: 'Borrar' }).click();

        // Como partíamos de 11 exactos, esperamos que queden 10
        await expect(page.locator('table tbody tr')).toHaveCount(10);
    });

    test('6. Debe cambiar el límite de resultados por página', async ({ page }) => {
        // Aseguramos estado limpio
        await page.getByRole('button', { name: 'Limpiar Base de Datos Completa' }).click();
        await expect(page.getByText(/eliminado todos los registros/i)).toBeVisible();
        await page.getByRole('button', { name: 'carga datos iniciales' }).click();
        await expect(page.getByText(/registros iniciales con éxito/i)).toBeVisible();
        
        await expect(page.locator('table tbody tr')).toHaveCount(10); 

        // Seleccionamos límite de 5
        await page.getByLabel(/Resultados por página:/i).selectOption('5');

        await expect(page.locator('table tbody tr')).toHaveCount(5);
    });

    test('7. Debe navegar entre páginas (Siguiente y Anterior)', async ({ page }) => {
        // Aseguramos estado limpio
        await page.getByRole('button', { name: 'Limpiar Base de Datos Completa' }).click();
        await expect(page.getByText(/eliminado todos los registros/i)).toBeVisible();
        await page.getByRole('button', { name: 'carga datos iniciales' }).click();
        await expect(page.getByText(/registros iniciales con éxito/i)).toBeVisible();
        
        await page.getByLabel(/Resultados por página:/i).selectOption('5');

        await expect(page.getByText('Página 1')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Anterior' })).toBeDisabled();

        await page.getByRole('button', { name: 'Siguiente' }).click();

        await expect(page.getByText('Página 2')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Anterior' })).toBeEnabled();
    });

    test('8. Debe borrar toda la base de datos', async ({ page }) => {
        await page.getByRole('button', { name: 'Limpiar Base de Datos Completa' }).click();
        await expect(page.locator('table tbody tr')).toHaveCount(0);
    });
});