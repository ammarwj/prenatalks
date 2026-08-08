import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
const apiHost = new URL(apiUrl);

const nextConfig: NextConfig = {
  images: {
    // Cover artikel disajikan backend lewat disk `public` (PRD §9 F-08) —
    // izinkan host API yang sama supaya next/image bisa mengoptimalkannya.
    remotePatterns: [
      {
        protocol: apiHost.protocol.replace(":", "") as "http" | "https",
        hostname: apiHost.hostname,
        port: apiHost.port || undefined,
        pathname: "/storage/**",
      },
    ],
  },
};

export default nextConfig;
