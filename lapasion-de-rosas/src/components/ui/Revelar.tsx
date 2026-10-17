"use client";

import {
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
} from "react";

type Props = {
  children: ReactNode;
  /** `desplazar` sube el bloque; `mascara` lo descubre de abajo hacia arriba. */
  tipo?: "desplazar" | "mascara";
  /** Retraso en milisegundos, para escalonar varios elementos. */
  retraso?: number;
  /** Distancia inicial del desplazamiento. */
  distancia?: string;
  como?: ElementType;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"div">, "children" | "className" | "style">;

/**
 * Revela un bloque cuando entra en pantalla.
 *
 * Usa IntersectionObserver y transiciones CSS: no bloquea el hilo principal
 * ni depende de una librería. El estado inicial oculto lo aplica la clase
 * `js-animaciones` del <html>, así que sin JavaScript —o con movimiento
 * reducido— el contenido se ve completo desde el primer render.
 *
 * El recorte de la variante `mascara` va SIEMPRE en un nodo interno, nunca en
 * el que se observa: un `clip-path` que achica la caja a cero hace que
 * IntersectionObserver informe una intersección nula, y el elemento quedaría
 * oculto para siempre esperando un cruce que nunca llega.
 */
export function Revelar({
  children,
  tipo = "desplazar",
  retraso = 0,
  distancia,
  como: Como = "div",
  className,
  ...resto
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!("IntersectionObserver" in window)) {
      el.classList.add("es-visible");
      return;
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          entrada.target.classList.add("es-visible");
          observador.unobserve(entrada.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.1 },
    );

    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  const estilo = {
    "--revelar-retraso": `${retraso}ms`,
    ...(distancia ? { "--revelar-y": distancia } : {}),
  } as React.CSSProperties;

  if (tipo === "mascara") {
    return (
      <Como {...resto} ref={ref} data-revelar-mascara="" className={className} style={estilo}>
        <span className="block">{children}</span>
      </Como>
    );
  }

  return (
    <Como {...resto} ref={ref} data-revelar="" className={className} style={estilo}>
      {children}
    </Como>
  );
}
