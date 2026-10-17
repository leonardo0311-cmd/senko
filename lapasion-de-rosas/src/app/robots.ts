import type { MetadataRoute } from "next";
import { siteUrl } from "@content/site";

// Se genera en tiempo de compilación (necesario para la exportación estática).
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
