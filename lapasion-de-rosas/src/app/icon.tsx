import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Se genera en tiempo de compilación (necesario para la exportación estática).
export const dynamic = "force-static";

/** Ícono de pestaña: la "R" de Rosas en oro sobre negro carbón. */
export default function Icono() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#10100F",
          color: "#C4A477",
          fontSize: 22,
          fontFamily: "serif",
        }}
      >
        R
      </div>
    ),
    size,
  );
}
