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
};

export default nextConfig;
