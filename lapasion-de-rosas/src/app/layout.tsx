import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter_Tight } from "next/font/google";
import { marca, seo, siteUrl } from "@content/site";
import { tituloDocumento } from "@content/i18n";
import { ProveedorIdioma } from "@/lib/idioma";
import { DatosEstructurados } from "@/components/DatosEstructurados";
import "./globals.css";

// Instrument Serif solo existe en regular y cursiva: de ahí el trazo fino.
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--fuente-serif",
});

const sans = Inter_Tight({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
  variable: "--fuente-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: tituloDocumento.es,
    template: `%s · ${marca.nombre}`,
  },
  description: seo.descripcion,
  keywords: [...seo.palabras],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_AR",
    alternateLocale: ["en_US"],
    url: siteUrl,
    siteName: marca.nombre,
    title: tituloDocumento.es,
    description: seo.descripcion,
  },
  twitter: {
    card: "summary_large_image",
    title: tituloDocumento.es,
    description: seo.descripcion,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0d0a08",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <ProveedorIdioma>{children}</ProveedorIdioma>
        <DatosEstructurados />
      </body>
    </html>
  );
}
