/**
 * Importar citas desde Excel exportado como CSV/TSV
 *
 * Pasos:
 *  1. En Excel: Archivo → Guardar como → "Texto (delimitado por tabulaciones)" (.txt)
 *     o "CSV UTF-8" (.csv). Guarda el archivo como scripts/citas.csv
 *  2. Ejecutar en modo prueba (DRY_RUN = true):
 *       npx tsx scripts/importar-citas.ts
 *  3. Revisar el resumen. Si todo es correcto, cambiar DRY_RUN = false y volver a ejecutar.
 *
 * Columnas esperadas (en cualquier orden):
 *   Cliente | Miembro del equipo | Estado | Fecha programada |
 *   Fecha de cancelación | Categoría | Servicio | Duración (min) | Franja horaria cita
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ── Config ─────────────────────────────────────────────────────────────────────
const DRY_RUN        = false;  // ← cambiar a false para insertar de verdad
const CSV_FILE       = path.join(process.cwd(), "scripts", "citas.txt");
const CLIENTES_FILE  = path.join(process.cwd(), "scripts", "clientes.txt"); // opcional
// ───────────────────────────────────────────────────────────────────────────────

// Cargar .env.local
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const eq = line.indexOf("=");
    if (eq > 0) {
      const k = line.slice(0, eq).trim();
      const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (k && !process.env[k]) process.env[k] = v;
    }
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseFecha(raw: string): string | null {
  // Acepta DD/MM/YY HH:MM:SS  o  DD/MM/YYYY HH:MM:SS
  const m = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const year = y.length === 2 ? `20${y}` : y;
  return `${year}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function parseHoras(franja: string): { inicio: string; fin: string } | null {
  // Acepta "11:00:00-11:45:00" o "11:00-11:45"
  const m = franja.trim().match(/^(\d{1,2}:\d{2}(?::\d{2})?)-(\d{1,2}:\d{2}(?::\d{2})?)$/);
  if (!m) return null;
  const pad = (t: string) => t.length === 5 ? `${t}:00` : t;
  return { inicio: pad(m[1]), fin: pad(m[2]) };
}

function estadoDB(raw: string): "pendiente" | "confirmada" | "completada" | null {
  const s = raw.trim().toLowerCase();
  if (s.includes("cancel")) return null; // saltar
  if (s === "new" || s === "nueva" || s === "pendiente") return "pendiente";
  if (s.includes("confirm")) return "confirmada";
  if (s.includes("complet") || s.includes("no-show") || s.includes("noshow")) return "completada";
  return "pendiente"; // fallback
}

function leerArchivo(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  // UTF-8 BOM (EF BB BF)
  if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
    return buf.slice(3).toString("utf-8");
  }
  // Si decodifica sin caracteres de reemplazo (U+FFFD) es UTF-8 válido
  const intento = buf.toString("utf-8");
  if (!intento.includes("�")) return intento;
  // Si no, es Windows-1252 (encoding por defecto de Excel en Windows)
  return buf.toString("latin1");
}

function detectSep(line: string): string {
  if ((line.match(/\t/g) ?? []).length >= 4) return "\t";
  if ((line.match(/;/g) ?? []).length >= 4) return ";";
  return ",";
}

function limpiarTelefono(raw: string): string {
  // "34 654 97 39 77" → "+34654973977"  /  "654 97 39 77" → "654973977"
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("34") && digits.length === 11) return `+${digits}`;
  return digits;
}

function cargarClientesExcel(): Map<string, { telefono: string; email: string }> {
  const mapa = new Map<string, { telefono: string; email: string }>();
  if (!fs.existsSync(CLIENTES_FILE)) return mapa;

  const lines = leerArchivo(CLIENTES_FILE)
    .replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(l => l.trim());
  if (lines.length < 2) return mapa;

  const sep = detectSep(lines[0]);
  const headers = lines[0].split(sep).map(h => h.trim().toLowerCase());
  const idx = (name: string) => headers.findIndex(h => h.includes(name.toLowerCase()));

  const iNombre   = idx("nombre completo");
  const iMovil    = idx("móvil");
  const iTelefono = idx("teléfono");
  const iEmail    = idx("email");

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(sep).map(c => c.trim().replace(/^["']|["']$/g, ""));
    const nombre = (iNombre >= 0 ? row[iNombre] : "").trim();
    if (!nombre) continue;
    const telRaw = (iMovil >= 0 && row[iMovil]) ? row[iMovil] : (iTelefono >= 0 ? row[iTelefono] : "");
    const tel    = telRaw ? limpiarTelefono(telRaw) : "";
    const email  = iEmail >= 0 ? row[iEmail] ?? "" : "";
    mapa.set(nombre.toLowerCase(), { telefono: tel, email });
  }

  console.log(`📇 Clientes cargados del Excel: ${mapa.size}`);
  return mapa;
}

// ── Cargar catálogos ───────────────────────────────────────────────────────────

async function cargarCatalogos() {
  const [{ data: profs }, { data: servs }, { data: clientes }] = await Promise.all([
    supabase.from("profesionales").select("id, nombre"),
    supabase.from("servicios").select("id, nombre"),
    supabase.from("clientes").select("id, nombre"),
  ]);
  return {
    profesionales: (profs ?? []) as { id: string; nombre: string }[],
    servicios: (servs ?? []) as { id: string; nombre: string }[],
    clientes: (clientes ?? []) as { id: string; nombre: string }[],
  };
}

function buscarProfesional(nombre: string, lista: { id: string; nombre: string }[]) {
  const n = nombre.trim().toLowerCase();
  // Primero exacto, luego por nombre (primera palabra)
  return (
    lista.find(p => p.nombre.toLowerCase() === n) ??
    lista.find(p => n.startsWith(p.nombre.toLowerCase().split(" ")[0])) ??
    lista.find(p => p.nombre.toLowerCase().split(" ")[0] === n.split(" ")[0])
  );
}

function normalizar(s: string) {
  return s.toLowerCase().trim()
    .replace(/\s*\/\s*/g, "/")   // espacios alrededor de /
    .replace(/\s*-\s*/g, "-")    // espacios alrededor de -
    .replace(/\s+/g, " ");       // espacios múltiples
}

function buscarServicio(nombre: string, lista: { id: string; nombre: string }[]) {
  const n = normalizar(nombre);
  return lista.find(s => normalizar(s.nombre) === n);
}

function buscarCliente(nombre: string, lista: { id: string; nombre: string }[]) {
  const n = nombre.trim().toLowerCase();
  return lista.find(c => c.nombre.toLowerCase() === n);
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(CSV_FILE)) {
    console.error(`❌ No se encontró el archivo: ${CSV_FILE}`);
    console.error("   Guarda tu Excel como scripts/citas.csv y vuelve a ejecutar.");
    process.exit(1);
  }

  const raw = leerArchivo(CSV_FILE).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = raw.split("\n").filter(l => l.trim());
  if (lines.length < 2) { console.error("El archivo está vacío o solo tiene cabecera."); process.exit(1); }

  const sep = detectSep(lines[0]);
  const headers = lines[0].split(sep).map(h => h.trim().replace(/^["']|["']$/g, "").toLowerCase());

  const col = (row: string[], name: string) => {
    const i = headers.findIndex(h => h.includes(name.toLowerCase()));
    return i >= 0 ? (row[i] ?? "").trim().replace(/^["']|["']$/g, "") : "";
  };

  console.log(`\n📂 Archivo: ${CSV_FILE}`);
  console.log(`📋 Columnas detectadas: ${headers.join(" | ")}`);
  console.log(`📊 Filas (sin cabecera): ${lines.length - 1}\n`);

  const cat = await cargarCatalogos();
  const clientesExcel = cargarClientesExcel();
  // Cache de clientes para no hacer inserts duplicados en el mismo lote
  const clienteCache = new Map(cat.clientes.map(c => [c.nombre.toLowerCase(), c.id]));

  let ok = 0, saltadas = 0, errores = 0;
  const noEncontrados = { profesionales: new Set<string>(), servicios: new Set<string>() };

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(sep).map(c => c.trim().replace(/^["']|["']$/g, ""));

    const clienteNombre   = col(row, "cliente");
    const profNombre      = col(row, "miembro");
    const estadoRaw       = col(row, "estado");
    const fechaRaw        = col(row, "fecha programada");
    const fechaCancel     = col(row, "cancelaci");
    const servicioNombre  = col(row, "servicio");
    const franjaRaw       = col(row, "franja");

    // Saltar canceladas
    if (fechaCancel || estadoDB(estadoRaw) === null) {
      saltadas++;
      continue;
    }

    const fecha = parseFecha(fechaRaw);
    const horas = parseHoras(franjaRaw);
    const estado = estadoDB(estadoRaw) ?? "pendiente";

    if (!fecha || !horas) {
      console.warn(`⚠️  Fila ${i + 1}: fecha/hora no parseable ("${fechaRaw}" / "${franjaRaw}") — saltando`);
      saltadas++;
      continue;
    }

    const prof    = buscarProfesional(profNombre, cat.profesionales);
    const servicio = buscarServicio(servicioNombre, cat.servicios);

    if (!prof) { noEncontrados.profesionales.add(profNombre); errores++; continue; }
    if (!servicio) { noEncontrados.servicios.add(servicioNombre); errores++; continue; }

    // Cruzar con Excel de clientes para obtener teléfono y email
    const datosCliente = clientesExcel.get(clienteNombre.toLowerCase());
    const telefono = datosCliente?.telefono ?? null;
    const email    = datosCliente?.email    || null;

    // Buscar o crear cliente
    let clienteId: string | undefined = clienteCache.get(clienteNombre.toLowerCase());
    if (!clienteId && !DRY_RUN) {
      const { data: nuevo } = await supabase
        .from("clientes")
        .insert({ nombre: clienteNombre, telefono, email })
        .select("id").single();
      if (nuevo?.id) {
        clienteCache.set(clienteNombre.toLowerCase(), nuevo.id);
        clienteId = nuevo.id;
      }
    } else if (!clienteId) {
      clienteId = "(nuevo)";
    }

    if (DRY_RUN) {
      const telLabel = telefono ? ` 📱${telefono}` : "";
      const emailLabel = email ? ` ✉️${email}` : "";
      console.log(`  ✔ ${fecha} ${horas.inicio}–${horas.fin} | ${prof.nombre} | ${servicio.nombre} | ${clienteNombre}${telLabel}${emailLabel} [${estado}]`);
      ok++;
      continue;
    }

    // Insertar reserva
    const { error } = await supabase.from("reservas").insert({
      cliente_id:     clienteId,
      profesional_id: prof.id,
      servicio_id:    servicio.id,
      fecha,
      hora_inicio:    horas.inicio,
      hora_fin:       horas.fin,
      estado,
      notas:          null,
      variante_id:    null,
      pagado:         false,
    });

    if (error) {
      console.error(`  ✗ Fila ${i + 1}: ${error.message}`);
      errores++;
    } else {
      ok++;
    }
  }

  console.log("\n── Resumen ──────────────────────────────────────────────────");
  if (DRY_RUN) console.log("  MODO PRUEBA — no se ha insertado nada");
  console.log(`  ✅ Procesadas: ${ok}`);
  console.log(`  ⏭️  Saltadas (canceladas/sin datos): ${saltadas}`);
  console.log(`  ❌ Con errores: ${errores}`);

  if (noEncontrados.profesionales.size) {
    console.log("\n  ⚠️  Empleadas no encontradas en la BD (revisa el nombre):");
    noEncontrados.profesionales.forEach(n => console.log(`     - "${n}"`));
  }
  if (noEncontrados.servicios.size) {
    console.log("\n  ⚠️  Servicios no encontrados en la BD (revisa el nombre):");
    noEncontrados.servicios.forEach(n => console.log(`     - "${n}"`));
  }

  if (DRY_RUN && ok > 0) {
    console.log("\n  👉 Si el resultado es correcto, cambia DRY_RUN = false y ejecuta de nuevo.");
  }
  console.log("─────────────────────────────────────────────────────────────\n");
}

main().catch(console.error);
