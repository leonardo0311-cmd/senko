import Link from "next/link";
import { exigirDueno } from "@/lib/auth";
import { plata } from "@/lib/dinero";
import { esPeriodo, etiquetaPeriodo, fechaCorta, rangoDePeriodo } from "@/lib/fechas";
import { resumenPorCliente, totalesPeriodo } from "@/lib/repo/reportes";
import { METODOS_ORDEN } from "@/lib/types";
import Encabezado from "@/components/Encabezado";
import SelectorPeriodo from "@/components/SelectorPeriodo";
import { BarraMetodos, COLOR_METODO, ETIQUETA_METODO } from "@/components/graficos";
import { Kpi, Panel, Scroll, Vacio } from "@/components/ui";

export const metadata = { title: "Clientes y gastos · Senko" };

export default async function PaginaClientes({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; orden?: string }>;
}) {
  await exigirDueno();

  const params = await searchParams;
  const periodo = esPeriodo(params.periodo);
  const rango = rangoDePeriodo(periodo);

  const totales = totalesPeriodo(rango);
  const todos = resumenPorCliente(rango);
  const conMovimiento = todos.filter((r) => r.totalCobrado > 0 || r.turnos > 0);

  const ordenarPor = params.orden ?? "total";
  const filas = [...conMovimiento].sort((a, b) => {
    if (ordenarPor === "nombre") return a.cliente.nombre.localeCompare(b.cliente.nombre, "es");
    if (ordenarPor === "turnos") return b.turnos - a.turnos;
    if (ordenarPor === "ajustes") return b.totalAjustes - a.totalAjustes;
    const metodo = METODOS_ORDEN.find((m) => m === ordenarPor);
    if (metodo) return b.porMetodo[metodo] - a.porMetodo[metodo];
    return b.totalCobrado - a.totalCobrado;
  });

  const recargos = filas.reduce((acc, r) => acc + Math.max(r.totalAjustes, 0), 0);
  const descuentos = filas.reduce((acc, r) => acc + Math.min(r.totalAjustes, 0), 0);

  return (
    <>
      <Encabezado
        titulo="Clientes y gastos"
        descripcion="Cuánto gastó cada cliente, separado por efectivo, transferencia, débito y crédito. El recargo de tarjeta y el descuento de efectivo o alias ya están aplicados y se muestran aparte."
      >
        <SelectorPeriodo actual={periodo} />
      </Encabezado>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          etiqueta="Total cobrado"
          valor={plata(totales.totalCobrado)}
          detalle={`${etiquetaPeriodo(periodo)} · ${totales.cantidadPagos} ${
            totales.cantidadPagos === 1 ? "pago" : "pagos"
          } acreditados`}
        />
        <Kpi
          etiqueta="A precio general"
          valor={plata(totales.totalBase)}
          detalle="Lo mismo sin recargos ni descuentos. Es la base de comparación."
        />
        <Kpi
          etiqueta="Recargos de tarjeta"
          valor={plata(recargos)}
          tono={recargos > 0 ? "ok" : "neutro"}
          detalle="Lo que entró de más por débito y crédito."
        />
        <Kpi
          etiqueta="Descuentos otorgados"
          valor={plata(Math.abs(descuentos))}
          tono={descuentos < 0 ? "aviso" : "neutro"}
          detalle="Lo que resignaste por efectivo y transferencia."
        />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.1fr_1fr]">
        <Panel
          titulo="Cómo te pagan"
          descripcion={`Reparto del total cobrado en ${etiquetaPeriodo(periodo).toLowerCase()}.`}
        >
          <BarraMetodos desglose={totales.porMetodo} alto={14} />
        </Panel>

        <Panel
          titulo="Efecto de los porcentajes"
          descripcion="Diferencia entre lo que entró en caja y el precio general."
        >
          <dl className="space-y-2.5">
            {METODOS_ORDEN.map((m) => {
              const cobrado = totales.porMetodo[m];
              const base = totales.baseEnPorMetodo[m];
              const dif = cobrado - base;
              return (
                <div key={m} className="flex items-center justify-between gap-3 text-sm">
                  <dt className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden
                      className="size-2.5 shrink-0 rounded-sm"
                      style={{ background: COLOR_METODO[m] }}
                    />
                    <span className="truncate text-tinta-2">{ETIQUETA_METODO[m]}</span>
                  </dt>
                  <dd className="tabular flex shrink-0 items-baseline gap-3">
                    <span className="text-xs text-tinta-3">base {plata(base)}</span>
                    <span
                      className={`font-semibold ${
                        dif > 0 ? "text-ok" : dif < 0 ? "text-aviso" : "text-tinta-3"
                      }`}
                    >
                      {dif > 0 ? "+" : ""}
                      {plata(dif)}
                    </span>
                  </dd>
                </div>
              );
            })}
            <div className="flex items-center justify-between gap-3 border-t border-borde pt-2.5 text-sm">
              <dt className="font-semibold text-tinta-1">Neto de ajustes</dt>
              <dd
                className={`tabular font-semibold ${
                  totales.totalAjustes > 0 ? "text-ok" : totales.totalAjustes < 0 ? "text-aviso" : "text-tinta-3"
                }`}
              >
                {totales.totalAjustes > 0 ? "+" : ""}
                {plata(totales.totalAjustes)}
              </dd>
            </div>
          </dl>
        </Panel>
      </div>

      <div className="mt-3">
        <Panel
          titulo={`Gasto por cliente · ${etiquetaPeriodo(periodo)}`}
          descripcion="Tocá un cliente para ver su historial de turnos y cada pago en detalle."
          sinPadding
        >
          {filas.length === 0 ? (
            <Vacio>No hay movimientos en este período.</Vacio>
          ) : (
            <Scroll>
              <table className="w-full min-w-[920px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-borde text-left">
                    <Th orden="nombre" periodo={periodo} actual={ordenarPor}>
                      Cliente
                    </Th>
                    {METODOS_ORDEN.map((m) => (
                      <Th key={m} orden={m} periodo={periodo} actual={ordenarPor} derecha>
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            aria-hidden
                            className="size-2 rounded-sm"
                            style={{ background: COLOR_METODO[m] }}
                          />
                          {ETIQUETA_METODO[m]}
                        </span>
                      </Th>
                    ))}
                    <Th orden="total" periodo={periodo} actual={ordenarPor} derecha>
                      Total gastado
                    </Th>
                    <Th orden="ajustes" periodo={periodo} actual={ordenarPor} derecha>
                      Ajustes
                    </Th>
                    <Th orden="turnos" periodo={periodo} actual={ordenarPor} derecha>
                      Turnos
                    </Th>
                    <th className="px-3 py-2.5 text-right text-[0.7rem] font-semibold uppercase tracking-wide text-tinta-3">
                      Último
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((r) => (
                    <tr
                      key={r.cliente.id}
                      className="border-b border-borde last:border-0 hover:bg-superficie-2"
                    >
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/clientes/${r.cliente.id}?periodo=${periodo}`}
                          className="font-medium text-tinta-1 underline-offset-2 hover:text-acento hover:underline"
                        >
                          {r.cliente.nombre}
                        </Link>
                        <p className="tabular text-[0.7rem] text-tinta-3">{r.cliente.telefono}</p>
                      </td>
                      {METODOS_ORDEN.map((m) => (
                        <td key={m} className="tabular px-3 py-2.5 text-right">
                          {r.porMetodo[m] > 0 ? (
                            <span className="text-tinta-1">{plata(r.porMetodo[m])}</span>
                          ) : (
                            <span className="text-tinta-3">—</span>
                          )}
                        </td>
                      ))}
                      <td className="tabular px-3 py-2.5 text-right">
                        <span className="font-semibold text-tinta-1">{plata(r.totalCobrado)}</span>
                        <span className="mt-1 block max-w-[110px] ml-auto">
                          <BarraMetodos desglose={r.porMetodo} alto={4} mostrarLeyenda={false} />
                        </span>
                      </td>
                      <td
                        className={`tabular px-3 py-2.5 text-right font-medium ${
                          r.totalAjustes > 0
                            ? "text-ok"
                            : r.totalAjustes < 0
                              ? "text-aviso"
                              : "text-tinta-3"
                        }`}
                      >
                        {r.totalAjustes === 0 ? "—" : `${r.totalAjustes > 0 ? "+" : ""}${plata(r.totalAjustes)}`}
                      </td>
                      <td className="tabular px-3 py-2.5 text-right text-tinta-2">
                        {r.turnos}
                        {r.turnosCancelados > 0 && (
                          <span className="text-tinta-3" title="Cancelados o ausencias">
                            {" "}
                            (+{r.turnosCancelados})
                          </span>
                        )}
                      </td>
                      <td className="tabular px-3 py-2.5 text-right text-xs text-tinta-3">
                        {r.ultimoTurno ? fechaCorta(r.ultimoTurno) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-borde-fuerte bg-superficie-2 font-semibold">
                    <td className="px-3 py-2.5 text-tinta-1">
                      Total · {filas.length} {filas.length === 1 ? "cliente" : "clientes"}
                    </td>
                    {METODOS_ORDEN.map((m) => (
                      <td key={m} className="tabular px-3 py-2.5 text-right text-tinta-1">
                        {plata(totales.porMetodo[m])}
                      </td>
                    ))}
                    <td className="tabular px-3 py-2.5 text-right text-tinta-1">
                      {plata(totales.totalCobrado)}
                    </td>
                    <td
                      className={`tabular px-3 py-2.5 text-right ${
                        totales.totalAjustes > 0 ? "text-ok" : totales.totalAjustes < 0 ? "text-aviso" : "text-tinta-3"
                      }`}
                    >
                      {totales.totalAjustes > 0 ? "+" : ""}
                      {plata(totales.totalAjustes)}
                    </td>
                    <td className="px-3 py-2.5" colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </Scroll>
          )}
        </Panel>
      </div>
    </>
  );
}

function Th({
  children,
  orden,
  periodo,
  actual,
  derecha = false,
}: {
  children: React.ReactNode;
  orden: string;
  periodo: string;
  actual: string;
  derecha?: boolean;
}) {
  const activo = actual === orden;
  return (
    <th
      className={`px-3 py-2.5 text-[0.7rem] font-semibold uppercase tracking-wide ${
        derecha ? "text-right" : "text-left"
      }`}
      aria-sort={activo ? "descending" : "none"}
    >
      <Link
        href={`/clientes?periodo=${periodo}&orden=${orden}`}
        className={`underline-offset-2 hover:underline ${activo ? "text-acento" : "text-tinta-3"}`}
      >
        {children}
      </Link>
    </th>
  );
}
