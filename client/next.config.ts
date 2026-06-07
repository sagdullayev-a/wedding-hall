import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "http://0.0.0.0:81",
    "http://localhost:81",
    "http://21.0.5.144:3000",
    "http://21.0.5.144:81",
  ],
};

export default nextConfig;
