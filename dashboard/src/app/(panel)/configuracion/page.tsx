import { exigirDueno } from "@/lib/auth";
import { plata, porcentaje } from "@/lib/dinero";
import { calcularSena, tarifario } from "@/lib/precios";
import { listarMetodosPago, obtenerAjustes } from "@/lib/repo/config";
import { listarServicios } from "@/lib/repo/servicios";
import Encabezado from "@/components/Encabezado";
import { COLOR_METODO, LeyendaMetodos } from "@/components/graficos";
import { Boton, Chip, Panel, Scroll, Vacio } from "@/components/ui";
import { accionEliminarServicio } from "./acciones";
import FormularioAjustes from "./FormularioAjustes";
import FormularioMetodos from "./FormularioMetodos";
import FormularioServicio from "./FormularioServicio";

export const metadata = { title: "Configuración · Senko" };

export default async function PaginaConfiguracion({
  searchParams,
}: {
  searchParams: Promise<{ servicio?: string }>;
}) {
  await exigirDueno();

  const { servicio: servicioId } = await searchParams;
  const metodos = listarMetodosPago();
  const servicios = listarServicios(false);
  const ajustes = obtenerAjustes();

  const enEdicion = servicios.find((s) => s.id === servicioId);
  const precioEjemplo = servicios[0]?.precioBase ?? 1000000;

  return (
    <>
      <Encabezado
        titulo="Configuración"
        descripcion="Los porcentajes de cada método de pago, los servicios con su precio general y su seña, y los datos que el bot usa para cobrar."
      />

      <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <Panel
          titulo="Porcentajes por método de pago"
          descripcion="Hay un precio general por servicio. Acá definís cuánto se le suma si paga con tarjeta y cuánto se le descuenta si paga en efectivo o por transferencia."
        >
          <FormularioMetodos metodos={metodos} precioEjemplo={precioEjemplo} />
        </Panel>

        <div className="space-y-3">
          <Panel titulo="Datos del negocio y de la seña">
            <FormularioAjustes ajustes={ajustes} />
          </Panel>

          <Panel titulo="Cómo se arma el precio final">
            <ol className="space-y-2 text-xs leading-relaxed text-tinta-2">
              <li>
                <strong className="text-tinta-1">1.</strong> El servicio tiene un precio general
                (sin ajustes).
              </li>
              <li>
                <strong className="text-tinta-1">2.</strong> La seña se calcula sobre ese precio
                general.
              </li>
              <li>
                <strong className="text-tinta-1">3.</strong> Cada pago (seña o saldo) lleva el
                ajuste del método con el que lo pagan.
              </li>
              <li>
                <strong className="text-tinta-1">4.</strong> Así el cliente puede señar por
                transferencia con descuento y pagar el saldo con tarjeta con recargo, y cada tramo
                queda con su propio porcentaje.
              </li>
            </ol>
            <div className="mt-3 border-t border-borde pt-3">
              <LeyendaMetodos />
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <Panel
          titulo="Servicios"
          descripcion="El precio general de cada uno y la seña que pide el bot para reservar."
          sinPadding
        >
          {servicios.length === 0 ? (
            <Vacio>Todavía no cargaste servicios.</Vacio>
          ) : (
            <Scroll>
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-borde text-left text-[0.7rem] font-semibold uppercase tracking-wide text-tinta-3">
                    <th className="px-3 py-2.5">Servicio</th>
                    <th className="px-3 py-2.5 text-right">Precio general</th>
                    <th className="px-3 py-2.5 text-right">Seña</th>
                    <th className="px-3 py-2.5 text-right">Dura</th>
                    <th className="px-3 py-2.5">Precio según método</th>
                    <th className="px-3 py-2.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {servicios.map((s) => (
                    <tr key={s.id} className="border-b border-borde last:border-0">
                      <td className="px-3 py-2.5">
                        <span className="flex flex-wrap items-center gap-1.5 font-medium text-tinta-1">
                          {s.nombre}
                          {!s.activo && <Chip tono="grave">inactivo</Chip>}
                        </span>
                      </td>
                      <td className="tabular px-3 py-2.5 text-right font-semibold text-tinta-1">
                        {plata(s.precioBase)}
                      </td>
                      <td className="tabular px-3 py-2.5 text-right text-tinta-2">
                        {plata(calcularSena(s))}
                        <span className="block text-[0.7rem] text-tinta-3">
                          {s.senaTipo === "porcentaje" ? `${s.senaValor}%` : "fijo"}
                        </span>
                      </td>
                      <td className="tabular px-3 py-2.5 text-right text-tinta-2">
                        {s.duracionMin}′
                      </td>
                      <td className="px-3 py-2.5">
                        <ul className="flex flex-wrap gap-x-3 gap-y-1">
                          {tarifario(s.precioBase, metodos).map((t) => (
                            <li key={t.metodo} className="flex items-center gap-1 text-xs">
                              <span
                                aria-hidden
                                className="size-2 shrink-0 rounded-sm"
                                style={{ background: COLOR_METODO[t.metodo] }}
                              />
                              <span className="tabular text-tinta-1">{plata(t.total)}</span>
                              <span className="text-[0.7rem] text-tinta-3">
                                {porcentaje(t.ajustePct)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-end gap-1.5">
                          <a
                            href={`/configuracion?servicio=${s.id}`}
                            className="rounded-lg px-2 py-1 text-xs font-semibold text-tinta-2 hover:bg-superficie-2 hover:text-tinta-1"
                          >
                            Editar
                          </a>
                          <form action={accionEliminarServicio}>
                            <input type="hidden" name="servicioId" value={s.id} />
                            <Boton
                              variante="fantasma"
                              title="Si ya tiene turnos cargados queda inactivo en lugar de borrarse."
                            >
                              Quitar
                            </Boton>
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

        <Panel
          titulo={enEdicion ? `Editar "${enEdicion.nombre}"` : "Agregar servicio"}
          acciones={
            enEdicion ? (
              <a
                href="/configuracion"
                className="rounded-lg px-2 py-1 text-xs font-semibold text-tinta-2 hover:bg-superficie-2 hover:text-tinta-1"
              >
                Cancelar
              </a>
            ) : undefined
          }
        >
          <FormularioServicio key={enEdicion?.id ?? "nuevo"} servicio={enEdicion} />
        </Panel>
      </div>

      <div className="mt-3">
        <Panel
          titulo="Conexión con el bot de WhatsApp"
          descripcion="El bot de tu socio usa esta misma base, así que el calendario es uno solo. Estos son los endpoints que tiene que llamar."
        >
          <Scroll>
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-borde text-left text-[0.7rem] font-semibold uppercase tracking-wide text-tinta-3">
                  <th className="px-2 py-2">Método</th>
                  <th className="px-2 py-2">Endpoint</th>
                  <th className="px-2 py-2">Para qué sirve</th>
                </tr>
              </thead>
              <tbody className="tabular">
                {[
                  ["GET", "/api/bot/catalogo", "Servicios, profesionales, señas y precio según método."],
                  ["GET", "/api/bot/disponibilidad", "Huecos libres de un profesional para un día."],
                  ["POST", "/api/bot/turnos", "Crear el turno cuando el cliente elige horario."],
                  ["PATCH", "/api/bot/turnos/:id", "Mover, confirmar o cancelar un turno."],
                  ["POST", "/api/bot/senas", "Registrar la seña que informó el cliente."],
                  ["GET", "/api/bot/notificaciones", "Avisos sin mandar, para reenviar por WhatsApp."],
                ].map(([verbo, ruta, uso]) => (
                  <tr key={ruta + verbo} className="border-b border-borde last:border-0">
                    <td className="px-2 py-2">
                      <Chip tono="acento">{verbo}</Chip>
                    </td>
                    <td className="px-2 py-2 font-mono text-xs text-tinta-1">{ruta}</td>
                    <td className="px-2 py-2 font-sans text-tinta-2">{uso}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Scroll>
          <p className="mt-3 text-xs leading-relaxed text-tinta-3">
            Todos piden la cabecera{" "}
            <code className="rounded bg-superficie-2 px-1 py-0.5 font-mono">x-senko-bot-key</code>{" "}
            con el valor de la variable de entorno{" "}
            <code className="rounded bg-superficie-2 px-1 py-0.5 font-mono">SENKO_BOT_API_KEY</code>.
            El detalle de cada uno está en{" "}
            <code className="rounded bg-superficie-2 px-1 py-0.5 font-mono">docs/API-BOT.md</code>.
          </p>
        </Panel>
      </div>
    </>
  );
}
