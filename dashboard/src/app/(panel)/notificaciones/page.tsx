import Link from "next/link";
import { exigirSesion } from "@/lib/auth";
import { fechaYHora } from "@/lib/fechas";
import { listarNotificaciones, ultimosComentarios } from "@/lib/repo/avisos";
import type { TipoNotificacion } from "@/lib/types";
import Encabezado from "@/components/Encabezado";
import { Boton, Chip, Kpi, Panel, Vacio } from "@/components/ui";
import { accionMarcarLeida, accionMarcarTodas } from "./acciones";

export const metadata = { title: "Avisos · Senko" };

const TIPO: Record<TipoNotificacion, { etiqueta: string; tono: string; icono: string }> = {
  demora: { etiqueta: "Demora", tono: "aviso", icono: "◷" },
  ausencia: { etiqueta: "No vino", tono: "grave", icono: "✕" },
  comentario: { etiqueta: "Comentario", tono: "acento", icono: "✎" },
  sena: { etiqueta: "Seña", tono: "ok", icono: "◈" },
};

export default async function PaginaNotificaciones() {
  const usuario = await exigirSesion();

  const todas = listarNotificaciones(usuario.id, { limite: 100 });
  const sinLeer = todas.filter((n) => !n.leida);
  const comentarios = ultimosComentarios(
    20,
    usuario.rol === "dueno" ? undefined : usuario.id,
  );

  const demoras = sinLeer.filter((n) => n.tipo === "demora").length;

  return (
    <>
      <Encabezado
        titulo="Avisos"
        descripcion={
          usuario.rol === "dueno"
            ? "Lo que te avisan los profesionales desde sus turnos: demoras, ausencias y comentarios."
            : "Tus avisos."
        }
      >
        {sinLeer.length > 0 && (
          <form action={accionMarcarTodas}>
            <Boton variante="secundario">Marcar todo como leído</Boton>
          </form>
        )}
      </Encabezado>

      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi
          etiqueta="Sin leer"
          valor={sinLeer.length}
          tono={sinLeer.length > 0 ? "aviso" : "ok"}
          detalle={sinLeer.length === 0 ? "Estás al día." : "Tocá uno para ir al turno."}
        />
        <Kpi
          etiqueta="Demoras sin leer"
          valor={demoras}
          tono={demoras > 0 ? "grave" : "neutro"}
          detalle="Clientes que avisaron que llegan tarde."
        />
        <Kpi etiqueta="Avisos en total" valor={todas.length} detalle="Últimos 100." />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[1.3fr_1fr]">
        <Panel titulo="Bandeja" sinPadding>
          {todas.length === 0 ? (
            <Vacio>Todavía no hay avisos.</Vacio>
          ) : (
            <ul className="divide-y divide-borde">
              {todas.map((n) => {
                const t = TIPO[n.tipo];
                return (
                  <li
                    key={n.id}
                    className={`px-4 py-3 ${n.leida ? "" : "bg-superficie-2"}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-tinta-1">
                          {!n.leida && (
                            <span
                              aria-label="Sin leer"
                              className="size-1.5 shrink-0 rounded-full bg-acento"
                            />
                          )}
                          <Chip tono={t.tono}>
                            <span aria-hidden>{t.icono}</span> {t.etiqueta}
                          </Chip>
                          {n.titulo}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-tinta-2">{n.cuerpo}</p>
                        <p className="tabular mt-1 text-[0.7rem] text-tinta-3">
                          {n.autorNombre ? `${n.autorNombre} · ` : ""}
                          {fechaYHora(n.creadoEn)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {n.turnoId && (
                          <Link
                            href={`/calendario?semana=0&turno=${n.turnoId}`}
                            className="rounded-lg px-2 py-1 text-xs font-semibold text-tinta-2 hover:bg-superficie-1 hover:text-acento"
                          >
                            Ver turno →
                          </Link>
                        )}
                        {!n.leida && (
                          <form action={accionMarcarLeida}>
                            <input type="hidden" name="notificacionId" value={n.id} />
                            <Boton variante="fantasma">Leído</Boton>
                          </form>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel
          titulo="Últimos comentarios"
          descripcion="Todo lo que se escribió en los turnos, en orden."
          sinPadding
        >
          {comentarios.length === 0 ? (
            <Vacio>Todavía no hay comentarios en los turnos.</Vacio>
          ) : (
            <ul className="max-h-[560px] divide-y divide-borde overflow-y-auto">
              {comentarios.map((c) => (
                <li key={c.id} className="px-4 py-2.5">
                  <p className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-tinta-1">
                    {c.tipo === "demora" && <Chip tono="aviso">◷ demora {c.minutos} min</Chip>}
                    {c.tipo === "ausencia" && <Chip tono="grave">✕ no vino</Chip>}
                    {c.autorNombre}
                  </p>
                  <p className="mt-0.5 text-sm leading-relaxed text-tinta-2">{c.texto}</p>
                  <Link
                    href={`/calendario?semana=0&turno=${c.turnoId}`}
                    className="tabular mt-0.5 inline-block text-[0.7rem] text-tinta-3 underline-offset-2 hover:text-acento hover:underline"
                  >
                    {fechaYHora(c.creadoEn)} · ver turno
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-tinta-3">
        Los avisos quedan acá dentro del panel. El bot de WhatsApp puede además mandártelos al
        teléfono: los lee de{" "}
        <code className="rounded bg-superficie-2 px-1 py-0.5 font-mono">
          GET /api/bot/notificaciones
        </code>{" "}
        y los marca como enviados.
      </p>
    </>
  );
}
