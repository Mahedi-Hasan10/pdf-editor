import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["react-pdf", "pdfjs-dist"],
  turbopack: {},
  webpack: (config, { dev }) => {
    // Required for react-pdf to work with Next.js
    config.resolve.alias.canvas = false;

    // Fix pdfjs-dist ESM issue with Webpack eval devtool
    if (dev) {
      config.devtool = "source-map";
    }

    return config;
  },
};

export default nextConfig;
