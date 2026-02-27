const datosIsaac = [
  { year: 2024, country: "USA", city: "New York", cost_usd_per_m2: 5723, cost_change_range: "5%", rank: 1 },
  { year: 2024, country: "Canada", city: "Toronto", cost_usd_per_m2: 2973, cost_change_range: "5.01%", rank: 24 },
  { year: 2024, country: "uk", city: "London", cost_usd_per_m2: 4473, cost_change_range: "15%", rank: 5 },
  { year: 2024, country: "Spain", city: "Madrid", cost_usd_per_m2: 2205, cost_change_range: "2.13%", rank: 48 },
  { year: 2023, country: "Canada", city: "Vancouver", cost_usd_per_m2: 2870, cost_change_range: "7%", rank: 30 },
  { year: 2023, country: "Italy", city: "Milan", cost_usd_per_m2: 2689, cost_change_range: "-9.31%", rank: 46 },
  { year: 2023, country: "Ireland", city: "Dublin", cost_usd_per_m2: 3708, cost_change_range: "-1.75%", rank: 19 },
  { year: 2023, country: "Germany", city: "Munich", cost_usd_per_m2: 3787, cost_change_range: "17.65%", rank: 17 },
  { year: 2022, country: "Poland", city: "Wasaw", cost_usd_per_m2: 1667, cost_change_range: "30.16%", rank: 59 },
  { year: 2023, country: "USA", city: "New York", cost_usd_per_m2: 5451, cost_change_range: "5%", rank: 4 },
  { year: 2023, country: "Canada", city: "Toronto", cost_usd_per_m2: 2834, cost_change_range: "5%", rank: 26 }
];

const pais = "Canada";

// 1. Filtramos los datos para tenerlos listos
const filtrados = datosIsaac.filter(d => d.country === pais);

// 2. Creamos la lista de ciudades (solo si no están ya en el array)
const listaCiudades = [];
filtrados.forEach(d => {
    if (!listaCiudades.includes(d.city)) {
        listaCiudades.push(d.city);
    }
});

// 3. Tu cálculo de la media (tal cual lo tenías)
const mediaCostoM2 = filtrados.reduce((acum, valor) => acum + valor.cost_usd_per_m2, 0) / filtrados.length;

// 4. Resultado
console.log(`Media del costo m2 en ${pais} tomando las ciudades ${listaCiudades.join(", ")}: ${mediaCostoM2.toFixed(2)} USD`);


// ... al final de index-irg.js
module.exports = { datosIsaac };