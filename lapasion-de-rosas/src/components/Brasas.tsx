"use client";

import { useEffect, useRef } from "react";
import { nivelMovimiento, alCambiarPreferencia, type NivelMovimiento } from "@/lib/motion";

/**
 * Brasas que ascienden por el calor.
 *
 * Decisiones de implementación:
 *  - Un único <canvas> 2D en lugar de cientos de nodos del DOM.
 *  - El sprite de la chispa se dibuja una sola vez en un canvas auxiliar y
 *    después se estampa: evita crear un degradado radial por partícula y por
 *    fotograma, que es lo que suele hundir el rendimiento de estos efectos.
 *  - El bucle sólo corre mientras la sección está en pantalla.
 *  - La densidad se ajusta al equipo; con movimiento reducido no se dibuja
 *    nada y queda la composición estática de la sección.
 */

type Chispa = {
  x: number;
  y: number;
  /** Radio en píxeles CSS. */
  r: number;
  /** Velocidad de ascenso. */
  vy: number;
  /** Fase y amplitud de la deriva lateral: cada chispa va a su ritmo. */
  fase: number;
  deriva: number;
  /** Vida normalizada 0→1. */
  vida: number;
  duracion: number;
  /** Las más brillantes son las menos. */
  brillo: number;
};

const DENSIDAD: Record<NivelMovimiento, number> = {
  completo: 110,
  reducido: 34,
  nulo: 0,
};

export function Brasas({
  /** 0 → apagado, 1 → intensidad plena. Lo controla el scroll de la sección. */
  intensidadRef,
  className = "",
}: {
  intensidadRef: React.RefObject<number>;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let nivel = nivelMovimiento();
    let maximo = DENSIDAD[nivel];
    if (maximo === 0) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let ancho = 0;
    let alto = 0;
    let dpr = 1;
    let chispas: Chispa[] = [];
    let raf = 0;
    let visible = false;
    let ultimo = performance.now();

    /* --- Sprite de la chispa (se dibuja una sola vez) -------------------- */
    const sprite = document.createElement("canvas");
    const LADO = 64;
    sprite.width = LADO;
    sprite.height = LADO;
    const sctx = sprite.getContext("2d");
    if (sctx) {
      const g = sctx.createRadialGradient(LADO / 2, LADO / 2, 0, LADO / 2, LADO / 2, LADO / 2);
      g.addColorStop(0, "rgba(255, 226, 180, 1)");
      g.addColorStop(0.28, "rgba(213, 121, 57, 0.85)");
      g.addColorStop(0.62, "rgba(160, 68, 28, 0.28)");
      g.addColorStop(1, "rgba(120, 44, 18, 0)");
      sctx.fillStyle = g;
      sctx.fillRect(0, 0, LADO, LADO);
    }

    /* --- Ciclo de vida de una chispa ------------------------------------- */
    const nacer = (inicial = false): Chispa => {
      // Unas pocas chispas grandes y brillantes; el resto, casi imperceptibles.
      const grande = Math.random() < 0.16;
      return {
        x: Math.random() * ancho,
        y: inicial ? Math.random() * alto : alto + Math.random() * 40,
        r: grande ? 1.6 + Math.random() * 1.9 : 0.45 + Math.random() * 0.9,
        vy: (grande ? 14 : 22) + Math.random() * 26,
        fase: Math.random() * Math.PI * 2,
        deriva: 6 + Math.random() * 20,
        vida: inicial ? Math.random() : 0,
        duracion: 3.4 + Math.random() * 4.2,
        brillo: grande ? 0.5 + Math.random() * 0.45 : 0.12 + Math.random() * 0.3,
      };
    };

    /* --- Dimensionado ----------------------------------------------------- */
    const medir = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      ancho = rect.width;
      alto = rect.height;
      canvas.width = Math.round(ancho * dpr);
      canvas.height = Math.round(alto * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Densidad proporcional al área, acotada por el presupuesto del equipo.
      const objetivo = Math.min(maximo, Math.round((ancho * alto) / 11000));
      chispas = Array.from({ length: objetivo }, () => nacer(true));
    };

    /* --- Bucle ------------------------------------------------------------ */
    const dibujar = (ahora: number) => {
      raf = requestAnimationFrame(dibujar);

      // delta acotado: si la pestaña estuvo en segundo plano, no saltar.
      const dt = Math.min((ahora - ultimo) / 1000, 0.05);
      ultimo = ahora;

      const intensidad = Math.max(0, Math.min(1, intensidadRef.current ?? 0));
      ctx.clearRect(0, 0, ancho, alto);

      if (intensidad <= 0.01) return;

      ctx.globalCompositeOperation = "lighter";

      for (const c of chispas) {
        c.vida += dt / c.duracion;
        if (c.vida >= 1) {
          Object.assign(c, nacer());
          continue;
        }

        c.y -= c.vy * dt;
        c.fase += dt * 0.9;
        const x = c.x + Math.sin(c.fase) * c.deriva;

        // Aparece y se apaga progresivamente dentro de su propia vida.
        const curva = Math.sin(c.vida * Math.PI);
        const alfa = curva * c.brillo * intensidad;
        if (alfa <= 0.004) continue;

        // Las chispas se encogen a medida que se enfrían.
        const r = c.r * (1.15 - c.vida * 0.4) * 5;

        ctx.globalAlpha = alfa;
        ctx.drawImage(sprite, x - r, c.y - r, r * 2, r * 2);
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    const arrancar = () => {
      if (raf) return;
      ultimo = performance.now();
      raf = requestAnimationFrame(dibujar);
    };

    const frenar = () => {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
      ctx.clearRect(0, 0, ancho, alto);
    };

    /* --- Sólo animar lo que se ve ---------------------------------------- */
    const observador = new IntersectionObserver(
      ([entrada]) => {
        visible = entrada.isIntersecting;
        if (visible) arrancar();
        else frenar();
      },
      { rootMargin: "20% 0px" },
    );
    observador.observe(canvas);

    const alCambiarVisibilidad = () => {
      if (document.hidden) frenar();
      else if (visible) arrancar();
    };
    document.addEventListener("visibilitychange", alCambiarVisibilidad);

    /* --- Redimensionado --------------------------------------------------- */
    let temporizador = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(temporizador);
      temporizador = window.setTimeout(medir, 150);
    });
    ro.observe(canvas);

    // Si el visitante cambia la preferencia del sistema, obedecer en caliente.
    const quitarPreferencia = alCambiarPreferencia((reducido) => {
      nivel = reducido ? "nulo" : nivelMovimiento();
      maximo = DENSIDAD[nivel];
      if (maximo === 0) {
        frenar();
        chispas = [];
      } else {
        medir();
        if (visible) arrancar();
      }
    });

    medir();

    return () => {
      frenar();
      observador.disconnect();
      ro.disconnect();
      quitarPreferencia();
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      window.clearTimeout(temporizador);
    };
  }, [intensidadRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
