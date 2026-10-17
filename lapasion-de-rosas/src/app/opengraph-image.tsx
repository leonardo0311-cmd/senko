import { ImageResponse } from "next/og";
import { marca, seo } from "@content/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
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
          backgroundColor: "#10100F",
          backgroundImage:
            "radial-gradient(70% 90% at 20% 108%, rgba(213,121,57,0.34) 0%, transparent 62%), radial-gradient(60% 70% at 85% 0%, rgba(80,29,44,0.6) 0%, transparent 70%)",
          color: "#F0E9DF",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            fontSize: 40,
            letterSpacing: 14,
            textTransform: "uppercase",
            color: "#C4A477",
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
            color: "#C4A477",
            marginTop: 18,
          }}
        >
          de Rosas
        </div>

        <div
          style={{
            width: 280,
            height: 1,
            backgroundColor: "rgba(196,164,119,0.5)",
            margin: "46px 0",
          }}
        />

        <div style={{ fontSize: 34, fontStyle: "italic", color: "rgba(240,233,223,0.82)" }}>
          {seo.tituloCorto === marca.nombre
            ? "Hay encuentros que merecen un lugar extraordinario."
            : seo.tituloCorto}
        </div>
      </div>
    ),
    size,
  );
}
