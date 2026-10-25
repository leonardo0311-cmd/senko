import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirDueno } from "@/lib/auth";
import { plata, porcentaje } from "@/lib/dinero";
import { esPeriodo, etiquetaPeriodo, fechaYHora, rangoDePeriodo } from "@/lib/fechas";
import { obtenerCliente } from "@/lib/repo/clientes";
import { listarPagos } from "@/lib/repo/pagos";
import { resumenDeCliente } from "@/lib/repo/reportes";
import { turnosDeCliente } from "@/lib/repo/turnos";
import { METODOS_ORDEN } from "@/lib/types";
import Encabezado from "@/components/Encabezado";
import SelectorPeriodo from "@/components/SelectorPeriodo";
import { EstadoPagoChip, EstadoTurnoChip, OrigenChip, TipoPagoChip } from "@/components/estados";
import { BarraMetodos, COLOR_METODO, ETIQUETA_METODO } from "@/components/graficos";
import { Chip, Kpi, Panel, Scroll, Vacio, estiloBoton } from "@/components/ui";

export default async function PaginaCliente({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ periodo?: string }>;
}) {
  await exigirDueno();

  const { id } = await params;
  const { periodo: periodoParam } = await searchParams;
  const periodo = esPeriodo(periodoParam);
  const rango = rangoDePeriodo(periodo);

  const cliente = obtenerCliente(id);
  if (!cliente) notFound();

  const resumen = resumenDeCliente(id, rango);
  const turnos = turnosDeCliente(id);
  const pagos = listarPagos({ clienteId: id, ...rango, limite: 200 });

  const porMetodo = resumen?.porMetodo ?? { efectivo: 0, transferencia: 0, credito: 0, debito: 0 };

  return (
    <>
      <Encabezado
        titulo={cliente.nombre}
        descripcion={`WhatsApp ${cliente.telefono}${cliente.notas ? ` · ${cliente.notas}` : ""}`}
      >
        <SelectorPeriodo actual={periodo} />
        <Link href={`/clientes?periodo=${periodo}`} className={estiloBoton("secundario")}>
          ← Volver
        </Link>
      </Encabezado>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          etiqueta="Total gastado"
          valor={plata(resumen?.totalCobrado ?? 0)}
          detalle={etiquetaPeriodo(periodo)}
        />
        <Kpi
          etiqueta="A precio general"
          valor={plata(resumen?.totalBase ?? 0)}
          detalle={
            resumen && resumen.totalAjustes !== 0
              ? `${resumen.totalAjustes > 0 ? "Pagó" : "Ahorró"} ${plata(
                  Math.abs(resumen.totalAjustes),
                )} por los ajustes`
              : "Sin ajustes en el período"
          }
        />
        <Kpi
          etiqueta="Señas pagadas"
          valor={plata(resumen?.senasPagadas ?? 0)}
          tono="ok"
          detalle={
            (resumen?.senasPendientes ?? 0) > 0
              ? `${plata(resumen!.senasPendientes)} por acreditar`
              : "Sin señas por acreditar"
          }
        />
        <Kpi
          etiqueta="Turnos"
          valor={resumen?.turnos ?? 0}
          detalle={
            (resumen?.turnosCancelados ?? 0) > 0
              ? `${resumen!.turnosCancelados} cancelados o ausencias`
              : "Sin cancelaciones"
          }
        />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr]">
        <Panel titulo="Cómo paga este cliente">
          <BarraMetodos desglose={porMetodo} alto={14} />
          <table className="mt-4 w-full text-sm">
            <tbody>
              {METODOS_ORDEN.map((m) => (
                <tr key={m} className="border-b border-borde last:border-0">
                  <td className="py-1.5">
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="size-2.5 rounded-sm"
                        style={{ background: COLOR_METODO[m] }}
                      />
                      <span className="text-tinta-2">{ETIQUETA_METODO[m]}</span>
                    </span>
                  </td>
                  <td className="tabular py-1.5 text-right text-xs text-tinta-3">
                    base {plata(resumen?.baseEnPorMetodo[m] ?? 0)}
                  </td>
                  <td className="tabular py-1.5 text-right font-semibold text-tinta-1">
                    {plata(porMetodo[m])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel titulo="Historial de turnos" descripcion="Los últimos 50, sin filtrar por período." sinPadding>
          {turnos.length === 0 ? (
            <Vacio>Este cliente todavía no tiene turnos.</Vacio>
          ) : (
            <ul className="max-h-[420px] divide-y divide-borde overflow-y-auto">
              {turnos.map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-tinta-1">{t.servicioNombre}</p>
                    <p className="tabular text-xs text-tinta-3">
                      {fechaYHora(t.inicio)} · {t.profesionalNombre}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="tabular text-sm font-semibold text-tinta-1">
                      {plata(t.precioBase)}
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
      </div>

      <div className="mt-3">
        <Panel
          titulo={`Pagos · ${etiquetaPeriodo(periodo)}`}
          descripcion="Cada pago con su ajuste discriminado: precio general, recargo o descuento, y lo que entró en caja."
          sinPadding
        >
          {pagos.length === 0 ? (
            <Vacio>No hay pagos de este cliente en el período.</Vacio>
          ) : (
            <Scroll>
              <table className="w-full min-w-[840px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-borde text-left text-[0.7rem] font-semibold uppercase tracking-wide text-tinta-3">
                    <th className="px-3 py-2.5">Fecha</th>
                    <th className="px-3 py-2.5">Concepto</th>
                    <th className="px-3 py-2.5">Método</th>
                    <th className="px-3 py-2.5 text-right">Precio general</th>
                    <th className="px-3 py-2.5 text-right">Ajuste</th>
                    <th className="px-3 py-2.5 text-right">Cobrado</th>
                    <th className="px-3 py-2.5">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((p) => (
                    <tr key={p.id} className="border-b border-borde last:border-0 hover:bg-superficie-2">
                      <td className="tabular px-3 py-2.5 text-xs text-tinta-2">
                        {fechaYHora(p.pagadoEn ?? p.creadoEn)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <TipoPagoChip tipo={p.tipo} />
                          <span className="text-tinta-2">{p.servicioNombre ?? "Sin turno"}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-1.5">
                          <span
                            aria-hidden
                            className="size-2.5 shrink-0 rounded-sm"
                            style={{ background: COLOR_METODO[p.metodo] }}
                          />
                          <span className="text-tinta-2">{ETIQUETA_METODO[p.metodo]}</span>
                        </span>
                        {p.referencia && (
                          <p className="tabular text-[0.7rem] text-tinta-3">{p.referencia}</p>
                        )}
                      </td>
                      <td className="tabular px-3 py-2.5 text-right text-tinta-2">
                        {plata(p.montoBase)}
                      </td>
                      <td className="tabular px-3 py-2.5 text-right">
                        {p.ajusteMonto === 0 ? (
                          <span className="text-tinta-3">—</span>
                        ) : (
                          <span className={p.ajusteMonto > 0 ? "text-ok" : "text-aviso"}>
                            {p.ajusteMonto > 0 ? "+" : ""}
                            {plata(p.ajusteMonto)}
                            <span className="ml-1 text-[0.7rem] text-tinta-3">
                              {porcentaje(p.ajustePct)}
                            </span>
                          </span>
                        )}
                      </td>
                      <td className="tabular px-3 py-2.5 text-right font-semibold text-tinta-1">
                        {plata(p.montoTotal)}
                      </td>
                      <td className="px-3 py-2.5">
                        <EstadoPagoChip estado={p.estado} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Scroll>
          )}
        </Panel>
      </div>

      {cliente.notas && (
        <div className="mt-3">
          <Panel titulo="Notas">
            <p className="text-sm leading-relaxed text-tinta-2">{cliente.notas}</p>
          </Panel>
        </div>
      )}
    </>
  );
}
