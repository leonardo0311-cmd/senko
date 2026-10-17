"use client";

import { useEffect, useRef } from "react";
import { textos } from "@content/site";
import { videoPortada } from "@content/medios";
import { Medio } from "./ui/Medio";
import { BotonEnlace } from "./ui/Boton";
import { medir } from "@/lib/analitica";
import { nivelMovimiento } from "@/lib/motion";

/**
 * Portada cinematográfica.
 *
 * Usa el video real del restaurante si está cargado en content/medios.ts.
 * Si no lo está, o si el navegador no puede reproducirlo, cae en la imagen
 * de portada. El texto siempre se lee sobre una capa oscura con contraste
 * suficiente.
 */
export function HeroExperiencia() {
  const capa = useRef<HTMLDivElement>(null);

  // Parallax muy leve del fondo. Se apaga en equipos modestos y con
  // movimiento reducido.
  useEffect(() => {
    if (nivelMovimiento() !== "completo") return;
    const el = capa.current;
    if (!el) return;

    let pendiente = false;
    const alScrollear = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, window.innerHeight);
        el.style.transform = `translate3d(0, ${y * 0.18}px, 0) scale(1.06)`;
        pendiente = false;
      });
    };

    alScrollear();
    window.addEventListener("scroll", alScrollear, { passive: true });
    return () => window.removeEventListener("scroll", alScrollear);
  }, []);

  return (
    <section
      id="inicio"
      className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden"
      aria-labelledby="hero-titulo"
    >
      {/* --- Fondo --------------------------------------------------------- */}
      <div ref={capa} className="absolute inset-0 will-change-transform">
        {videoPortada.src ? (
          <VideoPortada src={videoPortada.src} />
        ) : (
          <Medio clave={videoPortada.poster} prioridad llenar sizes="100vw" compacto />
        )}
      </div>

      {/* Superposición: garantiza la lectura del texto sin aplastar la imagen */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "linear-gradient(to top, rgba(16,16,15,0.93) 0%, rgba(16,16,15,0.5) 42%, rgba(16,16,15,0.18) 72%, rgba(16,16,15,0.62) 100%)",
            "radial-gradient(90% 70% at 15% 95%, rgba(80,29,44,0.42) 0%, transparent 60%)",
          ].join(", "),
        }}
      />

      {/* --- Contenido ----------------------------------------------------- */}
      <div className="marco relative w-full pb-16 pt-[calc(var(--alto-header)+4rem)] sm:pb-20">
        <div className="max-w-4xl">
          <p className="tipo-indice mb-7 animate-[hero-aparece_1s_var(--ease-suave)_0.1s_both]">
            {textos.hero.kicker}
          </p>

          <h1 id="hero-titulo" className="tipo-display text-[clamp(2.6rem,1.1rem+6.2vw,7rem)]">
            <span className="block animate-[hero-linea_1.1s_var(--ease-suave)_0.2s_both]">
              {textos.hero.tituloLinea1}
            </span>
            <span className="block animate-[hero-linea_1.1s_var(--ease-suave)_0.34s_both]">
              {textos.hero.tituloLinea2}
            </span>
            <span className="tipo-enfasis block animate-[hero-linea_1.1s_var(--ease-suave)_0.48s_both]">
              {textos.hero.tituloEnfasis}
            </span>
          </h1>

          <p className="tipo-bajada mt-8 max-w-xl animate-[hero-aparece_1s_var(--ease-suave)_0.7s_both]">
            {textos.hero.bajada}
          </p>

          <div className="mt-10 flex flex-col gap-3 animate-[hero-aparece_1s_var(--ease-suave)_0.85s_both] sm:flex-row sm:items-center sm:gap-4">
            <BotonEnlace
              href="#reservas"
              variante="principal"
              onClick={() => medir("reserva_click", { origen: "hero" })}
            >
              {textos.hero.ctaPrimario}
            </BotonEnlace>
            <BotonEnlace href="#experiencia" variante="secundario">
              {textos.hero.ctaSecundario}
            </BotonEnlace>
          </div>
        </div>

        <IndicadorScroll />
      </div>

      <style>{`
        @keyframes hero-linea {
          from { opacity: 0; transform: translateY(0.5em); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes hero-aparece {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          [class*="animate-[hero-"] { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function VideoPortada({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    // Respetar la preferencia de movimiento: el video queda en su primer
    // fotograma, como una fotografía.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
    }
  }, []);

  return (
    <video
      ref={ref}
      className="h-full w-full object-cover"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden
      tabIndex={-1}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}

function IndicadorScroll() {
  return (
    <div className="mt-14 hidden items-center gap-4 md:flex">
      <span className="relative block h-12 w-px overflow-hidden bg-marfil/20">
        <span className="absolute inset-x-0 top-0 h-1/2 animate-[scroll-linea_2.4s_var(--ease-suave)_infinite] bg-oro" />
      </span>
      <p className="font-sans text-[0.6875rem] uppercase tracking-[0.22em] text-marfil/60">
        {textos.hero.scroll}
      </p>
      <style>{`
        @keyframes scroll-linea {
          0%   { transform: translateY(-100%); }
          55%  { transform: translateY(100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
}
