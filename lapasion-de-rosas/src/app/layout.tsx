import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { marca, seo, siteUrl } from "@content/site";
import { DatosEstructurados } from "@/components/DatosEstructurados";
import "./globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--fuente-serif",
});

const sans = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--fuente-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: seo.titulo,
    template: `%s — ${marca.nombre}`,
  },
  description: seo.descripcion,
  keywords: [...seo.palabras],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: seo.locale,
    url: siteUrl,
    siteName: marca.nombre,
    title: seo.titulo,
    description: seo.descripcion,
  },
  twitter: {
    card: "summary_large_image",
    title: seo.titulo,
    description: seo.descripcion,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#10100F",
  colorScheme: "dark",
};

/**
 * Marca el documento antes de la primera pintura para que el revelado por
 * scroll no provoque un parpadeo. Si JavaScript no corre, la clase nunca se
 * agrega y todo el contenido queda visible: la página funciona igual.
 */
const scriptAnimaciones = `
try {
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('js-animaciones');
  }
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${serif.variable} ${sans.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptAnimaciones }} />
      </head>
      <body>
        <a href="#contenido" className="salto-contenido">
          Saltar al contenido
        </a>
        {children}
        <DatosEstructurados />
      </body>
    </html>
  );
}
