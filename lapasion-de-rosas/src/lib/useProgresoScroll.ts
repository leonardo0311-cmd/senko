"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Progreso del scroll a través de un elemento, como número 0→1.
 *
 * Escribe en una ref en lugar de en el estado de React: el valor se lee desde
 * un bucle de animación, así que no hace falta volver a renderizar en cada
 * fotograma. Es lo que permite que el efecto de brasas no toque el árbol de
 * React mientras corre.
 *
 *   0   -> la sección todavía no entró (o ya salió)
 *   1   -> la sección está centrada en la ventana
 */
export function useProgresoScroll(ref: RefObject<HTMLElement | null>) {
  const progreso = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let pendiente = false;
    let activo = false;

    const calcular = () => {
      pendiente = false;
      const rect = el.getBoundingClientRect();
      const ventana = window.innerHeight;

      // Distancia entre el centro de la sección y el centro de la ventana,
      // normalizada contra el recorrido total en el que la sección es visible.
      const centroSeccion = rect.top + rect.height / 2;
      const centroVentana = ventana / 2;
      const recorrido = (rect.height + ventana) / 2;
      const distancia = Math.abs(centroSeccion - centroVentana);

      progreso.current = Math.max(0, Math.min(1, 1 - distancia / recorrido));
    };

    const alScrollear = () => {
      if (pendiente || !activo) return;
      pendiente = true;
      requestAnimationFrame(calcular);
    };

    const observador = new IntersectionObserver(
      ([entrada]) => {
        activo = entrada.isIntersecting;
        if (activo) calcular();
        else progreso.current = 0;
      },
      { rootMargin: "20% 0px" },
    );
    observador.observe(el);

    window.addEventListener("scroll", alScrollear, { passive: true });
    window.addEventListener("resize", alScrollear, { passive: true });
    calcular();

    return () => {
      observador.disconnect();
      window.removeEventListener("scroll", alScrollear);
      window.removeEventListener("resize", alScrollear);
    };
  }, [ref]);

  return progreso;
}
