import { plata } from "@/lib/dinero";
import { METODOS_ORDEN } from "@/lib/types";
import type { DesglosePorMetodo, MetodoPagoClave } from "@/lib/types";

/**
 * Colores de los metodos de pago.
 *
 * Paleta categorica validada (deutan/tritan y contraste, en claro y oscuro).
 * El orden de la barra apilada es el de METODOS_ORDEN, elegido para que el
 * amarillo y el naranja nunca queden pegados. Ademas del color, cada metodo
 * lleva siempre su monto escrito al lado, asi la identidad nunca depende solo
 * del color.
 */
export const COLOR_METODO: Record<MetodoPagoClave, string> = {
  efectivo: "var(--m-efectivo)",
  transferencia: "var(--m-transferencia)",
  debito: "var(--m-debito)",
  credito: "var(--m-credito)",
};

export const ETIQUETA_METODO: Record<MetodoPagoClave, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  debito: "Débito",
  credito: "Crédito",
};

export const ETIQUETA_METODO_LARGA: Record<MetodoPagoClave, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia / alias",
  debito: "Tarjeta de débito",
  credito: "Tarjeta de crédito",
};

function Globo({ children }: { children: React.ReactNode }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-borde-fuerte bg-superficie-1 px-2 py-1 text-xs font-medium text-tinta-1 shadow-lg group-hover:block"
    >
      {children}
    </span>
  );
}

/**
 * Barra apilada de los 4 metodos de pago.
 * `alto` fino por defecto: la barra informa proporcion, no decora.
 */
export function BarraMetodos({
  desglose,
  alto = 10,
  mostrarLeyenda = true,
}: {
  desglose: DesglosePorMetodo;
  alto?: number;
  mostrarLeyenda?: boolean;
}) {
  const total = METODOS_ORDEN.reduce((acc, m) => acc + desglose[m], 0);
  const conMonto = METODOS_ORDEN.filter((m) => desglose[m] > 0);

  return (
    <div>
      {total <= 0 ? (
        <div
          className="w-full rounded-full bg-superficie-2"
          style={{ height: alto }}
          aria-hidden
        />
      ) : (
        <div
          className="flex w-full overflow-hidden rounded-full bg-superficie-2"
          style={{ height: alto, gap: 2 }}
          role="img"
          aria-label={`Cobrado por método: ${conMonto
            .map((m) => `${ETIQUETA_METODO[m]} ${plata(desglose[m])}`)
            .join(", ")}`}
        >
          {conMonto.map((m) => (
            <div
              key={m}
              className="group relative first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${(desglose[m] / total) * 100}%`,
                background: COLOR_METODO[m],
                minWidth: 3,
              }}
            >
              <Globo>
                {ETIQUETA_METODO[m]}: {plata(desglose[m])} (
                {Math.round((desglose[m] / total) * 100)}%)
              </Globo>
            </div>
          ))}
        </div>
      )}

      {mostrarLeyenda && (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {METODOS_ORDEN.map((m) => (
            <li key={m} className="flex items-center gap-1.5 text-xs">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-sm"
                style={{ background: COLOR_METODO[m] }}
              />
              <span className="text-tinta-2">{ETIQUETA_METODO[m]}</span>
              <span className="tabular font-semibold text-tinta-1">
                {plata(desglose[m])}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Leyenda sola, para encabezar una tabla con columnas por metodo. */
export function LeyendaMetodos() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
      {METODOS_ORDEN.map((m) => (
        <li key={m} className="flex items-center gap-1.5 text-xs text-tinta-2">
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-sm"
            style={{ background: COLOR_METODO[m] }}
          />
          {ETIQUETA_METODO_LARGA[m]}
        </li>
      ))}
    </ul>
  );
}

/** Facturacion por dia. Barras finas, punta redondeada, apoyadas en la base. */
export function SerieDiaria({
  datos,
  alto = 120,
}: {
  datos: Array<{ dia: string; total: number }>;
  alto?: number;
}) {
  if (datos.length === 0) {
    return <p className="py-6 text-center text-sm text-tinta-3">Todavía no hay cobros en este período.</p>;
  }

  const maximo = Math.max(...datos.map((d) => d.total), 1);
  const formatoDia = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" });

  return (
    <div>
      <div className="flex items-end gap-[2px]" style={{ height: alto }}>
        {datos.map((d) => {
          const altura = Math.max((d.total / maximo) * 100, d.total > 0 ? 2 : 0.8);
          const fecha = new Date(`${d.dia}T12:00:00`);
          return (
            <div
              key={d.dia}
              className="group relative flex h-full flex-1 items-end"
              style={{ minWidth: 4 }}
            >
              <div
                className="w-full rounded-t bg-acento transition-opacity group-hover:opacity-80"
                style={{
                  height: `${altura}%`,
                  background: d.total > 0 ? "var(--acento)" : "var(--borde)",
                }}
              />
              <Globo>
                {formatoDia.format(fecha)}: {plata(d.total)}
              </Globo>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[0.7rem] text-tinta-3">
        <span>{formatoDia.format(new Date(`${datos[0].dia}T12:00:00`))}</span>
        <span className="tabular">máximo {plata(maximo)}</span>
        <span>{formatoDia.format(new Date(`${datos[datos.length - 1].dia}T12:00:00`))}</span>
      </div>
    </div>
  );
}
