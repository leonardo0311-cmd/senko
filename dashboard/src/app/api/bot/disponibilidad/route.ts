import { malaPeticion, ok, verificarClaveBot } from "@/lib/bot";
import { huecosLibres } from "@/lib/disponibilidad";
import { obtenerServicio } from "@/lib/repo/servicios";
import { listarProfesionales, obtenerUsuario, serviciosDeProfesional } from "@/lib/repo/usuarios";

/**
 * GET /api/bot/disponibilidad?servicioId=...&fecha=2026-10-27[&profesionalId=...][&dias=7]
 *
 * Huecos libres. Sin `profesionalId` devuelve los de todos los profesionales
 * que atienden ese servicio. Con `dias` barre varios dias seguidos desde
 * `fecha`, para que el bot pueda ofrecer "el primero que haya".
 */
export async function GET(request: Request) {
  const rechazo = verificarClaveBot(request);
  if (rechazo) return rechazo;

  const url = new URL(request.url);
  const servicioId = url.searchParams.get("servicioId");
  const fecha = url.searchParams.get("fecha");
  const profesionalId = url.searchParams.get("profesionalId");
  const dias = Math.min(Math.max(Number(url.searchParams.get("dias") ?? "1") || 1, 1), 31);

  if (!servicioId) return malaPeticion("Falta el parámetro servicioId.");
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return malaPeticion("Falta el parámetro fecha en formato AAAA-MM-DD.");
  }

  const servicio = obtenerServicio(servicioId);
  if (!servicio) return malaPeticion("Ese servicio no existe.", 404);
  if (!servicio.activo) return malaPeticion("Ese servicio está desactivado.", 409);

  let profesionales = listarProfesionales().filter((p) =>
    serviciosDeProfesional(p.id).includes(servicioId),
  );

  if (profesionalId) {
    const elegido = obtenerUsuario(profesionalId);
    if (!elegido || elegido.rol !== "profesional") {
      return malaPeticion("Ese profesional no existe.", 404);
    }
    if (!elegido.activo) return malaPeticion("Ese profesional está desactivado.", 409);
    profesionales = profesionales.filter((p) => p.id === profesionalId);
    if (profesionales.length === 0) {
      return malaPeticion("Ese profesional no atiende ese servicio.", 409);
    }
  }

  const base = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(base.getTime())) return malaPeticion("La fecha no es válida.");

  const resultado = profesionales.map((p) => {
    const porDia: Array<{ fecha: string; huecos: Array<{ inicio: string; fin: string }> }> = [];
    for (let i = 0; i < dias; i += 1) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      const clave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate(),
      ).padStart(2, "0")}`;
      porDia.push({
        fecha: clave,
        huecos: huecosLibres({
          profesionalId: p.id,
          fecha: clave,
          duracionMin: servicio.duracionMin,
        }),
      });
    }
    return { profesional: { id: p.id, nombre: p.nombre }, dias: porDia };
  });

  const primero = resultado
    .flatMap((r) =>
      r.dias.flatMap((d) =>
        d.huecos.map((h) => ({ profesionalId: r.profesional.id, ...h })),
      ),
    )
    .sort((a, b) => a.inicio.localeCompare(b.inicio))[0] ?? null;

  return ok({
    servicio: {
      id: servicio.id,
      nombre: servicio.nombre,
      duracion_min: servicio.duracionMin,
    },
    primer_hueco: primero,
    disponibilidad: resultado,
  });
}
