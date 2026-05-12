/**
 * Importar clientes desde el Excel de Fresha exportado como TXT (tabulaciones)
 *
 * Pasos:
 *  1. Asegúrate de que el archivo está en scripts/clientes.txt
 *  2. Ejecutar en modo prueba (DRY_RUN = true):
 *       npx tsx scripts/importar-clientes.ts
 *  3. Revisar el resumen. Si todo es correcto, cambiar DRY_RUN = false y ejecutar de nuevo.
 *
 * Columnas esperadas: Nombre | Apellido | Nombre completo | Número de móvil | Teléfono | Email
 *
 * Lógica de upsert:
 *  - Si ya existe un cliente con ese teléfono → actualiza nombre y email si estaban vacíos
 *  - Si no existe → inserta nuevo cliente
 *  - Filas sin nombre → se saltan
 *  - Teléfonos duplicados dentro del archivo → solo se procesa el primero
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ── Config ─────────────────────────────────────────────────────────────────────
const DRY_RUN   = false;  // cambiar a false para insertar/actualizar de verdad
const ARCHIVO   = path.join(process.cwd(), "scripts", "clientes.txt");
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

function leerArchivo(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) return buf.slice(3).toString("utf-8");
  const intento = buf.toString("utf-8");
  if (!intento.includes("�")) return intento;
  return buf.toString("latin1");
}

function detectSep(line: string): string {
  if ((line.match(/\t/g) ?? []).length >= 3) return "\t";
  if ((line.match(/;/g) ?? []).length >= 3) return ";";
  return ",";
}

function limpiarTelefono(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("34") && digits.length === 11) return `+${digits}`;
  if (digits.length >= 9) return digits;
  return "";
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(ARCHIVO)) {
    console.error(`❌ No se encontró: ${ARCHIVO}`);
    process.exit(1);
  }

  const lines = leerArchivo(ARCHIVO)
    .replace(/\r\n/g, "\n").replace(/\r/g, "\n")
    .split("\n").filter(l => l.trim());

  if (lines.length < 2) { console.error("Archivo vacío o solo cabecera."); process.exit(1); }

  const sep = detectSep(lines[0]);
  const headers = lines[0].split(sep).map(h => h.trim().toLowerCase());
  const idx = (name: string) => headers.findIndex(h => h.includes(name.toLowerCase()));

  const iNombreCompleto = idx("nombre completo");
  const iNombre         = idx("nombre");
  const iApellido       = idx("apellido");
  const iMovil          = idx("móvil") >= 0 ? idx("móvil") : idx("movil");
  const iTelefono       = idx("teléfono") >= 0 ? idx("teléfono") : idx("telefono");
  const iEmail          = idx("email");

  console.log(`\n📂 Archivo: ${ARCHIVO}`);
  console.log(`📋 Columnas: ${headers.join(" | ")}`);
  console.log(`📊 Filas (sin cabecera): ${lines.length - 1}\n`);

  // Cargar clientes existentes en Supabase indexados por teléfono normalizado
  const { data: existentes } = await supabase.from("clientes").select("id, nombre, telefono, email");
  const porTelefono = new Map<string, { id: string; nombre: string; email: string | null }>();
  for (const c of existentes ?? []) {
    if (c.telefono) {
      const tel = limpiarTelefono(c.telefono);
      if (tel) porTelefono.set(tel, { id: c.id, nombre: c.nombre, email: c.email });
    }
  }
  console.log(`👥 Clientes ya en la BD: ${existentes?.length ?? 0}\n`);

  let insertados = 0, actualizados = 0, saltados = 0;
  const telefonosVistos = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(sep).map(c => c.trim().replace(/^["']|["']$/g, ""));

    // Nombre: preferir "Nombre completo", si está vacío combinar Nombre + Apellido
    let nombre = iNombreCompleto >= 0 ? (row[iNombreCompleto] ?? "").trim() : "";
    if (!nombre) {
      const n = iNombre >= 0 ? (row[iNombre] ?? "").trim() : "";
      const a = iApellido >= 0 ? (row[iApellido] ?? "").trim() : "";
      nombre = [n, a].filter(Boolean).join(" ");
    }
    if (!nombre) { saltados++; continue; }

    // Teléfono: móvil primero, luego teléfono fijo
    const telRaw = (iMovil >= 0 && row[iMovil]) ? row[iMovil] : (iTelefono >= 0 ? (row[iTelefono] ?? "") : "");
    const telefono = limpiarTelefono(telRaw) || null;

    const email = (iEmail >= 0 ? (row[iEmail] ?? "").trim() : "") || null;

    // Saltar duplicados dentro del propio archivo
    if (telefono) {
      if (telefonosVistos.has(telefono)) { saltados++; continue; }
      telefonosVistos.add(telefono);
    }

    const existente = telefono ? porTelefono.get(telefono) : undefined;

    if (existente) {
      // Ya existe: actualizar nombre completo y email si estaban vacíos
      const nuevoNombre = existente.nombre.length < nombre.length ? nombre : existente.nombre;
      const nuevoEmail  = existente.email ?? email;
      const cambios = nuevoNombre !== existente.nombre || nuevoEmail !== existente.email;

      if (DRY_RUN) {
        if (cambios) {
          console.log(`  ✏️  ACTUALIZAR: ${existente.nombre} → ${nuevoNombre}${nuevoEmail ? ` ✉️${nuevoEmail}` : ""}`);
        }
        actualizados++;
        continue;
      }

      if (cambios) {
        await supabase.from("clientes")
          .update({ nombre: nuevoNombre, ...(nuevoEmail ? { email: nuevoEmail } : {}) })
          .eq("id", existente.id);
      }
      actualizados++;
    } else {
      // Nuevo cliente
      if (DRY_RUN) {
        console.log(`  ➕ INSERTAR: ${nombre}${telefono ? ` 📱${telefono}` : ""}${email ? ` ✉️${email}` : ""}`);
        insertados++;
        continue;
      }

      const { error } = await supabase.from("clientes").insert({ nombre, telefono, email });
      if (error) {
        console.error(`  ✗ Error insertando "${nombre}": ${error.message}`);
      } else {
        insertados++;
      }
    }
  }

  console.log("\n── Resumen ──────────────────────────────────────────────────");
  if (DRY_RUN) console.log("  MODO PRUEBA — no se ha modificado nada");
  console.log(`  ➕ A insertar (nuevos):     ${insertados}`);
  console.log(`  ✏️  A actualizar (existentes): ${actualizados}`);
  console.log(`  ⏭️  Saltados (sin nombre/dup): ${saltados}`);
  if (DRY_RUN && (insertados > 0 || actualizados > 0)) {
    console.log("\n  👉 Si el resultado es correcto, cambia DRY_RUN = false y ejecuta de nuevo.");
  }
  console.log("─────────────────────────────────────────────────────────────\n");
}

main().catch(console.error);
