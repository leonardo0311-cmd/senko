import Link from "next/link";
import { exigirDueno } from "@/lib/auth";
import { plata, porcentaje } from "@/lib/dinero";
import { esPeriodo, etiquetaPeriodo, fechaYHora, rangoDePeriodo } from "@/lib/fechas";
import { listarPagos } from "@/lib/repo/pagos";
import { serieDiaria, totalesPeriodo, totalesPorProfesional } from "@/lib/repo/reportes";
import { listarProfesionales } from "@/lib/repo/usuarios";
import { METODOS_ORDEN } from "@/lib/types";
import type { EstadoPago, MetodoPagoClave, TipoPago } from "@/lib/types";
import Encabezado from "@/components/Encabezado";
import SelectorPeriodo from "@/components/SelectorPeriodo";
import { EstadoPagoChip, TipoPagoChip } from "@/components/estados";
import {
  BarraMetodos,
  COLOR_METODO,
  ETIQUETA_METODO,
  SerieDiaria,
} from "@/components/graficos";
import { Kpi, Panel, Scroll, Vacio } from "@/components/ui";

export const metadata = { title: "Pagos · Senko" };

const METODOS_VALIDOS = new Set<string>(METODOS_ORDEN);
const TIPOS_VALIDOS = new Set<string>(["sena", "saldo", "total"]);
const ESTADOS_VALIDOS = new Set<string>(["pendiente", "confirmado", "rechazado"]);

export default async function PaginaPagos({
  searchParams,
}: {
  searchParams: Promise<{
    periodo?: string;
    metodo?: string;
    tipo?: string;
    estado?: string;
    prof?: string;
  }>;
}) {
  await exigirDueno();

  const params = await searchParams;
  const periodo = esPeriodo(params.periodo);
  const rango = rangoDePeriodo(periodo);

  const metodo = METODOS_VALIDOS.has(params.metodo ?? "")
    ? (params.metodo as MetodoPagoClave)
    : undefined;
  const tipo = TIPOS_VALIDOS.has(params.tipo ?? "") ? (params.tipo as TipoPago) : undefined;
  const estado = ESTADOS_VALIDOS.has(params.estado ?? "")
    ? (params.estado as EstadoPago)
    : undefined;

  const profesionales = listarProfesionales(false);
  const prof = profesionales.find((p) => p.id === params.prof)?.id;

  const totales = totalesPeriodo({ ...rango, profesionalId: prof });
  const serie = serieDiaria({ ...rango, profesionalId: prof });
  const porProfesional = totalesPorProfesional(rango);

  const pagos = listarPagos({
    ...rango,
    metodo,
    tipo,
    estado,
    profesionalId: prof,
    limite: 400,
  });

  const sumaFiltrada = pagos
    .filter((p) => p.estado === "confirmado")
    .reduce((acc, p) => acc + p.montoTotal, 0);

  function href(cambios: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    p.set("periodo", periodo);
    const actuales: Record<string, string | undefined> = {
      metodo: params.metodo,
      tipo: params.tipo,
      estado: params.estado,
      prof: params.prof,
      ...cambios,
    };
    for (const [clave, valor] of Object.entries(actuales)) {
      if (valor) p.set(clave, valor);
    }
    return `/pagos?${p.toString()}`;
  }

  return (
    <>
      <Encabezado
        titulo="Pagos"
        descripcion="Toda la caja, pago por pago, con el precio general y el ajuste del método discriminados."
      >
        <SelectorPeriodo actual={periodo} />
      </Encabezado>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          etiqueta="Total cobrado"
          valor={plata(totales.totalCobrado)}
          detalle={`${etiquetaPeriodo(periodo)} · ${totales.cantidadPagos} pagos`}
        />
        <Kpi
          etiqueta="Neto de ajustes"
          valor={`${totales.totalAjustes > 0 ? "+" : ""}${plata(totales.totalAjustes)}`}
          tono={totales.totalAjustes > 0 ? "ok" : totales.totalAjustes < 0 ? "aviso" : "neutro"}
          detalle="Recargos de tarjeta menos descuentos de efectivo y alias."
        />
        <Kpi
          etiqueta="Señas por acreditar"
          valor={plata(totales.senasPendientes)}
          tono={totales.cantidadSenasPendientes > 0 ? "aviso" : "neutro"}
          detalle={`${totales.cantidadSenasPendientes} sin confirmar`}
        />
        <Kpi
          etiqueta="Saldo por cobrar"
          valor={plata(totales.saldoPorCobrar)}
          detalle="Turnos del período con saldo abierto."
        />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr]">
        <Panel titulo="Facturación por día">
          <SerieDiaria datos={serie} />
        </Panel>
        <Panel titulo="Reparto por método">
          <BarraMetodos desglose={totales.porMetodo} alto={14} />
        </Panel>
      </div>

      {porProfesional.length > 0 && (
        <div className="mt-3">
          <Panel
            titulo="Por profesional"
            descripcion="Solo cuenta los pagos imputados a un turno."
            sinPadding
          >
            <Scroll>
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-borde text-left text-[0.7rem] font-semibold uppercase tracking-wide text-tinta-3">
                    <th className="px-3 py-2.5">Profesional</th>
                    {METODOS_ORDEN.map((m) => (
                      <th key={m} className="px-3 py-2.5 text-right">
                        {ETIQUETA_METODO[m]}
                      </th>
                    ))}
                    <th className="px-3 py-2.5 text-right">Total</th>
                    <th className="px-3 py-2.5 text-right">Turnos</th>
                  </tr>
                </thead>
                <tbody>
                  {porProfesional.map((p) => (
                    <tr key={p.profesionalId} className="border-b border-borde last:border-0">
                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-2 font-medium text-tinta-1">
                          <span
                            aria-hidden
                            className="size-2.5 rounded-sm"
                            style={{ background: p.color }}
                          />
                          {p.nombre}
                        </span>
                      </td>
                      {METODOS_ORDEN.map((m) => (
                        <td key={m} className="tabular px-3 py-2.5 text-right text-tinta-2">
                          {p.porMetodo[m] > 0 ? plata(p.porMetodo[m]) : "—"}
                        </td>
                      ))}
                      <td className="tabular px-3 py-2.5 text-right font-semibold text-tinta-1">
                        {plata(p.totalCobrado)}
                      </td>
                      <td className="tabular px-3 py-2.5 text-right text-tinta-2">{p.turnos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Scroll>
          </Panel>
        </div>
      )}

      <div className="mt-3">
        <Panel
          titulo="Movimientos"
          descripcion={`${pagos.length} ${
            pagos.length === 1 ? "pago" : "pagos"
          } · ${plata(sumaFiltrada)} acreditados en lo filtrado`}
          acciones={
            <div className="flex flex-wrap gap-1">
              <Filtro href={href({ metodo: undefined })} activo={!metodo}>
                Todos
              </Filtro>
              {METODOS_ORDEN.map((m) => (
                <Filtro key={m} href={href({ metodo: m })} activo={metodo === m} color={COLOR_METODO[m]}>
                  {ETIQUETA_METODO[m]}
                </Filtro>
              ))}
            </div>
          }
          sinPadding
        >
          <div className="flex flex-wrap gap-x-4 gap-y-2 border-b border-borde px-4 py-2.5">
            <Grupo titulo="Concepto">
              <Filtro href={href({ tipo: undefined })} activo={!tipo}>
                Todos
              </Filtro>
              <Filtro href={href({ tipo: "sena" })} activo={tipo === "sena"}>
                Señas
              </Filtro>
              <Filtro href={href({ tipo: "saldo" })} activo={tipo === "saldo"}>
                Saldos
              </Filtro>
              <Filtro href={href({ tipo: "total" })} activo={tipo === "total"}>
                Pago total
              </Filtro>
            </Grupo>
            <Grupo titulo="Estado">
              <Filtro href={href({ estado: undefined })} activo={!estado}>
                Todos
              </Filtro>
              <Filtro href={href({ estado: "confirmado" })} activo={estado === "confirmado"}>
                Acreditados
              </Filtro>
              <Filtro href={href({ estado: "pendiente" })} activo={estado === "pendiente"}>
                Por acreditar
              </Filtro>
              <Filtro href={href({ estado: "rechazado" })} activo={estado === "rechazado"}>
                Rechazados
              </Filtro>
            </Grupo>
            {profesionales.length > 0 && (
              <Grupo titulo="Profesional">
                <Filtro href={href({ prof: undefined })} activo={!prof}>
                  Todos
                </Filtro>
                {profesionales.map((p) => (
                  <Filtro key={p.id} href={href({ prof: p.id })} activo={prof === p.id} color={p.color}>
                    {p.nombre.split(" ")[0]}
                  </Filtro>
                ))}
              </Grupo>
            )}
          </div>

          {pagos.length === 0 ? (
            <Vacio>No hay pagos con esos filtros.</Vacio>
          ) : (
            <Scroll>
              <table className="w-full min-w-[960px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-borde text-left text-[0.7rem] font-semibold uppercase tracking-wide text-tinta-3">
                    <th className="px-3 py-2.5">Fecha</th>
                    <th className="px-3 py-2.5">Cliente</th>
                    <th className="px-3 py-2.5">Turno</th>
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
                        <Link
                          href={`/clientes/${p.clienteId}?periodo=${periodo}`}
                          className="font-medium text-tinta-1 underline-offset-2 hover:text-acento hover:underline"
                        >
                          {p.clienteNombre}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-tinta-2">
                        {p.servicioNombre ?? "—"}
                        {p.profesionalNombre && (
                          <span className="block text-tinta-3">{p.profesionalNombre}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <TipoPagoChip tipo={p.tipo} />
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-1.5 text-tinta-2">
                          <span
                            aria-hidden
                            className="size-2.5 shrink-0 rounded-sm"
                            style={{ background: COLOR_METODO[p.metodo] }}
                          />
                          {ETIQUETA_METODO[p.metodo]}
                        </span>
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
    </>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-tinta-3">
        {titulo}
      </span>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

function Filtro({
  href,
  activo,
  color,
  children,
}: {
  href: string;
  activo: boolean;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${
        activo ? "bg-acento text-white" : "text-tinta-2 hover:bg-superficie-2 hover:text-tinta-1"
      }`}
    >
      {color && <span aria-hidden className="size-2 rounded-sm" style={{ background: color }} />}
      {children}
    </Link>
  );
}
