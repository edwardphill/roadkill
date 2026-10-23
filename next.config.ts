import type { NextConfig } from "next";

// Hosted on Vercel. Data and Google sign-in go from the browser to Supabase
// (see src/lib/store.ts), so there is no server-side database code.
const nextConfig: NextConfig = {
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
