"use client";

import { useEffect } from "react";

/**
 * Activa el revelado por scroll.
 *
 * El contenido está visible en reposo (ver `.reveal` en globals.css): sólo
 * cuando sabemos que IntersectionObserver existe agregamos la clase que
 * habilita el ocultar-y-acomodar, y todo lo que ya está en pantalla se marca
 * visible de inmediato. Así nada queda nunca atascado en opacity 0.
 */
export function ActivarRevelado() {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    document.documentElement.classList.add("js-reveal-ready");

    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      },
      { threshold: 0.16, rootMargin: "0px 0px -6% 0px" },
    );

    const marcar = () => {
      document.querySelectorAll<HTMLElement>(".reveal:not(.in)").forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight * 1.05) el.classList.add("in");
        else io.observe(el);
      });
    };

    marcar();
    // La carta se re-renderiza al cambiar de idioma: volvemos a mirar.
    const timer = window.setInterval(marcar, 1200);

    // Red de seguridad: si el observer no llega a disparar —un visor embebido,
    // un scroll que se maneja distinto— el contenido no puede quedar atrapado
    // en opacidad cero. Pasados unos segundos, se muestra todo.
    const red = window.setTimeout(() => {
      document.querySelectorAll(".reveal:not(.in)").forEach((el) => el.classList.add("in"));
    }, 4000);

    return () => {
      io.disconnect();
      window.clearInterval(timer);
      window.clearTimeout(red);
      document.documentElement.classList.remove("js-reveal-ready");
    };
  }, []);

  return null;
}
