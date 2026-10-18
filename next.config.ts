import type { NextConfig } from "next";

// GitHub Pages serves static files only, so the whole app is a static export and
// all data goes from the browser to Supabase (see src/lib/store.ts).
// On Pages the site lives under /<repo>, set by the deploy workflow.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  // /regs/ -> regs/index.html, which GitHub Pages serves without rewrites.
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
