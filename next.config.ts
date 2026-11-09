import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cevetoazfcbjmodmjzyh.supabase.co",
        pathname: "/storage/v1/object/public/phones/**",
      },
    ],
  },
  async redirects() {
    return [
      // Common crawler guesses / legacy paths → real catalog entry points
      { source: "/phones", destination: "/trending", permanent: true },
      { source: "/products", destination: "/trending", permanent: true },
      { source: "/search", destination: "/", permanent: true },
      { source: "/about", destination: "/contact", permanent: true },
      { source: "/privacy", destination: "/contact", permanent: true },
      { source: "/terms", destination: "/contact", permanent: true },
    ];
  },
};

export default nextConfig;
