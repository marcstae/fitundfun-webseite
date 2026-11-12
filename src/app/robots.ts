import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Zur Laufzeit auswerten: SITE_URL steht beim Docker-Build nicht zur Verfügung.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/login"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
