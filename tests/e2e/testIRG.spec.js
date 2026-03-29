import { test, expect } from '@playwright/test';

// Configuramos la URL dinámicamente para Local o Render
const URL_BASE = process.env.BASE_URL || 'http://localhost:3000';
const URL_APP = `${URL_BASE}/international-construction-costs`;

test.describe('Pruebas E2E - SOS2526-24 (Isaac)', () => {

    test.beforeEach(async ({ page }) => {
        // Vamos a la página y esperamos a que cargue la red
        await page.goto(URL_APP, { waitUntil: 'networkidle' });
    });

 test('1. Debe cargar los datos iniciales y listarlos', async ({ page }) => {
    // Aceptamos los carteles de confirmación automáticamente
    page.on('dialog', dialog => dialog.accept());

    // 1. Primero limpiamos para que la carga inicial no dé error 409
    await page.getByRole('button', { name: /Limpiar Base de Datos/i }).click();

    // 2. Ahora cargamos los datos
    await page.getByRole('button', { name: 'carga datos iniciales' }).click();
    
    // 3. Verificamos el mensaje con un poco más de tiempo (por si el server es lento)
    await expect(page.getByText(/registros iniciales con éxito/i)).toBeVisible({ timeout: 10000 });
    
    const filas = page.locator('table tbody tr');
    await expect(filas.first()).toBeVisible();
});
 

    test('Debe crear un recurso y actualizar la tabla automáticamente', async ({ page }) => {
        // 1.b: Crear recursos
        const ciudadUnica = "TestCity_" + Math.floor(Math.random() * 9999);

        await page.getByPlaceholder('País').fill('España');
        await page.getByPlaceholder('Año').fill('2026');
        await page.getByPlaceholder('Ciudad').fill(ciudadUnica);
        await page.getByPlaceholder('Coste USD/m2').fill('1200');
        await page.getByPlaceholder('Rango cambio (ej: 5%)').fill('2%');
        await page.getByPlaceholder('Ranking').fill('5');

        await page.getByRole('button', { name: 'Añadir Registro' }).click();

        // Verificamos mensaje (No técnico)
        await expect(page.getByText('¡Recurso creado con éxito!')).toBeVisible();

        // REQUISITO: Ver que aparece en la tabla sin recargar manualmente
        await expect(page.locator('table')).toContainText(ciudadUnica);
    });

    test('4. Edición en vista separada dinámica (L08)', async ({ page }) => {
        // 1. Ir a la página principal y asegurar que hay datos
        await page.goto(URL_APP);
        await page.getByRole('button', { name: 'carga datos iniciales' }).click();

        // 2. Click en el primer botón "Editar" de la tabla
        const primeraFila = page.locator('table tbody tr').first();
        await primeraFila.getByRole('button', { name: 'Editar' }).click();

        // 3. Comprobar que la URL es dinámica y entramos en la edición
        // Tu código usa: /international-construction-costs/[country]/[year]/[city]
        await expect(page).toHaveURL(/.*\/international-construction-costs\/.+\/.+\/.+/);
        await expect(page.locator('h2')).toContainText('Editando registro');

        // 4. Modificar el valor de "Coste USD por m²"
        // Tu label es: "Coste USD por m²:"
        const inputCoste = page.getByLabel('Coste USD por m²:');
        await inputCoste.fill('9999');

        // 5. Modificar el "Ranking"
        await page.getByLabel('Ranking:').fill('1');

        // 6. Click en "Guardar Cambios"
        await page.getByRole('button', { name: 'Guardar Cambios' }).click();

        // 7. VERIFICACIÓN REQUISITO: Mensaje comprensible para el usuario
        await expect(page.getByText('Los cambios se han guardado correctamente.')).toBeVisible();

        // 8. Volver al listado usando el botón de la vista
        await page.getByRole('button', { name: 'Volver al listado' }).click();

        // 9. VERIFICACIÓN REQUISITO: Recarga automática (el valor 9999 debe estar en la tabla)
        await expect(page.locator('table')).toContainText('9999');
        console.log("✓ Edición dinámica y persistencia comprobadas correctamente");
    });

test('3. Búsqueda por rango de años', async ({ page }) => {
    await page.getByRole('button', { name: 'Abrir Buscador' }).click();

    // Buscamos específicamente los inputs que están debajo de los labels "Desde" y "Hasta"
    await page.locator('label', { hasText: 'Desde:' }).locator('input').fill('2024');
    await page.locator('label', { hasText: 'Hasta:' }).locator('input').fill('2024');
    
    await page.getByRole('button', { name: 'Filtrar ahora' }).click();

    // Esperamos a que el mensaje de "Búsqueda finalizada" aparezca 
    // Esto asegura que la tabla ya se ha actualizado antes de mirar los datos
    await expect(page.getByText(/Búsqueda finalizada/i)).toBeVisible();

    const celdasAño = page.locator('table tbody tr td:nth-child(2)');
    const textos = await celdasAño.allTextContents();
    
    for (const t of textos) {
        expect(t.trim()).toBe('2024');
    }
});

  test('5. Debe borrar un recurso concreto', async ({ page }) => {
    page.on('dialog', dialog => dialog.accept());

    // 1. Cargamos datos para tener algo que borrar
    await page.getByRole('button', { name: 'carga datos iniciales' }).click();
    await expect(page.locator('table tbody tr').first()).toBeVisible();

    // 2. Contamos cuántas filas hay ANTES de borrar
    const filasAntes = await page.locator('table tbody tr').count();
    console.log(`Filas antes de borrar: ${filasAntes}`);

    // 3. Borramos la primera fila
    await page.locator('table tbody tr').first().getByRole('button', { name: 'Borrar' }).click();

    // 4. VERIFICACIÓN: Esperamos a que el número de filas sea exactamente uno menos
    // Esto demuestra que se ha borrado y que la tabla se ha actualizado sola
    await expect(page.locator('table tbody tr')).toHaveCount(filasAntes - 1);
    
    console.log("✓ Recurso borrado correctamente (la tabla tiene una fila menos)");
});

    test('Debe borrar toda la base de datos', async ({ page }) => {
        // 1.b: Borrar todos los recursos
        page.on('dialog', dialog => dialog.accept());
        
        await page.getByRole('button', { name: 'Limpiar Base de Datos Completa' }).click();

        // Verificamos que la tabla no tenga filas de datos
        await expect(page.locator('table tbody tr')).toHaveCount(0);
    });
});