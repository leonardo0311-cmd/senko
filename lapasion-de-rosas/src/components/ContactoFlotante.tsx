"use client";

import { useEffect, useState } from "react";
import { enlaceWhatsapp, mensajePorDefecto } from "@/lib/whatsapp";
import { medir } from "@/lib/analitica";

/**
 * Acceso flotante a WhatsApp.
 *
 * Discreto: aparece recién después de la portada, respeta las áreas seguras
 * del teléfono y no abre ninguna ventana por su cuenta. Si todavía no hay un
 * número oficial confirmado, no se muestra.
 */
export function ContactoFlotante() {
  const [visible, setVisible] = useState(false);
  const enlace = enlaceWhatsapp(mensajePorDefecto);

  useEffect(() => {
    if (!enlace) return;

    let pendiente = false;
    const alScrollear = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => {
        setVisible(window.scrollY > window.innerHeight * 0.7);
        pendiente = false;
      });
    };

    alScrollear();
    window.addEventListener("scroll", alScrollear, { passive: true });
    return () => window.removeEventListener("scroll", alScrollear);
  }, [enlace]);

  if (!enlace) return null;

  return (
    <a
      href={enlace}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => medir("whatsapp_click", { origen: "flotante" })}
      aria-label="Consultar por WhatsApp"
      className={`fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-40
                  flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-full border border-oro/35 bg-carbon/90
                  text-oro shadow-[0_6px_24px_rgba(0,0,0,0.5)] backdrop-blur-md
                  transition-[opacity,transform,background-color,color] duration-400 ease-[var(--ease-suave)]
                  hover:bg-oro hover:text-carbon motion-reduce:transition-none
                  ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden fill="currentColor">
        <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.48 1.34 5L2 22l5.17-1.36a9.93 9.93 0 0 0 4.87 1.24h.01c5.5 0 9.96-4.46 9.96-9.96 0-2.66-1.04-5.16-2.92-7.04A9.88 9.88 0 0 0 12.04 2Zm0 18.18h-.01a8.26 8.26 0 0 1-4.21-1.15l-.3-.18-3.07.8.82-2.99-.2-.31a8.24 8.24 0 0 1-1.26-4.39c0-4.56 3.71-8.27 8.28-8.27 2.21 0 4.29.86 5.85 2.43a8.22 8.22 0 0 1 2.42 5.85c0 4.57-3.71 8.28-8.32 8.28Zm4.54-6.2c-.25-.13-1.47-.73-1.7-.81-.23-.08-.39-.13-.56.12-.17.25-.64.81-.79.98-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.87.86-.87 2.08 0 1.23.89 2.42 1.02 2.58.12.17 1.76 2.68 4.26 3.76.59.26 1.06.41 1.42.52.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.11-.22-.17-.47-.29Z" />
      </svg>
    </a>
  );
}
