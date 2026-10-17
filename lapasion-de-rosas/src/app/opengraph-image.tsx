import { ImageResponse } from "next/og";
import { marca } from "@content/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Se genera en tiempo de compilación (necesario para la exportación estática).
export const dynamic = "force-static";
export const alt = `${marca.nombre} — ${marca.ciudad}, ${marca.provincia}`;

/**
 * Vista previa al compartir el enlace (WhatsApp, Instagram, redes).
 *
 * Se genera con la identidad tipográfica de la marca. Cuando exista el
 * logotipo oficial y una fotografía aprobada, conviene reemplazarla por una
 * imagen estática en /public para tener control total del encuadre.
 */
export default function Imagen() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0d0a08",
          backgroundImage:
            "radial-gradient(80% 100% at 18% 110%, rgba(255,131,71,0.42) 0%, transparent 64%), radial-gradient(60% 70% at 85% 0%, rgba(200,72,31,0.4) 0%, transparent 70%)",
          color: "#f4ecdc",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            fontSize: 40,
            letterSpacing: 14,
            textTransform: "uppercase",
            color: "#ff8347",
            marginBottom: 34,
          }}
        >
          Ezeiza
        </div>

        <div style={{ fontSize: 104, lineHeight: 1, letterSpacing: -2 }}>La Pasión</div>
        <div
          style={{
            fontSize: 44,
            letterSpacing: 22,
            textTransform: "uppercase",
            color: "#ff8347",
            marginTop: 18,
          }}
        >
          de Rosas
        </div>

        <div
          style={{
            width: 280,
            height: 1,
            backgroundColor: "rgba(255,131,71,0.55)",
            margin: "46px 0",
          }}
        />

        <div style={{ fontSize: 34, fontStyle: "italic", color: "rgba(238,228,207,0.85)" }}>
          Costillar a las brasas · Con reserva previa
        </div>
      </div>
    ),
    size,
  );
}
