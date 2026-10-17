import type { NextConfig } from "next";

/**
 * `STATIC_EXPORT=1 npm run build` genera un sitio estático en /out, listo para
 * cualquier hosting sin Node (o para compartir una vista previa). El modo por
 * defecto sigue siendo el servidor de Next, que permite optimizar imágenes y
 * enviar cabeceras de seguridad.
 */
const esExportacion = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  ...(esExportacion
    ? {
        output: "export" as const,
        // La exportación estática no pasa por el optimizador de imágenes.
        images: { unoptimized: true },
        // Rutas relativas: así el sitio funciona también en un subdirectorio.
        assetPrefix: process.env.ASSET_PREFIX ?? ".",
      }
    : {
        images: {
          formats: ["image/avif", "image/webp"] as ("image/avif" | "image/webp")[],
          // Al subir fotos alojadas fuera del proyecto, agregar aquí su dominio.
          remotePatterns: [],
        },
        // Las cabeceras las sirve el servidor de Next; en exportación estática
        // hay que configurarlas en el hosting.
        async headers() {
          return [
            {
              source: "/:path*",
              headers: [
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                { key: "X-Frame-Options", value: "SAMEORIGIN" },
                {
                  key: "Permissions-Policy",
                  value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
                },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
