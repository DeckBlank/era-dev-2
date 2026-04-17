import { writeFileSync, existsSync, readdirSync, mkdirSync, copyFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { exit } from "process";
import dotenv from "dotenv";
dotenv.config();

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

const ubigeoExtranjero = [
  { ubigeo: "910000", nombre: "ÁFRICA" },
  { ubigeo: "920000", nombre: "AMÉRICA" },
  { ubigeo: "930000", nombre: "ASIA" },
  { ubigeo: "940000", nombre: "EUROPA" },
  { ubigeo: "950000", nombre: "OCEANÍA" },
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
    ...presidencial,
    ubigeo,
    nombre,
  };
}

async function fetchExtranjeroRegion(ubigeo, nombre) {
  const idUbigeoDepartamento = parseInt(ubigeo, 10);
  const url = `https://resultadoelectoral.onpe.gob.pe/presentacion-backend/resumen-general/totales?idEleccion=10&tipoFiltro=ubigeo_nivel_01&idAmbitoGeografico=2&idUbigeoDepartamento=${idUbigeoDepartamento}`;

  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} para Extranjero/${nombre}`);

  const json = await res.json();
  if (!json.success) throw new Error(`API error Extranjero/${nombre}: ${json.message}`);

  const d = json.data;
  return {
    ubigeo,
    nombre,
    actasContabilizadas: d.contabilizadas,
    totalActas: d.totalActas,
    porcentajeActasContabilizadas: d.actasContabilizadas, // ya es porcentaje
    actasPendientes: d.pendientesJee,
    porcentajeActasPendientes: d.actasPendientesJee,
    totalVotosEmitidos: d.totalVotosEmitidos,
    totalVotosValidos: d.totalVotosValidos,
    participacionCiudadana: d.participacionCiudadana,
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
  async function fetchNacional() {
    const urlTotales = 'https://resultadoelectoral.onpe.gob.pe/presentacion-backend/resumen-general/totales?idEleccion=10&tipoFiltro=eleccion';
    const urlParticipantes = 'https://resultadoelectoral.onpe.gob.pe/presentacion-backend/resumen-general/participantes?idEleccion=10&tipoFiltro=eleccion';

    const [resTotales, resParticipantes] = await Promise.all([
      fetch(urlTotales, { headers: HEADERS }),
      fetch(urlParticipantes, { headers: HEADERS })
    ]);

    if (!resTotales.ok || !resParticipantes.ok) {
      throw new Error("Error obteniendo datos nacionales");
    }

    const { data: dataTotales } = await resTotales.json();
    const { data: dataParticipantes } = await resParticipantes.json();

    // Top 4 candidatos por porcentaje de votos validos
    const top4Candidatos = dataParticipantes
      .sort((a, b) => b.porcentajeVotosValidos - a.porcentajeVotosValidos)
      // .slice(0, 4)
      .map(c => ({
        nombreCandidato: c.nombreCandidato,
        porcentajeVotosValidos: c.porcentajeVotosValidos,
        totalVotosValidos: c.totalVotosValidos
      }));

    return {
      // actasContabilizadas: dataTotales.actasContabilizadas, // porcentaje
      ...dataTotales,
      top4Candidatos
    };
  }

  let resumenNacional = null;
  try {
    process.stdout.write(`Consultando Resumen Nacional ... `);
    resumenNacional = await fetchNacional();
    console.log(`OK`);
  } catch (err) {
    console.log(`ERROR: ${err.message}`);
    errores.push({ nombre: "Nacional", error: err.message });
  }

  // Extranjero
  const resultadosExtranjero = [];
  for (const region of ubigeoExtranjero) {
    process.stdout.write(`Consultando Extranjero/${region.nombre.padEnd(10)} ... `);
    try {
      const dato = await fetchExtranjeroRegion(region.ubigeo, region.nombre);
      resultadosExtranjero.push(dato);
      console.log(`OK (${dato.porcentajeActasContabilizadas}% contabilizadas)`);
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      errores.push({ nombre: `Extranjero/${region.nombre}`, error: err.message });
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  // Ordenar de mayor a menor % contabilizado
  resultados.sort(
    (a, b) => b.porcentajeActasContabilizadas - a.porcentajeActasContabilizadas
  );

  const output = {
    generadoEn: new Date().toISOString(),
    resumenNacional,
    totalRegiones: resultados.length,
    errores,
    resultados,
    resultadosExtranjero,
  };

  async function pushToGitHub(jsonData) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) return;

    try {
      const historyDir = join(__dirname, "history");
      let lastPushTime = 0;

      if (existsSync(historyDir)) {
        const files = readdirSync(historyDir).filter((f) => f.endsWith(".json"));
        if (files.length > 0) {
          files.sort().reverse();
          const lastFile = files[0];
          const match = lastFile.match(/porcentajes_(.+)\.json/);
          if (match) {
            const datePart = match[1];
            const parts = datePart.split("T");
            if (parts.length === 2) {
              const timeParts = parts[1].split("-");
              const iso = `${parts[0]}T${timeParts.join(":")}Z`;
              lastPushTime = new Date(iso).getTime();
            }
          }
        }
      }

      const now = new Date(jsonData.generadoEn).getTime();
      const minutesPassed = (now - lastPushTime) / (1000 * 60);

      if (minutesPassed < 5) {
        console.log(`⏱️ Pasaron solo ${minutesPassed.toFixed(1)} min desde el último histórico. Omitiendo push a GitHub para romper el bucle.`);
        return;
      }

      const owner = 'DeckBlank';
      const repo = 'era-dev-2';
      const date = new Date(jsonData.generadoEn);
      // Format as YYYY-MM-DDTHH-mm to avoid colons in filenames
      const dateStr = date.toISOString().replace(/:/g, '-').split('.')[0];
      const path = `src/scripts/history/porcentajes_${dateStr}.json`;

      const content = Buffer.from(JSON.stringify(jsonData, null, 2)).toString('base64');

      console.log(`Subiendo histórico a GitHub: ${path}...`);
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Oog guardar histórico de resultados ${dateStr}`,
          content: content
        })
      });

      if (res.ok) {
        console.log(`Histórico guardado en GitHub exitosamente: ${path}`);
      } else {
        const errJson = await res.json();
        console.error(`Error de GitHub API: ${errJson.message}`);
      }
    } catch (error) {
      console.error(`Excepción al subir a GitHub: ${error.message}`);
    }
  }

  if (process.env.ENV !== "local") {
    console.log(process.env.ENV);

    writeFileSync(join(__dirname, "porcentajesPresidencialesPorRegion.json"), JSON.stringify(output, null, 2), "utf-8");
    console.log(`\nArchivo guardado: porcentajesPresidencialesPorRegion.json (${resultados.length} regiones)`);
    await pushToGitHub(output);
  } else {
    writeFileSync(join(__dirname, "porcentajesPresidencialesPorRegionLocal.json"), JSON.stringify(output, null, 2), "utf-8");
    console.log(`\nArchivo guardado: porcentajesPresidencialesPorRegionLocal.json (${resultados.length} regiones)`);
  }

  // Copy history files to public/history/ for client-side fetch access
  const historyDir = join(__dirname, "history");
  const publicHistoryDir = join(__dirname, "../../public/history");
  mkdirSync(publicHistoryDir, { recursive: true });

  if (existsSync(historyDir)) {
    const histFiles = readdirSync(historyDir).filter(f => f.endsWith(".json"));
    for (const f of histFiles) {
      copyFileSync(join(historyDir, f), join(publicHistoryDir, f));
    }
    console.log(`📁 Copiados ${histFiles.length} archivos históricos a public/history/`);
  }

  if (errores.length > 0) {
    console.log(`Errores (${errores.length}):`, errores);
  }
}


main().catch(console.error);
