import Link from "next/link";
import { exigirSesion } from "@/lib/auth";
import { plata, porcentaje } from "@/lib/dinero";
import { esPeriodo, etiquetaPeriodo, fechaYHora, rangoDePeriodo } from "@/lib/fechas";
import { listarMetodosPago, obtenerAjustes } from "@/lib/repo/config";
import { listarPagos } from "@/lib/repo/pagos";
import { totalesPeriodo } from "@/lib/repo/reportes";
import { listarTurnos } from "@/lib/repo/turnos";
import Encabezado from "@/components/Encabezado";
import SelectorPeriodo from "@/components/SelectorPeriodo";
import { EstadoTurnoChip, OrigenChip } from "@/components/estados";
import { COLOR_METODO, ETIQUETA_METODO } from "@/components/graficos";
import { Boton, Chip, Kpi, Panel, Scroll, Vacio } from "@/components/ui";
import { accionResolverSena } from "./acciones";

export const metadata = { title: "Señas · Senko" };

export default async function PaginaSenas({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const usuario = await exigirSesion();
  const esDueno = usuario.rol === "dueno";
  const soloMias = esDueno ? undefined : usuario.id;

  const { periodo: periodoParam } = await searchParams;
  const periodo = esPeriodo(periodoParam);
  const rango = rangoDePeriodo(periodo);

  const ajustes = obtenerAjustes();
  const metodos = listarMetodosPago();
  const totales = totalesPeriodo({ ...rango, profesionalId: soloMias });

  const porAcreditar = listarPagos({
    tipo: "sena",
    estado: "pendiente",
    profesionalId: soloMias,
    limite: 200,
  });

  const acreditadas = listarPagos({
    tipo: "sena",
    estado: "confirmado",
    profesionalId: soloMias,
    ...rango,
    limite: 200,
  });

  // Turnos a futuro cuya seña todavia no esta cubierta: son los que hay que reclamar.
  const proximos = listarTurnos({
    desde: new Date().toISOString(),
    hasta: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    profesionalId: soloMias ?? null,
    estados: ["pendiente", "confirmado"],
  });
  const sinSena = proximos.filter((t) => !t.senaCubierta);

  return (
    <>
      <Encabezado
        titulo="Señas"
        descripcion="La seña que el bot le pide al cliente para reservar. Acá se acreditan las transferencias y se ve qué turno todavía no señó."
      >
        <SelectorPeriodo actual={periodo} />
      </Encabezado>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          etiqueta="Señas cobradas"
          valor={plata(totales.senasCobradas)}
          tono="ok"
          detalle={etiquetaPeriodo(periodo)}
        />
        <Kpi
          etiqueta="Por acreditar"
          valor={plata(totales.senasPendientes)}
          tono={totales.cantidadSenasPendientes > 0 ? "aviso" : "neutro"}
          detalle={`${totales.cantidadSenasPendientes} ${
            totales.cantidadSenasPendientes === 1 ? "transferencia" : "transferencias"
          } sin confirmar`}
        />
        <Kpi
          etiqueta="Turnos sin seña"
          valor={sinSena.length}
          tono={sinSena.length > 0 ? "aviso" : "ok"}
          detalle="Próximos 60 días, pendientes o confirmados."
        />
        <Kpi
          etiqueta="Saldo por cobrar"
          valor={plata(totales.saldoPorCobrar)}
          detalle="Lo que falta cobrar de los turnos del período, a precio general."
        />
      </div>

      {esDueno && (
        <div className="mt-3">
          <Panel
            titulo="Datos que informa el bot para señar"
            descripcion="Se editan en Configuración. El bot los manda por WhatsApp cuando pide la seña."
          >
            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-tinta-3">Alias</dt>
                <dd className="tabular mt-0.5 font-semibold text-tinta-1">
                  {ajustes.transferencia_alias || <span className="text-aviso">sin configurar</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-tinta-3">CBU</dt>
                <dd className="tabular mt-0.5 text-tinta-1">
                  {ajustes.transferencia_cbu || <span className="text-tinta-3">—</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-tinta-3">
                  Vence en
                </dt>
                <dd className="mt-0.5 text-tinta-1">
                  {ajustes.sena_horas_vencimiento} h desde la reserva
                </dd>
              </div>
            </dl>
          </Panel>
        </div>
      )}

      <div className="mt-3">
        <Panel
          titulo="Señas por acreditar"
          descripcion="El cliente dice que transfirió. Confirmá cuando veas la plata en la cuenta."
          sinPadding
        >
          {porAcreditar.length === 0 ? (
            <Vacio>No hay señas esperando confirmación.</Vacio>
          ) : (
            <Scroll>
              <table className="w-full min-w-[820px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-borde text-left text-[0.7rem] font-semibold uppercase tracking-wide text-tinta-3">
                    <th className="px-3 py-2.5">Cliente</th>
                    <th className="px-3 py-2.5">Turno</th>
                    <th className="px-3 py-2.5">Método</th>
                    <th className="px-3 py-2.5 text-right">Precio general</th>
                    <th className="px-3 py-2.5 text-right">A cobrar</th>
                    <th className="px-3 py-2.5">Referencia</th>
                    <th className="px-3 py-2.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {porAcreditar.map((p) => (
                    <tr key={p.id} className="border-b border-borde last:border-0">
                      <td className="px-3 py-2.5 font-medium text-tinta-1">{p.clienteNombre}</td>
                      <td className="px-3 py-2.5 text-xs text-tinta-2">
                        {p.servicioNombre ?? "—"}
                        {p.turnoInicio && (
                          <span className="tabular block text-tinta-3">
                            {fechaYHora(p.turnoInicio)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-1.5 text-tinta-2">
                          <span
                            aria-hidden
                            className="size-2.5 rounded-sm"
                            style={{ background: COLOR_METODO[p.metodo] }}
                          />
                          {ETIQUETA_METODO[p.metodo]}
                        </span>
                      </td>
                      <td className="tabular px-3 py-2.5 text-right text-tinta-2">
                        {plata(p.montoBase)}
                        <span className="ml-1 text-[0.7rem] text-tinta-3">
                          {porcentaje(p.ajustePct)}
                        </span>
                      </td>
                      <td className="tabular px-3 py-2.5 text-right font-semibold text-tinta-1">
                        {plata(p.montoTotal)}
                      </td>
                      <td className="tabular px-3 py-2.5 text-xs text-tinta-3">
                        {p.referencia ?? "—"}
                        {p.alias && <span className="block">{p.alias}</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-end gap-1.5">
                          <form action={accionResolverSena}>
                            <input type="hidden" name="pagoId" value={p.id} />
                            <input type="hidden" name="estado" value="confirmado" />
                            <Boton variante="primario">Acreditar</Boton>
                          </form>
                          <form action={accionResolverSena}>
                            <input type="hidden" name="pagoId" value={p.id} />
                            <input type="hidden" name="estado" value="rechazado" />
                            <Boton variante="peligro">Rechazar</Boton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Scroll>
          )}
        </Panel>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        <Panel
          titulo="Turnos sin seña cubierta"
          descripcion="Próximos 60 días. Son los que conviene reclamar o liberar."
          sinPadding
        >
          {sinSena.length === 0 ? (
            <Vacio>Todos los turnos próximos tienen la seña al día.</Vacio>
          ) : (
            <ul className="max-h-[380px] divide-y divide-borde overflow-y-auto">
              {sinSena.map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <Link
                      href={`/calendario?semana=0&turno=${t.id}`}
                      className="truncate text-sm font-medium text-tinta-1 underline-offset-2 hover:text-acento hover:underline"
                    >
                      {t.clienteNombre}
                    </Link>
                    <p className="tabular text-xs text-tinta-3">
                      {fechaYHora(t.inicio)} · {t.servicioNombre}
                      {esDueno ? ` · ${t.profesionalNombre}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="tabular text-sm font-semibold text-aviso">
                      falta {plata(t.senaEsperada - t.pagado)}
                    </span>
                    <span className="flex gap-1">
                      <OrigenChip origen={t.origen} />
                      <EstadoTurnoChip estado={t.estado} />
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          titulo={`Señas acreditadas · ${etiquetaPeriodo(periodo)}`}
          sinPadding
        >
          {acreditadas.length === 0 ? (
            <Vacio>No hay señas acreditadas en el período.</Vacio>
          ) : (
            <ul className="max-h-[380px] divide-y divide-borde overflow-y-auto">
              {acreditadas.map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-tinta-1">{p.clienteNombre}</p>
                    <p className="tabular text-xs text-tinta-3">
                      {fechaYHora(p.pagadoEn ?? p.creadoEn)} · {p.servicioNombre ?? "sin turno"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="tabular text-sm font-semibold text-tinta-1">
                      {plata(p.montoTotal)}
                    </span>
                    <Chip tono="neutro">
                      <span
                        aria-hidden
                        className="size-2 rounded-sm"
                        style={{ background: COLOR_METODO[p.metodo] }}
                      />
                      {ETIQUETA_METODO[p.metodo]}
                    </Chip>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-tinta-3">
        La seña se calcula sobre el precio general del servicio y después se le aplica el ajuste del
        método con el que la pagan:{" "}
        {metodos
          .filter((m) => m.activo)
          .map((m) => `${m.etiqueta} ${porcentaje(m.ajustePct)}`)
          .join(" · ")}
        .
      </p>
    </>
  );
}
