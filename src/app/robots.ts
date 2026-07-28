import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://www.oneqrcode.site";

/**
 * Generated at /robots.txt. Public marketing + legal pages are crawlable;
 * the app, auth, API, and the QR redirect hot path are not (private, or just
 * 302s to arbitrary user destinations — no crawl value).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/app", "/api", "/auth", "/login", "/signup", "/r/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
