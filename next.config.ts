import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // 20 MB PDFs plus multipart overhead. Default proxy limit is 10 MB.
    proxyClientMaxBodySize: "21mb",
    serverActions: {
      bodySizeLimit: "21mb",
    },
  },
};

export default nextConfig;
