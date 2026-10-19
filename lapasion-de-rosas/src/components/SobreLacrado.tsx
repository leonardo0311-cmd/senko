"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const CLAVE = "lpr-sobre-visto";
/** Cuánto se queda el sobre cerrado antes de abrirse solo. */
const ESPERA = 900;
/** Lo que tarda la apertura completa, hasta que se levanta el telón. */
const DURACION = 2000;
/** Sin movimiento no hay apertura que mirar: el telón pasa rápido. */
const ESPERA_QUIETA = 700;
const DURACION_QUIETA = 500;

function sinMovimiento(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * La carta lacrada.
 *
 * Telón de bienvenida en la primera visita: un sobre cerrado con lacre que se
 * abre solo y da paso al sitio. No hay nada que tocar; un clic o una tecla
 * cualquiera lo saltean.
 *
 * Es decoración, no un diálogo: va con `aria-hidden` y no retiene el foco.
 *
 * El marcado se renderiza siempre, pero nace oculto por CSS y sólo aparece si
 * el JavaScript decide mostrarlo. Así no parpadea para quien ya entró, y sin
 * JavaScript no hay telón: el sitio queda accesible igual.
 */
export function SobreLacrado() {
  const [estado, setEstado] = useState<"oculto" | "visible" | "abriendo">("oculto");
  const abierto = useRef(false);
  const relojes = useRef<number[]>([]);

  const abrir = useCallback(() => {
    if (abierto.current) return;
    abierto.current = true;
    setEstado("abriendo");
    const fin = sinMovimiento() ? DURACION_QUIETA : DURACION;
    relojes.current.push(window.setTimeout(() => setEstado("oculto"), fin));
  }, []);

  useEffect(() => {
    let visto = false;
    // En navegación privada el acceso al almacenamiento puede lanzar.
    try {
      visto = localStorage.getItem(CLAVE) === "1";
    } catch {
      visto = false;
    }
    if (visto) return;

    try {
      localStorage.setItem(CLAVE, "1");
    } catch {
      /* sin almacenamiento el telón vuelve a aparecer: no es grave */
    }

    setEstado("visible");
    // La carta se abre sola: no hay nada que tocar.
    relojes.current.push(window.setTimeout(abrir, sinMovimiento() ? ESPERA_QUIETA : ESPERA));
  }, [abrir]);

  /*
   * Mientras el telón está puesto, el sitio de atrás no se desplaza. Y, sobre
   * todo, no anima: tapado no se ve, pero el navegador lo sigue pintando y le
   * come cuadros a la apertura. La clase pausa esas animaciones.
   */
  useEffect(() => {
    if (estado === "oculto") return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("sobre-puesto");
    return () => {
      document.body.style.overflow = previo;
      document.body.classList.remove("sobre-puesto");
    };
  }, [estado]);

  /* Cualquier tecla o clic se la saltea. */
  useEffect(() => {
    if (estado !== "visible") return;
    document.addEventListener("keydown", abrir);
    return () => document.removeEventListener("keydown", abrir);
  }, [estado, abrir]);

  useEffect(() => {
    const lista = relojes.current;
    return () => lista.forEach(window.clearTimeout);
  }, []);

  return (
    <div
      className={`sobre-capa${estado === "visible" ? " visible" : ""}${
        estado === "abriendo" ? " visible abriendo" : ""
      }`}
      onClick={abrir}
      aria-hidden
    >
      <div className="sobre">
        <div className="sobre-papel">
          {/* El fondo del sobre, que recién se ve cuando la solapa se levanta. */}
          <span className="sobre-interior" />
          <span className="sobre-solapa" />
          <Lacre />
        </div>
      </div>
    </div>
  );
}

/** El lacre: una gota irregular de cera con la R de Rosas en relieve. */
function Lacre() {
  return (
    <svg className="sobre-lacre" viewBox="0 0 200 200" aria-hidden focusable="false">
      <defs>
        {/* La cera es mate con un lustre corrido, no una esfera brillante. */}
        <radialGradient id="cera-cuerpo" cx="40%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#7e1526" />
          <stop offset="52%" stopColor="#53101a" />
          <stop offset="100%" stopColor="#24060a" />
        </radialGradient>
        <radialGradient id="cera-disco" cx="36%" cy="28%" r="82%">
          <stop offset="0%" stopColor="#9a1b39" />
          <stop offset="48%" stopColor="#6a1322" />
          <stop offset="100%" stopColor="#380910" />
        </radialGradient>
        <linearGradient id="cera-lustre" x1="0.1" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#ffd9e0" stopOpacity="0.34" />
          <stop offset="55%" stopColor="#ffd9e0" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#ffd9e0" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* La gota: borde irregular, como la cera que se derrama al volcarse */}
      <path
        d="M186.1 100.0C185.6 112.8 184.0 126.9 178.3 137.7C172.6 148.5 161.4 156.3 151.8 165.0C142.2 173.6 132.5 185.0 120.4 189.3C108.3 193.7 91.1 195.5 79.2 191.2C67.3 187.0 57.9 173.1 49.1 163.9C40.2 154.6 32.4 146.4 25.9 135.7C19.3 125.1 10.5 112.3 9.6 100.0C8.8 87.7 15.2 73.7 20.9 61.9C26.6 50.1 33.8 37.5 43.7 29.4C53.6 21.4 67.9 15.6 80.3 13.8C92.8 12.1 105.5 16.8 118.5 19.0C131.5 21.2 147.9 19.8 158.4 26.8C168.9 33.8 176.7 48.6 181.3 60.8C186.0 73.0 186.6 87.2 186.1 100.0Z"
        fill="url(#cera-cuerpo)"
      />

      {/* El disco que hunde el cuño, con su anillo */}
      <path
        d="M165.2 99.0C165.2 107.4 163.4 116.1 160.4 124.0C157.5 132.0 153.5 140.5 147.6 146.6C141.8 152.8 133.5 157.7 125.6 160.7C117.6 163.7 108.4 164.8 100.0 164.6C91.6 164.4 82.6 162.8 74.9 159.6C67.2 156.4 59.7 151.1 53.8 145.2C47.8 139.3 42.6 131.9 39.1 124.2C35.7 116.5 33.3 107.5 33.1 99.0C32.9 90.5 34.5 81.0 38.0 73.3C41.6 65.7 48.1 59.0 54.3 53.3C60.5 47.6 67.5 42.4 75.2 39.0C82.8 35.7 91.6 33.4 100.0 33.1C108.4 32.8 117.8 34.0 125.6 37.2C133.4 40.3 141.2 45.9 147.0 52.0C152.8 58.1 157.5 66.1 160.5 73.9C163.6 81.8 165.2 90.6 165.2 99.0Z"
        fill="url(#cera-disco)"
        stroke="#2c070c"
        strokeOpacity="0.7"
        strokeWidth="3.5"
      />
      <circle cx="100" cy="99" r="57" fill="none" stroke="#b22b4c" strokeOpacity="0.3" strokeWidth="2" />
      <circle cx="100" cy="99" r="53" fill="none" stroke="#2c070c" strokeOpacity="0.35" strokeWidth="1.2" />

      {/* La R en relieve: sombra hundida abajo, luz arriba */}
      <text className="sobre-lacre-r" x="101" y="102" dy="0.34em" textAnchor="middle" fill="#2a060b" opacity="0.8">
        R
      </text>
      <text className="sobre-lacre-r" x="100" y="99" dy="0.34em" textAnchor="middle" fill="#b02c4e">
        R
      </text>
      <text className="sobre-lacre-r" x="99.4" y="98.2" dy="0.34em" textAnchor="middle" fill="#e2819a" opacity="0.4">
        R
      </text>

      {/* El lustre, corrido hacia un costado */}
      <path
        d="M186.1 100.0C185.6 112.8 184.0 126.9 178.3 137.7C172.6 148.5 161.4 156.3 151.8 165.0C142.2 173.6 132.5 185.0 120.4 189.3C108.3 193.7 91.1 195.5 79.2 191.2C67.3 187.0 57.9 173.1 49.1 163.9C40.2 154.6 32.4 146.4 25.9 135.7C19.3 125.1 10.5 112.3 9.6 100.0C8.8 87.7 15.2 73.7 20.9 61.9C26.6 50.1 33.8 37.5 43.7 29.4C53.6 21.4 67.9 15.6 80.3 13.8C92.8 12.1 105.5 16.8 118.5 19.0C131.5 21.2 147.9 19.8 158.4 26.8C168.9 33.8 176.7 48.6 181.3 60.8C186.0 73.0 186.6 87.2 186.1 100.0Z"
        fill="url(#cera-lustre)"
      />
    </svg>
  );
}
