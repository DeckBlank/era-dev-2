import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ubigeoProvincia = [
  { ubigeo: "010000", nombre: "AMAZONAS" },
  { ubigeo: "020000", nombre: "ÁNCASH" },
  { ubigeo: "030000", nombre: "APURÍMAC" },
  { ubigeo: "040000", nombre: "AREQUIPA" },
  { ubigeo: "050000", nombre: "AYACUCHO" },
  { ubigeo: "060000", nombre: "CAJAMARCA" },
  { ubigeo: "240000", nombre: "CALLAO" },
  { ubigeo: "070000", nombre: "CUSCO" },
  { ubigeo: "080000", nombre: "HUANCAVELICA" },
  { ubigeo: "090000", nombre: "HUÁNUCO" },
  { ubigeo: "100000", nombre: "ICA" },
  { ubigeo: "110000", nombre: "JUNÍN" },
  { ubigeo: "120000", nombre: "LA LIBERTAD" },
  { ubigeo: "130000", nombre: "LAMBAYEQUE" },
  { ubigeo: "140000", nombre: "LIMA" },
  { ubigeo: "150000", nombre: "LORETO" },
  { ubigeo: "160000", nombre: "MADRE DE DIOS" },
  { ubigeo: "170000", nombre: "MOQUEGUA" },
  { ubigeo: "180000", nombre: "PASCO" },
  { ubigeo: "190000", nombre: "PIURA" },
  { ubigeo: "200000", nombre: "PUNO" },
  { ubigeo: "210000", nombre: "SAN MARTÍN" },
  { ubigeo: "220000", nombre: "TACNA" },
  { ubigeo: "230000", nombre: "TUMBES" },
  { ubigeo: "250000", nombre: "UCAYALI" },
];

const HEADERS = {
  accept: "*/*",
  "accept-language": "en-US,en;q=0.9,es;q=0.8",
  "content-type": "application/json",
  priority: "u=1, i",
  referer: "https://resultadoelectoral.onpe.gob.pe/main/actas",
  "sec-ch-ua": '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
};

async function fetchRegion(ubigeo, nombre) {
  const ubigeoNivel01 = parseInt(ubigeo, 10); // "010000" → 10000
  const url = `https://resultadoelectoral.onpe.gob.pe/presentacion-backend/resumen-general/elecciones?activo=1&idProceso=2&ubigeoNivel01=${ubigeoNivel01}&tipoFiltro=ubigeo_nivel_01&idAmbitoGeografico=1`;

  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} para ${nombre}`);

  const json = await res.json();
  if (!json.success) throw new Error(`API error para ${nombre}: ${json.message}`);

  const presidencial = json.data.find((d) => d.nombre === "Presidencial");
  if (!presidencial) throw new Error(`No se encontró "Presidencial" para ${nombre}`);

  return {
    ubigeo,
    nombre,
    actasContabilizadas: presidencial.actasContabilizadas,
    porcentajeActasContabilizadas: presidencial.porcentajeActasContabilizadas,
    actasPendientes: presidencial.actasPendientes,
    porcentajeActasPendientes: presidencial.porcentajeActasPendientes,
  };
}

async function main() {
  const resultados = [];
  const errores = [];

  for (const region of ubigeoProvincia) {
    process.stdout.write(`Consultando ${region.nombre.padEnd(20)} ... `);
    try {
      const dato = await fetchRegion(region.ubigeo, region.nombre);
      resultados.push(dato);
      console.log(
        `OK  (${dato.porcentajeActasContabilizadas}% contabilizadas)`
      );
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      errores.push({ nombre: region.nombre, error: err.message });
    }

    // Pequeña pausa para no saturar la API
    await new Promise((r) => setTimeout(r, 300));
  }

  // Ordenar de mayor a menor % contabilizado
  resultados.sort(
    (a, b) => b.porcentajeActasContabilizadas - a.porcentajeActasContabilizadas
  );

  const output = {
    generadoEn: new Date().toISOString(),
    totalRegiones: resultados.length,
    errores,
    resultados,
  };

  writeFileSync(join(__dirname, "porcentajesPresidencialesPorRegion.json"), JSON.stringify(output, null, 2), "utf-8");
  console.log(`\nArchivo guardado: porcentajesPresidencialesPorRegion.json (${resultados.length} regiones)`);

  if (errores.length > 0) {
    console.log(`Errores (${errores.length}):`, errores);
  }
}

main().catch(console.error);
