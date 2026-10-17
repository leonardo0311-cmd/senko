import { Revelar } from "./Revelar";

type Props = {
  /** Id del <h2>, para enlazarlo con el aria-labelledby de la sección. */
  tituloId?: string;
  indice?: string;
  etiqueta?: string;
  titulo: string;
  enfasis?: string;
  bajada?: string;
  /** Centra el bloque. Por defecto queda alineado a la izquierda. */
  centrado?: boolean;
  className?: string;
};

/** Encabezado editorial reutilizable: índice, título serif y bajada. */
export function EncabezadoSeccion({
  tituloId,
  indice,
  etiqueta,
  titulo,
  enfasis,
  bajada,
  centrado,
  className = "",
}: Props) {
  return (
    <div className={`${centrado ? "mx-auto max-w-3xl text-center" : "max-w-3xl"} ${className}`}>
      {(indice || etiqueta) && (
        <Revelar como="p" className="tipo-indice mb-6 flex items-center gap-3" distancia="0.75rem">
          {indice && <span>{indice}</span>}
          {indice && etiqueta && <span className="h-px w-8 bg-oro/40" aria-hidden />}
          {etiqueta && <span>{etiqueta}</span>}
        </Revelar>
      )}

      <Revelar
        como="h2"
        id={tituloId}
        retraso={80}
        className="tipo-titulo text-[clamp(2.1rem,1.3rem+3.3vw,4.25rem)]"
      >
        {titulo}
        {enfasis && (
          <>
            {" "}
            <span className="tipo-enfasis">{enfasis}</span>
          </>
        )}
      </Revelar>

      {bajada && (
        <Revelar como="p" retraso={160} className={`tipo-bajada mt-7 ${centrado ? "mx-auto" : ""} max-w-xl`}>
          {bajada}
        </Revelar>
      )}
    </div>
  );
}
