import type { NextConfig } from "next";
import { BMIC_URL } from "./src/lib/enlaces";

const nextConfig: NextConfig = {
  // BMIC vive en su propio sitio; /bmic queda como atajo para enlaces viejos.
  async redirects() {
    return [{ source: "/bmic", destination: BMIC_URL, permanent: false }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
