import Link from "next/link";
import { plata, porcentaje } from "@/lib/dinero";
import { fechaLarga, hora } from "@/lib/fechas";
import { calcularSena } from "@/lib/precios";
import { pagosDeTurno } from "@/lib/repo/pagos";
import { obtenerServicio } from "@/lib/repo/servicios";
import { tarifario } from "@/lib/precios";
import type { MetodoPago, TurnoDetalle, Usuario } from "@/lib/types";
import { Boton, Chip, Panel, estiloBoton } from "@/components/ui";
import { EstadoPagoChip, EstadoTurnoChip, OrigenChip, TipoPagoChip } from "@/components/estados";
import { COLOR_METODO, ETIQUETA_METODO } from "@/components/graficos";
import FormularioPago from "./FormularioPago";
import { accionCambiarEstado, accionEliminarTurno, accionSenaSugerida } from "./acciones";

export default function PanelTurno({
  turno,
  metodos,
  usuario,
  hrefCerrar,
}: {
  turno: TurnoDetalle;
  metodos: MetodoPago[];
  usuario: Usuario;
  hrefCerrar: string;
}) {
  const servicio = obtenerServicio(turno.servicioId);
  const pagos = pagosDeTurno(turno.id);
  const restante = turno.precioBase - turno.pagado;
  const senaEsperada = servicio ? calcularSena(servicio) : 0;
  const faltaSena = Math.max(senaEsperada - turno.pagado, 0);
  const cobradoReal = pagos
    .filter((p) => p.estado === "confirmado")
    .reduce((acc, p) => acc + p.montoTotal, 0);

  return (
    <div className="space-y-3">
      <Panel
        titulo={turno.clienteNombre}
        descripcion={`${fechaLarga(turno.inicio)} · ${hora(turno.inicio)}–${hora(turno.fin)}`}
        acciones={
          <Link href={hrefCerrar} scroll={false} className={estiloBoton("fantasma")} title="Cerrar">
            ✕
          </Link>
        }
      >
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-1.5">
            <EstadoTurnoChip estado={turno.estado} />
            <OrigenChip origen={turno.origen} />
            {!turno.senaCubierta && turno.estado !== "cancelado" && (
              <Chip tono="aviso">seña sin cubrir</Chip>
            )}
          </div>

          <dl className="space-y-1.5">
            <Dato termino="Servicio" valor={turno.servicioNombre} />
            <Dato
              termino="Profesional"
              valor={
                <span className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="size-2.5 rounded-sm"
                    style={{ background: turno.profesionalColor }}
                  />
                  {turno.profesionalNombre}
                </span>
              }
            />
            <Dato termino="WhatsApp" valor={<span className="tabular">{turno.clienteTelefono}</span>} />
            <Dato
              termino="Precio general"
              valor={<span className="tabular font-semibold">{plata(turno.precioBase)}</span>}
            />
            <Dato
              termino="Seña del servicio"
              valor={
                <span className="tabular">
                  {plata(senaEsperada)}
                  {servicio?.senaTipo === "porcentaje" ? ` (${servicio.senaValor}%)` : ""}
                </span>
              }
            />
            <Dato
              termino="Imputado"
              valor={<span className="tabular">{plata(turno.pagado)} a precio general</span>}
            />
            <Dato
              termino="Falta"
              valor={
                <span className={`tabular font-semibold ${restante > 0 ? "text-aviso" : "text-ok"}`}>
                  {plata(Math.max(restante, 0))}
                </span>
              }
            />
            <Dato
              termino="Entró en caja"
              valor={<span className="tabular font-semibold text-tinta-1">{plata(cobradoReal)}</span>}
            />
          </dl>

          {turno.notas && (
            <p className="rounded-lg border border-borde bg-superficie-2 px-3 py-2 text-xs leading-relaxed text-tinta-2">
              {turno.notas}
            </p>
          )}

          {faltaSena > 0 && turno.estado !== "cancelado" && (
            <div className="rounded-lg border border-aviso/30 bg-aviso-fondo px-3 py-2">
              <p className="text-xs font-semibold text-aviso">
                Falta seña por {plata(faltaSena)} (a precio general)
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {metodos
                  .filter((m) => m.activo)
                  .map((m) => (
                    <form key={m.clave} action={accionSenaSugerida}>
                      <input type="hidden" name="turnoId" value={turno.id} />
                      <input type="hidden" name="metodo" value={m.clave} />
                      <Boton variante="secundario" title={`Registrar la seña en ${m.etiqueta}`}>
                        <span
                          aria-hidden
                          className="size-2 rounded-sm"
                          style={{ background: COLOR_METODO[m.clave] }}
                        />
                        {ETIQUETA_METODO[m.clave]}
                      </Boton>
                    </form>
                  ))}
              </div>
              <p className="mt-1.5 text-[0.7rem] text-tinta-3">
                Registra la seña completa con el ajuste del método elegido.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 border-t border-borde pt-3">
            {(["confirmado", "completado", "ausente", "cancelado"] as const)
              .filter((e) => e !== turno.estado)
              .map((e) => (
                <form key={e} action={accionCambiarEstado}>
                  <input type="hidden" name="turnoId" value={turno.id} />
                  <input type="hidden" name="estado" value={e} />
                  <Boton variante={e === "cancelado" ? "peligro" : "secundario"}>
                    {
                      {
                        confirmado: "Confirmar",
                        completado: "Marcar hecho",
                        ausente: "No vino",
                        cancelado: "Cancelar",
                      }[e]
                    }
                  </Boton>
                </form>
              ))}
            {usuario.rol === "dueno" && (
              <form action={accionEliminarTurno}>
                <input type="hidden" name="turnoId" value={turno.id} />
                <Boton variante="fantasma" title="Borrar el turno del todo">
                  Borrar
                </Boton>
              </form>
            )}
          </div>
        </div>
      </Panel>

      <Panel
        titulo="Precio según cómo pague"
        descripcion="Es la misma tabla que informa el bot por WhatsApp."
      >
        <ul className="space-y-1.5 text-sm">
          {tarifario(turno.precioBase, metodos).map((t) => (
            <li key={t.metodo} className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-sm"
                  style={{ background: COLOR_METODO[t.metodo] }}
                />
                <span className="truncate text-tinta-2">{t.etiqueta}</span>
                <span className="shrink-0 text-[0.7rem] text-tinta-3">
                  {porcentaje(t.ajustePct)}
                </span>
              </span>
              <span className="tabular shrink-0 font-semibold text-tinta-1">{plata(t.total)}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel titulo="Registrar un pago">
        <FormularioPago
          turnoId={turno.id}
          metodos={metodos}
          restante={Math.max(restante, 0)}
          senaSugerida={faltaSena}
        />
      </Panel>

      {pagos.length > 0 && (
        <Panel titulo="Pagos de este turno" sinPadding>
          <ul className="divide-y divide-borde">
            {pagos.map((p) => (
              <li key={p.id} className="px-4 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <TipoPagoChip tipo={p.tipo} />
                    <span className="flex items-center gap-1 text-xs text-tinta-2">
                      <span
                        aria-hidden
                        className="size-2 rounded-sm"
                        style={{ background: COLOR_METODO[p.metodo] }}
                      />
                      {ETIQUETA_METODO[p.metodo]}
                    </span>
                  </span>
                  <EstadoPagoChip estado={p.estado} />
                </div>
                <p className="tabular mt-1 text-xs text-tinta-3">
                  {plata(p.montoBase)} {porcentaje(p.ajustePct)}{" "}
                  {p.ajusteMonto !== 0 && (
                    <span className={p.ajusteMonto > 0 ? "text-ok" : "text-aviso"}>
                      ({p.ajusteMonto > 0 ? "+" : ""}
                      {plata(p.ajusteMonto)})
                    </span>
                  )}{" "}
                  →{" "}
                  <strong className="text-tinta-1">{plata(p.montoTotal)}</strong>
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

function Dato({ termino, valor }: { termino: string; valor: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-tinta-3">{termino}</dt>
      <dd className="min-w-0 text-right text-tinta-1">{valor}</dd>
    </div>
  );
}
