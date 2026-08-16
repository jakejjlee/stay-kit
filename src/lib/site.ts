/**
 * Single source of truth for the site origin.
 *
 * The previous fallback was a hardcoded alias (a stale project alias) that
 * now returns 404, so every canonical, every og:image and the sitemap pointed at
 * a host that does not exist. Vercel injects the real deployment host, so we use
 * that before falling back, and the fallback is only ever reached in local dev.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

/** Stay out of the index until the real domain is live. */
export const ALLOW_INDEX = process.env.NEXT_PUBLIC_ALLOW_INDEX === "true";
