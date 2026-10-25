import Link from "next/link";
import { exigirSesion } from "@/lib/auth";
import { plata } from "@/lib/dinero";
import { addDays, format, paraInputLocal, startOfWeek } from "@/lib/fechas";
import { horariosDeProfesional, listarMetodosPago } from "@/lib/repo/config";
import { listarServicios } from "@/lib/repo/servicios";
import { listarProfesionales } from "@/lib/repo/usuarios";
import { listarTurnos, obtenerTurno } from "@/lib/repo/turnos";
import Encabezado from "@/components/Encabezado";
import { Aviso, Kpi, Panel, estiloBoton } from "@/components/ui";
import FormularioTurno from "./FormularioTurno";
import Grilla from "./Grilla";
import PanelTurno from "./PanelTurno";

export const metadata = { title: "Calendario · Senko" };

const NOMBRE_DIA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default async function PaginaCalendario({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string; prof?: string; turno?: string; error?: string }>;
}) {
  const usuario = await exigirSesion();
  const params = await searchParams;
  const esDueno = usuario.rol === "dueno";

  // Semana visible: offset en semanas respecto de la actual.
  const offset = Number.parseInt(params.semana ?? "0", 10) || 0;
  const lunes = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), offset * 7);
  const dias = Array.from({ length: 7 }, (_, i) => addDays(lunes, i));
  const finSemana = addDays(lunes, 7);

  const profesionales = listarProfesionales();
  const servicios = listarServicios(true);
  const metodos = listarMetodosPago();
  const misHorarios = esDueno ? [] : horariosDeProfesional(usuario.id);

  // Un profesional ve unicamente su propia agenda; el dueño ve todo y puede filtrar.
  const filtroProf = esDueno ? (params.prof || null) : usuario.id;

  const turnos = listarTurnos({
    desde: lunes.toISOString(),
    hasta: finSemana.toISOString(),
    profesionalId: filtroProf,
  });

  const activos = turnos.filter((t) => t.estado !== "cancelado" && t.estado !== "ausente");
  const sinSena = activos.filter((t) => !t.senaCubierta);
  const facturacionPrevista = activos.reduce((acc, t) => acc + t.precioBase, 0);

  const turnoAbiertoId = params.turno;
  const turnoAbierto = turnoAbiertoId ? obtenerTurno(turnoAbiertoId) : null;
  const puedeVerTurno =
    turnoAbierto && (esDueno || turnoAbierto.profesionalId === usuario.id) ? turnoAbierto : null;

  const base = new URLSearchParams();
  base.set("semana", String(offset));
  if (esDueno && params.prof) base.set("prof", params.prof);
  const hrefBase = `/calendario?${base.toString()}`;

  const hrefSemana = (n: number) => {
    const p = new URLSearchParams();
    p.set("semana", String(n));
    if (esDueno && params.prof) p.set("prof", params.prof);
    return `/calendario?${p.toString()}`;
  };

  const rotuloSemana = `${format(lunes, "d MMM")} – ${format(addDays(lunes, 6), "d MMM yyyy")}`;

  return (
    <>
      <Encabezado
        titulo={esDueno ? "Calendario" : "Mi calendario"}
        descripcion={
          esDueno
            ? "Misma agenda que usa el bot de WhatsApp. Cada profesional ve solo sus turnos cuando entra con su usuario."
            : "Tus turnos. Los reserva el bot por WhatsApp. Podés verlos, comentarlos y avisarle al dueño si un cliente se retrasa."
        }
      >
        <div className="flex items-center gap-1 rounded-lg border border-borde bg-superficie-1 p-1">
          <Link href={hrefSemana(offset - 1)} className={estiloBoton("fantasma")} title="Semana anterior">
            ←
          </Link>
          <Link
            href={hrefSemana(0)}
            className="tabular px-2 text-xs font-semibold text-tinta-2 hover:text-tinta-1"
          >
            {rotuloSemana}
          </Link>
          <Link href={hrefSemana(offset + 1)} className={estiloBoton("fantasma")} title="Semana siguiente">
            →
          </Link>
        </div>
      </Encabezado>

      {params.error === "sin-permiso" && (
        <div className="mb-3">
          <Aviso>Esa sección es solo para el dueño.</Aviso>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi
          etiqueta="Turnos de la semana"
          valor={activos.length}
          detalle={
            turnos.length - activos.length > 0
              ? `${turnos.length - activos.length} cancelados o ausencias`
              : "Sin cancelaciones"
          }
        />
        <Kpi
          etiqueta="A facturar"
          valor={plata(facturacionPrevista)}
          detalle="Suma a precio general de los turnos activos."
        />
        <Kpi
          etiqueta="Señas sin cubrir"
          valor={sinSena.length}
          tono={sinSena.length > 0 ? "aviso" : "ok"}
          detalle={
            sinSena.length > 0
              ? "Marcados con un punto amarillo en la grilla."
              : "Todos los turnos tienen la seña al día."
          }
        />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_360px]">
        <Panel
          titulo={`Semana del ${rotuloSemana}`}
          descripcion={
            esDueno
              ? "El color de la barra izquierda es el profesional."
              : undefined
          }
          acciones={
            esDueno && profesionales.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                <Link
                  href={`/calendario?semana=${offset}`}
                  className={`rounded-md px-2 py-1 text-xs font-semibold ${
                    !params.prof
                      ? "bg-acento text-white"
                      : "text-tinta-2 hover:bg-superficie-2 hover:text-tinta-1"
                  }`}
                >
                  Todos
                </Link>
                {profesionales.map((p) => (
                  <Link
                    key={p.id}
                    href={`/calendario?semana=${offset}&prof=${p.id}`}
                    className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${
                      params.prof === p.id
                        ? "bg-acento text-white"
                        : "text-tinta-2 hover:bg-superficie-2 hover:text-tinta-1"
                    }`}
                  >
                    <span
                      aria-hidden
                      className="size-2 rounded-sm"
                      style={{ background: p.color }}
                    />
                    {p.nombre.split(" ")[0]}
                  </Link>
                ))}
              </div>
            ) : undefined
          }
          sinPadding
        >
          <Grilla
            dias={dias}
            turnos={turnos}
            hrefBase={hrefBase}
            turnoAbierto={puedeVerTurno?.id}
            mostrarProfesional={esDueno && !params.prof}
          />
        </Panel>

        <div className="space-y-3">
          {puedeVerTurno ? (
            <PanelTurno
              turno={puedeVerTurno}
              metodos={metodos}
              usuario={usuario}
              hrefCerrar={hrefBase}
            />
          ) : (
            <>
              {esDueno ? (
                <Panel titulo="Cargar un turno a mano">
                  {servicios.length === 0 ? (
                    <p className="text-sm text-tinta-3">
                      Primero cargá servicios en Configuración.
                    </p>
                  ) : (
                    <FormularioTurno
                      profesionales={profesionales}
                      servicios={servicios}
                      esDueno={esDueno}
                      fechaSugerida={paraInputLocal(
                        addDays(lunes, 0).toISOString(),
                      ).replace(/T.*/, "T10:00")}
                    />
                  )}
                </Panel>
              ) : (
                <Panel
                  titulo="Tus días y horarios"
                  descripcion="Los define el dueño. El bot solo ofrece turnos dentro de estas franjas."
                >
                  {misHorarios.length === 0 ? (
                    <p className="text-sm leading-relaxed text-tinta-3">
                      Todavía no tenés horarios cargados. Pedile al dueño que te los asigne desde
                      Usuarios.
                    </p>
                  ) : (
                    <ul className="space-y-1.5 text-sm">
                      {misHorarios.map((h) => (
                        <li key={h.id} className="flex items-baseline justify-between gap-3">
                          <span className="text-tinta-2">{NOMBRE_DIA[h.diaSemana]}</span>
                          <span className="tabular font-medium text-tinta-1">
                            {h.desde} – {h.hasta}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {usuario.ocupacion && (
                    <p className="mt-3 border-t border-borde pt-3 text-xs text-tinta-3">
                      Tu ocupación: <strong className="text-tinta-2">{usuario.ocupacion}</strong>
                    </p>
                  )}
                </Panel>
              )}

              <Panel titulo="Cómo leer la grilla">
                <ul className="space-y-2 text-xs leading-relaxed text-tinta-2">
                  {esDueno && (
                    <li>
                      <strong className="text-tinta-1">Barra de color a la izquierda:</strong> el
                      profesional que atiende. Si dos atienden a la misma hora, los turnos se
                      escalonan.
                    </li>
                  )}
                  <li>
                    <strong className="text-tinta-1">Punto amarillo:</strong> el turno todavía no
                    tiene la seña cubierta.
                  </li>
                  <li>
                    <strong className="text-tinta-1">Tachado y gris:</strong> cancelado o el
                    cliente no vino.
                  </li>
                  <li>
                    <strong className="text-tinta-1">✎</strong> con un número: el turno tiene
                    comentarios. <strong className="text-tinta-1">+15′</strong>: avisaron que el
                    cliente se retrasa.
                  </li>
                  <li>
                    Tocá cualquier turno para ver el detalle{esDueno
                      ? ", cobrar la seña o cambiarle el estado"
                      : ", comentarlo o avisar una demora"}
                    .
                  </li>
                </ul>
              </Panel>
            </>
          )}
        </div>
      </div>
    </>
  );
}
