
//Declaración de los datos
const datos = [
  { year: 2024, country: "Canada", recreation_exp: 127727000000, total_exp: 1654821000000, percentage: 7.72, population: 41288599, per_capita: 3093.52 },
  { year: 2023, country: "Canada", recreation_exp: 124522000000, total_exp: 1572103000000, percentage: 7.92, population: 40083484, per_capita: 3106.57 },
  { year: 2022, country: "Canada", recreation_exp: 118767000000, total_exp: 1488875000000, percentage: 7.98, population: 38935934, per_capita: 3050.32 },
  { year: 2022, country: "Germany", recreation_exp: 187327000000, total_exp: 2017981000000, percentage: 9.28, population: 83177813, per_capita: 2252.13 },
  { year: 2023, country: "Ireland", recreation_exp: 9931000000, total_exp: 140665460000, percentage: 7.06, population: 5311538, per_capita: 1869.70 },
  { year: 2022, country: "Ireland", recreation_exp: 8954000000, total_exp: 124192688000, percentage: 7.21, population: 5212836, per_capita: 1717.68 },
  { year: 2023, country: "Italy", recreation_exp: 85658000000, total_exp: 1218946100000, percentage: 7.03, population: 58984216, per_capita: 1452.22 },
  { year: 2022, country: "Italy", recreation_exp: 79846000000, total_exp: 1156909900000, percentage: 6.90, population: 59013667, per_capita: 1353.01 },
  { year: 2023, country: "Poland", recreation_exp: 118473000000, total_exp: 1934063000000, percentage: 6.13, population: 36687353, per_capita: 3229.26 },
  { year: 2022, country: "Poland", recreation_exp: 101603000000, total_exp: 1772069000000, percentage: 5.73, population: 36821749, per_capita: 2759.32 },
  { year: 2022, country: "Spain", recreation_exp: 63671000000, total_exp: 759001000000, percentage: 8.39, population: 47786102, per_capita: 1332.42 },
  { year: 2024, country: "United Kingdom", recreation_exp: 158522000000, total_exp: 1706364000000, percentage: 9.29, population: 69226000, per_capita: 2289.92 },
  { year: 2023, country: "United Kingdom", recreation_exp: 151870000000, total_exp: 1646716000000, percentage: 9.22, population: 68492000, per_capita: 2217.34 },
  { year: 2022, country: "United Kingdom", recreation_exp: 149789000000, total_exp: 1534744000000, percentage: 9.76, population: 67604000, per_capita: 2215.68 },
  { year: 2023, country: "United States", recreation_exp: 1797911000000, total_exp: 18268702000000, percentage: 9.84, population: 336806231, per_capita: 5338.12 }
];

//Elegimos el valor geográfico
const countryTarget= "Canada";

//Filtramos
const fitrados = datos.filter(d => d.country == countryTarget);

//Calculamos la media
const mediaConsumoPaisPorHogar= fitrados.map( d => d.per_capita)
        .reduce((acum, valor) => acum + valor, 0) / fitrados.length;

//Mostramos el resultado
//console.log(`Media del gasto por hogar en ocio en ${countryTarget}: ${mediaConsumoPaisPorHogar.toFixed(2)}`)

//Exporta datos
module.exports = {datos};