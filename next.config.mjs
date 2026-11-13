const pbUrl = process.env.NEXT_PUBLIC_PB_URL || "http://localhost:8090";

const csp = [
  "default-src 'self'",
  `img-src 'self' data: blob: ${pbUrl}`,
  `media-src 'self' blob: ${pbUrl}`,
  "font-src 'self' https://fonts.gstatic.com data:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "frame-src https://www.youtube-nocookie.com",
  `connect-src 'self' ${pbUrl}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Testseiten (*.e2e.tsx) nur im Browser-Test von CI, nie im normalen Build.
  ...(process.env.E2E === "1" ? { pageExtensions: ["e2e.tsx", "tsx", "ts", "jsx", "js"] } : {}),
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
