"use client";

import { useEffect, useRef } from "react";
import { useIdioma } from "@/lib/idioma";

/**
 * Cursor contextual: un punto que sigue al mouse y un anillo que lo persigue
 * con retardo. Se agranda sobre imágenes ampliables y sobre enlaces.
 * No se muestra en pantallas táctiles.
 */
export function Cursor() {
  const { t } = useIdioma();
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover:hover) and (pointer:fine)").matches) return;
    // Un cursor que persigue al puntero es movimiento: con la preferencia
    // puesta, no se dibuja.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const d = dot.current;
    const r = ring.current;
    if (!d || !r) return;

    let mx = innerWidth / 2;
    let my = innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf = 0;

    // Hasta el primer movimiento no sabemos dónde está el puntero: mostrar el
    // anillo en el centro de la pantalla se ve como un elemento suelto.
    let presentado = false;
    const mover = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!presentado) {
        presentado = true;
        rx = mx;
        ry = my;
        document.body.classList.add("has-cursor");
      }
      d.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
      arrancar();
    };

    // El bucle corre sólo mientras el anillo tiene algo que alcanzar: dejarlo
    // reencolándose para siempre despierta la GPU en una página quieta.
    let animando = false;
    const loop = () => {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      r.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      if (Math.abs(mx - rx) > 0.1 || Math.abs(my - ry) > 0.1) {
        raf = requestAnimationFrame(loop);
      } else {
        animando = false;
      }
    };
    const arrancar = () => {
      if (animando) return;
      animando = true;
      raf = requestAnimationFrame(loop);
    };

    const sobre = (e: MouseEvent) => {
      const destino = e.target as Element | null;
      if (!destino?.closest) return;
      const ver = destino.closest('[data-cursor="view"]');
      const enlace = destino.closest('a,button,[data-cursor="link"]');
      document.body.classList.toggle("cur-view", !!ver);
      document.body.classList.toggle("cur-link", !!enlace && !ver);
    };

    addEventListener("mousemove", mover, { passive: true });
    document.addEventListener("mouseover", sobre);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("mousemove", mover);
      document.removeEventListener("mouseover", sobre);
      document.body.classList.remove("has-cursor", "cur-view", "cur-link");
    };
  }, []);

  return (
    <>
      <div className="cur-dot" ref={dot} aria-hidden />
      <div className="cur-ring" ref={ring} aria-hidden>
        <span>{t("cursor_view")}</span>
      </div>
    </>
  );
}
