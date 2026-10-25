import Link from "next/link";
import { hora } from "@/lib/fechas";
import { plata } from "@/lib/dinero";
import type { TurnoDetalle } from "@/lib/types";

const HORA_DESDE = 7;
const HORA_HASTA = 22;
const PX_POR_HORA = 56;

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

type Ubicado = { turno: TurnoDetalle; columna: number; columnas: number };

/**
 * Acomoda los turnos de un día en columnas para que los que se pisan queden
 * uno al lado del otro en vez de tapándose. Pasa cuando el dueño mira a todos
 * los profesionales juntos y dos atienden a la misma hora.
 */
function ubicarEnColumnas(turnos: TurnoDetalle[]): Ubicado[] {
  const ordenados = [...turnos].sort(
    (a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime(),
  );

  const ubicados: Ubicado[] = [];
  let grupo: Ubicado[] = [];
  let finDeGrupo = 0;
  const finDeColumna: number[] = [];

  const cerrarGrupo = () => {
    const columnas = finDeColumna.length || 1;
    for (const item of grupo) item.columnas = columnas;
    ubicados.push(...grupo);
    grupo = [];
    finDeColumna.length = 0;
    finDeGrupo = 0;
  };

  for (const turno of ordenados) {
    const inicio = new Date(turno.inicio).getTime();
    const fin = new Date(turno.fin).getTime();

    // Si no toca nada de lo anterior, arranca un grupo nuevo.
    if (grupo.length > 0 && inicio >= finDeGrupo) cerrarGrupo();

    let columna = finDeColumna.findIndex((hasta) => hasta <= inicio);
    if (columna === -1) {
      columna = finDeColumna.length;
      finDeColumna.push(fin);
    } else {
      finDeColumna[columna] = fin;
    }

    grupo.push({ turno, columna, columnas: 1 });
    finDeGrupo = Math.max(finDeGrupo, fin);
  }
  if (grupo.length > 0) cerrarGrupo();

  return ubicados;
}

/**
 * Grilla semanal. Cada turno se posiciona por su hora real, asi se ve de un
 * golpe donde hay huecos. Los turnos que caen fuera de la franja visible se
 * listan abajo para que no desaparezcan.
 */
export default function Grilla({
  dias,
  turnos,
  hrefBase,
  turnoAbierto,
  mostrarProfesional,
}: {
  dias: Date[];
  turnos: TurnoDetalle[];
  hrefBase: string;
  turnoAbierto?: string;
  mostrarProfesional: boolean;
}) {
  const minutosTotales = (HORA_HASTA - HORA_DESDE) * 60;
  const horas = Array.from({ length: HORA_HASTA - HORA_DESDE }, (_, i) => HORA_DESDE + i);
  const hoyISO = new Date().toDateString();

  const porDia = dias.map((dia) =>
    turnos.filter((t) => new Date(t.inicio).toDateString() === dia.toDateString()),
  );

  const fueraDeFranja = turnos.filter((t) => {
    const d = new Date(t.inicio);
    return d.getHours() < HORA_DESDE || d.getHours() >= HORA_HASTA;
  });

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="min-w-[780px]">
          {/* encabezado de dias */}
          <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-borde">
            <div />
            {dias.map((dia, i) => {
              const esHoy = dia.toDateString() === hoyISO;
              return (
                <div
                  key={dia.toISOString()}
                  className={`border-l border-borde px-1 py-2 text-center ${
                    esHoy ? "bg-acento-suave" : ""
                  }`}
                >
                  <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-tinta-3">
                    {DIAS[i]}
                  </p>
                  <p
                    className={`tabular text-sm font-semibold ${
                      esHoy ? "text-acento" : "text-tinta-1"
                    }`}
                  >
                    {dia.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* cuerpo */}
          <div className="grid grid-cols-[48px_repeat(7,1fr)]">
            {/* columna de horas */}
            <div>
              {horas.map((h) => (
                <div
                  key={h}
                  className="tabular relative border-b border-borde text-right text-[0.7rem] text-tinta-3"
                  style={{ height: PX_POR_HORA }}
                >
                  <span className="absolute -top-1.5 right-1.5 bg-superficie-1 px-0.5">
                    {String(h).padStart(2, "0")}
                  </span>
                </div>
              ))}
            </div>

            {dias.map((dia, iDia) => (
              <div
                key={dia.toISOString()}
                className={`relative border-l border-borde ${
                  dia.toDateString() === hoyISO ? "bg-acento-suave/30" : ""
                }`}
                style={{ height: PX_POR_HORA * horas.length }}
              >
                {horas.map((h) => (
                  <div
                    key={h}
                    className="border-b border-borde"
                    style={{ height: PX_POR_HORA }}
                  />
                ))}

                {ubicarEnColumnas(porDia[iDia]).map(({ turno: t, columna, columnas }) => {
                  const inicio = new Date(t.inicio);
                  const fin = new Date(t.fin);
                  const minutosInicio =
                    (inicio.getHours() - HORA_DESDE) * 60 + inicio.getMinutes();
                  if (minutosInicio < 0 || minutosInicio >= minutosTotales) return null;
                  const duracion = Math.max(
                    (fin.getTime() - inicio.getTime()) / 60_000,
                    25,
                  );
                  const cancelado = t.estado === "cancelado" || t.estado === "ausente";
                  const abierto = turnoAbierto === t.id;
                  // Cuando se pisan, los bloques se escalonan y se superponen un
                  // poco (como Google Calendar) en vez de partirse en columnas
                  // finitas: así el nombre del cliente se sigue leyendo.
                  const paso = 100 / columnas;
                  const ancho = columnas === 1 ? 100 : Math.min(paso * 1.6, 100);
                  const izquierda = Math.min(columna * paso, 100 - ancho);
                  const compacto = duracion < 45 || columnas > 2;

                  return (
                    <Link
                      key={t.id}
                      href={`${hrefBase}&turno=${t.id}`}
                      scroll={false}
                      title={`${hora(t.inicio)} ${t.clienteNombre} · ${t.servicioNombre} · ${
                        t.profesionalNombre
                      } · ${plata(t.precioBase)}`}
                      className={`absolute overflow-hidden rounded-md border-l-[3px] px-1.5 py-1 text-[0.7rem] leading-tight transition-shadow hover:z-20 hover:shadow-md ${
                        cancelado ? "opacity-50" : ""
                      } ${abierto ? "z-10 ring-2 ring-acento" : ""}`}
                      style={{
                        top: `${(minutosInicio / minutosTotales) * 100}%`,
                        height: `calc(${(duracion / minutosTotales) * 100}% - 2px)`,
                        left: `calc(${izquierda}% + 2px)`,
                        width: `calc(${ancho}% - 4px)`,
                        zIndex: abierto ? 10 : columna + 1,
                        borderLeftColor: t.profesionalColor,
                        background: "var(--superficie-2)",
                        boxShadow: columnas > 1 ? "0 0 0 1px var(--superficie-1)" : undefined,
                      }}
                    >
                      <span className="flex items-center gap-1">
                        <span className="tabular font-semibold text-tinta-1">
                          {hora(t.inicio)}
                        </span>
                        {!t.senaCubierta && t.estado !== "cancelado" && (
                          <span
                            aria-hidden
                            title="Seña sin cubrir"
                            className="inline-block size-1.5 shrink-0 rounded-full bg-aviso"
                          />
                        )}
                        {t.demoraMin !== null && (
                          <span
                            title={`El cliente avisó que se retrasa ${t.demoraMin} min`}
                            className="tabular shrink-0 rounded bg-aviso-fondo px-1 text-[0.6rem] font-bold text-aviso"
                          >
                            +{t.demoraMin}′
                          </span>
                        )}
                        {t.comentarios > 0 && (
                          <span
                            aria-hidden
                            title={`${t.comentarios} comentario${t.comentarios === 1 ? "" : "s"}`}
                            className="ml-auto shrink-0 text-[0.6rem] text-tinta-3"
                          >
                            ✎{t.comentarios}
                          </span>
                        )}
                      </span>
                      <span
                        className={`block truncate font-medium text-tinta-1 ${
                          cancelado ? "line-through" : ""
                        }`}
                      >
                        {t.clienteNombre}
                      </span>
                      {!compacto && (
                        <span className="block truncate text-tinta-3">
                          {mostrarProfesional ? t.profesionalNombre : t.servicioNombre}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {fueraDeFranja.length > 0 && (
        <div className="border-t border-borde px-4 py-3">
          <p className="mb-1.5 text-xs font-semibold text-tinta-2">
            Fuera de la franja {HORA_DESDE}:00–{HORA_HASTA}:00
          </p>
          <ul className="flex flex-wrap gap-2">
            {fueraDeFranja.map((t) => (
              <li key={t.id}>
                <Link
                  href={`${hrefBase}&turno=${t.id}`}
                  scroll={false}
                  className="tabular inline-flex items-center gap-1.5 rounded-md border border-borde-fuerte bg-superficie-2 px-2 py-1 text-xs text-tinta-2 hover:text-tinta-1"
                >
                  <span
                    aria-hidden
                    className="size-2 rounded-sm"
                    style={{ background: t.profesionalColor }}
                  />
                  {hora(t.inicio)} · {t.clienteNombre}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
