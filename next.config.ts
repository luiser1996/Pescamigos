import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Hasta seis fotos de 12 MB más el pequeño sobrecoste multipart. Cada archivo
  // se valida por separado antes de procesarlo y guardarlo.
  experimental: { serverActions: { bodySizeLimit: "80mb" } },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), geolocation=(self)",
          },
        ],
      },
    ];
  },
};
export default nextConfig;
