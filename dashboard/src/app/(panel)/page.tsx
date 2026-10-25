import Link from "next/link";
import { redirect } from "next/navigation";
import { exigirSesion } from "@/lib/auth";
import { plata } from "@/lib/dinero";
import {
  addDays,
  esPeriodo,
  etiquetaPeriodo,
  fechaLarga,
  hora,
  rangoDePeriodo,
  startOfDay,
} from "@/lib/fechas";
import { listarPagos } from "@/lib/repo/pagos";
import {
  resumenPorCliente,
  serieDiaria,
  totalesPeriodo,
  totalesPorProfesional,
} from "@/lib/repo/reportes";
import { listarTurnos } from "@/lib/repo/turnos";
import Encabezado from "@/components/Encabezado";
import SelectorPeriodo from "@/components/SelectorPeriodo";
import { EstadoTurnoChip, OrigenChip } from "@/components/estados";
import { BarraMetodos, SerieDiaria } from "@/components/graficos";
import { Chip, Kpi, Panel, Vacio, estiloBoton } from "@/components/ui";

export const metadata = { title: "Resumen · Senko" };

export default async function PaginaResumen({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const usuario = await exigirSesion();
  // Un profesional no ve la facturacion del negocio: va derecho a su agenda.
  if (usuario.rol !== "dueno") redirect("/calendario");

  const { periodo: periodoParam } = await searchParams;
  const periodo = esPeriodo(periodoParam);
  const rango = rangoDePeriodo(periodo);

  const totales = totalesPeriodo(rango);
  const serie = serieDiaria(rango);
  const porProfesional = totalesPorProfesional(rango);
  const topClientes = resumenPorCliente(rango)
    .filter((r) => r.totalCobrado > 0)
    .slice(0, 6);

  const inicioHoy = startOfDay(new Date());
  const turnosHoy = listarTurnos({
    desde: inicioHoy.toISOString(),
    hasta: addDays(inicioHoy, 1).toISOString(),
  });
  const activosHoy = turnosHoy.filter((t) => t.estado !== "cancelado" && t.estado !== "ausente");

  const senasPorAcreditar = listarPagos({
    tipo: "sena",
    estado: "pendiente",
    limite: 8,
  });

  return (
    <>
      <Encabezado
        titulo={`Hola, ${usuario.nombre.split(" ")[0]}`}
        descripcion={`${fechaLarga(new Date().toISOString())} · ${activosHoy.length} ${
          activosHoy.length === 1 ? "turno" : "turnos"
        } hoy`}
      >
        <SelectorPeriodo actual={periodo} />
      </Encabezado>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          etiqueta="Cobrado"
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
          detalle={`${totales.cantidadSenasPendientes} ${
            totales.cantidadSenasPendientes === 1 ? "transferencia" : "transferencias"
          } sin confirmar`}
        />
        <Kpi
          etiqueta="Saldo por cobrar"
          valor={plata(totales.saldoPorCobrar)}
          detalle="Turnos del período con saldo abierto."
        />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.3fr_1fr]">
        <Panel
          titulo="Facturación por día"
          descripcion={`Pagos acreditados en ${etiquetaPeriodo(periodo).toLowerCase()}.`}
        >
          <SerieDiaria datos={serie} alto={140} />
        </Panel>

        <Panel
          titulo="Cómo te pagan"
          descripcion="Reparto del total cobrado entre los cuatro métodos."
          acciones={
            <Link href={`/clientes?periodo=${periodo}`} className={estiloBoton("fantasma")}>
              Ver por cliente →
            </Link>
          }
        >
          <BarraMetodos desglose={totales.porMetodo} alto={14} />
        </Panel>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-3">
        <Panel
          titulo="Turnos de hoy"
          descripcion={fechaLarga(new Date().toISOString())}
          acciones={
            <Link href="/calendario" className={estiloBoton("fantasma")}>
              Calendario →
            </Link>
          }
          sinPadding
        >
          {turnosHoy.length === 0 ? (
            <Vacio>No hay turnos para hoy.</Vacio>
          ) : (
            <ul className="max-h-[320px] divide-y divide-borde overflow-y-auto">
              {turnosHoy.map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <span
                      aria-hidden
                      className="mt-1 h-7 w-[3px] shrink-0 rounded-full"
                      style={{ background: t.profesionalColor }}
                    />
                    <div className="min-w-0">
                      <p className="tabular text-sm font-semibold text-tinta-1">
                        {hora(t.inicio)}{" "}
                        <span className="font-normal">{t.clienteNombre}</span>
                      </p>
                      <p className="truncate text-xs text-tinta-3">
                        {t.servicioNombre} · {t.profesionalNombre}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <EstadoTurnoChip estado={t.estado} />
                    {!t.senaCubierta && t.estado !== "cancelado" && (
                      <Chip tono="aviso">sin seña</Chip>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          titulo="Señas por acreditar"
          acciones={
            <Link href="/senas" className={estiloBoton("fantasma")}>
              Ver todas →
            </Link>
          }
          sinPadding
        >
          {senasPorAcreditar.length === 0 ? (
            <Vacio>No hay señas esperando confirmación.</Vacio>
          ) : (
            <ul className="divide-y divide-borde">
              {senasPorAcreditar.map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-tinta-1">{p.clienteNombre}</p>
                    <p className="truncate text-xs text-tinta-3">
                      {p.servicioNombre ?? "sin turno"}
                      {p.referencia ? ` · ${p.referencia}` : ""}
                    </p>
                  </div>
                  <span className="tabular shrink-0 text-sm font-semibold text-aviso">
                    {plata(p.montoTotal)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          titulo="Clientes que más gastaron"
          descripcion={etiquetaPeriodo(periodo)}
          acciones={
            <Link href={`/clientes?periodo=${periodo}`} className={estiloBoton("fantasma")}>
              Ver todos →
            </Link>
          }
          sinPadding
        >
          {topClientes.length === 0 ? (
            <Vacio>No hay cobros en el período.</Vacio>
          ) : (
            <ul className="divide-y divide-borde">
              {topClientes.map((r) => (
                <li key={r.cliente.id} className="px-4 py-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <Link
                      href={`/clientes/${r.cliente.id}?periodo=${periodo}`}
                      className="truncate text-sm font-medium text-tinta-1 underline-offset-2 hover:text-acento hover:underline"
                    >
                      {r.cliente.nombre}
                    </Link>
                    <span className="tabular shrink-0 text-sm font-semibold text-tinta-1">
                      {plata(r.totalCobrado)}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <BarraMetodos desglose={r.porMetodo} alto={5} mostrarLeyenda={false} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {porProfesional.length > 0 && (
        <div className="mt-3">
          <Panel
            titulo="Facturación por profesional"
            descripcion={`${etiquetaPeriodo(periodo)}. Solo cuenta los pagos imputados a un turno.`}
          >
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {porProfesional.map((p) => (
                <li key={p.profesionalId}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        aria-hidden
                        className="size-2.5 shrink-0 rounded-sm"
                        style={{ background: p.color }}
                      />
                      <span className="truncate text-sm font-medium text-tinta-1">{p.nombre}</span>
                    </span>
                    <span className="tabular shrink-0 text-sm font-semibold text-tinta-1">
                      {plata(p.totalCobrado)}
                    </span>
                  </div>
                  <BarraMetodos desglose={p.porMetodo} alto={6} mostrarLeyenda={false} />
                  <p className="mt-1 text-xs text-tinta-3">
                    {p.turnos} {p.turnos === 1 ? "turno" : "turnos"} en el período
                  </p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}
    </>
  );
}
