import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
const apiHost = new URL(apiUrl);

const isLocalApi = ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(apiHost.hostname);

const nextConfig: NextConfig = {
  images: {
    // Next.js 16 memblokir optimasi gambar dari IP lokal secara bawaan
    // (perlindungan SSRF). Di produksi API berada di host publik sehingga
    // tidak terpengaruh, tapi saat pengembangan backend berjalan di
    // localhost — tanpa ini, cover artikel (F-08), thumbnail video (F-09),
    // dan foto profil tim (F-16) tampil sebagai gambar rusak di lokal.
    dangerouslyAllowLocalIP: isLocalApi && process.env.NODE_ENV !== "production",

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
