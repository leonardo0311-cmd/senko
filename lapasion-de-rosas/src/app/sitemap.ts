import type { MetadataRoute } from "next";
import { siteUrl } from "@content/site";

// Se genera en tiempo de compilación (necesario para la exportación estática).
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
