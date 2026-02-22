/**
 * Entrega F03 - Aplicación Node.js
 * Alumna: Maria Jesús (MJP)
 */

// 1. Inicialización del array con los 10 datos de la ficha de trabajo
const wagesData = [
    { year: 2024, country: "canada", avg_monthly_nc: 6926.7, avg_monthly_usd: 5056.8, currency: "CAD" },
    { year: 2023, country: "canada", avg_monthly_nc: 6750.4, avg_monthly_usd: 5001.8, currency: "CAD" },
    { year: 2022, country: "canada", avg_monthly_nc: 6513.1, avg_monthly_usd: 5004.2, currency: "CAD" },
    { year: 2023, country: "usa", avg_monthly_nc: 6678.3, avg_monthly_usd: 6678.3, currency: "USD" },
    { year: 2024, country: "uk", avg_monthly_nc: 3733.8, avg_monthly_usd: 4771.6, currency: "GBP" },
    { year: 2022, country: "spain", avg_monthly_nc: 2531.6, avg_monthly_usd: 2662.2, currency: "EUR" },
    { year: 2023, country: "ireland", avg_monthly_nc: 4496.2, avg_monthly_usd: 4862.3, currency: "EUR" },
    { year: 2023, country: "poland", avg_monthly_nc: 6873.8, avg_monthly_usd: 1636.4, currency: "PLN" },
    { year: 2023, country: "italy", avg_monthly_nc: 2704.2, avg_monthly_usd: 2924.4, currency: "EUR" },
    { year: 2022, country: "germany", avg_monthly_nc: 3790.4, avg_monthly_usd: 3986.0, currency: "EUR" }
];

// 2. Algoritmo usando iteradores para calcular la media de Canada
const targetCountry = "canada";

// Filtramos el subconjunto de filas de Canada usando .filter()
const canadaRows = wagesData.filter((row) => {
    return row.country === targetCountry;
});

// Sumamos los valores de 'avg_monthly_usd' usando .forEach()
let totalUsd = 0;
canadaRows.forEach((row) => {
    totalUsd += row.avg_monthly_usd;
});

// Calculamos la media final
const averageUsd = totalUsd / canadaRows.length;

// 3. Resultado por consola
console.log("---------------------------------------------------------");
console.log(`Análisis de datos para el país: ${targetCountry.toUpperCase()}`);
console.log(`Registros encontrados: ${canadaRows.length}`);
console.log(`La media del salario mensual en USD es: ${averageUsd.toFixed(2)}`);
console.log("---------------------------------------------------------");