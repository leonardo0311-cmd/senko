import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Senko · Panel de turnos",
  description:
    "Panel de control de turnos, cobros y señas del bot de WhatsApp de Senko Intelligence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Aplica el tema guardado antes del primer pintado, para que no parpadee. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("senko-tema");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
